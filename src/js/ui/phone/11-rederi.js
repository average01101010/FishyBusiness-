  const SEL_APPS = ['drift', 'fartoy', 'utstyr', 'utstyrb', 'redskap', 'mannskap', 'bors', 'verksted'];
  const DRAWER = new Set(['drift', 'arbeid', 'rigg', 'fiske', 'service', 'fartoy', 'utstyr', 'utstyrb', 'redskap', 'mannskap', 'bors', 'bank', 'verksted', 'havn', 'last', 'lever', 'is', 'agn', 'oppdrag', 'beholdning', 'maler']);
  let selV = null;
  const selVessel = () => (selV && vesselById(selV)) || curVessel();
  const withSel = fn => withVessel(selVessel(), fn);
  function selRow(){ if (S.fleet.length < 2) return ''; const s0 = selVessel(); return '<div class="ph-sub">' + S.fleet.map(v => '<button class="' + (v === s0 ? 'on' : '') + '" data-pa="vsel" data-id="' + v.id + '">' + vget(v, 'boatName') + (v.id === S.me ? ' ⚓' : '') + '</button>').join('') + '</div>'; }
  // the bound vessel at a glance, with what needs attention
  function vSummary(){
    const b = S.boat, H = S.t / 60, o = DRIFT2 ? plan2Ops() : S.ops, sk = opsSkipper(), day = gDate(H).toISOString().slice(0, 10), al = [];   // (Driftsplan 2: the v4 plan, an older one switched off with its message)
    const inc = S.sales.filter(x => x.v === S.cur && gDate(x.t / 60).toISOString().slice(0, 10) === day).reduce((a, x) => a + x.total, 0);
    const A = (k, no, en, app) => al.push({id:S.cur, k, no, en, app});
    if (b.status === 'engine') A('eng', 'Motorstopp', 'Engine stopped', 'redning');
    if (b.status === 'adrift') A('drift', 'Driver uten drivstoff', 'Adrift without fuel', 'redning');
    if (b.fuel < BOAT.fuelCap * 0.2) A('fuel', 'Lite drivstoff, ' + fmt(b.fuel, 0) + ' L', 'Low on fuel, ' + fmt(b.fuel, 0) + ' L', 'beholdning:boat');
    if (b.status !== 'port' && catchIce() && !holdFreezes() && b.ice < 1 && holdTotal() > 0) A('ice', 'Tom for is, fangsten ises ikke', 'Out of ice, the catch is not iced', 'beholdning:last');
    if (b.status !== 'port' && holdTotal() >= capHold() - 1) A('full', 'Full last', 'Hold full', 'beholdning:last');
    if (svcOverdue() > 0) A('svc', 'Motorservice er forfalt', 'Engine service overdue', 'verksted');
    if (S.cevt) A('cevt', 'Uløst krangel om bord', 'Unresolved quarrel aboard', 'mannskap');
    for (const c of S.crew) if ((c.low || 0) > 12) A('quit' + c.id, c.name.split(' ')[0] + ' vurderer å slutte', c.name.split(' ')[0] + ' is thinking of quitting', 'mannskap');
    for (const s of (S.sets || []).filter(x => x.vid === S.cur)){ const a = (S.t - s.tSet) / 60;
      if (s.lost) A('lost' + s.id, GEAR[s.kind].no + ' er tapt. Meld tapt redskap', GEAR[s.kind].en + ' lost. Report the lost gear', 'redskap');
      else if (s.kind === 'teine' ? a >= 44 : s.kind === 'line' ? a >= 24 : a >= 48) A('soak' + s.id, GEAR[s.kind].no + ' har stått i ' + fmt(a, 0) + ' t', GEAR[s.kind].en + ' has soaked ' + fmt(a, 0) + ' h', 'beholdning:gear'); }
    if (S.pgear && S.pgear.nets.some(l => l.cond < 0.35)) A('worn', 'Slitte garn bør bøtes', 'Worn nets should be mended', 'beholdning:gear');
    if (o && !o.on && o.stop) A('ops', 'Driftsplanen har stoppet: ' + o.stop.no, 'The plan has stopped: ' + o.stop.en, 'drift');
    else if (o && o.on && o.held) A('ops', 'Driftsplanen venter til du gir båten tilbake', 'The plan waits until you give the boat back', 'drift');
    if (access() !== 'none'){ const lim = codLimitNow(H); if (lim > 0 && quotaState().torsk >= lim * 0.9) A('quota', 'Torskekvoten er nesten brukt opp', 'The cod quota is nearly used up', 'kvote'); }
    return {name:S.boatName, type:b.type, status:statusText(), pos:b.status === 'port' ? portById(b.port).name : fieldCode(b.pos) + ' · ' + L('nær ', 'near ') + nearestPort(b.pos).name,
      hold:holdTotal(), cap:capHold(), fuel:b.fuel, fuelCap:BOAT.fuelCap, ice:b.ice, iceCap:BOAT.iceCap, crew:S.crew.length, crewMax:BOAT.crewMax, ops:o, sk, now:!o ? null : o.v === DRV2 ? [PLAN2UI.nowOf(o)[0], PLAN2UI.nowOf(o)[0]] : driftNow(o), inc, al, inPort:b.status === 'port'};
  }
  const summaries = () => S.fleet.map(v => ({v, s:withVessel(v, vSummary)}));
  const alerts = () => summaries().flatMap(x => x.s.al);
  function rederi(){
    const all = summaries(), al = all.flatMap(x => x.s.al), bar = (a, c, k) => '<div class="ph-bar"><i class="' + (k || '') + '" style="width:' + Math.round(clamp(a / Math.max(1, c), 0, 1) * 100) + '%"></i></div>';
    const h = ['<div class="ph-c"><div class="ph-card"><h4>' + (S.company || L('Rederiet', 'The company')) + '</h4>' + kv(L('Båter', 'Vessels'), all.length) + kv(L('Konto', 'Account'), kr(S.cash)) + kv(L('Inntekt i dag', 'Income today'), kr(Math.round(all.reduce((a, x) => a + x.s.inc, 0)))) + '</div>'];
    // the company's books (tilbakemelding #9, Jonas 09.10.2026: «lånedetaljer burde stå i regnskapet til rederiet»): the year's result, each
    // loan with its balance, rate, instalment and the interest paid on it, and what the company owns against what it owes
    { const fleetV = all.reduce((a, x) => a + vesselValue(x.v), 0), D = debt(), res = S.stats.revenue - S.stats.costs;
      const loanRows = k => { const Q = S[k]; if (!Q) return ''; return '<p class="ph-note" style="margin:8px 0 2px"><b>' + (k === 'loanIN' ? L('Risikolån, ', 'Risk loan, ') : L('Båtlån, ', 'Vessel loan, ')) + LOANS[k].who + '</b></p>' +
        kv(L('Restgjeld', 'Balance'), kr(Math.round(Q.bal))) + kv(L('Rente', 'Interest'), fmt(Q.rate * 100, 1) + ' %') + kv(L('Terminbeløp', 'Monthly payment'), kr(Q.pay)) +
        kv(L('Neste trekk', 'Next payment'), dayStr(Q.next / 60)) + kv(L('Renter betalt', 'Interest paid'), kr(Math.round(Q.intPaid || 0))); };
      h.push('<div class="ph-card"><h4>' + L('Regnskap', 'Accounts') + '</h4>' + kv(L('Inntekter', 'Revenue'), kr(S.stats.revenue)) + kv(L('Kostnader', 'Costs'), kr(S.stats.costs)) +
        kv(L('Resultat', 'Result'), kr(res)) + (S.loan || S.loanIN ? loanRows('loan') + loanRows('loanIN') : '<p class="ph-note">' + L('Rederiet har ingen lån.', 'The company has no loans.') + '</p>') +
        '<p class="ph-note" style="margin:8px 0 2px"><b>' + L('Balanse', 'Balance sheet') + '</b></p>' + kv(L('Flåten (verdi)', 'The fleet (value)'), kr(fleetV)) + kv(L('Konto', 'Account'), kr(Math.round(S.cash))) +
        kv(L('Gjeld', 'Debt'), kr(Math.round(D))) + kv(L('Egenkapital', 'Equity'), kr(Math.round(fleetV + S.cash - D))) +
        '<button class="ph-btn" data-pa="open" data-a="bank">' + L('Til banken (nedbetaling og nye lån)', 'To the bank (repayment and new loans)') + '</button></div>'); }
    h.push('<h4 style="margin:10px 2px 6px">' + L('Trenger deg', 'Needs you') + (al.length ? ' (' + al.length + ')' : '') + '</h4>');
    if (!al.length) h.push('<p class="ph-note">' + L('Alt er i orden i flåten.', 'All is well in the fleet.') + '</p>');
    for (const a of al) h.push('<div class="ph-card"><div class="ph-kv"><span><b>«' + vget(vesselById(a.id), 'boatName') + '»</b> ' + L(a.no, a.en) + '</span><span><button class="ph-btn" style="margin:0" data-pa="goto" data-id="' + a.id + '" data-a="' + a.app + '">' + L('Åpne', 'Open') + '</button></span></div></div>');
    h.push('<h4 style="margin:10px 2px 6px">' + L('Flåten', 'The fleet') + '</h4>');
      const meV = vesselById(S.me), meIn = !meV || vget(meV, 'boat').status === 'port';
      for (const {v, s: sm} of all){
        const vb = vget(v, 'boat'), cur = v.id === S.cur, me = v.id === S.me, inp = vb.status === 'port';
        h.push('<div class="ph-card"><h4>«' + vget(v, 'boatName') + '»' + (me ? ' ⚓' : '') + '</h4>' + '<p class="ph-note">' + VESSELS[vb.type].name[S.lang] + '</p>' + kv('Status', sm.status) + kv(L('Posisjon', 'Position'), sm.pos) +
          kv(L('Last', 'Hold'), fmt(sm.hold, 0) + ' / ' + fmt(sm.cap, 0) + ' kg') + bar(sm.hold, sm.cap) + kv(L('Drivstoff', 'Fuel'), fmt(sm.fuel, 0) + ' / ' + sm.fuelCap + ' L') + bar(sm.fuel, sm.fuelCap, sm.fuel < sm.fuelCap * 0.2 ? 'bad' : '') + kv(L('Is', 'Ice'), fmt(sm.ice, 0) + ' / ' + sm.iceCap + ' kg') +
          kv(L('Mannskap', 'Crew'), sm.crew + ' / ' + sm.crewMax) + kv(L('Driftsplan', 'Operations plan'), !sm.ops ? L('ingen', 'none') : L(sm.now[0], sm.now[1])) + kv(L('Inntekt i dag', 'Income today'), kr(Math.round(sm.inc))) +
          '<p class="ph-note">' + L('Adgang: ', 'Access: ') + accessText(v) + '</p>' +
          (me ? '<p class="ph-note">' + L('Du er om bord på denne båten.', 'You are aboard this vessel.') + '</p>' : '') + (cur && S.fleet.length > 1 ? '<p class="ph-note">' + L('Denne båten følger du nå.', 'You are following this vessel.') + '</p>' : '') +
          '<div class="ph-btncol">' + (cur ? '' : '<button class="ph-btn p" data-pa="vfollow" data-id="' + v.id + '">' + L('Følg denne båten', 'Follow this vessel') + '</button>') +
          (me ? '' : '<button class="ph-btn" data-pa="vboard" data-id="' + v.id + '"' + (inp && meIn ? '' : ' disabled') + '>' + L('Gå om bord', 'Go aboard') + '</button>') +
          '<button class="ph-btn alt" data-pa="vname" data-id="' + v.id + '">' + L('Gi nytt navn', 'Rename') + '</button>' +
          (me || S.fleet.length < 2 ? '' : '<button class="ph-btn red" data-pa="vsell" data-id="' + v.id + '"' + (inp && !tiLocked(v) ? '' : ' disabled') + '>' + L('Selg for ', 'Sell for ') + kr(vesselValue(v)) + '</button>') + '</div>' +
          (!me && !(inp && meIn) ? '<p class="ph-note">' + L('For å bytte båt må begge ligge i havn.', 'To change vessel, both must be in port.') + '</p>' : '') + '</div>');
      }
    h.push('<h4 style="margin:10px 2px 6px">' + L('Foretaket', 'The business') + '</h4>' + papBiz());   // from the Sjømann app (Jonas 09.10.2026)
    h.push('</div>'); return h.join('');
  }
  // --- equipment
