  // ===== Kystmegleren: the used boats in the Net app and at the yard's quay (M4, docs/planer/butikker-og-sponsorer.md 3.3, 10.2, 10.2b) =====
  // One list (core/09k-market.js), two windows: the broker's page in the Net app, read anywhere, and «Båter til salgs her» in the yard's
  // Båthandel. A listing has its number, the name she has, the key facts strip, the seller's card with a few lines in his own voice,
  // Tilstand, Følger med and the spec sheet. A bid can be made from anywhere, once a day; the takst and the purchase only where she lies.
  // (No real broker's name: «Kystmegleren» until there is a written agreement, CLAUDE.md.)
  let mgSel = null; const mgMsg = {};
  const MG_KIND = {skipper:['Skipper', 'Skipper'], dodsbo:['Dødsbo', 'Estate'], rederi:['Rederi', 'Fishing company'], megler:['Kystmegleren for eieren', 'Kystmegleren for the owner']};
  // the seller's lines, written in the northern speech and turned into the speech where she lies (dialectText), [no, en]
  function mgSays(Q){
    const V = VESSELS[Q.type], k = Q.seller.kind, n = Q.txt, eng = Q.cond.motor > 0.8, hull = Q.cond.hull > 0.8;
    const T = {skipper:[['Æ har fått mæ større båt, så ho her må vekk. ' + (eng ? 'Motoren går som ei klokke.' : 'Motoren har gått en del, men ho starte kvar gang.'), 'I have got a bigger boat, so this one has to go. ' + (eng ? 'The engine runs like a clock.' : 'The engine has done its hours, but she starts every time.')],
      ['Ho har vært god mot mæ i mange år. ' + (hull ? 'Skroget e i fin stand.' : 'Skroget treng litt stell.') + ' Ring om du lure på nåkka.', 'She has been good to me for many years. ' + (hull ? 'The hull is in fine shape.' : 'The hull needs some care.') + ' Call if you wonder about anything.'],
      ['Æ ska gå i land, så ho selges med det som står om bord.', 'I am going ashore, so she is sold with what is aboard.']],
      dodsbo:[['Båten etter far vår. Han stelte godt med ho, men ho har stått stille det siste året.', 'Our father\'s boat. He looked after her well, but she has stood still this last year.'],
        ['Vi bor ikkje her lenger og har ingen bruk for ho. Selges som den e.', 'We do not live here any more and have no use for her. Sold as she is.'],
        ['Ho har ligget ved verftet sia i vinter. Vi vet ikkje så mykkje om motoren.', 'She has lain at the yard since the winter. We do not know much about the engine.']],
      rederi:[['Vi rydde i flåten og selge ho. Vedlikeholdt etter boka.', 'We are tidying the fleet and selling her. Maintained by the book.'],
        ['Ho har fiska for oss i mange sesonga. Papira e i orden.', 'She has fished for us for many seasons. The papers are in order.'],
        ['Selges fordi vi har bygd nytt. Kan ses ved verftet.', 'Sold because we have built new. Can be seen at the yard.']],
      megler:[['Eieren bor sørpå og har bedt oss selge. Visning ved verftet etter avtale.', 'The owner lives in the south and has asked us to sell her. Viewing at the yard by arrangement.'],
        ['En ' + V.name.no.toLowerCase() + ' i ' + (hull ? 'god' : 'brukbar') + ' stand. Takst anbefales.', 'A ' + V.name.en.toLowerCase() + ' in ' + (hull ? 'good' : 'fair') + ' condition. A survey is recommended.'],
        ['Mye båt for pengan. Selges med utstyret som står i lista.', 'A lot of boat for the money. Sold with the equipment in the list.']]}[k][n];
    const pt = portById(Q.port); return L(dialectText(dialectAt(pt.p), T[0]), T[1]);
  }
  const mgNm = Q => dist(S.boat.pos, portById(Q.port).p) / NM;
  const mgStrip = Q => Q.year + ' · ' + fmt(VESSELS[Q.type].len, 2) + ' m · ' + fmt(Q.engH, 0) + L(' timer', ' hours') + ' · ' + kr(mktPrice(Q));
  const mgPct = v => Math.round(v * 100) + ' %';
  const mgBar = v => '<div class="ph-bar"><i class="' + (v < 0.6 ? 'bad' : v < 0.75 ? 'warn' : '') + '" style="width:' + Math.round(v * 100) + '%"></i></div>';
  const mgEx = Q => Object.entries(Q.ex).map(([q, n]) => EQUIP[q].name[S.lang] + (n !== true ? ' × ' + n : ''));
  function mgCard(Q){
    const V = VESSELS[Q.type], d = mktDays(Q), cut = mktCut(Q);
    return '<button class="ph-card vcard mg-card" data-pa="mgsel" data-id="' + Q.id + '"><span class="vpic">' + vesselSVG(Q.type) + '</span><span class="vtx"><b>«' + Q.name + '» <small class="mg-nr">' + Q.id + '</small></b><small>' + V.name[S.lang] + ' · ' + Q.year + ' · ' + fmt(Q.engH, 0) + L(' motortimer', ' engine hours') + '</small>' +
      '<span class="vpr">' + kr(mktPrice(Q)) + (cut ? ' <i class="mg-cut">' + L('satt ned', 'reduced') + '</i>' : '') + '</span>' + mgGoal(Q) + '<small>' + L('Ligger i ', 'Lies at ') + portById(Q.port).name + ' · ' + fmt(mgNm(Q), 0) + ' nm · ' + (d ? L('lagt ut for ' + d + ' dager siden', 'listed ' + d + ' days ago') : L('lagt ut i dag', 'listed today')) + '</small></span></button>';
  }
  const mgFits = Q => deal(mktPrice(Q), tradeIn()).ok;
  // «Neste mål» on the card: how far the equity is from what the bank wants for her (with the boat you have traded in)
  function mgGoal(Q){ const x = deal(mktPrice(Q), tradeIn()); if (x.ok) return '<small class="mg-goal ok">' + L('Innen rekkevidde nå', 'Within reach now') + '</small>';
    if (x.why === 'notes') return '<small class="mg-goal">' + L('Banken vil se tre sluttsedler først', 'The bank wants three landing notes first') + '</small>';
    const pc = Math.min(0.99, eqCash() / Math.max(1, x.eqNeed)); return '<small class="mg-goal">' + L('Egenkapital: ' + Math.round(pc * 100) + ' % av det banken krever', 'Equity: ' + Math.round(pc * 100) + ' % of what the bank wants') + '</small><span class="qbar"><i style="width:' + (pc * 100).toFixed(0) + '%"></i></span>'; }
  // your own boats: listed with the broker, or the button to list one, and delivery to where you are or home (Rederi app and the broker's page)
  function mgOwnRow(v){
    const o = mktOwn(v.id), b = vget(v, 'boat'), nm = vget(v, 'boatName'), D = (mktState().del || []).find(d => d.vid === v.id), H = S.t / 60, h = [];
    if (D) return '<p class="ph-note">' + L('Seiles til ' + portById(D.to).name + ', framme om ' + Math.max(1, Math.round(D.H1 - H)) + ' timer.', 'Being sailed to ' + portById(D.to).name + ', there in ' + Math.max(1, Math.round(D.H1 - H)) + ' hours.') + '</p>';
    if (o) h.push('<p class="ph-note">' + L('Til salgs hos Kystmegleren for ' + kr(o.kr) + '. Selges innen ' + Math.max(1, Math.ceil((o.H1 - H) / 24)) + ' dager; megleren tar 5 %. Hun må ligge i havn til da.', 'For sale at Kystmegleren for ' + kr(o.kr) + '. Sold within ' + Math.max(1, Math.ceil((o.H1 - H) / 24)) + ' days; the broker takes 5 %. She must lie in port until then.') + '</p><button class="ph-btn alt" data-pa="mgunown" data-id="' + v.id + '">' + L('Trekk fra salg', 'Withdraw') + '</button>');
    else if (!mktOwnWhy(v)) h.push('<button class="ph-btn" data-pa="mgown" data-id="' + v.id + '">' + L('Legg ut hos Kystmegleren · ca. ', 'List at Kystmegleren · about ') + kr(mktOwnValue(v)) + '</button>');
    if (v.id !== S.me && b.status === 'port'){ const meB = vget(vesselById(S.me), 'boat'), home = S.home || HOME0, to = [];
      if (meB && meB.status === 'port' && meB.port && meB.port !== b.port) to.push(meB.port); if (home && home !== b.port && !to.includes(home)) to.push(home);
      for (const p of to){ const q = portById(p); if (!q) continue; const c = mktDelKr(dist(b.pos, q.p) / NM); h.push('<button class="ph-btn alt" data-pa="mgdel" data-id="' + v.id + '" data-to="' + p + '"' + (c > spendable() || o ? ' disabled' : '') + '>' + L('Få henne levert til ' + q.name + ' · ', 'Have her delivered to ' + q.name + ' · ') + kr(c) + '</button>'); } }
    return h.length ? '<div class="ph-btncol mg-own">' + h.join('') + '</div>' : '';
  }
  function megler(){
    if (mgSel){ const Lx = mktById(mgSel); if (Lx) return mgSheet(Lx); mgSel = null; }
    const tab = sub.mgtab || 'alle', so = sub.mgsort || 'near', h = ['<div class="ph-c"><button class="ph-btn alt mkback" data-pa="sub" data-s="home">‹ ' + L('Nettet', 'The Net') + '</button><div class="net-bar">kystmegleren.detstorebla.no</div>'];
    h.push('<div class="ph-sub mk">' + [['alle', 'Alle', 'All'], ['open', 'Åpen gruppe', 'Open group'], ['kyst', 'Kystflåten', 'Coastal fleet']].map(([k, no, en]) => '<button class="' + (tab === k ? 'on' : '') + '" data-pa="mgtab" data-s="' + k + '">' + L(no, en) + '</button>').join('') + '</div>');
    h.push('<div class="net-shops">' + [['near', 'Nærmest', 'Nearest'], ['cheap', 'Billigst', 'Cheapest'], ['new', 'Nyest', 'Newest'], ['fit', 'Passer meg', 'Suits me']].map(([k, no, en]) => '<button class="chip-b' + (so === k ? ' on' : '') + '" data-pa="mgsort" data-s="' + k + '">' + L(no, en) + '</button>').join('') + '</div>');
    let A = mktListings().filter(x => tab === 'alle' || VESSELS[x.type].cls === tab);
    if (so === 'fit') A = A.filter(mgFits);
    A.sort(so === 'cheap' ? (a, b) => mktPrice(a) - mktPrice(b) : so === 'new' ? (a, b) => b.H0 - a.H0 : (a, b) => mgNm(a) - mgNm(b));
    h.push('<p class="ph-note">' + L(A.length + ' båter til salgs langs kysten. Bud kan gis herfra; takst og kjøp der båten ligger.', A.length + ' boats for sale along the coast. Bids can be made from here; survey and purchase where the boat lies.') + '</p>');
    h.push(mgWishCard());
    const mine = S.fleet.filter(v => v.id !== S.me);
    if (mine.length) h.push('<div class="ph-card"><h4>' + L('Dine båter', 'Your boats') + '</h4>' + mine.map(v => '<p><b>«' + vget(v, 'boatName') + '»</b> · ' + VESSELS[vget(v, 'boat').type].name[S.lang] + '</p>' + mgOwnRow(v)).join('') + '</div>');
    h.push(A.length ? A.map(mgCard).join('') : '<p class="ph-note">' + L('Ingen båter passer akkurat nå.', 'No boats suit just now.') + '</p>');
    const sold = mktSold().slice(0, 8);
    if (sold.length) h.push('<div class="ph-card"><h4>' + L('Solgt siste måned', 'Sold in the last month') + '</h4>' + sold.map(x => kv(VESSELS[x.type].name[S.lang] + ' ' + x.year + ' · ' + portById(x.port).name, kr(mktAsk(x, x.H1 - 1)))).join('') + '</div>');
    return h.join('') + '</div>';
  }
  function mgWishCard(){
    const W = mktState().wish, hits = mktWishHits();
    if (!W) return '<details class="ph-card mg-wish"><summary>' + L('Ønsket båt', 'Wanted boat') + '</summary><p class="ph-note">' + L('Si hva du ser etter, så viser Kystmegleren de som kommer.', 'Say what you are looking for, and Kystmegleren shows the ones that come.') + '</p>' +
      '<label class="ph-kv"><span>' + L('Gruppe', 'Group') + '</span><select id="mgWishC"><option value="open">' + L('Åpen gruppe', 'Open group') + '</option><option value="kyst">' + L('Kystflåten', 'Coastal fleet') + '</option></select></label>' +
      '<label class="ph-kv"><span>' + L('Høyst', 'At most') + '</span><input id="mgWishMax" type="number" inputmode="numeric" min="0" step="10000" value="' + Math.max(100000, Math.round(eqCash() * 5 / 10000) * 10000) + '"></label><button class="ph-btn" data-pa="mgwish">' + L('Lagre', 'Save') + '</button></details>';
    return '<div class="ph-card mg-wish"><h4>' + L('Ønsket båt', 'Wanted boat') + '</h4><p>' + (W.cls === 'kyst' ? L('Kystflåten', 'Coastal fleet') : L('Åpen gruppe', 'Open group')) + ' · ' + L('høyst ', 'at most ') + kr(W.max) + '</p><p class="ph-note">' +
      (hits.length ? L(hits.length + ' til salgs nå. Nyeste: «' + hits[0].name + '» i ' + portById(hits[0].port).name + '.', hits.length + ' for sale now. Newest: «' + hits[0].name + '» at ' + portById(hits[0].port).name + '.') : L('Ingen akkurat nå.', 'None just now.')) + '</p>' +
      (hits.length ? '<button class="ph-btn" data-pa="mgsel" data-id="' + hits[0].id + '">' + L('Se den nyeste', 'See the newest') + '</button> ' : '') + '<button class="ph-btn alt" data-pa="mgwish0">' + L('Fjern', 'Remove') + '</button></div>';
  }
  function mgSheet(Q){
    const V = VESSELS[Q.type], M = mktState(), pt = portById(Q.port), here = S.boat.port === Q.port && S.boat.status === 'port' && atKind('verft'), price = mktPrice(Q), ask = mktAsk(Q), D = M.deals[Q.id], tk = !!M.takst[Q.id], bn = '«' + S.boatName + '»';
    const sec = (t, rows) => '<div class="vsec"><h5>' + t + '</h5>' + rows.filter(Boolean).join('') + '</div>', h = [];
    h.push('<div class="ph-c"><button class="ph-btn alt mkback" data-pa="mgsel">‹ ' + L('Tilbake til listen', 'Back to the list') + '</button>');
    h.push('<div class="ph-card vsheet mg-sheet"><h4>«' + Q.name + '» · ' + V.name[S.lang] + '</h4><p class="ph-note mg-nr">' + Q.id + '</p><div class="vbig">' + vesselSVG(Q.type) + '</div>');
    h.push('<p class="mg-strip">' + mgStrip(Q) + '</p><p class="ph-note">' + (mktDays(Q) ? L('Lagt ut for ' + mktDays(Q) + ' dager siden', 'Listed ' + mktDays(Q) + ' days ago') : L('Lagt ut i dag', 'Listed today')) + ' · ' + L('sett av ' + mktSeen(Q) + ' skippere', 'seen by ' + mktSeen(Q) + ' skippers') + (mktCut(Q) ? ' · <b>' + L('Prisen satt ned', 'Price reduced') + '</b>' : '') + '</p>');
    h.push(sec(L('Pris', 'Price'), [kv(L('Prisantydning', 'Asking price'), kr(ask)), D && D.kr < ask ? kv(L('Ditt bud er godtatt', 'Your bid is accepted'), kr(D.kr) + L(' i ei uke', ' for a week')) : '', kv(L('Markedsverdi', 'Market value'), L('ca. ', 'about ') + kr(Q.fair))]));
    // the seller
    h.push('<div class="ph-card mg-seller"><h4>' + Q.seller.name + ' <small>' + L(MG_KIND[Q.seller.kind][0], MG_KIND[Q.seller.kind][1]) + ', ' + Q.seller.home + '</small></h4><p>«' + mgSays(Q) + '»</p><p class="ph-note">' + L('Alle opplysninger er gitt så korrekt som mulig, men uten ansvar for feil og mangler.', 'All details are given as correctly as possible, but without liability for errors and omissions.') + '</p></div>');
    // the state, and what the takst found
    h.push(sec(L('Tilstand', 'Condition'), [kv(L('Skrog', 'Hull'), mgPct(Q.cond.hull)), mgBar(Q.cond.hull), kv(L('Motor', 'Engine'), tk ? mgPct(Q.motorT) + (Q.flaw ? ' · <b class="r2">' + L('dårligere enn oppgitt', 'worse than stated') + '</b>' : ' · ' + L('som oppgitt', 'as stated')) : mgPct(Q.cond.motor) + L(' (oppgitt)', ' (stated)')), mgBar(tk ? Q.motorT : Q.cond.motor),
      kv(L('Elektronikk', 'Electronics'), mgPct(Q.cond.elek)), mgBar(Q.cond.elek), kv(L('Motortimer', 'Engine hours'), fmt(Q.engH, 0)), kv(L('Takst', 'Survey'), tk ? L('tatt', 'done') : L('ikke tatt', 'not done'))]));
    const std = (V.std || []).map(q => EQUIP[q].name[S.lang]), ex = mgEx(Q);
    h.push(sec(L('Følger med', 'Comes with'), [kv(L('Utstyr', 'Equipment'), std.concat(ex).join(', ') || L('ingenting utover båten', 'nothing besides the boat'))]));
    h.push(sec(L('Ligger', 'Lies'), [kv(L('Ved verftet i', 'At the yard in'), pt.name), kv(L('Avstand', 'Distance'), fmt(mgNm(Q), 1) + ' nm')]) + (here ? '' : '<button class="ph-btn" data-pa="goplace" data-id="' + pt.id + '">' + L('Autonav dit', 'Autonav there') + '</button>'));
    // a bid, from anywhere, once a day
    const B = M.bids[Q.id], today = B && B.day === Math.floor(S.t / 1440);
    h.push('<div class="ph-card"><h4>' + L('Gi bud', 'Make a bid') + '</h4><p class="ph-note">' + L('Ett bud om dagen, fra 90 % av prisantydningen (' + kr(Math.ceil(ask * MKT.bidFloor)) + '). Et godtatt bud gjelder i ei uke.', 'One bid a day, from 90 % of the asking price (' + kr(Math.ceil(ask * MKT.bidFloor)) + '). An accepted bid holds for a week.') + '</p>' +
      (mgMsg[Q.id] ? '<p><b>' + mgMsg[Q.id] + '</b></p>' : '') +
      (today ? '' : '<label class="ph-kv"><span>' + L('Bud', 'Bid') + '</span><input id="mgBid" type="number" inputmode="numeric" step="1000" value="' + Math.ceil(ask * 0.92 / 1000) * 1000 + '"></label><button class="ph-btn" data-pa="mgbid" data-id="' + Q.id + '">' + L('Send budet', 'Send the bid') + '</button>') + '</div>');
    // at the yard where she lies: the takst and the purchase
    if (!here) h.push('<p class="ph-note">' + L('Takst og kjøp skjer ved verftet i ' + pt.name + ', der hun ligger.', 'Survey and purchase happen at the yard in ' + pt.name + ', where she lies.') + '</p>');
    else {
      if (!tk){ const c = M.freeTakst ? 0 : mktTakstKr(Q); h.push('<div class="ph-card"><h4>' + L('Takst', 'Survey') + '</h4><p class="ph-note">' + L('En takstmann går over båten og finner det kortet ikke sier.', 'A surveyor goes over the boat and finds what the card does not say.') + '</p><button class="ph-btn" data-pa="mgtakst" data-id="' + Q.id + '"' + (c > spendable() ? ' disabled' : '') + '>' + L('Bestill takst · ', 'Order a survey · ') + (c ? kr(c) : L('gratis første gang', 'free the first time')) + '</button></div>'); }
      const openOnly = V.len < 11 && !hasLic(), A = deal(price, tradeIn()), Bf = deal(price, 0);
      h.push(payNote(A, 'Mellomlegg med ' + bn + ' i bytte: ', 'To pay with ' + bn + ' traded in: ') + '<button class="ph-btn p" data-pa="mgbuy" data-ti="1" data-id="' + Q.id + '"' + (A.ok && !S.order && !tiLocked(curVessel()) ? '' : ' disabled') + '>' + L('Kjøp og bytt inn ' + bn, 'Buy, trading in ' + bn) + '</button>');
      if (!openOnly) h.push(payNote(Bf, 'Til flåten, uten innbytte: ', 'For the fleet, no trade-in: ') + '<button class="ph-btn" data-pa="mgbuy" data-ti="0" data-id="' + Q.id + '"' + (Bf.ok && !S.order ? '' : ' disabled') + '>' + L('Kjøp til flåten', 'Buy for the fleet') + '</button>');
    }
    if (vesselSpec(Q.type)) h.push('<button class="ph-btn alt" data-pa="mk3d" data-k="' + Q.type + '">' + L('Se båten i 3D', 'See her in 3D') + '</button>');
    // the type's spec sheet under (without its price row: hers is above)
    const secs = specSecs(Q.type); h.push('<details class="mg-spec"><summary>' + L('Hele databladet', 'The whole spec sheet') + '</summary>' + secs.map(([t, rows]) => sec(t, t === secs[0][0] ? rows.slice(1) : rows)).join('') + '</details>');
    return h.join('') + '</div></div>';
  }
  // the yard's Båthandel: the boats that lie at this quay
  function mgHere(){
    if (!atKind('verft')) return '';
    const A = mktListings().filter(x => x.port === S.boat.port);
    return '<div class="ph-card mg-here"><h4>' + L('Båter til salgs her', 'Boats for sale here') + '</h4>' + (A.length ? A.map(mgCard).join('') : '<p class="ph-note">' + L('Ingen brukte båter ved denne kaia nå.', 'No used boats at this quay now.') + '</p>') +
      '<button class="ph-btn alt" data-pa="open" data-a="nett" data-s="megler">' + L('Alle brukte båter hos Kystmegleren ›', 'All used boats at Kystmegleren ›') + '</button></div>';
  }
  // the buttons (phone/14-act.js asks this first for the mg* actions)
  function mgAct(a, d){
    const M = mktState();
    if (a === 'mgsel'){ mgSel = d.id || null; if (mgSel && typeof cloudEv === 'function') cloudEv('mkt_view', {id:mgSel}); return true; }
    if (a === 'mgtab'){ sub.mgtab = d.s; return true; }
    if (a === 'mgsort'){ sub.mgsort = d.s; return true; }
    if (a === 'mgwish'){ const c = (document.getElementById('mgWishC') || {}).value || 'open', mx = +(document.getElementById('mgWishMax') || {}).value || 0; M.wish = {cls:c, max:Math.max(0, Math.round(mx))}; if (typeof cloudEv === 'function') cloudEv('mkt_wish', {cls:c}); return true; }
    if (a === 'mgwish0'){ M.wish = null; return true; }
    if (a === 'mgown'){ const v = vesselById(d.id); if (!v) return true; const why = mktListOwn(v.id); if (why){ toast(why === 'sea' ? L('Hun må ligge i havn.', 'She must lie in port.') : why === 'aboard' ? L('Du er om bord i henne.', 'You are aboard her.') : L('Det går ikke nå.', 'Not now.')); return true; }
      log('«' + vget(v, 'boatName') + '» er lagt ut hos Kystmegleren for ' + kr(mktOwn(v.id).kr) + '.', '«' + vget(v, 'boatName') + '» is listed at Kystmegleren for ' + kr(mktOwn(v.id).kr) + '.'); if (typeof cloudEv === 'function') cloudEv('mkt_list', {type:vget(v, 'boat').type}); return true; }
    if (a === 'mgunown'){ mktUnlist(d.id); return true; }
    if (a === 'mgdel'){ const v = vesselById(d.id); if (!v) return true; const why = mktDeliver(v.id, d.to); if (why){ toast(why === 'cash' ? t('no_cash') : why === 'sea' ? L('Hun må ligge i havn.', 'She must lie in port.') : L('Det går ikke nå.', 'Not now.')); return true; }
      log('En skipper fra verftet seiler «' + vget(v, 'boatName') + '» til ' + portById(d.to).name + '.', 'A skipper from the yard sails the «' + vget(v, 'boatName') + '» to ' + portById(d.to).name + '.'); if (typeof cloudEv === 'function') cloudEv('mkt_deliver', {nm:Math.round(dist(vget(v, 'boat').pos, portById(d.to).p) / NM)}); return true; }
    const Lx = d.id ? mktById(d.id) : null; if (!Lx) return false;
    if (a === 'mgbid'){ const kr0 = +(document.getElementById('mgBid') || {}).value || 0, r = mktBid(Lx.id, kr0), sel = '«' + Lx.seller.name + '»';
      mgMsg[Lx.id] = r.err === 'today' ? L('Du har alt gitt bud i dag.', 'You have bid today already.') : r.err === 'low' ? L('Budet må være minst ' + kr(r.min) + '.', 'The bid must be at least ' + kr(r.min) + '.') : r.err === 'full' ? L('Det er prisantydningen: kjøp henne heller ved verftet.', 'That is the asking price: buy her at the yard instead.') : r.err ? L('Båten er ikke til salgs lenger.', 'The boat is no longer for sale.') :
        r.ok ? L(Lx.seller.name + ' tar budet på ' + kr(r.kr) + '. Det gjelder i ei uke.', Lx.seller.name + ' takes the bid of ' + kr(r.kr) + '. It holds for a week.') : L(Lx.seller.name + ' sier nei, men tar ' + kr(r.counter) + '. Prøv igjen i morgen.', Lx.seller.name + ' says no, but would take ' + kr(r.counter) + '. Try again tomorrow.');
      if (!r.err && typeof cloudEv === 'function') cloudEv('mkt_bid', {id:Lx.id, ok:!!r.ok}); return true; }
    const here = S.boat.port === Lx.port && S.boat.status === 'port' && atKind('verft') && mktListings().some(x => x.id === Lx.id);
    if (a === 'mgtakst'){ if (!here || M.takst[Lx.id]) return true; const c = M.freeTakst ? 0 : mktTakstKr(Lx); if (c > spendable()){ toast(t('no_cash')); return true; }
      if (c) book('baat', -c, 'Takst av «' + Lx.name + '»', 'Survey of «' + Lx.name + '»'); M.takst[Lx.id] = true; M.freeTakst = false;
      log('Takstmannen gikk over «' + Lx.name + '»: motoren er ' + (Lx.flaw ? 'dårligere enn oppgitt (' + mgPct(Lx.motorT) + ').' : 'som oppgitt.'), 'The surveyor went over «' + Lx.name + '»: the engine is ' + (Lx.flaw ? 'worse than stated (' + mgPct(Lx.motorT) + ').' : 'as stated.'));
      if (typeof cloudEv === 'function') cloudEv('mkt_takst', {id:Lx.id, flaw:Lx.flaw}); return true; }
    if (a === 'mgbuy'){
      if (!here || S.order) return true; const V2 = VESSELS[Lx.type], price = mktPrice(Lx), ti = d.ti === '0' ? 0 : tradeIn();
      if (!ti && V2.len < 11 && !hasLic()){ toast(L('Et rederi kan bare ha én båt i åpen gruppe.', 'A company can only have one boat in the open group.')); return true; }
      if (ti && tiLocked(curVessel())) return true;
      const x = deal(price, ti); if (!x.ok){ toast(whyText(x) || t('no_cash')); return true; } finance(x, 120); achAdd('boat');
      if (ti){ switchVessel(Lx.type); mktTakeOver(Lx, S.boat, S.equip); applyVessel(); log('«' + S.boatName + '» er nå ' + L(V2.name.no.toLowerCase(), V2.name.en.toLowerCase()) + 'en som het «' + Lx.name + '», bygd ' + Lx.year + '.', '«' + S.boatName + '» is now the ' + V2.name.en.toLowerCase() + ' that was called «' + Lx.name + '», built ' + Lx.year + '.');
        if (S.lic){ log('Kvoten i lukket gruppe fulgte med den gamle båten.', 'The closed-group quota went with the old vessel.'); regFree(S.lic.id); S.lic = null; freshQuota(); openUsedLoad(); } }
      else { const v = newVesselObj(Lx.type, S.boat.port); v.boatName = Lx.name; mktTakeOver(Lx, v.boat, v.equip); log('Kjøpte «' + Lx.name + '» (' + V2.name.no.toLowerCase() + ', ' + Lx.year + ') til flåten. Hun ligger i ' + portById(S.boat.port).name + ', og kan leveres der du vil fra Rederi-appen.', 'Bought «' + Lx.name + '» (' + V2.name.en.toLowerCase() + ', ' + Lx.year + ') for the fleet. She lies at ' + portById(S.boat.port).name + ' and can be delivered from the Company app.'); }
      pressPut('boat', {type:Lx.type, nb:0, price}); if (typeof cloudEv === 'function') cloudEv('mkt_buy', {id:Lx.id, type:Lx.type, price, ti:!!ti, takst:!!M.takst[Lx.id], bid:price < mktAsk(Lx)});
      mgSel = null; return true; }
    return false;
  }
