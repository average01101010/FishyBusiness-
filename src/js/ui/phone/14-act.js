  const NAV = new Set(['open', 'home', 'back', 'close', 'lang', 'sub', 'shop0', 'shopgear', 'salgW', 'salgG', 'vsel', 'goto', 'vfollow', 'vboard', 'vname', 'vsell', 'lopcls']);
  function act(a, d){
    const was = app, done = SEL_APPS.includes(app) && !NAV.has(a) ? withSel(() => act0(a, d)) : act0(a, d);
    // a link to a page that lives in the drawer now (Neste mål, Rederi's «Åpne») closes the phone and opens the drawer
    if (DRAWER.has(String(app).split(':')[0])){ const to = app; app = DRAWER.has(was) ? 'home' : was; show(false); DOCK.open(to); return; }
    if (done) { save(); renderHud(); renderClock(); panelDirty = true; render(); }
  }
  // ---- the receipt after a buy for kroner (Jonas 06.11.2026, Tony's test: «Det skal ikke være tvil om et kjøp er gjennomført»): one
  // toast for every path (the counter, the gear, the Net's fetch, the yard's orders): what, what it cost (the till before and after),
  // how many are aboard now, and for equipment when the fitting is done (the job's until), with a tick of the till
  let buyC0 = null;
  const buyMark = () => { buyC0 = S.cash; };
  function ownedTxt(w, s){
    const pg = S.pgear ? careInit(S.pgear) : null, people = 1 + S.crew.length;
    if (!pg) return '';
    if (w === 'net'){ const n = pg.nets.reduce((a, l) => a + l.n, 0); return L(n + ' garn om bord', n + ' nets aboard'); }
    if (w === 'stamp'){ const n = (pg.lines[s] || {n:0}).n; return L(n + ' stamper ' + (LINE_KINDS[s] ? LINE_KINDS[s].no.toLowerCase() : '') + ' om bord', n + ' tubs of ' + (LINE_KINDS[s] ? LINE_KINDS[s].en.toLowerCase() : '') + ' aboard'); }
    if (w === 'pot'){ const n = pg.pots[s] || 0; return L(n + ' teiner om bord', n + ' pots aboard'); }
    if (w === 'kit') return L(pg.kits.n + ' blåsesett om bord', pg.kits.n + ' buoy sets aboard');
    if (w === 'heavy') return L(pg.kits.heavy + ' tunge dregger', pg.kits.heavy + ' heavy anchors');
    if (w === 'hooks') return L(pg.hooks + ' kroker på lager', pg.hooks + ' hooks in store');
    if (w === 'jig'){ const n = pg.jig && pg.jig[s] ? pg.jig[s].n : 0; return L(n + ' sett på lager', n + ' sets in store'); }
    if (w === 'bait'){ const n = Object.values(baitOf(pg)).reduce((a, v) => a + v, 0); return L(fmt(n, 0) + ' kg agn om bord', fmt(n, 0) + ' kg bait aboard'); }
    if (w === 'equip'){ const E = EQUIP[s]; if (!E) return ''; if (E.multi) return (S.equip[s] || 0) + ' / ' + BOAT.jukseMax + L(' montert', ' fitted'); if (E.tiers) return L('trinn ', 'tier ') + equipLv(s) + ' / ' + E.tiers.length + L(' om bord', ' aboard'); return ''; }
    if (w === 'cloth'){ const n = Math.min((S.clothes || {})[s] || 0, people); return n + ' / ' + people + L(' om bord har', ' aboard have one'); }
    return '';
  }
  function receipt(nm, w, s){
    const paid = buyC0 == null ? 0 : Math.round(buyC0 - S.cash); buyC0 = null;
    const j = w === 'equip' ? (S.jobs || []).find(x => x.kind === 'fit' && x.k === s) : w === 'yard' ? (S.jobs || []).find(x => x.kind === s) : null;
    const parts = ['✓ ' + (w === 'yard' ? L('Bestilt: ', 'Ordered: ') : L('Kjøpt: ', 'Bought: ')) + nm];
    if (paid > 0) parts.push('−' + kr(paid)); else if (paid === 0 && w !== 'yard') parts.push(L('gratis', 'free'));
    const own = w === 'yard' ? '' : ownedTxt(w, s); if (own) parts.push(own);
    if (j) parts.push(j.until != null ? L('ferdig kl. ', 'done at ') + hm(j.until / 60) + ' (' + inReal(j.until - S.t) + ')' : L('monteres når båten er i havn', 'fitted when the boat is in port'));
    toast(parts.join(' · '), 6000);
    try { if (typeof SND !== 'undefined' && SND.coin) SND.coin(0.6); } catch (e){}
  }
  function act0(a, d){
    const b = S.boat;
    if (a !== 'shop' && a !== 'equip' && a !== 'propup') shopPend = null;
    if ((/^adm/.test(a) || (a === 'open' && d.a === 'admin')) && !adminOk()) return false;   // the Admin app is only Jonas's (adminOk)
    if (a === 'open' && d.a === 'garderobe'){ show(false); WARD.open(); return; }      // the wardrobe is a sheet of its own (ui/10g-wardrobe.js)
    if (a === 'open' && d.a === 'nett'){ sub.nett = d.s || 'home'; if (sub.nett === 'shop' && typeof cloudEv === 'function') cloudEv('shop_view', {pg:'nett'}); }
    if (a === 'sub' && app === 'nett' && d.s === 'shop' && typeof cloudEv === 'function') cloudEv('shop_view', {pg:'nett'});
    if (a === 'open' && d.a === 'handbok' && typeof HBUI !== 'undefined') HBUI.only = d.hbid || null;   // an item card's «Mer» opens its one entry (ui/05a-itemcard.js)
    if (a === 'open'){ appSeen(d.a); app = d.a === 'kaiboden' ? kbLast : d.a; confirmMayday = false; if (d.s) sub[d.a] = d.s; if (d.a === 'post') sub.postArt = null; }
    else if (a === 'home'){ app = 'home'; }
    else if (a === 'back'){ app = 'home'; }
    else if (a === 'shop'){ const k = d.k, kg = +d.kg || 0; if (!shopPend || shopPend.k !== k || shopPend.kg !== kg || Date.now() - shopPend.t > IC_CONFIRM_MS){ shopPend = {k, kg, t:Date.now()}; return true; } shopPend = null; const free = tutFree(k); buyMark(); const why = shopBuy(k, kg, free); if (why){ toast(L(why[0], why[1])); } else { if (free){ if (k === 'ice') S.iceFree = 0; tutMark('free_' + k); } if (k !== 'ice') shopBought(k === 'jig' ? 'Håndjuksa' : 'Kveiteutstyr', k === 'jig' ? 'Hand jig' : 'Halibut gear'); if (typeof cloudEv === 'function') cloudEv('shop_buy', {w:'shop', k}); receipt(k === 'ice' ? L(fmt(kg, 0) + ' kg is', fmt(kg, 0) + ' kg ice') : k === 'jig' ? L('Håndjuksa', 'Hand jig') : L('Kveiteutstyr', 'Halibut gear'), 'shop', k); } }
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
    else if (a === 'admCash'){ book('annet', 100000, 'Admin', 'Admin'); log('Admin: 100 000 kr lagt i kassa.', 'Admin: NOK 100,000 put in the cash.'); }
    else if (a === 'saveOut'){ saveCode().then(c => { saveBox = {mode:'out', text:c || ''}; render(); const ta = document.getElementById('saveCode'); if (ta){ ta.focus(); ta.select(); } if (c && navigator.clipboard) navigator.clipboard.writeText(c).then(() => toast(L('Lagringen er kopiert.', 'The save is copied.'))).catch(() => {}); }); return; }
    else if (a === 'saveIn'){ saveBox = {mode:'in', text:''}; }
    else if (a === 'installGo'){ INSTALL.go('settings'); }
    else if (a.startsWith('cloud') && cloudAct(a, d)){ /* the account card (ui/10f-cloud.js) */ }
    else if (a === 'saveLoad'){ const ta = document.getElementById('saveCode'); loadCode(ta ? ta.value : '').then(() => { try { sessionStorage.setItem('dsb_force', '1'); } catch (e){} toast(L('Spillet er lest inn. Siden lastes på nytt.', 'The game is read in. The page loads again.')); setTimeout(() => location.reload(), 700); }).catch(() => toast(L('Koden kunne ikke leses.', 'The code could not be read.'))); return; }
    else if (a === 'admEnergy'){ S.adm = S.adm || {}; S.adm.noEnergy = !S.adm.noEnergy;
      if (S.adm.noEnergy){ S.sleep = null; S.energy = 100; S.drowsy = false; S.enWarn = false; log('Admin: energien er skrudd av. Du blir ikke sliten og sovner ikke.', 'Admin: energy is off. You do not tire or fall asleep.'); }
      else log('Admin: energien er skrudd på igjen.', 'Admin: energy is on again.'); }
    else if (a === 'admHopp'){ S.adm = S.adm || {}; S.adm.hopp = !S.adm.hopp; log(S.adm.hopp ? 'Admin: spoleknappen er på (test, hoppet er gratis).' : 'Admin: spoleknappen er av.', S.adm.hopp ? 'Admin: the fast-forward button is on (test, the hop is free).' : 'Admin: the fast-forward button is off.'); }
    else if (a === 'admFuel'){ const b = S.boat, add = Math.max(0, BOAT.fuelCap - b.fuel); b.fuel = BOAT.fuelCap; if (b.status === 'adrift' && add > 0) b.status = 'idle'; log('Admin: tanken fylt (' + fmt(add) + ' L).', 'Admin: the tank filled (' + fmt(add) + ' L).'); }
    else if (a === 'hbshow'){ HBUI.show(d.id); return; }   // «Vis meg» in Håndboka: the phone closes and the tip points (07c-handbook.js)
    else if (a === 'hbskip'){ HBUI.toggle(+d.ch); }
    else if (a === 'hball'){ HBUI.only = null; }
    else if (a === 'sub'){ sub[app] = d.s; if (app === 'post') sub.postArt = null; }
    else if (a === 'acy') sub.acy = d.y;                // the year shown in the bank's accounts
    else if (a === 'bkmv'){ const B = bankS(), k = d.k === 'skatt' ? 'skatt' : 'spare', v = d.v === '-all' ? -B[k] : +d.v; if (!bankMove(k, v)) toast(L(v > 0 ? 'Brukskontoen er tom.' : 'Kontoen er tom.', v > 0 ? 'The current account is empty.' : 'The account is empty.')); }
    else if (a === 'bkauto'){ const B = bankS(); if (d.v === 'auto') B.auto = true; else { B.auto = false; B.pct = clamp(+d.v || 0.4, 0, 0.6); } }
    else if (a === 'bksp'){ bankS().spPct = clamp(+d.v || 0, 0, 0.5); }
    else if (a === 'ledmore') ledN += 50;             // more of the bank's statement
    else if (a === 'art'){ sub.postArt = d.k; }
    else if (a === 'artback'){ sub.postArt = null; }
    else if (a === 'zlic'){ if (zoneLicApply(d.k)) toast(L('Lisensen er gitt.', 'The licence is granted.')); }   // H1b R4: a licence for a foreign zone (03e-rules.js)
    else if (a === 'ruchk'){ const c = ruChk(); c[d.k] = /^-?\d+(\.\d+)?$/.test(d.v) ? +d.v : d.v === 'null' ? null : d.v; S.ruChk = c; sub.regler = 'sjekk'; }
    else if (a === 'salgW'){ sub.salgW = d.s; }
    else if (a === 'salgG'){ sub.salgG = d.s; }
    else if (a === 'tow'){ rescue(true); toast(L('Redningsskøyta er på vei.', 'The rescue boat is on its way.')); }
    else if (a === 'unstuck'){ const why = unstuck(); toast(why ? L(why[0], why[1]) : L('Båten ligger nå på trygt vann.', 'The boat now lies on safe water.')); if (!why && typeof refreshAll === 'function') refreshAll(); }
    else if (a === 'mayday'){ confirmMayday = true; }
    else if (a === 'mayday0'){ confirmMayday = false; }
    else if (a === 'mayday2'){ confirmMayday = false; rescue(false); toast(L('Redningsskøyta er på vei.', 'The rescue boat is on its way.')); }
    else if (a === 'member'){ if (spendable() < PRICE.member){ toast(t('no_cash')); return; } book('forsikring', -PRICE.member, 'Medlemskap i redningstjenesten', 'Rescue service membership'); S.member = true; log('Ble medlem i redningstjenesten.', 'Joined the rescue service.'); }
    else if (a === 'svc'){ const c = d.m === 'self' ? Math.round(svcCostOf(b) * 0.35) : svcCostOf(b), hh = d.m === 'self' ? 2 * YARD_H : YARD_H; if (spendable() < c){ toast(t('no_cash')); return; } if (!queueJob({kind:'svc', h:hh, self:d.m === 'self', no:d.m === 'self' ? 'Egen service på motoren' : 'Service på verkstedet', en:d.m === 'self' ? 'Servicing the engine yourself' : 'Engine service at the yard'})){ toast(L('Arbeidskøen er full.', 'The work queue is full.')); return; } book('verft', -c, d.m === 'self' ? 'Deler til motorservice' : 'Motorservice', d.m === 'self' ? 'Parts for the engine service' : 'Engine service'); }
    else if (a.slice(0, 3) === 'wk-'){ if (!WORK.act(a, d)) return; }
    else if (a.slice(0, 3) === 'p2-'){ if (!PLAN2UI.act(a, d)) return; }   // Driftsplan 2 (ui/05d-plan2.js)
    // Autonav to a named place from the phone: the chart plotter opens on it and finds the way; «Kast loss» is for the player (Jonas 07.10.2026)
    else if (a === 'goplace'){ const q = portById(d.id); if (!q) return; show(false); if (typeof DOCK !== 'undefined' && DOCK.close) DOCK.close(); if (S.draft.length) draftEdit(() => { S.draft = []; }); openPlotter(); view.cx = q.p.x; view.cy = q.p.y; setTimeout(() => leiaTo({x:q.p.x, y:q.p.y}), 450); return; }
    else if (a === 'rig'){ const why = rigSet(d.r); if (why){ toast(why[0]); return; } }
    else if (a === 'grpref'){ if (BAITS[d.k]) S.pgear.baitPref = d.k; }
    else if (a === 'grown'){ const got = baitFromHold(d.k, +d.n || 0); if (got > 0) toast(fmt(got, 0) + ' kg ' + SPECIES[d.k][S.lang].toLowerCase() + L(' er agn nå.', ' is bait now.')); }
    else if (a === 'grbuy'){ const s0 = isNaN(+d.s) ? d.s : +d.s; buyMark(); const why = buyGear(d.w, s0, +d.n); if (why){ toast(why[0]); return; } achAdd('equip'); const nm = pickName({w:d.w, s:s0, n:+d.n}); if (d.w !== 'bait') shopBought(nm[0], nm[1]); if (typeof cloudEv === 'function') cloudEv('shop_buy', {w:d.w, k:d.s}); receipt(L(nm[0], nm[1]), d.w, s0); }
    // the Net's web shop (13b-nettet.js, core/10c-pick.js): the shop to fetch at, reserving, cancelling, fetching at the counter
    else if (a === 'pshop'){ if (pickShopOk(d.id)) S.pickShop = d.id; }
    else if (a === 'nettab'){ sub.nettab = d.s; }
    else if (a === 'pord'){ const s0 = d.s === '' ? null : isNaN(+d.s) ? d.s : +d.s, port = S.pickShop && pickShopOk(S.pickShop) ? S.pickShop : (placesNear(S.boat.pos, 'butikk', 1)[0] || {pt:{}}).pt.id, why = pickAdd(port, d.w, d.k || null, s0, +d.n || 1);
      if (why){ toast(L(why[0], why[1])); return true; } const nm = pickName(pickState().find(o => o.port === port && o.w === d.w && (o.k || null) === (d.k || null) && String(o.s == null ? '' : o.s) === String(s0 == null ? '' : s0)));
      toast(L(nm[0] + ' er bestilt til henting i ' + portById(port).name + '. Du betaler når du henter.', nm[1] + ' is ordered for collection at ' + portById(port).name + '. You pay when you fetch it.')); if (typeof cloudEv === 'function') cloudEv('shop_order', {w:d.w, k:d.k || d.s, port}); }
    else if (a === 'pdrop'){ pickDrop(d.id); }
    else if (a === 'ptake'){ const o = pickById(d.id); buyMark(); const why = pickTake(o); if (why){ toast(why); return true; } { const nm = pickName(o); receipt(L(nm[0], nm[1]), o.w, o.w === 'stamp' || o.w === 'pot' || o.w === 'jig' ? o.s : o.k); } }
    else if (a === 'ptakeall'){ const got = []; buyMark(); for (const o of pickAt(S.boat.port).slice()){ const why = pickTake(o); if (why){ toast(why); break; } got.push(o); } if (got.length) receipt(got.map(o => L(...pickName(o))).join(', '), got.length === 1 ? got[0].w : 'many', got.length === 1 ? (got[0].w === 'stamp' || got[0].w === 'pot' || got[0].w === 'jig' ? got[0].s : got[0].k) : null); }
    // a chip in the shop's list of what the boat needs: to its card, on the page it is on
    else if (a === 'icgo'){ if (d.pg && d.pg !== app) app = d.pg; const id = d.id; setTimeout(() => { const el = document.getElementById(id); if (el){ el.scrollIntoView({block:'start'}); el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1600); } }, 80); return true; }
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
    else if (a === 'jobx'){ const j = (S.jobs || [])[+d.i]; if (j && j.until == null){ S.jobs.splice(+d.i, 1); gearJobCancel(j); const refund = ['fit', 'prop', 'eng', 'hold', 'upg'].includes(j.kind) && j.kr > 0 ? j.kr : j.kind === 'prep' ? PREP[j.k].cost : j.kind === 'fit' ? EQUIP[j.k].price : j.kind === 'hold' ? upPrice(HOLDUP[j.lv - 1].pc, HOLDUP[j.lv - 1].min) : j.kind === 'eng' ? upPrice(ENGUP[j.lv - 1].pc, ENGUP[j.lv - 1].min) : j.kind === 'prop' ? upPrice(PROPUP[j.lv - 1].pc, PROPUP[j.lv - 1].min) : j.kind === 'upg' && UPGS[j.u] ? upPrice(UPGS[j.u].steps[j.lv - 1].pc, UPGS[j.u].steps[j.lv - 1].min) : j.kind === 'hull' ? 1500 + Math.round(BOAT.len * 400 / 100) * 100 : 0; book(j.kind === 'fit' ? 'redskap' : 'verft', refund, 'Avbestilt: ' + j.no, 'Cancelled: ' + j.en); } }
    else if (a === 'service'){ const c = svcCostOf(b); if (spendable() < c){ toast(t('no_cash')); return; } book('verft', -c, 'Motorservice', 'Engine service'); b.svcAt = b.engH || 0; S.svcTold = false; log('Motorservice utført.', 'Engine serviced.'); }
    else if (a === 'holdup'){ const lv = (S.boat.holdLv || 0) + 1, nx = HOLDUP[lv - 1]; if (!nx || lv > karSteps(S.boat.type) || !atKind('verft') || (S.jobs || []).some(j => j.kind === 'hold')) return; const c = upPrice(nx.pc, nx.min); if (spendable() < c) return;
      if (!queueJob({kind:'hold', lv, ty:S.boat.type, kr:c, h:nx.h, no:'Ombygging av lasterommet', en:'Rebuilding the hold'})){ toast(L('Arbeidskøen er full.', 'The work queue is full.')); return; } buyMark(); book('verft', -c, 'Ombygging av lasterommet', 'Rebuilding the hold'); log('Bestilte ombygging av lasterommet, ' + kr(c) + '.', 'Ordered a rebuild of the hold, ' + kr(c) + '.'); receipt(L('Ombygging av lasterommet', 'Rebuilding the hold'), 'yard', 'hold'); }
    else if (a === 'upg'){ const k = d.u, U = UPGS[k], nx = U && upgNext(S.boat, k); if (!nx || !atKind('verft') || (S.jobs || []).some(j => j.kind === 'upg' && j.u === k)) return; const c = upPrice(nx.pc, nx.min); if (spendable() < c) return;
      if (!queueJob({kind:'upg', u:k, lv:upgLv(S.boat, k) + 1, ty:S.boat.type, kr:c, h:nx.h, no:'Ombygging: ' + nx.no, en:'Rebuild: ' + nx.en})){ toast(L('Arbeidskøen er full.', 'The work queue is full.')); return; } buyMark(); book('verft', -c, 'Ombygging: ' + nx.no, 'Rebuild: ' + nx.en); log('Bestilte ombygging, ' + nx.no.toLowerCase() + ', ' + kr(c) + '.', 'Ordered a rebuild, ' + nx.en.toLowerCase() + ', ' + kr(c) + '.'); receipt(L('Ombygging: ' + nx.no, 'Rebuild: ' + nx.en), 'yard', 'upg'); }
    else if (a === 'engup'){ const lv = (S.boat.engLv || 0) + 1, nx = ENGUP[lv - 1]; if (!nx || !atKind('verft') || VESSELS[S.boat.type].outboard || (S.jobs || []).some(j => j.kind === 'eng')) return; const c = upPrice(nx.pc, nx.min); if (spendable() < c) return;
      if (!queueJob({kind:'eng', lv, ty:S.boat.type, kr:c, h:nx.h, no:'Motorbytte', en:'Engine change'})){ toast(L('Arbeidskøen er full.', 'The work queue is full.')); return; } buyMark(); book('verft', -c, 'Motorbytte', 'Engine change'); log('Bestilte større motor, ' + kr(c) + '.', 'Ordered a bigger engine, ' + kr(c) + '.'); receipt(L('Motorbytte', 'Engine change'), 'yard', 'eng'); }
    // the propeller (OPP3): the next step at the yard, 30 real minutes; from IC_CONFIRM_KR it asks «Bekreft · kr» in the button first, as
    // the shop's tiers do, and the receipt says the step. j.kr: what was paid (the cancel and a boat traded in meanwhile pay it back)
    else if (a === 'propup'){ const b = S.boat, V = VESSELS[b.type], lv = propLvOf(b) + 1, nx = PROPUP[lv - 1]; if (!nx || !propFits(V) || !atKind('verft') || (S.jobs || []).some(j => j.kind === 'prop')) return; const c = upPrice(nx.pc, nx.min); if (spendable() < c) return;
      const pk = 'prop:' + lv; if (c >= IC_CONFIRM_KR && !(shopPend && shopPend.k === pk && Date.now() - shopPend.t <= IC_CONFIRM_MS)){ shopPend = {k:pk, kg:0, t:Date.now()}; return true; } shopPend = null;
      if (!queueJob({kind:'prop', lv, ty:b.type, kr:c, h:YARD_H, no:'Ny propell, trinn ' + lv, en:'New propeller, step ' + lv})){ toast(L('Arbeidskøen er full.', 'The work queue is full.')); return; }
      buyMark(); book('verft', -c, 'Ny propell, trinn ' + lv, 'New propeller, step ' + lv); log('Bestilte ny propell, trinn ' + lv + ', ' + kr(c) + '.', 'Ordered a new propeller, step ' + lv + ', ' + kr(c) + '.');
      receipt(L('Propell, trinn ' + lv + ': ' + lc1(nx.no), 'Propeller, step ' + lv + ': ' + lc1(nx.en)), 'yard', 'prop'); if (typeof cloudEv === 'function') cloudEv('upg', {k:'prop', lv}); }
    else if (a === 'hullfix'){ if (!atKind('verft')) return; const why = hullOrder(false); if (why){ toast(why[0] === 'no_cash' ? t('no_cash') : L('Arbeidskøen er full.', 'The work queue is full.')); return; } }
    else if (a === 'kasko'){ if (!atKind('verft')) return; if (kaskoSign()){ toast(t('no_cash')); return; } }
    else if (a === 'kaskox'){ kaskoEnd(); }
    else if (a === 'hullclean'){ if (!atKind('verft') || (S.jobs || []).some(j => j.kind === 'hull')) return; const c = 1500 + Math.round(BOAT.len * 400 / 100) * 100; if (spendable() < c) return;
      if (!queueJob({kind:'hull', h:6, no:'Skrogrens på slipp', en:'Hull cleaning on the slip'})){ toast(L('Arbeidskøen er full.', 'The work queue is full.')); return; } buyMark(); book('verft', -c, 'Skrogrens på slipp', 'Hull cleaning on the slip'); log('Bestilte skrogrens på slipp, ' + kr(c) + '.', 'Ordered a hull cleaning on the slip, ' + kr(c) + '.'); receipt(L('Skrogrens på slipp', 'Hull cleaning on the slip'), 'yard', 'hull'); }
    // (another kind than the one on takes its place and the rest of its time: asked first, as the haill is; the same kind adds its hours)
    else if (a === 'trimbuy'){ const b = S.boat, B = BOOSTS[d.k], on = trimOn(b); if (!B || !canBoost(VESSELS[b.type])) return; if (on && on !== B && trimPend !== d.k){ trimPend = d.k; return true; } trimPend = null;
      payBuy(d.k, () => { const w = trimWords(d.k, trimSet(d.k)); log(w.no, w.en); toast(L(B.no + ': ', B.en + ': ') + fmt(BOAT.vmax, 1) + ' kn'); }); }
    else if (a === 'trim0'){ trimPend = null; return true; }
    else if (/^km/.test(a)){ if (!kmAct(a, d)) return; }   // Kvotemarkedet (phone/04b-kvotemarked.js, KM3)
    else if (/^m[gb]/.test(a)){ if (!mgAct(a, d)) return; }   // Kystmegleren (phone/13c-megler.js, M4; the sales between players, B)
    else if (a === 'eqtry'){ equipTry(d.k); return true; }   // try it on the boat in 3D (M3)
    else if (a === 'equip'){ const E = EQUIP[d.k]; if (!E) return;
      // expensive equipment confirms in the button, as the counter's other buys do (M2: IC_CONFIRM_KR); a tier by its price for this boat
      // (tierKr: the knives at tier 3 on a 14.99 m vessel are 13 500 kr, three gutting places; OPP4)
      const pk = 'equip:' + d.k + (d.sp ? ':sp' : ''), lv1 = E.tiers ? equipLv(d.k) + 1 : 0, price = E.tiers ? tierKr(d.k, lv1) : equipKr(d.k);   // (a reel at the boat's tier costs what the shop takes, equipKr, OPP2)   // (the partner's item confirms on its own card, M6)
      if (price >= IC_CONFIRM_KR && !(shopPend && shopPend.k === pk && Date.now() - shopPend.t <= IC_CONFIRM_MS)){ shopPend = {k:pk, kg:0, t:Date.now()}; return true; }
      // (the receipt says the tier bought and its name: «Kjøpt: Sløyekniver, trinn 3: sløyekniver i ett stykke og stålhansker»)
      const T = E.tiers && E.tiers[lv1 - 1], nm = T ? E.name[S.lang] + L(', trinn ', ', tier ') + lv1 + ': ' + lc1(T[S.lang]) : E.name[S.lang];
      shopPend = null; buyMark(); const why = equipBuy(d.k); if (why){ toast(why); return true; } receipt(nm, 'equip', d.k); SPUI.setBrand(d.k, d.sp ? spOf('item', d.k) : null); if (d.sp && typeof cloudEv === 'function') cloudEv('sp_buy', {pl:(spOf('item', d.k) || {}).id || 0}); } else if (a === 'equipOLD'){ const E = EQUIP[d.k]; if (E.multi) S.equip[d.k] = (S.equip[d.k] || 0) + 1; else S.equip[d.k] = true; applyVessel(); log('Montert: ' + E.name.no + '.', 'Fitted: ' + E.name.en + '.'); updateMapButtons(); INSTR.show(); }
    else if (a === 'hire'){ const c = candidates().find(x => x.id === d.id); if (c && S.crew.length < BOAT.crewMax && !crewHireWhy()){ S.crew.push(crewUpgrade(c)); log(c.name + ' er ansatt som ' + c.lv + '.', c.name + ' joined as ' + c.lvEn + '.'); } }
    else if (a === 'fire'){ if (!crewAshore()) return; const c = S.crew[+d.i]; if (c) crewLetGo(c); }   // (the ground and the notice in the log, Ø11.9)
    else if (a === 'repay'){ const k = d.k || 'loan', Q = S[k]; if (!Q || S.cash < 10000) return; const x = Math.min(10000, Q.bal); book('avdrag', -x, 'Ekstra innbetaling, ' + LOANS[k].who, 'Extra repayment, ' + LOANS[k].who); Q.bal -= x; if (Q.bal < 1) S[k] = null; }
    else if (a === 'repayAll'){ const k = d.k || 'loan', Q = S[k]; if (!Q || S.cash < Q.bal) return; book('avdrag', -Q.bal, 'Lånet innfridd, ' + LOANS[k].who, 'Loan paid off, ' + LOANS[k].who); S[k] = null; log((k === 'loanIN' ? 'Risikolånet' : 'Båtlånet') + ' er innfridd.', 'The ' + (k === 'loanIN' ? 'risk' : 'vessel') + ' loan is paid off.'); }
    else if (a === 'papers'){ app = 'kvote'; sub.kvote = 'mine'; }
    else if (a === 'mktab'){ sub.marked = d.s; mkSel = null; }
    else if (a === 'mksel'){ mkSel = d.k ? {k:d.k, o:d.o || null} : null; sub.tikeep = null; }   // (KM4: the trade-in's choice about the right is this sheet's)
    else if (a === 'minsheet'){ minSheet = !minSheet; }
    else if (a === 'snomode'){ snoSetMode(d.m); }   // live or frozen snow crab for the trip (H3b, 10e-krabbefabrikk.js)
    else if (a === 'mk3d'){ if (typeof DOCK !== 'undefined') DOCK.close(); if (isOpen) show(false); G3.showroom(d.k); return; }
    else if (a === 'buy'){
      // data-ti="1": trade in the vessel you follow; data-ti="0": add a vessel to the fleet (not an open-group boat before the company has a closed-group one)
      const V2 = VESSELS[d.k], ti = d.ti === '0' ? 0 : tradeIn(); if (!V2 || V2.lock || !atKind('verft') || S.order || (ti && S.boat.type === d.k)) return;
      // (KM3: her right or a structure quota on her lies out in the quota market, so she cannot be traded in until that sale is over)
      if (ti && S.boat.sale){ toast(L('Hun har hjemmel eller strukturkvote til salgs i Kvotemarkedet. Vent til salget er over.', 'She has a right or a structure quota for sale in the quota market. Wait until the sale is over.')); return; }
      if (!ti && V2.len < 11 && !hasLic()){ toast(L('Et rederi kan bare ha én båt i åpen gruppe.', 'A company can only have one boat in the open group.')); return; }
      // an ocean vessel comes with her permit from an NPC owner in the register (H1 of the ocean step, 03d-quota.js havLicTake)
      const hw = V2.cls === 'hav' ? havLicWhy(d.k) : null; if (hw){ toast(L(hw[0], hw[1])); return; }
      const x = deal(V2.cls === 'hav' ? havPrice(d.k, S.t / 60) : V2.price, ti); if (!x.ok){ toast(whyText(x) || t('no_cash')); return; } finance(x, 120); achAdd('boat');
      const hl = V2.cls === 'hav' ? havLicTake(d.k, S.t / 60) : null; let hn = '';
      // KM4 (V2 A, the same choice as at the broker): the right is kept as a free right for two game years, taken off her before she
      // is traded in (the trade-in was priced without it, tradeIn); else it follows her as before. The second quota from the special
      // scheme falls away either way (kap. 2 § 6)
      const kept = ti && tiKeepOn() ? mbMove({v:curVessel()}, {free:true}) : null, two0 = ti && S.lic && S.lic.two && HJ[S.lic.two] ? S.lic.two : null;
      sub.tikeep = null;
      // a new build is delivered at once, at this yard, like a used vessel (Jonas 13.10.2026: «Fjern byggetiden når man bestiller nybygg»)
      if (ti) switchVessel(d.k);
      else { const v = newVesselObj(d.k, S.boat.port, hl); hn = v.boatName; setTimeout(() => BUYM.show(v), 60); log('Kjøpte ' + V2.name.no + ' til flåten. Hun heter «' + v.boatName + '» og ligger i ' + portById(S.boat.port).name + '.', 'Bought the ' + V2.name.en + ' for the fleet. She is called «' + v.boatName + '» and lies at ' + portById(S.boat.port).name + '.'); }
      pressPut('boat', {type:d.k, nb:V2.isNew ? 1 : 0, price:V2.price});   // Kystposten (core/09h-press.js)
      if (ti && S.lic){ log('Kvoten i lukket gruppe fulgte med den gamle båten.' + (two0 ? ' Den andre kvoten fra den særlige ordningen falt bort.' : ''), 'The closed-group quota went with the old vessel.' + (two0 ? ' The second quota from the special scheme fell away.' : '')); regFree(S.lic.id); S.lic = null; freshQuota(); openUsedLoad(); }
      else if (kept && kept.ok) log('Hjemmelen ble i rederiet som ledig hjemmel i høyst to spillår.', 'The right stayed in the company as a free right for at most two game years.');
      if (hl){ if (ti){ S.lic = hl; freshQuota(); }
        msg('Fiskeridirektoratet', HAVLIC[hl.id].no + ' med kvotefaktor ' + fmt(hl.kf, 2) + ' er registrert på «' + (ti ? S.boatName : hn) + '». Den er kjøpt fra ' + hl.from + '.', 'A ' + HAVLIC[hl.id].en.toLowerCase() + ' with quota factor ' + fmt(hl.kf, 2) + ' is registered to the vessel. It was bought from ' + hl.from + '.'); }
    }
    else if (a === 'adminbuy'){
      // the admin's free vessel for testing (adminOk: Jonas' account on the cloud's hosts, any local build): no price, no right, no lock, no yard; she
      // lies in the port the followed vessel is in, or the nearest one, and is followed at once
      if (typeof adminOk !== 'function' || !adminOk() || !VESSELS[d.k]) return;
      const pid = S.boat.port || nearestPort(S.boat.pos).id, v = newVesselObj(d.k, pid);
      storeVessel(curVessel()); bindVessel(v); if (typeof G3 !== 'undefined') G3.vesselChanged();
      log('Admin: tok ' + VESSELS[d.k].name.no + ' gratis til flåten. Hun heter «' + v.boatName + '» og ligger i ' + portById(pid).name + '.', 'Admin: took the ' + VESSELS[d.k].name.en + ' into the fleet for free. She is called «' + v.boatName + '» and lies at ' + portById(pid).name + '.');
      toast(L('«' + v.boatName + '» er din. Du følger henne nå.', '«' + v.boatName + '» is yours. You follow her now.')); refreshAll();
    }
    else if (a === 'vsel'){ selV = d.id; }
    else if (a === 'goto'){ const v = vesselById(d.id); if (!v) return; if (SEL_APPS.includes(d.a)) selV = v.id; else if (v.id !== S.cur){ storeVessel(curVessel()); bindVessel(v); selV = null; if (typeof G3 !== 'undefined') G3.vesselChanged(); refreshAll(); } app = d.a; }
    else if (a === 'vfollow'){ const v = vesselById(d.id); if (!v || v.id === S.cur) return; storeVessel(curVessel()); bindVessel(v); selV = null; if (typeof G3 !== 'undefined') G3.vesselChanged(); refreshAll(); }
    else if (a === 'vboard'){ const v = vesselById(d.id), mv = vesselById(S.me); if (!v || v.id === S.me || vget(v, 'boat').status !== 'port' || (mv && vget(mv, 'boat').status !== 'port')) return;
      if (mbSale(v) && mbSale(v).km){ toast(L('«' + vget(v, 'boatName') + '» ligger til kai mens hjemmelen eller strukturkvoten hennes er til salgs i Kvotemarkedet.', 'The «' + vget(v, 'boatName') + '» lies at the quay while her right or structure quota is for sale in the quota market.')); return; }   // (KM3)
      if (mbSale(v)){ toast(L('«' + vget(v, 'boatName') + '» ligger til salgs hos Kystmegleren.', 'The «' + vget(v, 'boatName') + '» is for sale at Kystmegleren.')); return; }   // (B1: locked at the yard until the sale is over)
      S.me = v.id; log('Du gikk om bord på «' + vget(v, 'boatName') + '».', 'You went aboard the «' + vget(v, 'boatName') + '».');
      if (v.id !== S.cur){ storeVessel(curVessel()); bindVessel(v); if (typeof G3 !== 'undefined') G3.vesselChanged(); refreshAll(); } }
    else if (a === 'vname'){ const v = vesselById(d.id); if (!v) return; const nm = (prompt(L('Nytt navn på båten', 'New name for the vessel'), vget(v, 'boatName') || '') || '').replace(/[<>&"]/g, '').trim().slice(0, 20); if (!nm) return;
      if (v.id === S.cur) S.boatName = nm; else v.boatName = nm; loreRename(nm); }
    // «Selg nå» (B4, V6 A): the broker buys her at once for 90 % of her value (core/09k-market.js mbQuickSell); the loans are paid first
    else if (a === 'vsell'){ const v = vesselById(d.id), w = mbQuickWhy(v); if (w){ if (w !== 'gone') toast(mbWhyTxt(w)); return; }
      const val = mbQuick(v), nm = vget(v, 'boatName');
      if (!confirm(L('Selge «' + nm + '» til Kystmegleren for ' + kr(val) + ' (90 % av verdien)?', 'Sell the «' + nm + '» to Kystmegleren for ' + kr(val) + ' (90 % of her value)?') + (debt() > 0 ? ' ' + L('Pengene går først til å innfri lånene.', 'The money first pays off the loans.') : ''))) return;
      mbQuickSell(v.id); if (mbPutSel === v.id) mbPutSel = null; if (typeof cloudEv === 'function') cloudEv('mb_quick', {type:vget(v, 'boat').type}); refreshAll(); }
    else if (a === 'bhire' || a === 'bneg'){ const B = S.bors, c = B && B.pool.find(x => x.id === d.id); if (!c || S.crew.length >= BOAT.crewMax || S.boat.status !== 'port' || crewHireWhy()) return;
      if (a === 'bneg' && c.laer) return;   // (the apprentice's share is the agreement's, § 24.4)
      if (a === 'bneg'){ c.neg = true; if (Math.random() < 0.6 - (c.traits.includes('stolt') ? 0.25 : 0)){ c.ask = lotR(c.ask - LOTT.step); c.share = c.ask; c.morale -= 5; toast(L(c.name.split(' ')[0] + ' godtar ' + lotS(c.ask) + '.', c.name.split(' ')[0] + ' accepts ' + lotS(c.ask) + '.')); }
        else { B.pool.splice(B.pool.indexOf(c), 1); toast(L(c.name.split(' ')[0] + ' takket nei og tok hyre et annet sted.', c.name.split(' ')[0] + ' said no and took a berth elsewhere.')); } }
      else { B.pool.splice(B.pool.indexOf(c), 1); c.hiredT = S.t; c.earn = []; delete c.until; S.crew.push(c); achAdd('crew'); log(c.name + ' har mønstret på som ' + c.lv + ' på ' + lotS(c.share) + '.', c.name + ' signed on as ' + c.lvEn + ' on ' + lotS(c.share) + '.'); flyIn(c); if (c.laer && typeof laerSign === 'function') laerSign(c); } }
    else if (a === 'foundas'){ if (!foundAS()) toast(t('no_cash')); }
    else if (a === 'coff'){ const c = crewById(d.id); if (c){ c.off = !c.off; if (c.off){ c.morale = Math.min(100, c.morale + 2); } else delete c.offTrip; } }
    // lott or hyre (E3): the day wage is the one asked for when the agreement is changed
    else if (a === 'cfire'){ if (!crewAshore()){ toast(L('Mannskap kan bare sies opp når båten ligger til kai.', 'Crew can only be let go with the boat at a quay.')); return; } const c = crewById(d.id); if (c){ const own = !!c.opp, g = crewLetGo(c); if (g) toast(own ? L(c.name.split(' ')[0] + ' har gått i land, etter avtale.', c.name.split(' ')[0] + ' has gone ashore, by agreement.') : L(c.name.split(' ')[0] + ' er sagt opp: ' + g[0] + '.', c.name.split(' ')[0] + ' has been let go: ' + g[1] + '.')); } }
    // the answer to an errand (steg 45a, core/14-crewlife.js errandAnswer): yes, or not now, which costs nothing
    else if (a === 'cerr'){ if (!errandAnswer(d.id, d.o === 'yes')) return; }
    // the apprentice's answer (steg 45b, core/14-crewlife.js laerAnswer): the place on his card
    else if (a === 'claer'){ if (laerAnswer(d.id, +d.o) == null) return; }
    // ask one who gave notice to stay (Ø11.9, crewStay): by agreement, when the mood has come back
    else if (a === 'cstay'){ const c = crewById(d.id); if (!c) return; const w = crewStay(c); if (w === 'mood') toast(L(c.name.split(' ')[0] + ' vil ikke. Trivselen må opp først.', c.name.split(' ')[0] + ' will not. The mood has to come up first.')); else if (w === 'egenbat') toast(L(c.name.split(' ')[0] + ' skal kjøpe egen båt.', c.name.split(' ')[0] + ' is buying a boat of their own.')); }
    else if (a === 'cres'){ const ev = S.cevt; if (!ev) return; const A = crewById(ev.a), Bc = crewById(ev.b), o = d.o, g = (x, y, v) => { if (x && y){ x.grudge = x.grudge || {}; x.grudge[y.id] = (x.grudge[y.id] || 0) + v; } };
      if (A) A.cpen = 0; if (Bc) Bc.cpen = 0;
      if (o === 'talk'){ const calm = crewAboard().some(c => c.traits.includes('spokefugl') || c.traits.includes('omsorgsfull')) ? 0.15 : 0, pr = 0.4 + Math.min(0.25, S.sales.length * 0.005) + calm + 0.05 * (compat(A, Bc) + 3);
        if (Math.random() < pr){ if (A.grudge) delete A.grudge[Bc.id]; if (Bc.grudge) delete Bc.grudge[A.id]; A.morale += 5; Bc.morale += 5; toast(L('Dere fikk snakket ut. Stemningen er bedre.', 'You talked it through. The mood is better.')); }
        else { g(A, Bc, 1); g(Bc, A, 1); A.morale -= 5; Bc.morale -= 5; toast(L('Praten hjalp ikke. De er fortsatt sure på hverandre.', 'The talk did not help. They are still cross with each other.')); } }
      else if (o === 'sideA' || o === 'sideB'){ const W = o === 'sideA' ? A : Bc, Lz = o === 'sideA' ? Bc : A; W.morale += 8; Lz.morale -= Lz.traits.includes('stolt') ? 22 : 15; g(Lz, W, 1); }
      else if (o === 'offB'){ Bc.off = true; Bc.morale -= 4; if (A.grudge) A.grudge[Bc.id] = Math.max(0, (A.grudge[Bc.id] || 0) - 0.5); }
      else if ((o === 'fireB' || o === 'fireA') && !crewAshore()){ toast(L('Mannskap kan bare sies opp når båten ligger til kai.', 'Crew can only be let go with the boat at a quay.')); return; }
      else if (o === 'fireB' || o === 'fireA'){ const q = o === 'fireB' ? Bc : A; if (q && S.crew.includes(q)) crewLetGo(q); S.cevt = null; }   // (the ground: the cooperation aboard, Ø11.9)
      else if (o === 'listen'){ if (ev.topic === 'lott'){ A.share = lotR(A.share + LOTT.step); } else if (ev.topic === 'hvile'){ A.off = true; } A.morale += ev.topic === 'lott' ? 12 : 8; }
      else if (o === 'firm'){ A.morale -= 10; if (A.traits.includes('kranglefant') || A.traits.includes('stolt')) A.morale -= 6; }
      for (const c of S.crew) c.morale = clamp(c.morale, 0, 100); S.cevt = null; }
    else if (a === 'turtake'){ const e = turTake(+d.id); if (e) toast(e); }
    else if (a === 'turdrop'){ turDrop(+d.id); }
    else if (a === 'ukecard'){ show(false); ukeShow(+d.w); return false; }   // Ukas fangst (ui/05i-ukas.js)
    else if (a === 'kkmap'){ show(false); kkChart(true); return false; }   // Kystkartet over the chart (ui/05h-kystkart.js)
    // (a mission's id is a number, a race task's text, 'lnk-1:2f': turGo, turMeasure and turFotoShoot compare them as text, KL2)
    else if (a === 'turgo'){ turGo(d.id); show(false); return false; }
    else if (a === 'turmeas'){ show(false); turMeasure(d.id); return false; }
    // the race's tab (ui/05l-kapplop.js, KL2): register, start again, the way to the next checkpoint, and from the Sesong app's card
    else if (a === 'lopreg'){ if (!lopReg()) return; }
    else if (a === 'lopquit'){ lopQuit(); }
    else if (a === 'lopgo'){ lopGo(); show(false); return false; }
    else if (a === 'loptab'){ sub.ordl = 'lop'; show(true, 'ordl'); return false; }
    else if (a === 'lopcls'){ LOP_CLS = {k:d.s, cls:null, t:Date.now()}; }   // the week's board for another class (KL3)
    else if (a === 'turans'){ turLeteAnswer(+d.id, +d.q, d.o); }
    else if (a === 'pttake'){ const o = (PTOW._P.open || []).find(x => String(x.id) === String(d.id)); if (o) PTOW.take(o); show(false); return false; }
    else if (a === 'ptgo'){ const H = S.ptowH; show(false); if (H && typeof leiaTo === 'function'){ if (typeof openPlotter === 'function') openPlotter(); leiaTo({x:H.x, y:H.y}); } return false; }
    else if (a === 'ptdrop'){ PTOW.drop(); }
    else if (a === 'turfoto'){ turFotoShoot(d.id); }
    else if (a === 'ordtake'){ const O = ordState(), o = O.offers.find(x => x.id === +d.id); if (!o || O.active.length >= 3) return; O.offers.splice(O.offers.indexOf(o), 1); o.due = S.t + o.days * 1440; O.active.push(o); log('Tok en bestilling fra ' + CUSTOMERS.find(c => c.id === o.cust).no + '.', 'Took an order from ' + CUSTOMERS.find(c => c.id === o.cust).no + '.'); }
    else if (a === 'cloth'){ buyMark(); const why = clothBuy(d.k); if (why){ toast(why); return true; } receipt(CLOTHES[d.k][S.lang], 'cloth', d.k); }
    else if (a === 'haillbuy'){ if (tutFree('haill') && d.k !== 'luksus') return; const k = d.k, got = () => { giveHaill(k, 'shop'); toast(HAILL[k][S.lang] + L(' ligger i beholdningen. Trykk «Aktiver» når du vil bruke den.', ' is in store. Tap «Switch on» when you want it.')); };
      if (tutFree('haill')){ tutMark('free_haill'); got(); } else payBuy(k, got); }
    else if (a === 'skipbuy'){ const k = d.k; if (!SKIP[k]) return; payBuy('sk_' + k, () => { const n = giveSkip(k); if (n) toast(n + L(': du og mannskapet er uthvilt i ' + Math.round(skipLeft()) + ' timer.', ': you and the crew are rested for ' + Math.round(skipLeft()) + ' hours.')); }); }
    else if (a === 'haillon'){ if (S.haill && haillStage() && haillPend !== d.k){ haillPend = d.k; return true; } haillPend = null; if (useHaill(d.k)) toast(HAILL[d.k][S.lang] + L(' er aktivert: +', ' is on: +') + Math.round(haillBoost() * 100) + ' %.'); }
    else if (a === 'haill0'){ haillPend = null; }
    else if (a === 'jobOT'){ const j = (S.jobs || [])[+d.i]; if (!j || j.until == null || j.ot) return; const left = Math.max(0, j.until - S.t) / 60, c = Math.round(left / 2 * 950 / 10) * 10; if (spendable() < c){ toast(t('no_cash')); return; }
      book('verft', -c, 'Mekaniker på overtid', 'Mechanic on overtime'); j.until = S.t + (j.until - S.t) / 2; j.ot = true; log('Leide inn mekaniker på overtid for ' + c + ' kr.', 'Hired a mechanic on overtime for NOK ' + c + '.'); }
    else if (a === 'yardnow'){ payBuy('yard', () => { let n = 0; for (const j of S.jobs || []) if (YARD_KINDS.includes(j.kind) && j.until != null && j.until > S.t){ j.until = S.t; n++; } if (n){ log('Verftet gjorde ' + (n > 1 ? n + ' jobber' : 'jobben') + ' ferdig med én gang.', 'The yard finished ' + (n > 1 ? n + ' jobs' : 'the job') + ' straight away.'); toast(L('Verftet er ferdig', 'The yard is done')); } }); }
    else if (a === 'jobRush'){ const j = (S.jobs || [])[+d.i]; if (!j || j.until == null || !adminOk()) return; j.until = S.t; log('Admin: jobben ble gjort ferdig med én gang.', 'Admin: the job was finished straight away.'); }
    else if (a === 'struct'){
      // a structure quota: buy a right in the same group, scrap the boat, and add its quota factor less 10 % (03d-quota.js)
      const l = S.lic; if (!l || !structRoom(l, d.id) || !atTrade() || S.boat.sale) return; const pr = structPrice(d.id, S.t / 60), x = deal(pr, 0); if (!x.ok){ toast(whyText(x) || t('no_cash')); return; } finance(x, 180);
      const sl = regSeller(d.id, S.t / 60), k = structIn(l, d.id, S.t / 60); regTake(d.id);   // the boat structured away leaves the register too
      pressPut('kvote', {kf:Math.round(k * 10000), type:S.boat.type});   // Kystposten (it stood behind the comment above and never ran until KM3)
      if (typeof cloudEv === 'function') cloudEv('km_reg', {kind:'struct', id:d.id});   // (KM5: bought from the register, against the players' market in admin; never who)
      msg('Fiskeridirektoratet', 'Strukturkvoten er tildelt «' + S.boatName + '»: kvotefaktor ' + fmt(k, 4) + ' fra båten til ' + sl.name + ' (' + HJ[d.id].hl + '), som er tatt ut av registeret. Den gjelder i 20 år.', 'The structure quota is granted to the «' + S.boatName + '»: quota factor ' + fmt(k, 4) + ' from ' + sl.name + '\'s boat (' + HJ[d.id].hl + '), which is struck off the register. It runs for 20 years.'); }
    else if (a === 'two'){
      // the special scheme under 11 m: one boat fishes both quotas, the other right is given up and the boat sold
      const va = vesselById(d.a), vb = vesselById(d.b); if (!va || !vb || vb.id === S.me || mbSale(va) || mbSale(vb) || !twoOK(vget(va, 'lic'), vget(vb, 'lic'), yearH(S.t / 60)) || vget(vb, 'boat').status !== 'port') return;
      const la = vget(va, 'lic'), lb = vget(vb, 'lic'), nb = vget(vb, 'boatName'), val = Math.round(VESSELS[vget(vb, 'boat').type].price * 0.7);
      if (!confirm(L('«' + nb + '» oppgir hjemmelen og selges for ' + kr(val) + '. «' + vget(va, 'boatName') + '» fisker begge kvotene. Fortsette?', '«' + nb + '» gives up its right and is sold for ' + kr(val) + '. «' + vget(va, 'boatName') + '» fishes both quotas. Go on?'))) return;
      la.two = lb.id; licExtra(la); if (vb.id === S.cur){ bindVessel(va); if (typeof G3 !== 'undefined') G3.vesselChanged(); }
      const paid = payDown(val); S.fleet.splice(S.fleet.indexOf(vb), 1); book('baat', val - paid, 'Båt solgt', 'Vessel sold');
      msg('Fiskeridirektoratet', '«' + vget(va, 'boatName') + '» fisker nå to kvoter etter den særlige kvoteordningen. «' + nb + '» er slettet fra merkeregisteret.', 'The «' + vget(va, 'boatName') + '» now fishes two quotas under the special scheme. The «' + nb + '» is struck off the register.'); }
    else if (a === 'coop'){
      // quota cooperation (§ 31): the NPC owner signs on, and his quota comes aboard for the year
      const y = yearH(S.t / 60), o = coopOffer(S.t / 60); if (!coopOK(S.lic, y) || S.crew.length + 1 >= BOAT.crewMax || !atTrade() || S.boat.sale) return;
      const c = Object.assign(genCrew(), {name:o.name, home:o.home, share:0, ask:0, morale:70, fatigue:10, traits:[], known:[true, true], coop:true});
      S.crew.push(c); S.lic.coop = {y, id:o.id, name:o.name, crew:c.id};
      msg('Fiskeridirektoratet', 'Kvotesamarbeidet med ' + o.name + ' (hjemmel ' + HJ[o.id].hl + ') er registrert for ' + y + '. Han er om bord, og båten hans ligger til kai.', 'The quota cooperation with ' + o.name + ' (quota length ' + HJ[o.id].hl + ') is registered for ' + y + '. He is aboard, and his boat lies at the quay.'); }
    else if (a === 'buylic'){
      const O = LIC_OFFERS.find(x => x.k === d.id); if (!O || !atTrade() || S.order) return;
      const price = VESSELS[O.ves].price + licValue(O), ti = d.ti === '0' ? 0 : tradeIn(); if (ti && S.lic && S.lic.id === O.id && S.boat.type === O.ves) return;
      if (ti && S.boat.sale) return;   // (KM3: her right lies out in the quota market; the button is grey too, tiLocked)
      if (!bladB()){ toast(L('Du må stå på blad B i fiskermanntallet for å kjøpe en båt med hjemmel. Se Papirer.', 'You must be on blad B of the fishermen\'s register to buy a boat with a right. See Papers.')); return; }
      const inn = innOK(), x = deal(price, ti, inn); if (!x.ok){ toast(whyText(x) || t('no_cash')); return; }
      if (!S.company){ const el = document.getElementById('coName'); S.company = String((el && el.value) || coDraft || '').trim().slice(0, 28) || coDefault(); coDraft = null; log('Rederiet ' + S.company + ' er opprettet.', 'The company ' + S.company + ' is founded.'); }
      finance(x, 180); if (inn) S.inUsed = true;
      if (ti && tiKeepOn()) mbMove({v:curVessel()}, {free:true});   // (KM4: the old right kept as a free right, taken off her before the trade-in)
      sub.tikeep = null;
      const sl = regSeller(O.id, S.t / 60), lic = {id:O.id, hl:O.hl, kpk:O.kpk, since:yearH(S.t / 60), from:sl.name + ', ' + sl.home}, ov = openVesselId(), lost = ov && !(ti && ov === S.cur) ? vget(vesselById(ov), 'boatName') : null;
      let nm;
      let fished; regTake(O.id);   // the NPC owner leaves the register (03d-quota.js)
      if (ti){ if (!S.lic && S.cur === ov) openUsedSave(S.quota); switchVessel(O.ves); S.lic = lic; fished = licStart(lic); nm = S.boatName; }
      else { if (ov) openUsedSave(vget(vesselById(ov), 'quota')); const v = newVesselObj(O.ves, S.boat.port, lic); fished = withVessel(v, () => licStart(lic)); nm = v.boatName; setTimeout(() => BUYM.show(v), 60); log('Kjøpte ' + O.no.toLowerCase() + ' til flåten. Hun heter «' + nm + '».', 'Bought a ' + O.en.toLowerCase() + ' for the fleet. She is called «' + nm + '».'); }
      pressPut('boat', {type:O.ves, lic:1});
      if (typeof cloudEv === 'function') cloudEv('km_reg', {kind:'right', id:O.id});   // (KM5)
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
  return {show, toggle(){ show(!isOpen); }, candidates, hire(id){ const c = candidates().find(x => x.id === id); if (!c || S.crew.length >= BOAT.crewMax || crewHireWhy()) return false; S.crew.push(crewUpgrade(c)); log(c.name + ' er ansatt som ' + c.lv + '.', c.name + ' joined as ' + c.lvEn + '.'); save(); render(); return true; }, open(a){ if (DRAWER.has(String(a).split(':')[0])){ show(false); DOCK.open(a); } else show(true, a); }, page, dact, DRAWER, isOpen:() => isOpen, render, status, setBadge, tickHome, switchVessel, alerts, get app(){ return app; }, get sel(){ return selVessel().id; }};
})();

