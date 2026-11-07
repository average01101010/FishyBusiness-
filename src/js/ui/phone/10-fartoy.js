  const tradeIn = () => vesselValue(curVessel());
  // what a purchase costs (deal() in core/03-simulation.js): the trade-in pays off the loans first, then the bank and Innovasjon Norge
  const whyText = x => x.why === 'notes' ? L('Banken vil se tre sluttsedler først.', 'The bank wants to see three landing notes first.') : x.why === 'eq' ? L('For lite egenkapital.', 'Too little equity.') : x.why === 'cap' ? L('Banken låner ikke mer: all gjeld skal ligge innenfor 80 % av verdien på flåten.', 'The bank lends no more: all debt has to stay within 80% of the fleet\'s value.') : '';
  const payNote = (x, no, en, loanNo, loanEn) => '<p class="ph-note">' + L(no, en) + kr(x.cost) + (x.payoff ? ' · ' + L('innbyttet innfrir først ', 'the trade-in first pays off ') + kr(x.payoff) + L(' av gjelda', ' of the debt') : '') +
    (x.loanNeed ? ' · ' + L(loanNo || 'lån ', loanEn || 'loan ') + kr(x.bankL) + (x.inL > 0 ? ' + Innovasjon Norge ' + kr(x.inL) : '') + ', ' + L('egenkapital ', 'equity ') + kr(x.eqNeed) : '') + (x.ok ? '' : ' · <b>' + whyText(x) + '</b>') + '</p>';
  const accessText = v => { const lic = vget(v, 'lic'); return lic ? L('lukket gruppe, hjemmelslengde ', 'closed group, quota length ') + lic.hl : v.id === openVesselId() ? L('åpen gruppe når du selv er om bord', 'open group when you are aboard yourself') : L('ingen adgang: torsk, hyse og sei bare som bifangst', 'no access: cod, haddock and saithe only as bycatch'); };
  const tiLocked = v => !!(S.order && S.order.vid !== null && (S.order.vid || S.cur) === v.id) || !!mbSale(v);   // (or put out for sale at Kystmegleren, B1)
  // the ladder in «Neste mål»: the hand jig, the first jigging machine, blad B, the entry boat with a closed-group right, the next right
  // up, the 14.99 m coastal vessel, and the ocean fleet. The two next steps are shown. The ladder is the fleet's, not the boat you
  // follow: a step is passed when the fleet has reached it or a step above it (Jonas 07.11.2026: with an ocean vessel and two sjarks the
  // home screen still asked for the first jigging machine, which an ocean vessel cannot carry, and then for the old wooden snekke with
  // a right under 7 m). The hand jig and the jigging machine are for the first boat alone; with an ocean vessel in the fleet the ladder
  // is climbed, and «Neste mål» goes away once the company is an AS
  function goals(){
    const steps = [], F = S.fm || {n:0, kr:0}, cls = v => VESSELS[vget(v, 'boat').type].cls;
    const hav = S.fleet.some(v => cls(v) === 'hav'), past = S.fleet.length > 1 || S.fleet.some(v => cls(v) !== 'open' || vget(v, 'lic'));
    if (!past && !S.boat.gear) steps.push({n:L('Håndjuksa med pilk og markkroker', 'Hand jig with pilk and fly hooks'), need:PRICE.gear, a:'fiske'});
    if (!past && (BOAT.jukseMax || 0) > 0 && (S.equip.jukse || 0) < 1) steps.push({n:L('Første juksamaskin', 'First jigging machine'), need:EQUIP.jukse.price, a:'utstyrb'});
    if (!hav && !bladB()) steps.push({n:L('Blad B i fiskermanntallet', 'Blad B of the fishermen\'s register'), pc:Math.min(F.n / BLADB.days, F.kr / BLADB.kr, 1), a:'papers',
      txt:fmt(Math.min(F.n, BLADB.days), 0) + ' / ' + BLADB.days + L(' landingsdager med deg om bord · ', ' landing days with you aboard · ') + kr(Math.min(F.kr, BLADB.kr)) + ' / ' + kr(BLADB.kr)});
    const ids = LIC_OFFERS.map(O => O.id).filter((x, i, a) => a.indexOf(x) === i);   // the rights in order (several boats share h10)
    const top = Math.max(-1, ...S.fleet.map(v => vget(v, 'lic')).filter(Boolean).map(l => ids.indexOf(l.id))), O = LIC_OFFERS.find(x => x.id === ids[top + 1]);
    if (O && !hav){ const pr = VESSELS[O.ves].price + licValue(O), x = deal(pr, tradeIn(), innOK()); steps.push({n:O[S.lang], need:x.eqNeed + 5000, bank:true, a:'fartoy', price:pr}); }
    if (!S.fleet.some(v => cls(v) !== 'open')){ const k = 'kyst15', x = deal(VESSELS[k].price, 0); steps.push({n:VESSELS[k].name[S.lang], need:x.eqNeed + 5000, bank:true, a:'fartoy', price:VESSELS[k].price}); }
    // the company (Jonas 09.10.2026): the Rederi app opens with it; after the boats, so the ladder comes first
    if (S.form !== 'AS') steps.push({n:L('Stift Rederi AS', 'Found a limited company'), need:TAX.as.capital + TAX.as.fee, a:'bank', txt:L('Et AS betaler 22 % av overskuddet og fører regnskap. Som ENK betaler du personskatt, som blir høyere når overskuddet vokser. Skattekortet i banken viser begge. Aksjekapital og gebyr: ', 'A company pays 22 % of the profit and keeps books. As ENK you pay personal tax, which grows with the profit. The tax card in the bank shows both. Share capital and fee: ') + kr(TAX.as.capital + TAX.as.fee)});
    // the ocean fleet: the cheapest ocean vessel that can be bought, hull and permit (havPrice, as the buy pays it), for the fleet. It
    // stood as «Havfiske, kommer når kartet utvides vestover» until the autoliner could be bought (Havsteget H2)
    if (!hav){ const H = S.t / 60, c = Object.keys(VESSELS).filter(k => VESSELS[k].cls === 'hav' && !VESSELS[k].lock).map(k => [k, typeof havPrice === 'function' ? havPrice(k, H) : VESSELS[k].price]).sort((a, b) => a[1] - b[1])[0];
      if (c){ const x = deal(c[1], 0); steps.push({n:VESSELS[c[0]].name[S.lang], need:x.eqNeed + 5000, bank:true, a:'fartoy', price:c[1]}); } }
    // one tier between the boats (OPP4 of docs/planer/oppgraderinger.md): with one boat in the fleet, the cheapest tier not bought (the
    // knives and the gaff, later the propeller and the deck gear's tiers: the ladders marked tier) that costs under a tenth of the next
    // boat in the ladder comes before her. The yard's rebuilds and the jigging machines are not tiers here
    if (S.fleet.length === 1){ const nb = steps.findIndex(x => x.price > 0), lim = nb >= 0 ? steps[nb].price / 10 : 0;
      const c = nb >= 0 && ladders().filter(x => x.tier && x.nx && !x.nx.busy && x.nx.kr < lim).sort((a, b) => a.nx.kr - b.nx.kr)[0];
      if (c) steps.splice(nb, 0, {n:c.nx.n + ' (' + L('trinn ', 'tier ') + c.nx.lv + ')', need:c.nx.kr, a:c.pg}); }
    return steps.slice(0, 2).map(x => Object.assign(x, {pc:x.pc != null ? x.pc : Math.min(1, (x.bank ? eqCash() : Math.max(0, S.cash)) / Math.max(1, x.need))}));
  }
  function goalsCard(){
    const g = goals(); if (!g.length) return '';
    return '<div class="ph-card"><h4>' + L('Neste mål', 'Next goals') + '</h4>' + g.map(x => '<p style="margin:6px 0 2px"><b>' + x.n + '</b><br><small>' + (x.txt || (x.bank ? L('Egenkapital banken krever: ', 'Equity the bank wants: ') : L('Pris: ', 'Price: ')) + kr(x.need) + (x.bank && S.sales.length < 3 ? ' · ' + L('og tre sluttsedler', 'and three landing notes') : '')) + '</small></p><div class="qbar"><i style="width:' + (x.pc * 100).toFixed(1) + '%"></i></div>' +
      (x.a === 'papers' ? '<button class="ph-btn" data-pa="papers">' + L('Se papirene', 'See the papers') + '</button>' : x.lock || x.pc < 1 ? '' : x.a !== 'fartoy' ? '<button class="ph-btn" data-pa="open" data-a="' + x.a + '">' + (x.a === 'bank' ? L('Til banken', 'To the bank') : L('Til butikken', 'To the shop')) + '</button>' : '<button class="ph-btn" data-pa="sub" data-s="marked">' + L('Se markedet', 'See the market') + '</button>')).join('') + '</div>';
  }
  // ---- «Båten og utstyret» (OPP4 of docs/planer/oppgraderinger.md, 07.11.2026; Jonas: «én side for båten og utstyret»: «enig»): every
  // ladder of the boat you follow as one line, with dots (●●○: the step aboard of the steps there are; the first is what she has without
  // a purchase), what is aboard, and the next step with its price, where it is bought and what it does in the player's own numbers (kg an
  // hour at the table, minutes a tub or a net, knots, litres an hour). What does not suit the boat is not there (null); what is full has
  // all its dots filled. A ladder: {k, n, lv, max, cur, at:'butikk'|'verft', pg (the page it is bought on), tier, nx}; nx is the next
  // step {n, lv, kr, fx}, {busy} while it is being fitted or built, or null when full; tier marks the upgrades in tiers (OPP1–OPP3), which
  // «Neste mål» reads. The propeller (OPP3), the haulers' tiers, the line setter and the net chute (OPP2) are one entry each in LADDERS
  // (a tiered item in EQUIP gets its line from tierLad by itself)
  const pct = x => Math.round(x * 100) + ' %', fx1 = x => fmt(x, x < 10 ? 1 : 0);
  const busyOf = (kind, k) => (S.jobs || []).some(j => j.kind === kind && (k == null || j.k === k || j.u === k));
  // what a unit of passive gear takes to haul now (core/10-gear.js gopUnitMin): as if the boat hauled it here this minute, with the people
  // aboard, their strength and the cold. With nobody aboard who could, one person at full strength (live: false); pots need a hauler (NaN)
  // (once per kind for a drawing of the page: kitCard keeps them in HN while it draws)
  let HN = null;
  function haulNow(kind){
    if (HN && HN[kind]) return HN[kind];
    const r = haulNow0(kind); if (HN) HN[kind] = r; return r;
  }
  function haulNow0(kind){
    const b = S.boat, G = GEAR[kind], H = S.t / 60, hs = hsWork(b.pos, H), g = {kind, op:'haul', hooksPer:kind === 'line' ? LINE_KINDS.hyse.hooks : 0};
    if (kind === 'teine' && !hasHauler('teine')) return {m:NaN, live:false};
    const keep = [b.gop, b.status, b.deckStop]; let m = Infinity;
    try { b.gop = g; b.status = 'fishing'; b.deckStop = false; m = gopUnitMin(g, H, hs); } catch (e){ m = Infinity; } finally { [b.gop, b.status, b.deckStop] = keep; }
    if (isFinite(m)) return {m, live:true};
    return {m:(kind === 'line' ? G.haul * g.hooksPer : G.haul) * (hasHauler(kind) ? 1 : G.hand) * upgSum(kind === 'line' ? -hookX('haul') : 0) * (1 + coldPen(H, hs)), live:false};
  }
  const UNIT = {line:['min/stamp', 'min/tub'], garn:['min/garn', 'min/net'], teine:['min/teine', 'min/pot']};
  const unitTxt = (kind, m) => isFinite(m) ? fx1(m) + ' ' + L(UNIT[kind][0], UNIT[kind][1]) : L('kan ikke trekkes', 'cannot be hauled');
  // a tiered item (EQUIP tiers: the knives and the gaff, OPP1): the tier aboard, the next tier's price for this boat and its numbers
  function tierLad(k, pg, fxOf){
    const E = EQUIP[k]; if (!E || !E.tiers || !equipFits(k, S.boat.type)) return null;
    const lv = equipLv(k), T = E.tiers[lv - 1], N = E.tiers[lv];
    return {k, n:E.name[S.lang], lv, max:E.tiers.length, cur:T[S.lang], at:'butikk', pg, tier:true, nx:N ? {n:N[S.lang], lv:lv + 1, kr:tierKr(k, lv + 1), get fx(){ return fxOf(T, N); }} : null};   // (fx when the line is drawn: Neste mål reads only the price)
  }
  // an item bought once (EQUIP without tiers): the base it replaces as the first dot, the item as the second
  function oneLad(k, base, pg, fx){
    const E = EQUIP[k]; if (!E || !equipFits(k, S.boat.type)) return null; const have = !!S.equip[k], at = EQ_YARD(k) ? 'verft' : 'butikk';
    return {k, n:E.name[S.lang], lv:have ? 2 : 1, max:2, cur:have ? E.name[S.lang] : base, at, pg, nx:have ? null : busyOf('fit', k) ? {busy:true} : {n:E.name[S.lang], lv:2, kr:E.price, get fx(){ return fx(); }}};
  }
  // (the gain on a line is short, in the player's own numbers: Jonas 07.11.2026 on the first version, «Det er jo nesten umulig å skjønne
  // hva som skjer på denne siden når det er så mye tekst … Det må gjøres mer intuitivt»; the long story is on the item's card and in the
  // Håndboka)
  const LADDERS = [
    // the knives: kg an hour a person at the table (DECK.gut × the tier, knifeX)
    () => tierLad('kniv', 'fiske', (T, N) => { const kg = t => fmt(DECK.gut * 60 * upgSum(t.gut), 0); return kg(T) + ' → ' + kg(N) + L(' kg/t ved bordet', ' kg/h at the table'); }),
    // the gaff: the fish over the rail (its share of the base, crewSlip)
    () => tierLad('hott', 'fiske', (T, N) => '−' + pct(N.rail) + L(' fisk over ripa', ' fish over the rail')),
    // the jig: the hand jig as the first dot, then the machines up to what she takes (jukseMax)
    () => { const V = VESSELS[S.boat.type], mx = V.jukseMax || 0; if (!mx || !vesselJigs()) return null; const gear = !!S.boat.gear, n = Math.min(S.equip.jukse || 0, mx);
      const cur = n ? n + ' ' + L(n === 1 ? 'juksamaskin' : 'juksamaskiner', n === 1 ? 'jigging reel' : 'jigging reels') : gear ? L('Håndjuksa', 'Hand jig') : L('Ingen juksa', 'No jig');
      const nx = !gear ? {n:L('Håndjuksa', 'Hand jig'), lv:1, kr:PRICE.gear, fx:L('fisk for hånd', 'fish by hand')} : n >= mx ? null : busyOf('fit', 'jukse') ? {busy:true}
        : {n:L('Juksamaskin nr. ' + (n + 1), 'Jigging reel no. ' + (n + 1)), lv:n + 2, kr:EQUIP.jukse.price, fx:L('maskin ' + (n + 1) + ' av ' + mx + ', ' + fmt(JIG.machine / JIG.hand, 0) + '× håndjuksa', 'reel ' + (n + 1) + ' of ' + mx + ', ' + fmt(JIG.machine / JIG.hand, 0) + '× a hand jig')};
      return {k:'jukse', ic:n ? 'jukse' : 'jig', n:L('Juksa', 'Jigging'), lv:(gear ? 1 : 0) + n, max:1 + mx, cur, at:'butikk', pg:!gear ? 'fiske' : 'utstyrb', nx}; },
    // the haulers that suit her: by hand as the first dot (pots cannot be hauled by hand), the minutes a unit takes now and with it
    ...['linehaler', 'garnhaler', 'teinehaler'].map(h => () => { const V = VESSELS[S.boat.type], kind = {linehaler:'line', garnhaler:'garn', teinehaler:'teine'}[h];
      if (!V.haulers.includes(h)) return null; if (EQUIP[h].tiers) return tierLad(h, 'utstyrb', () => '');
      return oneLad(h, kind === 'teine' ? L('Ingen haler', 'No hauler') : L('For hånd', 'By hand'), 'utstyrb', () => { const now = haulNow(kind).m, H = S.t / 60;
        const with1 = isFinite(now) ? now / GEAR[kind].hand : GEAR[kind].haul * (1 + coldPen(H, hsWork(S.boat.pos, H)));   // (pots: one at the hauler at full strength)
        return (isFinite(now) ? fx1(now) + ' → ' : L('trekker teiner, ', 'hauls pots, ')) + unitTxt(kind, with1); }); }),
    // the engine: the yard's two steps (ENGUP), the top speed without trim; an outboard has the 90 hp outboard instead
    () => { const b = S.boat, V = VESSELS[b.type];
      if (V.outboard){ const x = oneLad('motor90', V.engine[S.lang], 'utstyr', () => fmt(V.vmax, 1) + ' → ' + fmt(EQUIP.motor90.boost.vmax, 0) + ' kn'); if (x) x.n = L('Motor', 'Engine'); return x; }
      const vAt = P => V.vmax * speedOfPower(P, V.planing), lv = b.engLv || 0, st = ENGUP[lv], P0 = powerX(b), P1 = st ? 1 + st.p : P0;
      return {k:'motor', n:L('Motor', 'Engine'), lv:1 + lv, max:1 + ENGUP.length, cur:Math.round(V.hp * P0) + ' hk', at:'verft', pg:'utstyr',
        nx:!st ? null : busyOf('eng') ? {busy:true} : {n:Math.round(V.hp * P1) + ' hk', lv:lv + 2, kr:upPrice(st.pc, st.min), fx:fmt(vAt(P0), 1) + ' → ' + fmt(vAt(P1), 1) + ' kn'}}; },
    // the hold (HOLDUP), or an open boat's tubs (core/07f-kar.js); not the ocean fleet's tanks
    () => { const b = S.boat, V = VESSELS[b.type]; if (V.cls === 'hav') return null; const lv = b.holdLv || 0, steps = karSteps(b.type), st = lv < steps ? HOLDUP[lv] : null, kar = !!V.kar;
      const kg = l => kar ? karN(b.type, l) * TUB_KG : Math.round(V.holdCap * (l ? HOLDUP[l - 1].x : 1));
      return {k:'hold', n:kar ? L('Fiskekar', 'Fish tubs') : L('Lasterom', 'Hold'), lv:1 + lv, max:1 + steps, cur:fmt(kg(lv), 0) + ' kg', at:'verft', pg:'utstyr',
        nx:!st ? null : busyOf('hold') ? {busy:true} : {n:fmt(kg(lv + 1), 0) + ' kg', lv:lv + 2, kr:upPrice(st.pc, st.min), fx:fmt(kg(lv), 0) + ' → ' + fmt(kg(lv + 1), 0) + ' kg'}}; },
    // the yard's other rebuilds (UPGS) that suit her, step by step
    ...Object.keys(UPGS).map(u => () => { const b = S.boat, V = VESSELS[b.type], U = UPGS[u]; if (!U.fit(V)) return null;
      const all = U.steps.filter(st => !st.minLen || V.len >= st.minLen), lv = Math.min(upgLv(b, u), all.length), cur = lv ? U.steps[lv - 1] : null, st = upgNext(b, u);
      const fx = {cabin:s => '−' + pct(1 - s.fat) + L(' trøtthet', ' tiredness'), galley:s => L('måltid på ' + s.cook + ' min', 'meals in ' + s.cook + ' min'), dry:s => '−' + pct(1 - s.cold) + L(' kulde', ' cold'),
        insul:s => '−' + pct(1 - s.ice) + L(' is', ' ice'), tank:s => fmt(V.fuelCap * (cur ? cur.x : 1), 0) + ' → ' + fmt(V.fuelCap * s.x, 0) + ' L', stab:s => '−' + pct(1 - s.sea) + L(' fartstap i sjø', ' speed lost in a sea'),
        gut:s => fmt(s.gut, 0) + L(' kg/t sløying', ' kg/h gutting'), ice:s => fmt(s.maker, 0) + L(' kg is i døgnet', ' kg of ice a day')}[u];
      return {k:u, n:U[S.lang], lv:1 + lv, max:1 + all.length, cur:cur ? cur[S.lang] : L('Som levert', 'As delivered'), at:'verft', pg:'utstyr',
        nx:!st ? null : busyOf('upg', u) ? {busy:true} : {n:st[S.lang], lv:lv + 2, kr:upPrice(st.pc, st.min), fx:fx ? fx(st) : ''}}; }),
    // the sounder: the basic one every boat has, the CHIRP, and the sonar where it fits (from 10 m)
    () => { const t = S.boat.type, son = equipFits('sonar', t), have = ['chirp', 'sonar'].filter(k => S.equip[k] && equipFits(k, t)), next = ['chirp'].concat(son ? ['sonar'] : []).find(k => !S.equip[k]);
      const FX = {chirp:L('ser fisken 0,75 nm rundt', 'sees the fish 0.75 nm around'), sonar:L('ser fisken 1,5 nm rundt', 'sees the fish 1.5 nm around')};
      return {k:'ekko', ic:have.includes('sonar') || next === 'sonar' ? 'sonar' : 'chirp', n:L('Ekkolodd', 'Sounder'), lv:1 + have.length, max:son ? 3 : 2, cur:have.length ? have.map(k => EQUIP[k].name[S.lang]).join(' + ') : L('Enkelt ekkolodd', 'Basic sounder'), at:'butikk', pg:'utstyrb',
        nx:!next ? null : busyOf('fit', next) ? {busy:true} : {n:EQUIP[next].name[S.lang], lv:2 + have.length, kr:EQUIP[next].price, fx:FX[next]}}; },
    // the antifouling coat (the yard): the hull fouls three times as slowly (core/03-simulation.js foulHour)
    () => { const x = oneLad('antigro', L('Uten bunnstoff', 'No bottom paint'), 'utstyr', () => L('gror 3× saktere', 'fouls 3× slower')); if (x) x.n = L('Bunnstoff', 'Bottom paint'); return x; }
  ];
  // (a ladder of one step, such as a wooden boat's one tub that cannot be more, has nothing to buy and does not stand)
  function ladders(){ const out = []; for (const f of LADDERS){ const x = f(); if (x && x.max > 1) out.push(x); } return out; }
  // the pictures: the item cards' (ui/05a-itemcard.js ICPIC) where there is one, and a few small ones here for the yard's rebuilds
  const BU_IC = {
    motor:'<rect x="16" y="12" width="30" height="18" rx="3" fill="' + IC_C.mid + '"/><path d="M20 12V7h6v5M30 12V7h6v5M46 18h6v6h-6" fill="' + IC_C.soft + '"/><circle cx="24" cy="21" r="3" fill="#fff"/><circle cx="36" cy="21" r="3" fill="#fff"/>' + IC_DECK,
    hold:'<path d="M10 14h44v18H10z" fill="#fff"/><path d="M10 14l6-6h32l6 6"/><path d="M20 23c4-4 10-4 14 0-4 4-10 4-14 0zM34 23l5-3v6z" fill="' + IC_C.blu + '"/>' + IC_DECK,
    cabin:'<path d="M10 16h44v6H10zM10 28h44v6H10z" fill="' + IC_C.soft + '"/><path d="M10 10v26M54 10v26"/><rect x="12" y="13" width="10" height="3" rx="1.5" fill="#fff"/>',
    galley:'<path d="M18 18h28v12a6 6 0 0 1-6 6H24a6 6 0 0 1-6-6z" fill="' + IC_C.mid + '"/><path d="M14 18h36M26 8c-2 3 2 4 0 7M34 8c-2 3 2 4 0 7" stroke="' + IC_C.soft + '"/>',
    dry:'<path d="M14 10h36"/><path d="M22 10l-6 6 3 4 3-2v14h12V18l3 2 3-4-6-6" fill="' + IC_C.yel + '"/><path d="M44 22c3 2 3 5 0 7M50 20c4 3 4 8 0 11" stroke="' + IC_C.red + '"/>',
    insul:'<path d="M12 12h40v22H12z" fill="#fff"/><path d="M16 16h32v14H16z" fill="' + IC_C.ice + '"/><path d="M26 20l3 3-3 3M34 20l3 3-3 3" stroke="' + IC_C.blu + '"/>',
    tank:'<rect x="18" y="8" width="28" height="28" rx="4" fill="' + IC_C.soft + '"/><path d="M18 22h28v10a4 4 0 0 1-4 4H22a4 4 0 0 1-4-4z" fill="' + IC_C.org + '"/><path d="M46 14h6v8"/>',
    stab:'<path d="M8 28c6-6 12-6 18 0s12 6 18 0 8-4 12-2" stroke="' + IC_C.blu + '"/><path d="M16 22h32l-4-10H20z" fill="#fff"/><path d="M32 22v8M28 30h8" />',
    gut:'<rect x="12" y="14" width="40" height="16" rx="3" fill="' + IC_C.soft + '"/><circle cx="22" cy="22" r="4" fill="#fff"/><circle cx="42" cy="22" r="4" fill="#fff"/><path d="M26 22h12" stroke="' + IC_C.red + '"/>' + IC_DECK,
    ice:'<path d="M14 20h36v14H14z" fill="' + IC_C.ice + '"/><path d="M32 6v10M27 8l5 4 5-4M24 26l4-3 4 3 4-3 4 3" stroke="' + IC_C.blu + '"/>'};
  const buPic = x => { const k = x.ic || x.k; return BU_IC[k] ? icSvg(BU_IC[k]) : ICPIC[k] ? ICPIC[k] : ICPIC.box; };
  const AT = {butikk:['Utstyrsbutikken', 'The tackle shop'], verft:['Verftet', 'The yard']};
  const dots = x => '<span class="bu-d" aria-label="' + L('trinn ' + x.lv + ' av ' + x.max, 'step ' + x.lv + ' of ' + x.max) + '">' + '●'.repeat(Math.max(0, x.lv)) + '<i>' + '○'.repeat(Math.max(0, x.max - x.lv)) + '</i></span>';
  function kitCard(){ HN = {}; try { return kitCard0(); } finally { HN = null; } }
  function kitCard0(){
    const Ls = ladders(), b = S.boat; if (!Ls.length) return '';
    const got = Ls.reduce((a, x) => a + Math.max(0, x.lv), 0), all = Ls.reduce((a, x) => a + x.max, 0);
    const h = ['<div class="ph-card bu-card"><div class="bu-h"><h4>' + L('Båten og utstyret', 'The boat and her gear') + '</h4><button type="button" class="bu-q" data-pa="open" data-a="handbok" data-hbid="lex_oppgrad" aria-label="' + L('Slik leser du siden', 'How to read the page') + '">?</button></div>' +
      '<div class="bu-sum"><span>«' + S.boatName + '»</span><span>' + got + L(' av ', ' of ') + all + L(' trinn', ' steps') + '</span></div><div class="qbar"><i style="width:' + (got / Math.max(1, all) * 100).toFixed(0) + '%"></i></div>'];
    // what can be bought first, the cheapest at the top; then what is on its way; what is full last
    const rank = x => !x.nx ? 2e12 : x.nx.busy ? 1e12 : x.nx.kr;
    for (const at of ['butikk', 'verft']){ const G = Ls.filter(x => x.at === at).sort((a, c) => rank(a) - rank(c)), A = AT[at]; if (!G.length) continue;
      // where it is bought: here, or the nearest with Autonav there (core/06c-steder.js placesNear)
      const here = atKind(at), n = here ? null : placesNear(b.pos, at, 1)[0];
      h.push('<div class="bu-at" data-at="' + at + '"><b>' + L(A[0], A[1]) + '</b><span>' + (here ? L('Du er her', 'You are here') : n ? L('Nærmeste: ', 'Nearest: ') + n.pt.name + ' · ' + fmt(n.d / NM, 1) + ' nm' : '–') + '</span>' +
        (!here && n ? '<button class="ph-btn alt" data-pa="goplace" data-id="' + n.pt.id + '">' + L('Autonav dit', 'Autonav there') + '</button>' : '') + '</div>');
      for (const x of G){ const nx = x.nx;
        // the price: at the place a button to the page it is bought on, away only the price; on its way, or full with a tick
        const pr = !nx ? '<span class="bu-pr ok" aria-label="' + L('Fullt', 'Full') + '">✓</span>' : nx.busy ? '<span class="bu-pr off">' + (at === 'verft' ? L('På verftet', 'At the yard') : L('Monteres', 'Being fitted')) + '</span>'
          : here ? '<button class="bu-pr' + (nx.kr > spendable() ? ' dim' : '') + '" data-pa="open" data-a="' + x.pg + '">' + kr(nx.kr) + '</button>' : '<span class="bu-pr off">' + kr(nx.kr) + '</span>';
        h.push('<div class="bu-l' + (nx ? '' : ' full') + '" data-lad="' + x.k + '" data-lv="' + x.lv + '" data-max="' + x.max + '"><div class="bu-ic">' + buPic(x) + '</div><div class="bu-tx"><div class="bu-n"><b>' + x.n + '</b>' + dots(x) + '</div><small>' +
          (!nx ? x.cur : nx.busy ? nx.n || x.cur : nx.fx || nx.n) + '</small></div>' + pr + '</div>'); }
    }
    // the waste and the time, as numbers before a purchase: the fish lost over the rail this week on this boat (core/14-crewlife.js railWeek;
    // the company's in all, S.stats.lostRail, under it), and the minutes a tub of line takes to haul today (gopUnitMin)
    const R = (S.stats || {}).lostRail, wk = railWeek(), V = VESSELS[b.type], tiles = [];
    if (equipFits('hott', b.type)) tiles.push('<div data-num="rail"><b>' + wk.n + ' ' + L('fisk', 'fish') + '</b><span>' + L('tapt over ripa denne uka', 'lost over the rail this week') + (R && R.n > wk.n ? L(' · ' + R.n + ' i alt', ' · ' + R.n + ' in all') : '') + '</span></div>');
    if (V.cls !== 'hav' && V.rigs.includes('line')){ const u = haulNow('line'); tiles.push('<div data-num="line"><b>' + (isFinite(u.m) ? fx1(u.m) + ' min' : '–') + '</b><span>' + L('per stamp line i dag', 'a tub of line today') + (isFinite(u.m) && !u.live ? L(' (én person)', ' (one person)') : '') + '</span></div>'); }
    if (tiles.length) h.push('<div class="bu-num">' + tiles.join('') + '</div>');
    h.push('</div>'); return h.join('');
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
    const V = VESSELS[k], price = O ? V.price + licValue(O) : V.cls === 'hav' && typeof havPrice === 'function' ? havPrice(k, S.t / 60) : V.price, mine = S.boat.type === k && !O, tag = V.lock ? L('kommer', 'coming') : O ? O.hl : V.isNew ? L('nybygg', 'new build') : L('brukt', 'used');
    return '<button class="ph-card vcard' + (mine ? ' mine' : '') + '" data-pa="mksel" data-k="' + k + '"' + (O ? ' data-o="' + O.k + '"' : '') + '><span class="vpic">' + vesselSVG(k) + '</span><span class="vtx"><b>' + (O ? O[S.lang] : V.name[S.lang]) + '</b><small>' + fmt(V.len, 2) + ' × ' + fmt(V.beam, 1) + ' × ' + fmt(V.draft, 1) + ' m · ' + tn(V.holdCap) + '</small><span class="vpr">' + kr(price) + ' <i>' + tag + '</i></span></span></button>';
  }
  function market(){
    const tab = sub.marked || 'open', h = [];
    if (mkSel) return sheet(mkSel.k, mkSel.o ? LIC_OFFERS.find(x => x.k === mkSel.o) : null);
    if (mbPutSel){ const v = vesselById(mbPutSel); if (v) return mbForm(v).replace(/^<div class="ph-c">/, '<div>'); mbPutSel = null; }   // «Legg ut til salgs» from the yard (B1)
    if (mgSel){ const Lx = MBC.byId(mgSel); if (Lx) return mgSheet(Lx).replace(/^<div class="ph-c">/, '<div>'); }   // a used boat opened from «Båter til salgs her» (M4, B)
    h.push(mgHere());
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
      h.push('<p class="ph-note">' + L('Havfiskefartøy fra 28 m. Hver båt trenger en tillatelse med kvotefaktorer, og den følger med båten til kvotens verdi. Autolineren kan kjøpes; de som er merket «kommer», kan ses, men ikke kjøpes ennå. Tillatelsene og kvotene står i Kvote-appen under Marked.', 'Ocean vessels from 28 m. Each needs a permit with quota factors, and it comes with the vessel at the quota\'s value. The autoliner can be bought; those marked «coming» can be looked at, but not bought yet. The permits and quotas are in the Quota app under Market.') + '</p>');
      for (const [k, V] of Object.entries(VESSELS)) if (V.cls === 'hav') h.push(mkCard(k));
    }
    if (!atKind('verft')) h.push('<p class="ph-note">' + L('Båter kjøpes og selges på verftet.', 'Vessels are bought and sold at the yard.') + '</p>' + nearHint('verft'));
    return h.join('');
  }
  // the spec sheet: eight sections with the same rows for every boat (Jonas 17.10.2026, docs/batplan.md del 5). A row that does not
  // apply says «ingen», «–» or «ikke på denne båten»; it is never left out, so two boats side by side read alike
  const NOTHERE = () => L('ikke på denne båten', 'not on this boat');
  function specSecs(k, O){
    const V = VESSELS[k], price = O ? V.price + licValue(O) : V.cls === 'hav' && typeof havPrice === 'function' ? havPrice(k, S.t / 60) : V.price, no = L('ingen', 'none'), ja = L('ja', 'yes'), yn = x => x ? ja : L('nei', 'no'), upto = n => n ? L('inntil ', 'up to ') + fmt(n, 0) : no, nm = q => EQUIP[q].name[S.lang];
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
    const V = VESSELS[k], bn = '«' + S.boatName + '»', ti = tradeIn(), free = atKind('verft') && !S.order, price = O ? V.price + licValue(O) : V.cls === 'hav' && typeof havPrice === 'function' ? havPrice(k, S.t / 60) : V.price, mine = S.boat.type === k && !O, h = [];
    const sec = (t, rows) => '<div class="vsec"><h5>' + t + '</h5>' + rows.filter(Boolean).join('') + '</div>';
    h.push('<button class="ph-btn alt mkback" data-pa="mksel">‹ ' + L('Tilbake til listen', 'Back to the list') + '</button>');
    h.push('<div class="ph-card vsheet"><h4>' + (O ? O[S.lang] : V.name[S.lang]) + '</h4><div class="vbig">' + vesselSVG(k) + '</div><p>' + V.desc[S.lang] + '</p>');
    const secs = specSecs(k, O); h.push(sec(secs[0][0], secs[0][1]));
    if (O){ const yearly = Math.round(O.cod * avgPrice('torsk', S.t / 60, 7) / 1000) * 1000;
      h.push(sec(L('Hjemmel', 'Right'), [kv(L('Hjemmelslengde', 'Quota length'), O.hl), kv(L('Faktisk lengde', 'Actual length'), fmt(V.len, 2) + ' m'), kv(L('Torsk, fartøykvote', 'Cod, vessel quota'), fmt(O.cod / 1000, 3) + ' t'), kv(L('Hyse, maks / garantert', 'Haddock, max / guaranteed'), tq(O.hyse[0], 1) + ' / ' + tq(O.hyse[1], 1)),
        kv(L('Sei, maks / garantert', 'Saithe, max / guaranteed'), tq(O.sei[0], 1) + ' / ' + tq(O.sei[1], 1)), kv(L('Kvotepris', 'Quota price'), O.kpk + ' kr/kg · ' + kr(licValue(O))), kv(L('Torsk per år', 'Cod a year'), L('ca. ', 'about ') + kr(yearly))])); }
    // an ocean vessel: the permit that comes with her, its vessel quota this year and how many the register has left (H1 of the ocean step)
    const hid = V.cls === 'hav' && typeof havLicFor === 'function' ? havLicFor(k) : null;
    if (hid){ const P = HAVLIC[hid], O = havOffer(hid, S.t / 60), Q = havQ(O), y = yearH(S.t / 60), G = havGroup(hid, y), t1 = n => n === Infinity ? L('ingen fartøykvote', 'no vessel quota') : fmt(n / 1000, 0) + ' t', NM = {torsk:['Torsk', 'Cod'], hyse:['Hyse', 'Haddock'], sei:['Sei', 'Saithe'], sild:['NVG-sild', 'NVG herring'], snokrabbe:['Snøkrabbe', 'Snow crab']};
      // (H3a) the snow crab permit: the same vessel quota for all (no quota factor), the extra quota for live crab, and its value by what the
      // fishery bears (snoLicValue)
      const SY = hid === 'krab' ? snoYear(y) : null, SV = SY ? snoLicValue(y) : null;
      h.push(sec(L('Tillatelse', 'Permit'), [kv(L('Tillatelse', 'Permit'), L(P.no, P.en)), kv(L('Selger', 'Seller'), O.from), P.flat ? kv(L('Kvote', 'Quota'), L('lik for alle ' + HREG[hid] + ' tillatelsene', 'the same for all ' + HREG[hid] + ' permits')) : kv(L('Kvotefaktor', 'Quota factor'), fmt(O.kf, 2) + ' · ' + L('snittet ', 'the mean ') + fmt(HAVKF[hid], 2)),
        ...Object.keys(P.q26).map(sp => kv(L(NM[sp][0], NM[sp][1]) + ' ' + y, t1(Array.isArray(Q[sp]) ? Q[sp][0] : Q[sp]) + ' · ' + L('gruppa ', 'the group ') + fmt(G[sp], 0) + ' t')),
        ...(SY ? [kv(L('Tilleggskvote for levende', 'Extra quota for live crab'), fmt(SY.tq, 0) + ' t'), kv(L('Kvotefleks', 'Quota flexibility'), SY.flex ? L('inntil ', 'up to ') + Math.round(SY.flex * 100) + L(' % til neste år', '% to the next year') : L('ingen på fartøynivå', 'none for the vessel'))] : []),
        SV ? kv(L('Tillatelsens verdi', 'The permit\'s value'), kr(SV.v) + ' · ' + L('driftsresultat før avskrivninger ', 'earnings before depreciation ') + fmt(SV.ebitda, 1) + L(' MNOK i året × ' + SNOV.yrs + ' år', ' MNOK a year × ' + SNOV.yrs + ' years')) : kv(L('Kvoteverdi', 'Quota value'), kr(havValue(O)) + ' · ' + L('skroget ', 'the hull ') + kr(V.price)),
        kv(L('Ledige i registeret', 'Left in the register'), fmt(npcReg()[hid] || 0, 0) + ' ' + L('av', 'of') + ' ' + HREG[hid]), kv(L('Kilde', 'Source'), P.src)])); }
    for (const [t, rows] of secs.slice(1)) h.push(sec(t, rows));
    // buying
    if (V.lock) h.push('<p class="ph-note">' + (hid ? L('Kan ikke kjøpes ennå. Prisen er skroget og kvotene: ' + HAVLIC[hid].no.toLowerCase() + ' med kvotefaktorene til selgeren følger med båten. Det krever blad B.', 'Cannot be bought yet. The price is the hull and the quotas: the ' + HAVLIC[hid].en.toLowerCase() + ' with the seller\'s quota factors comes with her. It needs blad B.') : L('Kan ikke kjøpes ennå.', 'Cannot be bought yet.')) + '</p>');
    else if (hid && !mine && havLicWhy(k)) h.push('<p class="ph-note"><b>' + L(havLicWhy(k)[0], havLicWhy(k)[1]) + '</b></p>');
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
    // (an ocean vessel's price is the hull and the permit, havPrice, as the buy itself pays it; the hull alone was shown before, H2e 06.11.2026)
    else { const A = deal(price, ti), B = deal(price, 0), verb = V.isNew ? L('Bestill', 'Order') : L('Kjøp', 'Buy'), openOnly = V.len < 11 && !hasLic();
      h.push(payNote(A, 'Mellomlegg med ' + bn + ' i bytte: ', 'To pay with ' + bn + ' traded in: ') + '<button class="ph-btn p" data-pa="buy" data-ti="1" data-k="' + k + '"' + (A.ok && free && !tiLocked(curVessel()) ? '' : ' disabled') + '>' + verb + L(' og bytt inn ' + bn, ', trading in ' + bn) + '</button>');
      { const lv = swapLeaves(k); if (lv.length) h.push('<p class="ph-note">' + L('Ved innbytte passer ikke dette utstyret den nye båten. Det følger med ' + bn + ' og betales ikke: ', 'With the trade-in this equipment does not suit the new vessel. It goes with ' + bn + ' and is not paid for: ') + lv.map(q => L(EQUIP[q].name.no, EQUIP[q].name.en)).join(', ') + '.</p>'); }
      // (the tiers bought are the boat's and go with her; the new one has tier 1, OPP4)
      { const tl = swapTiers(); if (tl.length) h.push('<p class="ph-note" data-swaptier="' + tl.join(',') + '">' + L('Trinnene er båtens og følger med ' + bn + ' ved innbytte: ', 'The tiers are the boat\'s and go with ' + bn + ' at the trade-in: ') + tl.map(q => L(EQUIP[q].name.no + ' trinn ' + equipLv(q), EQUIP[q].name.en + ' tier ' + equipLv(q))).join(', ') + L('. De regnes ikke i innbytteprisen, og den nye har trinn 1.', '. They are not counted in the trade-in price, and the new one has tier 1.') + '</p>'); }
      if (openOnly) h.push('<p class="ph-note">' + L('Til flåten: et rederi kan bare ha én båt i åpen gruppe. Kjøp heller en båt med hjemmel, eller bytt inn ' + bn + '.', 'For the fleet: a company can only have one boat in the open group. Buy a boat with a right instead, or trade in ' + bn + '.') + '</p>');
      else h.push(payNote(B, 'Til flåten, uten innbytte: ', 'For the fleet, no trade-in: ') + '<button class="ph-btn" data-pa="buy" data-ti="0" data-k="' + k + '"' + (B.ok && free ? '' : ' disabled') + '>' + verb + L(' til flåten', ' for the fleet') + '</button>' + (hid ? '<p class="ph-note">' + L('Prisen er skroget og kvotene: ' + HAVLIC[hid].no.toLowerCase() + ' med kvotefaktorene til selgeren følger med båten, og hun fisker på fartøykvoten.', 'The price is the hull and the quotas: the ' + HAVLIC[hid].en.toLowerCase() + ' with the seller\'s quota factors comes with her, and she fishes on the vessel quota.') + '</p>' : V.len >= 11 || hasLic() ? '<p class="ph-note">' + L('Uten hjemmel kan hun bare ta torsk, hyse og sei som bifangst.', 'Without a right she can only take cod, haddock and saithe as bycatch.') + '</p>' : '')); }
    // the admin can take any vessel into the fleet for free, the locked ocean fleet too, anywhere, to test her (Jonas 30.10.2026)
    if (typeof adminOk === 'function' && adminOk()) h.push('<button class="ph-btn alt" data-pa="adminbuy" data-k="' + k + '">' + L('Admin: ta gratis til flåten', 'Admin: take into the fleet for free') + '</button>');
    if (vesselSpec(k)) h.push('<button class="ph-btn alt" data-pa="mk3d" data-k="' + k + '">' + L('Se båten i 3D', 'See her in 3D') + '</button>');
    h.push('</div>'); return h.join('');
  }
  // tab0: one tab without the tab row (the boat market in the yard, the boat in the inventory)
  function fartoy(tab0){
    const b = S.boat, V = VESSELS[b.type], s0 = tab0 || sub.fartoy || 'min', h = [tab0 ? '' : subs('fartoy', [['min', 'Min båt', 'My vessel'], ['marked', 'Marked', 'Market']]), '<div class="ph-c">' + (tab0 === 'min' ? '' : goalsCard())];
    if (s0 === 'min'){
      h.push(kitCard());   // «Båten og utstyret» first (OPP4)
      h.push('<div class="ph-card"><h4>«' + S.boatName + '»' + (meAboard() ? ' ⚓' : '') + '</h4><p class="ph-note">' + L('Adgang: ', 'Access: ') + accessText(curVessel()) + '</p>' + (S.fleet.length > 1 ? '<button class="ph-btn alt" data-pa="open" data-a="rederi">' + L('Hele flåten i Rederi-appen', 'The whole fleet in the Company app') + '</button>' : '') + '</div>');
      const svcLeft = V.svcH - ((b.engH || 0) - (b.svcAt || 0)), svcPct = clamp(1 - svcLeft / V.svcH, 0, 1), cls = svcPct > 0.9 ? 'bad' : svcPct > 0.7 ? 'warn' : '';
      const bar = (a, c, k) => '<div class="ph-bar"><i class="' + (k || '') + '" style="width:' + Math.round(clamp(a / c, 0, 1) * 100) + '%"></i></div>';
      const sec = (t, rows) => '<div class="vsec"><h5>' + t + '</h5>' + rows.filter(Boolean).join('') + '</div>';
      h.push('<div class="ph-card vsheet"><h4>' + V.name[S.lang] + '</h4>' + (minSheet ? specSecs(b.type).map(([t, rows]) => sec(t, rows)).join('') :
        kv(L('Lengde', 'Length'), fmt(V.len, 2) + ' m') + kv(L('Toppfart', 'Top speed'), fmt(BOAT.vmax, 1) + ' kn') + kv(L('Tåler', 'Handles'), L('bølger til ', 'waves up to ') + fmt(BOAT.risk[0], 1) + ' m ' + L('trygt', 'safely'))) + '<button class="ph-btn alt" data-pa="minsheet">' + (minSheet ? L('Skjul databladet', 'Hide the spec sheet') : L('Hele databladet', 'The whole spec sheet')) + '</button></div>');
      const HF = holdFmt();
      h.push('<div class="ph-card"><h4>Status</h4>' + kv(L('Drivstoff', 'Fuel'), fmt(b.fuel, 0) + ' / ' + BOAT.fuelCap + ' L') + bar(b.fuel, BOAT.fuelCap, b.fuel < BOAT.fuelCap * 0.2 ? 'bad' : '') + (BOAT.iceCap > 0 ? kv(L('Is', 'Ice'), fmt(b.ice, 0) + ' / ' + BOAT.iceCap + ' kg') + bar(b.ice, BOAT.iceCap) : '') + (HF.fz ? kv(L('Last', 'Hold'), HF.txt + ' ' + L('produkt', 'product')) + bar(HF.load, BOAT.holdCap) + kv(L('Rund vekt', 'Round weight'), HF.rnd) : kv(L('Last', 'Hold'), fmt(holdTotal(), 0) + ' / ' + BOAT.holdCap + ' kg') + bar(holdTotal(), BOAT.holdCap)) +
        (snoTanks() ? kv(L('Tankene', 'The tanks'), fmt(tankLoad() / 1000, 1) + ' / ' + fmt(tankCap() / 1000, 0) + ' t ' + L('levende', 'live')) + bar(tankLoad(), tankCap()) : '') +   // (the live snow crab, H3b)
        kv(L('Motortimer', 'Engine hours'), fmt(b.engH || 0, 0) + ' t') + kv(L('Neste service', 'Next service'), svcLeft > 0 ? L('om ', 'in ') + fmt(svcLeft, 0) + ' t' : '<span class="r2">' + L('forfalt', 'overdue') + '</span>') + bar(svcPct, 1, cls) +
        (vesselJigs() ? kv(L('Juksa', 'Jig line'), b.gear ? L('i orden', 'fine') : '<span class="r2">' + L('ingen, kjøp juksa i butikken', 'none, buy a jig in the shop') + '</span>') : '') + '<button class="ph-btn" data-pa="open" data-a="verksted">' + L('Til verkstedet', 'To the workshop') + '</button></div>');
      // an ocean vessel's trip (H2b, 04-crew.js tripLeft): how long she has been out, and the days each of the fuel, the bait, the hooks
      // and the hold last at the trip's pace so far
      if (BOAT.cls === 'hav'){ const R = tripLeft(b), pg = S.pgear, dd = v => v == null ? '–' : !isFinite(v) || v > 99 ? L('over 99 døgn', 'over 99 days') : fmt(v, v < 10 ? 1 : 0) + L(' døgn', ' days'), wc = v => v != null && v < TRIPX.warn ? ' class="r2"' : '';
        const row = (k, lbl, v, extra) => '<div class="ph-kv"><span>' + lbl + '</span><span' + wc(v) + '>' + (extra ? extra + ' · ' : '') + dd(v) + '</span></div>';
        // (H3b) the snow crab vessel: live or frozen for the trip, the bait for the pots, the tanks and how long the crab has been in them
        const sno = snoVessel(), lv = snoLive(), mode = sno && snoTanks() ? '<div class="ph-row2"><button class="ph-btn' + (lv ? ' alt' : '') + '" data-pa="snomode" data-m="frys">' + L('Fryste klør', 'Frozen clusters') + (lv ? '' : ' ✓') + '</button><button class="ph-btn' + (lv ? '' : ' alt') + '" data-pa="snomode" data-m="lev">' + L('Levende krabbe', 'Live crab') + (lv ? ' ✓' : '') + '</button></div>' : '';
        const tankRows = sno && (lv || R.tankAge != null) ? (lv ? row('tank', L('Plass i tankene', 'Room in the tanks'), R.tank, fmt(tankLoad() / 1000, 1) + ' / ' + fmt(tankCap() / 1000, 0) + ' t') : '') + (R.tankAge != null ? kv(L('Eldste krabbe i tankene', 'Oldest crab in the tanks'), dd(R.tankAge) + (R.tankDead > 1 ? ' · ' + fmt(R.tankDead, 0) + L(' kg døde', ' kg dead') : '')) : '') : '';
        h.push('<div class="ph-card"><h4>' + L('Turen', 'The trip') + '</h4>' + mode + (b.status !== 'port' ? kv(L('Ute', 'At sea'), dd(R.d)) : '') +
          (R.prov != null ? row('prov', L('Proviant', 'Provisions'), R.prov) : '') + row('fuel', L('Drivstoff til fisket', 'Fuel for the fishing'), R.fuel) + (R.bait != null ? row('bait', L('Agn', 'Bait'), R.bait, fmt(baitKg(pg) / 1000, 1) + ' t') + (R.hooks != null ? row('hooks', L('Kroker til krokbyttet', 'Hooks for the hook change'), R.hooks, fmt(pg.hooks || 0, 0)) : '') : '') +
          tankRows + row('hold', L('Plass i lasterommet', 'Room in the hold'), R.hold) + (R.home ? kv(L('Nærmeste mottak', 'Nearest plant'), R.home.pt.name + ' · ' + dd(R.home.days)) : '') +
          '<p class="ph-note">' + L('Døgnene er regnet etter turen så langt, og drivstoffet holder av det som trengs for å gå til mottaket. Provianten fylles for ' + provDays() + ' døgn når båten går fra kai. ' + (sno ? 'En tur med fryste klør varer gjerne om lag 20 døgn, og en med levende krabbe 8–9 døgn: krabben holder seg best om den leveres to–tre døgn etter siste trekk. Bare levende krabbe går på tilleggskvoten.' : 'En tur med autoline varer gjerne 6–7 uker.'),
            'The days are reckoned by the trip so far, and the fuel keeps back what she needs to steam to the plant. The provisions are filled for ' + provDays() + ' days when she casts off. ' + (sno ? 'A trip with frozen clusters usually lasts about 20 days, and one with live crab 8–9 days: the crab keeps best when it is landed two or three days after the last haul. Only live crab goes on the extra quota.' : 'An autoline trip usually lasts 6–7 weeks.')) + '</p></div>'); }
      // the echo sounder and the sonar say when they are switched off on the chart plotter
      const off = k => (k === 'chirp' && S.settings.echo === false) || (k === 'sonar' && S.settings.sonar === false) ? L(' (av)', ' (off)') : '';
      const eq = Object.keys(EQUIP).filter(k => EQUIP[k].multi ? S.equip[k] > 0 : S.equip[k]).map(k => EQUIP[k].name[S.lang] + (EQUIP[k].multi ? ' × ' + S.equip[k] : EQUIP[k].tiers ? ' (' + L('trinn ', 'tier ') + equipLv(k) + ')' : '') + off(k));
      h.push('<div class="ph-card"><h4>' + L('Utstyr om bord', 'Equipment on board') + '</h4><p>' + ['GPS'].concat(S.equip.chirp ? [] : [L('Enkelt ekkolodd', 'Basic sounder') + (S.settings.echo === false ? L(' (av)', ' (off)') : '')]).concat(eq).join(', ') + '</p><h4 style="margin-top:8px">' + L('Mannskap', 'Crew') + '</h4><p>' + (lagOf() ? (meAboard() ? L('Deg (skipper) og ', 'You (skipper) and ') : '') + L('skift ', 'crew ') + lagShName(lagOf().on) + ' · ' + lagN() + L(' mann', ' men') : [L('Deg (skipper)', 'You (skipper)')].concat(S.crew.map(c => c.name)).join(', ') + ' · ' + L('plass til ', 'room for ') + (V.crewMax + 1)) + '</p></div>');
      if (S.order) h.push('<div class="ph-card"><h4>' + L('Bestilt', 'On order') + '</h4><p>' + VESSELS[S.order.type].name[S.lang] + '</p>' + '<p class="ph-note">' + L('Byttes så snart båten den skal erstatte, ligger i havn.', 'Swapped as soon as the vessel it replaces lies in port.') + '</p></div>');
    } else h.push(market());
    h.push('</div>'); return h.join('');
  }
  // --- the company: the fleet at a glance and what needs you. The vessel apps work on the vessel picked at the top (default: the one you follow)
