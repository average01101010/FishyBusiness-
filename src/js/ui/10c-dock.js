// ---------- the dock: round buttons along the bottom that follow what the boat is doing, and the drawer at the side ----------
// In port Marked, Bygd and Verft open a fan of smaller buttons above them, and their pages open in the drawer at the side (a sheet
// from below when the screen stands), never in a big window in the middle. At sea: the one thing to do now as the hero first (jig, haul,
// the way to the plant with a full hold), the set gear as one button with a fan, a quay or an anchor, and «Om bord» (the inventory, with
// the crew as its fifth tab) last in every state, the row's one global button (UI 2, U2-2 and U2-3, 06.11.2026). Autonav lives in the
// chart plotter, which the little chart opens; a button that cannot be used now says why under its label (data-why), and one that never
// can on this boat is not there.
// The pages themselves are the phone's (PHONE.page); this file only decides which buttons there are and where things open.
const DOCK = (() => {
  let rowsDue = false;   // the button rows to measure when the row is next shown (rowsUp)
  const bar = $('dock'), fan = $('dockFan'), dr = $('drawer'), dBody = $('drawerBody'), dTitle = $('drawerTitle'), dTabs = $('drawerTabs');
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
    horn:SVG('<path d="M4 10v4h3l6 4V6l-6 4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/>'),
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
    hvil:SVG('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/><path d="M15 3.5h3l-3 3.5h3"/>'),
    mer:SVG('<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>'),
    naust:SVG('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/><path d="M2 21h20"/>'),
    butikk:SVG('<path d="M4 9l1.5-5h13L20 9"/><path d="M4 9v11h16V9"/><path d="M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0A2.7 2.7 0 0 0 20 9"/><path d="M10 20v-5h4v5"/>'),
    bunker:SVG('<path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16"/><path d="M3 21h14"/><path d="M7.5 8h5"/><path d="M15 9h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V8l-3-3"/>')};
  // the drawer's pages: title, and the pages that share a row of tabs
  const TITLE = {lever:['Lever fangst', 'Land the catch'], is:['Is', 'Ice'], agn:['Agn og egning', 'Bait and baiting'], bank:['Kystbanken', 'The bank'], oppdrag:['Oppdrag', 'Orders'],
    mannskap:['Mannskap', 'Crew'], bors:['Mannskap', 'Crew'], fartoy:['Båthandel', 'Boat market'], maler:['Malerverksted', 'Paint shop'], utstyr:['Oppgraderinger', 'Upgrades'], utstyrb:['Elektronikk og haler', 'Electronics and haulers'], fiske:['Fiskeutstyr', 'Tackle'], service:['Service', 'Service'],
    redskap:['Redskap', 'Gear'], rigg:['Rigg', 'Rig'], arbeid:['Mannskap', 'Crew'], drift:['Driftsplan', 'Operations plan'], verksted:['Vedlikehold', 'Maintenance'], havn:['Havn', 'Harbour'], last:['Lasterom', 'Hold'], beholdning:['Om bord', 'Aboard']};
  const TABS = {mannskap:[['mannskap', 'Om bord', 'Aboard'], ['bors', 'Mannskapsbørs', 'Crew exchange']], bors:null, fiske:[['fiske', 'Redskap', 'Gear'], ['utstyrb', 'Elektronikk og haler', 'Electronics and haulers']], utstyrb:null};
  TABS.bors = TABS.mannskap; TABS.utstyrb = TABS.fiske;
  const SHOP_PAGES = ['fiske', 'utstyrb', 'service', 'is', 'agn'];
  // the form pages (GUI review U1 A, 05.11.2026): in a standing screen they open tall (styles.css #drawer.tall), the sea above is not needed
  // while the plan or the crew are set; the trade pages keep the sea in view
  const TALL = new Set(['drift', 'arbeid', 'rigg', 'beholdning']);
  const TRYPAGES = ['utstyrb', 'utstyr'];   // the pages where gear can be tried on the boat in 3D (M3)   // the counters whose visits are measured (M2: shop_view)
  let menu = null, page = null, html = '', fanHtml = '', items = [], fanItems = [];

  // an item: id, icon, label [no, en], and what it does: run (a function), act (doAct), page (drawer) or menu (a fan)
  const I = (id, ic, no, en, o) => Object.assign({id, ic, lbl:[no, en]}, o || {});
  const port = () => S.boat.status === 'port' ? portById(S.boat.port) : null;
  // resting ashore (15-energy.js): in Father's naust in the home harbour, or in a rorbu; the button goes in, and aboard again
  function restItem(){
    const b = S.boat, w = restWhere(b); if (!w) return null;
    if (resting()) return w === 'koye' ? I('rest', 'hvil', 'Opp av køya', 'Up from the bunk', {act:'restend'}) : I('rest', 'hvil', 'Om bord', 'Aboard', {act:'restend'});
    // the bunk aboard (#70, 17.10.2026): at anchor, or at sea with a watch, on a boat with berths
    return w === 'koye' ? I('rest', 'hvil', 'Hvil i køya', 'Rest in the bunk', {act:'rest', pri:S.energy < 30}) : I('rest', 'hvil', 'Hvil', 'Rest', {act:'rest', pri:S.energy < (w === 'rorbu' ? 60 : 40)});
  }
  // the operations plan wants you: it has stopped, or waits until you give the boat back (the Crew page has its line, ui/05c-drift.js)
  const opsDot = () => { const o = S.ops; return !!(o && (o.v === DRV || o.v === DRV2) && ((!o.on && o.stop) || (o.on && o.held))); };
  // «Om bord» (UI 2, U2-2, docs/planer/ui-2-staaende.md 4.4, Jonas 06.11.2026, V3 revidert A): the inventory with the crew page as its
  // fifth tab, last in the row in every state, the row's one global button. Its dot says a quarrel aboard (S.cevt) or the operations plan
  // wants you, and then the tap lands on the crew tab
  const behDot = () => !!S.cevt || opsDot();
  const behItem = () => I('beh', 'beh', 'Om bord', 'Aboard', {page:behDot() ? 'beholdning:crew' : 'beholdning', dot:behDot()});
  // the rest is contextual, never global (U2-2, plan 4.3): in the row when resting, when the energy warns (the strip's yellow, ENERGY.warn)
  // and at anchor; at the naust's quay and at a rorbu always (their rows below). Else the bunk is a row in the box behind the strip
  // (04-panels-instruments.js renderHud), and in a harbour of trade «Hvil» is in the Bygd fan
  const restShow = () => { const b = S.boat; return resting() || S.energy < ENERGY.warn || (b.status !== 'port' && !!b.anch); };
  function portItems(){
    const b = S.boat, p = port(), tot = holdTotal(), busy = portBusy(b);
    // a rorbu has a bed and a quay, nothing more (07d-rorbu.js)
    if (p.rorbu) return [restItem(), I('gjestebok', 'oppdrag', 'Gjestebok', 'Guestbook', {page:'gbook'}), behItem()].filter(Boolean);
    // Father's naust is a home, not a place of trade (Jonas 07.10.2026): rest, the boathouse itself and Om bord (the crew is a tab there);
    // the shop, the plant and the yard are at their own quays
    if (berthKind(b) === 'naust') return [restItem(), I('naustup', 'naust', 'Naustet', 'Boathouse', {run:() => { NAUST3D.open(); }}), behItem()].filter(Boolean);
    // the three places of trade (Jonas 07.10.2026): the plant (core/06c-steder.js portServices) takes the catch and sells ice, bait and fuel,
    // the tackle shop sells gear and electronics, the yard sells and mends boats and sells fuel; each has its own button, and all three have the village
    const sv = portServices(p, berthKind(b));
    return [restShow() ? restItem() : null,
      sv.mottak ? I('marked', 'marked', 'Mottak', 'Plant', {menu:'marked', dot:p.mottak && tot > 0.5 && !b.land}) : null,
      // the first trip shows only the plant (Onboarding 2, O5, V7 A): the shop, the village, the yard and the inventory come after it
      sv.butikk && !tutOn() ? I('butikk', 'butikk', 'Butikk', 'Shop', {menu:'butikk', dot:pickAt(b.port).length > 0}) : null,
      tutOn() ? null : I('bygd', 'bygd', 'Bygd', 'Village', {menu:'bygd'}),
      sv.verft && !tutOn() ? I('verft', 'verft', 'Verft', 'Yard', {menu:'verft', dot:svcOverdue() > 0}) : null,
      tutOn() ? null : behItem()].filter(Boolean);   // «Planlegg» went 02.10.2026: the little chart opens the plotter
  }
  function menuItems(m){
    const b = S.boat, p = port(), H = S.t / 60;
    // fuel is sold at the plant and at the yard (Jonas 07.10.2026)
    const bunkerItem = () => { const need = BOAT.fuelCap - b.fuel;
      return I('bunker', 'bunker', 'Bunkring', 'Fuel', {act:'fuel', off:!p.fuel ? [L('Det er ikke drivstoff å få i ' + p.name + '.', 'There is no fuel to be had in ' + p.name + '.')] : need < 0.5 ? [L('Tanken er full.', 'The tank is full.')] : portBusy(b) ? [L('Vent til arbeidet på kaia er ferdig.', 'Wait until the work on the quay is done.')] : null,
        why:!p.fuel ? L('Ikke drivstoff her', 'No fuel here') : need < 0.5 ? L('Tanken er full', 'The tank is full') : portBusy(b) ? L('Vent på kaiarbeidet', 'Wait for the quay') : null}); };
    if (m === 'horn') return typeof HAIL !== 'undefined' && HAIL.menuItems ? HAIL.menuItems(I) : [];   // the signals of rule 34 (ui/10n-hail.js, Ø11.2)
    if (m === 'marked') return [
      I('lever', 'lever', 'Lever', 'Land', {page:'lever', off:!portServices(p, berthKind(b)).mottak && [L('Det er ikke noe fiskemottak i ' + p.name + '.', 'There is no fish plant in ' + p.name + '.')], why:L('Ikke noe mottak her', 'No plant here'), pri:portServices(p, berthKind(b)).mottak && holdTotal() > 0.5 && !b.land}),
      I('is', 'is', 'Is', 'Ice', {page:'is'}),
      I('agn', 'agn', 'Agn', 'Bait', {page:'agn'}),
      bunkerItem()];
    // the tackle shop: fishing gear, and the electronics and engines' small parts (the yard has the boat's own upgrades)
    if (m === 'butikk') return [
      I('fiskeutstyr', 'fiskeutstyr', 'Fiskeutstyr', 'Tackle', {page:'fiske'}),
      I('elektronikk', 'oppgr', 'Elektronikk og haler', 'Electronics and haulers', {page:'utstyrb'})];
    if (m === 'bygd') return [
      I('pub', 'pub', 'Pub', 'Pub', {act:'pub', off:tutOn() ? [L('Puben venter til etter første tur.', 'The pub waits until after the first trip.')] : !pubOpen(H) ? [L('Puben åpner klokka 15.', 'The pub opens at 15:00.')] : null, why:tutOn() ? L('Etter første tur', 'After the first trip') : L('Åpner kl. 15', 'Opens at 15:00')}),
      I('gjestebok', 'oppdrag', 'Gjestebok', 'Guestbook', {page:'gbook'}),
      I('bank', 'bank', 'Bank', 'Bank', {page:'bank'}),
      I('oppdrag', 'oppdrag', 'Oppdrag', 'Orders', {page:'oppdrag'}),
      I('mannskap', 'mannskap', 'Ansatte', 'Employees', {page:'mannskap'}), restShow() ? null : restItem(),
      // (Father's naust is set to rights from the dock when the boat lies at it, and only there: ui/06c-notebook.js)
      ].filter(Boolean);
    if (m === 'verft') return [
      I('batmarked', 'batmarked', 'Båthandel', 'Boats', {page:'fartoy'}),
      I('oppgr', 'oppgr', 'Oppgrader', 'Upgrade', {page:'utstyr'}),
      I('vedlikehold', 'vedlikehold', 'Vedlikehold', 'Maintenance', {page:'verksted', dot:svcOverdue() > 0}),
      I('maler', 'maler', 'Malerverksted', 'Paint shop', {page:'maler'}),
      bunkerItem()];
    // what is aboard by line kind and bait (Jonas 20.10.2026); tubs that are not baited stand greyed with their state, and open their line
    // card in the inventory, where they are baited
    if (m === 'settut') return setChoices(true).map((c, i) => I('set' + i, 'settut', c.lbl[0], c.lbl[1], c.off ? {run:() => openGear(c.kind === 'line' && c.lk !== 'auto' ? 'lc-' + c.lk : 'baitCard'), wide:true, ghost:true, bc:'none'} : {act:'gset', data:{c:i, all:'1'}, wide:true, bc:c.bait ? BAITCOL[c.bait] : null}));
    if (m === 'fortoy') return moorAll(b.pos, 0.4).map((q, i) => I('fortoy' + i, 'naust', q.name.charAt(0).toUpperCase() + q.name.slice(1), q.name.charAt(0).toUpperCase() + q.name.slice(1), {run:() => moorGo(q), wide:true}));
    if (m === 'taopp'){ const s = nearSet(b.pos, 0.3); if (!s) return [];
      return [I('haul', 'taopp', 'Trekk', 'Haul', {act:'ghaul', data:{id:s.id}, pri:true}), I('haulset', 'settut', 'Trekk og sett igjen', 'Haul and set again', {act:'ghaul', data:{id:s.id, r:'1'}, wide:true})]; }
    // the Redskap fan (U2-3): «Sett ut» opens the choices (the settut fan over the same button), «Ta opp» hauls the set within 300 m
    // (greyed with the distance or «nothing in the sea»), and «Trekk og sett igjen» for nets and pots by their buoy
    if (m === 'redskap'){ const s = nearSet(b.pos, 0.3), nb = nearestBuoy(), ch = setChoices(true), so = setOff(ch), ho = haulOff(s, nb);
      return [I('settut', 'settut', 'Sett ut', 'Set', so ? {off:so.off, why:so.why} : {menu:'settut'}),
        I('taopp', 'taopp', 'Ta opp', 'Haul', ho ? {off:ho.off, why:ho.why} : {act:'ghaul', data:{id:s.id}, pri:true}),
        s && s.kind !== 'line' ? I('haulset', 'settut', 'Trekk og sett igjen', 'Haul and set again', {act:'ghaul', data:{id:s.id, r:'1'}, wide:true}) : null].filter(Boolean); }
    // «Ligg» (U2-3, plan 4.3): the quay and the anchor as one button when another player near (Prai, Ta slep) made the row too long
    if (m === 'ligg'){ const {moor, anc} = lieItems(); return [moor, anc].filter(Boolean); }
    return [];
  }
  // the fan opened from inside another fan stands over the row's button that owns it (the settut choices over Redskap)
  const PARENT = {settut:'redskap'}, ownerOf = m => PARENT[m] || m;
  // the inventory's gear page, scrolled to a card (a line kind's, or the bait's)
  function openGear(id){ open('beholdning:gear'); const el = document.getElementById(id); if (el){ el.scrollIntoView({block:'start'}); el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1600); } }
  // why «Sett ut» has nothing to show: rigged for the jig, no gear of the rig aboard, or it is with the crew (baiting, stripping, mending)
  // or ashore. {off: the toast, why: the short reason under the label (U2-3, V4 A)}, or null when something can be set
  function setOff(ch){
    if (rigJig()) return {off:[L('Båten er rigget for juksa. Rigg om til line, garn eller teiner under Om bord.', 'The boat is rigged for jigging. Re-rig for line, nets or pots under Aboard.')], why:L('Rigget for juksa', 'Rigged for the jig')};
    if (ch.length) return null;
    const pg = S.pgear, R = RIGS[rigOf()], k = R.kind, sh = (pg && pg.shore) || [];
    if (k === 'line' && sh.some(j => j.kind === 'egnself' || j.kind === 'stripself' || j.kind === 'egn')) return {off:[L('Stampene er hos mannskapet eller i egnebua.', 'The tubs are with the crew or at the baiting shed.')], why:L('Hos mannskapet', 'With the crew')};
    if (k === 'garn' && sh.some(j => j.kind === 'mendself' || j.kind === 'bot')) return {off:[L('Garna bøtes.', 'The nets are being mended.')], why:L('Garna bøtes', 'Being mended')};
    return {off:[L('Ingen ' + R.no.toLowerCase() + ' om bord.', 'No ' + R.en.toLowerCase() + ' aboard.')], why:L('Ingen ' + R.no.toLowerCase() + ' om bord', 'No ' + R.en.toLowerCase() + ' aboard')};
  }
  // why «Ta opp» cannot be used: no set within 300 m; the nearest buoy's distance (the way there is «Kjør dit» under Om bord, or a tap on
  // the buoy in the chart plotter, where Autonav is), or nothing in the sea
  function haulOff(s, nb){
    if (s) return null;
    return nb ? {off:[L('Nærmeste blåse er ' + fmt(nb.d / NM, 1) + ' nm unna. «Kjør dit» under Om bord › Redskap, eller trykk på blåsa i kartplotteren.', 'The nearest buoy is ' + fmt(nb.d / NM, 1) + ' nm away. «Go there» under Aboard › Gear, or tap the buoy in the chart plotter.')], why:L(fmt(nb.d / NM, 1) + ' nm til blåsa', fmt(nb.d / NM, 1) + ' nm to the buoy')}
      : {off:[L('Du har ikke redskap i sjøen.', 'You have no gear in the sea.')], why:L('Ingenting i sjøen', 'Nothing in the sea')};
  }
  // the nearest of your own buoys, for the haul button's hint
  function nearestBuoy(){ let best = null; for (const s of mySets()) for (const e of [s.a, s.b]){ const d = dist(S.boat.pos, e); if (!best || d < best.d) best = {s, d}; } return best; }
  // the boat has set gear: aboard, with the crew or at the shed (the shore jobs), or the autoliner's line on the magazines
  function gearOwned(){
    const pg = S.pgear; if (!pg) return false; const A = typeof autoL === 'function' ? autoL(pg) : null;
    return pg.nets.length > 0 || pg.lines.hyse.n > 0 || pg.lines.bank.n > 0 || (pg.pots.big || 0) > 0 || (pg.shore || []).length > 0 || !!(A && A.n);
  }
  // «Redskap» (UI 2, U2-3, plan 4.3, Jonas' V7 A): «Sett ut», «Ta opp» and «Trekk og sett igjen» as one button with a fan, only when the
  // boat has set gear (aboard, with the crew or in the sea). Never on a boat that cannot be rigged for line, nets or pots, and never on
  // one rigged for the jig with no hauler and nothing in the sea: nothing can be set from her (buyGate), so the button is not there
  // (plan principle 6). Greyed, with the reason under the label (K3), when nothing in the fan can be used now: the haul's reason when
  // gear is in the sea, else the set's
  function gearItem(s, nb, ch){
    const eq = S.equip || {}, hauler = !!(eq.linehaler || eq.garnhaler || eq.teinehaler), inSea = mySets().length > 0;
    const rigs = (VESSELS[S.boat.type] || {}).rigs || [];
    if (!rigs.some(r => r !== 'juksa' && RIGS[r]) || (!gearOwned() && !inSea) || (rigJig() && !hauler && !inSea)) return null;
    const so = setOff(ch), ho = haulOff(s, nb), off = so && ho ? (inSea ? ho : so) : null;
    return I('redskap', 'settut', 'Redskap', 'Gear', off ? {off:off.off, why:off.why} : {menu:'redskap'});
  }
  // the places to lie: a quay within 400 m («Fortøy» takes her in, moorGo, to a rorbu's, the naust's or a harbour's; with more than one
  // in reach a fan with each, nearest first, tilbakemelding #23), and the anchor (the boat keeps her place and the crew rests; it can
  // drag in weather the boat does not hold, 06e-anchor.js). Both when both can be used; with no quay the anchor stands greyed with why
  const ANCHWHY = {land:['Land her', 'Land here'], shallow:['For grunt', 'Too shallow'], deep:['For dypt', 'Too deep'], near:['For nær land', 'Too near land'], nomap:['Kartet laster', 'Chart loading']};
  function lieItems(){
    const b = S.boat, ml = moorAll(b.pos, 0.4), mo = ml[0];
    const moor = mo ? I('fortoy', 'naust', 'Fortøy', 'Moor', Object.assign(ml.length > 1 ? {menu:'fortoy'} : {run:() => moorGo(mo)}, {pri:mo.kind === 'rorbu' || mo.kind === 'naust' || S.energy < 40})) : null;
    const sp = !b.anch && anchorSpot(b.pos), up = b.anch && b.anch.up != null ? anchorUpIn() : 0;
    const anc = b.anch && b.anch.up != null ? I('anker', 'anker', 'Hiver anker', 'Weighing', {off:[L('Ankeret er oppe om ' + up + ' min.', 'The anchor is up in ' + up + ' min.')], why:L('Oppe om ' + up + ' min', 'Up in ' + up + ' min'), on:true})
      : b.anch ? I('anker', 'anker', 'Hiv anker', 'Weigh anchor', {run:() => { weighAnchor(); refreshAll(); }, on:true})
      : !moor || (sp && sp.ok) ? I('anker', 'anker', 'Kast anker', 'Drop anchor', sp && sp.ok ? {run:() => { dropAnchor(); refreshAll(); }} : {off:[sp && anchorWhy[sp.why] ? L(anchorWhy[sp.why][0], anchorWhy[sp.why][1]) : L('Ikke her.', 'Not here.')], why:sp && ANCHWHY[sp.why] ? L(ANCHWHY[sp.why][0], ANCHWHY[sp.why][1]) : L('Ikke her', 'Not here')}) : null;
    return {moor, anc};
  }
  // the nearest plant that takes her catch (06b-coastports.js plantsNear; portWhy keeps an ocean vessel to the quays that fit her)
  function plantNear(){ const b = S.boat; try { return plantsNear(b.pos, 10).find(n => !portWhy(n.pt, b.type)) || null; } catch (e){ return null; } }
  // the row at sea (UI 2, U2-3, plan 4.3): the hero, up to three contextual buttons and Om bord last, Telephone beside it; never more
  // than five when the screen stands. Auto-nav is out of the row (the little chart opens the plotter, where Autonav is #rAuto; «Til
  // blåsa» and «Kjør dit» run it directly as before); with a full hold the hero is the way to the nearest plant («Til mottaket ·
  // Botnhamn 3,2 nm», as the crow flies on the button, the route made when it is tapped), and «Jukse» says the hold is full
  function seaItems(){
    // (a quarrel aboard and the plan's stop are the dot on Om bord, U2-2; the crew page is its tab)
    const b = S.boat, beh = behItem(), rest = restShow() ? restItem() : null;   // no «Hjem» (the user's wish 02.10.2026: Autonav to the harbour, or «Returner samme vei» in the plotter)
    const full = (typeof holdFmt === 'function' ? holdFmt().load : holdTotal()) >= capHold() - 0.5;
    const tut = typeof HAIL !== 'undefined' ? HAIL.dockItem(I) : null;
    const ptow = typeof PTOW !== 'undefined' ? PTOW.dockItem(I) : null;   // «Ta slep» by a player's broken-down boat (ui/10o-ptow.js)   // another player's boat within 1 nm (ui/10n-hail.js)
    if (b.status === 'idle'){
      const s = nearSet(b.pos, 0.3), nb = nearestBuoy(), ch = setChoices(true), nearB = !!(nb && nb.d <= GEARLIE.r * 1.2);
      // by her gear: the haul (line at once; nets and pots in a fan with «Trekk» and «Trekk og sett igjen»), or lying within half a mile
      // (V2 B) one tap makes the way up to the buoy (U2, U3). Farther off «Ta opp» stands in the Redskap fan with the distance
      const haul = s ? (s.kind === 'line' ? I('taopp', 'taopp', 'Ta opp', 'Haul', {act:'ghaul', data:{id:s.id}, pri:true}) : I('taopp', 'taopp', 'Ta opp', 'Haul', {menu:'taopp', pri:true}))
        : nearB ? I('taopp', 'taopp', 'Til blåsa', 'To the buoy', {run:() => buoyGo(nb.s), pri:true}) : null;
      // a full hold (spilltest 3, U5): the way to the plant as the hero, after the haul when she lies by her gear
      const pl = full ? plantNear() : null, nm = pl ? fmt(pl.d / NM, pl.d / NM < 10 ? 1 : 0) + ' nm' : '';
      const plant = pl ? I('tilmottak', 'nav', 'Til mottaket · ' + pl.pt.name + ' ' + nm, 'To the plant · ' + pl.pt.name + ' ' + nm, {run:() => plantGo(pl.pt), pri:true, sub:true}) : null;
      // «Jukse» only on a boat rigged for jigging (the user's wish 02.10.2026); an ocean vessel never has it, so it is not there
      const jig = !vesselJigs() ? null : full ? I('jukse', 'jukse', 'Jukse', 'Jig', {off:[L('Lasten er full.', 'The hold is full.')], why:L('Lasten er full', 'The hold is full')}) : I('jukse', 'jukse', 'Jukse', 'Jig', {menu:'jukse', pri:!s && !nearB});
      const {moor, anc} = lieItems();
      return [jig, ptow, haul, plant, gearItem(s, nb, ch), moor, anc, tut, rest, beh].filter(Boolean);   // (the bunk, #70; the hero goes first in render)
    }
    if (b.status === 'fishing' && b.gop) return [I('gstop', 'stopp', 'Stopp arbeidet', 'Stop the work', {act:'gstop'}), beh];
    if (gopAfter(b)) return [beh];   // the minute after the gear work (F4)
    if (b.status === 'fishing') return [I('stopfish', 'stopp', 'Stopp', 'Stop', {act:'stopfish'}),
      b.deckStop && !b.deckEnd ? I('deckgo', 'videre', 'Fisk videre', 'Fish on', {act:'deckgo', pri:true}) : !b.deckStop && deckPending() > 0.5 ? I('deckstop', 'sloy', 'Stopp og sløy', 'Stop and gut', {act:'deckstop'}) : null,
      G3.isActive() && window.JIGG && (window.jigActive || window.JIGG.ok()) ? I('jigg', 'juks', window.jigActive ? 'Slutt å jukse' : 'Jukse selv', window.jigActive ? 'Stop jigging' : 'Jig yourself', {act:'jigg', pri:!window.jigActive, on:!!window.jigActive}) : null, rest, beh].filter(Boolean);
    if (b.status === 'sailing') return [I('stop', 'stopp', 'Stopp båten', 'Stop', {act:'stop'}), tut, rest, beh].filter(Boolean);
    if (b.status === 'tow') return [beh];   // the tow takes its time (no fast forward: one clock for everyone)
    if (b.status === 'adrift' || b.status === 'engine' || b.status === 'aground') return [I('hjelp', 'hjelp', 'Hjelp', 'Help', {run:() => PHONE.open('redning'), warn:true}), beh];
    return [beh];
  }
  // what the pill over the buttons said until UI 2 (U2-1, docs/planer/ui-2-staaende.md 4.2, 06.11.2026): now the status strip's third
  // line says it (04-panels-instruments.js hudLine3), so this gives only what the next event does not already say: the work going on
  // (on), the place in harbour when nothing is on (place), the reels short of hands (reels) and the deck's kg (deck: the long text and
  // the short). The departure, the yard, the landing note and the jig's end are next events (nextEvent) and are not repeated here
  function infoText(){
    const b = S.boat, o = {on:'', place:'', reels:'', deck:null}, port = b.status === 'port';
    if (resting()){
      if (port){ const r = restRate(b), m = r > 0 ? Math.ceil((100 - S.energy) / r) : 0, up = S.rest.w === 'naust' ? Math.round((naustRest(b) - 1) * 100) : 0;
        o.on = (S.rest.w === 'rorbu' ? L('Hviler på rorbua', 'Resting at the rorbu') : L('Hviler i naustet', 'Resting in the boathouse')) + ' · ' + Math.round(S.energy) + ' %' + (up > 0 ? L(' · ' + up + ' % raskere', ' · ' + up + ' % faster') : '') + (m > 0 ? L(' · uthvilt ', ' · rested ') + hm((S.t + m) / 60) : ''); }
      else o.on = L('Hviler i køya', 'Resting in the bunk') + ' · ' + Math.round(S.energy) + ' %'; }
    else if (b.status === 'unmooring') o.on = L('Kaster loss …', 'Casting off …');
    else if (b.gop){ const g = gopText(); if (g) o.on = L(g[0], g[1]); }
    else if (port && b.land) o.on = landText(true)[0];   // the crane, the tubs ashore, the weighing (07-guide.js)
    else if (port && (b.shift || b.fueling)) o.on = quayText(true)[0];   // to the bunker quay, the pump running
    // in harbour: the rorbu's price, or where she lies («Ved naustet», «Ved kaia · Finnsnes»; 07-harbours.js berthKind)
    if (port && !resting()){ const pt = portById(b.port), k = berthKind(b);
      o.place = restWhere(b) === 'rorbu' ? L('Rorbu · ' + kr(RORBU.kr) + ' natta', 'Rorbu · ' + kr(RORBU.kr) + ' a night') : k === 'naust' ? L('Ved naustet', 'At the boathouse') : L('Ved ' + (k === 'bunker' ? 'bunkerskaia' : 'kaia'), 'At the ' + (k === 'bunker' ? 'bunker quay' : 'quay')) + (pt ? ' · ' + pt.name : ''); }
    // too few hands for the reels (tilbakemelding #64): the hands at the rail tend three each, as in fishEffort (core/03-simulation.js)
    if (b.status === 'fishing' && b.fishUntil != null && !b.deckEnd && !gopAfter(b)){ const own = S.equip ? S.equip.jukse || 0 : 0, jk = own > 0 && !(S.target === 'kveite' && b.kgear && !kveiteClosed(S.t / 60)) ? Math.min(own, workTeam('fiske', 'juksa', 'fishing').n * JIG.perPerson) : 0;
      if (jk > 0 && jk < own) o.reels = L(jk + ' av ' + own + ' maskiner', jk + ' of ' + own + ' reels'); }
    const dk = !port && deckText(true); if (dk) o.deck = dk;
    return o;
  }
  function items0(){
    const b = S.boat;
    if (S.plan && S.plan.depAt) return [I('depnow', 'loss', 'Kast loss', 'Cast off', {act:'depnow', pri:true}), I('depcancel', 'avbryt', 'Avbryt', 'Cancel', {act:'depcancel'}), behItem()];
    if (b.status === 'port') return portItems();
    return seaItems();
  }
  const esc = v => String(v).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'})[c]);
  // a button: the icon, the label (with a second line after « · » when sub: «Til mottaket» over «Botnhamn 3,2 nm») and, greyed, the
  // reason under the label from data-why (styles.css .dk-b.off[data-why]::after; a tap still gives the whole text as a toast)
  const btn = (x, small) => { const lbl = L(x.lbl[0], x.lbl[1]), i = x.sub ? lbl.indexOf(' · ') : -1;
    return '<button type="button" class="dk-b' + (small ? ' sm' : '') + (x.pri ? ' pri' : '') + (x.hero && !small ? ' hero' : '') + (x.warn ? ' warn' : '') + (x.on ? ' on' : '') + (x.off ? ' off' : '') + (x.ghost ? ' ghost' : '') + (x.wide ? ' wide' : '') + (x.menu && (menu === x.menu || ownerOf(menu) === x.menu) ? ' open' : '') + '" data-dk="' + x.id + '"' + (x.act ? ' data-act="' + x.act + '"' : '') + (x.off ? ' aria-disabled="true"' : '') + (x.off && x.why ? ' data-why="' + esc(x.why) + '"' : '') + '><span class="dk-i">' + IC[x.ic] + (x.dot ? '<i class="dk-dot"></i>' : '') + (x.bc ? '<i class="dk-bait' + (x.bc === 'none' ? ' e' : '') + '"' + (x.bc === 'none' ? '' : ' style="--bc:' + x.bc + '"') + '></i>' : '') + '</span><span class="dk-l">' + esc(i > 0 ? lbl.slice(0, i) : lbl) + '</span>' + (i > 0 ? '<span class="dk-sub">' + esc(lbl.slice(i + 3)) + '</span>' : '') + '</button>'; };
  // the jig's fan is a small card: hours, the tackle aboard as the choices it really has (Jonas 20.10.2026: what each takes, as species chips,
  // from the model, jigSets in ui/10-gear-ui.js; the halibut pilk only with the halibut gear aboard, and closed in its season), and start
  function jigCard(){
    const js = jigSets(), pick = js.length > 1;
    const tk = js.map(j => { const nm = L(CARE.jig[j.k].no, CARE.jig[j.k].en), body = '<b>' + nm + '</b>' + (j.k === 'kveite' && j.closed ? '<span class="dk-x">' + L('Kveita er fredet til 21. april', 'Halibut closed until 21 April') + '</span>' : spChips(j.sp));
      return pick ? '<button type="button" class="dk-tk' + (j.on ? ' on' : '') + '" data-dk="tk-' + j.k + '"' + (j.k === 'kveite' && j.closed ? ' disabled' : '') + ' aria-pressed="' + !!j.on + '">' + body + '</button>' : '<div class="dk-tk on">' + body + '</div>'; }).join('');
    return '<div class="dk-card"><div class="dk-step"><button type="button" data-dk="fh-" aria-label="−">−</button><b>' + S.fishPlanH + L(' t', ' h') + '<small>' + L('til ', 'until ') + whenTxt(S.t + S.fishPlanH * 60) + '</small></b><button type="button" data-dk="fh+" aria-label="+">+</button></div>' +   // the game hours, and when on the clock and in real time (U1)
      (tk ? '<div class="dk-tks">' + tk + '</div>' : '') + '<button type="button" class="dk-go" data-dk="startfish">' + L('Start jukse', 'Start jigging') + '</button></div>';
  }
  // «Kystlys» U3 (docs/planer/ui-redesign.md, V6 A, 04.11.2026): the first thing marked as what to do now (pri) is the hero, a bigger
  // button the eye goes to, and it stands first (UI 2, U2-3, plan 4.3). The row is never more than six, and never more than five when the
  // screen stands (U2-2, plan 4.4: a phone upright is the measure, a tablet inherits), so it never wraps. With Auto-nav out of the row and
  // the gear as one button (U2-3) that holds in every state measured (tests/kartlegging.py); the limit stays as a guard: first Fortøy and
  // Anker become «Ligg», then «⋯ Mer» takes the greyed ones first and then the tail, with Om bord last
  const portrait = matchMedia('(orientation: portrait)'), MAXV = () => portrait.matches ? 5 : 6; let more = [];
  function rowOf(all){
    more = []; const max = MAXV();
    if (all.length > max && all.some(x => x.id === 'fortoy') && all.some(x => x.id === 'anker')){ const i = all.findIndex(x => x.id === 'fortoy');
      all = all.filter(x => x.id !== 'fortoy' && x.id !== 'anker'); all.splice(i, 0, I('ligg', 'anker', 'Ligg', 'Lie', {menu:'ligg'})); }
    if (all.length <= max) return all;
    const beh = all.find(x => x.id === 'beh'), rest = all.filter(x => x !== beh), room = max - 2 - (beh ? 0 : -1);
    const on = rest.filter(x => !x.off), off = rest.filter(x => x.off);
    const pick = new Set(on.slice(0, room).concat(off.slice(0, Math.max(0, room - on.length))));
    const keep = rest.filter(x => pick.has(x)); more = rest.filter(x => !pick.has(x));
    return keep.concat([I('mer', 'mer', 'Mer', 'More', {menu:'mer', dot:more.some(x => x.dot)})], beh ? [beh] : []);
  }
  // a fan of more than four small buttons in rows of at most four, the fuller rows nearest the buttons: five as two and three (K2, plan
  // 4.3), six as three and three. The wide choices (the gear to set) wrap as they come
  function fanRows(xs){
    const h = xs.map(x => btn(x, true)); if (xs.length <= 4 || xs.some(x => x.wide)) return h.join('');
    const n = xs.length, k = Math.ceil(n / 4), base = Math.floor(n / k), extra = n - base * k, rows = []; let i = 0;
    for (let r = 0; r < k; r++){ const m = base + (r >= k - extra ? 1 : 0); rows.push('<div class="dk-row">' + h.slice(i, i + m).join('') + '</div>'); i += m; }
    return rows.join('');
  }
  function render(){
    if (!bar) return;
    items = rowOf(items0());
    { const hero = items.find(x => x.pri && !x.off); items.forEach(x => { x.hero = x === hero; }); if (hero && items[0] !== hero) items = [hero].concat(items.filter(x => x !== hero)); }
    if (menu && !items.some(x => x.menu === ownerOf(menu)) && !more.some(x => x.menu === ownerOf(menu))) menu = null;
    const h = items.map(x => btn(x)).join('');
    if (h !== html){ html = h; bar.innerHTML = h; rowsUp(); } else if (rowsDue) rowsUp();
    fanItems = menu === 'mer' ? more : menu && menu !== 'jukse' ? menuItems(menu).filter(Boolean) : [];
    const fh = !menu ? '' : menu === 'jukse' ? jigCard() : fanRows(fanItems);
    if (fh !== fanHtml){ fanHtml = fh; fan.innerHTML = fh; }
    fan.hidden = !menu; if (menu) placeFan();
    if (page) drawTabs();
  }
  // the rows above the first one when the buttons wrap (a narrow phone upright): what stands over the row is lifted that much
  // (measured when the row is shown: a change made while the chart plotter hides it is measured on the next render it is seen)
  // (the lift is the rows over the last one, from where the rows begin: the hero is taller than the others, U3)
  // (and --dkh: how high the dock's top button stands over the bottom of #mapwrap, which holds both; the drawer in portrait stands at
  // least that high, so the dock never covers its foot: the 84 px it assumed were 1–20 px short on a phone at sea, where the buttons
  // stand higher, the active one has a ring and a label can take two lines, GUI review F4 05.11.2026)
  // (a row's top is where its buttons' margins begin: beside the hero the others start 8 px lower, styles.css #dock, Ø7)
  function rowsUp(){ if (!bar.offsetParent){ rowsDue = true; document.body.style.setProperty('--dkh', '0px'); return; } rowsDue = false; const ks = [...bar.children], tops = ks.map(k => k.offsetTop - (parseFloat(getComputedStyle(k).marginTop) || 0)), x = ks.length ? Math.max(0, Math.max(...tops) - Math.min(...tops)) : 0; document.body.style.setProperty('--dkx', x + 'px');
    const top = ks.length ? Math.min(...ks.map(k => k.getBoundingClientRect().top)) : null; document.body.style.setProperty('--dkh', top == null ? '0px' : Math.max(0, Math.round(bar.offsetParent.getBoundingClientRect().bottom - top + 6)) + 'px'); }
  window.addEventListener('resize', () => { if (bar) rowsUp(); });
  (portrait.addEventListener ? portrait.addEventListener('change', () => { html = ''; render(); }) : portrait.addListener(() => { html = ''; render(); }));   // five or six on the row
  // the fan stands centred over its button, inside the screen
  function placeFan(){
    const pb = bar.querySelector('[data-dk="' + (items.find(x => x.menu === ownerOf(menu)) || {}).id + '"]') || bar.querySelector('[data-dk="mer"]'); if (!pb) return;
    const r = pb.getBoundingClientRect(), wr = fan.parentNode.getBoundingClientRect(), w = fan.offsetWidth;
    fan.style.left = clamp(r.left + r.width / 2 - w / 2 - wr.left, 8, wr.width - w - 8) + 'px';
  }
  function setMenu(m){ menu = menu === m ? null : m; html = ''; if (menu) toastClear(); render(); }
  // «Kjør dit» in the inventory: the way to a point just off the nearer buoy, and away
  function goTo(s){
    const b = S.boat; menu = null;
    if (b.status === 'sailing'){ S.plan = null; b.status = 'idle'; b.v = 0; }
    if (!['idle', 'port'].includes(b.status) || (S.plan && S.plan.depAt)){ toast(L('Båten er opptatt. Stopp det den holder på med først.', 'The boat is busy. Stop what it is doing first.')); return; }
    if (S.draft.length) draftEdit(() => { S.draft = []; });
    close(); openPlotter();
    leiaTo(buoyStandoff(s, dist(b.pos, s.a) <= dist(b.pos, s.b) ? s.a : s.b), true);
  }
  // «Til blåsa» (spilltest 3, U2): lying within half a mile of her own gear, the way up to just off the nearer buoy as Autonav finds it,
  // and off she goes without the chart, as «Fortøy» does; there «Ta opp» stands in the dock bar
  async function buoyGo(s){
    const b = S.boat; menu = null;
    if (b.status !== 'idle' || (S.plan && S.plan.depAt)){ toast(L('Båten er opptatt. Stopp det den holder på med først.', 'The boat is busy. Stop what it is doing first.')); return; }
    if (!meAboard() && !crewAboard().length){ toast(L(...noCrewText())); return; }
    const to = buoyStandoff(s, dist(b.pos, s.a) <= dist(b.pos, s.b) ? s.a : s.b);
    // within half a mile on open water the way is straight, when it crosses no land and no shoal; else as Autonav finds it
    let res = null; try { if (!isLand(to) && !groundCheck(b.pos, to)) res = {wps:[to]}; } catch (e){}
    if (!res) try { res = await leiaRoute({x:b.pos.x, y:b.pos.y}, to, null, null); } catch (e){ console.error(e); res = {why:['Fant ingen vei til blåsa.', 'Found no way to the buoy.']}; }
    if (res.why){ toast(L(res.why[0], res.why[1])); return; }
    if (b.status !== 'idle') return;
    if (S.draft.length) draftEdit(() => { S.draft = []; });
    S.plan = {wps:res.wps.map((q, i) => ({x:q.x, y:q.y, port:null, fish:0, leia:i < res.wps.length - 1})), idx:0, speed:Math.min(S.draftSpeed || BOAT.cruise || 6, BOAT.cruise || 6), returning:false}; b.status = 'sailing';
    toast(L('Kjører opp til blåsa.', 'Running up to the buoy.')); save(); refreshAll();
  }
  // «Fortøy»: the way in to the quay found as Autonav finds it, and off she goes, without the chart
  async function moorGo(mo){
    const b = S.boat; menu = null;
    if (b.status !== 'idle' || (S.plan && S.plan.depAt)){ toast(L('Båten er opptatt. Stopp det den holder på med først.', 'The boat is busy. Stop what it is doing first.')); return; }
    if (!meAboard() && !crewAboard().length){ toast(L(...noCrewText())); return; }
    let res; try { res = await leiaRoute({x:b.pos.x, y:b.pos.y}, {x:mo.x, y:mo.y}, null, mo.id); } catch (e){ console.error(e); res = {why:['Fant ingen vei inn.', 'Found no way in.']}; }
    if (res.why){ toast(L(res.why[0], res.why[1])); return; }
    if (b.status !== 'idle') return;   // something else started while the way was found
    if (S.draft.length) draftEdit(() => { S.draft = []; });
    const wps = res.wps.map((q, i) => i === res.wps.length - 1 ? {x:mo.x, y:mo.y, port:mo.id, berth:mo.berth, fish:0} : {x:q.x, y:q.y, port:null, fish:0, leia:true});
    S.plan = {wps, idx:0, speed:S.draftSpeed || BOAT.cruise || 6, returning:false}; b.status = 'sailing';
    toast(L('Legger til ved ' + mo.name + '.', 'Coming in to ' + mo.name + '.')); save(); refreshAll();
  }
  // «Til mottaket» (U2-3, plan 4.3): the hero with a full hold. The way to the nearest plant that takes her, as Autonav finds it, drawn in
  // the chart plotter with «Kast loss» to set off, as the inventory's «Kjør dit» (goTo) and the phone's «Autonav dit» (14-act.js goplace)
  // do; the distance on the button is as the crow flies, the route is made here. (The «Auto-nav» button, which opened the plotter with
  // Autonav armed for a tap, went out of the row with U2-3: the little chart opens the plotter, where Autonav is a button, #rAuto)
  function plantGo(pt){
    const b = S.boat; menu = null;
    if (!['idle', 'port'].includes(b.status) || (S.plan && S.plan.depAt)){ toast(L('Båten er opptatt. Stopp det den holder på med først.', 'The boat is busy. Stop what it is doing first.')); return; }
    if (S.draft.length) draftEdit(() => { S.draft = []; });
    close(); openPlotter(); view.cx = pt.p.x; view.cy = pt.p.y;
    leiaTo({x:pt.p.x, y:pt.p.y});
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
    if (k === 'tk-mark' || k === 'tk-kveite'){ const why = jigChoose(k.slice(3)); if (why) toast(why[0]); save(); fanHtml = ''; html = ''; render(); return; }
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
    if (typeof G3 !== 'undefined' && G3.trying && !(TRYPAGES.includes(page) && !dr.hidden)) G3.tryView(null);   // gear tried on goes off with its page (M3)
    if (!page) return;
    dr.classList.toggle('tall', TALL.has(page));
    const y = keep ? dBody.scrollTop : 0, t0 = TITLE[page] || [page, page];
    dTitle.textContent = L(t0[0], t0[1]); drawTabs();
    const h = dress(page, PHONE.page(page)); if (h !== shown){ shown = h; dBody.innerHTML = h; fold(); ordbok(dBody); tabInView(); } dBody.scrollTop = y;
  }
  // the page's own row of tabs (.ph-sub) scrolls sideways when it is wider than the drawer: the chosen tab is kept in view (Om bord's five
  // tabs on a phone, U2-2)
  function tabInView(){ const on = dBody.querySelector('.ph-sub button.on'); if (!on) return; const r = on.parentNode; if (r.scrollWidth <= r.clientWidth + 1) return; const x = on.offsetLeft - (r.clientWidth - on.offsetWidth) / 2; r.scrollLeft = Math.max(0, x); }
  // «Kystlys» U6 (docs/planer/ui-redesign.md, V3 A, 04.11.2026): the trade pages belong to a place (the plant, the shop, the yard), and
  // each says first where that place is: «Du er her», or the nearest with its distance and Autonav there, one header in place of the
  // «Nærmeste …» card that stood at the top, the middle or the foot of the page. Away from the place, a button that cannot be pressed
  // says why in itself (data-why, styles.css U2) instead of a grey button and a note somewhere else on the page.
  const PLACE = {lever:'mottak', is:'mottak', agn:'mottak', fiske:'butikk', utstyrb:'butikk', service:'butikk', fartoy:'verft', utstyr:'verft', verksted:'verft', maler:'verft'};
  const PLACEN = {mottak:['fiskemottaket', 'the fish plant', 'Mottak', 'Plant'], butikk:['utstyrsbutikken', 'the tackle shop', 'Butikk', 'Shop'], verft:['verftet', 'the yard', 'Verft', 'Yard']};
  const NEARCARD = /<div class="ph-card"><p class="ph-note">(?:Nærmeste|Nearest) [^<]*<b>[^<]*<\/b>[^<]*<\/p><button class="ph-btn" data-pa="goplace" data-id="[^"]*">[^<]*<\/button><\/div>/g;
  function dress(pg, h){
    const k = PLACE[pg]; if (!k || typeof portServices !== 'function') return h;
    const b = S.boat, here = b.status === 'port' && !!portServices(portById(b.port), berthKind(b))[k], N = PLACEN[k];
    if (here) return '<div class="pl-head here"><span>' + L('Du er her', 'You are here') + '</span><b>' + portById(b.port).name + '</b></div>' + h.replace(NEARCARD, '');
    const n = placesNear(b.pos, k, 1)[0];
    const head = '<div class="pl-head"><span>' + L('Nærmeste ' + N[0], 'Nearest ' + N[1]) + '</span><b>' + (n ? n.pt.name + ' · ' + fmt(n.d / NM, 1) + ' nm' : '–') + '</b>' + (n ? '<button class="ph-btn p" data-pa="goplace" data-id="' + n.pt.id + '">' + L('Autonav dit', 'Autonav there') + '</button>' : '') + '</div>';
    const why = n ? L('Kjøpes ved ' + N[0] + ' i ' + n.pt.name, 'Bought at ' + N[1] + ' in ' + n.pt.name) : L('Kjøpes ved ' + N[0], 'Bought at ' + N[1]);
    return head + h.replace(NEARCARD, '').replace(/<button((?:(?!data-why)[^>])*?)\sdisabled(?=[\s>=])/g, (m, a) => '<button' + a + ' data-why="' + why + '" disabled');
  }
  // a long explanation folds to three lines with «Mer» (the rules and the reasons stood as walls of text over what was to be done)
  // (a «Mer» opened stays open when the page is drawn anew with new content, per page and by the text's beginning: GUI review U12)
  const folds = {}, foldKey = e => e.textContent.slice(0, 80);
  function fold(){ const op = folds[page]; for (const e of dBody.querySelectorAll('.ph-note, p.note')){ if (e.textContent.length > 260 && !e.closest('.pl-head')){ e.classList.add('fold'); if (op && op.has(foldKey(e))) e.classList.add('open'); } } }
  dBody.addEventListener('click', e => { const f = e.target.closest('.fold'); if (f){ const on = f.classList.toggle('open'), op = folds[page] || (folds[page] = new Set()); if (on) op.add(foldKey(f)); else op.delete(foldKey(f)); } }, true);
  function open(a){
    let [pg, sb] = String(a).split(':');
    if (pg === 'arbeid'){ pg = 'beholdning'; sb = sb || 'crew'; }   // the crew page is Om bord's fifth tab (U2-2): the plan's «Til Mannskap-siden» and the tests land there
    if (!PHONE.DRAWER.has(pg)) return;
    const was = page; page = pg; menu = null; html = '';
    if (sb) PHONE.dact(pg, 'sub', {s:sb});
    dr.hidden = false; document.body.classList.add('dk-open'); shown = ''; draw(was === pg); render();
    if (was !== pg && SHOP_PAGES.includes(pg) && typeof cloudEv === 'function') cloudEv('shop_view', {pg});
  }
  function close(){ page = null; dr.hidden = true; document.body.classList.remove('dk-open'); shown = ''; html = ''; if (PAINT) PAINT.live(false); if (typeof G3 !== 'undefined' && G3.trying) G3.tryView(null); render(); }
  dTabs.addEventListener('click', e => { const el = e.target.closest('[data-pg]'); if (el){ page = el.dataset.pg; shown = ''; draw(false); if (SHOP_PAGES.includes(page) && typeof cloudEv === 'function') cloudEv('shop_view', {pg:page}); } });
  $('drawerClose').addEventListener('click', close);
  dBody.addEventListener('click', e => {
    const el = e.target.closest('[data-pa],[data-act]'); if (!el || el.disabled) return;
    if (el.dataset.pa){
      // (an act that opened another page itself, as the plan's «Til Mannskap-siden», keeps it: before, the drawer was set back to the page
      // the act came from, GUI review F1 05.11.2026)
      const pg0 = page, next = PHONE.dact(page, el.dataset.pa, el.dataset);
      if (page !== pg0){ /* the act went to another page */ }
      else if (next !== page){ const pg = String(next).split(':')[0]; if (PHONE.DRAWER.has(pg)){ page = pg; draw(false); } else if (next !== 'home') PHONE.open(next); }
    } else doAct(el);
    draw(true); render();
  });
  dBody.addEventListener('input', e => panelInput(e));
  dBody.addEventListener('change', e => panelChange(e));
  // the drawer's page follows the game, a few times a second at most, and never while a finger is on it
  let lastDraw = 0;
  function tick(){ if (!page) return; const now = performance.now(); if (now - lastDraw < 700 || dBody.matches(':active')) return; lastDraw = now; draw(true); }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && page && !PHONE.isOpen()) close(); });
  // the buttons as text, for the tests: the labels, and what the strip's third line says beyond the next event (infoText)
  const text = () => { const i = infoText(), s = [i.on, i.place, i.reels, i.deck ? i.deck[0] : ''].filter(Boolean).join(' · '); return items0().map(x => L(x.lbl[0], x.lbl[1])).join(' | ') + (s ? ' | ' + s : ''); };
  const redraw = () => { if (page){ lastDraw = performance.now(); draw(true); } };   // at once, after something that came later (a picture read, a payment)
  return {render, redraw, open, close, tick, text, info:infoText, goTo, items:m => m ? menuItems(m).filter(Boolean) : items0(), menu:m => setMenu(m), get page(){ return page; }, get menuOpen(){ return menu; }};
})();
// the old name: everything that changes what the boat does asks for the buttons again
function renderActs(){ DOCK.render(); }

// the market's showroom (G3.showroom): a chip with the boat's name and size, and the way back to her spec sheet
let SHOWST = null;   // your own boat's status when the showroom opened
hooks.onShowroom = type => {
  SHOWST = type ? S.boat.status : null;
  const el = $('showChip'); if (!el) return;
  if (!type){ el.hidden = true; return; }
  const V = VESSELS[type], L = (no, en) => S.lang === 'no' ? no : en;
  $('scTx').textContent = V.name[S.lang] + ' · ' + fmt(V.len, 2) + ' × ' + fmt(V.beam, 1) + ' m'; $('scBack').textContent = L('‹ Tilbake', '‹ Back'); el.hidden = false;
};
$('scBack').addEventListener('click', () => { G3.showroom(null); DOCK.open('fartoy'); });
// every tick: when your own boat casts off from the harbour or runs aground, the showroom ends and the camera goes back to her
function showroomTick(){
  if (!SHOWST || !G3.showing) return;
  const st = S.boat.status; if (!(st === 'aground' && SHOWST !== 'aground') && !(SHOWST === 'port' && st !== 'port')) return;
  G3.showroom(null); toast(S.lang === 'no' ? 'Visningen er lukket. Kameraet er tilbake på båten din.' : 'The showroom is closed. The camera is back on your boat.');
}
// framme ved egen blåse etter «Kjør dit» eller Auto-nav (spilltest 3, U3): the chart plotter closes by itself, so the dock bar and «Ta opp»
// are there; only when the boat came sailing and now lies still within 300 m of one of her own buoys
{ let was = null;
  setInterval(() => { try {
    const b = S && S.boat, st = b && b.status; if (!st) return; const arrived = was === 'sailing' && st === 'idle' && !S.plan; was = st; if (!arrived) return;
    if (!document.body.classList.contains('vplot') || !mySets().some(s => Math.min(dist(b.pos, s.a), dist(b.pos, s.b)) < 0.3)) return;
    const c = document.getElementById('plotClose'); if (c && !c.hidden) c.click();
    toast(S.lang === 'no' ? 'Framme ved blåsa. «Ta opp» står i knappelinja.' : 'At the buoy. «Haul» is in the dock bar.');
  } catch (e){ console.error(e); } }, 500); }
