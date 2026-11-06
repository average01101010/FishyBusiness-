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
    if (b.status !== 'port' && holdLoad() >= capHold() - 1) A('full', 'Full last', 'Hold full', 'beholdning:last');
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
    let nx = null; try { const e = nextEvent(); if (e) nx = {t:e.t, txt:e.txt}; } catch (e){}   // the vessel's next event (ui/04-panels-instruments.js), for her card in Rederi
    return {name:S.boatName, type:b.type, status:statusText(), nx, pos:b.status === 'port' ? portById(b.port).name : fieldCode(b.pos) + ' · ' + L('nær ', 'near ') + nearestPort(b.pos).name,
      hold:holdTotal(), cap:capHold(), fuel:b.fuel, fuelCap:BOAT.fuelCap, ice:b.ice, iceCap:BOAT.iceCap, crew:S.crew.length, crewMax:BOAT.crewMax, ops:o, sk, now:!o ? null : o.v === DRV2 ? [PLAN2UI.nowOf(o)[0], PLAN2UI.nowOf(o)[0]] : driftNow(o), inc, al, inPort:b.status === 'port'};
  }
  const summaries = () => S.fleet.map(v => ({v, s:withVessel(v, vSummary)}));
  const alerts = () => summaries().flatMap(x => x.s.al);
  // UI 2, U2-5 (docs/planer/ui-2-staaende.md 4.6, Jonas 06.11.2026, V5 A: the fleet first; V1 A: the phone upright is the measure). One card
  // a vessel with her name and type, her state with a dot, the next event with the countdown, hold and diesel as two bars, her own alerts
  // as lines on the card, and the buttons: «Ta roret» is the main button when both vessels lie in port, otherwise «Følg» is, and «Ta roret»
  // stands grey with the reason under its label (data-why, as the row's buttons from U2-3). The rule that both must lie in port is the
  // game's (vboard in 14-act.js); the card only says it. Rename, Sell and the broker's offers sit behind «⋯». Under the fleet: the company
  // card, the year's accounts as one line with the way to the bank (the loans and the balance sheet are in the bank's Regnskap tab), and
  // Foretaket last as before
  function rederi(){
    const all = summaries(), H = S.t / 60, no = S.lang === 'no';
    const bar = (a, c, k) => '<div class="ph-bar"><i class="' + (k || '') + '" style="width:' + Math.round(clamp(a / Math.max(1, c), 0, 1) * 100) + '%"></i></div>';
    const meV = vesselById(S.me), meIn = !meV || vget(meV, 'boat').status === 'port', why = no ? 'Begge må ligge i havn' : 'Both must be in port';
    const h = ['<div class="ph-c">'];
    for (const {v, s: sm} of all){
      const vb = vget(v, 'boat'), cur = v.id === S.cur, me = v.id === S.me, inp = vb.status === 'port', canBoard = !me && inp && meIn;
      const dot = /engine|adrift|aground/.test(vb.status) ? 'bad' : sm.al.length ? 'warn' : inp ? 'port' : 'ok';
      const tags = (me ? '<span class="fl-tag">' + L('Om bord', 'Aboard') + '</span>' : '') + (cur && all.length > 1 ? '<span class="fl-tag">' + L('Følger', 'Following') + '</span>' : '');
      const meta = [L('Mannskap ', 'Crew ') + sm.crew + ' / ' + sm.crewMax];
      if (sm.iceCap > 0) meta.push(L('Is ', 'Ice ') + fmt(sm.ice, 0) + ' / ' + sm.iceCap + ' kg');
      if (sm.inc > 0) meta.push(L('Inntekt i dag ', 'Income today ') + kr(Math.round(sm.inc)));
      // the buttons: the main one first, then the second, then «⋯» with the rest
      const take = me ? '' : '<button class="ph-btn' + (canBoard ? ' p' : '') + '" data-pa="vboard" data-id="' + v.id + '"' + (canBoard ? '' : ' disabled data-why="' + why + '"') + '>' + L('Ta roret', 'Take the helm') + '</button>';
      const follow = cur ? '' : '<button class="ph-btn ' + (canBoard ? 'alt' : 'p') + '" data-pa="vfollow" data-id="' + v.id + '">' + L('Følg', 'Follow') + '</button>';
      const more = ['<button class="ph-btn alt" data-pa="vname" data-id="' + v.id + '">' + L('Gi nytt navn', 'Rename') + '</button>'];
      if (!me && all.length > 1){ const sw = !inp ? L('Må ligge i havn', 'Must lie in port') : tiLocked(v) ? L('Går i innbytte', 'Being traded in') : '';
        more.push('<button class="ph-btn red" data-pa="vsell" data-id="' + v.id + '"' + (sw ? ' disabled data-why="' + sw + '"' : '') + '>' + L('Selg for ', 'Sell for ') + kr(vesselValue(v)) + '</button>'); }
      // the broker (Kystmegleren and delivery, M4): what is under way stands on the card, the offers sit behind «⋯»
      const mg = me ? '' : mgOwnRow(v), mgOn = !me && (mktOwn(v.id) || (mktState().del || []).some(d => d.vid === v.id));
      if (mg && !mgOn) more.push(mg);
      h.push('<div class="ph-card fl"><div class="fl-h"><h4>«' + vget(v, 'boatName') + '»' + (me ? ' ⚓' : '') + '</h4>' + tags + '</div><p class="ph-note fl-type">' + VESSELS[vb.type].name[S.lang] + '</p>' +
        '<div class="fl-st"><i class="fl-dot ' + dot + '"></i><span>' + sm.status + (inp ? '' : ' · ' + sm.pos) + '</span></div>' +
        (sm.nx ? '<div class="fl-nx">⏱ ' + sm.nx.txt + ' ' + hm(sm.nx.t / 60) + ' <small>· ' + inReal(sm.nx.t - S.t) + '</small></div>' : '') +
        '<div class="fl-bars"><div><span>' + L('Last', 'Hold') + ' <b>' + fmt(sm.hold, 0) + ' / ' + fmt(sm.cap, 0) + ' kg</b></span>' + bar(sm.hold, sm.cap, sm.hold >= sm.cap - 1 ? 'warn' : '') + '</div>' +
        '<div><span>' + L('Diesel', 'Diesel') + ' <b>' + fmt(sm.fuel, 0) + ' / ' + sm.fuelCap + ' L</b></span>' + bar(sm.fuel, sm.fuelCap, sm.fuel < sm.fuelCap * 0.2 ? 'bad' : '') + '</div></div>' +
        '<p class="ph-note fl-meta">' + meta.join(' · ') + (sm.ops && sm.ops.on && sm.now ? '<br>' + L('Driftsplan: ', 'Plan: ') + L(sm.now[0], sm.now[1]) : '') + '</p>' +
        sm.al.map(a => '<div class="fl-al"><span>' + L(a.no, a.en) + '</span><button class="ph-btn sm" data-pa="goto" data-id="' + a.id + '" data-a="' + a.app + '">' + L('Åpne', 'Open') + '</button></div>').join('') +
        (mgOn ? mg : '') +
        '<div class="fl-btns">' + (canBoard ? take + follow : follow + take) + '<details class="fl-more"><summary aria-label="' + L('Mer', 'More') + '">⋯</summary><div class="fl-menu">' + more.join('') + '</div></details></div></div>');
    }
    h.push('<div class="ph-card"><h4>' + (S.company || L('Rederiet', 'The company')) + '</h4>' + kv(L('Båter', 'Vessels'), all.length) + kv(L('Konto', 'Account'), kr(S.cash)) + kv(L('Inntekt i dag', 'Income today'), kr(Math.round(all.reduce((a, x) => a + x.s.inc, 0)))) + '</div>');
    // the year's result from the books (tilbakemelding #9, Jonas 09.10.2026; Økonomi 2, Ø1): one line, the whole accounts, the loans and the balance sheet in the bank's Regnskap tab
    { const yR = bookResult(yearH(H)), dep = Math.round(depBase() * TAX.dep * yearFrac(H));
      h.push('<div class="ph-card fl-acc"><span>' + L('Regnskap ', 'Accounts ') + yearH(H) + ': ' + kr(yR.res - dep) + L(' før skatt', ' before tax') + '</span><button class="ph-btn sm" data-pa="open" data-a="bank" data-s="regnskap">' + L('Bank', 'Bank') + ' ›</button></div>'); }
    h.push('<h4 style="margin:10px 2px 6px">' + L('Foretaket', 'The business') + '</h4>' + papBiz());   // from the Sjømann app (Jonas 09.10.2026)
    h.push('</div>'); return h.join('');
  }
  // --- equipment
