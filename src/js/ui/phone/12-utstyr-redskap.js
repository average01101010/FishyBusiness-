  // the yard's upgrades (hold, engine, the antifouling coat and the outboard) or the shop's (electronics, haulers, the jigging machine and the clothes)
  function utstyr(mode){
    mode = mode || 'verft'; const yardEq = EQ_YARD;
    const h = ['<div class="ph-c"><p class="ph-note">' + L('Montering skjer i havn og tar ', 'Fitting is done in port and takes ') + durBoth(YARD_H * 60) + '.' + ' <button type="button" class="ic-more" data-pa="open" data-a="handbok" data-hbid="lex_montering">' + L('Mer om montering ›', 'More on fitting ›') + '</button></p>'];
    if (!atKind(mode)) h.push(nearHint(mode));
    // the hold in three steps (core/03-simulation.js HOLDUP); an open boat's hold is her fish tubs, one more a step (core/07f-kar.js)
    if (mode === 'verft' && VESSELS[S.boat.type].cls !== 'hav'){ const b = S.boat, V = VESSELS[b.type], lv = b.holdLv || 0, steps = karSteps(b.type), nx = lv < steps ? HOLDUP[lv] : null, base = V.holdCap, queued = (S.jobs || []).some(j => j.kind === 'hold');
      const kar = !!V.kar, next = nx ? (kar ? karN(b.type, lv + 1) * TUB_KG : Math.round(base * nx.x)) : 0;
      h.push('<div class="ph-card"><h4>' + (kar ? L('Fiskekar', 'Fish tubs') + (steps ? ' (' + lv + '/' + steps + ')' : '') : L('Større lasterom', 'A bigger hold') + ' (' + lv + '/' + steps + ')') + '</h4><p>' +
        (kar ? L('Båten har ikke lasterom. Fisken ligger i hvite kar på 500 kg på dekk, og karene løftes i land ved levering. ' + (steps ? 'Verftet gjør plass til ett kar til per trinn. ' : '') + 'Mer last gjør båten tyngre.', 'The boat has no hold. The fish lies in white 500 kg tubs on deck, and the tubs are lifted ashore at the plant. ' + (steps ? 'The yard makes room for one more tub a step. ' : '') + 'More load makes her heavier.')
          : L('Lengre lasterom og flere kasser. Tre trinn: +20 %, +40 % og +70 %. Mer last gjør båten tyngre.', 'A longer hold and more boxes. Three steps: +20%, +40% and +70%. More load makes her heavier.')) + '</p>' +
        kv(L('Nå', 'Now'), (kar ? BOAT.karN + ' ' + L('kar', BOAT.karN === 1 ? 'tub' : 'tubs') + ' · ' : '') + fmt(BOAT.holdCap, 0) + ' kg') + (nx ? kv(L('Neste trinn', 'Next step'), (kar ? karN(b.type, lv + 1) + ' ' + L('kar', 'tubs') + ' · ' : '') + fmt(next, 0) + ' kg · ' + kr(upPrice(nx.pc, nx.min)) + ' · ' + L('på verftet ', 'at the yard ') + durBoth(YARD_H * 60)) : '') +
        (!nx ? '<p><b>' + (kar ? L('Det er ikke plass til flere kar på dekket', 'There is no room for more tubs on deck') : L('Fullt ombygd', 'Fully rebuilt')) + '</b></p>' : queued ? '<p><b>' + L('På verftet', 'At the yard') + '</b></p>' : '<button class="ph-btn p" data-pa="holdup"' + (!atKind('verft') || spendable() < upPrice(nx.pc, nx.min) ? ' disabled' : '') + '>' + (kar ? L('Gjør plass · ', 'Make room · ') : L('Bygg om · ', 'Rebuild · ')) + kr(upPrice(nx.pc, nx.min)) + '</button>') + '</div>'); }
    // a bigger engine in two steps (core ENGUP; not for an outboard, which has the 90 hp outboard among the equipment)
    if (mode === 'verft'){ const b = S.boat, V = VESSELS[b.type], lv = b.engLv || 0, nx = ENGUP[lv], queued = (S.jobs || []).some(j => j.kind === 'eng');
      if (!V.outboard){ const P1 = nx ? powerX(Object.assign({}, b, {engLv:lv + 1})) : 0, v1 = nx ? V.vmax * speedOfPower(P1, V.planing) : 0;
        h.push('<div class="ph-card"><h4>' + L('Større motor', 'A bigger engine') + ' (' + lv + '/2)</h4><p>' + L('Mer kraft: +10 % og så +20 % mot motoren båten kom med. Det gir en jevn, men moderat fartsgevinst (Trim gir mye mer for en stund). Motoren bruker mer diesel, og servicen blir dyrere (+20 % og +50 %).', 'More power: +10% and then +20% over the boat\'s own engine. A steady but modest gain in speed (Trim gives far more for a while). The engine burns more diesel and the service costs more (+20% and +50%).') + '</p>' +
          kv(L('Nå', 'Now'), BOAT.hp + ' hk · ' + fmt(BOAT.vmax, 1) + ' kn') + (nx ? kv(L('Neste trinn', 'Next step'), Math.round(V.hp * (1 + nx.p)) + ' hk · ' + fmt(v1, 1) + ' kn · ' + kr(upPrice(nx.pc, nx.min)) + ' · ' + durBoth(YARD_H * 60)) : '') +
          (!nx ? '<p><b>' + L('Største motor er montert', 'The biggest engine is fitted') + '</b></p>' : queued ? '<p><b>' + L('På verftet', 'At the yard') + '</b></p>' : '<button class="ph-btn p" data-pa="engup"' + (!atKind('verft') || spendable() < upPrice(nx.pc, nx.min) ? ' disabled' : '') + '>' + L('Bytt motor · ', 'Change the engine · ') + kr(upPrice(nx.pc, nx.min)) + '</button>') + '</div>'); } }
    // the other rebuilds of the boat itself (core UPGS): cabins, galley, drying room, insulated hold, fuel tank, stabilisation. None for gear.
    if (mode === 'verft'){ const b = S.boat, V = VESSELS[b.type];
      for (const k in UPGS){ const U = UPGS[k]; if (!U.fit(V)) continue; const lv = upgLv(b, k), nx = upgNext(b, k), queued = (S.jobs || []).some(j => j.kind === 'upg' && j.u === k), cur = lv ? U.steps[lv - 1] : null;
        h.push('<div class="ph-card"><h4>' + U[S.lang] + ' (' + lv + '/' + U.steps.filter(st => !st.minLen || V.len >= st.minLen).length + ')</h4><p>' + U.d[S.lang === 'no' ? 0 : 1] + '</p>' +
          (cur ? kv(L('Nå', 'Now'), cur[S.lang]) : '') + (nx ? kv(L('Neste trinn', 'Next step'), nx[S.lang] + ' · ' + kr(upPrice(nx.pc, nx.min)) + ' · ' + durBoth(YARD_H * 60)) : '') +
          (!nx ? '<p><b>' + L('Fullt ombygd', 'Fully rebuilt') + '</b></p>' : queued ? '<p><b>' + L('På verftet', 'At the yard') + '</b></p>' : '<button class="ph-btn p" data-pa="upg" data-u="' + k + '"' + (!atKind('verft') || spendable() < upPrice(nx.pc, nx.min) ? ' disabled' : '') + '>' + L('Bygg om · ', 'Rebuild · ') + kr(upPrice(nx.pc, nx.min)) + '</button>') + '</div>'); } }
    // in the shop: the top (the keeper, what is ordered here, what the boat needs), then what the boat lacks, what is aboard in one card,
    // and what does not suit her folded away (M2). The hauler and the deck first, the electronics after
    if (mode === 'butikk' && atKind('butikk')) h.splice(1, 0, shopTop('utstyrb'));
    const ORDER = ['linehaler', 'garnhaler', 'teinehaler', 'jukse', 'krabbekar'], keys = Object.keys(EQUIP).filter(k => !EQUIP[k].tiers && yardEq(k) === (mode === 'verft')).sort((a, c) => (ORDER.includes(a) ? ORDER.indexOf(a) : 99) - (ORDER.includes(c) ? ORDER.indexOf(c) : 99));
    const aboard = [], nofit = [];
    for (const k of keys){ const E = EQUIP[k];
      if (!equipFits(k, S.boat.type)){ nofit.push(E.name[S.lang]); continue; }
      const have = E.multi ? S.equip[k] : S.equip[k] ? 1 : 0, max = E.multi ? BOAT.jukseMax : 1, fj = (S.jobs || []).filter(j => j.kind === 'fit' && j.k === k), fitting = fj.length > 0;
      // (Tony 06.11.2026: the card says when the fitting is done, not only that it is; the yard's queue has the bar)
      const fitTxt = !fitting ? '' : (E.multi && fj.length > 1 ? fj.length + ' ' : '') + L('Til montering', 'Being fitted') + (fj[0].until != null ? ' · ' + L('ferdig kl. ', 'done at ') + hm(fj[0].until / 60) + ' (' + inReal(fj[0].until - S.t) + ')' : ' · ' + L('venter på havn', 'waits for port'));
      // (what the rules ask for is aboard and not for sale here: V6 A; it says so in the card of what is aboard)
      const req = (VESSELS[S.boat.type].req || []).includes(k);
      if (have >= max || req){ const br = SPUI.brandOf(k); aboard.push(E.name[S.lang] + (br && br.m ? ' (' + br.m + ')' : '') + (E.multi ? ' × ' + have : '') + (req ? ' (' + L('påbudt, følger båten', 'required, comes with the boat') + ')' : '')); continue; }
      const pend = shopPend && shopPend.k === 'equip:' + k && Date.now() - shopPend.t <= IC_CONFIRM_MS, dis = !(atKind(EQ_YARD(k) ? 'verft' : 'butikk') && spendable() >= E.price);
      const btn = pend ? '<span class="ic-cf"><button class="ph-btn p" data-pa="equip" data-k="' + k + '">' + L('Bekreft · ', 'Confirm · ') + kr(E.price) + '</button><button class="ph-btn alt ic-x" data-pa="shop0" aria-label="' + L('Avbryt', 'Cancel') + '">✕</button></span>'
        : '<button class="ph-btn p" data-pa="equip" data-k="' + k + '"' + (dis ? ' disabled' : '') + '>' + L('Kjøp og monter', 'Buy and fit') + ' · ' + durBoth(fitHours(k) * 60) + '</button>';
      h.push(itemCard({k, name:E.name[S.lang], sub:E.multi ? (have || 0) + ' / ' + max : '', price:E.price, have:fitTxt, note:typeof G3 !== 'undefined' && G3.trying === k ? L('Vises på «' + S.boatName + '» nå, før du har kjøpt. Dra for å se rundt.', 'Shown on the «' + S.boatName + '» now, before you buy. Drag to look round.') : '', btns:fitting && !E.multi ? '' : '<span class="ic-row">' + btn + tryBtn(k) + '</span>'}));
      // the same item from a partner with a written agreement (M6, ui/10r-sponsor.js): same price, same numbers, marked
      if (!(fitting && !E.multi) && typeof spOf === 'function' && spOf('item', k)){ const pend2 = shopPend && shopPend.k === 'equip:' + k + ':sp' && Date.now() - shopPend.t <= IC_CONFIRM_MS;
        h.push(SPUI.card(k, pend2 ? '<span class="ic-cf"><button class="ph-btn p" data-pa="equip" data-sp="1" data-k="' + k + '">' + L('Bekreft · ', 'Confirm · ') + kr(E.price) + '</button><button class="ph-btn alt ic-x" data-pa="shop0" aria-label="' + L('Avbryt', 'Cancel') + '">✕</button></span>'
          : '<span class="ic-row"><button class="ph-btn p" data-pa="equip" data-sp="1" data-k="' + k + '"' + (dis ? ' disabled' : '') + '>' + L('Kjøp og monter', 'Buy and fit') + ' · ' + durBoth(fitHours(k) * 60) + '</button>' + tryBtn(k) + '</span>')); }
    }
    if (mode === 'butikk'){ const people = 1 + S.crew.length, c = S.clothes || {}, H = S.t / 60, cp = coldPen(H);
      h.push('<h4 style="margin:12px 2px 6px">' + L('Klær til mannskapet', 'Clothes for the crew') + '</h4><p class="ph-note">' + L('Nå: effektiv temperatur ' + Math.round(effTemp(H)) + ' °C, fisket går ' + Math.round(cp * 100) + ' % tregere. Alle om bord trenger sine egne.', 'Now: effective temperature ' + Math.round(effTemp(H)) + ' °C, fishing ' + Math.round(cp * 100) + '% slower. Everyone aboard needs their own.') + '</p>');
      for (const k of ['olje', 'varme']){ const C = CLOTHES[k], have = c[k] || 0;
        h.push(itemCard({k, name:C[S.lang], sub:Math.min(have, people) + ' / ' + people, price:C.price, have:have >= people ? L('Alle om bord har', 'Everyone aboard has one') : '', btns:have >= people ? '' : '<button class="ph-btn p" data-pa="cloth" data-k="' + k + '">' + L('Kjøp én', 'Buy one') + '</button>'})); } }
    if (aboard.length) h.push('<div class="ph-card ic-aboard"><h4>' + L('Om bord', 'Aboard') + '</h4><p>' + aboard.join(' · ') + '</p></div>');
    if (nofit.length) h.push('<details class="ph-card ic-nofit"><summary>' + L('Passer ikke «' + S.boatName + '»', 'Does not suit the «' + S.boatName + '»') + ' (' + nofit.length + ')</summary><p>' + nofit.join(' · ') + '</p></details>');
    h.push('</div>'); return h.join('');
  }
  // --- gear: in the sea, aboard (baiting and mending), and the shop
  // ---- gear care (core/10b-gearcare.js): the condition of the gear aboard, and what the crew can do about it in port
  const pctOf = v => Math.round(v * 100) + ' %';
  const cbar = v => '<div class="ph-bar"><i style="width:' + Math.round(clamp(v, 0, 1) * 100) + '%"></i></div>';
  const cbtn = (a, attrs, label, ok, cls) => '<button class="ph-btn' + (cls ? ' ' + cls : '') + '" data-pa="' + a + '" ' + attrs + (ok === false ? ' disabled' : '') + '>' + label + '</button>';
  const qTxt = q => q ? ' · ' + (q.fee ? kr(q.fee) + ' · ' : '') + durBoth(q.h * 60) : '';
  // ---- a line kind as it stands (Jonas 20.10.2026, tilbakemelding #74: «hva båten har slags fiskeredskaper ombord og hva disse eventuelt er
  // egnet med», no hints): the tubs in a row by their state, the bait's colours with names and counts, and baiting and stripping with the bait
  // the player picks (egnUI: the chooser open now, {lk, m:'egn'|'strip', b:bait, n, t:the bait after a strip}). o: {work: the crew can work
  // now (in port, or at sea with a crew free), shed: a baiting shed at this quay, care: the line's and the hooks' own state and upkeep}
  function lineCard(lk, o){
    const pg = careInit(S.pgear), L0 = pg.lines[lk], K = LINE_KINDS[lk], un = L0.n - L0.baited, bt = btOf(L0), groups = Object.keys(bt).filter(k => bt[k] > 0);
    const all = L0.n + tubState(lk).work.reduce((a, w) => a + w.n, 0);   // with the tubs the crew has in hand
    const h = ['<div class="ph-card lc" id="lc-' + lk + '"><h4>' + K[S.lang] + ' · ' + all + ' ' + L(all === 1 ? 'stamp' : 'stamper', all === 1 ? 'tub' : 'tubs') + '</h4>' + tubsHtml(lk) + tubLegend(lk) +
      '<p class="ph-note">' + K.hooks + L(' kroker og ', ' hooks and ') + fmt(K.baitKg, 0) + L(' kg agn per stamp', ' kg of bait a tub') + '</p>'];
    if (o.care){ const tot = L0.n * K.hooks, miss = Math.round(L0.miss * tot), bent = Math.round(L0.bent * tot);
      h.push(kv(L('Lina', 'The line'), pctOf(L0.cond) + ' · ' + L('tak ', 'ceiling ') + pctOf(L0.max)) + cbar(L0.cond) +
        kv(L('Kroker', 'Hooks'), (tot - miss - bent) + ' ' + L('i orden', 'fine') + ', ' + bent + ' ' + L('bøyde', 'bent') + ', ' + miss + ' ' + L('mangler', 'missing')) + (L0.sharp > 0 ? '<p class="ph-note">' + L('Nye kroker: fisker 5 % bedre i ' + L0.sharp + ' trekk til.', 'Fresh hooks: 5 % better catch for ' + L0.sharp + ' more hauls.') + '</p>' : ''));
      if (L0.max <= 0.45) h.push('<p class="ph-note">' + L('Lina er så slitt at det lønner seg å skifte den: selg den i utstyrsbutikken (Service) og kjøp ny.', 'The line is so worn that it pays to replace it: sell it at the tackle shop (Service) and buy a new one.') + '</p>');
      if (o.work){ const qh = careQuote('hooks', lk, false), ql = careQuote('line', lk, false), need = hooksNeed(lk), hb = [];
        if (need > 0) hb.push(cbtn('carehk', 'data-lk="' + lk + '" data-m="self"', L('Bytt ', 'Change ') + (qh ? qh.n : need) + L(' kroker selv', ' hooks yourselves') + qTxt(qh) + (qh ? '' : ' · ' + L('ingen kroker på lager', 'no hooks in the store')), !!qh));
        if (ql) hb.push(cbtn('carelr', 'data-lk="' + lk + '" data-m="self"', L('Reparer lina selv', 'Mend the line yourselves') + qTxt(ql), true));
        if (hb.length) h.push('<div class="ph-btncol">' + hb.join('') + '</div>'); } }
    // the chooser, while it still has something to work on
    const u = egnUI && egnUI.lk === lk ? egnUI : null, live = u && (u.m === 'egn' ? un > 0 && (o.work || o.shed) : groups.length > 0 && o.work);
    if (live) h.push(egnChooser(lk, o));
    else { const bb = [];
      if (un > 0 && (o.work || o.shed)) bb.push(cbtn('egnui', 'data-lk="' + lk + '" data-m="egn"', L('Egn ', 'Bait ') + un + ' …', true, 'p'));
      if (groups.length && o.work) bb.push(cbtn('egnui', 'data-lk="' + lk + '" data-m="strip"', L('Fjern agn', 'Remove bait') + ' …', true));
      if (bb.length) h.push('<div class="ph-row2">' + bb.join('') + '</div>'); }
    return h.join('') + '</div>';
  }
  // a bait to pick: its colour, name, what it says beside (kilos aboard, or tubs), and what it takes best
  const baitPickBtn = (pa, k, on, sub, dis) => '<button type="button" class="bp' + (on ? ' on' : '') + '" data-pa="' + pa + '" data-k="' + k + '"' + (dis ? ' disabled' : '') + '>' + (k ? baitDot(k) : baitDot(null, 'e')) + '<b>' + (k ? baitNm(k) : L('Ingen', 'None')) + '</b><small>' + sub + '</small>' +
    (k ? '<small class="g">' + (baitGood(k).slice(0, 3).map(spLc).join(', ') || L('likt på alt', 'even on all')) + '</small>' : '') + '</button>';
  function egnChooser(lk, o){
    const pg = S.pgear, L0 = pg.lines[lk], K = LINE_KINDS[lk], un = L0.n - L0.baited, bt = btOf(L0), B = baitOf(pg), u = egnUI, hs = egnHands(), fit = k => Math.floor((B[k] || 0) / K.baitKg + 1e-9);
    const step = (n, max, unit) => '<div class="egc-n"><button type="button" data-pa="egnn" data-d="-1"' + (n <= 1 ? ' disabled' : '') + ' aria-label="−">−</button><b>' + n + ' ' + unit + '</b><button type="button" data-pa="egnn" data-d="1"' + (n >= max ? ' disabled' : '') + ' aria-label="+">+</button></div>';
    const tubs = n => n === 1 ? L('stamp', 'tub') : L('stamper', 'tubs'), h = ['<div class="egc">'];
    if (u.m === 'egn'){
      if (!BAITS[u.b]) u.b = 'makrell';
      const n = u.n = clamp(u.n || un, 1, un), bn = baitLc(u.b), kg = n * K.baitKg;
      h.push('<div class="egc-h">' + L('Egn med', 'Bait with') + '</div><div class="bpick">' + Object.keys(BAITS).map(k => baitPickBtn('egnb', k, u.b === k, fmt(B[k] || 0, 0) + ' kg' + (fit(k) ? ' · ' + fit(k) + ' ' + tubs(fit(k)) : ''), !fit(k) && !o.shed)).join('') + '</div>' + step(n, un, tubs(n)) + '<div class="ph-btncol">');
      if (o.work) h.push(cbtn('gregn', 'data-lk="' + lk + '" data-n="' + n + '" data-b="' + u.b + '" data-m="self"', L('Egn ' + n + ' med ' + bn + ' selv', 'Bait ' + n + ' with ' + bn + ' yourselves') + ' · ' + fmt(kg, 0) + ' kg · ' + (hs.hands ? durBoth(egnHours(lk, n, hs.eff) * 60) : '–'), (B[u.b] || 0) >= kg - 1e-9 && hs.hands > 0, o.shed ? '' : 'p'));
      if (o.work && (B[u.b] || 0) < kg - 1e-9) h.push('<p class="ph-note">' + L('Om bord: ' + fmt(B[u.b] || 0, 0) + ' kg ' + bn + '.', 'Aboard: ' + fmt(B[u.b] || 0, 0) + ' kg of ' + bn + '.') + '</p>');
      if (o.shed){ const fee = egnFee(lk, n, u.b); h.push(cbtn('gregn', 'data-lk="' + lk + '" data-n="' + n + '" data-b="' + u.b + '" data-m="shed"', L('Egnebua egner ' + n + ' med ' + bn, 'The shed baits ' + n + ' with ' + bn) + ' · ' + kr(fee), fee <= spendable(), 'p')); }
    } else {
      const groups = Object.keys(bt).filter(k => bt[k] > 0).sort((a, c) => bt[c] - bt[a]); if (!groups.includes(u.b)) u.b = groups[0];
      const n = u.n = clamp(u.n || bt[u.b], 1, bt[u.b]); if (u.t && (u.t === u.b || fit(u.t) < n)) u.t = '';
      h.push('<div class="egc-h">' + L('Fjern agnet fra', 'Take the bait off') + '</div><div class="bpick">' + groups.map(k => baitPickBtn('egnb', k, u.b === k, bt[k] + ' ' + tubs(bt[k]), false)).join('') + '</div>' + step(n, bt[u.b], tubs(n)) +
        '<div class="egc-h">' + L('Egn etterpå med', 'Then bait with') + '</div><div class="bpick">' + baitPickBtn('egnt', '', !u.t, L('la stå uegnet', 'leave unbaited'), false) +
        Object.keys(BAITS).filter(k => k !== u.b).map(k => baitPickBtn('egnt', k, u.t === k, fmt(B[k] || 0, 0) + ' kg', fit(k) < n)).join('') + '</div><div class="ph-btncol">');
      const hrs = hs.hands ? stripHours(lk, n, hs.eff) + (u.t ? egnHours(lk, n, hs.eff) : 0) : 0;
      h.push(cbtn('grstrip', 'data-lk="' + lk + '" data-b="' + u.b + '" data-n="' + n + '" data-t="' + (u.t || '') + '"', L('Fjern agnet fra ' + n + ' ' + tubs(n), 'Take the bait off ' + n + ' ' + tubs(n)) + (u.t ? L(' og egn med ' + baitLc(u.t), ' and bait with ' + baitLc(u.t)) : '') + ' · ' + (hs.hands ? durBoth(hrs * 60) : '–'), hs.hands > 0, 'p'));
      h.push('<p class="ph-note">' + L('Det gamle agnet kastes.', 'The old bait is thrown away.') + '</p>');
    }
    h.push(cbtn('egnx', '', L('Avbryt', 'Cancel'), true, 'alt') + '</div></div>');
    return h.join('');
  }
  // the autoline (H2a): the lenker on the magazines and in the sea, the hooks' state, the bait in the freezer for the baiting machine, and
  // new lenker from the tackle shop when one is lost or worn out
  function autoCard(){
    const pg = S.pgear, A = autoL(pg); if (!A) return '';
    const sea = mySets().filter(x => x.kind === 'line' && isAuto(x.lk)).reduce((a, x) => a + x.n, 0), per = LINE_KINDS.auto.baitKg, B = baitOf(pg), bk = Object.keys(B).filter(k => BAITS[k] && B[k] >= 1);
    const lenker = Math.floor(bk.reduce((a, k) => a + B[k], 0) / per + 1e-9), room = autoRoom(), shop = atKind('butikk'), h = ['<div class="ph-card"><h4>' + L('Autoline', 'Autoline') + '</h4>'];
    h.push(kv(L('På magasinene', 'On the magazines'), A.n + ' ' + unitName('line', A.n, 'auto') + ' · ' + fmt(A.n * LINE_KINDS.auto.hooks, 0) + L(' krok', ' hooks')));
    if (sea) h.push(kv(L('I sjøen', 'In the sea'), sea + ' ' + unitName('line', sea, 'auto')));
    h.push(kv(L('Krokene', 'The hooks'), pctOf(lineQ(A)) + ' · ' + L('mangler ', 'missing ') + pctOf(A.miss || 0) + ', ' + L('bøyd ', 'bent ') + pctOf(A.bent || 0)) + cbar(lineQ(A)));
    h.push(kv(L('Agn i frysen', 'Bait in the freezer'), bk.length ? bk.map(k => baitDot(k) + BAITS[k][S.lang] + ' ' + fmt(B[k], 0) + ' kg').join(' · ') : L('ingen', 'none')));
    h.push('<p class="ph-note">' + L('Egnemaskinen egner hver krok når lina går ut over hekken, ' + fmt(per, 0) + ' kg agn per lenke. Agnet holder til ' + lenker + ' ' + unitName('line', lenker, 'auto') + '. Akkar og saury er det autolineflåten bruker. Agn kjøper du på fiskemottaket.', 'The baiting machine baits each hook as the line runs out over the stern, ' + fmt(per, 0) + ' kg of bait a lenke. The bait lasts ' + lenker + ' ' + unitName('line', lenker, 'auto') + '. Squid and saury are what the autoline fleet uses. You buy bait at the fish plant.') + '</p>');
    if (room > 0) h.push('<div class="ph-btncol"><button class="ph-btn"' + (shop && AUTOLENKE_KR <= spendable() ? '' : ' disabled') + ' data-pa="grbuy" data-w="stamp" data-s="auto" data-n="1">' + L('Ny lenke autoline · ', 'New lenke of autoline · ') + kr(AUTOLENKE_KR) + '</button></div>' + (shop ? '' : '<p class="ph-note">' + L('Nye lenker får du i utstyrsbutikken.', 'New lenker are sold at the tackle shop.') + '</p>'));
    return h.join('') + '</div>';
  }
  function careAboard(inPort, p){
    const pg = careInit(S.pgear), b = S.boat, h = [];
    { const ac = autoCard(); if (ac) h.push(ac); }
    for (const lk of ['hyse', 'bank']){ if (!pg.lines[lk].n && !tubState(lk).work.length) continue; h.push(lineCard(lk, {work:inPort, shed:b.status === 'port' && egnPort(p) && atKind('mottak'), care:true})); }
    const hk = '<p class="ph-note">' + L('Kroker på lager: ', 'Hooks in store: ') + pg.hooks + '. ' + L('Kjøpes i pakker på 100, 500 og 1000 i utstyrsbutikken.', 'Bought in packs of 100, 500 and 1000 at the tackle shop.') + '</p>';
    h.push(!pg.lines.hyse.n && !pg.lines.bank.n && !h.length ? '<div class="ph-card"><h4>' + L('Line', 'Line') + '</h4><p class="ph-note">' + L('Ingen line om bord.', 'No line aboard.') + '</p>' + hk + '</div>' : hk);
    // pots
    const rgp = (VESSELS[b.type] || {}).rigs || [], pK = potK(), PP = POTS[pK], nP = pg.pots[pK] || 0, showP = rgp.includes('teiner') || nP > 0;
    // (H3a) the snow crab vessel: the pots in the sea against the cap of § 28, and the strings
    if (showP) h.push('<div class="ph-card"><h4>' + L('Teiner', 'Pots') + '</h4>' + kv(PP[S.lang], nP) + (PP.sno ? kv(L('I sjøen', 'In the sea'), fmt(snoInSea(), 0) + ' ' + L('av høyst', 'of at most') + ' ' + fmt(SNOC.max, 0) + ' (§ 28)') + '<p class="ph-note">' + L('Konisk teine, 135 mm maske, rømmingshull med bomullstråd og fartøyets registreringsmerke. Settes i lenker på 200 med 25 m mellom.', 'Conical pot, 135 mm mesh, an escape opening laced with cotton twine and the vessel\'s registration mark. Set in strings of 200, 25 m apart.') + '</p>' : ''));
    if (nP){ h.push(kv(L('Stand', 'Condition'), pctOf(pg.potc.cond) + ' · ' + L('tak ', 'ceiling ') + pctOf(pg.potc.max)) + cbar(pg.potc.cond));
      if (inPort){ const qp = careQuote('pot', 0, false); if (qp) h.push('<div class="ph-btncol">' + cbtn('carepot', 'data-m="self"', L('Reparer teinene selv', 'Mend the pots yourselves') + qTxt(qp), true) + '</div>'); } }
    if (showP) h.push('</div>');
    // the jig: the pilk and hooks that are mounted, and the spare sets (not on a vessel that cannot jig, vesselJigs)
    if ((b.gear || b.kgear) && vesselJigs()){ h.push('<div class="ph-card"><h4>' + L('Juksa', 'Jig') + '</h4>'); const js = jigSets();
      for (const k of ['mark', 'kveite']){ if (k === 'mark' ? !b.gear : !b.kgear) continue; const J = pg.jig[k], js1 = js.find(x => x.k === k), on = js1 ? js1.on : jigKind() === k, qj = 1;
        h.push(kv(CARE.jig[k][S.lang] + (on ? ' · ' + L('i bruk', 'in use') : ''), pctOf(J.c) + ' · ' + J.n + ' ' + L('på lager', 'spare')) + cbar(J.c) + (js1 && js1.sp.length ? spChips(js1.sp) : js1 && js1.closed ? '<p class="ph-note">' + L('Kveita er fredet til og med 20. april.', 'Halibut is closed until 20 April.') + '</p>' : ''));
        const bt = []; if (!on) bt.push(cbtn('jigsel', 'data-k="' + k + '"', L('Bruk ', 'Use ') + CARE.jig[k][S.lang].toLowerCase(), true)); if (inPort && J.n > 0 && J.c < 0.98 && qj) bt.push(cbtn('carejig', 'data-k="' + k + '"', L('Bytt til nytt sett', 'Fit a new set'), true));
        if (bt.length) h.push('<div class="ph-btncol">' + bt.join('') + '</div>'); }
      h.push('<p class="ph-note">' + L('Pilk og kroker slites ved fiske. Reservesett kjøpes i utstyrsbutikken, og du velger her hva du fisker med.', 'Pilk and hooks wear with fishing. Spare sets are bought at the tackle shop, and you choose here what to fish with.') + '</p></div>'); }
    // buoys, bait and the crew's own upkeep
    const bk = Object.entries(baitOf(pg)).filter(e => e[1] > 0.05);
    h.push('<div class="ph-card" id="baitCard"><h4>' + L('Blåser og agn', 'Buoys and bait') + '</h4>' + kv(L('Blåsesett', 'Buoy sets'), pg.kits.n + (pg.kits.heavy ? ' (' + pg.kits.heavy + ' ' + L('med tung dregg', 'with heavy anchor') + ')' : '')) +
      (bk.length ? bk.map(e => kv((BAITS[e[0]] ? baitDot(e[0]) + BAITS[e[0]][S.lang] : e[0]) + (potsAboard(pg) ? ' <small>' + L('til ', 'for ') + Math.min(potsAboard(pg), Math.floor(e[1] / potBaitKg(potK()) + 1e-9)) + L(' teiner', ' pots') + '</small>' : ''), fmt(e[1], 0) + ' kg')).join('') : kv(L('Agn', 'Bait'), L('ingen', 'none'))) +
      '<div class="ph-btncol">' + cbtn('careauto', '', L('Mannskapet vedlikeholder selv i havn: ', 'The crew does the upkeep in port: ') + (S.settings.careAuto === false ? L('av', 'off') : L('på', 'on')), true, 'alt') + '</div></div>');
    return h.join('');
  }
  function redskap(tab0){
    const tab = tab0 || sub.redskap || 'sjo', b = S.boat, pg = S.pgear, p = portById(b.port), inPortNow = b.status === 'port';
    const h = ['<div class="ph-c">' + (tab0 ? '' : subs('redskap', [['sjo', 'I sjøen', 'In the sea'], ['bord', 'Om bord', 'Aboard'], ['kjop', 'Kjøp', 'Buy']]))];
    if (tab === 'sjo'){
      const all = (S.sets || []).filter(s => s.vid === S.cur);
      if (!all.length) h.push('<div class="ph-card"><p class="ph-note">' + L('Ingen redskap i sjøen. Trykk «Sett ut» når båten ligger stille på feltet, eller legg setting inn i ruta.', 'No gear in the sea. Tap «Set» when the boat lies still on the grounds, or put the setting into the route.') + '</p></div>');
      for (const s of all){ const st = setState(s);
        const bw = s.kind === 'line' ? s.baitW || {makrell:s.n} : s.kind === 'teine' ? {[s.bait || 'makrell']:s.n} : null;
        h.push('<div class="ph-card' + (st === 'lost' || st === 'late' ? ' conflict' : '') + '"><h4>' + (s.kind === 'line' && LINE_KINDS[s.lk] ? LINE_KINDS[s.lk][S.lang] : GEAR[s.kind][S.lang]) + ', ' + s.n + ' ' + unitName(s.kind, s.n, s.lk) + '</h4>' +
          (bw ? kv(L('Agn', 'Bait'), Object.keys(bw).filter(k => bw[k] > 0).sort((a, c) => bw[c] - bw[a]).map(k => baitDot(k) + (s.kind === 'line' && Object.keys(bw).length > 1 ? bw[k] + ' ' : '') + baitLc(k)).join(' · ')) : '') +
          kv(L('Satt', 'Set'), dayStr(s.tSet / 60) + ' ' + hm(s.tSet / 60)) + kv(L('Ståtid', 'Soak'), fmt((S.t - s.tSet) / 60, 0) + ' t (' + realDur(S.t - s.tSet) + L(' i ekte tid', ' real time') + ') · ' + L(SETST[st][0], SETST[st][1])) + kv(L('Posisjon', 'Position'), coordStr(setMid(s)) + ', ' + s.depth + ' m') +
          (s.kind === 'garn' ? kv(L('Maskevidde og stand', 'Mesh and condition'), netNo(s) + ' · ' + Math.round((s.cond || 1) * 100) + ' %') : '') + (s.heavy ? kv(L('Dregg', 'Anchor'), L('tung', 'heavy')) : '') +
          (!s.lost && ['idle', 'port', 'sailing'].includes(b.status) ? '<button class="ph-btn p" data-pa="goset" data-id="' + s.id + '">' + L('Kjør dit', 'Go there') + ' · ' + fmt(Math.min(dist(b.pos, s.a), dist(b.pos, s.b)) / NM, 1) + ' nm</button>' : '') +
          (s.lost ? '<p class="ph-note">' + L('Blåsene er borte. Tapt redskap skal meldes til Kystvakten med type, mengde og siste posisjon.', 'The buoys are gone. Lost gear must be reported to the Coast Guard with type, amount and last position.') + '</p><button class="ph-btn p" data-pa="grrep" data-id="' + s.id + '">' + L('Meld tapt redskap', 'Report lost gear') + '</button>' : '') + '</div>'); }
      h.push('<p class="ph-note">' + L('Line er best innen et døgn. Etter 24 timer tar marfloen fisken. Teiner bør stå minst 20 timer og trekkes innen 48. Garn trekkes helst hver dag. Om sommeren går fisken fort i garnet.', 'Line is best within a day. After 24 hours the amphipods take the fish. Pots should stand at least 20 hours and be hauled within 48. Nets are best hauled daily. In summer the fish spoils fast in the net.') + '</p>');
    } else if (tab === 'bord'){
      // (H2a) the cards for gear the vessel cannot be rigged for (nets and pots on the autoliner) are left out unless some is aboard
      const rg = (VESSELS[b.type] || {}).rigs || [], showG = rg.includes('garn') || pg.nets.length > 0;
      if (showG) h.push('<div class="ph-card"><h4>' + L('Garn', 'Nets') + '</h4>' + (pg.nets.length ? '' : '<p class="ph-note">' + L('Ingen garn om bord.', 'No nets aboard.') + '</p>'));
      for (const l of pg.nets){ h.push('<div class="ph-kv"><span>' + L(...netN(l, l.n)) + '</span><span>' + Math.round(l.cond * 100) + ' % · ' + L('tak ', 'ceiling ') + Math.round(nMax(l) * 100) + ' %</span></div><div class="ph-bar"><i style="width:' + Math.round(l.cond * 100) + '%"></i></div>');
        if ((inPortNow || seaWork()) && l.cond < nMax(l) - 0.05) h.push('<div class="ph-btncol"><button class="ph-btn" data-pa="grmend" data-id="' + l.id + '" data-m="self">' + L('Bøt selv', 'Mend yourselves') + '</button>' + (botPort(p) ? '<button class="ph-btn" data-pa="grmend" data-id="' + l.id + '" data-m="bot">' + L('Lever til bøteriet', 'Leave at the net loft') + ' (' + kr(Math.round(GPRICE.bot * l.n * (nMax(l) - l.cond) / 0.1)) + ')</button>' : '') + '</div>');
        if (l.n >= 2) h.push('<button class="ph-btn alt" data-pa="grsplit" data-id="' + l.id + '">' + L('Del lenka i to', 'Split the string') + '</button>'); }
      if (pg.nets.length >= 2){ const m = {}; for (const l of pg.nets) (m[netKey(l.ty, l.mesh)] = m[netKey(l.ty, l.mesh)] || []).push(l); for (const k in m) if (m[k].length >= 2) h.push('<button class="ph-btn alt" data-pa="grjoin" data-a="' + m[k][0].id + '" data-b="' + m[k][1].id + '">' + L('Slå sammen lenker på ' + k.replace(':', ' ') + ' mm', 'Join strings of ' + k.replace(':', ' ') + ' mm') + '</button>'); }
      h.push((showG ? '</div>' : '') + careAboard(inPortNow || seaWork(), p));
      const shore = pg.shore.filter(j => j.ready); if (shore.length) h.push('<div class="ph-card"><h4>' + L('På land', 'Ashore') + '</h4>' + shore.map(j => kv(j.kind === 'egn' ? j.n + ' ' + L('stamper i egnebua', 'tubs at the baiting shed') : j.n + ' ' + L('garn på bøteriet', 'nets at the net loft'), portById(j.port).name + ', ' + L('klar ', 'ready ') + (S.t >= j.ready ? L('nå', 'now') : hm(j.ready / 60)))).join('') + '</div>');
    } else {
      // quantities follow the room aboard: a skiff gets fewer nets per button than a sjark
      const room = k => gearRoom(k), cap = w => w === 'net' ? room('garn') : w === 'stamp' ? room('line') : w === 'pot' ? room('teine') : w === 'kit' ? kitRoomNow() : 1e9;
      const gated = new Set(), buy = (w, s, n0, lbl, unit) => { const gate = buyGate(w, s), gk = w === 'jig' ? w + s : w; if (gate){ if (gated.has(gk)) return ''; gated.add(gk); return '<p class="ph-note"><b>' + gate[0] + '</b></p>'; }   // the one rule for what can be bought (core/10-gear.js buyGate)
        const n = Math.max(1, Math.min(n0, cap(w))), price = n * unit, ok = cap(w) >= 1 && price <= spendable() && inPortNow;
        return '<button class="ph-btn' + (ok ? ' p' : '') + '"' + (ok ? '' : ' disabled') + ' data-pa="grbuy" data-w="' + w + '" data-s="' + s + '" data-n="' + n + '">' + lbl(n) + ' · ' + kr(price) + '</button>'; };
      if (!inPortNow) h.push('<div class="ph-card"><p class="ph-note">' + L('Redskap kjøpes i havn.', 'Gear is bought in port.') + '</p></div>');
      // no room line where no hauler fits the boat: the gate says why instead (spilltest 3, F3)
      const roomTxt = (n, no, en) => haulerNoFit({garn:'garn', stamper:'line', teiner:'teine'}[no]) ? '' : '<p class="ic-have">' + L('Plass til ' + n + ' ' + no + ' til', 'Room for ' + n + ' more ' + en) + '</p>';
      const own = (w, n, no, en) => n ? L(n + ' ' + no + ' om bord', n + ' ' + en + ' aboard') : '';
      // the knives and the gaff in tiers (OPP1 of docs/planer/oppgraderinger.md): what is aboard and its tier, the next tier's numbers
      // (ICFX), price and button, or what stands in the way (buyGate); the gaff's card shows the fish lost over the rail this week
      for (const k of ['kniv', 'hott']){ const E = EQUIP[k]; if (!equipFits(k, b.type)) continue;
        const lv = equipLv(k), top = E.tiers.length, T = E.tiers[lv - 1], nx = lv < top ? lv + 1 : 0, price = nx ? tierKr(k, nx) : null, gate = nx ? buyGate('tier', k) : null;
        const per = nx && E.tiers[nx - 1].per === 'table' ? tierUnits(k, nx) : 0, wk = railWeek();   // (the fish lost over the rail on this boat this week)
        const body = (per ? '<p class="ic-have">' + L(kr(E.tiers[nx - 1].kr) + ' per sløyeplass, ' + per + ' om bord', kr(E.tiers[nx - 1].kr) + ' a gutting place, ' + per + ' aboard') + '</p>' : '') +
          (k === 'hott' ? '<p class="ph-note" data-lost="' + wk.n + '">' + (wk.n ? L('Tapt over ripa denne uka: ' + wk.n + ' fisk, ' + fmt(wk.kg, 0) + ' kg', 'Lost over the rail this week: ' + wk.n + ' fish, ' + fmt(wk.kg, 0) + ' kg') : L('Ingen fisk tapt over ripa denne uka.', 'No fish lost over the rail this week.')) + '</p>'
            : '<p class="ph-note">' + L('Feilene ved bordet er sjeldne, så det meste kniven gir, er tid.', 'Mistakes at the table are rare, so most of what the knife gives is time.') + '</p>');
        // (from 10 000 kr the tier confirms in the button, as the counter's other buys: 14-act.js, the knives at tier 3 on the coastal vessels; OPP4)
        const pend = shopPend && shopPend.k === 'equip:' + k && Date.now() - shopPend.t <= IC_CONFIRM_MS;
        const btns = !nx ? '' : gate ? '<p class="ph-note"><b>' + gate[0] + '</b></p>'
          : pend ? '<span class="ic-cf"><button class="ph-btn p" data-pa="equip" data-k="' + k + '">' + L('Bekreft · ', 'Confirm · ') + kr(price) + '</button><button class="ph-btn alt ic-x" data-pa="shop0" aria-label="' + L('Avbryt', 'Cancel') + '">✕</button></span>'
          : '<button class="ph-btn p" data-pa="equip" data-k="' + k + '"' + (price > spendable() ? ' disabled' : '') + '>' + L('Kjøp trinn ' + nx, 'Buy tier ' + nx) + ' · ' + kr(price) + '</button>';
        h.push(itemCard({k, name:E.name[S.lang], sub:L('trinn ', 'tier ') + lv + ' / ' + top, price:nx ? price : L('Øverste trinn', 'Top tier'), have:L('Om bord · trinn ' + lv + ': ' + lc1(T.no), 'Aboard · tier ' + lv + ': ' + lc1(T.en)) + (nx ? '' : L(' (det beste)', ' (the best)')), body, btns})); }
      h.push(itemCard({k:'net', name:L('Garn', 'Nets'), price:L('fra ', 'from ') + kr(NETTY.bunn.price) + L(' per garn', ' a net'), have:own('net', pg.nets.reduce((a, l) => a + l.n, 0), 'garn', 'nets'), body:roomTxt(room('garn'), 'garn', 'nets'),
        btns:NETOPT.map(o => buy('net', netKey(o[0], o[1]), 10, n => L(NETTY[o[0]].no, NETTY[o[0]].en) + ' ' + o[1] + ' mm × ' + n, NETTY[o[0]].price)).join('')}));
      h.push(itemCard({k:'line', name:L('Line', 'Line'), price:kr(LINE_KINDS.bank.price) + '–' + kr(LINE_KINDS.hyse.price) + L(' per stamp', ' a tub'), have:own('line', pg.lines.hyse.n + pg.lines.bank.n, 'stamper', 'tubs'), body:roomTxt(room('line'), 'stamper', 'tubs'),
        btns:['hyse', 'bank'].map(lk => buy('stamp', lk, 4, n => n + (n === 1 ? L(' stamp ', ' tub of ') : L(' stamper ', ' tubs of ')) + LINE_KINDS[lk][S.lang].toLowerCase(), LINE_KINDS[lk].price)).join('')}));
      // (H3a) the snow crab vessel buys the conical pots a string (200) at a time, with a buoy set and a heavy anchor for each string
      if (POTS[potK()].sno) h.push(itemCard({k:'pot', name:L('Snøkrabbeteiner', 'Snow crab pots'), price:POTS.sno.price, have:own('pot', pg.pots.sno || 0, 'teiner', 'pots'), body:'<p class="ic-have">' + L('Lenker à 200 teiner med dregg og blåse i hver ende. Høyst 8 000 teiner per fartøy (høstingsforskriften § 28).', 'Strings of 200 pots with an anchor and a buoy at each end. At most 8,000 pots a vessel (høstingsforskriften § 28).') + '</p>' + roomTxt(room('teine'), 'teiner', 'pots'),
        btns:buy('pot', 'sno', SNOC.lenke, n => n % SNOC.lenke ? potsN(n) : n / SNOC.lenke + ' ' + L(n === SNOC.lenke ? 'lenke' : 'lenker', n === SNOC.lenke ? 'string' : 'strings') + ' (' + potsN(n) + ')', POTS.sno.price)}));
      else h.push(itemCard({k:'pot', name:L('Krabbeteiner', 'Crab pots'), price:POTS.big.price, have:own('pot', pg.pots.big, 'teiner', 'pots'), body:'<p class="ic-have">' + KC_WHERE() + '</p>' + roomTxt(room('teine'), 'teiner', 'pots'),
        btns:buy('pot', 'big', 20, potsN, POTS.big.price)}));
      // bait is sold at the fish plant, not here (docs/handelssteder.md; buyGear refuses it at the shop)
      h.push(itemCard({k:'kit', name:L('Blåsesett: staur, blåse og dregg', 'Buoy set: pole, buoy and anchor'), price:GPRICE.kit, anchor:L('tung dregg ', 'heavy anchor ') + kr(GPRICE.heavy), have:own('kit', pg.kits.n, 'sett', 'sets'),
        btns:buy('kit', 0, 1, () => L('Blåsesett', 'Buoy set'), GPRICE.kit) + (pg.kits.heavy < pg.kits.n ? buy('heavy', 0, 1, () => L('Tung dregg', 'Heavy anchor'), GPRICE.heavy) : ''), note:L('Agn selges på fiskemottaket.', 'Bait is sold at the fish plant.')}));
      h.push(itemCard({k:'hooks', name:L('Kroker og juksasett', 'Hooks and jig sets'), price:CARE.hookKr[100], anchor:L('per 100', 'a 100'), have:pg.hooks ? L(pg.hooks + ' kroker på lager', pg.hooks + ' hooks in store') : '',
        btns:buy('hooks', 100, 1, () => L('100 kroker', '100 hooks'), CARE.hookKr[100]) + buy('hooks', 500, 1, () => L('500 kroker', '500 hooks'), CARE.hookKr[500]) + buy('hooks', 1000, 1, () => L('1000 kroker', '1000 hooks'), CARE.hookKr[1000]) + (BOAT.autoHooks ? buy('hooks', 10000, 1, () => L('10 000 kroker', '10,000 hooks'), CARE.hookKr[10000]) : '') +
          buy('jig', 'mark', 1, () => L('Markkroker og pilk (sett)', 'Fly hooks and pilk (set)'), CARE.jig.mark.kr) + buy('jig', 'kveite', 1, () => L('Kveitepilk (sett)', 'Halibut pilk (set)'), CARE.jig.kveite.kr)}));
      h.push('<p class="ph-note">' + L('Halere finner du under Butikk › Elektronikk og haler.', 'Haulers are under Shop › Electronics and haulers.') + '</p>');
    }
    return h.join('') + '</div>';
  }
