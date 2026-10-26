  // the yard's upgrades (hold, engine, the antifouling coat and the outboard) or the shop's (electronics, haulers, the jigging machine and the clothes)
  function utstyr(mode){
    mode = mode || 'verft'; const yardEq = EQ_YARD;
    const h = ['<div class="ph-c"><p class="ph-note">' + L('Montering skjer i havn. Utstyret følger med om du bytter båt, bortsett fra motoren og utstyr som ikke passer den nye båten. Det blir igjen på den gamle båten og betales ikke.', 'Fitting is done in port. Equipment moves with you if you change vessel, except the engine and equipment that does not suit the new vessel. That stays with the old vessel and is not paid for.') + '</p>'];
    if (!atKind(mode)) h.push(nearHint(mode));
    // the hold in three steps (core/03-simulation.js HOLDUP)
    if (mode === 'verft' && VESSELS[S.boat.type].cls !== 'hav'){ const b = S.boat, lv = b.holdLv || 0, nx = HOLDUP[lv], base = VESSELS[b.type].holdCap, queued = (S.jobs || []).some(j => j.kind === 'hold');
      h.push('<div class="ph-card"><h4>' + L('Større lasterom', 'A bigger hold') + ' (' + lv + '/3)</h4><p>' + L('Lengre lasterom og flere kasser. Tre trinn: +20 %, +40 % og +70 %. Mer last gjør båten tyngre.', 'A longer hold and more boxes. Three steps: +20%, +40% and +70%. More load makes her heavier.') + '</p>' +
        kv(L('Nå', 'Now'), fmt(BOAT.holdCap, 0) + ' kg') + (nx ? kv(L('Neste trinn', 'Next step'), fmt(Math.round(base * nx.x), 0) + ' kg · ' + kr(upPrice(nx.pc, nx.min)) + ' · ' + realDur(YARD_H * 60) + L(' på verftet', ' at the yard')) : '') +
        (!nx ? '<p><b>' + L('Fullt ombygd', 'Fully rebuilt') + '</b></p>' : queued ? '<p><b>' + L('På verftet', 'At the yard') + '</b></p>' : '<button class="ph-btn p" data-pa="holdup"' + (!atKind('verft') || S.cash < upPrice(nx.pc, nx.min) ? ' disabled' : '') + '>' + L('Bygg om · ', 'Rebuild · ') + kr(upPrice(nx.pc, nx.min)) + '</button>') + '</div>'); }
    // a bigger engine in two steps (core ENGUP; not for an outboard, which has the 90 hp outboard among the equipment)
    if (mode === 'verft'){ const b = S.boat, V = VESSELS[b.type], lv = b.engLv || 0, nx = ENGUP[lv], queued = (S.jobs || []).some(j => j.kind === 'eng');
      if (!V.outboard){ const P1 = nx ? powerX(Object.assign({}, b, {engLv:lv + 1})) : 0, v1 = nx ? V.vmax * speedOfPower(P1, V.planing) : 0;
        h.push('<div class="ph-card"><h4>' + L('Større motor', 'A bigger engine') + ' (' + lv + '/2)</h4><p>' + L('Mer kraft: +10 % og så +20 % mot motoren båten kom med. Det gir en jevn, men moderat fartsgevinst (Trim gir mye mer for en stund). Motoren bruker mer diesel, og servicen blir dyrere (+20 % og +50 %).', 'More power: +10% and then +20% over the boat\'s own engine. A steady but modest gain in speed (Trim gives far more for a while). The engine burns more diesel and the service costs more (+20% and +50%).') + '</p>' +
          kv(L('Nå', 'Now'), BOAT.hp + ' hk · ' + fmt(BOAT.vmax, 1) + ' kn') + (nx ? kv(L('Neste trinn', 'Next step'), Math.round(V.hp * (1 + nx.p)) + ' hk · ' + fmt(v1, 1) + ' kn · ' + kr(upPrice(nx.pc, nx.min)) + ' · ' + realDur(YARD_H * 60)) : '') +
          (!nx ? '<p><b>' + L('Største motor er montert', 'The biggest engine is fitted') + '</b></p>' : queued ? '<p><b>' + L('På verftet', 'At the yard') + '</b></p>' : '<button class="ph-btn p" data-pa="engup"' + (!atKind('verft') || S.cash < upPrice(nx.pc, nx.min) ? ' disabled' : '') + '>' + L('Bytt motor · ', 'Change the engine · ') + kr(upPrice(nx.pc, nx.min)) + '</button>') + '</div>'); } }
    // the other rebuilds of the boat itself (core UPGS): cabins, galley, drying room, insulated hold, fuel tank, stabilisation. None for gear.
    if (mode === 'verft'){ const b = S.boat, V = VESSELS[b.type];
      for (const k in UPGS){ const U = UPGS[k]; if (!U.fit(V)) continue; const lv = upgLv(b, k), nx = upgNext(b, k), queued = (S.jobs || []).some(j => j.kind === 'upg' && j.u === k), cur = lv ? U.steps[lv - 1] : null;
        h.push('<div class="ph-card"><h4>' + U[S.lang] + ' (' + lv + '/' + U.steps.filter(st => !st.minLen || V.len >= st.minLen).length + ')</h4><p>' + U.d[S.lang === 'no' ? 0 : 1] + '</p>' +
          (cur ? kv(L('Nå', 'Now'), cur[S.lang]) : '') + (nx ? kv(L('Neste trinn', 'Next step'), nx[S.lang] + ' · ' + kr(upPrice(nx.pc, nx.min)) + ' · ' + realDur(YARD_H * 60)) : '') +
          (!nx ? '<p><b>' + L('Fullt ombygd', 'Fully rebuilt') + '</b></p>' : queued ? '<p><b>' + L('På verftet', 'At the yard') + '</b></p>' : '<button class="ph-btn p" data-pa="upg" data-u="' + k + '"' + (!atKind('verft') || S.cash < upPrice(nx.pc, nx.min) ? ' disabled' : '') + '>' + L('Bygg om · ', 'Rebuild · ') + kr(upPrice(nx.pc, nx.min)) + '</button>') + '</div>'); } }
    for (const [k, E] of Object.entries(EQUIP)){
      if (!equipFits(k, S.boat.type) || yardEq(k) !== (mode === 'verft')) continue;
      const have = E.multi ? S.equip[k] : S.equip[k] ? 1 : 0, max = E.multi ? BOAT.jukseMax : 1;
      h.push('<div class="ph-card"><h4>' + E.name[S.lang] + (E.multi ? ' (' + have + '/' + max + ')' : '') + '</h4><p>' + E.desc[S.lang] + '</p>' + kv(L('Pris', 'Price'), kr(E.price)) + (have >= max ? '<p><b>' + L('Montert', 'Fitted') + '</b></p>' : (S.jobs || []).some(j => j.kind === 'fit' && j.k === k) ? '<p><b>' + L('Til montering', 'Being fitted') + '</b></p>' : '<button class="ph-btn" data-pa="equip" data-k="' + k + '"' + (atKind(EQ_YARD(k) ? 'verft' : 'butikk') && S.cash >= E.price ? '' : ' disabled') + '>' + L('Kjøp og monter', 'Buy and fit') + ' · ' + realDur(fitHours(k) * 60) + '</button>') + '</div>');
    }
    if (mode === 'butikk'){ const people = 1 + S.crew.length, c = S.clothes || {}, H = S.t / 60, cp = coldPen(H);
      h.push('<h4 style="margin:12px 2px 6px">' + L('Klær til mannskapet', 'Clothes for the crew') + '</h4><p class="ph-note">' + L('Kalde og våte hender fisker dårligere. Nå: effektiv temperatur ' + Math.round(effTemp(H)) + ' °C, fisket går ' + Math.round(cp * 100) + ' % tregere. Alle om bord trenger sine egne klær.', 'Cold, wet hands fish worse. Now: effective temperature ' + Math.round(effTemp(H)) + ' °C, fishing ' + Math.round(cp * 100) + '% slower. Everyone aboard needs their own.') + '</p>');
      for (const k of ['olje', 'varme']){ const C = CLOTHES[k], have = c[k] || 0;
        h.push('<div class="ph-card"><h4>' + C[S.lang] + ' (' + Math.min(have, people) + '/' + people + ')</h4><p>' + C.d[S.lang] + '</p>' + kv(L('Pris', 'Price'), kr(C.price)) + (have >= people ? '<p><b>' + L('Alle om bord har.', 'Everyone aboard has one.') + '</b></p>' : '<button class="ph-btn p" data-pa="cloth" data-k="' + k + '">' + L('Kjøp én', 'Buy one') + '</button>') + '</div>'); } }
    h.push('</div>'); return h.join('');
  }
  // --- gear: in the sea, aboard (baiting and mending), and the shop
  // ---- gear care (core/10b-gearcare.js): the condition of the gear aboard, and what the crew can do about it in port
  const pctOf = v => Math.round(v * 100) + ' %';
  const cbar = v => '<div class="ph-bar"><i style="width:' + Math.round(clamp(v, 0, 1) * 100) + '%"></i></div>';
  const cbtn = (a, attrs, label, ok, cls) => '<button class="ph-btn' + (cls ? ' ' + cls : '') + '" data-pa="' + a + '" ' + attrs + (ok === false ? ' disabled' : '') + '>' + label + '</button>';
  const qTxt = q => q ? ' · ' + (q.fee ? kr(q.fee) + ' · ' : '') + realDur(q.h * 60) : '';
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
      if (o.work) h.push(cbtn('gregn', 'data-lk="' + lk + '" data-n="' + n + '" data-b="' + u.b + '" data-m="self"', L('Egn ' + n + ' med ' + bn + ' selv', 'Bait ' + n + ' with ' + bn + ' yourselves') + ' · ' + fmt(kg, 0) + ' kg · ' + (hs.hands ? realDur(egnHours(lk, n, hs.eff) * 60) : '–'), (B[u.b] || 0) >= kg - 1e-9 && hs.hands > 0, o.shed ? '' : 'p'));
      if (o.work && (B[u.b] || 0) < kg - 1e-9) h.push('<p class="ph-note">' + L('Om bord: ' + fmt(B[u.b] || 0, 0) + ' kg ' + bn + '.', 'Aboard: ' + fmt(B[u.b] || 0, 0) + ' kg of ' + bn + '.') + '</p>');
      if (o.shed){ const fee = egnFee(lk, n, u.b); h.push(cbtn('gregn', 'data-lk="' + lk + '" data-n="' + n + '" data-b="' + u.b + '" data-m="shed"', L('Egnebua egner ' + n + ' med ' + bn, 'The shed baits ' + n + ' with ' + bn) + ' · ' + kr(fee), fee <= S.cash, 'p')); }
    } else {
      const groups = Object.keys(bt).filter(k => bt[k] > 0).sort((a, c) => bt[c] - bt[a]); if (!groups.includes(u.b)) u.b = groups[0];
      const n = u.n = clamp(u.n || bt[u.b], 1, bt[u.b]); if (u.t && (u.t === u.b || fit(u.t) < n)) u.t = '';
      h.push('<div class="egc-h">' + L('Fjern agnet fra', 'Take the bait off') + '</div><div class="bpick">' + groups.map(k => baitPickBtn('egnb', k, u.b === k, bt[k] + ' ' + tubs(bt[k]), false)).join('') + '</div>' + step(n, bt[u.b], tubs(n)) +
        '<div class="egc-h">' + L('Egn etterpå med', 'Then bait with') + '</div><div class="bpick">' + baitPickBtn('egnt', '', !u.t, L('la stå uegnet', 'leave unbaited'), false) +
        Object.keys(BAITS).filter(k => k !== u.b).map(k => baitPickBtn('egnt', k, u.t === k, fmt(B[k] || 0, 0) + ' kg', fit(k) < n)).join('') + '</div><div class="ph-btncol">');
      const hrs = hs.hands ? stripHours(lk, n, hs.eff) + (u.t ? egnHours(lk, n, hs.eff) : 0) : 0;
      h.push(cbtn('grstrip', 'data-lk="' + lk + '" data-b="' + u.b + '" data-n="' + n + '" data-t="' + (u.t || '') + '"', L('Fjern agnet fra ' + n + ' ' + tubs(n), 'Take the bait off ' + n + ' ' + tubs(n)) + (u.t ? L(' og egn med ' + baitLc(u.t), ' and bait with ' + baitLc(u.t)) : '') + ' · ' + (hs.hands ? realDur(hrs * 60) : '–'), hs.hands > 0, 'p'));
      h.push('<p class="ph-note">' + L('Det gamle agnet kastes.', 'The old bait is thrown away.') + '</p>');
    }
    h.push(cbtn('egnx', '', L('Avbryt', 'Cancel'), true, 'alt') + '</div></div>');
    return h.join('');
  }
  function careAboard(inPort, p){
    const pg = careInit(S.pgear), b = S.boat, h = [];
    for (const lk of ['hyse', 'bank']){ if (!pg.lines[lk].n && !tubState(lk).work.length) continue; h.push(lineCard(lk, {work:inPort, shed:b.status === 'port' && egnPort(p) && atKind('mottak'), care:true})); }
    const hk = '<p class="ph-note">' + L('Kroker på lager: ', 'Hooks in store: ') + pg.hooks + '. ' + L('Kjøpes i pakker på 100, 500 og 1000 i utstyrsbutikken.', 'Bought in packs of 100, 500 and 1000 at the tackle shop.') + '</p>';
    h.push(!pg.lines.hyse.n && !pg.lines.bank.n && !h.length ? '<div class="ph-card"><h4>' + L('Line', 'Line') + '</h4><p class="ph-note">' + L('Ingen line om bord.', 'No line aboard.') + '</p>' + hk + '</div>' : hk);
    // pots
    h.push('<div class="ph-card"><h4>' + L('Teiner', 'Pots') + '</h4>' + kv(POTS.big[S.lang], pg.pots.big));
    if (pg.pots.big){ h.push(kv(L('Stand', 'Condition'), pctOf(pg.potc.cond) + ' · ' + L('tak ', 'ceiling ') + pctOf(pg.potc.max)) + cbar(pg.potc.cond));
      if (inPort){ const qp = careQuote('pot', 0, false); if (qp) h.push('<div class="ph-btncol">' + cbtn('carepot', 'data-m="self"', L('Reparer teinene selv', 'Mend the pots yourselves') + qTxt(qp), true) + '</div>'); } }
    h.push('</div>');
    // the jig: the pilk and hooks that are mounted, and the spare sets
    if (b.gear || b.kgear){ h.push('<div class="ph-card"><h4>' + L('Juksa', 'Jig') + '</h4>'); const js = jigSets();
      for (const k of ['mark', 'kveite']){ if (k === 'mark' ? !b.gear : !b.kgear) continue; const J = pg.jig[k], js1 = js.find(x => x.k === k), on = js1 ? js1.on : jigKind() === k, qj = 1;
        h.push(kv(CARE.jig[k][S.lang] + (on ? ' · ' + L('i bruk', 'in use') : ''), pctOf(J.c) + ' · ' + J.n + ' ' + L('på lager', 'spare')) + cbar(J.c) + (js1 && js1.sp.length ? spChips(js1.sp) : js1 && js1.closed ? '<p class="ph-note">' + L('Kveita er fredet til og med 20. april.', 'Halibut is closed until 20 April.') + '</p>' : ''));
        const bt = []; if (!on) bt.push(cbtn('jigsel', 'data-k="' + k + '"', L('Bruk ', 'Use ') + CARE.jig[k][S.lang].toLowerCase(), true)); if (inPort && J.n > 0 && J.c < 0.98 && qj) bt.push(cbtn('carejig', 'data-k="' + k + '"', L('Bytt til nytt sett', 'Fit a new set'), true));
        if (bt.length) h.push('<div class="ph-btncol">' + bt.join('') + '</div>'); }
      h.push('<p class="ph-note">' + L('Pilk og kroker slites ved fiske. Reservesett kjøpes i utstyrsbutikken, og du velger her hva du fisker med.', 'Pilk and hooks wear with fishing. Spare sets are bought at the tackle shop, and you choose here what to fish with.') + '</p></div>'); }
    // buoys, bait and the crew's own upkeep
    const bk = Object.entries(baitOf(pg)).filter(e => e[1] > 0.05);
    h.push('<div class="ph-card" id="baitCard"><h4>' + L('Blåser og agn', 'Buoys and bait') + '</h4>' + kv(L('Blåsesett', 'Buoy sets'), pg.kits.n + (pg.kits.heavy ? ' (' + pg.kits.heavy + ' ' + L('med tung dregg', 'with heavy anchor') + ')' : '')) +
      (bk.length ? bk.map(e => kv((BAITS[e[0]] ? baitDot(e[0]) + BAITS[e[0]][S.lang] : e[0]) + (pg.pots.big ? ' <small>' + L('til ', 'for ') + Math.min(pg.pots.big, Math.floor(e[1] / GPRICE.potBait + 1e-9)) + L(' teiner', ' pots') + '</small>' : ''), fmt(e[1], 0) + ' kg')).join('') : kv(L('Agn', 'Bait'), L('ingen', 'none'))) +
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
        h.push('<div class="ph-card' + (st === 'lost' || st === 'late' ? ' conflict' : '') + '"><h4>' + (s.kind === 'line' && LINE_KINDS[s.lk] ? LINE_KINDS[s.lk][S.lang] : GEAR[s.kind][S.lang]) + ', ' + s.n + ' ' + unitName(s.kind, s.n) + '</h4>' +
          (bw ? kv(L('Agn', 'Bait'), Object.keys(bw).filter(k => bw[k] > 0).sort((a, c) => bw[c] - bw[a]).map(k => baitDot(k) + (s.kind === 'line' && Object.keys(bw).length > 1 ? bw[k] + ' ' : '') + baitLc(k)).join(' · ')) : '') +
          kv(L('Satt', 'Set'), dayStr(s.tSet / 60) + ' ' + hm(s.tSet / 60)) + kv(L('Ståtid', 'Soak'), fmt((S.t - s.tSet) / 60, 0) + ' t (' + realDur(S.t - s.tSet) + L(' ekte tid', ' real time') + ') · ' + L(SETST[st][0], SETST[st][1])) + kv(L('Posisjon', 'Position'), coordStr(setMid(s)) + ', ' + s.depth + ' m') +
          (s.kind === 'garn' ? kv(L('Maskevidde og stand', 'Mesh and condition'), netNo(s) + ' · ' + Math.round((s.cond || 1) * 100) + ' %') : '') + (s.heavy ? kv(L('Dregg', 'Anchor'), L('tung', 'heavy')) : '') +
          (!s.lost && ['idle', 'port', 'sailing'].includes(b.status) ? '<button class="ph-btn p" data-pa="goset" data-id="' + s.id + '">' + L('Kjør dit', 'Go there') + ' · ' + fmt(Math.min(dist(b.pos, s.a), dist(b.pos, s.b)) / NM, 1) + ' nm</button>' : '') +
          (s.lost ? '<p class="ph-note">' + L('Blåsene er borte. Tapt redskap skal meldes til Kystvakten med type, mengde og siste posisjon.', 'The buoys are gone. Lost gear must be reported to the Coast Guard with type, amount and last position.') + '</p><button class="ph-btn p" data-pa="grrep" data-id="' + s.id + '">' + L('Meld tapt redskap', 'Report lost gear') + '</button>' : '') + '</div>'); }
      h.push('<p class="ph-note">' + L('Line er best innen et døgn. Etter 24 timer tar marfloen fisken. Teiner bør stå minst 20 timer og trekkes innen 48. Garn trekkes helst hver dag. Om sommeren går fisken fort i garnet.', 'Line is best within a day. After 24 hours the amphipods take the fish. Pots should stand at least 20 hours and be hauled within 48. Nets are best hauled daily. In summer the fish spoils fast in the net.') + '</p>');
    } else if (tab === 'bord'){
      h.push('<div class="ph-card"><h4>' + L('Garn', 'Nets') + '</h4>' + (pg.nets.length ? '' : '<p class="ph-note">' + L('Ingen garn om bord.', 'No nets aboard.') + '</p>'));
      for (const l of pg.nets){ h.push('<div class="ph-kv"><span>' + l.n + ' garn ' + netNo(l) + '</span><span>' + Math.round(l.cond * 100) + ' % · ' + L('tak ', 'ceiling ') + Math.round(nMax(l) * 100) + ' %</span></div><div class="ph-bar"><i style="width:' + Math.round(l.cond * 100) + '%"></i></div>');
        if ((inPortNow || seaWork()) && l.cond < nMax(l) - 0.05) h.push('<div class="ph-btncol"><button class="ph-btn" data-pa="grmend" data-id="' + l.id + '" data-m="self">' + L('Bøt selv', 'Mend yourselves') + '</button>' + (botPort(p) ? '<button class="ph-btn" data-pa="grmend" data-id="' + l.id + '" data-m="bot">' + L('Lever til bøteriet', 'Leave at the net loft') + ' (' + kr(Math.round(GPRICE.bot * l.n * (nMax(l) - l.cond) / 0.1)) + ')</button>' : '') + '</div>');
        if (l.n >= 2) h.push('<button class="ph-btn alt" data-pa="grsplit" data-id="' + l.id + '">' + L('Del lenka i to', 'Split the string') + '</button>'); }
      if (pg.nets.length >= 2){ const m = {}; for (const l of pg.nets) (m[netKey(l.ty, l.mesh)] = m[netKey(l.ty, l.mesh)] || []).push(l); for (const k in m) if (m[k].length >= 2) h.push('<button class="ph-btn alt" data-pa="grjoin" data-a="' + m[k][0].id + '" data-b="' + m[k][1].id + '">' + L('Slå sammen lenker på ' + k.replace(':', ' ') + ' mm', 'Join strings of ' + k.replace(':', ' ') + ' mm') + '</button>'); }
      h.push('</div>' + careAboard(inPortNow || seaWork(), p));
      const shore = pg.shore.filter(j => j.ready); if (shore.length) h.push('<div class="ph-card"><h4>' + L('På land', 'Ashore') + '</h4>' + shore.map(j => kv(j.kind === 'egn' ? j.n + ' ' + L('stamper i egnebua', 'tubs at the baiting shed') : j.n + ' ' + L('garn på bøteriet', 'nets at the net loft'), portById(j.port).name + ', ' + L('klar ', 'ready ') + (S.t >= j.ready ? L('nå', 'now') : hm(j.ready / 60)))).join('') + '</div>');
    } else {
      // quantities follow the room aboard: a skiff gets fewer nets per button than a sjark
      const room = k => gearRoom(k), cap = w => w === 'net' ? room('garn') : w === 'stamp' ? room('line') : w === 'pot' ? room('teine') : w === 'kit' ? kitRoomNow() : 1e9;
      const gated = new Set(), buy = (w, s, n0, lbl, unit) => { const gate = buyGate(w, s), gk = w === 'jig' ? w + s : w; if (gate){ if (gated.has(gk)) return ''; gated.add(gk); return '<p class="ph-note"><b>' + gate[0] + '</b></p>'; }   // the one rule for what can be bought (core/10-gear.js buyGate)
        const n = Math.max(1, Math.min(n0, cap(w))), price = n * unit, ok = cap(w) >= 1 && price <= S.cash && inPortNow;
        return '<button class="ph-btn' + (ok ? ' p' : '') + '"' + (ok ? '' : ' disabled') + ' data-pa="grbuy" data-w="' + w + '" data-s="' + s + '" data-n="' + n + '">' + lbl(n) + ' (' + kr(price) + ')</button>'; };
      if (!inPortNow) h.push('<div class="ph-card"><p class="ph-note">' + L('Redskap kjøpes i havn.', 'Gear is bought in port.') + '</p></div>');
      h.push('<div class="ph-card"><h4>' + L('Torskegarn', 'Cod nets') + '</h4><p>' + L('Garn settes i lenker mellom to blåser. 156 mm er vanlig torskegarn, 180 og 200 mm tar større fisk som skrei. Flytegarn fisker høyere og tar mest sei. Blåkveitegarn (360 mm) tar blåkveite og kveite. Minste lovlige maskevidde nord for 62° N er 156 mm. Garn krever minst to om bord. Plass til ', 'Nets are set in strings between two buoys. 156 mm is the usual cod net; 180 and 200 mm take bigger fish such as skrei. Floating nets fish higher and take mostly saithe. Greenland halibut nets (360 mm) take Greenland halibut and halibut. The smallest legal mesh north of 62° N is 156 mm. Nets need at least two aboard. Room for ') + room('garn') + L(' til.', ' more.') + '</p><div class="ph-btncol">' + NETOPT.map(o => buy('net', netKey(o[0], o[1]), 10, n => n + L(' garn ', ' nets ') + (o[0] === 'bunn' ? '' : L(NETTY[o[0]].no, NETTY[o[0]].en).toLowerCase() + ' ') + o[1] + ' mm', NETTY[o[0]].price)).join('') + '</div></div>');
      h.push('<div class="ph-card"><h4>' + L('Line', 'Line') + '</h4><p>' + L('Hyseline har ca. 600 kroker per stamp og tar mest hyse. Bankline har ca. 300 større kroker og tar lange, brosme, kveite og blåkveite. Lina egnes med det agnet du velger, i havn eller av mannskapet på sjøen. Plass til ', 'Haddock line has about 600 hooks a tub and takes mostly haddock. Bank line has about 300 bigger hooks and takes ling, tusk, halibut and Greenland halibut. The line is baited with the bait you choose, in port or by the crew at sea. Room for ') + room('line') + L(' stamper til.', ' more tubs.') +
        // the way to make room (Adrian 21.10.2026: haddock line out for more bank line): the shop's Service buys unbaited tubs back
        (ownedUnits('line') ? L(' Line du ikke trenger, selger du tilbake under Service (uegnede stamper).', ' Line you do not need is sold back under Service (unbaited tubs).') : '') + '</p><div class="ph-btncol">' + ['hyse', 'bank'].map(lk => buy('stamp', lk, 4, n => n + (n === 1 ? L(' stamp ', ' tub of ') : L(' stamper ', ' tubs of ')) + LINE_KINDS[lk][S.lang].toLowerCase(), LINE_KINDS[lk].price)).join('') + '</div></div>');
      h.push('<div class="ph-card"><h4>' + L('Teiner', 'Pots') + '</h4><p>' + L('For kongekrabbe, som fiskes fritt vest for 26° Ø, men nesten bare finnes i Finnmark. Teinene er store og må trekkes med teinehaler. Det er høyst 30 per fartøy. Uten krabbekar lever krabben rundt et døgn. Plass til ', 'For king crab, fished freely west of 26° E but found almost only in Finnmark. The pots are big and need a pot hauler. At most 30 a vessel. Without a crab tank a crab lives about a day. Room for ') + room('teine') + L(' til.', ' more.') + '</p><div class="ph-btncol">' + buy('pot', 'big', 20, n => n + ' ' + POTS.big[S.lang].toLowerCase(), POTS.big.price) + '</div></div>');
      // bait is sold at the fish plant, not here (docs/handelssteder.md; buyGear refuses it at the shop)
      h.push('<div class="ph-card"><h4>' + L('Blåser og dregg', 'Buoys and anchors') + '</h4><p>' + L('Hvert sett i sjøen trenger et blåsesett: to blåser med stake, flagg og dregg. Tung dregg holder bedre i storm og strøm.', 'Each set in the sea needs a buoy set: two buoys with pole, flag and anchor. A heavy anchor holds better in storm and current.') + '</p><div class="ph-btncol">' +
        buy('kit', 0, 1, () => L('Blåsesett', 'Buoy set'), GPRICE.kit) + (pg.kits.heavy < pg.kits.n ? buy('heavy', 0, 1, () => L('Tung dregg', 'Heavy anchor'), GPRICE.heavy) : '') + '</div><p class="ph-note">' + L('Agn selges på fiskemottaket (Mottak › Agn).', 'Bait is sold at the fish plant (Plant › Bait).') + '</p></div>');
      h.push('<div class="ph-card"><h4>' + L('Kroker og juksautstyr', 'Hooks and jig tackle') + '</h4><p>' + L('Ny line kommer komplett med kroker. Slitte eller bøyde kroker byttes mot kroker fra lageret, under Om bord. Pilk og kroker til juksa slites og byttes på samme måte. Blåsesett og dregger kan ikke kjøpes i flere enn redskapet ditt kan bruke.', 'New line comes complete with hooks. Worn or bent hooks are changed from the store, under Aboard. The jig\'s pilk and hooks wear and are changed the same way. Buoy sets and anchors cannot be bought in greater numbers than your gear can use.') + '</p><div class="ph-btncol">' +
        buy('hooks', 100, 1, () => L('100 kroker', '100 hooks'), CARE.hookKr[100]) + buy('hooks', 500, 1, () => L('500 kroker', '500 hooks'), CARE.hookKr[500]) + buy('hooks', 1000, 1, () => L('1000 kroker', '1000 hooks'), CARE.hookKr[1000]) +
        buy('jig', 'mark', 1, () => L('Markkroker og pilk (sett)', 'Fly hooks and pilk (set)'), CARE.jig.mark.kr) + buy('jig', 'kveite', 1, () => L('Kveitepilk (sett)', 'Halibut pilk (set)'), CARE.jig.kveite.kr) + '</div></div>');
      h.push('<p class="ph-note">' + L('Halere finner du under Butikk › Elektronikk og haler. Prisene er foreløpige.', 'Haulers are under Shop › Electronics and haulers. Prices are provisional.') + '</p>');
    }
    return h.join('') + '</div>';
  }
