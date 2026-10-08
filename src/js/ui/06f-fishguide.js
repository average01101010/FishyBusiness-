// ===== the phone's Fiskeguide app (08.10.2026; Jonas: «en intuitiv app til telefonen der spillere kan gå inn å lese kjapt om hvor de burde
// lete etter alle fiskeartene på ulike tider av året») =====
// Everything is read from the game's own fish model, so the guide cannot say anything the sea does not do: SPECIES (av: the months,
// skrei: the spawning cod, dep and prod: the depth and how much the species wants the open coast, minKg, pm: the price), SELQ (what the
// gear keeps), BAITS, the rules' dates (halibut closed 20 Dec-20 Apr, redfish open June-August: kveiteClosed and uerOpen in
// 03-simulation.js) and the two species the sea tells by place: the Greenland halibut (eggaArea) and the king crab (kingArea).
// Two views: the month (what to go after, best first, any month) and the year (all species and months in one grid). A tap on a species
// opens its card: when, where, how, bait, price and the rules. The month chosen is kept between the views.
const GUIDE = (() => {
  const L = (no, en) => S.lang === 'no' ? no : en;
  const MON = [['januar', 'februar', 'mars', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'desember'],
    ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']];
  const mname = m => MON[S.lang === 'no' ? 0 : 1][m], mshort = m => mname(m).slice(0, 3).toLowerCase();
  const nowM = () => gDate(S.t / 60).getUTCMonth();
  const st = {tab:'mnd', m:null, sp:null};   // what is shown (not saved): the view, the month (null: this one), the species card
  const month = () => st.m == null ? nowM() : st.m;
  const COL = {torsk:'#c98a3a', hyse:'#6b7bb8', sei:'#4a6a7a', lyr:'#6b8f4a', lange:'#8a5a7a', brosme:'#7a6a4a', uer:'#d0503a', kveite:'#2a8a8a', blakveite:'#1f4e79', krabbe:'#c0392b'};
  // the species, and a short word for where each stands (the card has the rest)
  const SHORT = {torsk:['bankene (skrei) og kysten', 'the banks (skrei) and the coast'], hyse:['banker og kanter', 'banks and edges'], sei:['grunt, nær land', 'shallow, near land'],
    lyr:['grunt, ytre felt', 'shallow, outer grounds'], lange:['dypt, bankekanter', 'deep, bank edges'], brosme:['dypt, bratt bunn', 'deep, steep ground'], uer:['dypt vann', 'deep water'],
    kveite:['eksponerte felt', 'exposed grounds'], blakveite:['Egga, fra Møre og nordover', 'the shelf edge, from Møre northwards'], krabbe:['Finnmark', 'Finnmark']};
  const WHERE = {
    torsk:['Skreien (gytetorsken) står på åpne banker 40–250 m utenfor fjordene, helst på kanten mot dypet. Ellers lever torsken nær land hele året, også inne i fjordene (se fjordlinjene i Regler).',
      'The skrei (spawning cod) stands on open banks 40–250 m outside the fjords, most of all on the edge towards the deep. Otherwise the cod lives near land all year, in the fjords too (see the fjord lines in Rules).'],
    hyse:['Åpne banker og kanter, litt dypere enn torsken.', 'Open banks and edges, a little deeper than the cod.'],
    sei:['Grunnere enn torsken, mest rundt 45 m.', 'Shallower than the cod, mostly around 45 m.'],
    lyr:['Grunt, og nesten bare på de ytre, åpne feltene.', 'Shallow, and almost only on the outer, open grounds.'],
    lange:['Dypt, på kantene av bankene. Best på bankline.', 'Deep, on the edges of the banks. Best on the bank line.'],
    brosme:['Dypt, på bratt bunn. Best på bankline.', 'Deep, on steep ground. Best on the bank line.'],
    uer:['Dypt vann. Rettet fiske etter uer er bare tillatt juni–august, med juksa fra båter under 15 m. Ellers kommer den som bifangst.', 'Deep water. Directed fishing for redfish is only allowed June–August, with the jig from boats under 15 m. Otherwise it comes as by-catch.'],
    kveite:['Eksponerte felt og kanter. Stor pilk eller tung line.', 'Exposed grounds and edges. Big jig or heavy line.'],
    blakveite:['Egga: kanten ut mot det dype, 300–1100 m. Nesten ingenting sør for 62° N, litt fra Storegga til Helgeland og Træna. Hovedfeltene går fra Lofoten og Vesterålen (Bleiksdjupet) til Malangsdjupet, Fugløybanken og Tromsøflaket. Mindre i Finnmark, mest i øst (Berlevåg, Vardø). Om vinteren samler gytefisken seg nord for 70° N, så sør tynnes ut og nord fylles.',
      'The shelf edge towards the deep, 300–1100 m. Next to none south of 62° N, a little from Storegga to Helgeland and Træna. The main grounds run from Lofoten and Vesterålen (Bleiksdjupet) to Malangsdjupet, Fugløybanken and Tromsøflaket. Less in Finnmark, most in the east (Berlevåg, Vardø). In winter the spawning fish gather north of 70° N, so the south thins and the north fills.'],
    krabbe:['Teiner på 40–175 m. Ingen i Troms, litt fra Sørøya, mest fra Nordkapp og østover. Fritt fiske vest for 26° Ø, kvoteområde for Finnmarks egne øst for linja.', 'Pots at 40–175 m. None in Troms, a little from Sørøya, most from the North Cape eastwards. Free fishing west of 26° E, a quota area for Finnmark\'s own east of it.']};
  const avM = (sp, m) => { const s = SPECIES[sp]; return s.av[m] + (sp === 'torsk' ? s.skrei[m] : 0); };
  const bestAv = sp => Math.max(...MI.map(m => avM(sp, m)));
  const MI = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const rel = (sp, m) => avM(sp, m) / bestAv(sp);
  const pot = (sp, m) => { const s = SPECIES[sp]; return s.k * s.base * avM(sp, m); };   // what the month gives next to the other species (calibration x base)
  // the rules' dates, as kveiteClosed and uerOpen: 'closed', 'part' (closes or opens within the month), 'bycatch' or 'open'
  function status(sp, m){
    if (sp === 'kveite'){ if (m <= 2) return 'closed'; if (m === 3 || m === 11) return 'part'; }
    if (sp === 'uer' && (m < 5 || m > 7)) return 'bycatch';
    return 'open';
  }
  const skreiM = (sp, m) => sp === 'torsk' && SPECIES.torsk.skrei[m] >= 0.5;
  // the sea tells the Greenland halibut and the king crab by place: little where the boat is now (kingArea, eggaArea's 62° N)
  function lowHere(sp){
    const p = S.boat && S.boat.pos; if (!p) return false;
    if (sp === 'krabbe') return kingArea(p) < 0.1;
    if (sp === 'blakveite') return natLL(p).lat < 62;
    return false;
  }
  function chip(sp, m){
    const s = status(sp, m);
    if (s === 'closed') return ['x', L('Fredet', 'Closed')];
    if (s === 'part') return ['w', m === 3 ? L('Åpner 21. april', 'Opens 21 April') : L('Fredet fra 20. des', 'Closed from 20 Dec')];
    if (s === 'bycatch') return ['w', L('Bare bifangst', 'By-catch only')];
    if (skreiM(sp, m)) return ['', L('Skrei', 'Skrei')];
    return null;
  }
  const nice = x => x < 30 ? Math.round(x / 5) * 5 : x < 100 ? Math.round(x / 10) * 10 : Math.round(x / 25) * 25;
  function depthOf(sp){ const s = SPECIES[sp]; if (s.area === 'egga') return [300, 1100]; return [nice(s.dep[0] * Math.exp(-s.dep[1])), nice(s.dep[0] * Math.exp(s.dep[1]))]; }
  const depthTxt = sp => { const d = depthOf(sp); return d[0] + '–' + d[1] + ' m'; };
  // months at or over a share of the species' best, as «jan–mar, okt»
  function monthsTxt(sp, thr){
    const b = MI.map(m => rel(sp, m) >= thr), n = b.filter(x => x).length; if (!n) return '';
    if (n === 12) return L('hele året', 'all year');
    let s0 = b.indexOf(false); const out = [];
    for (let k = 1; k <= 12; k++){ const m = (s0 + k) % 12; if (b[m]){ let e = m; while (b[(e + 1) % 12]) e = (e + 1) % 12; out.push(e === m ? mshort(m) : mshort(m) + '–' + mshort(e)); k += (e - m + 12) % 12; } }
    return out.join(', ');
  }
  const verdict = r => r >= 0.75 ? L('Toppsesong', 'Peak season') : r >= 0.5 ? L('God tid', 'A good time') : r >= 0.3 ? L('Middels', 'Middling') : L('Svak tid', 'A weak time');
  // ----- the gear: what keeps the species (SELQ), by the stars of a reading of it: 3 best, 2 good, 1 some
  const GEARS = [['jig', 'Juksa', 'Jig'], ['garn', 'Garn', 'Nets'], ['line:hyse', 'Hyseline', 'Haddock line'], ['line:bank', 'Bankline', 'Bank line'], ['teine', 'Teiner', 'Pots']];
  function stars(sp, g){
    const s = SPECIES[sp];
    if (g === 'jig'){ if (s.shell) return 0; if (sp === 'kveite') return 3; if ((s.jig != null ? s.jig : 1) < 0.1) return 0; return s.dep[0] > 150 ? 1 : 2; }
    if (g === 'teine') return s.shell ? 3 : 0;
    if (s.shell) return 0;
    const v = (SELQ[g] || {})[sp] || 0; return v >= 1.5 ? 3 : v >= 0.7 ? 2 : v >= 0.3 ? 1 : 0;
  }
  const dots = n => '<b class="gd-dots">' + '●'.repeat(n) + '<span>' + '●'.repeat(3 - n) + '</span></b>';
  function gearTxt(sp){
    return GEARS.map(g => [g, stars(sp, g[0])]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1])
      .map(([g, n]) => '<div class="ph-kv"><span>' + (g[0] === 'jig' && sp === 'kveite' ? L('Stor pilk', 'Big jig') : L(g[1], g[2])) + '</span><span>' + dots(n) + '</span></div>').join('');
  }
  const baitTxt = sp => Object.keys(BAITS).map(k => [k, baitF(k, sp)]).filter(x => x[1] >= 1.1).sort((a, b) => b[1] - a[1]).map(x => L(BAITS[x[0]].no, BAITS[x[0]].en)).join(', ');
  // ----- the month view
  function row(sp, m){
    const r = rel(sp, m), c = chip(sp, m), s = status(sp, m), low = lowHere(sp);
    return '<button class="gd-row' + (s === 'closed' ? ' dim' : '') + '" data-pa="gdSp" data-sp="' + sp + '"><span class="gd-dot" style="background:' + COL[sp] + '"></span>' +
      '<span class="gd-nm"><b>' + L(SPECIES[sp].no, SPECIES[sp].en) + '</b><small>' + depthTxt(sp) + ' · ' + L(SHORT[sp][0], SHORT[sp][1]) + '</small></span>' +
      '<span class="gd-st"><i class="gd-bar"><u style="width:' + Math.round(r * 100) + '%"></u></i>' + (c ? '<em class="gd-chip ' + c[0] + '">' + c[1] + '</em>' : '') +
      (low ? '<em class="gd-chip w">' + L('Lite der du er', 'Little where you are') + '</em>' : '') + '</span></button>';
  }
  const monthBar = m => '<div class="gd-mon">' + MI.map(i => '<button class="' + (i === m ? 'on' : '') + (i === nowM() ? ' now' : '') + '" data-pa="gdMon" data-m="' + i + '">' + mshort(i) + '</button>').join('') + '</div>';
  function monthView(){
    const m = month(), order = ALLSP.slice().sort((a, b) => (status(a, m) === 'closed') - (status(b, m) === 'closed') || pot(b, m) - pot(a, m));
    return monthBar(m) + '<div class="ph-card gd-now"><small>' + (m === nowM() ? L('Nå', 'Now') + ' · ' : '') + mname(m) + '</small><h4>' + L('Mest å hente', 'Most to be had') + '</h4>' +
      '<p>' + order.filter(sp => status(sp, m) !== 'closed').slice(0, 3).map(sp => '<b style="color:' + COL[sp] + '">' + L(SPECIES[sp].no, SPECIES[sp].en) + '</b>').join(' · ') + '</p></div>' +
      order.map(sp => row(sp, m)).join('') +
      '<p class="ph-note">' + L('Linja viser hvor mye fisk det er denne måneden mot artens beste måned. Rekkefølgen viser hva som gir mest å hente akkurat da. Trykk på en art for hvor, hvordan og hva den betaler.', 'The line shows how much fish there is this month against the species\' best month. The order shows what gives the most just then. Tap a species for where, how and what it pays.') + '</p>';
  }
  // ----- the year view
  function yearView(){
    const m = month();
    return '<div class="ph-card gd-yr"><div class="gd-yrow gd-yh"><span></span>' + MI.map(i => '<button class="' + (i === m ? 'on' : '') + (i === nowM() ? ' now' : '') + '" data-pa="gdMonY" data-m="' + i + '">' + mshort(i).slice(0, 1).toUpperCase() + '</button>').join('') + '</div>' +
      ALLSP.map(sp => '<button class="gd-yrow" data-pa="gdSp" data-sp="' + sp + '"><span class="gd-sp"><span class="gd-dot" style="background:' + COL[sp] + '"></span>' + L(SPECIES[sp].no, SPECIES[sp].en) + '</span>' +
        MI.map(i => '<i class="' + (i === m ? 'on' : '') + (status(sp, i) === 'closed' ? ' cl' : status(sp, i) === 'bycatch' ? ' by' : '') + '" style="background:' + (status(sp, i) === 'closed' ? '' : 'rgba(30,140,110,' + (0.08 + 0.92 * rel(sp, i)).toFixed(2) + ')') + '"></i>').join('') + '</button>').join('') + '</div>' +
      '<p class="ph-note">' + L('Mørkere farge: mer fisk den måneden, mot artens beste. Stripet: fredet. Prikkete: bare bifangst. Trykk på en bokstav for å se en annen måned, eller på en art for å lese om den.', 'Darker: more fish that month against the species\' best. Striped: closed. Dotted: by-catch only. Tap a letter to see another month, or a species to read about it.') + '</p>';
  }
  // ----- the species card
  function card(sp){
    const s = SPECIES[sp], m = month(), r = rel(sp, m), c = chip(sp, m), mx = bestAv(sp), pm = s.pm;
    const bars = MI.map(i => { const a = s.av[i] / mx, k = sp === 'torsk' ? s.skrei[i] / mx : 0, cl = status(sp, i) === 'closed';
      return '<button class="gd-col' + (cl ? ' cl' : '') + (i === m ? ' on' : '') + '" data-pa="gdMon" data-m="' + i + '"><u style="height:' + Math.round(a * 100) + '%"></u>' + (k ? '<u class="sk" style="height:' + Math.round(k * 100) + '%"></u>' : '') + '</button>'; }).join('');
    const best = monthsTxt(sp, 0.75), good = monthsTxt(sp, 0.5), pb = pm.indexOf(Math.max(...pm)), pw = pm.indexOf(Math.min(...pm));
    const exp = depthOf(sp)[0] >= 100 || s.area ? '' : s.prod <= 0.4 ? L('Helst på ytre, åpne felt. Lite i skjermede fjorder.', 'Mostly on the outer, open grounds. Little in sheltered fjords.') :
      s.prod <= 0.62 ? L('Best ute på åpen kyst og på bankene, men finnes også lenger inne.', 'Best out on the open coast and the banks, but also found further in.') : L('Finnes også i de mer skjermede farvannene.', 'Also found in the more sheltered waters.');
    const bt = baitTxt(sp), low = lowHere(sp);
    return '<button class="gd-back" data-pa="gdBack">‹ ' + L('Alle arter', 'All species') + '</button>' +
      '<div class="ph-card gd-h" style="border-left:4px solid ' + COL[sp] + '"><h4>' + L(s.no, s.en) + '</h4><p>' + mname(m) + ': <b>' + verdict(r) + '</b>' + (c ? ' <em class="gd-chip ' + c[0] + '">' + c[1] + '</em>' : '') +
        (low ? ' <em class="gd-chip w">' + L('Lite der du er', 'Little where you are') + '</em>' : '') + '</p></div>' +
      '<div class="ph-card"><h4>' + L('Når', 'When') + '</h4><div class="gd-bars">' + bars + '</div><div class="gd-bl">' + MI.map(i => '<span class="' + (i === m ? 'on' : '') + '">' + mshort(i).slice(0, 1).toUpperCase() + '</span>').join('') + '</div>' +
        '<div class="ph-kv"><span>' + L('Best', 'Best') + '</span><span>' + best + '</span></div>' + (good && good !== best ? '<div class="ph-kv"><span>' + L('Bra', 'Good') + '</span><span>' + good + '</span></div>' : '') +
        '<p class="ph-note">' + L('Trykk på en søyle for å se den måneden.', 'Tap a bar to see that month.') + (sp === 'torsk' ? ' ' + L('Blå del: skreien.', 'Blue part: the skrei.') : '') + '</p></div>' +
      '<div class="ph-card"><h4>' + L('Hvor', 'Where') + '</h4><div class="ph-kv"><span>' + L('Dyp', 'Depth') + '</span><span>' + depthTxt(sp) + (s.area ? '' : ', ' + L('mest rundt', 'mostly around') + ' ' + nice(s.dep[0]) + ' m') + '</span></div>' +
        '<p>' + L(WHERE[sp][0], WHERE[sp][1]) + '</p>' + (exp ? '<p>' + exp + '</p>' : '') +
        (s.shell ? '' : '<p>' + L('Der bunnen faller bratt (kantene) er det mer fisk enn på flat bunn.', 'Where the bottom falls steeply (the edges) there is more fish than on flat ground.') + '</p>') +
        '<p class="ph-note">' + L('Fisken flytter seg i løpet av døgnet og uka. Ekkoloddet og varmekartet viser hvor den står akkurat nå.', 'The fish move over the day and the week. The echo sounder and the heat map show where it stands right now.') + '</p></div>' +
      '<div class="ph-card"><h4>' + L('Hvordan', 'How') + '</h4>' + gearTxt(sp) + (bt ? '<div class="ph-kv"><span>' + L('Agn', 'Bait') + '</span><span>' + bt + '</span></div>' : '') + '</div>' +
      '<div class="ph-card"><h4>' + L('Pris', 'Price') + '</h4><div class="ph-kv"><span>' + mname(m) + '</span><span>' + fmt(pm[m], 0) + ' kr/kg</span></div>' +
        '<div class="ph-kv"><span>' + L('Best betalt', 'Best paid') + '</span><span>' + mname(pb) + ' · ' + fmt(pm[pb], 0) + ' kr/kg</span></div><div class="ph-kv"><span>' + L('Lavest', 'Lowest') + '</span><span>' + mname(pw) + ' · ' + fmt(pm[pw], 0) + ' kr/kg</span></div>' +
        '<p class="ph-note">' + L('Pris for rund fisk, første ledd. Størrelsen og kvaliteten avgjør hva du får.', 'Price for round fish, first hand. The size and the quality decide what you get.') + '</p></div>' +
      '<div class="ph-card"><h4>' + L('Regler', 'Rules') + '</h4>' + (s.minKg ? '<div class="ph-kv"><span>' + L('Minstemål', 'Minimum size') + '</span><span>' + fmt(s.minKg, 1) + ' kg</span></div>' : '') +
        (s.maxKg ? '<div class="ph-kv"><span>' + L('Største lovlige', 'Largest allowed') + '</span><span>' + s.maxKg + ' kg</span></div>' : '') +
        (sp === 'kveite' ? '<p>' + L('Fredet 20. desember–20. april nord for 62° N. Levende kveite settes ut.', 'Closed 20 December–20 April north of 62° N. Live halibut is released.') + '</p>' : '') +
        (sp === 'krabbe' ? '<p>' + L('Ingen minstemål vest for 26° Ø. Pass på kvotesonen i øst.', 'No minimum size west of 26° E. Mind the quota zone in the east.') + '</p>' : '') +
        '<button class="ph-btn" data-pa="open" data-a="regler">' + L('Åpne Regler', 'Open Rules') + '</button></div>';
  }
  function page(){
    return '<div class="ph-c gd">' + (st.sp && SPECIES[st.sp] ? card(st.sp) :
      '<div class="ph-sub gd-tabs">' + [['mnd', 'Måned', 'Month'], ['ar', 'Hele året', 'The year']].map(([k, no, en]) => '<button class="' + (st.tab === k ? 'on' : '') + '" data-pa="gdTab" data-t="' + k + '">' + L(no, en) + '</button>').join('') + '</div>' +
      (st.tab === 'ar' ? yearView() : monthView())) + '</div>';
  }
  function act(a, d){
    if (a === 'gdTab') st.tab = d.t === 'ar' ? 'ar' : 'mnd';
    else if (a === 'gdMon' || a === 'gdMonY'){ const m = +d.m; if (!(m >= 0 && m < 12)) return false; st.m = m === nowM() ? null : m; if (a === 'gdMonY') st.tab = 'mnd'; }
    else if (a === 'gdSp'){ if (!SPECIES[d.sp]) return false; st.sp = d.sp; }
    else if (a === 'gdBack') st.sp = null;
    else return false;
    return true;
  }
  return {page, act, st, rel, status, monthsTxt, depthOf};
})();
