// ===== the Drift app: the operations plan of a vessel (core/06d-drift.js) on one screen (23.10.2026, Jonas: «så intuitivt som mulig»).
// At the top Start or Pause, and what the boat does now, with the button that fixes what stops her. Then the answers, a row each, opened
// where they are tapped: Hjem, Fiske, Plasser, Levering, Vær, Rytme, Mannskap. Then the trip as a timeline («I dag»), and the last seven
// days. The places are put in the chart plotter: tap the chart where the field or the jig place shall be, and «Bruk plassen». =====
const DRIFTUI = (() => {
  const L = (no, en) => S.lang === 'no' ? no : en;
  const nm = id => (portById(id) || {name:'?'}).name;
  let open = null, adding = null, busy = false;
  const rerender = () => { if (typeof refreshAll === 'function') refreshAll(); else if (typeof PHONE !== 'undefined') PHONE.render(); };
  const B = (a, label, extra, cls) => '<button class="ph-btn' + (cls ? ' ' + cls : '') + '" data-pa="' + a + '"' + (extra ? ' ' + extra : '') + '>' + label + '</button>';
  const T = (a, label, on, extra) => '<button data-pa="' + a + '" class="' + (on ? 'on' : '') + '"' + (extra ? ' ' + extra : '') + '>' + label + '</button>';
  const BIG = (a, label, sub, on, extra, off) => '<button class="dr-big' + (on ? ' on' : '') + '" data-pa="' + a + '"' + (extra ? ' ' + extra : '') + (off ? ' disabled' : '') + '><b>' + label + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</button>';
  const STEP = (a, val, extra) => '<span class="dr-st"><button data-pa="' + a + '" data-d="-1"' + (extra || '') + ' aria-label="−">−</button><output>' + val + '</output><button data-pa="' + a + '" data-d="1"' + (extra || '') + ' aria-label="+">+</button></span>';
  const km = (p, q) => fmt(dist(p, q) / NM, 1) + ' nm';
  // a row: what it is, what is chosen, and the choices when it is open
  function row(k, label, value, body, bad){
    const on = open === k && !!body;
    return '<div class="dr-row' + (on ? ' on' : '') + (bad ? ' bad' : '') + '"><button class="dr-rh" data-pa="dr-row" data-k="' + k + '"><span class="dr-rl">' + label + '</span><span class="dr-rv">' + value + '</span><span class="dr-rc">' + (body ? (on ? '▾' : '›') : '') + '</span></button>' + (on ? '<div class="dr-rb">' + body() + '</div>' : '') + '</div>';
  }
  const kindName = id => { const p = portById(id); if (!p) return ''; if (id === (S.home || HOME0)) return L('naustet', 'the naust'); if (isRorbu(id)) return L('rorbu', 'rorbu');
    const k = portKind(p); return k === 'mottak' ? L('fiskemottak', 'fish plant') : k === 'verft' ? L('verft', 'yard') : k === 'butikk' ? L('butikk', 'shop') : L('kai', 'quay'); };
  // ---- Hjem: where she lies and the crew sleep
  function homeOpts(o){
    const b = S.boat, here = b.status === 'port' ? b.port : nearestPort(b.pos).id, p0 = portById(here).p, home = S.home || HOME0, out = [];
    const add = id => { const p = portById(id); if (!p || out.some(q => q.id === id)) return; out.push({id, d:dist(p.p, p0)}); };
    add(here); if (portById(home) && dist(portById(home).p, p0) < 80) add(home); if (o.home) add(o.home);
    try { for (const R of rorbuSites(p0, 40).slice(0, 3)) add(R.id); } catch (e){}
    for (const q of PORTS.filter(q => !q.rorbu && dist(q.p, p0) < 30).sort((a, c) => dist(a.p, p0) - dist(c.p, p0)).slice(0, 4)) add(q.id);
    return out.sort((a, c) => a.d - c.d).slice(0, 7);
  }
  function homeBody(o){
    const h = homeOpts(o).map(q => BIG('dr-home', nm(q.id) + ' <span class="dr-k">(' + kindName(q.id) + ')</span>', (planRestOk(q.id) ? L('Mannskapet sover godt her', 'The crew sleep well here') : L('Ingen køyer: mannskapet hviler dårlig', 'No bunks: the crew rest poorly')) + (q.d > 0.2 ? ' · ' + km(portById(q.id).p, portById(S.boat.status === 'port' ? S.boat.port : nearestPort(S.boat.pos).id).p) + L(' unna', ' away') : ''), o.home === q.id, 'data-p="' + q.id + '"')).join('');
    const big = drBig() ? '<h4 style="margin-top:12px">' + L('Om natta', 'At night') + '</h4>' + BIG('dr-anchor', L('Ved kai', 'At the quay'), L('Båten ligger fortøyd hjemme', 'The boat lies moored at home'), !o.anchor, 'data-v="0"') + BIG('dr-anchor', L('Til ankers nær havna', 'At anchor near the harbour'), L('Vanlig for store båter. Blir natta for hard for ankerplassen, ligger hun ved kai.', 'Usual for big boats. When the night is too hard for the anchorage, she lies at the quay.'), !!o.anchor, 'data-v="1"') : '';
    return '<p class="ph-note">' + L('Her ligger båten mellom turene, og her sover mannskapet.', 'Here the boat lies between the trips, and here the crew sleep.') + '</p>' + h + big;
  }
  // ---- Fiske: the rig, and the jig beside it
  function gearWhy(g){
    if (g === 'juksa') return null;
    const k = PLAN_KIND[g]; if (!rigHas(g)) return L('Båten mangler ' + GEAR[k].no.toLowerCase().replace(/r$/, '') + 'haler', 'The boat has no hauler for ' + GEAR[k].en.toLowerCase());
    if (ownedUnits(k) < 1) return L('Ingen ' + GEAR[k].no.toLowerCase() + ' om bord', 'No ' + GEAR[k].en.toLowerCase() + ' aboard');
    return null;
  }
  const fishVal = o => o.rig === 'juksa' ? L('Juksa', 'Jigging') : rigName(o.rig) + (o.jig ? L(', og juksa mens det står', ', and the jig while it stands') : '');
  function fishBody(o){
    const h = ['juksa', 'line', 'garn', 'teiner'].map(g => { const why = gearWhy(g), k = PLAN_KIND[g]; return BIG('dr-rig', g === 'juksa' ? L('Bare juksa', 'Jigging only') : rigName(g), why || (g === 'juksa' ? L('Ut, fyll lasten, lever, og ut igjen', 'Out, fill the hold, land, and out again') : ownedUnits(k) + ' ' + unitName(k, ownedUnits(k)) + L(' eies', ' owned')), o.rig === g, 'data-g="' + g + '"', !!why); }).join('');
    const jig = drKind(o) ? '<h4 style="margin-top:12px">' + L('Jukse i tillegg mens redskapet står?', 'Jig as well while the gear stands?') + '</h4>' + BIG('dr-jig', L('Ja', 'Yes'), L('Mer fisk per døgn. Det holdes plass i lasten til redskapet.', 'More fish a day. Room is kept in the hold for the gear.'), o.jig, 'data-v="1"') + BIG('dr-jig', L('Nei, bare redskapet', 'No, only the gear'), L('Båten venter ved redskapet', 'The boat waits by the gear'), !o.jig, 'data-v="0"') : '';
    return '<p class="ph-note">' + L('Én type redskap om gangen. Alt redskap i sjøen må være trukket før båten rigges om.', 'One kind of gear at a time. All gear in the sea must be hauled before the boat is re-rigged.') + '</p>' + h + jig;
  }
  // ---- Plasser: the fields and the jig places, with the player's own numbers there (never what the sea holds)
  const own = (p, kind) => { const m = planMark(p, kind || null); return m ? (kind ? L('sist ' + fmt(m.kgu, 1) + ' kg per ' + GEAR[kind].u[0] + ' etter ' + Math.round(m.soak || 0) + ' t', 'last ' + fmt(m.kgu, 1) + ' kg a ' + GEAR[kind].u[2] + ' after ' + Math.round(m.soak || 0) + ' h') : L('sist ' + m.kgph + ' kg/t', 'last ' + m.kgph + ' kg/h')) : L('ikke fisket her ennå', 'not fished here yet'); };
  const placesVal = o => { const k = drKind(o), f = o.fields.length, j = drJig(o) ? o.jigs.length : 0; return (k ? f + ' ' + L(f === 1 ? 'felt' : 'felt', f === 1 ? 'field' : 'fields') : '') + (k && drJig(o) ? ', ' : '') + (drJig(o) ? j + ' ' + L(j === 1 ? 'juksplass' : 'juksplasser', j === 1 ? 'jig place' : 'jig places') : '') || L('ingen ennå', 'none yet'); };
  const SOAKSTEP = {line:1, garn:6, teine:12};
  function placesBody(o){
    const kind = drKind(o), h = [], home = portById(o.home);
    h.push('<p class="ph-note">' + L('Plassene avgjør fangsten. Finn fisken med ekkoloddet, eller bruk plasser du har fisket godt på. Tallene er dine egne fra de siste to ukene.', 'The places decide the catch. Find the fish with the sounder, or use places you have fished well. The numbers are your own from the last two weeks.') + '</p>');
    if (kind){
      o.fields.forEach((f, i) => h.push('<div class="dr-pl"><div class="dr-plh"><b>' + L('Felt ', 'Field ') + (i + 1) + '</b><small>' + (home ? km(home.p, f) + L(' fra hjem · ', ' from home · ') : '') + own(f, kind) + '</small></div>' +
        '<div class="dr-plc"><span>' + STEP('dr-fn', f.n + ' ' + unitName(kind, f.n), ' data-id="' + f.id + '"') + '</span><span>' + STEP('dr-fs', f.soak + L(' t ståtid', ' h soak'), ' data-id="' + f.id + '"') + '</span>' +
        '<span>' + T('dr-move', L('Flytt', 'Move'), false, 'data-k="F:' + f.id + '"') + T('dr-pdel', L('Fjern', 'Remove'), false, 'data-k="F:' + f.id + '"') + '</span></div></div>'));
      if (o.fields.length < DRP.fieldsMax) h.push(B('dr-add', L('+ Felt for ', '+ Field for ') + GEAR[kind].no.toLowerCase(), 'data-k="F"', adding === 'F' ? 'p' : ''));
      if (adding === 'F') h.push(addBody(o, 'F'));
    }
    if (drJig(o)){
      if (kind) h.push('<h4 style="margin-top:12px">' + L('Juksplasser', 'Jig places') + '</h4>' + (o.jigs.length ? '' : '<p class="ph-note">' + L('Ingen: mannskapet jukser ved redskapet.', 'None: the crew jig by the gear.') + '</p>'));
      o.jigs.forEach((j, i) => h.push('<div class="dr-pl"><div class="dr-plh"><b>' + L('Juksplass ', 'Jig place ') + (i + 1) + '</b><small>' + (home ? km(home.p, j) + L(' fra hjem · ', ' from home · ') : '') + own(j, null) + '</small></div>' +
        '<div class="dr-plc"><span>' + T('dr-jup', '↑', false, 'data-i="' + i + '"' + (i ? '' : ' disabled')) + T('dr-jdn', '↓', false, 'data-i="' + i + '"' + (i < o.jigs.length - 1 ? '' : ' disabled')) + '</span><span>' + T('dr-move', L('Flytt', 'Move'), false, 'data-k="J:' + j.id + '"') + T('dr-pdel', L('Fjern', 'Remove'), false, 'data-k="J:' + j.id + '"') + '</span></div></div>'));
      if (o.jigs.length > 1) h.push('<p class="ph-note">' + L('Mannskapet jukser på plassene i denne rekkefølgen og flytter videre når fangsten faller.', 'The crew jig at the places in this order and move on when the catch falls.') + '</p>');
      if (o.jigs.length < DRP.jigsMax) h.push(B('dr-add', L('+ Juksplass', '+ Jig place'), 'data-k="J"', adding === 'J' ? 'p' : ''));
      if (adding === 'J') h.push(addBody(o, 'J'));
    }
    if (o.fields.length || o.jigs.length) h.push(B('dr-show', L('Vis plassene i kartet', 'Show the places in the chart')));
    return h.join('');
  }
  // the places to choose from for a new one: the player's own best catch marks near home, his gear in the sea, where the boat is, or the chart
  let sugg = null;
  function addBody(o, k){
    const kind = k === 'F' ? drKind(o) : null, home = portById(o.home) || portById(S.boat.port) || nearestPort(S.boat.pos), out = [], taken = q => o.fields.concat(o.jigs).some(p => dist(p, q) < 0.3);
    for (const m of (S.marks || []).filter(m => (m.g || null) === (kind || null) && S.t - m.t < PLAN_MEMO).sort((a, c) => (c.kgph || c.kgu || 0) - (a.kgph || a.kgu || 0))){ if (dist(m, home.p) > 40 || taken(m) || out.some(q => dist(q, m) < 1)) continue; out.push({x:m.x, y:m.y, no:L('Fangstplass: ', 'Catch mark: ') + own(m, kind)}); if (out.length >= 3) break; }
    if (kind) for (const s of mySets().filter(s => s.kind === kind)){ const m = setMid(s); if (!taken(m) && !out.some(q => dist(q, m) < 1)) out.push({x:m.x, y:m.y, no:L('Der redskapet står nå', 'Where the gear stands now')}); }
    const b = S.boat; if (b.status !== 'port' && !taken(b.pos)) out.push({x:b.pos.x, y:b.pos.y, no:L('Der båten er nå', 'Where the boat is now')});
    sugg = out;
    return '<div class="dr-add">' + out.map((q, i) => BIG('dr-addp', q.no, km(home.p, q) + L(' fra ', ' from ') + home.name, false, 'data-i="' + i + '"')).join('') + BIG('dr-addp', L('Velg i kartet …', 'Choose in the chart …'), L('Trykk der du vil i kartplotteren', 'Tap where you like in the chart plotter'), false, 'data-i="map"') + '</div>';
  }
  // ---- Vær
  const WXN = {safe:['Forsiktig', 'Careful'], normal:['Vanlig', 'Normal'], tough:['Tøff', 'Rough']};
  function wxBody(o){ return Object.keys(DRW).map(k => BIG('dr-wx', L(WXN[k][0], WXN[k][1]), L('Inntil ' + DRW[k].wind + ' m/s og ' + fmt(Math.min(DRW[k].hs, BOAT.risk[1] * 0.95), 1) + ' m sjø', 'Up to ' + DRW[k].wind + ' m/s and ' + fmt(Math.min(DRW[k].hs, BOAT.risk[1] * 0.95), 1) + ' m sea'), o.wx === k, 'data-v="' + k + '"')).join('') + '<p class="ph-note">' + L('Blir været verre ute, går båten til nærmeste kai. Grensen er aldri mer enn båten tåler.', 'If the weather turns bad out there, the boat goes to the nearest quay. The limit is never more than the boat can take.') + '</p>'; }
  // ---- Rytme
  const rhythmVal = o => o.rhythm === 'watch' ? L('Døgnet rundt, 2 og 2', 'Round the clock, 2 and 2') : o.rhythm === 'multi' ? L('Turer på ' + o.days + ' døgn, ut kl. ', 'Trips of ' + o.days + ' days, out at ') + driftClock(o.dep) : L('Dagdrift, ut kl. ', 'Day trips, out at ') + driftClock(o.dep);
  function rhythmBody(o){
    const V = VESSELS[S.boat.type], wWhy = S.crew.length < driftNeedHands ? L('Krever fire i mannskapet', 'Needs four crew') : !V.watch ? L('Krever styrhus og køyer', 'Needs a wheelhouse and bunks') : (V.berths || 0) < Math.ceil(S.crew.length / 2) ? L('For få køyer', 'Too few bunks') : null, mWhy = V.berths > 0 ? null : L('Krever køyer om bord', 'Needs bunks aboard');
    return BIG('dr-rhythm', L('Dagdrift', 'Day trips'), L('Ut til fast tid, fisker og leverer til mannskapet er slitne, og hviler hjemme til de er uthvilt.', 'Out at a set hour, fish and land until the crew are tired, and rest at home until they are rested.'), o.rhythm === 'day', 'data-v="day"') +
      BIG('dr-rhythm', L('Døgnet rundt, 2 og 2', 'Round the clock, 2 and 2'), wWhy || L('To vakter på seks timer. Den som har fri, sover i køya. Båten leverer når lasten er full.', 'Two watches of six hours. The watch off sleeps in the bunks. The boat lands when the hold is full.'), o.rhythm === 'watch', 'data-v="watch"', !!wWhy && o.rhythm !== 'watch') +
      BIG('dr-rhythm', L('Turer over flere døgn', 'Trips of several days'), mWhy || L('Mannskapet hviler om bord underveis og leverer når lasten er full. Hjem når turen er over.', 'The crew rest aboard on the way and land when the hold is full. Home when the trip is over.'), o.rhythm === 'multi', 'data-v="multi"', !!mWhy && o.rhythm !== 'multi') +
      (o.rhythm !== 'watch' ? '<div class="ph-kv dr-kv"><span>' + L('Ut kl.', 'Out at') + '</span><span>' + STEP('dr-dep', driftClock(o.dep)) + '</span></div>' : '') +
      (o.rhythm === 'multi' ? '<div class="ph-kv dr-kv"><span>' + L('Turen varer', 'The trip lasts') + '</span><span>' + STEP('dr-days', o.days + L(' døgn', ' days')) + '</span></div>' : '');
  }
  // ---- Mannskap: you are the skipper aboard; without you a skipper and a mate
  function crewVal(o){
    const sk = crewSkipper(), mt = crewMate(), f = c => c.name.split(' ')[0];
    if (meAboard()) return L('Du er skipper', 'You are the skipper') + (mt ? L(', ' + f(mt) + ' er styrmann', ', ' + f(mt) + ' is the mate') : '');
    if ((VESSELS[S.boat.type].crewMax || 0) < 2) return L('Går bare med deg om bord', 'Runs only with you aboard');
    const v = (sk ? L('Skipper ', 'Skipper ') + f(sk) : L('Ingen skipper', 'No skipper')) + ' · ' + (mt && mt !== sk ? L('styrmann ', 'mate ') + f(mt) : L('ingen styrmann', 'no mate'));
    // without both, who is aboard to choose from
    return sk && mt && sk !== mt ? v : v + (S.crew.length ? L(' · om bord: ', ' · aboard: ') + S.crew.map(f).join(', ') : L(' · ingen mannskap', ' · no crew'));
  }
  function crewBody(o){
    const one = (VESSELS[S.boat.type].crewMax || 0) < 2;
    return '<p class="ph-note">' + (one ? L('Båten har plass til bare én i mannskapet. Planen går derfor bare når du er om bord, og venter mens du er i land.', 'The boat has room for only one crew. So the plan runs only when you are aboard, and waits while you are ashore.')
      : L('Når du er om bord, er du skipper. Når du ikke er det, må både en skipper og en styrmann være utnevnt. Det gjør du på Mannskap-siden.', 'When you are aboard, you are the skipper. When you are not, both a skipper and a mate must be appointed. You do that on the Crew page.')) + '</p>' +
      (one ? '' : B('dr-crew', L('Til Mannskap-siden', 'To the Crew page')));
  }
  // ---- the top: Start or Pause, and now
  function top(o, C){
    const h = ['<div class="ph-card"><h4>' + L('Driftsplan · «', 'Operations plan · «') + S.boatName + '»</h4>'];
    const now = driftNow(o), stopped = !o.on && o.stop, waiting = o.on && (o.held || (o.wait && ['wx', 'one', 'off', 'jobs', 'route'].includes(o.wait.k)));
    if (busy || o.building) h.push('<button class="dr-onoff" disabled>' + L('Lager planen …', 'Making the plan …') + '</button>');
    else if (o.on) h.push('<button class="dr-onoff on" data-pa="dr-pause">' + L('På · trykk for pause', 'On · tap to pause') + '</button>');
    else h.push('<button class="dr-onoff" data-pa="dr-start"' + (C.ok ? '' : ' disabled') + '>' + (C.ok ? L('Start planen', 'Start the plan') : L('Ikke klar ennå', 'Not ready yet')) + '</button>');
    if (o.on || stopped) h.push('<div class="dr-now' + (stopped ? ' bad' : waiting ? ' wait' : '') + '"><b>' + L('Nå: ', 'Now: ') + '</b>' + L(now[0], now[1]) + '</div>');
    if (o.on && o.held) h.push(B('dr-resume', L('Gi båten tilbake til planen', 'Give the boat back to the plan'), '', 'p'));
    if (stopped && o.stop.fix) h.push(B('dr-fix', {places:L('Endre plassene', 'Change the places'), mannskap:L('Til Mannskap-siden', 'To the Crew page'), quota:L('Se kvoten', 'See the quota'), rig:L('Endre redskapet', 'Change the gear')}[o.stop.fix] || L('Se planen', 'See the plan'), '', 'p'));
    if (!o.on && !C.ok) h.push(C.errors.map(e => '<p class="bad">' + e + '</p>').join(''));
    if (o.err && !o.on) h.push('<p class="bad">' + o.err + '</p>');
    h.push(C.warnings.map(e => '<p class="warn">' + e + '</p>').join(''));
    h.push('</div>'); return h.join('');
  }
  // ---- I dag: the trip as a timeline, with where she is now
  function today(o){
    const sk = driftSketch(o); if (!sk || !sk.length) return '';
    return '<div class="ph-card"><h4>' + (S.plan && S.plan.ops ? L('Turen nå', 'The trip now') : L('Neste tur', 'The next trip')) + '</h4><div class="dr-pv">' + sk.map(x => '<div class="dr-ev' + (x.now ? ' now' : '') + (x.k ? ' ' + x.k : '') + '"><span>' + driftClock(driftHod(x.t)) + '</span><span>' + L(x.no, x.en) + '</span></div>').join('') + '</div>' +
      '<p class="ph-note">' + L('Tidene er anslag. Blir lasten full, leverer mannskapet tidligere. Været, slitenheten og fangsten avgjør resten.', 'The times are estimates. If the hold fills, the crew land sooner. The weather, the tiredness and the catch decide the rest.') + '</p></div>';
  }
  // ---- the last seven days, landed per day
  function week(o){
    const days = []; for (let k = 6; k >= 0; k--){ const d = gDate(S.t / 60 - k * 24).toISOString().slice(0, 10); days.push({d, kg:0}); }
    for (const r of o.rep){ const d = gDate(r.t / 60).toISOString().slice(0, 10), x = days.find(q => q.d === d); if (x && r.landed) x.kg += r.kg; }
    const mx = Math.max(1, ...days.map(x => x.kg)), with7 = days.filter(x => x.kg > 0), avg = with7.length ? days.reduce((a, x) => a + x.kg, 0) / 7 : 0, best = days.reduce((m, x) => x.kg > m.kg ? x : m, days[0]);
    return '<div class="ph-card"><h4>' + L('Siste sju døgn', 'The last seven days') + '</h4><div class="dr-w7">' + days.map(x => '<i style="height:' + Math.max(2, Math.round(x.kg / mx * 100)) + '%" title="' + fmt(x.kg, 0) + ' kg"></i>').join('') + '</div>' +
      '<div class="dr-w7l">' + days.map(x => '<span>' + x.d.slice(8) + '.</span>').join('') + '</div>' +
      (with7.length ? '<div class="ph-kv"><span>' + L('Snitt per døgn', 'Average a day') + '</span><span>' + fmt(avg, 0) + ' kg</span></div><div class="ph-kv"><span>' + L('Beste døgn', 'Best day') + '</span><span>' + best.d.slice(8) + '.' + best.d.slice(5, 7) + '. · ' + fmt(best.kg, 0) + ' kg</span></div>' : '<p class="ph-note">' + L('Ingen leveringer på planen ennå.', 'No landings on the plan yet.') + '</p>') + '</div>';
  }
  function page(){
    // a place being picked or the places shown in the chart end when the plan's page is opened again
    if (DRIFTCTX){ if (DRIFTCTX.spot){ S.draft = []; } DRIFTCTX = null; if (typeof routeChanged === 'function') routeChanged(); }
    const o = driftOps();
    if (!o) return '<div class="ph-c"><div class="ph-card"><h4>' + L('Driftsplan for «', 'Operations plan for «') + S.boatName + '»</h4><p class="ph-note">' + L('Med en driftsplan fisker, leverer og hviler båten på egen hånd, hver dag, også når spillet er lukket. Du velger hvor båten hører hjemme, hva og hvor den fisker, hvor tøft vær den går i og hvilken rytme mannskapet har. Planen lager turene selv.', 'With an operations plan the boat fishes, lands and rests on her own, every day, also while the game is closed. You choose where she belongs, what and where she fishes, how rough a weather she goes out in and the crew\'s rhythm. The plan makes the trips itself.') + '</p>' +
      B('dr-new', L('Lag driftsplan', 'Make a plan'), '', 'p') + '</div></div>';
    const C = driftCheck(o), h = ['<div class="ph-c">', top(o, C)], rv = (k, v) => v;
    h.push('<div class="ph-card dr-rows">' +
      row('home', L('Hjem', 'Home'), o.home ? nm(o.home) + (o.anchor && drBig() ? L(', til ankers', ', at anchor') : '') : L('ikke valgt', 'not chosen'), () => homeBody(o), !o.home) +
      row('fish', L('Fiske', 'Fishing'), fishVal(o), () => fishBody(o), !!gearWhy(o.rig)) +
      row('places', L('Plasser', 'Places'), placesVal(o), () => placesBody(o), drKind(o) ? !o.fields.length : !o.jigs.length) +
      row('land', L('Levering', 'Landing'), o.M && driftMade(o) ? L('Nærmeste mottak: ', 'Nearest plant: ') + nm(o.M) : L('Nærmeste mottak', 'The nearest plant'), null) +
      row('wx', L('Vær', 'Weather'), L(WXN[o.wx][0], WXN[o.wx][1]) + L(', inntil ', ', up to ') + DRW[o.wx].wind + ' m/s', () => wxBody(o)) +
      row('rhythm', L('Rytme', 'Rhythm'), rv('r', rhythmVal(o)), () => rhythmBody(o)) +
      row('crew', L('Mannskap', 'Crew'), crewVal(o), () => crewBody(o), !!driftCrewWhy(o, true) && !driftCrewWhy(o, true).wait) + '</div>');
    h.push(today(o)); h.push(week(o));
    const others = S.fleet.filter(v => v.id !== S.cur);
    h.push('<div class="ph-card">' + (others.length ? '<h4>' + L('Kopier planen til en annen båt', 'Copy the plan to another vessel') + '</h4><div class="ops-days">' + others.map(v => T('dr-copy', vget(v, 'boatName'), false, 'data-id="' + v.id + '"')).join('') + '</div>' : '') + B('dr-reset', L('Slett driftsplanen', 'Delete the plan')) + '</div></div>');
    return h.join('');
  }
  // ---- a place picked in the chart plotter (core DRIFTCTX.spot: 'F+' a new field, 'J+' a new jig place, 'F:id' / 'J:id' one moved)
  function pick(k){
    DRIFTCTX = {vid:S.cur, spot:k}; S.draft = []; if (typeof routeChanged === 'function') routeChanged();
    PHONE.show(false); if (typeof DOCK !== 'undefined' && DOCK.close) DOCK.close();
    toast(k[0] === 'F' ? L('Trykk i kartet der redskapet skal stå, og så «Bruk plassen».', 'Tap the chart where the gear shall stand, then «Use the place».') : L('Trykk i kartet der dere skal jukse, og så «Bruk plassen».', 'Tap the chart where you will jig, then «Use the place».'));
  }
  // a place is checked before it is put in the plan: at sea, deep enough, and allowed for the gear
  function placeWhy(o, q, k){
    try { if (isLand(q)) return L('Det er land der.', 'That is land.'); if (depthF(q) < 5) return L('For grunt der.', 'Too shallow there.'); } catch (e){ return null; }
    const kind = drKind(o), why = k === 'F' ? ruBlockMsg({p:q, len:BOAT.len, gear:o.rig === 'teiner' ? 'teiner' : kind, sp:kind === 'teine' ? 'krabbe' : null}) : ruBlockMsg({p:q, len:BOAT.len, gear:'juksa', sp:null, hand:!(S.equip && S.equip.jukse > 0)});
    return why || null;
  }
  function put(o, k, q){
    const kind = k[0] === 'F' ? 'F' : 'J', why = placeWhy(o, q, kind); if (why){ toast(why); return false; }
    if (k === 'F+'){ const kk = drKind(o), left = Math.max(1, ownedUnits(kk) - o.fields.reduce((a, f) => a + f.n, 0)), n = kk === 'garn' ? Math.min(left, (S.pgear.nets[0] || {n:6}).n) : kk === 'line' ? Math.min(left, 2) : Math.min(left, 10);
      o.fields.push({id:driftSid(), x:q.x, y:q.y, n, soak:DRP.soakDef[kk]}); }
    else if (k === 'J+') o.jigs.push({id:driftSid(), x:q.x, y:q.y});
    else { const L0 = k[0] === 'F' ? o.fields : o.jigs, p = L0.find(f => f.id === k.slice(2)); if (p){ p.x = q.x; p.y = q.y; } }
    return true;
  }
  function saveRoute(){
    const c = DRIFTCTX, o = driftOps(); if (!c || !c.spot){ DRIFTCTX = null; return false; }
    const q = S.draft.filter(w => !w.port).pop(); if (!q) return false;
    const done = o && put(o, c.spot, {x:q.x, y:q.y});
    // a place that cannot be used (land, too shallow, closed to the gear): the reason is said, and the next tap is tried instead
    S.draft = []; if (done || !o) DRIFTCTX = null; if (typeof routeChanged === 'function') routeChanged();
    if (done){ open = 'places'; adding = null; toast(L('Plassen er lagt inn i planen.', 'The place is in the plan.')); }
    return done;
  }
  function cancelRoute(){ DRIFTCTX = null; S.draft = []; if (typeof routeChanged === 'function') routeChanged(); }
  // a new plan, with sensible answers to begin with: home where she lies if the crew can sleep there, else the nearest rorbu; the rig she has;
  // the gear standing in the sea as fields; the best catch mark near as the jig place
  function fresh(){
    const b = S.boat, here = b.status === 'port' ? b.port : nearestPort(b.pos).id; let home = planRestOk(here) ? here : null;
    if (!home){ try { const r = rorbuSites(portById(here).p, 40)[0]; if (r) home = r.id; } catch (e){} }
    const rig = RIGS[b.rig] && rigHas(b.rig) ? b.rig : 'juksa', kind = PLAN_KIND[rig] || null, o = driftNew({home:home || here, rig});
    if (kind) for (const s of mySets().filter(s => s.kind === kind).slice(0, DRP.fieldsMax)){ const m = setMid(s); o.fields.push({id:driftSid(), x:m.x, y:m.y, n:s.n, soak:DRP.soakDef[kind]}); }
    const p0 = portById(o.home).p, m = (S.marks || []).filter(x => !x.g && S.t - x.t < PLAN_MEMO && dist(x, p0) < 30).sort((a, c) => (c.kgph || 0) - (a.kgph || 0))[0];
    if (m) o.jigs.push({id:driftSid(), x:m.x, y:m.y});
    return o;
  }
  function start(o){
    const C = driftCheck(o); if (!C.ok){ toast(C.errors[0]); return; }
    const go = () => { o.on = true; o.stop = null; o.held = null; o.wait = null; o.fails = 0; o.hold = 0; o.day = null; toast(L('Driftsplanen er på.', 'The plan is on.')); };
    if (driftMade(o)){ go(); return; }
    busy = true; driftMake(o, err => { busy = false; if (err) toast(err); else go(); rerender(); });
  }
  // ---- actions (data-pa="dr-…"); true when something changed
  function act(a, d){
    if (a === 'dr-new'){ S.ops = fresh(); open = null; if (S.plan && S.plan.ops) S.plan.ops = false; return true; }
    const o = driftOps(); if (!o) return false;
    const fld = id => o.fields.find(f => f.id === id), kind = drKind(o);
    if (a === 'dr-row'){ open = open === d.k ? null : d.k; adding = null; return true; }
    if (a === 'dr-start'){ start(o); return true; }
    if (a === 'dr-pause'){ o.on = false; o.stop = null; o.wait = null; o.held = null; o.day = null; toast(L('Driftsplanen står på pause.', 'The plan is paused.')); return true; }
    if (a === 'dr-resume'){ driftResume(o); return true; }
    if (a === 'dr-fix'){ const f = o.stop && o.stop.fix; if (f === 'mannskap'){ PHONE.open('arbeid'); return false; } if (f === 'quota'){ PHONE.open('kvote'); return false; } open = f === 'rig' ? 'fish' : 'places'; return true; }
    if (a === 'dr-crew'){ PHONE.open('arbeid'); return false; }
    if (a === 'dr-home'){ o.home = d.p; return true; }
    if (a === 'dr-anchor'){ o.anchor = d.v === '1'; return true; }
    if (a === 'dr-rig'){ if (gearWhy(d.g)) return false; if (d.g !== o.rig){ o.rig = d.g; o.fields = []; if (!PLAN_KIND[d.g]) o.jig = true; } return true; }
    if (a === 'dr-jig'){ o.jig = d.v === '1'; return true; }
    if (a === 'dr-wx'){ o.wx = d.v; return true; }
    if (a === 'dr-rhythm'){ o.rhythm = d.v; return true; }
    if (a === 'dr-dep'){ o.dep = clamp(o.dep + 0.5 * (+d.d), 0, 23.5); return true; }
    if (a === 'dr-days'){ o.days = clamp(o.days + (+d.d), DRP.days[0], DRP.days[1]); return true; }
    if (a === 'dr-fn'){ const f = fld(d.id); if (!f) return false; f.n = clamp(f.n + (+d.d), 1, Math.max(1, (BOAT.gearMax || {})[kind === 'line' ? 'stamp' : kind] || 99)); return true; }
    if (a === 'dr-fs'){ const f = fld(d.id); if (!f) return false; const st = SOAKSTEP[kind] || 1; f.soak = clamp(f.soak + st * (+d.d), st, DRP.soak[kind][3]); return true; }
    if (a === 'dr-pdel'){ const L0 = d.k[0] === 'F' ? o.fields : o.jigs, i = L0.findIndex(f => f.id === d.k.slice(2)); if (i >= 0) L0.splice(i, 1); return true; }
    if (a === 'dr-jup' || a === 'dr-jdn'){ const i = +d.i, j = a === 'dr-jup' ? i - 1 : i + 1; if (j < 0 || j >= o.jigs.length) return false; const t = o.jigs[i]; o.jigs[i] = o.jigs[j]; o.jigs[j] = t; return true; }
    if (a === 'dr-add'){ adding = adding === d.k ? null : d.k; return true; }
    if (a === 'dr-addp'){ if (d.i === 'map'){ pick(adding + '+'); return true; } const q = (sugg || [])[+d.i]; if (!q) return false; if (put(o, adding + '+', q)) adding = null; return true; }
    if (a === 'dr-move'){ pick(d.k); return true; }
    if (a === 'dr-show'){ DRIFTCTX = {vid:S.cur, view:true}; S.draft = []; if (typeof routeChanged === 'function') routeChanged(); PHONE.show(false); if (typeof DOCK !== 'undefined' && DOCK.close) DOCK.close(); return true; }
    if (a === 'dr-copy'){ if (driftCopy(d.id)) toast(L('Planen er kopiert til «' + vget(vesselById(d.id), 'boatName') + '». Sjekk den og start den der.', 'The plan is copied to «' + vget(vesselById(d.id), 'boatName') + '». Check it and start it there.')); return true; }
    if (a === 'dr-reset'){ if (!confirm(L('Slette driftsplanen for «' + S.boatName + '»?', 'Delete the plan for «' + S.boatName + '»?'))) return false; S.ops = null; open = null; if (S.plan && S.plan.ops) S.plan.ops = false; return true; }
    return false;
  }
  // one line for the Crew page: what the plan does now, and the way to it
  function line(){ const o = driftOps(), n = driftNow(o); return '<div class="ph-card dr-line"><span><b>' + L('Driftsplan', 'Operations plan') + '</b><small>' + L(n[0], n[1]) + '</small></span><button class="ph-btn" data-pa="open" data-a="drift">' + L('Åpne', 'Open') + '</button></div>'; }
  return {page, act, line, saveRoute, cancelRoute, wizOn:() => !!(DRIFTCTX && DRIFTCTX.spot)};
})();
// the plan's places on the chart while one is picked or the player asked to see them (ui/03-map.js): home, the plant, the fields, the jig places
function driftSvg(u){
  const o = S.ops; if (!o || o.v !== DRV || !DRIFTCTX || DRIFTCTX.vid !== S.cur) return '';
  const g = [], pin = (p, lbl, c) => { g.push('<circle cx="' + p.x + '" cy="' + p.y + '" r="' + (6.5 * u) + '" fill="' + c + '" stroke="#fff" stroke-width="' + (2 * u) + '"/>'); g.push(txt({x:p.x + 9 * u, y:p.y - 7 * u}, lbl, 'wpn', 12 * u, 'stroke-width="' + (3 * u) + '"')); };
  const hp = portById(o.home); if (hp) pin(o.homeA || hp.p, S.lang === 'no' ? 'Hjem' : 'Home', '#29a36a');
  const mp = portById(o.M); if (mp && driftMade(o)) pin(mp.p, S.lang === 'no' ? 'Mottak' : 'Plant', '#2f7fd0');
  o.fields.forEach((f, i) => pin(f, (S.lang === 'no' ? 'Felt ' : 'Field ') + (i + 1), '#d9822b'));
  o.jigs.forEach((j, i) => pin(j, 'J' + (i + 1), '#7a5bd0'));
  return g.join('');
}
