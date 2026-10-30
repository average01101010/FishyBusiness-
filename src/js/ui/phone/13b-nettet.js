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
  // the top of the shop on the quay: the keeper, what is reserved here, and what the boat needs
  function shopTop(cur){
    const pt = portById(S.boat.port); if (!pt || !atKind('butikk')) return '';
    const h = ['<div class="ph-card shop-k"><div class="shop-kp" aria-hidden="true">' + keeperName(pt).charAt(0) + '</div><div><h4>' + (pt.id === 'finnsnes' ? L('Fiskeutstyr på kaia i Finnsnes', 'The tackle shop on the quay in Finnsnes') : L('Butikken i ', 'The shop in ') + pt.name) + '</h4><p class="shop-say"><b>' + keeperName(pt) + ':</b> «' + keeperLine(pt) + '»</p></div></div>'];
    const here = pickAt(pt.id);
    if (here.length){ const tot = here.reduce((a, o) => a + pickKr(o), 0);
      h.push('<div class="ph-card pick"><h4>' + L('Bestilt til henting her', 'Ordered for collection here') + '</h4>' + here.map(o => { const nm = pickName(o);
        return '<div class="pick-r"><span>' + L(nm[0], nm[1]) + '</span><span class="pick-b"><button class="ph-btn p" data-pa="ptake" data-id="' + o.id + '"' + (pickKr(o) > spendable() ? ' disabled' : '') + '>' + L('Hent', 'Fetch') + ' · ' + kr(pickKr(o)) + '</button><button class="ph-btn alt ic-x" data-pa="pdrop" data-id="' + o.id + '" aria-label="' + L('Avbestill', 'Cancel') + '">✕</button></span></div>'; }).join('') +
        (here.length > 1 ? '<button class="ph-btn p" data-pa="ptakeall"' + (tot > spendable() ? ' disabled' : '') + '>' + L('Hent alt', 'Fetch it all') + ' · ' + kr(tot) + '</button>' : '') + '<p class="ph-note">' + L('Betales når du henter.', 'Paid when you fetch it.') + '</p></div>'); }
    const need = buyList();
    if (need.length) h.push('<div class="ph-card buyl"><h4>' + L('Det «' + S.boatName + '» trenger nå', 'What the «' + S.boatName + '» needs now') + '</h4><div class="buyl-c">' + need.map(x => '<button class="chip-b" data-pa="icgo" data-pg="' + x.pg + '" data-id="' + (x.id || 'ic-' + x.k) + '">' + L(x.t[0], x.t[1]) + ' ›</button>').join('') + '</div></div>');
    return h.join('');
  }
  // ---- fetching a reservation: the same purchase as over the counter; null when it went, else why not (a string)
  function equipBuy(k){
    const E = EQUIP[k]; if (!E) return L('Ukjent utstyr.', 'Unknown equipment.');
    if (!atKind(EQ_YARD(k) ? 'verft' : 'butikk')) return L('Det monteres ' + (EQ_YARD(k) ? 'på verftet.' : 'i utstyrsbutikken.'), 'It is fitted ' + (EQ_YARD(k) ? 'at the yard.' : 'at the tackle shop.'));
    if (!equipFits(k, S.boat.type)) return L(E.name.no + ' passer ikke «' + S.boatName + '».', 'The ' + E.name.en + ' does not suit the «' + S.boatName + '».');
    const have = E.multi ? S.equip[k] || 0 : S.equip[k] ? 1 : 0, max = E.multi ? BOAT.jukseMax : 1;
    if (have >= max || (!E.multi && (S.jobs || []).some(j => j.kind === 'fit' && j.k === k))) return L('Det har båten alt.', 'The boat has it already.');
    if (spendable() < E.price) return t('no_cash');
    if (!queueJob({kind:'fit', k, h:fitHours(k), no:'Montering av ' + E.name.no.toLowerCase(), en:'Fitting the ' + E.name.en})) return L('Arbeidskøen er full.', 'The work queue is full.');
    book('redskap', -E.price, E.name.no, E.name.en); achAdd('equip'); shopBought(E.name.no, E.name.en); folkShop();
    log('Kjøpt ' + E.name.no + '. Monteres i verkstedet.', 'Bought the ' + E.name.en + '. Being fitted at the yard.');
    if (typeof cloudEv === 'function') cloudEv('shop_buy', {w:'equip', k}); return null;
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
        '<button class="net-tile" data-pa="sub" data-s="shop"><span class="net-ic">' + icPic('line') + '</span><b>' + L('Nettbutikken', 'The web shop') + '</b><small>' + L('Utstyrsbutikkene langs kysten. Bestill her, hent og betal i butikken.', 'The tackle shops along the coast. Order here, fetch and pay at the shop.') + '</small></button></div>'];
      if (P.length) h.push('<div class="ph-card"><h4>' + L('Bestilt til henting', 'Ordered for collection') + '</h4>' + P.map(o => { const nm = pickName(o); return kv(L(nm[0], nm[1]), portById(o.port).name); }).join('') + '<p class="ph-note">' + L('Hentes og betales i butikken der det er bestilt.', 'Fetched and paid at the shop where it was ordered.') + '</p></div>');
      return h.join('') + '</div>';
    }
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
      h.push(itemCard({k:'net', name:L('Garn', 'Nets'), price:L('fra ', 'from ') + kr(NETTY.bunn.price) + L(' per garn', ' a net'), btns:NETOPT.map(o => ord('net', null, netKey(o[0], o[1]), 10, (o[0] === 'bunn' ? L('Torsk', 'Cod') : o[0] === 'flyt' ? L('Flyt', 'Float') : L('Blåkveite', 'G. halibut')) + ' ' + o[1] + ' mm × 10')).join('')}));
      h.push(itemCard({k:'line', name:L('Line', 'Line'), price:kr(LINE_KINDS.bank.price) + '–' + kr(LINE_KINDS.hyse.price) + L(' per stamp', ' a tub'), btns:['hyse', 'bank'].map(lk => ord('stamp', null, lk, 4, '4 ' + L('stamper ', 'tubs of ') + LINE_KINDS[lk][S.lang].toLowerCase())).join('')}));
      h.push(itemCard({k:'pot', name:L('Krabbeteiner', 'Crab pots'), price:POTS.big.price, btns:ord('pot', null, 'big', 10, '10 ' + POTS.big[S.lang].toLowerCase())}));
      h.push(itemCard({k:'kit', name:L('Blåser og dregg', 'Buoys and anchors'), price:GPRICE.kit, anchor:L('tung dregg ', 'heavy anchor ') + kr(GPRICE.heavy), btns:ord('kit', null, null, 1, L('Blåsesett', 'Buoy set')) + ord('heavy', null, null, 1, L('Tung dregg', 'Heavy anchor'))}));
      h.push(itemCard({k:'hooks', name:L('Kroker og juksasett', 'Hooks and jig sets'), price:CARE.hookKr[100], anchor:L('per 100', 'a 100'), btns:ord('hooks', null, 500, 1, L('500 kroker', '500 hooks')) + ord('hooks', null, 1000, 1, L('1000 kroker', '1000 hooks')) + ord('jig', null, 'mark', 1, L('Juksasett', 'Jig set'))}));
    } else {
      for (const [k, E] of Object.entries(EQUIP)){ if (EQ_YARD(k) || !equipFits(k, b.type)) continue;
        const have = E.multi ? S.equip[k] || 0 : S.equip[k] ? 1 : 0, max = E.multi ? BOAT.jukseMax : 1, r = res('equip', k, null);
        h.push(itemCard({k, name:E.name[S.lang], sub:E.multi ? have + ' / ' + max : '', price:E.price, have:have >= max ? L('Montert', 'Fitted') : r ? at : '', btns:have >= max ? '' : ord('equip', k, null, 1, L('Bestill', 'Order'))})); }
      for (const k of ['olje', 'varme']){ const C = CLOTHES[k], r = res('cloth', k, null); h.push(itemCard({k, name:C[S.lang], price:C.price, have:r ? at : '', btns:ord('cloth', k, null, 1, L('Bestill én', 'Order one'))})); }
    }
    return h.join('') + '</div>';
  }
