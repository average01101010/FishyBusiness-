  const tradeIn = () => vesselValue(curVessel());
  // what a purchase costs (deal() in core/03-simulation.js): the trade-in pays off the loans first, then the bank and Innovasjon Norge
  const whyText = x => x.why === 'notes' ? L('Banken vil se tre sluttsedler først.', 'The bank wants to see three landing notes first.') : x.why === 'eq' ? L('For lite egenkapital.', 'Too little equity.') : x.why === 'cap' ? L('Banken låner ikke mer: all gjeld skal ligge innenfor 80 % av verdien på flåten.', 'The bank lends no more: all debt has to stay within 80% of the fleet\'s value.') : '';
  const payNote = (x, no, en, loanNo, loanEn) => '<p class="ph-note">' + L(no, en) + kr(x.cost) + (x.payoff ? ' · ' + L('innbyttet innfrir først ', 'the trade-in first pays off ') + kr(x.payoff) + L(' av gjelda', ' of the debt') : '') +
    (x.loanNeed ? ' · ' + L(loanNo || 'lån ', loanEn || 'loan ') + kr(x.bankL) + (x.inL > 0 ? ' + Innovasjon Norge ' + kr(x.inL) : '') + ', ' + L('egenkapital ', 'equity ') + kr(x.eqNeed) : '') + (x.ok ? '' : ' · <b>' + whyText(x) + '</b>') + '</p>';
  const accessText = v => { const lic = vget(v, 'lic'); return lic ? L('lukket gruppe, hjemmelslengde ', 'closed group, quota length ') + lic.hl : v.id === openVesselId() ? L('åpen gruppe når du selv er om bord', 'open group when you are aboard yourself') : L('ingen adgang: torsk, hyse og sei bare som bifangst', 'no access: cod, haddock and saithe only as bycatch'); };
  const tiLocked = v => !!(S.order && S.order.vid !== null && (S.order.vid || S.cur) === v.id);
  // the ladder in «Neste mål»: the hand jig, the first jigging machine, blad B, the entry boat with a closed-group right, the next right
  // up, the 14.99 m coastal vessel, and the ocean fleet when the chart reaches it. The two next steps are shown
  function goals(){
    const steps = [], F = S.fm || {n:0, kr:0};
    if (!S.boat.gear) steps.push({n:L('Håndjuksa med pilk og markkroker', 'Hand jig with pilk and fly hooks'), need:PRICE.gear, a:'fiske'});
    if ((S.equip.jukse || 0) < 1) steps.push({n:L('Første juksamaskin', 'First jigging machine'), need:EQUIP.jukse.price, a:'utstyrb'});
    if (!bladB()) steps.push({n:L('Blad B i fiskermanntallet', 'Blad B of the fishermen\'s register'), pc:Math.min(F.n / BLADB.days, F.kr / BLADB.kr, 1), a:'papers',
      txt:fmt(Math.min(F.n, BLADB.days), 0) + ' / ' + BLADB.days + L(' landingsdager med deg om bord · ', ' landing days with you aboard · ') + kr(Math.min(F.kr, BLADB.kr)) + ' / ' + kr(BLADB.kr)});
    const ids = LIC_OFFERS.map(O => O.id).filter((x, i, a) => a.indexOf(x) === i);   // the rights in order (several boats share h10)
    const top = Math.max(-1, ...S.fleet.map(v => vget(v, 'lic')).filter(Boolean).map(l => ids.indexOf(l.id))), O = LIC_OFFERS.find(x => x.id === ids[top + 1]);
    if (O){ const x = deal(VESSELS[O.ves].price + licValue(O), tradeIn(), innOK()); steps.push({n:O[S.lang], need:x.eqNeed + 5000, bank:true, a:'fartoy'}); }
    if (!S.fleet.some(v => VESSELS[vget(v, 'boat').type].cls !== 'open')){ const k = 'kyst15', x = deal(VESSELS[k].price, 0); steps.push({n:VESSELS[k].name[S.lang], need:x.eqNeed + 5000, bank:true, a:'fartoy'}); }
    // the company (Jonas 09.10.2026): the Rederi app opens with it; after the boats, so the ladder comes first
    if (S.form !== 'AS') steps.push({n:L('Stift Rederi AS', 'Found a limited company'), need:TAX.as.capital + TAX.as.fee, a:'bank', txt:L('Et AS betaler 22 % av overskuddet og fører regnskap. Som ENK betaler du personskatt, som blir høyere når overskuddet vokser. Skattekortet i banken viser begge. Aksjekapital og gebyr: ', 'A company pays 22 % of the profit and keeps books. As ENK you pay personal tax, which grows with the profit. The tax card in the bank shows both. Share capital and fee: ') + kr(TAX.as.capital + TAX.as.fee)});
    steps.push({n:L('Havfiske', 'Ocean fishing'), pc:0, lock:true, txt:L('Kommer når kartet utvides vestover', 'Comes when the chart is extended west')});
    return steps.slice(0, 2).map(x => Object.assign(x, {pc:x.pc != null ? x.pc : Math.min(1, (x.bank ? eqCash() : Math.max(0, S.cash)) / Math.max(1, x.need))}));
  }
  function goalsCard(){
    const g = goals(); if (!g.length) return '';
    return '<div class="ph-card"><h4>' + L('Neste mål', 'Next goals') + '</h4>' + g.map(x => '<p style="margin:6px 0 2px"><b>' + x.n + '</b><br><small>' + (x.txt || (x.bank ? L('Egenkapital banken krever: ', 'Equity the bank wants: ') : L('Pris: ', 'Price: ')) + kr(x.need) + (x.bank && S.sales.length < 3 ? ' · ' + L('og tre sluttsedler', 'and three landing notes') : '')) + '</small></p><div class="qbar"><i style="width:' + (x.pc * 100).toFixed(1) + '%"></i></div>' +
      (x.a === 'papers' ? '<button class="ph-btn" data-pa="papers">' + L('Se papirene', 'See the papers') + '</button>' : x.lock || x.pc < 1 ? '' : x.a !== 'fartoy' ? '<button class="ph-btn" data-pa="open" data-a="' + x.a + '">' + (x.a === 'bank' ? L('Til banken', 'To the bank') : L('Til butikken', 'To the shop')) + '</button>' : '<button class="ph-btn" data-pa="sub" data-s="marked">' + L('Se markedet', 'See the market') + '</button>')).join('') + '</div>';
  }
  // ---- the boat market: tabs for the open group, boats with a closed-group right, the coastal fleet over 11 m and the ocean fleet;
  // a card per boat with its side view, and a spec sheet with the buttons. Until the company owns a closed-group vessel, an open-group
  // boat is only bought by trading in the one you have: a company can have one vessel in the open group (deltakerforskriften)
  let mkSel = null, minSheet = false;   // the market's chosen boat; the spec sheet open on «Min båt»
  const hasLic = () => S.fleet.some(v => vget(v, 'lic'));
  // the group: with a right (O) the boat goes into the closed group on the right's quota length, whatever her own length (a 31 ft boat with an
  // 8–8.9 m right is the usual thing along the coast); without one, the open group's class by her actual length
  const grpText = (V, O) => O ? L('lukket gruppe, hjemmel ' + O.hl + ' (faktisk lengde ' + fmt(V.len, 2) + ' m)', 'closed group, right of ' + O.hl + ' (actual length ' + fmt(V.len, 2) + ' m)') : V.cls === 'hav' ? L('havfiske, konsesjon', 'ocean, licence') : V.len >= 11 ? L('bare lukket gruppe (11 m og mer)', 'closed group only (11 m and more)') : V.len < 8 ? L('åpen gruppe under 8 m', 'open group under 8 m') : V.len < 10 ? L('åpen gruppe 8–9,99 m', 'open group 8–9.99 m') : L('åpen gruppe 10–10,99 m', 'open group 10–10.99 m');
  const tn = n => n >= 10000 ? fmt(n / 1000, n >= 100000 ? 0 : 1) + ' t' : fmt(n, 0) + ' kg';
  function mkCard(k, O){
    const V = VESSELS[k], price = O ? V.price + licValue(O) : V.price, mine = S.boat.type === k && !O, tag = V.lock ? L('kommer', 'coming') : O ? O.hl : V.isNew ? L('nybygg', 'new build') : L('brukt', 'used');
    return '<button class="ph-card vcard' + (mine ? ' mine' : '') + '" data-pa="mksel" data-k="' + k + '"' + (O ? ' data-o="' + O.k + '"' : '') + '><span class="vpic">' + vesselSVG(k) + '</span><span class="vtx"><b>' + (O ? O[S.lang] : V.name[S.lang]) + '</b><small>' + fmt(V.len, 2) + ' × ' + fmt(V.beam, 1) + ' × ' + fmt(V.draft, 1) + ' m · ' + tn(V.holdCap) + '</small><span class="vpr">' + kr(price) + ' <i>' + tag + '</i></span></span></button>';
  }
  function market(){
    const tab = sub.marked || 'open', h = [];
    if (mkSel) return sheet(mkSel.k, mkSel.o ? LIC_OFFERS.find(x => x.k === mkSel.o) : null);
    h.push('<div class="ph-sub mk">' + [['open', 'Åpen gruppe', 'Open group'], ['lic', 'Med hjemmel', 'With a right'], ['kyst', 'Kystflåten', 'Coastal fleet'], ['hav', 'Havfiske', 'Ocean']].map(([k, no, en]) => '<button class="' + (tab === k ? 'on' : '') + '" data-pa="mktab" data-s="' + k + '">' + L(no, en) + '</button>').join('') + '</div>');
    const bn = '«' + S.boatName + '»', ti = tradeIn();
    if (tab === 'open'){
      h.push('<p class="ph-note">' + L('Båter under 11 m. Rederiet kan ha én båt i åpen gruppe, så du bytter opp ved å gi ' + bn + ' i bytte (' + kr(ti) + '). Neste båt du kjøper til flåten, er en båt med hjemmel i lukket gruppe.', 'Boats under 11 m. The company can have one boat in the open group, so you trade up by trading in ' + bn + ' (' + kr(ti) + '). The next boat you buy for the fleet is one with a closed-group right.') + '</p>');
      for (const [k, V] of Object.entries(VESSELS)) if (V.cls === 'open') h.push(mkCard(k));
    } else if (tab === 'lic'){
      h.push('<p class="ph-note">' + L('Båter med deltakeradgang i lukket gruppe og fast torskekvote. Prisen er båten pluss kvoten (anslått ' + KPK + ' kr/kg torsk). Krever registrering på blad B i fiskermanntallet.', 'Boats with a closed-group right and a fixed cod quota. The price is the boat plus the quota (an estimated ' + KPK + ' kr/kg of cod). Needs registration on blad B of the fishermen\'s register.') + '</p>');
      for (const O of LIC_OFFERS) h.push(mkCard(O.ves, O));
    } else if (tab === 'kyst'){
      h.push('<p class="ph-note">' + L('Kystbåter fra 11 m. De kan bare fiske torsk, hyse og sei med hjemmel i lukket gruppe. Hjemlene for 11–21 m kommer senere, så nå selges de uten.', 'Coastal vessels from 11 m. They can only fish cod, haddock and saithe with a closed-group right. Rights for 11–21 m come later, so for now they are sold without.') + '</p>');
      for (const [k, V] of Object.entries(VESSELS)) if (V.cls === 'kyst') h.push(mkCard(k));
    } else {
      h.push('<p class="ph-note">' + L('Havfiskeflåten fisker utenfor 12 nm, vest for dagens kart. Båtene kan ses, men ikke kjøpes før havfeltene åpner.', 'The ocean fleet fishes outside 12 nm, west of today\'s chart. The vessels can be looked at, but not bought until the ocean grounds open.') + '</p>');
      for (const [k, V] of Object.entries(VESSELS)) if (V.cls === 'hav') h.push(mkCard(k));
    }
    if (!atKind('verft')) h.push('<p class="ph-note">' + L('Båter kjøpes og selges på verftet.', 'Vessels are bought and sold at the yard.') + '</p>' + nearHint('verft'));
    return h.join('');
  }
  // the spec sheet: eight sections with the same rows for every boat (Jonas 17.10.2026, docs/batplan.md del 5). A row that does not
  // apply says «ingen», «–» or «ikke på denne båten»; it is never left out, so two boats side by side read alike
  const NOTHERE = () => L('ikke på denne båten', 'not on this boat');
  function specSecs(k, O){
    const V = VESSELS[k], price = O ? V.price + licValue(O) : V.price, no = L('ingen', 'none'), ja = L('ja', 'yes'), yn = x => x ? ja : L('nei', 'no'), upto = n => n ? L('inntil ', 'up to ') + fmt(n, 0) : no, nm = q => EQUIP[q].name[S.lang];
    const holdTxt = {dekk:L('dekkslast i kasser og kar, ', 'deck load in boxes and tubs, '), rom:L('lasterom med is, ', 'a hold with ice, '), frys:L('fryseri, ', 'freezer hold, '), rsw:L('RSW-tanker, ', 'RSW tanks, ')}[V.hold.kind] + tn(V.holdCap) + ' (' + fmt(V.hold.m3, V.hold.m3 < 10 ? 1 : 0) + ' m³)';
    const house = {open:L('åpen båt', 'open boat'), hardtop:L('hardtopp over styreplassen', 'a hardtop over the helm'), hus:L('styrhus', 'wheelhouse')}[V.fac.house], galley = {none:no, plate:L('kokeplate', 'a hotplate'), bysse:L('bysse', 'a galley')}[V.fac.galley];
    const hull = {tre:L('tre', 'wood'), alu:L('aluminium', 'aluminium'), glassfiber:L('glassfiber', 'fibreglass'), 'stål':L('stål', 'steel')}[V.hullMat];
    const elec = ['plotter', 'vhf', 'ais', 'chirp', 'sonar', 'brovakt'], stdE = elec.filter(q => V.std.includes(q)), fitE = elec.filter(q => !V.std.includes(q) && equipFits(q, k));
    const upRows = Object.keys(UPGS).map(u => kv(UPGS[u][S.lang], UPGS[u].fit(V) ? ja : NOTHERE()));
    return [
      [L('Generelt', 'General'), [kv(L('Pris', 'Price'), kr(price)), kv(L('Nypris', 'New price'), V.priceNew ? kr(V.priceNew) : '–'), kv(L('Byggeår', 'Built'), V.isNew ? L('nybygg, levert med en gang', 'new build, delivered at once') : V.year),
        kv(L('Lengde', 'Length'), fmt(V.len, 2) + ' m'), kv(L('Bredde', 'Beam'), fmt(V.beam, 1) + ' m'), kv(L('Dypgående', 'Draft'), fmt(V.draft, 1) + ' m'), kv(L('Vekt (deplasement)', 'Weight (displacement)'), fmt(V.disp, V.disp < 10 ? 1 : 0) + ' t'),
        kv(L('Skrog', 'Hull'), hull), kv(L('Gruppe', 'Group'), grpText(V, O)), kv(L('Fjordlinja', 'Fjord line'), V.len >= 15 ? L('kan ikke fiske innenfor', 'may not fish inside') : L('kan fiske innenfor', 'may fish inside'))]],
      [L('Last', 'Cargo'), [kv(L('Fangsten', 'The catch'), holdTxt), kv(L('Is', 'Ice'), V.iceCap ? tn(V.iceCap) : V.hold.kind === 'frys' || V.hold.kind === 'rsw' ? L('trengs ikke', 'not needed') : no), kv(L('Ismaskin', 'Ice machine'), V.iceMaker ? tn(V.iceMaker) + L(' i døgnet', ' a day') : no),
        kv(L('Frakt på dekk', 'Freight on deck'), tn(V.deckCargo)), kv(L('Bløggekar', 'Bleeding tub'), tn(V.tubCap)), kv(L('Leveres i', 'Landed in'), V.land === 'tub' ? L('kar', 'tubs') : L('kasser', 'boxes'))]],
      [L('Maskin og drift', 'Engine and running'), [kv(L('Motor', 'Engine'), V.engine[S.lang]), kv(L('Fart', 'Speed'), L('marsj ', 'cruise ') + fmt(V.vcruise, 1) + ' · ' + L('topp ', 'top ') + fmt(V.vmax, 1) + ' kn'), kv(L('Forbruk i marsj', 'Burn at cruise'), fmt(V.lph, V.lph < 10 ? 1 : 0) + ' l/t'),
        kv(L('Tank', 'Tank'), fmt(V.fuelCap, 0) + ' L ' + (V.diesel ? 'diesel' : L('bensin', 'petrol'))), kv(L('Rekkevidde', 'Range'), fmt(V.range, 0) + ' nm'), kv(L('Service', 'Service'), L('hver ', 'every ') + V.svcH + L(' timer, ', ' hours, ') + kr(V.svcCost))]],
      [L('Sjø', 'Sea'), [kv(L('Tåler', 'Handles'), L('bølger til ', 'waves up to ') + fmt(V.risk[0], 1) + ' m, ' + L('vind til ', 'wind up to ') + Math.round(V.risk[2]) + ' m/s'), kv(L('Skrogtype', 'Hull type'), V.planing ? L('planende', 'planing') : L('deplasement', 'displacement')), kv(L('Kan ankre', 'Can anchor'), ja), kv(L('Døgndrift (2+2-vakt)', 'Round the clock (2+2 watch)'), yn(V.watch))]],
      [L('Folk om bord', 'People aboard'), [kv(L('Mannskap', 'Crew'), V.crew ? V.crew.key.length + L(' nøkkelfolk + lag på ', ' key people + teams of ') + V.crew.teams.map(t => t.n).join(' + ') : L('du + ', 'you + ') + V.crewMax), kv(L('Nøkkelfolk', 'Key people'), V.crew ? V.crew.key.join(', ') : '–'),
        kv(L('Lugarer', 'Cabins'), V.cabins || no), kv(L('Køyer', 'Berths'), V.berths || no), kv(L('Styreplass', 'Helm'), house), kv(L('Ly over arbeidsdekket', 'Shelter over the deck'), yn(V.fac.shelter)), kv(L('Bysse', 'Galley'), galley), kv(L('Toalett', 'Toilet'), yn(V.fac.wc)), kv(L('Tørkerom', 'Drying room'), yn(V.fac.dry)), kv(L('Messe', 'Mess'), yn(V.fac.mess))]],
      [L('Redskap og dekk', 'Gear and deck'), [kv(L('Rigger', 'Rigs'), V.rigs.length ? V.rigs.map(r => RIGS[r][S.lang]).join(', ') : L('trål og not', 'trawl and seine')), kv(L('Juksamaskiner', 'Jigging reels'), upto(V.jukseMax)), kv(L('Garn', 'Nets'), upto(V.gearMax.garn)), kv(L('Linestamper', 'Line tubs'), upto(V.gearMax.stamp)),
        kv(L('Autoline', 'Autoline'), V.autoHooks ? fmt(V.autoHooks, 0) + L(' kroker', ' hooks') : no), kv(L('Teiner', 'Pots'), upto(V.gearMax.teine)), kv(L('Halere som passer', 'Haulers that fit'), V.haulers.length ? V.haulers.map(nm).join(', ') : no),
        kv(L('Ved sløyebordet', 'At the gutting table'), V.stations.table), kv(L('Ved haleren', 'At the hauler'), V.stations.hauler), kv(L('Kran', 'Crane'), V.crane ? fmt(V.crane, 0) + ' t' : no), kv(L('Sløyemaskin', 'Gutting machine'), V.gutMachine ? fmt(V.gutMachine, 0) + ' kg/t' : no)]],
      [L('Elektronikk', 'Electronics'), [kv(L('Følger med', 'Comes with'), stdE.length ? stdE.map(nm).join(', ') : no), kv(L('Kan monteres', 'Can be fitted'), fitE.length ? fitE.map(nm).join(', ') : no)]],
      [L('Oppgraderinger på verftet', 'Upgrades at the yard'), upRows.concat([kv(L('Større lasterom', 'A larger hold'), V.cls !== 'hav' ? ja : NOTHERE()), kv(L('Større motor', 'A bigger engine'), !V.outboard ? ja : NOTHERE())])]];
  }
  function sheet(k, O){
    const V = VESSELS[k], bn = '«' + S.boatName + '»', ti = tradeIn(), free = atKind('verft') && !S.order, price = O ? V.price + licValue(O) : V.price, mine = S.boat.type === k && !O, h = [];
    const sec = (t, rows) => '<div class="vsec"><h5>' + t + '</h5>' + rows.filter(Boolean).join('') + '</div>';
    h.push('<button class="ph-btn alt mkback" data-pa="mksel">‹ ' + L('Tilbake til listen', 'Back to the list') + '</button>');
    h.push('<div class="ph-card vsheet"><h4>' + (O ? O[S.lang] : V.name[S.lang]) + '</h4><div class="vbig">' + vesselSVG(k) + '</div><p>' + V.desc[S.lang] + '</p>');
    const secs = specSecs(k, O); h.push(sec(secs[0][0], secs[0][1]));
    if (O){ const yearly = Math.round(O.cod * avgPrice('torsk', S.t / 60, 7) / 1000) * 1000;
      h.push(sec(L('Hjemmel', 'Right'), [kv(L('Hjemmelslengde', 'Quota length'), O.hl), kv(L('Faktisk lengde', 'Actual length'), fmt(V.len, 2) + ' m'), kv(L('Torsk, fartøykvote', 'Cod, vessel quota'), fmt(O.cod / 1000, 3) + ' t'), kv(L('Hyse, maks / garantert', 'Haddock, max / guaranteed'), tq(O.hyse[0], 1) + ' / ' + tq(O.hyse[1], 1)),
        kv(L('Sei, maks / garantert', 'Saithe, max / guaranteed'), tq(O.sei[0], 1) + ' / ' + tq(O.sei[1], 1)), kv(L('Kvotepris', 'Quota price'), O.kpk + ' kr/kg · ' + kr(licValue(O))), kv(L('Torsk per år', 'Cod a year'), L('ca. ', 'about ') + kr(yearly))])); }
    for (const [t, rows] of secs.slice(1)) h.push(sec(t, rows));
    // buying
    if (V.lock) h.push('<p class="ph-note">' + L('Havfiske kommer når kartet utvides vestover, utenfor 12 nm. Krever konsesjon.', 'Ocean fishing comes when the chart is extended west, outside 12 nm. Needs a licence.') + '</p>');
    else if (mine) h.push('<p class="ph-note">' + L(bn + ' er en slik båt.', bn + ' is one of these.') + '</p>');
    else if (O){ const mineO = S.lic && S.lic.id === O.id && S.boat.type === O.ves, inn = innOK(), A = deal(price, ti, inn), B = deal(price, 0, inn), F = S.fm || {n:0, kr:0}, bb = bladB();
      if (mineO) h.push('<p class="ph-note">' + L(bn + ' har denne hjemmelen.', bn + ' has this right.') + '</p>');
      else if (!bb) h.push('<p class="ph-note"><b>' + L('Krever blad B i fiskermanntallet.', 'Needs blad B of the fishermen\'s register.') + '</b> ' + L('Du har ' + F.n + ' av ' + BLADB.days + ' landingsdager med deg om bord og ' + kr(F.kr) + ' av ' + kr(BLADB.kr) + ' i førstehåndsverdi. Se blad B i Kvote-appen.', 'You have ' + F.n + ' of ' + BLADB.days + ' landing days with you aboard and ' + kr(F.kr) + ' of ' + kr(BLADB.kr) + ' in first-hand value. See blad B in the Quota app.') + '</p>');
      else h.push((inn ? '<p class="ph-note">' + L('Første båt i lukket gruppe: Innovasjon Norge toppfinansierer ' + Math.round(INN * 100) + ' % med et risikolån (8,9 %, 10 år), så du trenger bare ' + Math.round((0.2 - INN) * 100) + ' % egenkapital.', 'First boat in the closed group: Innovasjon Norge tops up ' + Math.round(INN * 100) + '% with a risk loan (8.9%, 10 years), so you only need ' + Math.round((0.2 - INN) * 100) + '% equity.') + '</p>' : '') + payNote(A, 'Mellomlegg med ' + bn + ' i bytte: ', 'To pay with ' + bn + ' traded in: ', 'lån over 15 år ', '15-year loan ') + '<button class="ph-btn' + (A.ok ? ' p' : '') + '" data-pa="buylic" data-ti="1" data-id="' + O.k + '"' + (A.ok && free && !tiLocked(curVessel()) ? '' : ' disabled') + '>' + L('Kjøp og bytt inn ' + bn, 'Buy, trading in ' + bn) + '</button>' +
        payNote(B, 'Til flåten, uten innbytte: ', 'For the fleet, no trade-in: ', 'lån over 15 år ', '15-year loan ') + '<button class="ph-btn" data-pa="buylic" data-ti="0" data-id="' + O.k + '"' + (B.ok && free ? '' : ' disabled') + '>' + L('Kjøp til flåten', 'Buy for the fleet') + '</button>');
      // the first closed-group boat founds the company (until then the player fishes in his own name)
      if (bb && !mineO && !S.company) h.push('<div class="ph-card"><h4>' + L('Rederiet', 'The company') + '</h4><p class="ph-note">' + L('En båt med hjemmel i lukket gruppe eies av et rederi. Det opprettes når du kjøper, med navnet her.', 'A boat with a closed-group right is owned by a company. It is founded when you buy, with the name here.') + '</p>' +
        '<label class="ph-kv"><span>' + L('Navn', 'Name') + '</span><input id="coName" maxlength="28" autocomplete="off" value="' + String(coDraft != null ? coDraft : coDefault()).replace(/"/g, '') + '"></label></div>');
      const ov = openVesselId(); if (ov && !mineO) h.push('<p class="ph-note">' + L('Et rederi med en båt i lukket gruppe kan ikke ha noen båt i åpen gruppe. «' + vget(vesselById(ov), 'boatName') + '» mister plassen der, men kan fiske kveite og krabbe.', 'A company with a closed-group vessel can have no vessel in the open group. «' + vget(vesselById(ov), 'boatName') + '» loses its place there, but can fish halibut and crab.') + '</p>'); }
    else { const A = deal(V.price, ti), B = deal(V.price, 0), verb = V.isNew ? L('Bestill', 'Order') : L('Kjøp', 'Buy'), openOnly = V.len < 11 && !hasLic();
      h.push(payNote(A, 'Mellomlegg med ' + bn + ' i bytte: ', 'To pay with ' + bn + ' traded in: ') + '<button class="ph-btn p" data-pa="buy" data-ti="1" data-k="' + k + '"' + (A.ok && free && !tiLocked(curVessel()) ? '' : ' disabled') + '>' + verb + L(' og bytt inn ' + bn, ', trading in ' + bn) + '</button>');
      { const lv = swapLeaves(k); if (lv.length) h.push('<p class="ph-note">' + L('Ved innbytte passer ikke dette utstyret den nye båten. Det følger med ' + bn + ' og betales ikke: ', 'With the trade-in this equipment does not suit the new vessel. It goes with ' + bn + ' and is not paid for: ') + lv.map(q => L(EQUIP[q].name.no, EQUIP[q].name.en)).join(', ') + '.</p>'); }
      if (openOnly) h.push('<p class="ph-note">' + L('Til flåten: et rederi kan bare ha én båt i åpen gruppe. Kjøp heller en båt med hjemmel, eller bytt inn ' + bn + '.', 'For the fleet: a company can only have one boat in the open group. Buy a boat with a right instead, or trade in ' + bn + '.') + '</p>');
      else h.push(payNote(B, 'Til flåten, uten innbytte: ', 'For the fleet, no trade-in: ') + '<button class="ph-btn" data-pa="buy" data-ti="0" data-k="' + k + '"' + (B.ok && free ? '' : ' disabled') + '>' + verb + L(' til flåten', ' for the fleet') + '</button>' + (V.len >= 11 || hasLic() ? '<p class="ph-note">' + L('Uten hjemmel kan hun bare ta torsk, hyse og sei som bifangst.', 'Without a right she can only take cod, haddock and saithe as bycatch.') + '</p>' : '')); }
    // the admin can take any vessel into the fleet for free, the locked ocean fleet too, anywhere, to test her (Jonas 30.10.2026)
    if (typeof adminOk === 'function' && adminOk()) h.push('<button class="ph-btn alt" data-pa="adminbuy" data-k="' + k + '">' + L('Admin: ta gratis til flåten', 'Admin: take into the fleet for free') + '</button>');
    if (vesselSpec(k)) h.push('<button class="ph-btn alt" data-pa="mk3d" data-k="' + k + '">' + L('Se båten i 3D', 'See her in 3D') + '</button>');
    h.push('</div>'); return h.join('');
  }
  // tab0: one tab without the tab row (the boat market in the yard, the boat in the inventory)
  function fartoy(tab0){
    const b = S.boat, V = VESSELS[b.type], s0 = tab0 || sub.fartoy || 'min', h = [tab0 ? '' : subs('fartoy', [['min', 'Min båt', 'My vessel'], ['marked', 'Marked', 'Market']]), '<div class="ph-c">' + (tab0 === 'min' ? '' : goalsCard())];
    if (s0 === 'min'){
      h.push('<div class="ph-card"><h4>«' + S.boatName + '»' + (meAboard() ? ' ⚓' : '') + '</h4><p class="ph-note">' + L('Adgang: ', 'Access: ') + accessText(curVessel()) + '</p>' + (S.fleet.length > 1 ? '<button class="ph-btn alt" data-pa="open" data-a="rederi">' + L('Hele flåten i Rederi-appen', 'The whole fleet in the Company app') + '</button>' : '') + '</div>');
      const svcLeft = V.svcH - ((b.engH || 0) - (b.svcAt || 0)), svcPct = clamp(1 - svcLeft / V.svcH, 0, 1), cls = svcPct > 0.9 ? 'bad' : svcPct > 0.7 ? 'warn' : '';
      const bar = (a, c, k) => '<div class="ph-bar"><i class="' + (k || '') + '" style="width:' + Math.round(clamp(a / c, 0, 1) * 100) + '%"></i></div>';
      const sec = (t, rows) => '<div class="vsec"><h5>' + t + '</h5>' + rows.filter(Boolean).join('') + '</div>';
      h.push('<div class="ph-card vsheet"><h4>' + V.name[S.lang] + '</h4>' + (minSheet ? specSecs(b.type).map(([t, rows]) => sec(t, rows)).join('') :
        kv(L('Lengde', 'Length'), fmt(V.len, 2) + ' m') + kv(L('Toppfart', 'Top speed'), fmt(BOAT.vmax, 1) + ' kn') + kv(L('Tåler', 'Handles'), L('bølger til ', 'waves up to ') + fmt(BOAT.risk[0], 1) + ' m ' + L('trygt', 'safely'))) + '<button class="ph-btn alt" data-pa="minsheet">' + (minSheet ? L('Skjul databladet', 'Hide the spec sheet') : L('Hele databladet', 'The whole spec sheet')) + '</button></div>');
      h.push('<div class="ph-card"><h4>Status</h4>' + kv(L('Drivstoff', 'Fuel'), fmt(b.fuel, 0) + ' / ' + BOAT.fuelCap + ' L') + bar(b.fuel, BOAT.fuelCap, b.fuel < BOAT.fuelCap * 0.2 ? 'bad' : '') + kv(L('Is', 'Ice'), fmt(b.ice, 0) + ' / ' + BOAT.iceCap + ' kg') + bar(b.ice, BOAT.iceCap) + kv(L('Last', 'Hold'), fmt(holdTotal(), 0) + ' / ' + BOAT.holdCap + ' kg') + bar(holdTotal(), BOAT.holdCap) +
        kv(L('Motortimer', 'Engine hours'), fmt(b.engH || 0, 0) + ' t') + kv(L('Neste service', 'Next service'), svcLeft > 0 ? L('om ', 'in ') + fmt(svcLeft, 0) + ' t' : '<span class="r2">' + L('forfalt', 'overdue') + '</span>') + bar(svcPct, 1, cls) +
        kv(L('Juksa', 'Jig line'), b.gear ? L('i orden', 'fine') : '<span class="r2">' + L('ingen, kjøp juksa i butikken', 'none, buy a jig in the shop') + '</span>') + '<button class="ph-btn" data-pa="open" data-a="verksted">' + L('Til verkstedet', 'To the workshop') + '</button></div>');
      // the echo sounder and the sonar say when they are switched off on the chart plotter
      const off = k => (k === 'chirp' && S.settings.echo === false) || (k === 'sonar' && S.settings.sonar === false) ? L(' (av)', ' (off)') : '';
      const eq = Object.keys(EQUIP).filter(k => EQUIP[k].multi ? S.equip[k] > 0 : S.equip[k]).map(k => EQUIP[k].name[S.lang] + (EQUIP[k].multi ? ' × ' + S.equip[k] : '') + off(k));
      h.push('<div class="ph-card"><h4>' + L('Utstyr om bord', 'Equipment on board') + '</h4><p>' + ['GPS'].concat(S.equip.chirp ? [] : [L('Enkelt ekkolodd', 'Basic sounder') + (S.settings.echo === false ? L(' (av)', ' (off)') : '')]).concat(eq).join(', ') + '</p><h4 style="margin-top:8px">' + L('Mannskap', 'Crew') + '</h4><p>' + [L('Deg (skipper)', 'You (skipper)')].concat(S.crew.map(c => c.name)).join(', ') + ' · ' + L('plass til ', 'room for ') + (V.crewMax + 1) + '</p></div>');
      if (S.order) h.push('<div class="ph-card"><h4>' + L('Bestilt', 'On order') + '</h4><p>' + VESSELS[S.order.type].name[S.lang] + '</p>' + '<p class="ph-note">' + L('Byttes så snart båten den skal erstatte, ligger i havn.', 'Swapped as soon as the vessel it replaces lies in port.') + '</p></div>');
    } else h.push(market());
    h.push('</div>'); return h.join('');
  }
  // --- the company: the fleet at a glance and what needs you. The vessel apps work on the vessel picked at the top (default: the one you follow)
