  // ===== Kystmegleren: boats players sell to each other (B1–B8 in docs/planer/etter-tonys-test.md, Jonas 07.11.2026; EAFC's auction house) =====
  // One list (the server's, ui/10s-broker.js MBC), two windows: the broker's page in the Net app, read anywhere, and «Båter til salgs her»
  // in the yard's Båthandel. Only boats other players put out (no NPC listings since 07.11.2026); empty, the page says the yard sells new
  // at full price (B6). A listing has her number, the key facts, the right marked when it follows her (B8), Tilstand, Følger med, the time
  // left, the highest bid, and the bid and «Kjøp nå» with delivery to the yard near you for 2 % (B3). Your own boats: «Legg ut til salgs»
  // (start price, buy-now, 1 h, 6 h, 1 day or 3 days of real time) and «Selg nå» to the broker for 90 % (B4).
  // (No real broker's name: «Kystmegleren» until there is a written agreement, CLAUDE.md.)
  let mgSel = null, mbPutSel = null; const mgMsg = {};
  const mgPt = Q => portById(Q.port) || {name:'', p:{x:Q.x, y:Q.y}};
  const mgNm = Q => dist(S.boat.pos, mgPt(Q).p) / NM;
  const mgPct = v => Math.round(v * 100) + ' %';
  const mgBar = v => '<div class="ph-bar"><i class="' + (v < 0.6 ? 'bad' : v < 0.75 ? 'warn' : '') + '" style="width:' + Math.round(v * 100) + '%"></i></div>';
  const mgEsc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'})[c]);
  const mgP = Q => Q.vessel || {};
  const mgYear = Q => mgP(Q).built || VESSELS[Q.type].year;
  // the price that stands now: the highest bid, else the start price
  const mgNow = Q => Q.top != null ? Q.top : Q.start;
  // the time left, in words, to the minute (the drawer is drawn again a few times a second; a second hand would wipe what you type)
  function mbLeftTxt(ms){ const m = Math.floor(ms / 60000); if (ms <= 0) return L('avsluttes nå', 'ending now'); if (m < 1) return L('under 1 min', 'under 1 min');
    const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mi = m % 60;
    return d ? d + L(' d ', ' d ') + h + ' t' : h ? h + ' t ' + mi + ' min' : mi + ' min'; }
  const mgLeft = Q => mbLeftTxt(MBC.left(Q.until));
  const mbHrs = h => h === 1 ? L('1 time', '1 hour') : h === 6 ? L('6 timer', '6 hours') : h === 24 ? L('1 døgn', '1 day') : L('3 døgn', '3 days');
  const mgLic = Q => { const l = mgP(Q).lic; return l && l.id ? l : null; };
  // (KM4: every card says which it is, «Hjemmel følger med» or «Uten hjemmel»; the seller chose, V2 A)
  const mgLicTag = Q => mgLic(Q) ? '<small class="mb-lic"><span class="ic-sp-tag">' + L('Hjemmel følger med', 'Right comes with her') + '</span> ' + L('hjemmelslengde ' + mgEsc(mgLic(Q).hl || mgLic(Q).id), 'quota length ' + mgEsc(mgLic(Q).hl || mgLic(Q).id)) + '</small>'
    : '<small class="mb-nolic" style="display:block;margin:2px 0"><span class="ic-sp-tag">' + L('Uten hjemmel', 'No right') + '</span></small>';
  // the yard near you: where she is delivered for 2 % (the yard nearest the boat you are aboard)
  function mgNear(Q){ const me = vesselById(S.me) || curVessel(), y = mbYardNear(vget(me, 'boat').pos); return y && y.id !== Q.port ? y : null; }
  const mgTo = Q => sub.mbto === 'near' && mgNear(Q) ? mgNear(Q).id : null;
  function mgCard(Q){
    const V = VESSELS[Q.type], P = mgP(Q), held = MBC.bids().some(b => String(b.listing) === String(Q.id));
    return '<button class="ph-card vcard mg-card" data-pa="mgsel" data-id="' + Q.id + '"><span class="vpic">' + vesselSVG(Q.type) + '</span><span class="vtx"><b>«' + mgEsc(Q.name) + '» <small class="mg-nr">nr. ' + Q.id + '</small></b><small>' + V.name[S.lang] + ' · ' + mgYear(Q) + ' · ' + fmt(P.engH || 0, 0) + L(' motortimer', ' engine hours') + '</small>' + mgLicTag(Q) +
      '<span class="vpr">' + (Q.top != null ? L('Bud ', 'Bid ') + kr(Q.top) : L('Fra ', 'From ') + kr(Q.start)) + (Q.buynow ? ' <i>' + L('Kjøp nå ', 'Buy now ') + kr(Q.buynow) + '</i>' : '') + '</span>' +
      (Q.mine ? '<small class="mg-goal ok">' + L('Din båt', 'Your boat') + '</small>' : Q.top_me ? '<small class="mg-goal ok">' + L('Du har det høyeste budet', 'You hold the highest bid') + '</small>' : held ? '<small class="mg-goal">' + L('Du er overbydd', 'You are outbid') + '</small>' : '') +
      '<small>' + L('Ligger i ', 'Lies at ') + mgPt(Q).name + ' · ' + fmt(mgNm(Q), 0) + ' nm · ' + L('slutter om ', 'ends in ') + mgLeft(Q) + ' · ' + Q.bids + L(' bud', Q.bids === 1 ? ' bid' : ' bids') + '</small></span></button>';
  }
  const MB_WHY = {listed:['Hun ligger alt til salgs.', 'She is for sale already.'], aboard:['Du er om bord i henne. Gå om bord i en annen båt først.', 'You are aboard her. Go aboard another boat first.'],
    only:['Rederiet må ha en annen båt å være om bord i.', 'The company must have another boat to be aboard.'], type:['Havflåten selges bare på verftet.', 'The ocean fleet is sold at the yard only.'],
    sea:['Hun må ligge i havn.', 'She must lie in port.'], busy:['Hun losser ved mottaket.', 'She is landing at the plant.'], hold:['Lasten må leveres først.', 'The catch must be landed first.'],
    gear:['Ta opp redskapet hennes i sjøen først.', 'Take up her gear in the sea first.'], del:['Hun er under levering.', 'She is being delivered.'], order:['Hun går i innbytte på verftet.', 'She is being traded in at the yard.'],
    ops:['Slå av driftsplanen hennes først.', 'Turn her plan off first.'], many:['Høyst tre båter til salgs om gangen.', 'At most three boats for sale at a time.'], cloud:['Kystmegleren trenger nett og innlogging.', 'Kystmegleren needs the net and a sign-in.'],
    guest:['Registrer deg for å handle hos Kystmegleren.', 'Register to trade at Kystmegleren.'], start:['Startprisen må være mellom 40 % og 160 % av verdien.', 'The start price must be between 40 % and 160 % of the value.'],
    buynow:['«Kjøp nå» må være over startprisen og høyst 160 % av verdien.', 'Buy now must be above the start price and at most 160 % of the value.'], hours:['Velg hvor lenge hun skal ligge ute.', 'Choose how long she is to be out.'],
    yard:['Ingen verft i nærheten.', 'No yard nearby.'], own:['Det er din egen båt.', 'That is your own boat.'], bladb:['En båt med hjemmel krever blad B i fiskermanntallet. Se Papirer.', 'A boat with a right needs blad B of the fishermen\'s register. See Papers.'],
    open:['Et rederi uten hjemmel kan bare ha én båt i åpen gruppe.', 'A company without a right can only have one boat in the open group.'], cash:['Du har ikke nok penger.', 'You do not have the money.'], gone:['Salget er over.', 'The sale is over.']};
  // KM4: why the right cannot be moved (core/09k-market.js mbMoveWhy); len: the limit of the length rule
  const MV_WHY = {gone:['Hjemmelen finnes ikke lenger.', 'The right is no longer there.'], none:['Hun har ingen hjemmel.', 'She has no right.'], hav:['Havflåtens tillatelser følger fartøyet.', 'The ocean fleet\'s permits follow the vessel.'],
    listed:['Ligger til salgs. Vent til salget er over.', 'For sale. Wait until the sale is over.'], sea:['Båten må ligge i havn.', 'The boat must lie in port.'], busy:['Hun losser ved mottaket.', 'She is landing at the plant.'],
    coop:['Hjemmelen er i kvotesamarbeid i år.', 'The right is in a quota cooperation this year.'], hold:['Lasten må leveres først.', 'The catch must be landed first.'], ops:['Slå av driftsplanen hennes først.', 'Turn her plan off first.'],
    drift:['Ingenting er landet på hjemmelen i år eller de to årene før.', 'Nothing has been landed on the right this year or the two before.'], order:['Hun går i innbytte på verftet.', 'She is being traded in at the yard.'], same:['Hjemmelen er der alt.', 'The right is there already.'],
    boat:['Båten finnes ikke.', 'No such boat.'], type:['En havbåt kan ikke ta en kysthjemmel.', 'An ocean vessel cannot take a coastal right.'], tolisted:['Båten ligger til salgs.', 'The boat is for sale.'], haslic:['Båten har alt en hjemmel.', 'The boat has a right already.']};
  const mvWhyTxt = (w, len) => w === 'len' ? L('Lengderegelen: en hjemmel under ' + len + ' m fra en båt under ' + len + ' m kan ikke flyttes til en båt på ' + len + ' m eller mer.', 'The length rule: a right under ' + len + ' m from a boat under ' + len + ' m cannot be moved to a boat of ' + len + ' m or more.')
    : MV_WHY[w] ? L(MV_WHY[w][0], MV_WHY[w][1]) : L('Det går ikke nå.', 'Not now.');
  // the second quota from the special scheme under 11 m, said before a sale, a move or a trade-in is confirmed (kap. 2 § 6)
  const mbTwoTxt = l => l && l.two && HJ[l.two] ? L('Den andre kvoten fra den særlige ordningen (hjemmel ' + HJ[l.two].hl + ') faller bort når båten selges eller hjemmelen flyttes (kvoteforskriften kap. 2 § 6). Den er ikke med i verdien.', 'The second quota from the special scheme (quota length ' + HJ[l.two].hl + ') falls away when the boat is sold or the right is moved (kvoteforskriften kap. 2 § 6). It is not in the value.') : '';
  // where the right can go when it stays in the company: each other boat of yours with why not, and the free right
  const mbKeepList = src => S.fleet.filter(x => x !== src.v).map(x => ({v:x, why:mbMoveWhy(src, {v:x}), len:mbMoveLen(src, {v:x})})).filter(o => o.why !== 'type');
  // the seller's choice in «Legg ut til salgs»: null (the right follows her), or where it stays: {v} or {free:true}
  function mbKeepOf(v){ if (sub.mblic !== 'keep' || !vget(v, 'lic') || mbMoveWhy({v}, {free:true})) return null;
    const o = mbKeepList({v}).find(o => o.v.id === sub.mbkeep && !o.why); return o ? {v:o.v} : {free:true}; }
  const mbWhyTxt = (w, r) => (r && r.text) || (MB_WHY[w] ? L(MB_WHY[w][0], MB_WHY[w][1]) : L('Det går ikke nå.', 'Not now.'));
  // your own boats: for sale (the bids, the time left, «Trekk fra salg» while nobody has bid), or the buttons to put her out and to sell her
  // now, and delivery to where you are or home (Rederi and the broker's page; quick: with «Selg nå», which Rederi has behind «⋯»)
  function mgOwnRow(v, quick){
    const s = mbSale(v), b = vget(v, 'boat'), D = (mktState().del || []).find(d => d.vid === v.id), H = S.t / 60, h = [];
    if (D) return '<p class="ph-note">' + L('Seiles til ' + portById(D.to).name + ', framme om ' + Math.max(1, Math.round(D.H1 - H)) + ' timer.', 'Being sailed to ' + portById(D.to).name + ', there in ' + Math.max(1, Math.round(D.H1 - H)) + ' hours.') + '</p>';
    if (s && s.km) return kxBoatRow(v);   // (KM3: it is her right or a structure quota that is out, in the quota market; phone/04b-kvotemarked.js)
    if (s){ const m = MBC.mineOf(v.id) || {}, pt = portById(s.port);
      h.push('<p class="ph-note mb-own">' + (s.kept ? L('Til salgs hos Kystmegleren uten hjemmel: ', 'For sale at Kystmegleren without a right: ') : L('Til salgs hos Kystmegleren: ', 'For sale at Kystmegleren: ')) + (m.top ? L('høyeste bud ' + kr(m.top) + ' (' + m.bids + ' bud)', 'highest bid ' + kr(m.top) + ' (' + m.bids + (m.bids === 1 ? ' bid)' : ' bids)')) : L('ingen bud ennå, fra ' + kr(s.start), 'no bids yet, from ' + kr(s.start))) +
        (s.buynow ? L(', «Kjøp nå» ' + kr(s.buynow), ', buy now ' + kr(s.buynow)) : '') + '. ' + L('Slutter om ', 'Ends in ') + mbLeftTxt(MBC.left(s.until)) + '. ' + L('Hun ligger ved verftet i ' + (pt ? mbPlace(pt) : '') + ' til salget er over.', 'She lies at the yard in ' + (pt ? mbPlace(pt) : '') + ' until the sale is over.') + '</p>');
      if (!(m.bids > 0) && s.lid != null) h.push('<button class="ph-btn alt" data-pa="mbcancel" data-id="' + s.lid + '">' + L('Trekk fra salg', 'Withdraw') + '</button>');
      return '<div class="ph-btncol mg-own">' + h.join('') + '</div>'; }
    if (v.id === S.me) return '';
    const w = mbWhy(v) || (!MBC.on() ? 'cloud' : MBC.guest() ? 'guest' : null);
    h.push('<button class="ph-btn" data-pa="mbput" data-id="' + v.id + '"' + (w && w !== 'cloud' && w !== 'guest' ? ' disabled data-why="' + mgEsc(mbWhyTxt(w)) + '"' : '') + '>' + L('Legg ut til salgs', 'Put out for sale') + '</button>');
    if (quick){ const q = mbQuickWhy(v); h.push('<button class="ph-btn alt" data-pa="vsell" data-id="' + v.id + '"' + (q ? ' disabled data-why="' + mgEsc(mbWhyTxt(q)) + '"' : '') + '>' + L('Selg nå til Kystmegleren · ', 'Sell now to Kystmegleren · ') + kr(mbQuick(v)) + '</button>'); }
    if (b.status === 'port'){ const meB = vget(vesselById(S.me), 'boat'), home = S.home || HOME0, to = [];
      if (meB && meB.status === 'port' && meB.port && meB.port !== b.port) to.push(meB.port); if (home && home !== b.port && !to.includes(home)) to.push(home);
      for (const p of to){ const q = portById(p); if (!q) continue; const c = mktDelKr(dist(b.pos, q.p) / NM); h.push('<button class="ph-btn alt" data-pa="mgdel" data-id="' + v.id + '" data-to="' + p + '"' + (c > spendable() ? ' disabled' : '') + '>' + L('Få henne levert til ' + q.name + ' · ', 'Have her delivered to ' + q.name + ' · ') + kr(c) + '</button>'); } }
    return '<div class="ph-btncol mg-own">' + h.join('') + '</div>';
  }
  // «Legg ut til salgs» (B1): the start price and buy-now within the limits, the time, where she will lie, the commission; or sell now
  function mbForm(v){
    const lic = vget(v, 'lic'), keepWhy = lic ? mbMoveWhy({v}, {free:true}) : 'none', keep = mbKeepOf(v);   // (KM4: with or without the right)
    const b = vget(v, 'boat'), V = VESSELS[b.type], val = mbValue(v) - (keep ? mbLicKr(v) : 0), B = mbBounds(val), yard = mbYardNear(b.pos), hrs = MB.hours.includes(+sub.mbhrs) ? +sub.mbhrs : 24;
    const w = mbWhy(v) || (!MBC.on() ? 'cloud' : MBC.guest() ? 'guest' : null), q = mbQuickWhy(v), st0 = Math.min(B.max, Math.max(B.min, mktRound(val))), bn0 = Math.min(B.max, mktRound(val * 1.3));
    const h = ['<div class="ph-c"><button class="ph-btn alt mkback" data-pa="mbput0">‹ ' + L('Tilbake', 'Back') + '</button><div class="ph-card vsheet mb-form"><h4>' + L('Legg ut til salgs', 'Put out for sale') + ': «' + mgEsc(vget(v, 'boatName')) + '»</h4><p class="ph-note">' + V.name[S.lang] + '</p><div class="vbig">' + vesselSVG(b.type) + '</div>'];
    // the choice (V2 A): the right follows her (taking over for continued fishing; its structure quotas follow it), or it stays in the
    // company: on another boat of yours that the length rule lets take it (replacement), or as a free right for two game years
    if (lic && HJ[lic.id]){ const KL = mbKeepList({v}), toId = keep ? (keep.free ? 'free' : keep.v.id) : null;
      h.push('<div class="vsec mb-licsel"><h5>' + L('Hjemmelen', 'The right') + ' · ' + mgEsc(lic.hl || HJ[lic.id].hl) + '</h5><div class="net-shops mb-lich"><button class="chip-b' + (keep ? '' : ' on') + '" data-pa="mblic" data-s="with">' + L('Hjemmelen følger med', 'The right comes with her') + '<br><small>' + L('kjøperen overtar for fortsatt drift', 'the buyer takes over for continued fishing') + '</small></button>' +
        '<button class="chip-b' + (keep ? ' on' : '') + '" data-pa="mblic" data-s="keep"' + (keepWhy ? ' disabled' : '') + '>' + L('Uten hjemmel', 'Without the right') + '<br><small>' + (keepWhy ? mvWhyTxt(keepWhy) : L('hjemmelen blir i rederiet', 'the right stays in the company')) + '</small></button></div>' +
        (keep ? '<p class="ph-note">' + L('Hvor skal hjemmelen' + ((lic.st || []).length ? ' og strukturkvotene' : '') + '? Den flyttes når båten legges ut.', 'Where is the right' + ((lic.st || []).length ? ' and its structure quotas' : '') + ' to go? It is moved when the boat is put out.') + '</p><div class="net-shops mb-keep"><button class="chip-b' + (toId === 'free' ? ' on' : '') + '" data-pa="mbkeep" data-s="free">' + L('Ledig hjemmel', 'A free right') + '<br><small>' + L('uten båt i høyst to spillår', 'without a boat for at most two game years') + '</small></button>' +
          KL.map(o => '<button class="chip-b' + (toId === o.v.id ? ' on' : '') + '" data-pa="mbkeep" data-s="' + o.v.id + '"' + (o.why ? ' disabled' : '') + '>' + L('Flytt til ', 'Move to ') + '«' + mgEsc(vget(o.v, 'boatName')) + '»<br><small>' + (o.why ? mvWhyTxt(o.why, o.len) : L('utskiftning: hun blir båten i lukket gruppe', 'replacement: she becomes the boat in the closed group')) + '</small></button>').join('') + '</div>' : '') +
        (mbTwoTxt(lic) ? '<p class="ph-note mb-two"><b>' + mbTwoTxt(lic) + '</b></p>' : '') + (lic.coop && lic.coop.y === yearH(S.t / 60) ? '<p class="ph-note">' + L('Kvotesamarbeidet i år er din avtale og følger ikke med båten.', 'This year\'s quota cooperation is your agreement and does not go with the boat.') + '</p>' : '') + '</div>'); }
    h.push('<div class="vsec"><h5>' + L('Verdi', 'Value') + '</h5>' + kv(keep ? L('Verdien hennes uten hjemmel', 'Her value without the right') : L('Verdien hennes', 'Her value'), kr(val)) + (lic && !keep ? kv(L('Av det er hjemmelen', 'Of which the right'), kr(mbLicKr(v))) : '') + '<p class="ph-note">' + L('Det verftet gir i innbytte. Startprisen kan være fra ' + kr(B.min) + ' (40 %), og «Kjøp nå» høyst ' + kr(B.max) + ' (160 %).', 'What the yard gives as a trade-in. The start price can be from ' + kr(B.min) + ' (40 %), and buy now at most ' + kr(B.max) + ' (160 %).') + '</p></div>');
    h.push('<label class="ph-kv"><span>' + L('Startpris', 'Start price') + '</span><input id="mbStart" type="number" inputmode="numeric" step="1000" min="' + B.min + '" max="' + B.max + '" value="' + st0 + '"></label>');
    h.push('<label class="ph-kv"><span>' + L('«Kjøp nå» (tom: ingen)', 'Buy now (empty: none)') + '</span><input id="mbBuy" type="number" inputmode="numeric" step="1000" max="' + B.max + '" value="' + bn0 + '"></label>');
    h.push('<div class="vsec"><h5>' + L('Hvor lenge', 'How long') + '</h5><div class="net-shops mb-hrs">' + MB.hours.map(x => '<button class="chip-b' + (x === hrs ? ' on' : '') + '" data-pa="mbhrs" data-h="' + x + '">' + mbHrs(x) + '</button>').join('') + '</div><p class="ph-note">' + L('Ekte tid, også når spillet er lukket.', 'Real time, also when the game is closed.') + '</p></div>');
    h.push('<p class="ph-note">' + L('Hun legges ved verftet i ' + (yard ? mbPlace(yard) : '–') + ' og kan ikke seiles før salget er over. Andre spillere byr eller kjøper henne for «Kjøp nå». Megleren tar 5 % når hun er solgt, og lånene innfris først. Får hun ingen bud, er hun din igjen.', 'She is laid at the yard in ' + (yard ? mbPlace(yard) : '–') + ' and cannot be sailed until the sale is over. Other players bid, or buy her at the buy-now price. The broker takes 5 % when she is sold, and the loans are paid off first. With no bid, she is yours again.') +
      (!lic ? '' : keep ? ' <b>' + L('Hun selges uten hjemmel, og det står på kortet hennes. Trekker du henne fra salg, kan hjemmelen settes tilbake med «Flytt hjemmelen til …» i Rederi.', 'She is sold without a right, and her card says so. If you withdraw her, the right can be put back with «Move the right to …» in the Company app.')
        : ' <b>' + L('Hjemmelen følger med båten, og det står på kortet hennes.', 'The right goes with the boat, and her card says so.')) + (lic ? '</b>' : '') + '</p>');
    if (mgMsg['put' + v.id]) h.push('<p><b>' + mgMsg['put' + v.id] + '</b></p>');
    h.push('<button class="ph-btn p" data-pa="mbputgo" data-id="' + v.id + '"' + (w ? ' disabled data-why="' + mgEsc(mbWhyTxt(w)) + '"' : '') + '>' + L('Legg ut', 'Put out') + '</button>');
    h.push('<div class="vsec"><h5>' + L('Eller selg henne nå', 'Or sell her now') + '</h5><p class="ph-note">' + L('Megleren kjøper henne med en gang for 90 % av verdien, og hun er borte.', 'The broker buys her at once for 90 % of the value, and she is gone.') + '</p><button class="ph-btn alt" data-pa="vsell" data-id="' + v.id + '"' + (q ? ' disabled data-why="' + mgEsc(mbWhyTxt(q)) + '"' : '') + '>' + L('Selg nå · ', 'Sell now · ') + kr(mbQuick(v)) + '</button></div>');
    return h.join('') + '</div></div>';
  }
  function megler(){
    if (mbPutSel){ const v = vesselById(mbPutSel); if (v) return mbForm(v); mbPutSel = null; }
    MBC.load();
    if (mgSel){ const Lx = MBC.byId(mgSel); if (Lx) return mgSheet(Lx); if (MBC.loaded) mgSel = null; }
    const tab = sub.mgtab || 'alle', so = sub.mgsort || 'near', h = ['<div class="ph-c"><button class="ph-btn alt mkback" data-pa="sub" data-s="home">‹ ' + L('Nettet', 'The Net') + '</button><div class="net-bar">kystmegleren.detstorebla.no</div>'];
    h.push('<div class="ph-sub mk">' + [['alle', 'Alle', 'All'], ['open', 'Åpen gruppe', 'Open group'], ['kyst', 'Kystflåten', 'Coastal fleet']].map(([k, no, en]) => '<button class="' + (tab === k ? 'on' : '') + '" data-pa="mgtab" data-s="' + k + '">' + L(no, en) + '</button>').join('') + '</div>');
    h.push('<div class="net-shops">' + [['near', 'Nærmest', 'Nearest'], ['cheap', 'Billigst', 'Cheapest'], ['end', 'Slutter snart', 'Ending soon'], ['new', 'Nyest', 'Newest']].map(([k, no, en]) => '<button class="chip-b' + (so === k ? ' on' : '') + '" data-pa="mgsort" data-s="' + k + '">' + L(no, en) + '</button>').join('') + '</div>');
    let A = MBC.list().filter(x => VESSELS[x.type] && (tab === 'alle' || VESSELS[x.type].cls === tab));
    A.sort(so === 'cheap' ? (a, b) => mgNow(a) - mgNow(b) : so === 'end' ? (a, b) => Date.parse(a.until) - Date.parse(b.until) : so === 'new' ? (a, b) => Date.parse(b.at) - Date.parse(a.at) : (a, b) => mgNm(a) - mgNm(b));
    if (A.length) h.push('<p class="ph-note">' + L(A.length + (A.length === 1 ? ' båt' : ' båter') + ' til salgs fra andre spillere. By herfra; hun overtas ved verftet der hun ligger, eller leveres til verftet nær deg for 2 %.', A.length + (A.length === 1 ? ' boat' : ' boats') + ' for sale from other players. Bid from here; she is taken over at the yard where she lies, or delivered to the yard near you for 2 %.') + '</p>');
    if (A.length) h.push(A.map(mgCard).join(''));
    else { const y = mbYardNear(S.boat.pos);
      h.push('<div class="ph-card mb-empty"><h4>' + L('Ingen båter til salgs nå.', 'No boats for sale now.') + '</h4><p>' + L('Verftet selger nye til full pris.', 'The yard sells new ones at full price.') + '</p><p class="ph-note">' + (MBC.on() ? L('Kystmegleren formidler bare båter mellom spillere. Si hva du ser etter under «Ønsket båt», så får du beskjed når en slik legges ut.', 'Kystmegleren only brokers boats between players. Say what you are looking for under «Wanted boat», and you are told when one is put out.') : L('Kystmegleren formidler båter mellom spillere og trenger nett og innlogging.', 'Kystmegleren brokers boats between players and needs the net and a sign-in.')) + '</p>' +
        (y && !(S.boat.port === y.id && S.boat.status === 'port') ? '<button class="ph-btn" data-pa="goplace" data-id="' + y.id + '">' + L('Autonav til verftet i ' + mbPlace(y), 'Autonav to the yard in ' + mbPlace(y)) + '</button>' : '') + '</div>'); }
    const my = MBC.bids(); if (my.length) h.push('<div class="ph-card mb-bids"><h4>' + L('Dine bud', 'Your bids') + '</h4>' + my.map(b => kv('«' + mgEsc(b.name) + '»', kr(b.kr) + (b.fee ? L(' + levering ', ' + delivery ') + kr(b.fee) : '') + ' · ' + mbLeftTxt(MBC.left(b.until)))).join('') + '<p class="ph-note">' + L('Pengene er bundet hos megleren til du blir overbydd eller salget er over.', 'The money is held by the broker until you are outbid or the sale is over.') + '</p></div>');
    const mine = S.fleet.filter(v => v.id !== S.me || mbSale(v));
    if (mine.length) h.push('<div class="ph-card"><h4>' + L('Dine båter', 'Your boats') + '</h4>' + mine.map(v => '<p><b>«' + mgEsc(vget(v, 'boatName')) + '»</b> · ' + VESSELS[vget(v, 'boat').type].name[S.lang] + '</p>' + mgOwnRow(v, true)).join('') + '</div>');
    else h.push('<p class="ph-note">' + L('Du kan legge ut en båt når rederiet har en annen å være om bord i.', 'You can put a boat out when the company has another to be aboard.') + '</p>');
    h.push(mgWishCard());
    const sold = MBC.sold().slice(0, 8);
    if (sold.length) h.push('<div class="ph-card"><h4>' + L('Solgt siste måned', 'Sold in the last month') + '</h4>' + sold.filter(x => VESSELS[x.type]).map(x => kv(VESSELS[x.type].name[S.lang] + ' · ' + (portById(x.port) ? portById(x.port).name : ''), kr(x.price))).join('') + '</div>');
    return h.join('') + '</div>';
  }
  function mgWishCard(){
    const W = mktState().wish, hits = mbWishHits(MBC.list());
    if (!W) return '<details class="ph-card mg-wish"><summary>' + L('Ønsket båt', 'Wanted boat') + '</summary><p class="ph-note">' + L('Si hva du ser etter, så sier Kystmegleren fra når en slik legges ut.', 'Say what you are looking for, and Kystmegleren tells you when one is put out.') + '</p>' +
      '<label class="ph-kv"><span>' + L('Gruppe', 'Group') + '</span><select id="mgWishC"><option value="open">' + L('Åpen gruppe', 'Open group') + '</option><option value="kyst">' + L('Kystflåten', 'Coastal fleet') + '</option></select></label>' +
      '<label class="ph-kv"><span>' + L('Høyst', 'At most') + '</span><input id="mgWishMax" type="number" inputmode="numeric" min="0" step="10000" value="' + Math.max(100000, Math.round(eqCash() * 5 / 10000) * 10000) + '"></label><button class="ph-btn" data-pa="mgwish">' + L('Lagre', 'Save') + '</button></details>';
    return '<div class="ph-card mg-wish"><h4>' + L('Ønsket båt', 'Wanted boat') + '</h4><p>' + (W.cls === 'kyst' ? L('Kystflåten', 'Coastal fleet') : L('Åpen gruppe', 'Open group')) + ' · ' + L('høyst ', 'at most ') + kr(W.max) + '</p><p class="ph-note">' +
      (hits.length ? L(hits.length + ' til salgs nå. Nyeste: «' + mgEsc(hits[0].name) + '» i ' + mgPt(hits[0]).name + '.', hits.length + ' for sale now. Newest: «' + mgEsc(hits[0].name) + '» at ' + mgPt(hits[0]).name + '.') : L('Ingen akkurat nå. Du får beskjed når en legges ut.', 'None just now. You are told when one is put out.')) + '</p>' +
      (hits.length ? '<button class="ph-btn" data-pa="mgsel" data-id="' + hits[0].id + '">' + L('Se den', 'See her') + '</button> ' : '') + '<button class="ph-btn alt" data-pa="mgwish0">' + L('Fjern', 'Remove') + '</button></div>';
  }
  function mgSheet(Q){
    const V = VESSELS[Q.type], P = mgP(Q), pt = mgPt(Q), here = S.boat.port === Q.port && S.boat.status === 'port', c = mbCond(P), lic = mgLic(Q), near = mgNear(Q), to = mgTo(Q);
    const sec = (t, rows) => '<div class="vsec"><h5>' + t + '</h5>' + rows.filter(Boolean).join('') + '</div>', h = [];
    h.push('<div class="ph-c"><button class="ph-btn alt mkback" data-pa="mgsel">‹ ' + L('Tilbake til listen', 'Back to the list') + '</button>');
    h.push('<div class="ph-card vsheet mg-sheet"><h4>«' + mgEsc(Q.name) + '» · ' + V.name[S.lang] + '</h4><p class="ph-note mg-nr">' + L('Oppføring nr. ', 'Listing no. ') + Q.id + '</p><div class="vbig">' + vesselSVG(Q.type) + '</div>');
    h.push('<p class="mg-strip">' + mgYear(Q) + ' · ' + fmt(V.len, 2) + ' m · ' + fmt(P.engH || 0, 0) + L(' timer', ' hours') + ' · ' + kr(mgNow(Q)) + '</p>' + mgLicTag(Q));
    // the auction: the time left, the highest bid, buy-now, and your bid
    { const n = mbNext(Q), fee = mbFee(n, to, Q.port), bnFee = Q.buynow ? mbFee(Q.buynow, to, Q.port) : 0, why = Q.mine ? 'own' : MBC.guest() ? 'guest' : mbBuyWhy(Q, null), cash = spendable() < n + fee ? 'cash' : null;
      const a = ['<div class="ph-card mb-auc"><h4>' + L('Auksjonen', 'The auction') + '</h4>', kv(L('Slutter om', 'Ends in'), '<b>' + mgLeft(Q) + '</b>'),
        kv(Q.top != null ? L('Høyeste bud', 'Highest bid') : L('Startpris', 'Start price'), kr(mgNow(Q)) + (Q.top != null ? ' · ' + Q.bids + L(' bud', Q.bids === 1 ? ' bid' : ' bids') : '')), Q.buynow ? kv(L('Kjøp nå', 'Buy now'), kr(Q.buynow)) : ''];
      if (mgMsg[Q.id]) a.push('<p class="mb-msg"><b>' + mgMsg[Q.id] + '</b></p>');
      if (Q.mine) a.push('<p class="ph-note">' + L('Dette er din båt.', 'This is your boat.') + '</p>' + (Q.bids ? '' : '<button class="ph-btn alt" data-pa="mbcancel" data-id="' + Q.id + '">' + L('Trekk fra salg', 'Withdraw') + '</button>'));
      else if (why) a.push('<p class="ph-note"><b>' + mbWhyTxt(why) + '</b></p>');
      else {
        if (near && (!Q.top_me || Q.buynow)) a.push('<div class="net-shops mb-to"><button class="chip-b' + (to ? '' : ' on') + '" data-pa="mbto" data-s="self">' + L('Hent selv i ', 'Fetch at ') + mbPlace(pt) + '</button><button class="chip-b' + (to ? ' on' : '') + '" data-pa="mbto" data-s="near">' + L('Lever til ', 'Deliver to ') + mbPlace(near) + ' · +2 %</button></div>');
        if (Q.top_me) a.push('<p class="ph-note mb-top">' + L('Du har det høyeste budet. Du får beskjed om noen byr over, og pengene tilbake da.', 'You hold the highest bid. You are told if someone bids over, and get the money back then.') + '</p>');
        else a.push('<label class="ph-kv"><span>' + L('Ditt bud (minst ' + kr(n) + ')', 'Your bid (at least ' + kr(n) + ')') + '</span><input id="mbBid" type="number" inputmode="numeric" step="1000" min="' + n + '" value="' + n + '"></label>' +
          '<button class="ph-btn p" data-pa="mbbid" data-id="' + Q.id + '"' + (cash ? ' disabled data-why="' + mgEsc(mbWhyTxt(cash)) + '"' : '') + '>' + L('By', 'Bid') + (fee ? L(' · + levering ', ' · + delivery ') + kr(fee) : '') + '</button>');
        if (Q.buynow) a.push('<button class="ph-btn" data-pa="mbbuy" data-id="' + Q.id + '"' + (spendable() < Q.buynow + bnFee ? ' disabled data-why="' + mgEsc(mbWhyTxt('cash')) + '"' : '') + '>' + L('Kjøp nå · ', 'Buy now · ') + kr(Q.buynow + bnFee) + '</button>');
        a.push('<p class="ph-note">' + L('Budet binder pengene hos megleren. Blir du overbydd, får du dem tilbake med en gang. Neste bud må være minst 2 % over.', 'The bid holds the money at the broker. Outbid, you get it back at once. The next bid must be at least 2 % over.') + '</p>');
      }
      h.push(a.join('') + '</div>'); }
    h.push('<div class="ph-card mg-seller"><h4>' + (Q.seller ? mgEsc(Q.seller) : L('En fisker', 'A fisherman')) + ' <small>' + L('selger', 'sells') + '</small></h4><p class="ph-note">' + L('Kystmegleren formidler mellom spillere og tar 5 % av prisen fra selgeren. Det som står her, er det båten har.', 'Kystmegleren brokers between players and takes 5 % of the price from the seller. What stands here is what the boat has.') + '</p></div>');
    if (lic) h.push(sec(L('Hjemmel', 'Right'), [kv(L('Hjemmelslengde', 'Quota length'), mgEsc(lic.hl || lic.id)), kv(L('Følger med', 'Comes with her'), L('ja, med årets fangst på den', 'yes, with this year\'s catch on it')),
      '<p class="ph-note">' + L('I virkeligheten følger ikke deltakeradgangen automatisk med båten (deltakerloven § 4); i spillet gjør den det, og kjøperen må stå på blad B.', 'In life the right does not follow the boat by itself (deltakerloven § 4); in the game it does, and the buyer must be on blad B.') + '</p>']));
    else h.push(sec(L('Hjemmel', 'Right'), [kv(L('Følger med', 'Comes with her'), L('nei, hun selges uten hjemmel', 'no, she is sold without a right')),
      '<p class="ph-note">' + (V.len < 11 ? L('Uten hjemmel fisker hun i åpen gruppe, eller du setter en hjemmel på henne fra Kvotemarkedet.', 'Without a right she fishes in the open group, or you put a right on her from the quota market.') : L('Uten hjemmel kan hun bare ta torsk, hyse og sei som bifangst. En hjemmel kan kjøpes i Kvotemarkedet og settes på henne.', 'Without a right she can only take cod, haddock and saithe as bycatch. A right can be bought in the quota market and put on her.')) + '</p>']));
    h.push(sec(L('Tilstand', 'Condition'), [kv(L('Skrog', 'Hull'), mgPct(c.hull)), mgBar(c.hull), kv(L('Motor', 'Engine'), mgPct(c.motor)), mgBar(c.motor), kv(L('Motortimer', 'Engine hours'), fmt(P.engH || 0, 0)), kv(L('Siste service', 'Last service'), L('ved ', 'at ') + fmt(P.svcAt || 0, 0) + L(' timer', ' hours'))]));
    const std = (V.std || []).map(q => EQUIP[q] ? EQUIP[q].name[S.lang] : q), ex = Object.entries(P.equip || {}).filter(([q, n]) => EQUIP[q] && n && !(V.std || []).includes(q)).map(([q, n]) => EQUIP[q].name[S.lang] + (EQUIP[q].multi ? ' × ' + n : ''));
    h.push(sec(L('Følger med', 'Comes with'), [kv(L('Utstyr', 'Equipment'), std.concat(ex).join(', ') || L('ingenting utover båten', 'nothing besides the boat')), P.gear ? kv(L('Håndjuksa', 'Hand jig'), L('om bord', 'aboard')) : '']));
    h.push(sec(L('Ligger', 'Lies'), [kv(L('Ved verftet i', 'At the yard in'), pt.name), kv(L('Avstand', 'Distance'), fmt(mgNm(Q), 1) + ' nm')]) + (here || !portById(Q.port) ? '' : '<button class="ph-btn" data-pa="goplace" data-id="' + Q.port + '">' + L('Autonav dit', 'Autonav there') + '</button>'));
    if (vesselSpec(Q.type)) h.push('<button class="ph-btn alt" data-pa="mk3d" data-k="' + Q.type + '">' + L('Se båten i 3D', 'See her in 3D') + '</button>');
    const secs = specSecs(Q.type); h.push('<details class="mg-spec"><summary>' + L('Hele databladet', 'The whole spec sheet') + '</summary>' + secs.map(([t, rows]) => sec(t, t === secs[0][0] ? rows.slice(1) : rows)).join('') + '</details>');
    return h.join('') + '</div></div>';
  }
  // ---- KM4: «Flytt hjemmelen til …» (Rederi «⋯», and the free rights under the fleet). mlSel = {vid} a boat's right or {key} a free right ----
  let mlSel = null;
  function mlSrc(){ if (!mlSel) return null; if (mlSel.vid){ const v = vesselById(mlSel.vid); return v && vget(v, 'lic') ? {v} : null; } return kmSrcOf(mlSel.key); }
  function mbLicSheet(){
    const src = mlSrc(); if (!src){ mlSel = null; return ''; }
    const H = S.t / 60, it = kmPack(mbSrc(src), H); if (!it){ mlSel = null; return ''; }
    const lic = src.v ? vget(src.v, 'lic') : null, f = src.free != null ? kmFreeList()[src.free] : null, w0 = mbMoveWhy(src, src.v ? {free:true} : {v:null}), srcWhy = w0 && w0 !== 'boat' ? w0 : null;
    const h = ['<div class="ph-c"><button class="ph-btn alt mkback" data-pa="mbmv0">‹ ' + L('Tilbake til flåten', 'Back to the fleet') + '</button><div class="ph-card vsheet mb-move"><h4>' + L('Flytt hjemmelen', 'Move the right') + ' · ' + mgEsc(HJ[it.id].hl) + '</h4>'];
    h.push('<p class="ph-note">' + (src.v ? L('Står på «' + mgEsc(vget(src.v, 'boatName')) + '».', 'Stands on the «' + mgEsc(vget(src.v, 'boatName')) + '».') : L('Ledig hjemmel, uten båt. Tilsagnet gjelder til ' + doyStr(yearH(f.until), doyH(f.until)) + ' ' + yearH(f.until) + '.', 'A free right, without a boat. The promise holds until ' + doyStr(yearH(f.until), doyH(f.until)) + ' ' + yearH(f.until) + '.')) + '</p>');
    h.push(kv(L('Kvotefaktor', 'Quota factor'), fmt(kmKf(it), 4)) + ((it.st || []).length ? kv(L('Strukturkvoter som følger den', 'Structure quotas that follow it'), it.st.length) : '') + kv(L('Torsk i år', 'Cod this year'), fmt(kmCod(it, H) / 1000, 2) + ' t') + kv(L('Landet på den i år', 'Landed on it this year'), fmt((it.used.torsk || 0) / 1000, 2) + ' t'));
    h.push('<p class="ph-note">' + L('Hjemmelen flyttes med strukturkvotene og det som er fisket på den i år. Det koster ingenting, og Fiskeridirektoratet sier fra når det er gjort.', 'The right moves with its structure quotas and what is fished on it this year. It costs nothing, and the Directorate of Fisheries sends word when it is done.') + '</p>');
    if (mbTwoTxt(lic)) h.push('<p class="ph-note mb-two"><b>' + mbTwoTxt(lic) + '</b></p>');
    if (srcWhy) h.push('<p><b>' + mvWhyTxt(srcWhy) + '</b></p>');
    h.push('<div class="vsec"><h5>' + L('Til', 'To') + '</h5><div class="ph-btncol mb-mvto">');
    for (const o of mbKeepList(src)){ const V = VESSELS[vget(o.v, 'boat').type];
      h.push('<button class="ph-btn" data-pa="mbmvgo" data-to="' + o.v.id + '"' + (o.why ? ' disabled data-why="' + mgEsc(mvWhyTxt(o.why, o.len)) + '"' : '') + '>«' + mgEsc(vget(o.v, 'boatName')) + '» · ' + V.name[S.lang] + ' · ' + fmt(V.len, 2) + ' m</button>'); }
    if (src.v) h.push('<button class="ph-btn alt" data-pa="mbmvgo" data-to="free"' + (srcWhy ? ' disabled data-why="' + mgEsc(mvWhyTxt(srcWhy)) + '"' : '') + '>' + L('Ledig hjemmel · uten båt i høyst to spillår', 'A free right · without a boat for at most two game years') + '</button>');
    h.push('</div><p class="ph-note">' + L('Lengderegelen avgjør hvilke båter som kan ta den: en hjemmel under 11, 15 eller 21 m fra en båt under den lengden kan ikke flyttes til en båt på den lengden eller mer. En ledig hjemmel som ikke er satt på en båt, lagt ut eller solgt til registeret innen to spillår, går tilbake til registeret.', 'The length rule decides which boats can take it: a right under 11, 15 or 21 m from a boat under that length cannot be moved to a boat of that length or more. A free right not put on a boat, put out or sold to the register within two game years goes back to the register.') + '</p></div>');
    return h.join('') + '</div></div>';
  }
  // Rederi: the «⋯» button on a boat with a right, and the free rights under the fleet
  function mbMoveBtn(v){ const l = vget(v, 'lic'); if (!l || !HJ[l.id]) return ''; const w = mbMoveWhy({v}, {free:true});
    return '<button class="ph-btn alt" data-pa="mbmv" data-id="' + v.id + '"' + (w ? ' disabled data-why="' + mgEsc(mvWhyTxt(w)) + '"' : '') + '>' + L('Flytt hjemmelen til …', 'Move the right to …') + '</button>'; }
  function mbFreeCard(){ const H = S.t / 60, F = kmFree(H); if (!F.length) return '';
    return '<div class="ph-card fl-free"><h4>' + L('Ledige hjemler', 'Free rights') + '</h4>' + F.map((f, i) => { const key = kmKey({free:i}), out = !!kmState().out[key];
      return '<div class="fl-al"><span>' + L('Hjemmel ', 'Right ') + mgEsc(HJ[f.id].hl) + ' · ' + L('til ', 'until ') + doyStr(yearH(f.until), doyH(f.until)) + ' ' + yearH(f.until) + (out ? ' · ' + L('til salgs', 'for sale') : '') + '</span><button class="ph-btn sm" data-pa="mbmv" data-k="' + key + '"' + (out ? ' disabled' : '') + '>' + L('Flytt til …', 'Move to …') + '</button></div>'; }).join('') +
      '<p class="ph-note">' + L('En hjemmel uten båt. Den kan også legges ut eller selges til registeret i Kvotemarkedet.', 'A right without a boat. It can also be put out or sold to the register in the quota market.') + '</p></div>'; }
  // the yard's trade-in (phone/10-fartoy.js asks, one line): the right follows the boat traded in, or stays as a free right for two game years
  const tiKeepOn = () => sub.tikeep === 'keep' && !!S.lic && !mbMoveWhy({v:curVessel()}, {free:true});
  function tiLicRow(){ const l = S.lic; if (!l || !HJ[l.id] || !atKind('verft')) return ''; const v = curVessel(), w = mbMoveWhy({v}, {free:true}), on = tiKeepOn(), full = mbValue(v), kl = mbLicKr(v);
    return '<div class="vsec ti-lic"><h5>' + L('Hjemmelen ved innbytte', 'The right at a trade-in') + ' · ' + mgEsc(l.hl || HJ[l.id].hl) + '</h5><div class="net-shops"><button class="chip-b' + (on ? '' : ' on') + '" data-pa="mbti" data-s="with">' + L('Følger innbyttebåten', 'Goes with the boat traded in') + '<br><small>' + L('innbytte ', 'trade-in ') + kr(full) + '</small></button>' +
      '<button class="chip-b' + (on ? ' on' : '') + '" data-pa="mbti" data-s="keep"' + (w ? ' disabled' : '') + '>' + L('Behold som ledig hjemmel', 'Keep it as a free right') + '<br><small>' + (w ? mvWhyTxt(w) : L('to spillår · innbytte ', 'two game years · trade-in ') + kr(full - kl)) + '</small></button></div>' +
      (mbTwoTxt(l) ? '<p class="ph-note mb-two"><b>' + mbTwoTxt(l) + '</b></p>' : '') + '</div>'; }
  // the yard's Båthandel: the boats that lie at this quay, and your own to put out
  function mgHere(){
    if (!atKind('verft')) return ''; MBC.load();
    const A = MBC.list().filter(x => x.port === S.boat.port), mine = S.fleet.filter(v => v.id !== S.me || mbSale(v));
    return '<div class="ph-card mg-here"><h4>' + L('Båter til salgs her', 'Boats for sale here') + '</h4>' + (A.length ? A.map(mgCard).join('') : '<p class="ph-note">' + L('Ingen brukte båter ved denne kaia nå. Verftet selger nye til full pris under.', 'No used boats at this quay now. The yard sells new ones at full price below.') + '</p>') +
      (mine.length ? '<h5>' + L('Selg en båt', 'Sell a boat') + '</h5>' + mine.map(v => '<p><b>«' + mgEsc(vget(v, 'boatName')) + '»</b></p>' + mgOwnRow(v, true)).join('') : '') +
      '<button class="ph-btn alt" data-pa="open" data-a="nett" data-s="megler">' + L('Alle båter hos Kystmegleren ›', 'All boats at Kystmegleren ›') + '</button></div>';
  }
  // the answer to a call that went to the server, written on the page it came from
  function mgAfter(key, okNo, okEn){ return r => { mgMsg[key] = r && r.ok ? L(okNo, okEn) : mbWhyTxt(r && r.err, r); MBC.redraw(); }; }
  // the buttons (phone/14-act.js asks this first for the mg* and mb* actions)
  function mgAct(a, d){
    const M = mktState();
    if (a === 'mgsel'){ mgSel = d.id || null; mbPutSel = null; if (mgSel && typeof cloudEv === 'function') cloudEv('mkt_view', {id:mgSel}); if (mgSel) MBC.load(true); return true; }
    if (a === 'mgtab'){ sub.mgtab = d.s; return true; }
    if (a === 'mgsort'){ sub.mgsort = d.s; return true; }
    if (a === 'mgwish'){ const c = (document.getElementById('mgWishC') || {}).value || 'open', mx = +(document.getElementById('mgWishMax') || {}).value || 0; M.wish = {cls:c, max:Math.max(0, Math.round(mx))}; MBC.wish(c, M.wish.max); if (typeof cloudEv === 'function') cloudEv('mkt_wish', {cls:c}); return true; }
    if (a === 'mgwish0'){ M.wish = null; MBC.wish(null, 0); return true; }
    if (a === 'mgdel'){ const v = vesselById(d.id); if (!v) return true; const why = mktDeliver(v.id, d.to); if (why){ toast(why === 'cash' ? t('no_cash') : why === 'sea' ? L('Hun må ligge i havn.', 'She must lie in port.') : why === 'sale' ? L('Hun ligger til salgs.', 'She is for sale.') : L('Det går ikke nå.', 'Not now.')); return true; }
      log('En skipper fra verftet seiler «' + vget(v, 'boatName') + '» til ' + portById(d.to).name + '.', 'A skipper from the yard sails the «' + vget(v, 'boatName') + '» to ' + portById(d.to).name + '.'); if (typeof cloudEv === 'function') cloudEv('mkt_deliver', {nm:Math.round(dist(vget(v, 'boat').pos, portById(d.to).p) / NM)}); return true; }
    if (a === 'mbput'){ const v = vesselById(d.id); if (!v) return true; mbPutSel = v.id; mgSel = null; if (!DRAWER.has(String(app).split(':')[0]) && app !== 'nett'){ app = 'nett'; sub.nett = 'megler'; } return true; }
    if (a === 'mbput0'){ mbPutSel = null; return true; }
    if (a === 'mbhrs'){ sub.mbhrs = +d.h; return true; }
    if (a === 'mbto'){ sub.mbto = d.s; return true; }
    // KM4: the choice in «Legg ut til salgs», the move sheet and the trade-in's choice
    if (a === 'mblic'){ sub.mblic = d.s === 'keep' ? 'keep' : 'with'; return true; }
    if (a === 'mbkeep'){ sub.mbkeep = d.s; return true; }
    if (a === 'mbti'){ sub.tikeep = d.s === 'keep' ? 'keep' : 'with'; return true; }
    if (a === 'mbmv'){ mlSel = d.k ? {key:d.k} : {vid:d.id}; return true; }
    if (a === 'mbmv0'){ mlSel = null; return true; }
    if (a === 'mbmvgo'){ const src = mlSrc(); if (!src){ mlSel = null; return true; } const to = d.to === 'free' ? {free:true} : {v:vesselById(d.to)}, w = mbMoveWhy(src, to); if (w){ toast(mvWhyTxt(w, mbMoveLen(src, to))); return true; }
      const two = mbTwoTxt(src.v ? vget(src.v, 'lic') : null); if (two && !confirm(two + ' ' + L('Flytte hjemmelen likevel?', 'Move the right all the same?'))) return true;
      const r = mbMove(src, to); if (!r.ok){ toast(mvWhyTxt(r.err)); return true; }
      mlSel = null; toast(to.free ? L('Hjemmelen står nå uten båt i rederiet, i høyst to spillår.', 'The right now stands without a boat in the company, for at most two game years.') : L('Hjemmelen er flyttet til «' + vget(to.v, 'boatName') + '».', 'The right is moved to the «' + vget(to.v, 'boatName') + '».'), 6000);
      if (typeof cloudEv === 'function') cloudEv('km_move', {id:r.item.id, to:to.free ? 'free' : 'boat', from:src.v ? 'boat' : 'free'}); if (typeof refreshAll === 'function') refreshAll(); return true; }
    if (a === 'mbputgo'){ const v = vesselById(d.id); if (!v) return true; const keep = mbKeepOf(v), st = Math.round(+(document.getElementById('mbStart') || {}).value || 0), bv = (document.getElementById('mbBuy') || {}).value, bn = bv === '' || bv == null || +bv <= 0 ? null : Math.round(+bv), hrs = MB.hours.includes(+sub.mbhrs) ? +sub.mbhrs : 24;
      mgMsg['put' + v.id] = L('Sender …', 'Sending …');
      MBC.put(v.id, st, bn, hrs, keep).then(r => { if (r && r.ok){ delete mgMsg['put' + v.id]; mbPutSel = null; sub.mblic = null; toast(keep ? L('«' + vget(v, 'boatName') + '» er lagt ut hos Kystmegleren uten hjemmel.', 'The «' + vget(v, 'boatName') + '» is put out at Kystmegleren without a right.') : L('«' + vget(v, 'boatName') + '» er lagt ut hos Kystmegleren.', 'The «' + vget(v, 'boatName') + '» is put out at Kystmegleren.')); } else mgMsg['put' + v.id] = r && r.mv ? mvWhyTxt(r.mv, r.len) : mbWhyTxt(r && r.err, r); MBC.redraw(); });
      return true; }
    if (a === 'mbcancel'){ const id = d.id, kept = S.fleet.some(v => { const s0 = mbSale(v); return s0 && String(s0.lid) === String(id) && s0.kept && !vget(v, 'lic'); });
      MBC.cancel(id).then(r => { if (!(r && r.ok)) toast(mbWhyTxt(r && r.err, r)); else toast(L('Trukket fra salg. Hun er din igjen.', 'Withdrawn. She is yours again.') + (kept ? ' ' + L('Hjemmelen kan settes tilbake med «Flytt hjemmelen til …» i Rederi.', 'The right can be put back with «Move the right to …» in the Company app.') : ''), kept ? 7000 : undefined); MBC.redraw(); }); return true; }
    if (a === 'mbbid'){ const Q = MBC.byId(d.id); if (!Q) return true; const k = Math.round(+(document.getElementById('mbBid') || {}).value || 0);
      mgMsg[Q.id] = L('Sender budet …', 'Sending the bid …'); MBC.bid(Q.id, k, mgTo(Q)).then(mgAfter(Q.id, 'Budet ditt på ' + kr(k) + ' er det høyeste.', 'Your bid of ' + kr(k) + ' is the highest.')); return true; }
    if (a === 'mbbuy'){ const Q = MBC.byId(d.id); if (!Q || !Q.buynow) return true;
      mgMsg[Q.id] = L('Kjøper …', 'Buying …'); MBC.buy(Q.id, mgTo(Q)).then(r => { if (r && r.ok){ mgSel = null; toast(L('Kjøpt: «' + Q.name + '» for ' + kr(Q.buynow) + '.', 'Bought: «' + Q.name + '» for ' + kr(Q.buynow) + '.'), 6000); } else mgMsg[Q.id] = mbWhyTxt(r && r.err, r); MBC.redraw(); }); return true; }
    return false;
  }
