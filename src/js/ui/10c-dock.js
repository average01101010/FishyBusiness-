// ---------- the dock: round buttons along the bottom that follow what the boat is doing, and the drawer at the side ----------
// In port Marked, Bygd and Verft open a fan of smaller buttons above them, and their pages open in the drawer at the side (a sheet
// from below when the screen stands), never in a big window in the middle. At sea: jig, set and haul gear, auto-nav, the inventory.
// The pages themselves are the phone's (PHONE.page); this file only decides which buttons there are and where things open.
const DOCK = (() => {
  const bar = $('dock'), info = $('dockInfo'), fan = $('dockFan'), dr = $('drawer'), dBody = $('drawerBody'), dTitle = $('drawerTitle'), dTabs = $('drawerTabs');
  const L = (no, en) => S.lang === 'no' ? no : en;
  const SVG = d => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
  const IC = {
    marked:SVG('<path d="M3 9l2-5h14l2 5"/><path d="M3 9h18v1.5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13.5V20h14v-6.5"/><path d="M10 20v-4h4v4"/>'),
    bygd:SVG('<path d="M3 20v-9l5-4 5 4v9"/><path d="M13 20v-6l4-3 4 3v6"/><path d="M2 20h20"/><path d="M7 20v-4h2v4"/>'),
    maler:SVG('<rect x="3" y="3" width="14" height="6" rx="1.5"/><path d="M17 6h3v5h-8v3"/><rect x="10.5" y="14" width="3" height="7" rx="1"/>'),
    verft:SVG('<path d="M6 21V3"/><path d="M3 21h7"/><path d="M6 4h14"/><path d="M6 9l5-5"/><path d="M17 4v6"/><path d="M15 12h4v1.5a2 2 0 0 1-4 0z"/>'),
    kart:SVG('<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>'),
    beh:SVG('<path d="M3 8l9-4 9 4v9l-9 4-9-4z"/><path d="M3 8l9 4 9-4M12 12v9"/>'),
    jukse:SVG('<path d="M15 3v9.5a4.5 4.5 0 0 1-9 0V10l-2.2 2.2"/><path d="M6 10l2.2 2.2"/><circle cx="15" cy="3" r="1.2"/>'),
    settut:SVG('<path d="M4 4v5"/><circle cx="4" cy="11" r="2"/><path d="M6.5 11h11" stroke-dasharray="2 2.4"/><circle cx="20" cy="11" r="2"/><path d="M20 4v5"/><path d="M2 19c3.3-1.6 6.7-1.6 10 0s6.7 1.6 10 0"/>'),
    taopp:SVG('<path d="M12 17V4"/><path d="M7 9l5-5 5 5"/><path d="M2 20c3.3-1.6 6.7-1.6 10 0s6.7 1.6 10 0"/>'),
    nav:SVG('<path d="M12 3l7 18-7-4-7 4z"/>'),
    stopp:SVG('<rect x="6" y="6" width="12" height="12" rx="2"/>'),
    hjem:SVG('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>'),
    sloy:SVG('<path d="M3 21l11-11 3 3-8 8z"/><path d="M14 10l4-4a2.1 2.1 0 0 1 3 3l-4 4"/>'),
    videre:SVG('<path d="M8 5l11 7-11 7z"/>'),
    juks:SVG('<path d="M6 3v13"/><path d="M3 6h6"/><path d="M6 16l-2 3h4z"/><path d="M14 4c3 2 5 5 5 9a5 5 0 0 1-10 0"/><path d="M14 4v6"/>'),
    hjelp:SVG('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.8"/><path d="M6 6l3.3 3.3M18 6l-3.3 3.3M6 18l3.3-3.3M18 18l-3.3-3.3"/>'),
    loss:SVG('<circle cx="12" cy="5" r="2"/><path d="M12 7v13"/><path d="M5 13a7 7 0 0 0 14 0"/><path d="M8 10h8"/>'),
    avbryt:SVG('<path d="M6 6l12 12M18 6L6 18"/>'),
    lever:SVG('<path d="M4 11h16v9H4z"/><path d="M4 15h16"/><path d="M12 2.5v6"/><path d="M9 6l3 3 3-3"/>'),
    is:SVG('<path d="M12 2v20M3.5 7l17 10M20.5 7l-17 10"/><path d="M9 3.5l3 2 3-2M9 20.5l3-2 3 2"/>'),
    agn:SVG('<path d="M3 12c3-4 8-5 12-3l4-3v12l-4-3c-4 2-9 1-12-3z"/><circle cx="7.5" cy="11" r=".8" fill="currentColor"/>'),
    pub:SVG('<path d="M5 9h10v11H5z"/><path d="M15 12h2.5a2 2 0 0 1 0 4H15"/><path d="M5 9a2.5 2.5 0 0 1 3-3 3 3 0 0 1 5 0 2 2 0 0 1 2 3"/>'),
    bank:SVG('<path d="M3 9l9-5 9 5"/><path d="M5 9v9M10 9v9M14 9v9M19 9v9"/><path d="M3 20h18"/>'),
    oppdrag:SVG('<path d="M8.5 3.5h7v3h-7z"/><path d="M8 5H5v16h14V5h-3"/><path d="M8 11h8M8 15h5"/>'),
    mannskap:SVG('<circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M2.5 19c.6-3.3 2.8-5 5.5-5s4.9 1.7 5.5 5"/><path d="M12.5 14.4c.9-.3 2.2-.4 3.5-.4 2.7 0 4.9 1.7 5.5 5"/>'),
    batmarked:SVG('<path d="M3 15h18l-2.5 4.5H6z"/><path d="M8 15V9h6l2 6"/><path d="M11 9V5"/>'),
    oppgr:SVG('<path d="M14.5 5.5a4 4 0 0 0-5 5L3.8 16.2a1.8 1.8 0 0 0 2.5 2.5l5.7-5.7a4 4 0 0 0 5-5l-2.5 2.5-2.3-.5-.5-2.3z"/>'),
    fiskeutstyr:SVG('<circle cx="12" cy="15" r="4.5"/><path d="M12 10.5V3l5 2-5 2"/>'),
    anker:SVG('<circle cx="12" cy="5" r="2"/><path d="M12 7v14"/><path d="M8 11h8"/><path d="M5 15a7 7 0 0 0 14 0"/><path d="M3.5 16.5L5 15l1.5 1.5M17.5 16.5L19 15l1.5 1.5"/>'),
    arbeid:SVG('<circle cx="7" cy="6" r="2.5"/><path d="M3 20v-3a4 4 0 0 1 8 0v3"/><path d="M14 7h7"/><path d="M18 4l3 3-3 3"/><path d="M14 15h7"/><path d="M18 12l3 3-3 3"/>'),
    rigg:SVG('<path d="M12 3v18"/><path d="M5 21h14"/><path d="M12 4l7 11h-7"/><path d="M12 7L6 15h6"/>'),
    vedlikehold:SVG('<path d="M4 20l7-7"/><path d="M13.5 4.5l6 6-3 3-6-6z"/><path d="M10.5 7.5l6 6"/>'),
    naust:SVG('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/><path d="M2 21h20"/>'),
    butikk:SVG('<path d="M4 9l1.5-5h13L20 9"/><path d="M4 9v11h16V9"/><path d="M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0A2.7 2.7 0 0 0 20 9"/><path d="M10 20v-5h4v5"/>'),
    bunker:SVG('<path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16"/><path d="M3 21h14"/><path d="M7.5 8h5"/><path d="M15 9h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V8l-3-3"/>')};
  // the drawer's pages: title, and the pages that share a row of tabs
  const TITLE = {lever:['Lever fangst', 'Land the catch'], is:['Is', 'Ice'], agn:['Agn og egning', 'Bait and baiting'], bank:['Kystbanken', 'The bank'], oppdrag:['Oppdrag', 'Orders'],
    mannskap:['Mannskap', 'Crew'], bors:['Mannskap', 'Crew'], fartoy:['Båthandel', 'Boat market'], maler:['Malerverksted', 'Paint shop'], utstyr:['Oppgraderinger', 'Upgrades'], utstyrb:['Elektronikk og haler', 'Electronics and haulers'], fiske:['Fiskeutstyr', 'Tackle'], service:['Service', 'Service'],
    redskap:['Redskap', 'Gear'], rigg:['Rigg', 'Rig'], arbeid:['Mannskap', 'Crew'], drift:['Driftsplan', 'Operations plan'], verksted:['Vedlikehold', 'Maintenance'], havn:['Havn', 'Harbour'], last:['Lasterom', 'Hold'], beholdning:['Beholdning', 'Inventory']};
  const TABS = {mannskap:[['mannskap', 'Om bord', 'Aboard'], ['bors', 'Mannskapsbørs', 'Crew exchange']], bors:null};
  TABS.bors = TABS.mannskap;
  let menu = null, page = null, html = '', fanHtml = '', items = [], fanItems = [];

  // an item: id, icon, label [no, en], and what it does: run (a function), act (doAct), page (drawer) or menu (a fan)
  const I = (id, ic, no, en, o) => Object.assign({id, ic, lbl:[no, en]}, o || {});
  const port = () => S.boat.status === 'port' ? portById(S.boat.port) : null;
  // resting ashore (15-energy.js): in Father's naust in the home harbour, or in a rorbu; the button goes in, and aboard again
  function restItem(){
    const b = S.boat, w = restWhere(b); if (!w) return null;
    if (resting()) return I('rest', 'naust', 'Om bord', 'Aboard', {act:'restend'});
    return I('rest', 'naust', 'Hvil', 'Rest', {act:'rest', pri:S.energy < (w === 'rorbu' ? 60 : 40)});
  }
  // at home the rest is in the Bygd fan, and on the dock itself when you are tired or resting (five buttons crowd a phone)
  const restOnDock = () => resting() || S.energy < 40;
  function portItems(){
    const b = S.boat, p = port(), tot = holdTotal(), busy = portBusy(b);
    // a rorbu has a bed and a quay, nothing more (07d-rorbu.js)
    if (p.rorbu) return [restItem(), S.crew.length || S.ops ? I('arbeid', 'arbeid', 'Mannskap', 'Crew', {page:'arbeid'}) : null, I('beh', 'beh', 'Beholdning', 'Inventory', {page:'beholdning'})].filter(Boolean);
    // Father's naust is a home, not a place of trade (Jonas 07.10.2026): rest, the boathouse itself, the crew and the inventory; the
    // shop, the plant and the yard are at their own quays
    if (berthKind(b) === 'naust') return [restItem(), I('naustup', 'naust', 'Naustet', 'Boathouse', {run:() => PHONE.open('notat')}), S.crew.length || S.ops ? I('arbeid', 'arbeid', 'Mannskap', 'Crew', {page:'arbeid'}) : null, I('beh', 'beh', 'Beholdning', 'Inventory', {page:'beholdning'})].filter(Boolean);
    // the three places of trade (Jonas 07.10.2026): the plant (core/06c-steder.js portServices) takes the catch and sells ice, bait and fuel,
    // the tackle shop sells gear and electronics, the yard sells and mends boats and sells fuel; each has its own button, and all three have the village
    const sv = portServices(p, berthKind(b));
    return [restOnDock() ? restItem() : null,
      sv.mottak ? I('marked', 'marked', 'Mottak', 'Plant', {menu:'marked', dot:p.mottak && tot > 0.5 && !b.land}) : null,
      sv.butikk ? I('butikk', 'butikk', 'Butikk', 'Shop', {menu:'butikk'}) : null,
      I('bygd', 'bygd', 'Bygd', 'Village', {menu:'bygd'}),
      sv.verft ? I('verft', 'verft', 'Verft', 'Yard', {menu:'verft', dot:svcOverdue() > 0}) : null,
      S.crew.length || S.ops ? I('arbeid', 'arbeid', 'Mannskap', 'Crew', {page:'arbeid'}) : null,
      I('beh', 'beh', 'Beholdning', 'Inventory', {page:'beholdning'})].filter(Boolean);   // «Planlegg» went 02.10.2026: the little chart opens the plotter
  }
  function menuItems(m){
    const b = S.boat, p = port(), H = S.t / 60;
    // fuel is sold at the plant and at the yard (Jonas 07.10.2026)
    const bunkerItem = () => { const need = BOAT.fuelCap - b.fuel;
      return I('bunker', 'bunker', 'Bunkring', 'Fuel', {act:'fuel', off:!p.fuel ? [L('Det er ikke drivstoff å få i ' + p.name + '.', 'There is no fuel to be had in ' + p.name + '.')] : need < 0.5 ? [L('Tanken er full.', 'The tank is full.')] : portBusy(b) ? [L('Vent til arbeidet på kaia er ferdig.', 'Wait until the work on the quay is done.')] : null}); };
    if (m === 'marked') return [
      I('lever', 'lever', 'Lever', 'Land', {page:'lever', off:!p.mottak && [L('Det er ikke noe fiskemottak i ' + p.name + '.', 'There is no fish plant in ' + p.name + '.')], pri:p.mottak && holdTotal() > 0.5 && !b.land}),
      I('is', 'is', 'Is', 'Ice', {page:'is'}),
      I('agn', 'agn', 'Agn', 'Bait', {page:'agn'}),
      bunkerItem()];
    // the tackle shop: fishing gear, and the electronics and engines' small parts (the yard has the boat's own upgrades)
    if (m === 'butikk') return [
      I('fiskeutstyr', 'fiskeutstyr', 'Fiskeutstyr', 'Tackle', {page:'fiske'}),
      I('service', 'vedlikehold', 'Service', 'Service', {page:'service'}),
      I('elektronikk', 'oppgr', 'Elektronikk og haler', 'Electronics and haulers', {page:'utstyrb'})];
    if (m === 'bygd') return [
      I('pub', 'pub', 'Pub', 'Pub', {act:'pub', off:tutOn() ? [L('Puben venter til etter første tur.', 'The pub waits until after the first trip.')] : !pubOpen(H) ? [L('Puben åpner klokka 15.', 'The pub opens at 15:00.')] : null}),
      I('bank', 'bank', 'Bank', 'Bank', {page:'bank'}),
      I('oppdrag', 'oppdrag', 'Oppdrag', 'Orders', {page:'oppdrag'}),
      I('mannskap', 'mannskap', 'Ansatte', 'Employees', {page:'mannskap'}), restOnDock() ? null : restItem(),
      // Father's naust in the home harbour: setting it to rights is in the notebook (core/07c-naust.js, ui/06c-notebook.js)
      atHome(b) ? I('naustup', 'naust', 'Naustet', 'Boathouse', {run:() => PHONE.open('notat')}) : null].filter(Boolean);
    if (m === 'verft') return [
      I('batmarked', 'batmarked', 'Båthandel', 'Boats', {page:'fartoy'}),
      I('oppgr', 'oppgr', 'Oppgrader', 'Upgrade', {page:'utstyr'}),
      I('vedlikehold', 'vedlikehold', 'Vedlikehold', 'Maintenance', {page:'verksted', dot:svcOverdue() > 0}),
      I('maler', 'maler', 'Malerverksted', 'Paint shop', {page:'maler'}),
      bunkerItem()];
    if (m === 'settut') return setChoices().map((c, i) => I('set' + i, 'settut', c.lbl[0], c.lbl[1], {act:'gset', data:{c:i}, wide:true}));
    if (m === 'fortoy') return moorAll(b.pos, 0.4).map((q, i) => I('fortoy' + i, 'naust', q.name.charAt(0).toUpperCase() + q.name.slice(1), q.name.charAt(0).toUpperCase() + q.name.slice(1), {run:() => moorGo(q), wide:true}));
    if (m === 'taopp'){ const s = nearSet(b.pos, 0.3); if (!s) return [];
      return [I('haul', 'taopp', 'Trekk', 'Haul', {act:'ghaul', data:{id:s.id}, pri:true}), I('haulset', 'settut', 'Trekk og sett igjen', 'Haul and set again', {act:'ghaul', data:{id:s.id, r:'1'}, wide:true})]; }
    return [];
  }
  // the nearest of your own buoys, for the haul button's hint
  function nearestBuoy(){ let best = null; for (const s of mySets()) for (const e of [s.a, s.b]){ const d = dist(S.boat.pos, e); if (!best || d < best.d) best = {s, d}; } return best; }
  function seaItems(){
    // a quarrel aboard waits for an answer, also at sea
    const crew = S.cevt && I('mannskap', 'mannskap', 'Ansatte', 'Employees', {page:'mannskap', dot:true});
    const work = (S.crew.length || S.ops) && I('arbeid', 'arbeid', 'Mannskap', 'Crew', {page:'arbeid'});
    const b = S.boat, beh = I('beh', 'beh', 'Beholdning', 'Inventory', {page:'beholdning'});   // no «Hjem» (the user's wish 02.10.2026: Autonav to the harbour, or «Returner samme vei» in the plotter)
    const nav = I('nav', 'nav', 'Auto-nav', 'Auto-nav', {run:autoNav});
    if (b.status === 'idle'){
      const s = nearSet(b.pos, 0.3), nb = nearestBuoy(), ch = setChoices();
      const haul = s ? (s.kind === 'line' ? I('taopp', 'taopp', 'Ta opp', 'Haul', {act:'ghaul', data:{id:s.id}, pri:true}) : I('taopp', 'taopp', 'Ta opp', 'Haul', {menu:'taopp', pri:true}))
        : I('taopp', 'taopp', 'Ta opp', 'Haul', {off:[nb ? L('Nærmeste blåse er ' + fmt(nb.d / NM, 1) + ' nm unna. Bruk Auto-nav og trykk på blåsa.', 'The nearest buoy is ' + fmt(nb.d / NM, 1) + ' nm away. Use auto-nav and tap the buoy.') : L('Du har ikke redskap i sjøen.', 'You have no gear in the sea.')]});
      // «Jukse» only on a boat rigged for jigging (the user's wish 02.10.2026)
      // a quay within 400 m: «Fortøy» takes her in (moorGo), to a rorbu's, the naust's or a harbour's (16-helm.js moorAll); with more
      // than one in reach it opens a fan with each, nearest first (tilbakemelding #23: by a rorbu it only ever went back to the rorbu)
      const ml = moorAll(b.pos, 0.4), mo = ml[0], moor = mo && I('fortoy', 'naust', 'Fortøy', 'Moor', Object.assign(ml.length > 1 ? {menu:'fortoy'} : {run:() => moorGo(mo)}, {pri:mo.kind === 'rorbu' || mo.kind === 'naust' || S.energy < 40}));
      // anchor: the boat keeps her place and the crew rests; the anchor can drag in weather the boat does not hold (06e-anchor.js)
      const sp = !b.anch && anchorSpot(b.pos), anc = b.anch ? I('anker', 'anker', 'Hiv anker', 'Weigh anchor', {run:() => { weighAnchor(); refreshAll(); }, on:true}) : !moor ? I('anker', 'anker', 'Kast anker', 'Drop anchor', sp && sp.ok ? {run:() => { dropAnchor(); refreshAll(); }} : {off:[sp && anchorWhy[sp.why] ? L(anchorWhy[sp.why][0], anchorWhy[sp.why][1]) : L('Ikke her.', 'Not here.')]}) : null;
      return [I('jukse', 'jukse', 'Jukse', 'Jig', {menu:'jukse', pri:!s}),
        I('settut', 'settut', 'Sett ut', 'Set', {menu:'settut', off:rigJig() ? [L('Båten er rigget for juksa. Rigg om til line, garn eller teiner under Beholdning.', 'The boat is rigged for jigging. Re-rig for line, nets or pots under Inventory.')] : !ch.length && [S.pgear && (S.pgear.nets.length || S.pgear.lines.hyse.n || S.pgear.lines.bank.n || S.pgear.pots.small || S.pgear.pots.big) ? L('Redskapet om bord er ikke klart: line må egnes, og teiner trenger agn og blåsesett.', 'The gear aboard is not ready: line must be baited, and pots need bait and buoy sets.') : L('Du har ikke garn, line eller teiner om bord.', 'You have no nets, line or pots aboard.')]}),
        // by a quay with no buoy near, «Fortøy» takes the place of the greyed «Ta opp», so the row stays five wide on a phone
        s || !moor ? haul : null, moor, nav, anc, crew, work, beh].filter(Boolean);
    }
    if (b.status === 'fishing' && b.gop) return [I('gstop', 'stopp', 'Stopp arbeidet', 'Stop the work', {act:'gstop'}), work, beh].filter(Boolean);
    if (b.status === 'fishing') return [I('stopfish', 'stopp', 'Stopp', 'Stop', {act:'stopfish'}),
      b.deckStop && !b.deckEnd ? I('deckgo', 'videre', 'Fisk videre', 'Fish on', {act:'deckgo', pri:true}) : !b.deckStop && deckPending() > 0.5 ? I('deckstop', 'sloy', 'Stopp og sløy', 'Stop and gut', {act:'deckstop'}) : null,
      G3.isActive() && window.JIGG && (window.jigActive || window.JIGG.ok()) ? I('jigg', 'juks', window.jigActive ? 'Slutt å jukse' : 'Jukse selv', window.jigActive ? 'Stop jigging' : 'Jig yourself', {act:'jigg', pri:!window.jigActive, on:!!window.jigActive}) : null, crew, work, beh].filter(Boolean);
    if (b.status === 'sailing') return [I('stop', 'stopp', 'Stopp båten', 'Stop', {act:'stop'}), nav, crew, work, beh].filter(Boolean);
    if (b.status === 'tow') return [beh];   // the tow takes its time (no fast forward: one clock for everyone)
    if (b.status === 'adrift' || b.status === 'engine' || b.status === 'aground') return [I('hjelp', 'hjelp', 'Hjelp', 'Help', {run:() => PHONE.open('redning'), warn:true}), beh];
    return [beh];
  }
  // what stands above the buttons: work at the quay, the yard, the deck, the jig's time left
  function infoText(){
    const b = S.boat, out = [];
    if (S.plan && S.plan.depAt) out.push(L('Avgang ', 'Departs ') + hm(S.plan.depAt / 60));
    if (b.status === 'port'){ if (S.jobs && S.jobs.length) out.push(L('Verksted til ', 'Yard until ') + hm((jobsDone() || S.t) / 60)); if (b.land) out.push(landText(true)[0]); if (b.shift || b.fueling) out.push(quayText(true)[0]); }
    if (b.status === 'port' && !resting() && restWhere(b) === 'rorbu') out.push(L('Rorbu: ' + kr(RORBU.kr) + ' natta', 'Rorbu: ' + kr(RORBU.kr) + ' a night'));
    // in the home harbour, which of the two berths she lies at: Father's naust or the plant's quay (07-harbours.js berthKind)
    if (b.status === 'port' && !resting() && atHome(b) && quayFace(b.port, 'naust')){ const k = BERTHN[berthKind(b)] || BERTHN.main; out.push(L('Ved ' + k[0], 'At ' + k[1])); }
    if (b.status === 'port' && resting()){ const r = restRate(b), m = r > 0 ? Math.ceil((100 - S.energy) / r) : 0, up = S.rest.w === 'naust' ? Math.round((naustRest(b) - 1) * 100) : 0;
      out.push((S.rest.w === 'rorbu' ? L('Hviler på rorbua', 'Resting at the rorbu') : L('Hviler i naustet', 'Resting in the boathouse')) + ' · ' + Math.round(S.energy) + ' %' + (up > 0 ? L(' · ' + up + ' % raskere', ' · ' + up + ' % faster') : '') + (m > 0 ? L(', uthvilt kl. ', ', rested at ') + hm((S.t + m) / 60) : '')); }
    if (b.status === 'unmooring') out.push(L('Kaster loss …', 'Casting off …'));
    if (b.gop){ const g = gopText(); if (g) out.push(L(g[0], g[1])); }
    else if (b.status === 'fishing' && b.fishUntil != null) out.push(L('Jukser, stopper ', 'Jigging, stops ') + inReal(b.fishUntil - S.t));
    const dk = b.status !== 'port' && deckText(true); if (dk) out.push(dk[0]);
    return out.join(' · ');
  }
  function items0(){
    const b = S.boat;
    if (S.plan && S.plan.depAt) return [I('depnow', 'loss', 'Kast loss', 'Cast off', {act:'depnow', pri:true}), I('depcancel', 'avbryt', 'Avbryt', 'Cancel', {act:'depcancel'}), I('beh', 'beh', 'Beholdning', 'Inventory', {page:'beholdning'})];
    if (b.status === 'port') return portItems();
    return seaItems();
  }
  const btn = (x, small) => '<button type="button" class="dk-b' + (small ? ' sm' : '') + (x.pri ? ' pri' : '') + (x.warn ? ' warn' : '') + (x.on ? ' on' : '') + (x.off ? ' off' : '') + (x.wide ? ' wide' : '') + (menu === x.menu && x.menu ? ' open' : '') + '" data-dk="' + x.id + '"' + (x.act ? ' data-act="' + x.act + '"' : '') + (x.off ? ' aria-disabled="true"' : '') + '><span class="dk-i">' + IC[x.ic] + (x.dot ? '<i class="dk-dot"></i>' : '') + '</span><span class="dk-l">' + L(x.lbl[0], x.lbl[1]) + '</span></button>';
  // the jig's fan is a small card: hours, start, and halibut or mixed
  function jigCard(){
    const b = S.boat, cl = kveiteClosed(S.t / 60);
    return '<div class="dk-card"><div class="dk-step"><button type="button" data-dk="fh-" aria-label="−">−</button><b>' + S.fishPlanH + ' t</b><button type="button" data-dk="fh+" aria-label="+">+</button></div>' +
      '<button type="button" class="dk-go" data-dk="startfish">' + L('Start jukse', 'Start jigging') + '</button>' +
      (b.kgear ? '<button type="button" class="dk-tg' + (S.target === 'kveite' && !cl ? ' on' : '') + '" data-dk="target"' + (cl ? ' disabled' : '') + '>' + (cl ? L('Kveita er fredet', 'Halibut closed') : S.target === 'kveite' ? L('Fisker kveite', 'Fishing halibut') : L('Blandet fiske', 'Mixed fishing')) + '</button>' : '') + '</div>';
  }
  function render(){
    if (!bar) return;
    items = items0();
    if (menu && !items.some(x => x.menu === menu)) menu = null;
    const h = items.map(x => btn(x)).join(''), it = infoText();
    if (h !== html){ html = h; bar.innerHTML = h; }
    if (info.textContent !== it){ info.textContent = it; info.hidden = !it; }
    fanItems = menu && menu !== 'jukse' ? menuItems(menu).filter(Boolean) : [];
    const fh = !menu ? '' : menu === 'jukse' ? jigCard() : fanItems.map(x => btn(x, true)).join('');
    if (fh !== fanHtml){ fanHtml = fh; fan.innerHTML = fh; }
    fan.hidden = !menu; if (menu) placeFan();
    if (page) drawTabs();
  }
  // the fan stands centred over its button, inside the screen
  function placeFan(){
    const pb = bar.querySelector('[data-dk="' + (items.find(x => x.menu === menu) || {}).id + '"]'); if (!pb) return;
    const r = pb.getBoundingClientRect(), wr = fan.parentNode.getBoundingClientRect(), w = fan.offsetWidth;
    fan.style.left = clamp(r.left + r.width / 2 - w / 2 - wr.left, 8, wr.width - w - 8) + 'px';
  }
  function setMenu(m){ menu = menu === m ? null : m; html = ''; render(); }
  // «Kjør dit» in the inventory: the way to a point just off the nearer buoy, and away
  function goTo(s){
    const b = S.boat; menu = null;
    if (b.status === 'sailing'){ S.plan = null; b.status = 'idle'; b.v = 0; }
    if (!['idle', 'port'].includes(b.status) || (S.plan && S.plan.depAt)){ toast(L('Båten er opptatt. Stopp det den holder på med først.', 'The boat is busy. Stop what it is doing first.')); return; }
    if (S.draft.length) draftEdit(() => { S.draft = []; });
    close(); openPlotter();
    leiaTo(buoyStandoff(s, dist(b.pos, s.a) <= dist(b.pos, s.b) ? s.a : s.b), true);
  }
  // «Fortøy»: the way in to the quay found as Autonav finds it, and off she goes, without the chart
  async function moorGo(mo){
    const b = S.boat; menu = null;
    if (b.status !== 'idle' || (S.plan && S.plan.depAt)){ toast(L('Båten er opptatt. Stopp det den holder på med først.', 'The boat is busy. Stop what it is doing first.')); return; }
    if (!meAboard() && !crewAboard().length){ toast(L('Båten har ikke mannskap. Uten deg om bord trenger den folk.', 'The boat has no crew. Without you aboard it needs hands.')); return; }
    let res; try { res = await leiaRoute({x:b.pos.x, y:b.pos.y}, {x:mo.x, y:mo.y}, null, mo.id); } catch (e){ console.error(e); res = {why:['Fant ingen vei inn.', 'Found no way in.']}; }
    if (res.why){ toast(L(res.why[0], res.why[1])); return; }
    if (b.status !== 'idle') return;   // something else started while the way was found
    if (S.draft.length) draftEdit(() => { S.draft = []; });
    const wps = res.wps.map((q, i) => i === res.wps.length - 1 ? {x:mo.x, y:mo.y, port:mo.id, berth:mo.berth, fish:0} : {x:q.x, y:q.y, port:null, fish:0, leia:true});
    S.plan = {wps, idx:0, speed:S.draftSpeed || BOAT.cruise || 6, returning:false}; b.status = 'sailing';
    toast(L('Legger til ved ' + mo.name + '.', 'Coming in to ' + mo.name + '.')); save(); refreshAll();
  }
  // Auto-nav: the chart opens with Autonav ready; a tap on a buoy or the sea makes the route there, and «Kast loss» sets off
  function autoNav(){
    const b = S.boat; menu = null;
    if (b.status === 'sailing'){ S.plan = null; b.status = 'idle'; b.v = 0; }
    if (S.draft.length) draftEdit(() => { S.draft = []; });
    openPlotter(); leiaArm(true);
    if (LEIA_ARM) toast(L('Trykk på en blåse eller et sted i kartet, så trykker du «Kast loss».', 'Tap a buoy or a place on the chart, then tap «Cast off».'));
  }
  function run(x){
    if (!x) return;
    if (x.off){ toast(L(x.off[0], x.off[1] || x.off[0])); return; }
    if (x.menu){ setMenu(x.menu); return; }
    menu = null; html = '';
    if (x.page) open(x.page);
    else if (x.run) x.run();
    else if (x.act) doAct({dataset:Object.assign({act:x.act}, x.data || {}), disabled:false});
    render();
  }
  bar.addEventListener('click', e => { const el = e.target.closest('[data-dk]'); if (el) run(items.find(x => x.id === el.dataset.dk)); });
  fan.addEventListener('click', e => {
    const el = e.target.closest('[data-dk]'); if (!el || el.disabled) return; const k = el.dataset.dk;
    if (k === 'fh-' || k === 'fh+'){ S.fishPlanH = clamp(S.fishPlanH + (k === 'fh+' ? 1 : -1), 1, 12); save(); fanHtml = ''; render(); return; }
    if (k === 'startfish' || k === 'target'){ if (k === 'startfish') menu = null; doAct({dataset:{act:k}, disabled:false}); fanHtml = ''; html = ''; render(); return; }
    run(fanItems.find(x => x.id === k));
  });
  // a tap anywhere else folds the fan away
  document.addEventListener('pointerdown', e => { if (menu && !e.target.closest('#dockFan,#dock')){ menu = null; html = ''; render(); } }, true);

  // ---- the drawer
  function drawTabs(){
    const tb = TABS[page]; const th = tb ? tb.map(([k, no, en]) => '<button type="button" class="' + (k === page ? 'on' : '') + '" data-pg="' + k + '">' + L(no, en) + '</button>').join('') : '';
    if (dTabs.innerHTML !== th) dTabs.innerHTML = th; dTabs.hidden = !tb;
  }
  let shown = '';
  function draw(keep){
    if (PAINT) PAINT.live(page === 'maler' && !dr.hidden);   // the paint shop's camera and colour go with its page (ui/10j-paint.js)
    if (!page) return;
    const y = keep ? dBody.scrollTop : 0, t0 = TITLE[page] || [page, page];
    dTitle.textContent = L(t0[0], t0[1]); drawTabs();
    const h = PHONE.page(page); if (h !== shown){ shown = h; dBody.innerHTML = h; } dBody.scrollTop = y;
  }
  function open(a){
    const [pg, sb] = String(a).split(':'); if (!PHONE.DRAWER.has(pg)) return;
    const was = page; page = pg; menu = null; html = '';
    if (sb) PHONE.dact(pg, 'sub', {s:sb});
    dr.hidden = false; document.body.classList.add('dk-open'); shown = ''; draw(was === pg); render();
  }
  function close(){ page = null; dr.hidden = true; document.body.classList.remove('dk-open'); shown = ''; html = ''; if (PAINT) PAINT.live(false); render(); }
  dTabs.addEventListener('click', e => { const el = e.target.closest('[data-pg]'); if (el){ page = el.dataset.pg; shown = ''; draw(false); } });
  $('drawerClose').addEventListener('click', close);
  dBody.addEventListener('click', e => {
    const el = e.target.closest('[data-pa],[data-act]'); if (!el || el.disabled) return;
    if (el.dataset.pa){
      const next = PHONE.dact(page, el.dataset.pa, el.dataset);
      if (next !== page){ const pg = String(next).split(':')[0]; if (PHONE.DRAWER.has(pg)){ page = pg; draw(false); } else if (next !== 'home') PHONE.open(next); }
    } else doAct(el);
    draw(true); render();
  });
  dBody.addEventListener('input', e => panelInput(e));
  dBody.addEventListener('change', e => panelChange(e));
  // the drawer's page follows the game, a few times a second at most, and never while a finger is on it
  let lastDraw = 0;
  function tick(){ if (!page) return; const now = performance.now(); if (now - lastDraw < 700 || dBody.matches(':active')) return; lastDraw = now; draw(true); }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && page && !PHONE.isOpen()) close(); });
  // the buttons as text, for the tests: the labels, and the status above them
  const text = () => items0().map(x => L(x.lbl[0], x.lbl[1])).join(' | ') + (infoText() ? ' | ' + infoText() : '');
  const redraw = () => { if (page){ lastDraw = performance.now(); draw(true); } };   // at once, after something that came later (a picture read, a payment)
  return {render, redraw, open, close, tick, text, goTo, items:m => m ? menuItems(m).filter(Boolean) : items0(), menu:m => setMenu(m), get page(){ return page; }, get menuOpen(){ return menu; }};
})();
// the old name: everything that changes what the boat does asks for the buttons again
function renderActs(){ DOCK.render(); }

// the market's showroom (G3.showroom): a chip with the boat's name and size, and the way back to her spec sheet
hooks.onShowroom = type => {
  const el = $('showChip'); if (!el) return;
  if (!type){ el.hidden = true; return; }
  const V = VESSELS[type], L = (no, en) => S.lang === 'no' ? no : en;
  $('scTx').textContent = V.name[S.lang] + ' · ' + fmt(V.len, 2) + ' × ' + fmt(V.beam, 1) + ' m'; $('scBack').textContent = L('‹ Tilbake', '‹ Back'); el.hidden = false;
};
$('scBack').addEventListener('click', () => { G3.showroom(null); DOCK.open('fartoy'); });
