  // --- crew
  const NAMES = ['Ole Martin', 'Kari', 'Stian', 'Ingrid', 'Tor Arne', 'Siri', 'Mats', 'Hanne', 'Eirik', 'Marit', 'Sondre', 'Tone', 'Håkon', 'Line', 'Vegard', 'Silje'];
  const LEVELS = [{no:'lærling', en:'apprentice', skill:0.75, share:0.75}, {no:'erfaren', en:'experienced', skill:1.0, share:1}, {no:'dreven', en:'seasoned', skill:1.2, share:1}];
  function candidates(){ const w = weekOf(S.t / 60); return [0, 1, 2].map(i => { const r = h2(w * 3 + i, 4242), lv = LEVELS[Math.floor(h2(w * 3 + i, 4243) * 3)], nm = NAMES[Math.floor(r * NAMES.length)]; return {id:'c' + w + '_' + i, name:nm, age:18 + Math.floor(h2(w * 3 + i, 4244) * 44), lv:lv.no, lvEn:lv.en, skill:lv.skill, share:lv.share}; }).filter(c => !S.crew.some(x => x.id === c.id)); }
  // --- the crew, person by person
  const stars = (v, approx) => { const n = Math.round(clamp(v, 1, 5)); return '<span class="stars' + (approx ? ' apx' : '') + '">' + (approx ? '~' : '') + '★'.repeat(n) + '☆'.repeat(5 - n) + '</span>'; };
  const bar2 = (v, col) => '<div class="qbar"><i style="width:' + clamp(v, 0, 100).toFixed(0) + '%;background:' + col + '"></i></div>';
  const moodCol = v => v >= 65 ? '#35b37e' : v >= 40 ? '#f2b705' : '#e5484d';
  function traitChips(c, all){ return c.traits.map((t, i) => (all || c.known[i]) ? '<span class="chip" title="' + TRAITS[t].d[S.lang] + '">' + TRAITS[t][S.lang] + '</span>' : '<span class="chip unk">?</span>').join(''); }
  // del 2 of «mannskap med liv» (core/14-crewlife.js): the dream, the savings towards it, the family and the last lines of the story
  function lifeHtml(c){ const Lf = c.life; if (!Lf || typeof LIFE_GOAL === 'undefined') return ''; const g = LIFE_GOAL[Lf.goal] || LIFE_GOAL.ro, pct = Lf.goal === 'egenbat' ? clamp(Lf.saved / Lf.target * 100, 0, 100) : null;
    const fam = {single:L('enslig', 'single'), partner:L('samboer', 'a partner at home'), kids:L('familie med barn', 'a family with children')}[Lf.fam] || '';
    const st = Lf.story.slice(-3).reverse().map(q => '<p class="ph-note" style="margin:2px 0">' + dayStr(q[0] / 60) + ' · ' + (S.lang === 'en' ? q[2] : q[1]) + '</p>').join('');
    return '<div class="ph-kv"><span>' + L('Drømmen', 'The dream') + '</span><span>' + L(g[0], g[1]) + (Lf.notice ? ' · ' + L('går i land ', 'goes ashore ') + dayStr(Lf.notice / 60) : '') + '</span></div>' +
      (pct != null ? bar2(pct, '#4c8df0') + '<p class="ph-note">' + L('Spart ', 'Saved ') + kr(Lf.saved) + L(' av ', ' of ') + kr(Lf.target) + ' · ' + fam + '</p>' : '<p class="ph-note">' + fam + '</p>') + st; }
  function personCard(c, cand){
    const apx = !!cand, A = c.attr, full = !cand || c.known[1];
    return '<div class="ph-card crewc"><h4>' + c.name + ', ' + c.age + '</h4><p class="ph-note">' + c.home + ' · ' + (c.bi ? L('biyrke, fredag–søndag', 'part-time, Friday–Sunday') : L('hovedyrke', 'full-time')) + ' · ' + c.yrs + L(' år på sjøen', ' years at sea') + '</p>' +
      '<div class="crewgrid">' + ATTR.map(([k, no, en]) => '<span>' + L(no, en) + '</span>' + stars(A[k], apx)).join('') + '</div>' +
      '<div class="crewgear">' + GEARS.map(([k, no, en]) => '<span class="chip g">' + L(no, en) + ' ' + Math.round(c.gear[k]) + '</span>').join('') + '</div>' +
      '<div class="crewtr">' + traitChips(c, !cand) + '</div>' + (cand ? '<p class="ph-note">' + TRAITS[c.traits[0]].d[S.lang] + (full ? '' : ' ' + L('Resten ser du når dere har vært på sjøen sammen.', 'The rest you will see once you have been at sea together.')) + '</p>' : '') + '</div>';
  }
  function bors(){
    borsTick(S.t / 60); const B = S.bors, max = BOAT.crewMax, room = S.crew.length < max, inp = S.boat.status === 'port';
    const h = ['<div class="ph-c"><p class="ph-note">' + L('Her søker fiskere hyre. De forteller om erfaringen sin, men noen sider ser du først når dere har vært på sjøen sammen, og stjernene er et anslag til da. Mønstring skjer i havn.', 'Fishers looking for a berth. They tell you about their experience, but some sides you only see after time at sea together, and the stars are an estimate until then. Signing on is done in port.') + '</p>' +
      '<div class="ph-card">' + (S.fleet.length > 1 ? kv(L('Ansetter til', 'Hiring for'), '«' + S.boatName + '»') : '') + kv(L('Om bord', 'Aboard'), S.crew.length + ' / ' + max) + (skreiSeason(S.t / 60) ? '<p class="ph-note">' + L('Skreisesong: alle båter trenger folk, så det er få ledige, og de erfarne vil ha en tidel lott mer.', 'Skrei season: every boat needs hands, so few are free, and the experienced want a tenth of a share more.') + '</p>' : '') + '</div>'];
    if (!B.pool.length) h.push('<p class="ph-note">' + L('Ingen ledige akkurat nå. Nye kommer om morgenen.', 'Nobody free right now. New people come in the morning.') + '</p>');
    for (const c of B.pool){
      h.push(personCard(c, true).replace(/<\/div>$/, kv(L('Vil ha', 'Wants'), lotS(c.ask)) + kv(L('Søker hyre til', 'Looking until'), dayStr(c.until / 60)) +
        '<div class="ph-row2"><button class="ph-btn p" data-pa="bhire" data-id="' + c.id + '"' + (room && inp ? '' : ' disabled') + '>' + L('Ansett', 'Hire') + ' · ' + lotS(c.ask) + '</button>' + (c.neg ? '' : '<button class="ph-btn" data-pa="bneg" data-id="' + c.id + '"' + (room && inp ? '' : ' disabled') + '>' + L('Forhandle ned', 'Negotiate') + '</button>') + '</div>' + (!inp ? '<p class="ph-note">' + L('Mønstring skjer i havn.', 'Signing on is done in port.') + '</p>' : !room ? '<p class="ph-note">' + L('Båten har ikke plass til flere.', 'The boat has no room for more.') + '</p>' : '') + '</div>'));
    }
    h.push('</div>'); return h.join('');
  }
  // crew are let go only with the boat at a quay (a plant, a yard, a boathouse, a rorbu, a shop or any other quay), never at sea or at
  // anchor while she works (Jonas 13.10.2026)
  const crewAshore = () => S.boat.status === 'port';
  const ASHORE_NOTE = () => '<p class="ph-note">' + L('Mannskap kan bare sies opp når båten ligger til kai: ved et mottak, verft, naust, rorbu, butikk eller en annen kai.', 'Crew can only be let go with the boat at a quay: a plant, a yard, a boathouse, a rorbu, a shop or another quay.') + '</p>';
  function mannskap(){
    S.crew = S.crew.map(crewUpgrade);
    const max = BOAT.crewMax, h = ['<div class="ph-c"><p class="ph-note">' + L('Mannskapet går på lott. Ved hver landing trekkes trekkene og turens drivstoff, is og agn fra fangstverdien, og det som er igjen, delingsfangsten, deles mellom båten og mannskapet. Mannskapets del avhenger av hvor mange som er om bord, og deles i lotter: en mann har 1 lott, en lærling 0,75, og den som er skipper når du ikke er om bord, 1,5. Du har selv 1 lott når du er om bord, og den blir i kassa.', 'The crew fish on shares. At each landing the levies and the trip\'s fuel, ice and bait come off the catch value, and what is left, the shared catch, is split between the boat and the crew. The crew\'s part depends on how many are aboard, and is split in shares: a hand has 1 share, an apprentice 0.75, and the one who skippers while you are ashore 1.5. You have 1 share yourself when aboard, and it stays in the cash box.') + '</p>'];
    if (!crewAshore() && S.crew.length) h.push(ASHORE_NOTE());
    h.push('<div class="ph-card"><h4>«' + S.boatName + '»' + (meAboard() ? ' ⚓' : '') + '</h4>' + '<p class="ph-note">' + L('Adgang: ', 'Access: ') + accessText(curVessel()) + '</p>' + (meAboard() ? '' : '<p class="ph-note">' + L('Du er ikke om bord. Båten kan bare gå ut med eget mannskap.', 'You are not aboard. The vessel can only go out with crew of her own.') + '</p>') + '</div>');
    { const H = S.t / 60, ev = S.cevt, A = ev && crewById(ev.a), Bc = ev && crewById(ev.b);
      if (ev && A){ const tx = (ev.type === 'pair' ? PAIR_TOPICS : BOSS_TOPICS)[ev.topic][S.lang].replace('{a}', A.name).replace('{b}', Bc ? Bc.name : '');
        h.push('<div class="ph-card conflict"><h4>' + (ev.type === 'pair' ? L('Krangel om bord', 'A quarrel aboard') : L('Misnøye', 'Discontent')) + '</h4><p>' + tx + '</p>' + (ev.esc ? '<p class="ph-note">' + L('Det har gått en stund, og stemningen er blitt verre.', 'It has been a while, and the mood has got worse.') + '</p>' : '') + '<div class="ph-btncol">' +
          (ev.type === 'pair' ? '<button class="ph-btn p" data-pa="cres" data-o="talk">' + L('Snakk med dem begge', 'Talk to them both') + '</button><button class="ph-btn" data-pa="cres" data-o="sideA">' + L('Gi ' + A.name.split(' ')[0] + ' rett', 'Side with ' + A.name.split(' ')[0]) + '</button><button class="ph-btn" data-pa="cres" data-o="sideB">' + L('Gi ' + Bc.name.split(' ')[0] + ' rett', 'Side with ' + Bc.name.split(' ')[0]) + '</button><button class="ph-btn" data-pa="cres" data-o="offB">' + L('Gi ' + Bc.name.split(' ')[0] + ' fri neste tur', 'Give ' + Bc.name.split(' ')[0] + ' the next trip off') + '</button><button class="ph-btn alt" data-pa="cres" data-o="fireB"' + (crewAshore() ? '' : ' disabled') + '>' + L('Si opp ' + Bc.name.split(' ')[0], 'Let ' + Bc.name.split(' ')[0] + ' go') + '</button>'
            : '<button class="ph-btn p" data-pa="cres" data-o="listen">' + ({lott:L('Øk lotten med en tidel', 'Raise the share by a tenth'), hvile:L('Lov en hviletur', 'Promise a trip off'), vaer:L('Lov å være forsiktig', 'Promise to be careful'), kulde:L('Lov bedre klær', 'Promise better clothes'), generelt:L('Hør på det som sies', 'Listen to what is said')})[ev.topic] + '</button><button class="ph-btn" data-pa="cres" data-o="firm">' + L('Stå på ditt', 'Stand firm') + '</button><button class="ph-btn alt" data-pa="cres" data-o="fireA"' + (crewAshore() ? '' : ' disabled') + '>' + L('Si opp ' + A.name.split(' ')[0], 'Let ' + A.name.split(' ')[0] + ' go') + '</button>') + '</div></div>'); }
      h.push('<h4 style="margin:10px 2px 4px">' + L('Om bord', 'On board') + ' (' + S.crew.length + '/' + max + ')</h4>');
      if (!S.crew.length) h.push('<p class="ph-note">' + L('Ingen mannskap ennå. Finn folk i Mannskapsbørsen.', 'No crew yet. Find people in the crew exchange.') + '</p>');
      for (const c of S.crew){ const wd = (gDate(H).getUTCDay() + 6) % 7, away = c.off && c.offUntil ? L('er i land til ', 'is ashore until ') + dayStr(c.offUntil / 60) : c.off ? L('har fri neste tur', 'has the next trip off') : (c.bi && !c.biDays[wd]) ? L('biyrke, ikke om bord i dag', 'part-time, not aboard today') : '';
        h.push(personCard(c, false).replace('</h4>', ' · ' + L(c.lv, c.lvEn) + '</h4>').replace('<div class="crewtr">', lifeHtml(c) + '<div class="crewtr">').replace('<div class="crewgrid">', '<div class="ph-kv"><span>' + L('Trivsel', 'Morale') + '</span><span>' + Math.round(c.morale) + '</span></div>' + bar2(c.morale, moodCol(c.morale)) + '<div class="ph-kv"><span>' + L('Slitenhet', 'Fatigue') + '</span><span>' + Math.round(c.fatigue) + '</span></div>' + bar2(c.fatigue, c.fatigue > 70 ? '#e5484d' : '#4c8df0') + kv(L('Lott', 'Share'), lotS(c.share) + (c.share < c.ask - 0.001 ? ' · ' + L('ønsket ', 'wanted ') + lotS(c.ask) : '')) + (away ? '<p class="ph-note">' + away + '</p>' : '') + '<div class="crewgrid">').replace(/<\/div>$/, '<div class="ph-row2"><button class="ph-btn" data-pa="coff" data-id="' + c.id + '">' + (c.off ? L('Tilbake om bord', 'Back aboard') : L('Gi fri neste tur', 'Next trip off')) + '</button><button class="ph-btn alt" data-pa="cfire" data-id="' + c.id + '"' + (crewAshore() ? '' : ' disabled') + '>' + L('Si opp', 'Let go') + '</button></div></div>')); }
      if (S.crew.length >= 2){ const pr = []; for (let i = 0; i < S.crew.length; i++) for (let j = i + 1; j < S.crew.length; j++){ const k = compat(S.crew[i], S.crew[j]); pr.push('<div class="ph-kv"><span>' + S.crew[i].name.split(' ')[0] + ' og ' + S.crew[j].name.split(' ')[0] + '</span><span>' + (k >= 1 ? L('😊 god', '😊 good') : k <= -2 ? L('😠 dårlig', '😠 poor') : L('😐 grei', '😐 fair')) + '</span></div>'); }
        h.push('<div class="ph-card"><h4>' + L('Kjemi', 'Chemistry') + '</h4>' + pr.join('') + '<p class="ph-note">' + L('Dårlig kjemi gir krangler, særlig når folk er slitne eller misfornøyde.', 'Poor chemistry leads to quarrels, especially when people are tired or unhappy.') + '</p></div>'); } }
    if (S.crew.length){ const Q = lottParty(), n = S.crew.length + (meAboard() ? 1 : 0), M = lottM(n, BOAT.len || 0);
      h.push('<div class="ph-card"><h4>' + L('Lottoppgjøret', 'The share settlement') + '</h4>' + kv(L('Om bord på neste tur', 'Aboard on the next trip'), n + (meAboard() ? L(' med deg', ' with you') : '')) + kv(L('Mannskapets del av delingsfangsten', 'The crew\'s part of the shared catch'), fmt(M * 100, 0) + ' %') +
        kv(L('Lotter', 'Shares'), lotS(S.crew.reduce((a, c) => a + lotMigrate(c).share, 0) + (meAboard() ? LOTT.hand : 0) + (meAboard() ? 0 : LOTT.skip))) + '<p class="ph-note">' + L('Delen øker med flere om bord, men hver lott blir mindre. Satsene er et anslag etter tabellene i fiskerioverenskomsten.', 'The part grows with more aboard, but each share gets smaller. The rates are an estimate after the tables of the fishing agreement.') + '</p></div>'); }
    h.push('<div class="ph-card"><h4>' + L('Driftsplan', 'Operations plan') + '</h4><p class="ph-note">' + L('Hvor båten hører hjemme, hva og hvor den fisker, været og mannskapets rytme står i Driftsplan-appen.', 'Where the boat belongs, what and where she fishes, the weather and the crew\'s rhythm are in the Operations plan app.') + '</p><button class="ph-btn p" data-pa="open" data-a="drift">' + L('Åpne Driftsplan', 'Open the plan') + '</button></div>');
    h.push('<div class="ph-card"><h4>' + L('Trenger du folk?', 'Need hands?') + '</h4><p class="ph-note">' + L('Ledige fiskere finner du i Mannskapsbørsen.', 'Available fishers are in the crew exchange.') + '</p><button class="ph-btn p" data-pa="open" data-a="bors">' + L('Åpne Mannskapsbørsen', 'Open the crew exchange') + '</button></div>');
    return h.join('');
  }
  // --- bank (Økonomi 2, Ø1): two tabs, the accounts with the statement, and the year's accounts (core/03-simulation.js book, ACCT)
  let ledN = 25;
  const krS = v => (Math.round(v) < 0 ? '−' : '') + kr(Math.abs(Math.round(v)));
  const krC = v => '<span class="' + (Math.round(v) < 0 ? 'kout' : 'kin') + '">' + (Math.round(v) > 0 ? '+' : '') + krS(v) + '</span>';
  const bkv = (k, v, cls) => '<div class="ph-kv' + (cls ? ' ' + cls : '') + '"><span>' + k + '</span>' + v + '</div>';
  const bookL = k => L(ACCT[k].no, ACCT[k].en);
  // the statement: the newest postings first, a landing as one line with its parts under it
  function ledger(){
    const all = (S.ledger || []).slice().reverse();
    if (!all.length) return '<p class="ph-note">' + L('Ingen bevegelser ennå.', 'No transactions yet.') + '</p>';
    return all.slice(0, ledN).map(e => { const ks = Object.keys(e.p || {});
      return '<div class="ph-led"><div class="ph-kv hrow"><span><small>' + dayStr(e.t / 60).replace(/^\S+ /, '') + ' ' + hm(e.t / 60) + '</small><br>' + L(e.no, e.en) + '</span>' + krC(e.kr) + '</div>' +
        (ks.length > 1 ? '<p class="ph-note ph-ledp">' + ks.map(k => bookL(k) + ' ' + krS(e.p[k])).join(' · ') + '</p>' : '') + '</div>'; }).join('') +
      (all.length > ledN ? '<button class="ph-btn alt" data-pa="ledmore">' + L('Vis flere', 'Show more') + '</button>' : '');
  }
  const yearFracNow = () => yearFrac(S.t / 60);
  // the year's accounts: the income and costs by category, the depreciation, the result before and after tax, and the money that moved
  // outside the result (loans, instalments, vessels, tax paid), so the account and the result can be told apart
  function accounts(){
    const H = S.t / 60; if (!S.tx) txInit(H); bookYear(H);
    const y0 = yearH(H), ys = Object.keys(S.stats.y).map(Number).filter(y => y <= y0).sort((a, b) => b - a).slice(0, 4), y = ys.includes(+sub.acy) ? +sub.acy : y0, cur = y === y0, R = bookResult(y), Y = R.Y;
    const dep = cur ? Math.round(depBase() * TAX.dep * yearFracNow()) : Math.round(Y._dep != null ? Y._dep : depBase() * TAX.dep), pre = R.res - dep;
    const tax = cur ? taxOf(Math.max(0, pre), txForm(), S.tx.days.length).sum : Y._tax;
    const rows = s0 => Object.keys(ACCT).filter(k => ACCT[k].s === s0 && Y[k]).map(k => bkv(bookL(k), krS(s0 === 'out' ? Y[k] : Y[k]))).join('');
    const h = ['<div class="ph-c">'];
    if (ys.length > 1) h.push('<div class="ph-sub">' + ys.map(v => '<button class="' + (v === y ? 'on' : '') + '" data-pa="acy" data-y="' + v + '">' + v + '</button>').join('') + '</div>');
    h.push('<div class="ph-card ph-acc"><h4>' + L('Regnskap ', 'Accounts ') + y + (cur ? L(' så langt', ' so far') : '') + '</h4>' +
      '<h5>' + L('Inntekter', 'Income') + '</h5>' + (rows('in') || '<p class="ph-note">–</p>') + bkv(L('Sum inntekter', 'Total income'), kr(R.inc), 'tot') +
      '<h5>' + L('Kostnader', 'Costs') + '</h5>' + (rows('out') || '<p class="ph-note">–</p>') + bkv(L('Sum kostnader', 'Total costs'), krS(-R.cost), 'tot') +
      bkv(L('Avskrivning på båtene', 'Depreciation of the vessels'), krS(-dep)) + bkv(L('Resultat før skatt', 'Result before tax'), krS(pre), 'tot') +
      bkv(cur ? L('Beregnet skatt så langt', 'Tax reckoned so far') : L('Skatt for året', 'Tax for the year'), tax == null ? '–' : krS(-tax)) +
      bkv(L('Resultat etter skatt', 'Result after tax'), tax == null ? '–' : krS(pre - tax), 'tot') +
      '<p class="ph-note">' + L('Avskrivningen er 14 % i året av skrog og motor (saldogruppe e). Den flytter ingen penger, men trekkes fra overskuddet som skatten regnes av.', 'The depreciation is 14 % a year of the hulls and engines. It moves no money, but comes off the profit the tax is reckoned on.') + '</p></div>');
    const out = Object.keys(ACCT).filter(k => (ACCT[k].s === 'bal' || ACCT[k].s === 'tax') && Y[k]).map(k => bkv(k === 'skatt' ? L('Skatt betalt', 'Tax paid') : bookL(k), krS(Y[k]))).join('');
    h.push('<div class="ph-card ph-acc"><h4>' + L('Penger utenom resultatet', 'Money outside the result') + '</h4>' + (out || '<p class="ph-note">' + L('Ingenting ennå i år.', 'Nothing yet this year.') + '</p>') +
      '<p class="ph-note">' + L('Lån, avdrag og båtkjøp flytter penger, men er verken inntekt eller kostnad. Skatten betales på etterskudd og i terminer. Derfor går kontoen og resultatet ikke likt.', 'Loans, instalments and vessels bought move money, but are neither income nor cost. The tax is paid in arrears and in instalments. So the account and the result do not move alike.') + '</p></div>');
    { const fleetV = S.fleet.reduce((a, v) => a + vesselValue(v), 0), D = debt();
      h.push('<div class="ph-card ph-acc"><h4>' + L('Balanse nå', 'Balance sheet now') + '</h4>' + bkv(L('Flåten (verdi)', 'The fleet (value)'), kr(fleetV)) + bkv(L('Konto', 'Account'), krS(S.cash)) +
        bkv(L('Gjeld', 'Debt'), krS(-D)) + bkv(L('Egenkapital', 'Equity'), krS(fleetV + S.cash - D), 'tot') + '</div>'); }
    h.push('</div>'); return h.join('');
  }
  function bank(){
    const tab = sub.bank || 'konto', h = [subs('bank', [['konto', 'Kontoer', 'Accounts'], ['regnskap', 'Regnskap', 'Books']])];
    if (tab === 'regnskap') return h[0] + accounts();
    const B = bankS(), kk = kkLimit(), used = Math.max(0, -S.cash), mv = (k, v, t) => '<button class="ph-btn alt" data-pa="bkmv" data-k="' + k + '" data-v="' + v + '">' + t + '</button>';
    const pick = (a, list, cur, f) => '<div class="ph-sub ph-pick">' + list.map(v => '<button class="' + (v === cur ? 'on' : '') + '" data-pa="' + a + '" data-v="' + v + '">' + f(v) + '</button>').join('') + '</div>';
    h.push('<div class="ph-c"><div class="ph-card"><p class="ph-note">' + L('Brukskonto', 'Current account') + '</p><div class="ph-big' + (S.cash < 0 ? ' kout' : '') + '">' + krS(S.cash) + '</div>' +
      kv(L('Kan brukes med kassekreditten', 'Available with the overdraft'), krS(Math.max(0, spendable()))) + '</div>');
    // the tax account (Økonomi 2, Ø3): the set-aside, what the tax so far comes to, automatic or a fixed share
    { const owe = taxOwed(), pc = owe > 0 ? clamp(B.skatt / owe, 0, 1) : 1;
      h.push('<div class="ph-card"><h4>' + L('Skattekonto', 'Tax account') + '</h4><div class="ph-big">' + kr(Math.round(B.skatt)) + '</div>' + kv(L('Skatt på årets overskudd, ikke betalt', 'Tax on this year\'s profit, unpaid'), kr(Math.round(owe))) +
        '<div class="ph-bar"><i style="width:' + Math.round(pc * 100) + '%"></i></div>' +
        '<p class="ph-note" style="margin-bottom:2px">' + L('Avsetning etter hver levering og hvert oppdrag:', 'Set aside after each landing and mission:') + '</p>' +
        pick('bkauto', ['auto'].concat(BANK.pcts.map(String)), B.auto ? 'auto' : String(B.pct), v => v === 'auto' ? L('Det skatten blir', 'What the tax comes to') : fmt(+v * 100, 0) + ' %') +
        '<div class="ph-row2">' + mv('skatt', 10000, L('Sett inn 10 000 kr', 'Put in NOK 10 000')) + mv('skatt', -10000, L('Ta ut 10 000 kr', 'Take out NOK 10 000')) + '</div>' +
        '<p class="ph-note">' + L('Skatten betales fra skattekontoen først. «Det skatten blir» setter av skatten på overskuddet så langt i år, høyst halvparten av det som kommer inn. Skatteetaten råder næringsdrivende til å sette av rundt 40 %. Det som står igjen etter skatteoppgjøret, går tilbake til brukskontoen.', 'The tax is paid from the tax account first. «What the tax comes to» sets aside the tax on the profit so far this year, at most half of what comes in. Skatteetaten advises the self-employed to set aside about 40 %. What is left after the settlement goes back to the current account.') + '</p></div>'); }
    // the savings account: interest, a regular share of each landing, and equity for the next vessel
    h.push('<div class="ph-card"><h4>' + L('Sparekonto', 'Savings account') + '</h4><div class="ph-big">' + kr(Math.round(B.spare)) + '</div>' + kv(L('Rente', 'Interest'), fmt(BANK.spRate * 100, 1) + ' %') + kv(L('Opptjent rente denne måneden', 'Interest earned this month'), kr(Math.round(B.spAcc))) +
      '<div class="ph-row2">' + mv('spare', 10000, L('Sett inn 10 000', 'Put in 10 000')) + mv('spare', 50000, L('Sett inn 50 000', 'Put in 50 000')) + '</div><div class="ph-row2">' + mv('spare', -10000, L('Ta ut 10 000', 'Take out 10 000')) + mv('spare', '-all', L('Ta ut alt', 'Take out all')) + '</div>' +
      '<p class="ph-note" style="margin-bottom:2px">' + L('Fast sparing av hver levering:', 'Regular savings from each landing:') + '</p>' + pick('bksp', BANK.spPcts.map(String), String(B.spPct), v => +v ? fmt(+v * 100, 0) + ' %' : L('Ingen', 'None')) +
      '<p class="ph-note">' + L('Rentene godskrives den første i hver måned. Sparepengene regnes som egenkapital når du kjøper båt, og båtkjøpet henter fra sparekontoen det brukskontoen ikke har.', 'The interest is paid the first of each month. The savings count as equity when you buy a vessel, and the purchase takes from them what the current account lacks.') + '</p></div>');
    // the overdraft
    h.push('<div class="ph-card"><h4>' + L('Kassekreditt', 'Overdraft') + '</h4>' + kv(L('Ramme', 'Limit'), kr(kk)) + kv(L('Brukt', 'Used'), kr(Math.round(used))) + '<div class="ph-bar"><i class="' + (used > kk * 0.8 ? 'bad' : '') + '" style="width:' + Math.round(clamp(used / kk, 0, 1) * 100) + '%"></i></div>' +
      kv(L('Rente', 'Interest'), fmt(BANK.kkRate * 100, 1) + ' %') + kv(L('Påløpt rente denne måneden', 'Interest run up this month'), kr(Math.round(B.kkAcc))) +
      '<p class="ph-note">' + L('Brukskontoen kan gå i minus inntil rammen, som er 10 % av flåtens verdi og minst 20 000 kr. Rentene trekkes den første i måneden. Over rammen kan du ikke kjøpe noe før kontoen er innenfor igjen.', 'The current account can go below zero to the limit, which is 10 % of the fleet\'s value and at least NOK 20 000. The interest is taken the first of the month. Over the limit nothing can be bought until the account is within it again.') + '</p></div>');
    const loanCard = (k, title) => { const Q = S[k]; return '<div class="ph-card"><h4>' + title + '</h4>' + kv(L('Restgjeld', 'Balance'), kr(Q.bal)) + kv(L('Rente', 'Interest'), fmt(Q.rate * 100, 1) + ' %') + kv(L('Terminbeløp', 'Monthly payment'), kr(Q.pay)) + kv(L('Neste trekk', 'Next payment'), dayStr(Q.next / 60)) + kv(L('Renter betalt', 'Interest paid'), kr(Math.round(Q.intPaid || 0))) + '<button class="ph-btn" data-pa="repay" data-k="' + k + '"' + (S.cash >= 10000 ? '' : ' disabled') + '>' + L('Innbetal 10 000 kr', 'Pay NOK 10 000') + '</button><button class="ph-btn alt" data-pa="repayAll" data-k="' + k + '"' + (S.cash >= Q.bal ? '' : ' disabled') + '>' + L('Innfri lånet', 'Pay off the loan') + '</button></div>'; };
    if (S.loanIN) h.push(loanCard('loanIN', L('Risikolån, Innovasjon Norge', 'Risk loan, Innovasjon Norge')));
    if (S.loan) h.push(loanCard('loan', L('Båtlån, Kystbanken', 'Vessel loan, Kystbanken')));
    else h.push('<div class="ph-card"><h4>' + L('Båtlån', 'Vessel loan') + '</h4><p>' + L('Kystbanken finansierer inntil 80 % av båtprisen mot pant i flåten, over 10 år (15 år for båt med hjemmel), rente 6,9 %. Selger eller bytter du inn en båt, går pengene først til å innfri lånet. Søk direkte fra Båthandel under Verft når du kjøper.', 'Kystbanken finances up to 80% of the price secured on the fleet, over 10 years (15 for a boat with a right), at 6.9%. If you sell or trade in a vessel, the money first pays off the loan. Apply straight from the boat market in the yard when you buy.') + '</p></div>');
    // the tax (Økonomi 2, Ø4, core/03-simulation.js TAX): this year so far, the payments ahead, ENK against AS, and founding the company
    { const H = S.t / 60; if (!S.tx) txInit(H); const T = S.tx, P = txProfit(H), dn = T.days.length, N = txNow(H), C = taxCarry(), fr = yearFrac(H);
      const enkT = taxOf(S.form === 'AS' ? 0 : P, 'ENK', dn, skjBase() * TAX.skjerm * fr, C.ENK), asT = taxOf(P, 'AS', 0, 0, C.AS), plan = taxPlan(H).slice(0, 3);
      const dS = t => dayStr(t / 36e5 - EPOCH / 36e5).replace(/^\S+ /, '');
      h.push('<div class="ph-card ph-acc"><h4>' + L('Skatt ', 'Tax ') + T.y + '</h4>' + kv(L('Foretaket', 'Business'), S.form === 'AS' ? L('Aksjeselskap', 'Limited company') : L('Enkeltpersonforetak', 'Sole proprietorship')) +
        kv(L('Overskudd så langt', 'Profit so far'), krS(P)) + (S.form === 'AS' ? '' : kv(L('Dager på fiske', 'Days fishing'), dn + ' / ' + TAX.fisk.days)) +
        (N.enk && T.enk ? kv(L('Enkeltpersonforetaket før AS', 'The sole proprietorship before the company'), kr(N.enk.sum)) : '') +
        kv(L('Beregnet skatt så langt', 'Tax reckoned so far'), kr((N.enk ? N.enk.sum : 0) + (N.as ? N.as.sum : 0))) +
        (S.form !== 'AS' || T.enk ? kv(L('Forskuddsskatt for året', 'Advance tax for the year'), kr(Math.round(T.adv || 0))) + kv(L('Forskudd betalt', 'Paid in advance'), kr(Math.round(T.paid))) : '') +
        (C.ENK >= 1 || C.AS >= 1 ? kv(L('Underskudd til fradrag senere', 'Loss to deduct later'), kr(Math.round(C.ENK + C.AS))) : '') +
        '<h5>' + L('Neste betalinger', 'Next payments') + '</h5>' + (plan.length ? plan.map(p0 => kv(dS(p0.t) + ' · ' + L(TAXK[p0.kind][0], TAXK[p0.kind][1]) + ' ' + p0.y, p0.kr >= 0 ? kr(p0.kr) : L('tilbake ', 'back ') + kr(-p0.kr))).join('') : '<p class="ph-note">' + L('Ingen ennå.', 'None yet.') + '</p>') +
        (S.taxLast ? kv(L('Siste oppgjør, ', 'Last settlement, ') + S.taxLast.y, S.taxLast.rest >= 0 ? L('restskatt ', 'owed ') + kr(S.taxLast.rest) : L('tilbake ', 'back ') + kr(-S.taxLast.rest)) : '') +
        (S.form === 'AS' ? '' : '<h5>' + L('ENK eller AS', 'ENK or AS') + '</h5>' + kv(L('Skatt som ENK på overskuddet så langt', 'Tax as ENK on the profit so far'), kr(enkT.sum) + (enkT.fd ? L(' (fiskerfradrag ', ' (fisherman\'s deduction ') + kr(enkT.fd) + ')' : '')) +
          kv(L('Skatt som AS', 'Tax as AS'), kr(asT.sum) + L(' + regnskap ', ' + books ') + kr(Math.round(TAX.as.books * fr))) +
          '<button class="ph-btn" data-pa="foundas"' + (S.cash >= TAX.as.capital + TAX.as.fee ? '' : ' disabled') + '>' + L('Stift Rederi AS (', 'Found a company (') + kr(TAX.as.capital) + L(' i aksjekapital, gebyr ', ' share capital, fee ') + kr(TAX.as.fee) + ')</button>') +
        '<p class="ph-note">' + (S.form === 'AS'
          ? L('Selskapet betaler 22 % av overskuddet, og alt blir i selskapet. Forskuddet betales 15. februar og 15. april året etter, og skatteoppgjøret kommer i oktober.', 'The company pays 22 % of the profit, and all of it stays in the company. The advance is paid 15 February and 15 April the year after, and the settlement comes in October.')
          : L('Som ENK er overskuddet din inntekt: 22 % etter fiskerfradraget (30 %, høyst 160 000 kr, når du har fisket minst 130 dager) og personfradraget, trygdeavgift 7,6 % og trinnskatt. Forskuddsskatten betales 15. mars, juni, september og desember, og skatteoppgjøret kommer i juni året etter. Et AS betaler 22 % og lar alt bli i selskapet, men fører regnskap.', 'As ENK the profit is your income: 22 % after the fisherman\'s deduction (30 %, at most NOK 160 000, after 130 days fishing) and the personal allowance, 7.6 % social security and the bracket tax. The advance is paid 15 March, June, September and December, and the settlement comes in June the year after. A company pays 22 % and keeps it all, but keeps books.')) +
        L(' Underskudd føres videre til senere år. Satsene er fra 2026.', ' A loss is carried to later years. The rates are 2026\'s.') + '</p></div>'); }
    h.push('<div class="ph-card"><h4>' + L('Kontoutskrift', 'Statement') + '</h4>' + ledger() + '</div>');
    h.push('</div>');
    return h.join('');
  }
  // --- messages
  function meld(){
    const h = ['<div class="ph-c">'];
    if (!S.msgs.length) h.push('<p class="ph-note">' + L('Ingen meldinger.', 'No messages.') + '</p>');
    S.msgs.slice().reverse().forEach(m => h.push('<div class="ph-msg' + (m.read ? '' : ' new') + '"><time>' + dayStr(m.t / 60).replace(/^\S+ /, '') + ' ' + hm(m.t / 60) + '</time><b>' + m.from + '</b><p>' + (S.lang === 'no' ? m.no : m.en) + '</p></div>'));
    S.msgs.forEach(m => m.read = true); setTimeout(setBadge, 0);
    h.push('</div>'); return h.join('');
  }
  // --- actions
  // the equipment owned that does not suit type k: it stays with the boat traded in, and is not paid for
  const swapLeaves = k => Object.keys(EQUIP).filter(q => S.equip[q] && !EQUIP[q].multi && !equipFits(q, k));
  function switchVessel(k){
    const b = S.boat, old = VESSELS[b.type], left = swapLeaves(k);
    if (left.length) log('Utstyr som ikke passer den nye båten, ble med ' + old.name.no + ': ' + left.map(q => EQUIP[q].name.no).join(', ') + '.', 'Equipment that does not suit the new vessel went with the ' + old.name.en + ': ' + left.map(q => EQUIP[q].name.en).join(', ') + '.');
    b.type = k; delete b.liv; for (const q of Object.keys(EQUIP)) if (!equipFits(q, k)) S.equip[q] = EQUIP[q].multi ? Math.min(S.equip[q] || 0, VESSELS[k].jukseMax || 0) : false; applyVessel(); loreNewBoat(S.boatName);
    S.equip.jukse = Math.min(S.equip.jukse, BOAT.jukseMax); b.fuel = BOAT.fuelCap * 0.4; b.ice = 0; b.engH = 0; b.svcAt = 0; S.svcTold = false;
    while (S.crew.length > BOAT.crewMax) S.crew.pop();
    if (!S.owned.includes(k)) S.owned.push(k);
    log('Overtok ' + VESSELS[k].name.no + '. ' + old.name.no + ' er solgt.', 'Took over the ' + VESSELS[k].name.en + '. The ' + old.name.en + ' has been sold.');
    if (typeof G3 !== 'undefined') G3.vesselChanged();
  }
