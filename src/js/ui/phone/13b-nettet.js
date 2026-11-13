  // ===== Nettet and the tackle shop on the quay (M2 in docs/planer/butikker-og-sponsorer.md, Jonas 30.10.2026) =====
  // Nettet: a small browser on the phone with bookmarks; the first is the web shop of the tackle shops along the coast, which shows the whole
  // range anywhere and reserves at a shop the player picks (core/10c-pick.js). Nothing is paid or given until it is fetched at that shop's
  // quay: «se og bestille hvor som helst, overta på stedet» (docs/handelssteder.md). The shop on the quay gets its keeper, with a name and
  // the place's dialect, the list of what the boat needs now, and what is reserved there, before the cards.
  // ---- the keeper: a name per shop (Finnsnes keeps Solveig, who met you on the first trip), a line by what is going on, in the dialect
  const KEEPERS = ['Arne', 'Kjersti', 'Trond', 'Ragnhild', 'Geir', 'Liv', 'Odd', 'Berit', 'Kåre', 'Torild', 'Bjørn', 'Sigrun'];
  const keeperName = pt => pt.id === 'finnsnes' ? FOLK_NAMES.shop : KEEPERS[Math.abs([...String(pt.id)].reduce((a, c) => a * 31 + c.charCodeAt(0), 11)) % KEEPERS.length];
  function shopMem(pt){ const F = folkState(); F.shops = F.shops || {}; return F.shops[pt.id] || (F.shops[pt.id] = {n:0, day:-1, last:null}); }
  // what was just bought over this counter: the keeper remembers it
  function shopBought(no, en){ const pt = portById(S.boat.port); if (!pt || !atKind('butikk')) return; shopMem(pt).last = [no, en]; }
  function keeperLine(pt){
    const M = shopMem(pt), day = Math.floor(S.t / 1440), first = M.n === 0;
    if (M.day !== day){ M.day = day; M.n++; }
    const need = buyList(), here = pickAt(pt.id), H = S.t / 60;
    let no, en;
    if (first){ no = 'Velkommen innom! Æ heter ' + keeperName(pt) + '. Si fra om det e nåkka du lure på.'; en = 'Welcome in! I am ' + keeperName(pt) + '. Say if there is anything you wonder about.'; }
    else if (here.length){ no = 'Æ har lagt fram det du bestilte. Det ligg her ved disken.'; en = 'I have put out what you ordered. It is here by the counter.'; }
    else if (need.some(x => x.k === 'cloth') && coldPen(H) > 0.05){ no = 'Det e kaldt på sjyen nå. Har alle om bord varmedress?'; en = 'It is cold at sea now. Does everyone aboard have a thermal suit?'; }
    else if (need.some(x => x.k === 'hooks')){ no = 'Lina di treng nye kroker, ser æ. Vi har dem i pakker på hundre og fem hundre.'; en = 'Your line needs new hooks, I see. We have them in packs of a hundred and five hundred.'; }
    else if (M.last){ no = 'Kom du dæ ut med ' + M.last[0].toLowerCase() + '? Det e godt utstyr, det.'; en = 'Did you get out with the ' + M.last[1].toLowerCase() + '? That is good gear.'; }
    else { const g = [['Sjekk været før du går. Det kan snu fort her ute.', 'Check the weather before you go. It can turn fast out here.'], ['Ikkje gå ut uten blåsesett nok til redskapen, du.', 'Do not go out without buoy sets enough for your gear.'],
        ['Det e godt å se folk på kaia igjen.', 'It is good to see people on the quay again.'], ['Æ hørte det står godt med fesk lenger ut. Lykke til.', 'I heard the fishing is good further out. Good luck.']][day % 4]; no = g[0]; en = g[1]; }
    return L(dialectText(dialectAt(pt.p), no), en);
  }
  // ---- what the boat needs now, from her own state: each a chip that takes you to its card
  function buyList(){
    const b = S.boat, pg = S.pgear ? careInit(S.pgear) : null, out = [], people = 1 + S.crew.length, c = S.clothes || {};
    if (!b.gear) out.push({k:'jig', pg:'fiske', t:['Håndjuksa', 'Hand jig']});
    if (pg){
      for (const lk of ['hyse', 'bank']){ const L0 = pg.lines[lk], need = L0.n ? hooksNeed(lk) : 0;
        if (need > 0 && pg.hooks < need) out.push({k:'hooks', pg:'fiske', t:['Kroker til ' + LINE_KINDS[lk].no.toLowerCase() + ' (' + need + ' må byttes)', 'Hooks for the ' + LINE_KINDS[lk].en.toLowerCase() + ' (' + need + ' to change)']});
        if (L0.n && L0.max <= 0.45) out.push({k:'line', pg:'fiske', t:['Ny ' + LINE_KINDS[lk].no.toLowerCase() + ' (den gamle er slitt)', 'New ' + LINE_KINDS[lk].en.toLowerCase() + ' (the old is worn)']}); }
      if (pg.nets.some(l => l.cond < 0.3)) out.push({k:'net', pg:'fiske', t:['Nye garn (noen er i filler)', 'New nets (some are in rags)']});
      if (b.gear && pg.jig.mark.c < 0.5 && !pg.jig.mark.n) out.push({k:'hooks', pg:'fiske', t:['Nytt juksasett', 'A new jig set']});
      if ((ownedUnits('line') || ownedUnits('garn') || ownedUnits('teine')) && !pg.kits.n) out.push({k:'kit', pg:'fiske', t:['Blåsesett til redskapen', 'Buoy sets for the gear']});
    }
    if ((c.olje || 0) < people || (c.varme || 0) < people) out.push({k:'cloth', pg:'utstyrb', id:'ic-varme', t:['Klær til alle om bord', 'Clothes for everyone aboard']});
    return out.filter((x, i, a) => a.findIndex(y => y.t[0] === x.t[0]) === i);
  }
  // the top of the shop on the quay (D3, 13.11.2026: one compact top in place of four boxes, so the first item stands above the fold):
  // the place and that you are here, the keeper's line, what is reserved here, what the boat needs as chips, and under Elektronikk og
  // haler what a fitting binds. ui/10c-dock.js dress() leaves its own «Du er her» off these pages (OWNTOP)
  function shopTop(cur){
    const pt = portById(S.boat.port); if (!pt || !atKind('butikk')) return '';
    const kn = keeperName(pt), h = ['<div class="shop-top"><div class="shop-k"><div class="shop-kp" aria-hidden="true">' + kn.charAt(0) + '</div><div class="st-t"><div class="st-h"><b>' + pt.name + '</b><span class="st-here">' + L('Du er her', 'You are here') + '</span></div><p class="shop-say"><b>' + kn + ':</b> «' + keeperLine(pt) + '»</p></div></div>'];
    const here = pickAt(pt.id);
    if (here.length){ const tot = here.reduce((a, o) => a + pickKr(o), 0);
      h.push('<div class="pick"><h4>' + L('Bestilt til henting her', 'Ordered for collection here') + ' <small>' + L('betales når du henter', 'paid when you fetch it') + '</small></h4>' + here.map(o => { const nm = pickName(o);
        return '<div class="pick-r"><span>' + L(nm[0], nm[1]) + '</span><span class="pick-b"><button class="ph-btn p" data-pa="ptake" data-id="' + o.id + '"' + (pickKr(o) > spendable() ? ' disabled' : '') + '>' + L('Hent', 'Fetch') + ' · ' + kr(pickKr(o)) + '</button><button class="ph-btn alt ic-x" data-pa="pdrop" data-id="' + o.id + '" aria-label="' + L('Avbestill', 'Cancel') + '">✕</button></span></div>'; }).join('') +
        (here.length > 1 ? '<button class="ph-btn p" data-pa="ptakeall"' + (tot > spendable() ? ' disabled' : '') + '>' + L('Hent alt', 'Fetch it all') + ' · ' + kr(tot) + '</button>' : '') + (here.some(o => o.w === 'equip') ? '<small class="ic-sub">' + fitSays() + '</small>' : '') + '</div>'); }   // (equipment fetched is fitted: the same binding as bought over the counter)
    const need = buyList();
    if (need.length) h.push('<div class="buyl"><span class="st-l">' + L('«' + S.boatName + '» trenger nå', 'The «' + S.boatName + '» needs now') + '</span><div class="buyl-c">' + need.map(x => '<button class="chip-b" data-pa="icgo" data-pg="' + x.pg + '" data-id="' + (x.id || 'ic-' + x.k) + '">' + L(x.t[0], x.t[1]) + ' ›</button>').join('') + '</div></div>');
    if (cur === 'utstyrb') h.push('<p class="st-fit">' + fitSays() + ' <button type="button" class="ic-more" data-pa="open" data-a="handbok" data-hbid="lex_montering">' + L('Mer om montering ›', 'More on fitting ›') + '</button></p>');
    return h.join('') + '</div>';
  }
  // the line under a buy button (D3): the fitting's time and that she lies until it is done, and, where the button asks «Bekreft · kr»
  // first (from IC_CONFIRM_KR: phone/14-act.js), that it does, before the tap
  const buySub = (price, fits, confirms) => { const t = [fits ? L('Montering ' + durBoth(YARD_H * 60) + '. Båten ligger i havn imens.', 'Fitting ' + durBoth(YARD_H * 60) + '. The boat stays in port meanwhile.') : '', confirms && price >= IC_CONFIRM_KR ? L('Du bekrefter før kjøpet.', 'You confirm before you buy.') : ''].filter(Boolean).join(' ');
    return t ? '<small class="ic-sub">' + t + '</small>' : ''; };
  // what a fitting binds, in one sentence (D3): the yard's time in both clocks, and that she lies in port until it is done (a departure
  // waits for the yard's jobs: ui/08-actions.js depnow, core/05-vessels.js)
  const fitSays = () => L('Montering tar ' + durBoth(YARD_H * 60) + ', og båten ligger i havn til den er ferdig.', 'Fitting takes ' + durBoth(YARD_H * 60) + ', and the boat stays in port until it is done.');
  // ---- fetching a reservation: the same purchase as over the counter; null when it went, else why not (a string)
  // trying gear on the boat in 3D before it is bought (M3): what was tried this session, for the measure (shop_buy tried, shop_try)
  const TRIED = new Set();
  const tryable = k => typeof G3 !== 'undefined' && !!G3.tryView && (G3.TRY3D || []).includes(k) && S.boat.status === 'port' && !S.boat.land && equipFits(k, S.boat.type);
  function equipTry(k){ if (!tryable(k)) return; const on = G3.trying === k; G3.tryView(on ? null : k); if (!on){ TRIED.add(k); if (typeof cloudEv === 'function') cloudEv('shop_try', {k}); } }
  const tryBtn = k => !tryable(k) ? '' : '<button class="ph-btn alt" data-pa="eqtry" data-k="' + k + '"' + (G3.trying === k ? ' aria-pressed="true"' : '') + '>' + (G3.trying === k ? L('Ta av igjen', 'Take it off') : L('Se den på båten', 'See it on the boat')) + '</button>';
  function equipBuy(k){
    const E = EQUIP[k]; if (!E) return L('Ukjent utstyr.', 'Unknown equipment.');
    // the knives and the gaff in tiers (OPP1): the next tier, paid and aboard at once at the tackle shop's quay (core/10-gear.js tierBuy,
    // which asks buyGate); no fitting and no hoist. (OPP2) The same for the tiers of the haulers, the reels, the line setter and the jig
    // sets, which are items of their own (linehalerLv …)
    if (E.tiers){ const lv = equipLv(k) + 1, why = buyGear('tier', k, lv); if (why) return why[0]; const T = E.tiers[lv - 1];
      achAdd('equip'); shopBought(T.no, T.en); folkShop(); if (typeof cloudEv === 'function') cloudEv('shop_buy', {w:'equip', k, lv}); return null; }
    if (!atKind(EQ_YARD(k) ? 'verft' : 'butikk')) return L('Det monteres ' + (EQ_YARD(k) ? 'på verftet.' : 'i utstyrsbutikken.'), 'It is fitted ' + (EQ_YARD(k) ? 'at the yard.' : 'at the tackle shop.'));
    if (!equipFits(k, S.boat.type)) return L(E.name.no + ' passer ikke «' + S.boatName + '».', 'The ' + E.name.en + ' does not suit the «' + S.boatName + '».');
    // (what the rules ask for follows the boat and is never sold to her: V6 A, core/02-species-gear.js reqOf)
    if ((VESSELS[S.boat.type].req || []).includes(k)){ reqFill(S.equip, S.boat.type); return L(E.name.no + ' er påbudt og følger med båten.', 'The ' + E.name.en + ' is required and comes with the boat.'); }
    const have = E.multi ? S.equip[k] || 0 : S.equip[k] ? 1 : 0, max = E.multi ? BOAT.jukseMax : 1;
    if (have >= max || (!E.multi && (S.jobs || []).some(j => j.kind === 'fit' && j.k === k))) return L('Det har båten alt.', 'The boat has it already.');
    // (OPP2: the line setter and the net chute hang on their hauler, core/10-gear.js buyGate; a reel comes at the boat's tier, equipKr)
    { const why = buyGate('equip', k); if (why) return why[0]; }
    const price = equipKr(k);
    if (spendable() < price) return t('no_cash');
    if (!queueJob({kind:'fit', k, kr:price, h:fitHours(k), no:'Montering av ' + E.name.no.toLowerCase(), en:'Fitting the ' + E.name.en})) return L('Arbeidskøen er full.', 'The work queue is full.');   // (kr: what was paid, for a pay-back: a reel at a tier costs more than EQUIP's price)
    book('redskap', -price, E.name.no, E.name.en); achAdd('equip'); shopBought(E.name.no, E.name.en); folkShop();
    log('Kjøpt ' + E.name.no + '. Monteres i verkstedet.', 'Bought the ' + E.name.en + '. Being fitted at the yard.');
    // the moment it is bought: it is lifted aboard on your own boat in 3D (M3, 10 s), and the measure says whether it was tried on first
    const tried = TRIED.has(k); TRIED.delete(k); if (typeof G3 !== 'undefined' && G3.tryView){ G3.tryView(null); G3.hoist(k); }
    if (typeof cloudEv === 'function') cloudEv('shop_buy', {w:'equip', k, tried}); return null;
  }
  function clothBuy(k){
    const C = CLOTHES[k], people = 1 + S.crew.length, have = (S.clothes || {})[k] || 0; if (!C) return L('Ukjent plagg.', 'Unknown clothing.');
    if (have >= people) return L('Alle om bord har.', 'Everyone aboard has one.');
    if (spendable() < C.price) return t('no_cash');
    book('land', -C.price, C.no, C.en); S.clothes = S.clothes || {olje:0, varme:0}; S.clothes[k] = have + 1; shopBought(C.no, C.en); folkShop();
    log('Kjøpte ' + C.no.toLowerCase() + '.', 'Bought ' + C.en.toLowerCase() + '.'); if (typeof cloudEv === 'function') cloudEv('shop_buy', {w:'cloth', k}); return null;
  }
  function pickTake(o){
    if (!o) return L('Bestillingen finnes ikke.', 'The order is gone.');
    if (S.boat.status !== 'port' || S.boat.port !== o.port || !atKind('butikk')) return L('Hentes i butikken i ' + portById(o.port).name + '.', 'Fetched at the shop in ' + portById(o.port).name + '.');
    let why = null;
    if (o.w === 'equip') why = equipBuy(o.k);
    else if (o.w === 'cloth') why = clothBuy(o.k);
    else if (o.w === 'shop'){ const r = shopBuy(o.k, 0, false); why = r ? L(r[0], r[1]) : null; }
    else { const r = buyGear(o.w, o.s, o.n); why = r ? r[0] : null; if (!why){ achAdd('equip'); const nm = pickName(o); shopBought(nm[0], nm[1]); } }
    if (why) return why;
    pickDrop(o.id); if (typeof cloudEv === 'function') cloudEv('shop_buy', {w:o.w, k:o.k || o.s, how:'pick'});
    return null;
  }
  // ---- the Net: the bookmarks, and the web shop
  const pickShop = () => { const own = S.pickShop && pickShopOk(S.pickShop) ? S.pickShop : null; return own || (placesNear(S.boat.pos, 'butikk', 1)[0] || {pt:{id:null}}).pt.id; };
  function nett(){
    const tab = sub.nett || 'home';
    if (tab === 'home'){
      const P = pickState(), h = ['<div class="ph-c"><div class="net-bar">detstorebla.no</div><div class="net-tiles">' +
        '<button class="net-tile" data-pa="sub" data-s="shop"><span class="net-ic">' + icPic('line') + '</span><b>' + L('Nettbutikken', 'The web shop') + '</b><small>' + L('Utstyrsbutikkene langs kysten. Bestill her, hent og betal i butikken.', 'The tackle shops along the coast. Order here, fetch and pay at the shop.') + '</small></button>' +
        '<button class="net-tile" data-pa="sub" data-s="megler"><span class="net-ic">' + vesselSVG('sjark') + '</span><b>Kystmegleren</b><small>' + (MBC.list().length ? L('Båter fra andre spillere: ' + MBC.list().length + ' til salgs.', 'Boats from other players: ' + MBC.list().length + ' for sale.') : L('Båter spillerne selger til hverandre.', 'Boats players sell to each other.')) + (mbWishHits(MBC.list()).length ? ' <b>' + L(mbWishHits(MBC.list()).length + ' passer ønsket ditt.', mbWishHits(MBC.list()).length + ' match your wish.') + '</b>' : '') + '</small></button></div>'];
      if (P.length) h.push('<div class="ph-card"><h4>' + L('Bestilt til henting', 'Ordered for collection') + '</h4>' + P.map(o => { const nm = pickName(o); return kv(L(nm[0], nm[1]), portById(o.port).name); }).join('') + '<p class="ph-note">' + L('Hentes og betales i butikken der det er bestilt.', 'Fetched and paid at the shop where it was ordered.') + '</p></div>');
      return h.join('') + '</div>';
    }
    if (tab === 'megler') return megler();
    return netShop();
  }
  function netShop(){
    const sp = pickShop(), spt = sp && portById(sp), b = S.boat, st = sub.nettab || 'gear', h = ['<div class="ph-c"><button class="ph-btn alt mkback" data-pa="sub" data-s="home">‹ ' + L('Nettet', 'The Net') + '</button>'];
    if (!spt) return h.join('') + '<p class="ph-note">' + L('Ingen utstyrsbutikk i nærheten.', 'No tackle shop nearby.') + '</p></div>';
    // where to fetch it: the three nearest shops, and the one chosen if it is further off
    const near = placesNear(b.pos, 'butikk', 3).map(x => x.pt); if (!near.some(p => p.id === sp)) near.push(spt);
    h.push('<div class="ph-card"><h4>' + L('Hentes i', 'Fetch at') + '</h4><div class="net-shops">' + near.map(p => '<button class="chip-b' + (p.id === sp ? ' on' : '') + '" data-pa="pshop" data-id="' + p.id + '">' + p.name + ' · ' + fmt(dist(b.pos, p.p) / NM, 1) + ' nm</button>').join('') + '</div><p class="ph-note">' + L('Du bestiller nå og betaler når du henter. Utstyr monteres der.', 'You order now and pay when you fetch it. Equipment is fitted there.') + '</p></div>');
    h.push('<div class="ph-sub">' + [['gear', 'Redskap', 'Gear'], ['eq', 'Elektronikk og haler', 'Electronics and haulers']].map(([k, no, en]) => '<button class="' + (st === k ? 'on' : '') + '" data-pa="nettab" data-s="' + k + '">' + L(no, en) + '</button>').join('') + '</div>');
    const res = (w, k, s) => pickAt(sp).find(o => o.w === w && (o.k || null) === (k || null) && String(o.s == null ? '' : o.s) === String(s == null ? '' : s));
    const ord = (w, k, s, n, lbl) => { const gate = PICK_GEAR.includes(w) ? buyGate(w, s) : null, r = res(w, k, s), once = !PICK_GEAR.includes(w) || w === 'hooks' || w === 'jig';
      if (gate) return '<p class="ph-note"><b>' + gate[0] + '</b></p>';
      if (r && once) return '<button class="ph-btn alt" data-pa="pdrop" data-id="' + r.id + '">' + L('Bestilt · avbestill', 'Ordered · cancel') + '</button>';
      return '<button class="ph-btn p" data-pa="pord" data-w="' + w + '" data-k="' + (k || '') + '" data-s="' + (s == null ? '' : s) + '" data-n="' + (n || 1) + '">' + lbl + (r ? L(' (+' + r.n + ' bestilt)', ' (+' + r.n + ' ordered)') : '') + '</button>'; };
    const at = L('Bestilt i ', 'Ordered at ') + spt.name;
    if (st === 'gear'){
      h.push(itemCard({k:'jig', name:L('Håndjuksa', 'Hand jig'), price:PRICE.gear, have:b.gear ? L('Om bord', 'Aboard') : '', btns:b.gear ? '' : ord('shop', 'jig', null, 1, L('Bestill', 'Order'))}));
      h.push(itemCard({k:'kgear', name:L('Kveiteutstyr', 'Halibut gear'), price:PRICE.kgear, have:b.kgear ? L('Om bord', 'Aboard') : '', btns:b.kgear ? '' : ord('shop', 'kgear', null, 1, L('Bestill', 'Order'))}));
      h.push(itemCard({k:'net', name:L('Garn', 'Nets'), price:L('fra ', 'from ') + kr(NETTY.bunn.price) + L(' per garn', ' a net'), btns:NETOPT.map(o => ord('net', null, netKey(o[0], o[1]), 10, L(NETTY[o[0]].no, NETTY[o[0]].en) + ' ' + o[1] + ' mm × 10')).join('')}));
      h.push(itemCard({k:'line', name:L('Line', 'Line'), price:kr(LINE_KINDS.bank.price) + '–' + kr(LINE_KINDS.hyse.price) + L(' per stamp', ' a tub'), btns:['hyse', 'bank'].map(lk => ord('stamp', null, lk, 4, '4 ' + L('stamper ', 'tubs of ') + LINE_KINDS[lk][S.lang].toLowerCase())).join('')}));
      h.push(itemCard({k:'pot', name:L('Krabbeteiner', 'Crab pots'), price:POTS.big.price, body:'<p class="ic-have">' + KC_WHERE() + '</p>', btns:ord('pot', null, 'big', 10, '10 ' + POTS.big[S.lang].toLowerCase())}));
      h.push(itemCard({k:'kit', name:L('Blåsesett: staur, blåse og dregg', 'Buoy set: pole, buoy and anchor'), price:GPRICE.kit, anchor:L('tung dregg ', 'heavy anchor ') + kr(GPRICE.heavy), btns:ord('kit', null, null, 1, L('Blåsesett', 'Buoy set')) + ord('heavy', null, null, 1, L('Tung dregg', 'Heavy anchor'))}));
      h.push(itemCard({k:'hooks', name:L('Kroker og juksasett', 'Hooks and jig sets'), price:CARE.hookKr[100], anchor:L('per 100', 'a 100'), btns:ord('hooks', null, 500, 1, L('500 kroker', '500 hooks')) + ord('hooks', null, 1000, 1, L('1000 kroker', '1000 hooks')) + ord('jig', null, 'mark', 1, L('Juksasett', 'Jig set'))}));
    } else {
      for (const [k, E] of Object.entries(EQUIP)){ if (EQ_YARD(k) || E.tiers || !equipFits(k, b.type)) continue;   // (the tiers are bought at the shop, OPP1 and OPP2)
        const have = E.multi ? S.equip[k] || 0 : S.equip[k] ? 1 : 0, max = E.multi ? BOAT.jukseMax : 1, r = res('equip', k, null), fj = (S.jobs || []).find(j => j.kind === 'fit' && j.k === k), nd = !have && buyGate('equip', k);
        // (one being fitted shows so, with when; before, the tab offered it again and the fetch said «Det har båten alt»)
        const fitTxt = fj && !E.multi ? L('Til montering', 'Being fitted') + (fj.until != null ? ' · ' + L('ferdig kl. ', 'done at ') + hm(fj.until / 60) : '') : '';
        h.push(itemCard({k, name:E.name[S.lang], sub:E.multi ? have + ' / ' + max : '', price:equipKr(k), have:have >= max ? L('Montert', 'Fitted') : fitTxt || (r ? at : ''), btns:have >= max || fitTxt ? '' : nd && !r ? '<p class="ph-note"><b>' + nd[0] + '</b></p>' : ord('equip', k, null, 1, L('Bestill', 'Order'))})); }
      for (const k of ['olje', 'varme']){ const C = CLOTHES[k], r = res('cloth', k, null); h.push(itemCard({k, name:C[S.lang], price:C.price, have:r ? at : '', btns:ord('cloth', k, null, 1, L('Bestill én', 'Order one'))})); }
    }
    return h.join('') + '</div>';
  }
