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
    if (a === 'open'){ appSeen(d.a); app = d.a === 'kaiboden' ? kbLast : d.a; confirmMayday = false; if (d.s) sub[d.a] = d.s; if (d.a === 'post') sub.postArt = null; }
    else if (a === 'home'){ app = 'home'; }
    else if (a === 'back'){ app = 'home'; }
    else if (a === 'shop'){ const k = d.k, kg = +d.kg || 0; if (!shopPend || shopPend.k !== k || shopPend.kg !== kg){ shopPend = {k, kg}; return true; } shopPend = null; const free = tutFree(k), why = shopBuy(k, kg, free); if (why){ toast(L(why[0], why[1])); } else if (free){ if (k === 'ice') S.iceFree = 0; tutMark('free_' + k); } }
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
    else if (a === 'admFuel'){ const b = S.boat, add = Math.max(0, BOAT.fuelCap - b.fuel); b.fuel = BOAT.fuelCap; if (b.status === 'adrift' && add > 0) b.status = 'idle'; log('Admin: tanken fylt (' + fmt(add) + ' L).', 'Admin: the tank filled (' + fmt(add) + ' L).'); }
    else if (a === 'hbshow'){ HBUI.show(d.id); return; }   // «Vis meg» in Håndboka: the phone closes and the tip points (07c-handbook.js)
    else if (a === 'hbskip'){ HBUI.toggle(+d.ch); }
    else if (a === 'sub'){ sub[app] = d.s; if (app === 'post') sub.postArt = null; }
    else if (a === 'acy') sub.acy = d.y;                // the year shown in the bank's accounts
    else if (a === 'bkmv'){ const B = bankS(), k = d.k === 'skatt' ? 'skatt' : 'spare', v = d.v === '-all' ? -B[k] : +d.v; if (!bankMove(k, v)) toast(L(v > 0 ? 'Brukskontoen er tom.' : 'Kontoen er tom.', v > 0 ? 'The current account is empty.' : 'The account is empty.')); }
    else if (a === 'bkauto'){ const B = bankS(); if (d.v === 'auto') B.auto = true; else { B.auto = false; B.pct = clamp(+d.v || 0.4, 0, 0.6); } }
    else if (a === 'bksp'){ bankS().spPct = clamp(+d.v || 0, 0, 0.5); }
    else if (a === 'ledmore') ledN += 50;             // more of the bank's statement
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
    else if (a === 'member'){ if (spendable() < PRICE.member){ toast(t('no_cash')); return; } book('forsikring', -PRICE.member, 'Medlemskap i redningstjenesten', 'Rescue service membership'); S.member = true; log('Ble medlem i redningstjenesten.', 'Joined the rescue service.'); }
    else if (a === 'svc'){ const c = d.m === 'self' ? Math.round(svcCostOf(b) * 0.35) : svcCostOf(b), hh = d.m === 'self' ? 2 * YARD_H : YARD_H; if (spendable() < c){ toast(t('no_cash')); return; } if (!queueJob({kind:'svc', h:hh, self:d.m === 'self', no:d.m === 'self' ? 'Egen service på motoren' : 'Service på verkstedet', en:d.m === 'self' ? 'Servicing the engine yourself' : 'Engine service at the yard'})){ toast(L('Arbeidskøen er full.', 'The work queue is full.')); return; } book('verft', -c, d.m === 'self' ? 'Deler til motorservice' : 'Motorservice', d.m === 'self' ? 'Parts for the engine service' : 'Engine service'); }
    else if (a.slice(0, 3) === 'wk-'){ if (!WORK.act(a, d)) return; }
    else if (a.slice(0, 3) === 'dr-'){ if (!DRIFTUI.act(a, d)) return; }
    else if (a.slice(0, 3) === 'p2-'){ if (!PLAN2UI.act(a, d)) return; }   // Driftsplan 2 (ui/05d-plan2.js)
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
    else if (a === 'jobx'){ const j = (S.jobs || [])[+d.i]; if (j && j.until == null){ S.jobs.splice(+d.i, 1); gearJobCancel(j); const refund = j.kind === 'prep' ? PREP[j.k].cost : j.kind === 'fit' ? EQUIP[j.k].price : j.kind === 'hold' ? upPrice(HOLDUP[j.lv - 1].pc) : j.kind === 'eng' ? upPrice(ENGUP[j.lv - 1].pc) : j.kind === 'hull' ? 1500 + Math.round(BOAT.len * 400 / 100) * 100 : 0; book(j.kind === 'fit' ? 'redskap' : 'verft', refund, 'Avbestilt: ' + j.no, 'Cancelled: ' + j.en); } }
    else if (a === 'service'){ const c = svcCostOf(b); if (spendable() < c){ toast(t('no_cash')); return; } book('verft', -c, 'Motorservice', 'Engine service'); b.svcAt = b.engH || 0; S.svcTold = false; log('Motorservice utført.', 'Engine serviced.'); }
    else if (a === 'holdup'){ const lv = (S.boat.holdLv || 0) + 1, nx = HOLDUP[lv - 1]; if (!nx || !atKind('verft') || (S.jobs || []).some(j => j.kind === 'hold')) return; const c = upPrice(nx.pc, nx.min); if (spendable() < c) return;
      if (!queueJob({kind:'hold', lv, h:nx.h, no:'Ombygging av lasterommet', en:'Rebuilding the hold'})){ toast(L('Arbeidskøen er full.', 'The work queue is full.')); return; } book('verft', -c, 'Ombygging av lasterommet', 'Rebuilding the hold'); log('Bestilte ombygging av lasterommet, ' + kr(c) + '.', 'Ordered a rebuild of the hold, ' + kr(c) + '.'); }
    else if (a === 'upg'){ const k = d.u, U = UPGS[k], nx = U && upgNext(S.boat, k); if (!nx || !atKind('verft') || (S.jobs || []).some(j => j.kind === 'upg' && j.u === k)) return; const c = upPrice(nx.pc, nx.min); if (spendable() < c) return;
      if (!queueJob({kind:'upg', u:k, lv:upgLv(S.boat, k) + 1, h:nx.h, no:'Ombygging: ' + nx.no, en:'Rebuild: ' + nx.en})){ toast(L('Arbeidskøen er full.', 'The work queue is full.')); return; } book('verft', -c, 'Ombygging: ' + nx.no, 'Rebuild: ' + nx.en); log('Bestilte ombygging, ' + nx.no.toLowerCase() + ', ' + kr(c) + '.', 'Ordered a rebuild, ' + nx.en.toLowerCase() + ', ' + kr(c) + '.'); }
    else if (a === 'engup'){ const lv = (S.boat.engLv || 0) + 1, nx = ENGUP[lv - 1]; if (!nx || !atKind('verft') || VESSELS[S.boat.type].outboard || (S.jobs || []).some(j => j.kind === 'eng')) return; const c = upPrice(nx.pc, nx.min); if (spendable() < c) return;
      if (!queueJob({kind:'eng', lv, h:nx.h, no:'Motorbytte', en:'Engine change'})){ toast(L('Arbeidskøen er full.', 'The work queue is full.')); return; } book('verft', -c, 'Motorbytte', 'Engine change'); log('Bestilte større motor, ' + kr(c) + '.', 'Ordered a bigger engine, ' + kr(c) + '.'); }
    else if (a === 'hullfix'){ if (!atKind('verft')) return; const why = hullOrder(false); if (why){ toast(why[0] === 'no_cash' ? t('no_cash') : L('Arbeidskøen er full.', 'The work queue is full.')); return; } }
    else if (a === 'kasko'){ if (!atKind('verft')) return; if (kaskoSign()){ toast(t('no_cash')); return; } }
    else if (a === 'kaskox'){ kaskoEnd(); }
    else if (a === 'hullclean'){ if (!atKind('verft') || (S.jobs || []).some(j => j.kind === 'hull')) return; const c = 1500 + Math.round(BOAT.len * 400 / 100) * 100; if (spendable() < c) return;
      if (!queueJob({kind:'hull', h:6, no:'Skrogrens på slipp', en:'Hull cleaning on the slip'})){ toast(L('Arbeidskøen er full.', 'The work queue is full.')); return; } book('verft', -c, 'Skrogrens på slipp', 'Hull cleaning on the slip'); log('Bestilte skrogrens på slipp, ' + kr(c) + '.', 'Ordered a hull cleaning on the slip, ' + kr(c) + '.'); }
    else if (a === 'trimbuy'){ const b = S.boat, B = BOOSTS[d.k]; if (!B || !canBoost(VESSELS[b.type])) return; payBuy(d.k, () => { b.trim = {k:d.k, t0:S.t}; applyVessel(); log(B.no + ' er på i ' + B.h + ' timer. Toppfart nå ' + fmt(BOAT.vmax, 1) + ' knop.', B.en + ' is on for ' + B.h + ' hours. Top speed now ' + fmt(BOAT.vmax, 1) + ' knots.'); toast(L(B.no + ': ', B.en + ': ') + fmt(BOAT.vmax, 1) + ' kn'); }); }
    else if (a === 'equip'){ const E = EQUIP[d.k]; if (!atKind(EQ_YARD(d.k) ? 'verft' : 'butikk') || spendable() < E.price) return; if (!queueJob({kind:'fit', k:d.k, h:fitHours(d.k), no:'Montering av ' + E.name.no.toLowerCase(), en:'Fitting the ' + E.name.en})){ toast(L('Arbeidskøen er full.', 'The work queue is full.')); return; } book('redskap', -E.price, E.name.no, E.name.en); achAdd('equip'); log('Kjøpt ' + E.name.no + '. Monteres i verkstedet.', 'Bought the ' + E.name.en + '. Being fitted at the yard.'); } else if (a === 'equipOLD'){ const E = EQUIP[d.k]; if (E.multi) S.equip[d.k] = (S.equip[d.k] || 0) + 1; else S.equip[d.k] = true; applyVessel(); log('Montert: ' + E.name.no + '.', 'Fitted: ' + E.name.en + '.'); updateMapButtons(); INSTR.show(); }
    else if (a === 'hire'){ const c = candidates().find(x => x.id === d.id); if (c && S.crew.length < BOAT.crewMax){ S.crew.push(crewUpgrade(c)); log(c.name + ' er ansatt som ' + c.lv + '.', c.name + ' joined as ' + c.lvEn + '.'); } }
    else if (a === 'fire'){ if (!crewAshore()) return; const c = S.crew[+d.i]; if (c){ crewSettle(c); S.crew.splice(+d.i, 1); } if (c) log(c.name + ' har gått i land.', c.name + ' has gone ashore.'); }
    else if (a === 'repay'){ const k = d.k || 'loan', Q = S[k]; if (!Q || S.cash < 10000) return; const x = Math.min(10000, Q.bal); book('avdrag', -x, 'Ekstra innbetaling, ' + LOANS[k].who, 'Extra repayment, ' + LOANS[k].who); Q.bal -= x; if (Q.bal < 1) S[k] = null; }
    else if (a === 'repayAll'){ const k = d.k || 'loan', Q = S[k]; if (!Q || S.cash < Q.bal) return; book('avdrag', -Q.bal, 'Lånet innfridd, ' + LOANS[k].who, 'Loan paid off, ' + LOANS[k].who); S[k] = null; log((k === 'loanIN' ? 'Risikolånet' : 'Båtlånet') + ' er innfridd.', 'The ' + (k === 'loanIN' ? 'risk' : 'vessel') + ' loan is paid off.'); }
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
      S.me = v.id; log('Du gikk om bord på «' + vget(v, 'boatName') + '».', 'You went aboard the «' + vget(v, 'boatName') + '».');
      if (v.id !== S.cur){ storeVessel(curVessel()); bindVessel(v); if (typeof G3 !== 'undefined') G3.vesselChanged(); refreshAll(); } }
    else if (a === 'vname'){ const v = vesselById(d.id); if (!v) return; const nm = (prompt(L('Nytt navn på båten', 'New name for the vessel'), vget(v, 'boatName') || '') || '').replace(/[<>&"]/g, '').trim().slice(0, 20); if (!nm) return;
      if (v.id === S.cur) S.boatName = nm; else v.boatName = nm; loreRename(nm); }
    else if (a === 'vsell'){ const v = vesselById(d.id); if (!v || v.id === S.me || S.fleet.length < 2 || vget(v, 'boat').status !== 'port' || tiLocked(v)) return;
      const val = vesselValue(v), nm = vget(v, 'boatName'), hands = (vget(v, 'crew') || []).length;
      if (!confirm(L('Selge «' + nm + '» for ' + kr(val) + '?', 'Sell the «' + nm + '» for ' + kr(val) + '?') + (debt() > 0 ? ' ' + L('Pengene går først til å innfri lånene.', 'The money first pays off the loans.') : ''))) return;
      if (v.id === S.cur){ bindVessel(vesselById(S.me)); if (typeof G3 !== 'undefined') G3.vesselChanged(); }
      if (v.id === openVesselId()) openUsedSave(vget(v, 'quota'));   // § 29: the owner's open-group catch follows to the next boat
      const paid = payDown(val); S.fleet.splice(S.fleet.indexOf(v), 1); book('baat', val - paid, 'Båt solgt', 'Vessel sold');
      log('Solgte «' + nm + '» for ' + kr(val) + '.' + (paid ? ' ' + kr(paid) + ' gikk til å innfri lån.' : '') + (hands ? ' Mannskapet hennes gikk i land.' : ''), 'Sold the «' + nm + '» for ' + kr(val) + '.' + (paid ? ' ' + kr(paid) + ' went to pay off loans.' : '') + (hands ? ' Her crew went ashore.' : '')); refreshAll(); }
    else if (a === 'bhire' || a === 'bneg'){ const B = S.bors, c = B && B.pool.find(x => x.id === d.id); if (!c || S.crew.length >= BOAT.crewMax || S.boat.status !== 'port') return;
      if (a === 'bneg'){ c.neg = true; if (Math.random() < 0.6 - (c.traits.includes('stolt') ? 0.25 : 0)){ c.ask = lotR(c.ask - LOTT.step); c.share = c.ask; c.morale -= 5; toast(L(c.name.split(' ')[0] + ' godtar ' + lotS(c.ask) + '.', c.name.split(' ')[0] + ' accepts ' + lotS(c.ask) + '.')); }
        else { B.pool.splice(B.pool.indexOf(c), 1); toast(L(c.name.split(' ')[0] + ' takket nei og tok hyre et annet sted.', c.name.split(' ')[0] + ' said no and took a berth elsewhere.')); } }
      else { B.pool.splice(B.pool.indexOf(c), 1); c.hiredT = S.t; c.earn = []; delete c.until; S.crew.push(c); achAdd('crew'); log(c.name + ' har mønstret på som ' + c.lv + ' på ' + lotS(c.share) + '.', c.name + ' signed on as ' + c.lvEn + ' on ' + lotS(c.share) + '.'); } }
    else if (a === 'foundas'){ if (!foundAS()) toast(t('no_cash')); }
    else if (a === 'coff'){ const c = crewById(d.id); if (c){ c.off = !c.off; if (c.off){ c.morale = Math.min(100, c.morale + 2); } else delete c.offTrip; } }
    // lott or hyre (E3): the day wage is the one asked for when the agreement is changed
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
      else if (o === 'listen'){ if (ev.topic === 'lott'){ A.share = lotR(A.share + LOTT.step); } else if (ev.topic === 'hvile'){ A.off = true; } A.morale += ev.topic === 'lott' ? 12 : 8; }
      else if (o === 'firm'){ A.morale -= 10; if (A.traits.includes('kranglefant') || A.traits.includes('stolt')) A.morale -= 6; }
      for (const c of S.crew) c.morale = clamp(c.morale, 0, 100); S.cevt = null; }
    else if (a === 'turtake'){ const e = turTake(+d.id); if (e) toast(e); }
    else if (a === 'turdrop'){ turDrop(+d.id); }
    else if (a === 'turgo'){ turGo(+d.id); show(false); return false; }
    else if (a === 'turmeas'){ show(false); turMeasure(+d.id); return false; }
    else if (a === 'turans'){ turLeteAnswer(+d.id, +d.q, d.o); }
    else if (a === 'pttake'){ const o = (PTOW._P.open || []).find(x => String(x.id) === String(d.id)); if (o) PTOW.take(o); show(false); return false; }
    else if (a === 'ptgo'){ const H = S.ptowH; show(false); if (H && typeof leiaTo === 'function'){ if (typeof openPlotter === 'function') openPlotter(); leiaTo({x:H.x, y:H.y}); } return false; }
    else if (a === 'ptdrop'){ PTOW.drop(); }
    else if (a === 'turfoto'){ turFotoShoot(+d.id); }
    else if (a === 'ordtake'){ const O = ordState(), o = O.offers.find(x => x.id === +d.id); if (!o || O.active.length >= 3) return; O.offers.splice(O.offers.indexOf(o), 1); o.due = S.t + o.days * 1440; O.active.push(o); log('Tok en bestilling fra ' + CUSTOMERS.find(c => c.id === o.cust).no + '.', 'Took an order from ' + CUSTOMERS.find(c => c.id === o.cust).no + '.'); }
    else if (a === 'cloth'){ const C = CLOTHES[d.k], people = 1 + S.crew.length, have = (S.clothes || {})[d.k] || 0; if (!C || have >= people) return; if (spendable() < C.price){ toast(t('no_cash')); return; } book('land', -C.price, C.no, C.en); S.clothes = S.clothes || {olje:0, varme:0}; S.clothes[d.k] = have + 1; log('Kjøpte ' + C.no.toLowerCase() + '.', 'Bought ' + C.en.toLowerCase() + '.'); }
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
      const l = S.lic; if (!l || !structRoom(l, d.id) || !atTrade()) return; const pr = structPrice(d.id, S.t / 60), x = deal(pr, 0); if (!x.ok){ toast(whyText(x) || t('no_cash')); return; } finance(x, 180);
      const sl = regSeller(d.id, S.t / 60), k = structIn(l, d.id, S.t / 60); pressPut('kvote', {kf:Math.round(k * 10000), type:S.boat.type});
      msg('Fiskeridirektoratet', 'Strukturkvoten er tildelt «' + S.boatName + '»: kvotefaktor ' + fmt(k, 4) + ' fra båten til ' + sl.name + ' (' + HJ[d.id].hl + '), som er tatt ut av registeret. Den gjelder i 20 år.', 'The structure quota is granted to the «' + S.boatName + '»: quota factor ' + fmt(k, 4) + ' from ' + sl.name + '\'s boat (' + HJ[d.id].hl + '), which is struck off the register. It runs for 20 years.'); }
    else if (a === 'two'){
      // the special scheme under 11 m: one boat fishes both quotas, the other right is given up and the boat sold
      const va = vesselById(d.a), vb = vesselById(d.b); if (!va || !vb || vb.id === S.me || !twoOK(vget(va, 'lic'), vget(vb, 'lic'), yearH(S.t / 60)) || vget(vb, 'boat').status !== 'port') return;
      const la = vget(va, 'lic'), lb = vget(vb, 'lic'), nb = vget(vb, 'boatName'), val = Math.round(VESSELS[vget(vb, 'boat').type].price * 0.7);
      if (!confirm(L('«' + nb + '» oppgir hjemmelen og selges for ' + kr(val) + '. «' + vget(va, 'boatName') + '» fisker begge kvotene. Fortsette?', '«' + nb + '» gives up its right and is sold for ' + kr(val) + '. «' + vget(va, 'boatName') + '» fishes both quotas. Go on?'))) return;
      la.two = lb.id; licExtra(la); if (vb.id === S.cur){ bindVessel(va); if (typeof G3 !== 'undefined') G3.vesselChanged(); }
      const paid = payDown(val); S.fleet.splice(S.fleet.indexOf(vb), 1); book('baat', val - paid, 'Båt solgt', 'Vessel sold');
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

