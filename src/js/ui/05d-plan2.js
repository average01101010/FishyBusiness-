// ===== Driftsplan 2, part 5: the page (docs/planer/driftsplan-2/02-design.md 4.1). The day first («I dag» with where she is now, or the
// next day as planDay reckons it), then the answers as rows (Hjem, Redskap, Plasser, Levering, Vær, Rytme, Mannskap), then the statistics.
// Shown in place of DRIFTUI when DRIFT2 is on (phone/06-render.js, 14-act.js). The chart window (part 6) is opened from the Plasser row.
const PLAN2UI = (() => {
  const L = (no, en) => S.lang === 'no' ? no : en;
  const nm = id => (portById(id) || {name:'?'}).name;
  let open = null, adding = null, busy = false, sugg = null, dayTab = 0;
  const rerender = () => { if (typeof refreshAll === 'function') refreshAll(); else if (typeof PHONE !== 'undefined') PHONE.render(); };
  const B = (a, label, extra, cls) => '<button class="ph-btn' + (cls ? ' ' + cls : '') + '" data-pa="' + a + '"' + (extra ? ' ' + extra : '') + '>' + label + '</button>';
  const T = (a, label, on, extra) => '<button data-pa="' + a + '" class="' + (on ? 'on' : '') + '"' + (extra ? ' ' + extra : '') + '>' + label + '</button>';
  const BIG = (a, label, sub, on, extra, off) => '<button class="dr-big' + (on ? ' on' : '') + '" data-pa="' + a + '"' + (extra ? ' ' + extra : '') + (off ? ' disabled' : '') + '><b>' + label + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</button>';
  const STEP = (a, val, extra) => '<span class="dr-st"><button data-pa="' + a + '" data-d="-1"' + (extra || '') + ' aria-label="−">−</button><output>' + val + '</output><button data-pa="' + a + '" data-d="1"' + (extra || '') + ' aria-label="+">+</button></span>';
  const km = (p, q) => fmt(dist(p, q) / NM, 1) + ' nm';
  const ck = t => t == null ? '–' : driftClock(driftHod(t));
  function row(k, label, value, body, bad){
    const on = open === k && !!body;
    // (a row with something missing colours only its value, which says what is missing: GUI review U3; the global .bad made all of it red and small)
    return '<div class="dr-row' + (on ? ' on' : '') + (bad ? ' dr-bad' : '') + '"><button class="dr-rh" data-pa="p2-row" data-k="' + k + '"><span class="dr-rl">' + label + '</span><span class="dr-rv">' + value + '</span><span class="dr-rc">' + (body ? (on ? '▾' : '›') : '') + '</span></button>' + (on ? '<div class="dr-rb">' + body() + '</div>' : '') + '</div>';
  }
  const kindName = id => { const p = portById(id); if (!p) return ''; if (id === (S.home || HOME0)) return L('naustet', 'the naust'); if (isRorbu(id)) return L('rorbu', 'rorbu');
    if (isBerth(id)) return p.kind === 'dock' ? L('flytebrygge', 'floating dock') : L('kai', 'quay');
    const k = portKind(p); return k === 'mottak' ? L('fiskemottak', 'fish plant') : k === 'verft' ? L('verft', 'yard') : k === 'butikk' ? L('butikk', 'shop') : L('kai', 'quay'); };
  // why a paused boat drifts instead of lying at anchor (Pause anchors where it can, plan2Pause): «: for dypt til å ankre», lower case
  const driftWhy = o => { const w = o.paused && o.paused.drift && anchorWhy[o.paused.drift]; return w ? [': ' + w[0].charAt(0).toLowerCase() + w[0].slice(1).replace(/\.$/, ''), ': ' + w[1].charAt(0).toLowerCase() + w[1].slice(1).replace(/\.$/, '')] : ['', '']; };
  // ---- Nå: the step she is on and when it ends, what she waits for and until when, or why she stopped
  function nowOf(o){
    if (!o.on && o.paused && !o.stop){ const b = S.boat, at = ck(o.paused.t / 60);   // (U4: the boat lies still where Pause found her)
      return [b.status === 'port' ? L('På pause siden kl. ' + at + '. Båten ligger i ' + nm(b.port) + '.', 'Paused since ' + at + '. The boat lies at ' + nm(b.port) + '.') : b.anch ? L('På pause siden kl. ' + at + '. Båten ligger til ankers der den var, og mannskapet venter på deg.', 'Paused since ' + at + '. The boat lies at anchor where she was, and the crew wait for you.') : L('På pause siden kl. ' + at + '. Båten driver med vinden der den var' + driftWhy(o)[0] + ', og mannskapet venter på deg.', 'Paused since ' + at + '. The boat drifts with the wind where she was' + driftWhy(o)[1] + ', and the crew wait for you.'), 'wait']; }
    if (!o.on) return o.stop ? [L('Stoppet: ', 'Stopped: ') + L(o.stop.no, o.stop.en), 'bad'] : [L('Av', 'Off'), ''];
    if (o.held) return [L('Venter: du har tatt over båten', 'Waiting: you have taken the boat over'), 'wait'];
    const b = S.boat, pl = S.plan, r = o.run, M = nm(o.M), stepTxt = s => { const t = planDayText(o, {steps:[s], skipped:[], why:['', '']})[0]; return L(t[1], t[2]); };
    if (b.land) return [L('Leverer i ', 'Landing at ') + nm(b.land.pid), ''];
    if (b.status === 'port' && (b.shift || b.fueling || portBusy(b))) return [L('Gjør båten klar: is, drivstoff og agn', 'Getting the boat ready: ice, fuel and bait'), ''];
    if (b.status === 'unmooring') return [L('Kaster loss', 'Casting off'), ''];
    if (pl && pl.ops){
      if (pl.opsK === 'ly') return [L('Går i ly til ', 'Going to shelter at ') + nm(pl.wps[pl.wps.length - 1].port), 'wait'];
      if (pl.opsK === 'home') return [L('På vei hjem til ', 'On the way home to ') + nm(o.home), ''];
      if (pl.opsK === 'land') return [L('På vei til ', 'On the way to ') + M + L(' for å levere', ' to land'), ''];
      if (pl.opsK === 'rest') return [L('På vei for å hvile om bord', 'On the way to rest aboard'), ''];
      if (b.gop) return [(b.gop.op === 'set' ? L('Setter ', 'Setting ') : L('Trekker ', 'Hauling ')) + GEAR[b.gop.kind][S.lang === 'no' ? 'no' : 'en'].toLowerCase(), ''];
      if (b.status === 'fishing'){ const w = pl.wps[pl.idx - 1], i = w && w.jc ? w.jc : null, until = b.fishUntil != null ? ck(b.fishUntil / 60) : null; return [(pl.noJig ? L('Venter ved redskapet', 'Waiting by the gear') : L('Jukser', 'Jigging') + (i ? L(' på plass ', ' at place ') + i : '')) + (until ? L(' til kl. ', ' until ') + until : ''), '']; }
      const left = pl.wps.slice(pl.idx).some(w => w.act || w.fish > 0); return left ? [L('På vei ut', 'On the way out'), ''] : [L('På vei til ', 'On the way to ') + (pl.wps[pl.wps.length - 1].port ? nm(pl.wps[pl.wps.length - 1].port) : L('ankerplassen', 'the anchorage')), ''];
    }
    if (r && r.wait) return [L(r.wait.no, r.wait.en), ['dep', 'rest', 'idle'].includes(r.wait.k) ? '' : 'wait'];
    if (r && r.day && r.day.steps[r.i]) return [stepTxt(r.day.steps[r.i]), ''];
    return [L('Klar', 'Ready'), ''];
  }
  // ---- the day: today's as the engine follows it (with «← nå»), or the next as planDay reckons it from the answers
  function preview(o){
    const r = o.run, H = S.t / 60;
    // (on a trip the arrow follows the clock: the step pointer moves at the harbour calls)
    // (off, paused or stopped: the next day, never «I dag ←» as if she went, U4)
    if (o.on && r && r.day && r.i < r.day.steps.length && !r.replan){ let now = r.i; if (r.trip && S.plan && S.plan.ops){ for (let i = r.i; i < r.day.steps.length; i++){ const s = r.day.steps[i]; if (s.t != null && s.t <= H) now = i; } }
      // the step she is on says the engine's own end (GUI review U5: «Nå» had b.fishUntil, the day the plan's estimate, minutes to hours apart)
      const b = S.boat, cs = r.day.steps[now]; let day = r.day;
      if (cs && cs.k === 'juks' && b.status === 'fishing' && b.fishUntil != null && S.plan && S.plan.ops){ const u = b.fishUntil / 60; day = Object.assign({}, r.day, {steps:r.day.steps.map((s, i) => i === now ? Object.assign({}, s, {until:u, h:Math.max(0, u - s.t)}) : s)}); }
      return {day, now, label:L('I dag', 'Today')}; }
    // a plan not made yet has no plant: the nearest one to the places stands in, so the day can be read before Start
    let oo = o; if (!o.M){ const P = o.places, mid = P.length ? {x:P.reduce((a, q) => a + q.x, 0) / P.length, y:P.reduce((a, q) => a + q.y, 0) / P.length} : (portById(o.home) || {p:S.boat.pos}).p, M = o.land.mode === 'port' && o.land.port ? portById(o.land.port) : PORTS.filter(q => q.mottak).sort((x, y) => dist(x.p, mid) - dist(y.p, mid))[0]; if (M) oo = Object.assign({}, o, {M:M.id}); }
    // the next day is reckoned from the state at its departure, not now: the crew's fatigue and your energy fall and rise with the rest until then
    // (the engine lays the day anew at the departure; this is the page's estimate, as the note under the day says)
    const atSea = !o.on && S.boat.status !== 'port' && (!S.boat.anch || !!(o.paused && o.paused.sea));   // (started at sea, or paused at anchor there, the day is laid from where she lies, now: plan2Start)
    try { const from = o.on && r && r.day ? r.day.end : H, dep = atSea ? H : plan2NextDep(oo, H, from), st = plan2State(oo), hrs = Math.max(0, dep - H);
      if (hrs > 0){ const b = S.boat, atRest = b.status === 'port' && (b.port === oo.home ? st.homeRest : plan2RestOk(b.port)), rate = atRest ? p2RestRate('bunks') : b.status === 'port' ? p2RestRate('quay') : 0;
        for (const c of st.crew) c.fat = Math.max(0, c.fat - rate * hrs); if (st.me.aboard && (b.status === 'port' || b.anch)) st.me.energy = Math.min(100, st.me.energy + Math.max(restRate(b) * 60, resting() ? 0 : b.anch ? p2MeRate(null, true) : p2MeRate(b.port)) * hrs); }   // (you go in to rest by yourself, plan2MeRest)
      const day = planDay(oo, dep, st); return {day, now:-1, label:o.paused && !o.on ? L('Når du starter igjen', 'When you start again') : dep - H > 20 ? L('I morgen', 'Tomorrow') : L('Neste dag', 'Next day'), dep}; } catch (e){ return null; }
  }
  function dayCard(o){
    const P = preview(o); if (!P) return '';
    const lines = planDayText(Object.assign({}, o, {M:o.M || (P.day.steps.find(s => s.port) || {}).port}), P.day);
    const h = ['<div class="ph-card"><h4>' + P.label + (P.dep ? ' · ' + L('ut kl. ', 'out at ') + ck(P.dep) : '') + '</h4><div class="dr-pv">'];
    lines.forEach((x, i) => { const s = P.day.steps[i], isNow = i === P.now, k = s ? (s.k === 'hjem' || s.k === 'hvile' ? ' rest' : s.k === 'lever' ? ' land' : s.k === 'sett' || s.k === 'trekk' ? ' st' : '') : ' skip';
      h.push('<div class="dr-ev' + (isNow ? ' now' : '') + k + '"><span>' + (x[0] || '') + '</span><span>' + L(x[1], x[2]) + (isNow ? ' ←' : '') + '</span></div>'); });
    h.push('</div><p class="ph-note">' + L('Tidene er anslag fra planen selv. Blir lasten full, leverer mannskapet tidligere. Været avgjør resten.', 'The times are the plan\'s own estimates. If the hold fills, the crew land sooner. The weather decides the rest.') + '</p></div>');
    return h.join('');
  }
  // ---- Hjem (GUI review U14 A, 05.11.2026): the naust first, then the rorbuer nearest the places, then the rest; no yard (it is no home);
  // each line says what sets it apart: the baiting shed (a plant), the rest for you and for the crew, and the way to the places
  function homeOpts(o){
    const b = S.boat, here = b.status === 'port' ? b.port : nearestPort(b.pos).id, p0 = portById(here).p, home = S.home || HOME0, out = [];
    const add = id => { const p = portById(id); if (!p || out.some(q => q.id === id)) return; if (id !== o.home && portServices(p).verft) return; out.push({id}); };
    if (portById(home) && dist(portById(home).p, p0) < 80) add(home); add(here); if (o.home) add(o.home);
    try { for (const R of rorbuSites(p0, 40).slice(0, 4)) add(R.id); } catch (e){}
    const hids = new Set(out.map(q => isBerth(q.id) && portById(q.id).hid).filter(Boolean));
    for (const q of havnOptions(p0, 25).filter(q => !hids.has(q.place.hid)).slice(0, 3)) add(q.place.id);
    for (const q of PORTS.filter(q => !q.rorbu && dist(q.p, p0) < 30).sort((a, c) => dist(a.p, p0) - dist(c.p, p0)).slice(0, 5)) add(q.id);
    const mid = placesMid(o) || p0; for (const q of out) q.d = dist(portById(q.id).p, mid);
    const rank = id => id === home ? 0 : isRorbu(id) ? 1 : 2;
    return out.sort((a, c) => rank(a.id) - rank(c.id) || a.d - c.d).slice(0, 8);
  }
  const placesMid = o => { const P = o.places; return P.length ? {x:P.reduce((a, q) => a + q.x, 0) / P.length, y:P.reduce((a, q) => a + q.y, 0) / P.length} : null; };
  // what one home gives: the baiting shed (with line), your rest, the crew's rest, and how far the places are
  function homeSub(o, q){
    const id = q.id, P = portById(id), crewOk = plan2RestOk(id), me = id === (S.home || HOME0) ? L('du sover i naustet', 'you sleep in the naust') : isRorbu(id) ? L('du sover på rorbua (' + kr(RORBU.kr) + ' natta)', 'you sleep at the rorbu (' + kr(RORBU.kr) + ' a night)') : (VESSELS[S.boat.type].berths || 0) > 0 ? L('du sover i køya', 'you sleep in the bunk') : L('ingen hvile for deg', 'no rest for you');
    const out = [];
    if (p2Kind(o) === 'line') out.push(P.mottak ? L('egnebu', 'baiting shed') : L('ingen egnebu', 'no baiting shed'));
    out.push(me, crewOk ? L('mannskapet sover godt', 'the crew sleep well') : L('mannskapet hviler dårlig', 'the crew rest poorly'));
    out.push(fmt(q.d / NM, 1) + ' nm ' + (o.places.length ? L('til plassene', 'to the places') : L('unna', 'away')));
    const s = out.join(' · '); return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function homeBody(o){
    const h = homeOpts(o).map(q => BIG('p2-home', nm(q.id) + ' <span class="dr-k">(' + kindName(q.id) + ')</span>', homeSub(o, q), o.home === q.id, 'data-p="' + q.id + '"')).join('');
    const big = (BOAT.len || 0) >= DRP.bigLen ? '<h4 style="margin-top:12px">' + L('Om natta', 'At night') + '</h4>' + BIG('p2-anchor', L('Ved kai', 'At the quay'), L('Båten ligger fortøyd hjemme', 'The boat lies moored at home'), !o.anchor, 'data-v="0"') + BIG('p2-anchor', L('Til ankers nær havna', 'At anchor near the harbour'), L('Vanlig for store båter. Blir natta for hard for ankerplassen, ligger hun ved kai.', 'Usual for big boats. When the night is too hard for the anchorage, she lies at the quay.'), !!o.anchor, 'data-v="1"') : '';
    return '<p class="ph-note">' + L('Her ligger båten mellom dagene, og her sover mannskapet og egner lina.', 'Here the boat lies between the days, and here the crew sleep and bait the line.') + '</p>' + h + big;
  }
  // ---- Redskap
  function gearWhy(g){ if (g === 'juksa') return null; const k = PLAN2_KIND[g]; if (!rigHas(g)) return L('Båten mangler ' + GEAR[k].no.toLowerCase().replace(/r$/, '') + 'haler', 'The boat has no hauler for ' + GEAR[k].en.toLowerCase()); if (ownedUnits(k) < 1) return L('Ingen ' + GEAR[k].no.toLowerCase() + ' om bord', 'No ' + GEAR[k].en.toLowerCase() + ' aboard'); return null; }
  const lineOwn = () => ['hyse', 'bank'].map(lk => [lk, p2Units('line', lk)]).filter(x => x[1] > 0);
  const jigTxt = () => L(' · og juksa (' + p2JigGear()[0] + ')', ' · and the jig (' + p2JigGear()[1] + ')');
  const rigVal = o => o.rig === 'juksa' ? L('Juksa (' + p2JigGear()[0] + ')', 'Jigging (' + p2JigGear()[1] + ')') : o.rig === 'line' ? L('Line: ', 'Longline: ') + (lineOwn().map(x => x[1] + ' ' + L(LINE_KINDS[x[0]].no, LINE_KINDS[x[0]].en).toLowerCase()).join(', ') || L('ingen stamper', 'no tubs')) + (o.jig ? jigTxt() : '') : rigName(o.rig) + ', ' + ownedUnits(PLAN2_KIND[o.rig]) + ' ' + unitName(PLAN2_KIND[o.rig], ownedUnits(PLAN2_KIND[o.rig])) + (o.jig ? jigTxt() : '');
  function rigBody(o){
    const h = ['juksa', 'line', 'garn', 'teiner'].map(g => { const why = gearWhy(g), k = PLAN2_KIND[g]; return BIG('p2-rig', g === 'juksa' ? L('Bare juksa', 'Jigging only') : rigName(g), why || (g === 'juksa' ? L('Ut, fyll lasten, lever, og ut igjen', 'Out, fill the hold, land, and out again') : ownedUnits(k) + ' ' + unitName(k, ownedUnits(k)) + L(' eies', ' owned')), o.rig === g, 'data-g="' + g + '"', !!why); }).join('');
    const jig = p2Kind(o) ? '<h4 style="margin-top:12px">' + L('Jukse i tillegg mens redskapet står?', 'Jig as well while the gear stands?') + '</h4>' + BIG('p2-jig', L('Ja', 'Yes'), L('Juksa får timene til ståtida er ute, og resten av dagen.', 'The jig gets the hours until the soak is up, and the rest of the day.'), o.jig, 'data-v="1"') + BIG('p2-jig', L('Nei, bare redskapet', 'No, only the gear'), L('Båten venter ved redskapet', 'The boat waits by the gear'), !o.jig, 'data-v="0"') : '';
    return '<p class="ph-note">' + L('Ett redskap om gangen, fordelt i lenker på plassene, og juksa ved siden av. Alt redskap i sjøen må være trukket før båten rigges om. Juksa fisker med det som er valgt under Beholdning (nå ' + p2JigGear()[0] + '); lina settes med den typen hvert felt har, og agnet er det stampene er egnet med.', 'One kind of gear at a time, in strings at the places, and the jig beside it. All gear in the sea must be hauled before the boat is re-rigged. The jig fishes with what is chosen under Inventory (now ' + p2JigGear()[1] + '); the line goes out in the kind each field has, with the bait its tubs were baited with.') + '</p>' + h + jig;
  }
  // ---- Plasser: the list in the order she works them
  const own = (p, kind) => { const m = planMark(p, kind || null); return m ? (kind ? L('sist ' + fmt(m.kgu, 1) + ' kg per ' + GEAR[kind].u[0] + ' etter ' + Math.round(m.soak || 0) + ' t', 'last ' + fmt(m.kgu, 1) + ' kg a ' + GEAR[kind].u[2] + ' after ' + Math.round(m.soak || 0) + ' h') : L('sist ' + m.kgph + ' kg/t', 'last ' + m.kgph + ' kg/h')) : L('ikke fisket her ennå', 'not fished here yet'); };
  const placesVal = o => { const F = o.places.filter(q => q.k === 'felt').length, J = o.places.filter(q => q.k === 'juks').length; return (F ? F + ' ' + L('felt', F === 1 ? 'field' : 'fields') : '') + (F && J ? ', ' : '') + (J ? J + ' ' + L(J === 1 ? 'juksplass' : 'juksplasser', J === 1 ? 'jig place' : 'jig places') : '') || L('ingen ennå', 'none yet'); };
  // what the places lack for the plan to go, said on the row (U3): a field for the gear, or a jig place
  const placesMiss = o => p2Kind(o) ? (o.places.some(q => q.k === 'felt') ? '' : L('mangler felt', 'no field yet')) : (o.places.some(q => q.k === 'juks') ? '' : L('mangler juksplass', 'no jig place yet'));
  const SOAKSTEP = {line:1, garn:6, teine:12};
  function placesBody(o){
    const kind = p2Kind(o), h = [], home = portById(o.home), fi = {felt:0, juks:0};
    h.push('<p class="ph-note">' + L('Plassene i den rekkefølgen båten går dem. Tallene er dine egne fra de siste to ukene.', 'The places in the order the boat works them. The numbers are your own from the last two weeks.') + '</p>');
    o.places.forEach((q, i) => { fi[q.k]++; const isF = q.k === 'felt';
      h.push('<div class="dr-pl"><div class="dr-plh"><b>' + (isF ? L('Felt ', 'Field ') : L('Juksplass ', 'Jig place ')) + fi[q.k] + '</b><small>' + (home ? km(home.p, q) + L(' fra hjem · ', ' from home · ') : '') + own(q, isF ? kind : null) + '</small></div>' +
        '<div class="dr-plc">' + (isF ? (kind === 'line' && lineOwn().length > 1 ? '<span>' + T('p2-plk', L(LINE_KINDS[q.lk || 'hyse'].no, LINE_KINDS[q.lk || 'hyse'].en), false, 'data-id="' + q.id + '"') + '</span>' : '') + '<span>' + STEP('p2-pn', q.n + ' ' + unitName(kind, q.n) + (kind === 'line' && lineOwn().length > 1 ? '' : '') + ' <small>' + L('av ', 'of ') + Math.max(0, p2Left(o, q)) + '</small>', ' data-id="' + q.id + '"') + '</span><span>' + STEP('p2-ps', q.soak + L(' t ståtid', ' h soak'), ' data-id="' + q.id + '"') + '</span>' : '') +
        '<span>' + T('p2-pup', '↑', false, 'data-i="' + i + '"' + (i ? '' : ' disabled')) + T('p2-pdn', '↓', false, 'data-i="' + i + '"' + (i < o.places.length - 1 ? '' : ' disabled')) + T('p2-pdel', L('Fjern', 'Remove'), false, 'data-id="' + q.id + '"') + '</span></div></div>'); });
    if (o.places.length < DRP2.placesMax){ if (kind) h.push(B('p2-add', L('+ Felt for ', '+ Field for ') + GEAR[kind].no.toLowerCase(), 'data-k="felt"', adding === 'felt' ? 'p' : '')); if (p2Jig(o)) h.push(B('p2-add', L('+ Juksplass', '+ Jig place'), 'data-k="juks"', adding === 'juks' ? 'p' : '')); }
    if (adding) h.push(addBody(o, adding));
    if (typeof PLANMAP !== 'undefined') h.push(B('p2-map', L('Velg i kartet …', 'Choose in the chart …'), '', 'p'));
    return h.join('');
  }
  function addBody(o, k){
    const kind = k === 'felt' ? p2Kind(o) : null, home = portById(o.home) || portById(S.boat.port) || nearestPort(S.boat.pos), out = [], taken = q => o.places.some(p => dist(p, q) < 0.3);
    for (const m of (S.marks || []).filter(m => (m.g || null) === (kind || null) && S.t - m.t < PLAN_MEMO).sort((a, c) => (c.kgph || c.kgu || 0) - (a.kgph || a.kgu || 0))){ if (dist(m, home.p) > 40 || taken(m) || out.some(q => dist(q, m) < 1)) continue; out.push({x:m.x, y:m.y, no:L('Fangstplass: ', 'Catch mark: ') + own(m, kind)}); if (out.length >= 3) break; }
    if (kind) for (const s of mySets().filter(s => s.kind === kind)){ const m = setMid(s); if (!taken(m) && !out.some(q => dist(q, m) < 1)) out.push({x:m.x, y:m.y, no:L('Der redskapet står nå', 'Where the gear stands now')}); }
    const b = S.boat; if (b.status !== 'port' && !taken(b.pos)) out.push({x:b.pos.x, y:b.pos.y, no:L('Der båten er nå', 'Where the boat is now')});
    sugg = out;
    return '<div class="dr-add">' + (out.length ? out.map((q, i) => BIG('p2-addp', q.no, km(home.p, q) + L(' fra ', ' from ') + home.name, false, 'data-i="' + i + '"')).join('') : '<p class="ph-note">' + L('Ingen plasser å foreslå ennå. Velg i kartet.', 'No places to suggest yet. Choose in the chart.') + '</p>') + '</div>';
  }
  // why a place cannot be there (land, shallow, the rules), or null; put() adds it and says why not
  function placeWhy(o, k, q){
    try { if (isLand(q)) return L('Det er land der.', 'That is land.'); if (depthF(q) < 5) return L('For grunt der.', 'Too shallow there.'); } catch (e){}
    const kind = p2Kind(o); if (k === 'felt' && !kind) return L('Båten fisker bare med juksa.', 'The boat fishes with the jig only.');
    return (k === 'felt' ? ruBlockMsg({p:q, len:BOAT.len, gear:o.rig === 'teiner' ? 'teiner' : kind, sp:kind === 'teine' ? 'krabbe' : null}) : ruBlockMsg({p:q, len:BOAT.len, gear:'juksa', sp:(typeof jigKind === 'function' && jigKind() === 'kveite') ? 'kveite' : null, hand:!(S.equip && S.equip.jukse > 0)})) || null;
  }
  function put(o, k, q){
    const kind = p2Kind(o), why = placeWhy(o, k, q);
    if (why){ toast(why); return false; }
    if (k === 'felt'){ const lk = kind === 'line' ? p2LineKind(o) : null, probe = {k:'felt', lk, n:0}, left = p2Left(o, probe);
      if (left < 1){ toast(L('Alle ' + unitName(kind, 2) + (kind === 'line' ? ' ' + LINE_KINDS[lk].no.toLowerCase() : '') + ' er alt fordelt på feltene. Ta fra et annet felt først.', 'All the ' + unitName(kind, 2) + (kind === 'line' ? ' of ' + LINE_KINDS[lk].en.toLowerCase() : '') + ' are already on the fields. Take from another field first.')); return false; }
      const n = kind === 'garn' ? Math.min(left, (S.pgear.nets[0] || {n:6}).n) : kind === 'line' ? Math.min(left, Math.max(2, Math.round(left / 2))) : Math.min(left, 10);
      o.places.push({id:plan2Sid(), k:'felt', x:q.x, y:q.y, n, soak:DRP2.soakDef[kind], hdg:null, lk}); }
    else o.places.push({id:plan2Sid(), k:'juks', x:q.x, y:q.y});
    return true;
  }
  // ---- Levering
  const whenName = w => w === 'trip' ? L('hver tur', 'every trip') : w === 'days' ? L('hvert ' + (o => o)(2) + '. døgn', 'every 2nd day') : L('når lasten er full', 'when the hold is full');
  const landVal = o => (o.land.mode === 'port' && o.land.port ? nm(o.land.port) : L('Nærmeste mottak', 'The nearest plant') + (o.M && plan2Made(o) ? ' (' + nm(o.M) + ')' : '')) + ' · ' + (o.land.when === 'days' ? L('hvert ' + o.land.days + '. døgn', 'every ' + o.land.days + ' days') : whenName(o.land.when));
  function landBody(o){
    const P = o.places, mid = P.length ? {x:P.reduce((a, q) => a + q.x, 0) / P.length, y:P.reduce((a, q) => a + q.y, 0) / P.length} : (portById(o.home) || {p:S.boat.pos}).p;
    const near = PORTS.filter(q => q.mottak).map(q => ({q, d:dist(q.p, mid)})).sort((x, y) => x.d - y.d).slice(0, 4);
    const h = ['<h4>' + L('Hvor', 'Where') + '</h4>', BIG('p2-land-mode', L('Nærmeste mottak', 'The nearest plant'), L('Det av de nærmeste plassene båten når raskest', 'The one of the nearest the grounds the boat reaches soonest'), o.land.mode === 'near', 'data-v="near"')];
    for (const x of near) h.push(BIG('p2-land-port', x.q.name, fmt(x.d / NM, 0) + L(' nm fra plassene', ' nm from the grounds'), o.land.mode === 'port' && o.land.port === x.q.id, 'data-p="' + x.q.id + '"'));
    h.push('<h4 style="margin-top:12px">' + L('Når', 'When') + '</h4>');
    h.push(BIG('p2-land-when', L('Når lasten er full', 'When the hold is full'), L('Eller når fisken må leveres for ferskhetens skyld. Ellers holdes fangsten i is om bord.', 'Or when the fish must go for the sake of freshness. Else the catch is kept in ice aboard.'), o.land.when === 'full', 'data-v="full"'));
    h.push(BIG('p2-land-when', L('Hver tur', 'Every trip'), L('Til mottaket hver dag før hjemturen', 'To the plant every day before the way home'), o.land.when === 'trip', 'data-v="trip"'));
    h.push(BIG('p2-land-when', L('Hvert ' + o.land.days + '. døgn', 'Every ' + o.land.days + ' days'), L('Og når lasten er full eller fisken må leveres', 'And when the hold is full or the fish must go'), o.land.when === 'days', 'data-v="days"'));
    if (o.land.when === 'days') h.push('<div class="ph-kv dr-kv"><span>' + L('Hvert', 'Every') + '</span><span>' + STEP('p2-land-days', o.land.days + L('. døgn', ' days')) + '</span></div>');
    return h.join('');
  }
  // ---- Vær
  const WXP = {safe:{wind:10, hs:1.5, no:'Forsiktig', en:'Careful'}, normal:{wind:13, hs:2.5, no:'Vanlig', en:'Normal'}, tough:{wind:16, hs:3.5, no:'Tøff', en:'Rough'}};
  const hsMax = () => Math.round(BOAT.risk[1] * 0.95 * 10) / 10, windMax = () => Math.round(BOAT.risk[2] || 20);
  // a preset as this boat takes it: never over her own limits, as + stops there (GUI review F5: «Tøff» gave 16 m/s on a boat that takes 15)
  const wxOf = k => ({wind:Math.min(WXP[k].wind, windMax()), hs:Math.min(WXP[k].hs, hsMax())});
  const wxVal = o => L('Inntil ', 'Up to ') + o.wx.wind + ' m/s ' + L('og', 'and') + ' ' + fmt(Math.min(o.wx.hs, hsMax()), 1) + ' m';
  function wxBody(o){
    return '<div class="ph-kv dr-kv"><span>' + L('Vind', 'Wind') + '</span><span>' + STEP('p2-wx-w', o.wx.wind + ' m/s') + '</span></div><div class="ph-kv dr-kv"><span>' + L('Sjø', 'Sea') + '</span><span>' + STEP('p2-wx-h', fmt(o.wx.hs, 1) + ' m') + '</span></div>' +
      '<div class="ops-days">' + Object.keys(WXP).map(k => { const P = wxOf(k); return T('p2-wx-preset', L(WXP[k].no, WXP[k].en) + ' ' + P.wind + '/' + fmt(P.hs, 1), o.wx.wind === P.wind && o.wx.hs === P.hs, 'data-v="' + k + '"'); }).join('') + '</div>' +
      '<p class="ph-note">' + L('Over grensene venter båten hjemme til varselet for de neste timene er under. Blir det verre ute, går den i ly samme vei tilbake. Båten tåler ' + fmt(hsMax(), 1) + ' m sjø, og den grensen gjelder uansett.', 'Over the limits the boat waits at home until the next hours\' forecast is under. If it gets worse out there, she goes to shelter back the way she came. The boat takes ' + fmt(hsMax(), 1) + ' m of sea, and that limit holds regardless.') + '</p>';
  }
  // ---- Rytme
  const rhythmVal = o => o.rhythm === 'watch' ? L('Døgndrift, to vakter à 12 t', 'Round the clock, two watches of 12 h') : o.rhythm === 'multi' ? L('Turer på ' + o.days + ' døgn, ut kl. ', 'Trips of ' + o.days + ' days, out at ') + driftClock(o.dep) : L('Dagdrift, ut kl. ', 'Day trips, out at ') + driftClock(o.dep);
  function rhythmBody(o){
    const st = plan2State(o), aboard = st.crew.length + (st.me.aboard ? 1 : 0);
    // (the boat's own limits first, GUI review U2: a boat that can never go round the clock says so, not «you are three»)
    const wWhy = plan2WatchWhy(st, aboard, true), mWhy = st.bunks > 0 ? null : L('Krever køyer om bord', 'Needs bunks aboard');
    return BIG('p2-rhythm', L('Dagdrift', 'Day trips'), L('Ut til fast tid, hjem og hvile om kvelden. Skipperen går dagvakt.', 'Out at a set hour, home and rest in the evening. The skipper keeps the day watch.'), o.rhythm === 'day', 'data-v="day"') +
      BIG('p2-rhythm', L('Døgndrift', 'Round the clock'), wWhy || L('To vakter på tolv timer: skipperen 06–18 (du, når du er om bord), styrmannen 18–06. Den som har fri, sover i køya. Båten leverer når lasten er full.', 'Two watches of twelve hours: the skipper 06–18 (you, when aboard), the mate 18–06. The watch off sleeps in the bunks. The boat lands when the hold is full.'), o.rhythm === 'watch', 'data-v="watch"', !!wWhy && o.rhythm !== 'watch') +
      BIG('p2-rhythm', L('Turer over flere døgn', 'Trips of several days'), mWhy || L('Mannskapet hviler om bord underveis. Hjem når turen er over.', 'The crew rest aboard on the way. Home when the trip is over.'), o.rhythm === 'multi', 'data-v="multi"', !!mWhy && o.rhythm !== 'multi') +
      (o.rhythm !== 'watch' ? '<div class="ph-kv dr-kv"><span>' + L('Ut kl.', 'Out at') + '</span><span>' + STEP('p2-dep', driftClock(o.dep)) + '</span></div>' : '') +
      (o.rhythm === 'multi' ? '<div class="ph-kv dr-kv"><span>' + L('Turen varer', 'The trip lasts') + '</span><span>' + STEP('p2-days', o.days + L(' døgn', ' days')) + '</span></div>' : '');
  }
  // ---- Mannskap
  function crewVal(o){
    const sk = crewSkipper(), mt = crewMate(), f = c => c.name.split(' ')[0];
    if (meAboard()) return L('Du er skipper', 'You are the skipper') + (mt ? L(', ' + f(mt) + ' er styrmann', ', ' + f(mt) + ' is the mate') : '');
    if ((VESSELS[S.boat.type].crewMax || 0) < 2) return L('Går bare med deg om bord', 'Runs only with you aboard');
    return (sk ? L('Skipper ', 'Skipper ') + f(sk) : L('Ingen skipper', 'No skipper')) + ' · ' + (mt && mt !== sk ? L('styrmann ', 'mate ') + f(mt) : L('ingen styrmann', 'no mate'));
  }
  function crewBody(o){
    const one = (VESSELS[S.boat.type].crewMax || 0) < 2;
    return '<p class="ph-note">' + (one ? L('Båten har plass til bare én i mannskapet. Planen går derfor bare når du er om bord, og venter mens du er i land.', 'The boat has room for only one crew. So the plan runs only when you are aboard, and waits while you are ashore.')
      : L('Når du er om bord, er du skipper og går dagvakta. Når du ikke er det, må både en skipper og en styrmann være utnevnt. Det gjør du på Mannskap-siden.', 'When you are aboard, you are the skipper and keep the day watch. When you are not, both a skipper and a mate must be appointed. You do that on the Crew page.')) + '</p>' + (one ? '' : B('p2-crew', L('Til Mannskap-siden', 'To the Crew page')));
  }
  // the way to the nearest tackle shop or yard (U9 A, U13: the buoy sets are bought at the shop and the hauler fitted at the yard, there and
  // only there, docs/handelssteder.md): Autonav, as the trade pages have it, or the page itself when the boat lies there
  const PLACEPG = {butikk:['fiske', 'utstyrsbutikken', 'the tackle shop'], verft:['utstyr', 'verftet', 'the yard']};
  function placeWay(k){ const n = placesNear(S.boat.pos, k, 1)[0], P = PLACEPG[k]; if (!n) return ''; const here = S.boat.status === 'port' && S.boat.port === n.pt.id;
    // (the place's name says what it is: «Skaland utstyrsbutikk»)
    return here ? B('open', L('Til ' + P[1] + ' her', 'To ' + P[2] + ' here'), 'data-a="' + P[0] + '"', 'p')
      : B('goplace', L('Autonav til ', 'Autonav to ') + n.pt.name + ' · ' + fmt(n.d / NM, 1) + ' nm', 'data-id="' + n.pt.id + '"', 'p'); }
  // a reason the plan is not ready, as the way to what mends it (GUI review U13): the row, the Crew page or the quota; the shop and the yard by their way
  const why = (e, go) => PLACEPG[go] ? '<p class="bad">' + e + '</p>' + placeWay(go) : go ? '<button class="dr-why" data-pa="p2-go" data-go="' + go + '"><span>' + e + '</span><b>›</b></button>' : '<p class="bad">' + e + '</p>';
  // ---- the top: Start or Pause, Nå, and the button that fixes a stop
  function top(o, C){
    const h = ['<div class="ph-card"><h4>' + L('Driftsplan · «', 'Operations plan · «') + S.boatName + '»</h4>'];
    const now = nowOf(o), stopped = !o.on && o.stop;
    if (busy || o.building) h.push('<button class="dr-onoff" disabled>' + L('Lager planen …', 'Making the plan …') + '</button>');
    else if (o.on) h.push('<button class="dr-onoff on" data-pa="p2-pause">' + L('På · trykk for pause', 'On · tap to pause') + '</button>');
    else h.push('<button class="dr-onoff" data-pa="p2-start"' + (C.ok ? '' : ' disabled') + '>' + (C.ok ? L('Start planen', 'Start the plan') : L('Ikke klar ennå', 'Not ready yet')) + '</button>');
    if (o.on || stopped || o.paused) h.push('<div class="dr-now' + (now[1] === 'bad' || stopped ? ' bad' : now[1] === 'wait' ? ' wait' : '') + '"><b>' + L('Nå: ', 'Now: ') + '</b>' + now[0] + '</div>');
    if (o.on && o.run && o.run.fail && S.t - o.run.fail.t < 1440) h.push('<p class="warn">' + L('Kunne ikke sette eller trekke: ', 'Could not set or haul: ') + L(o.run.fail.no, o.run.fail.en) + '</p>');
    if (o.on && o.held) h.push(B('p2-resume', L('Gi båten tilbake til planen', 'Give the boat back to the plan'), '', 'p'));
    if (stopped && o.stop.fix) h.push(B('p2-fix', {places:L('Endre plassene', 'Change the places'), mannskap:L('Til Mannskap-siden', 'To the Crew page'), quota:L('Se kvoten', 'See the quota'), rig:L('Endre redskapet', 'Change the gear')}[o.stop.fix] || L('Se planen', 'See the plan'), '', 'p'));
    // the gear in the sea while the plan is off (choice 2 A): said, with the trip that fetches it
    if (!o.on){ const sets = mySets(); if (sets.length){ const H = S.t / 60; h.push('<p class="warn">' + L(sets.map(s => s.n + ' ' + unitName(s.kind, s.n) + ' har stått ' + fmt(H - s.tSet / 60, 0) + ' t').join(', ') + ' i sjøen.', sets.map(s => s.n + ' ' + unitName(s.kind, s.n) + ' has stood ' + fmt(H - s.tSet / 60, 0) + ' h').join(', ') + ' in the sea.') + '</p>' + B('p2-fetch', L('Hent redskapet', 'Fetch the gear'))); } }
    if (!o.on && !C.ok) h.push(C.errors.map((e, i) => why(e, C.go[i])).join(''));
    if (o.err && !o.on) h.push('<p class="bad">' + o.err + '</p>');
    h.push(C.warnings.map(e => '<p class="warn">' + e + '</p>').join(''));
    h.push('</div>'); return h.join('');
  }
  // ---- the statistics (R9): today, the last seven days, and all
  function stats(o){
    const St = o.stats || {days:[], sum:{}}, today = gDate(S.t / 60).toISOString().slice(0, 10), days7 = []; for (let k = 6; k >= 0; k--) days7.push(gDate(S.t / 60 - k * 24).toISOString().slice(0, 10));
    const sum = list => { const r = {trips:0, kg:0, kr:0, lott:0, cost:0, conf:0, caught:0, out:0, sp:{}, port:{}}; for (const d of list){ r.trips += d.trips; r.caught += d.caught || 0; r.out += d.out || 0; r.kg += d.kg; r.kr += d.kr; r.lott += d.lott || 0; r.cost += d.cost || 0; r.conf += d.conf || 0; for (const k in d.sp) r.sp[k] = (r.sp[k] || 0) + d.sp[k]; for (const k in d.port) r.port[k] = (r.port[k] || 0) + d.port[k]; } return r; };
    const D = sum(St.days.filter(d => d.d === today)), W = sum(St.days.filter(d => days7.includes(d.d))), A = St.sum && St.sum.kg != null ? Object.assign({}, St.sum, Number.isFinite(St.sum.cost) ? {} : {cost:sum(St.days).cost}) : sum(St.days); const hold = Math.round(holdTotal()), cap = Math.round(capHold());
    const top = r => { const tot = Object.values(r.sp).reduce((a, v) => a + v, 0); return tot ? Object.entries(r.sp).sort((a, c) => c[1] - a[1]).slice(0, 3).map(([k, v]) => (SPECIES[k] ? SPECIES[k][S.lang === 'no' ? 'no' : 'en'] : k) + ' ' + Math.round(100 * v / tot) + ' %').join(', ') : '–'; };
    const ports = r => Object.entries(r.port).map(([k, v]) => nm(k) + ' ' + fmt(v, 0) + ' kg').join(', ') || '–';
    const tr = (lbl, f) => '<tr><td>' + lbl + '</td><td>' + f(D) + '</td><td>' + f(W) + '</td><td>' + f(A) + '</td></tr>';
    const dkg = x => x ? Math.max(x.kg, x.caught || 0) : 0, mx = Math.max(1, ...days7.map(d => dkg(St.days.find(x => x.d === d))));
    return '<div class="ph-card"><h4>' + L('Statistikk', 'Statistics') + '</h4><table class="p2-stat"><tr><th></th><th>' + L('i dag', 'today') + '</th><th>' + L('7 døgn', '7 days') + '</th><th>' + L('alt', 'all') + '</th></tr>' +
      tr(L('Fisket', 'Caught'), r => fmt(r.caught || 0, 0) + ' kg') + tr(L('Levert', 'Landed'), r => fmt(r.kg, 0) + ' kg') + tr(L('Inntekt etter lott', 'Income after shares'), r => kr(Math.round(r.kr))) + tr(L('Lott', 'Shares'), r => kr(Math.round(r.lott))) + tr(L('Utgifter', 'Costs'), r => kr(Math.round(r.cost))) + (A.conf ? tr(L('Inndratt', 'Confiscated'), r => fmt(r.conf, 0) + ' kg') : '') + tr(L('Turer', 'Trips'), r => r.out || 0) + tr(L('Leveringer', 'Landings'), r => r.trips) + '</table>' +
      (hold >= 1 ? '<div class="ph-kv"><span>' + L('Om bord nå', 'Aboard now') + '</span><span>' + fmt(hold, 0) + ' kg ' + L('av', 'of') + ' ' + fmt(cap, 0) + ' kg</span></div>' : '') +
      '<div class="ph-kv"><span>' + L('Arter, 7 døgn', 'Species, 7 days') + '</span><span>' + top(W) + '</span></div><div class="ph-kv"><span>' + L('Mottak, 7 døgn', 'Plants, 7 days') + '</span><span>' + ports(W) + '</span></div>' +
      '<div class="dr-w7">' + days7.map(d => { const k = dkg(St.days.find(y => y.d === d)); return '<i style="height:' + Math.max(2, Math.round(k / mx * 100)) + '%" title="' + fmt(k, 0) + ' kg"></i>'; }).join('') + '</div><div class="dr-w7l">' + days7.map(d => '<span>' + d.slice(8) + '.</span>').join('') + '</div>' +
      (A.trips ? '' : '<p class="ph-note">' + L('Ingen leveringer på planen ennå.', 'No landings on the plan yet.') + '</p>') +
      (hold >= 1 && (o.land || {}).when !== 'trip' ? '<p class="ph-note">' + L('Fangsten holdes i is om bord til den leveres etter Levering-raden: ' + ((o.land || {}).when === 'days' ? 'hvert ' + o.land.days + '. døgn, ' : '') + 'når lasten er ' + Math.round(DRP2.full * 100) + ' % full, eller når fisken må leveres for ferskhetens skyld.', 'The catch is kept in ice aboard until it is landed by the Landing row: ' + ((o.land || {}).when === 'days' ? 'every ' + o.land.days + ' days, ' : '') + 'when the hold is ' + Math.round(DRP2.full * 100) + ' % full, or when the fish must go for the sake of freshness.') + '</p>' : '') + '</div>';
  }
  // ---- the page
  function fresh(){
    const b = S.boat, here = b.status === 'port' ? b.port : nearestPort(b.pos).id, bunk = (VESSELS[b.type].berths || 0) > 0, hv = havnOptions(portById(here).p, 15)[0];
    let home = plan2RestOk(here) && (isRorbu(here) || here === (S.home || HOME0) || isBerth(here)) ? here : bunk && hv ? hv.place.id : null;
    if (!home){ try { const r = rorbuSites(portById(here).p, 40)[0]; if (r) home = r.id; } catch (e){} }
    if (!home && hv) home = hv.place.id; if (!home && plan2RestOk(here)) home = here;
    const rig = RIGS[b.rig] && rigHas(b.rig) ? b.rig : 'juksa', kind = PLAN2_KIND[rig] || null, o = plan2New({home:home || here, rig});
    if (isBerth(o.home)) havnHold(o.home);
    if (kind) for (const s of mySets().filter(s => s.kind === kind).slice(0, DRP2.placesMax - 1)){ const m = setMid(s); o.places.push({id:plan2Sid(), k:'felt', x:m.x, y:m.y, n:s.n, soak:DRP2.soakDef[kind], hdg:null}); }
    const p0 = portById(o.home).p, m = (S.marks || []).filter(x => !x.g && S.t - x.t < PLAN_MEMO && dist(x, p0) < 30).sort((a, c) => (c.kgph || 0) - (a.kgph || 0))[0];
    if (m) o.places.push({id:plan2Sid(), k:'juks', x:m.x, y:m.y});
    return o;
  }
  function page(){
    const o = plan2Ops();
    if (!o) return '<div class="ph-c dr-page"><div class="ph-card"><h4>' + L('Driftsplan for «', 'Operations plan for «') + S.boatName + '»</h4><p class="ph-note">' + L('Med en driftsplan fisker, leverer og hviler båten på egen hånd, hver dag, også når spillet er lukket. Du velger hvor båten hører hjemme, hva og hvor den fisker, hvor den leverer, hvilket vær den går i og hvilken rytme mannskapet har. Planen legger dagen selv og viser den her.', 'With an operations plan the boat fishes, lands and rests on her own, every day, also while the game is closed. You choose where she belongs, what and where she fishes, where she lands, what weather she goes out in and the crew\'s rhythm. The plan lays the day itself and shows it here.') + '</p>' + B('p2-new', L('Lag driftsplan', 'Make a plan'), '', 'p') + '</div></div>';
    const C = plan2Check(o), h = ['<div class="ph-c dr-page">', top(o, C)];
    h.push(dayCard(o));
    h.push('<div class="ph-card dr-rows">' +
      row('home', L('Hjem', 'Home'), o.home ? nm(o.home) + (o.anchor && (BOAT.len || 0) >= DRP.bigLen ? L(', til ankers', ', at anchor') : '') : L('ikke valgt', 'not chosen'), () => homeBody(o), !o.home) +
      row('rig', L('Redskap', 'Gear'), rigVal(o) + (gearWhy(o.rig) ? ' · ' + gearWhy(o.rig).toLowerCase() : ''), () => rigBody(o), !!gearWhy(o.rig)) +
      row('places', L('Plasser', 'Places'), placesVal(o) + (placesMiss(o) ? ' · ' + placesMiss(o) : ''), () => placesBody(o), !!placesMiss(o)) +
      row('land', L('Levering', 'Landing'), landVal(o), () => landBody(o)) +
      row('wx', L('Vær', 'Weather'), wxVal(o), () => wxBody(o)) +
      row('rhythm', L('Rytme', 'Rhythm'), rhythmVal(o), () => rhythmBody(o)) +
      row('crew', L('Mannskap', 'Crew'), crewVal(o), () => crewBody(o), !meAboard() && (VESSELS[S.boat.type].crewMax || 0) >= 2 && !(crewSkipper() && crewMate() && crewSkipper() !== crewMate())) + '</div>');
    h.push(stats(o));
    const others = (S.fleet || []).filter(v => v.id !== S.cur);
    h.push('<div class="ph-card">' + (others.length ? '<h4>' + L('Kopier planen til en annen båt', 'Copy the plan to another vessel') + '</h4><div class="ops-days">' + others.map(v => T('p2-copy', vget(v, 'boatName'), false, 'data-id="' + v.id + '"')).join('') + '</div>' : '') + B('p2-reset', L('Slett driftsplanen', 'Delete the plan'), '', 'dr-del') + '</div></div>');
    return h.join('');
  }
  function start(o){
    const C = plan2Check(o); if (!C.ok){ toast(C.errors[0]); return; }
    const go = () => { plan2Start(o); toast(L('Driftsplanen er på.', 'The plan is on.')); };
    if (plan2Made(o)){ go(); return; }
    busy = true; plan2Make(o, err => { busy = false; if (err) toast(err); else go(); rerender(); });
  }
  // the gear in the sea is fetched on one trip while the plan is off (choice 2 A): a day of hauls without setting again, then home
  function fetch(o){
    if (!plan2Made(o)){ busy = true; plan2Make(o, err => { busy = false; if (err) toast(err); else fetch(o); rerender(); }); return; }
    plan2Abort(o); o.fetch = true; o.on = true; o.stop = null; o.held = null; o.hold = 0; o.run = null; o.paused = null; toast(L('Båten går ut og henter redskapet.', 'The boat goes out to fetch the gear.'));
  }
  function act(a, d){
    if (a === 'p2-new'){ S.ops = fresh(); open = null; return true; }
    const o = plan2Ops(); if (!o) return false;
    const pl = id => o.places.find(q => q.id === id), kind = p2Kind(o);
    if (a === 'p2-row'){ open = open === d.k ? null : d.k; adding = null; return true; }
    if (a === 'p2-start'){ start(o); return true; }
    if (a === 'p2-pause'){ plan2Pause(o); toast(!o.paused.sea ? L('Driftsplanen står på pause. Redskapet i sjøen står der det står.', 'The plan is paused. The gear in the sea stays where it is.') : S.boat.anch ? L('Driftsplanen står på pause. Båten ankrer der den er, og redskapet i sjøen står der det står.', 'The plan is paused. The boat anchors where she is, and the gear in the sea stays where it is.') : L('Driftsplanen står på pause. Båten driver der den er' + driftWhy(o)[0] + '. Redskapet i sjøen står der det står.', 'The plan is paused. The boat drifts where she is' + driftWhy(o)[1] + '. The gear in the sea stays where it is.')); return true; }
    if (a === 'p2-resume'){ plan2Resume(o); return true; }
    if (a === 'p2-fetch'){ fetch(o); return true; }
    if (a === 'p2-fix'){ const f = o.stop && o.stop.fix; if (f === 'mannskap'){ PHONE.open('arbeid'); return false; } if (f === 'quota'){ PHONE.open('kvote'); return false; } open = f === 'rig' ? 'rig' : 'places'; return true; }
    if (a === 'p2-crew'){ PHONE.open('arbeid'); return false; }
    if (a === 'p2-go'){ const g = d.go; if (g === 'mannskap'){ PHONE.open('arbeid'); return false; } if (g === 'quota'){ PHONE.open('kvote'); return false; }
      if (!['home', 'rig', 'places', 'land', 'wx', 'rhythm', 'crew'].includes(g)) return false; open = g; adding = null;
      // (the row stands further down: it is brought up under the finger once the page is drawn anew)
      setTimeout(() => { for (const e of document.querySelectorAll('.dr-row.on')) if (e.offsetParent) e.scrollIntoView({block:'start', behavior:'smooth'}); }, 30); return true; }
    if (a === 'p2-home'){ const old = o.home; o.home = d.p; if (isBerth(d.p)) havnHold(d.p); if (isBerth(old) && old !== d.p) havnFree(old); return true; }
    if (a === 'p2-anchor'){ o.anchor = d.v === '1'; return true; }
    if (a === 'p2-rig'){ if (gearWhy(d.g)) return false; if (d.g !== o.rig){ o.rig = d.g; o.places = o.places.filter(q => q.k === 'juks'); if (!PLAN2_KIND[d.g]) o.jig = true; } return true; }
    if (a === 'p2-quota'){ PHONE.open('kvote'); return false; }
    if (a === 'p2-jig'){ o.jig = d.v === '1'; return true; }
    if (a === 'p2-add'){ adding = adding === d.k ? null : d.k; return true; }
    if (a === 'p2-addp'){ const q = (sugg || [])[+d.i]; if (!q) return false; if (put(o, adding, q)) adding = null; return true; }
    if (a === 'p2-map'){ if (typeof PLANMAP !== 'undefined') PLANMAP.open(S.cur); return true; }
    if (a === 'p2-pn'){ const q = pl(d.id); if (!q) return false; const mx = Math.max(1, Math.min(p2Left(o, q), (BOAT.gearMax || {})[kind === 'line' ? 'stamp' : kind] || 99)); const n = clamp(q.n + (+d.d), 1, mx); if (n === q.n && +d.d > 0) toast(L('Båten har ikke flere ' + unitName(kind, 2) + (kind === 'line' ? ' ' + LINE_KINDS[q.lk || 'hyse'].no.toLowerCase() : '') + ' til dette feltet.', 'The boat has no more ' + unitName(kind, 2) + ' for this field.')); q.n = n; return true; }
    if (a === 'p2-plk'){ const q = pl(d.id); if (!q || kind !== 'line') return false; q.lk = (q.lk || 'hyse') === 'hyse' ? 'bank' : 'hyse'; q.n = clamp(q.n, 1, Math.max(1, p2Left(o, q))); return true; }
    if (a === 'p2-ps'){ const q = pl(d.id); if (!q) return false; const st = SOAKSTEP[kind] || 1; q.soak = clamp(q.soak + st * (+d.d), st, DRP2.soak[kind][3]); return true; }
    if (a === 'p2-pdel'){ const i = o.places.findIndex(q => q.id === d.id); if (i >= 0) o.places.splice(i, 1); return true; }
    if (a === 'p2-pup' || a === 'p2-pdn'){ const i = +d.i, j = a === 'p2-pup' ? i - 1 : i + 1; if (j < 0 || j >= o.places.length) return false; const t = o.places[i]; o.places[i] = o.places[j]; o.places[j] = t; return true; }
    if (a === 'p2-land-mode'){ o.land.mode = 'near'; o.land.port = null; return true; }
    if (a === 'p2-land-port'){ o.land.mode = 'port'; o.land.port = d.p; return true; }
    if (a === 'p2-land-when'){ o.land.when = d.v; return true; }
    if (a === 'p2-land-days'){ o.land.days = clamp((o.land.days || 2) + (+d.d), 2, 7); return true; }
    if (a === 'p2-wx-w'){ o.wx.wind = clamp(o.wx.wind + (+d.d), 5, windMax()); return true; }
    if (a === 'p2-wx-h'){ o.wx.hs = clamp(Math.round((o.wx.hs + 0.5 * (+d.d)) * 10) / 10, 0.5, hsMax()); return true; }
    if (a === 'p2-wx-preset'){ if (!WXP[d.v]) return false; o.wx = wxOf(d.v); return true; }
    if (a === 'p2-rhythm'){ o.rhythm = d.v; return true; }
    if (a === 'p2-dep'){ o.dep = clamp(o.dep + 0.5 * (+d.d), 0, 23.5); return true; }
    if (a === 'p2-days'){ o.days = clamp(o.days + (+d.d), 2, 7); return true; }
    if (a === 'p2-copy'){ if (plan2Copy(d.id)) toast(L('Planen er kopiert til «' + vget(vesselById(d.id), 'boatName') + '». Sjekk den og start den der.', 'The plan is copied to «' + vget(vesselById(d.id), 'boatName') + '». Check it and start it there.')); return true; }
    if (a === 'p2-reset'){ askReset(o); return false; }
    return false;
  }
  // Slett (GUI review P7 A): the game's own dialog, with the plan by its boat's name and what becomes of the gear in the sea
  function askReset(o){
    const sets = mySets(), gear = sets.length ? '<p>' + L(sets.map(s => s.n + ' ' + unitName(s.kind, s.n)).join(', ') + ' står i sjøen. ' + (sets.length > 1 ? 'De' : 'Det') + ' blir stående der når planen er slettet, og må hentes med båten. Vil du ha redskapet om bord først, trykk «Hent redskapet» i stedet.', sets.map(s => s.n + ' ' + unitName(s.kind, s.n)).join(', ') + ' stand' + (sets.length > 1 || sets[0].n > 1 ? '' : 's') + ' in the sea. It stays there when the plan is deleted, and must be fetched with the boat. To have the gear aboard first, tap «Fetch the gear» instead.') + '</p>' : '<p>' + L('Ingen redskap fra planen står i sjøen.', 'No gear of the plan stands in the sea.') + '</p>';
    modal('<h3>' + L('Slette driftsplanen for «' + S.boatName + '»?', 'Delete the plan for «' + S.boatName + '»?') + '</h3><p>' + L('Hjem, redskap, plassene, levering, vær, rytme og statistikken for planen blir borte.', 'The home, gear, places, landing, weather, rhythm and the plan\'s statistics are gone.') + '</p>' + gear +
      '<div class="btns"><button class="btn primary" data-close>' + L('Behold planen', 'Keep the plan') + '</button><button class="btn dr-danger" id="p2Del">' + L('Slett planen', 'Delete the plan') + '</button></div>');
    $('p2Del').onclick = () => { $('modal').hidden = true; if (plan2Ops() !== o) return; const hm = o.home; S.ops = null; open = null; if (S.plan && S.plan.ops) S.plan.ops = false; if (isBerth(hm)) havnFree(hm); if (typeof save === 'function') save(); rerender(); if (typeof DOCK !== 'undefined') DOCK.redraw(); };
  }
  // one line for the Crew page: what the plan does now, and the way to it
  function line(){ const o = plan2Ops(), n = o ? nowOf(o)[0] : L('Ingen driftsplan', 'No operations plan'); return '<div class="ph-card dr-line"><span><b>' + L('Driftsplan', 'Operations plan') + '</b><small>' + n + '</small></span><button class="ph-btn" data-pa="open" data-a="drift">' + L('Åpne', 'Open') + '</button></div>'; }
  return {page, act, line, nowOf, preview, put, placeWhy, fresh};
})();
// the plan to another vessel of the company: the answers, made again there
function plan2Copy(vid){
  const o = plan2Ops(), v = vesselById(vid); if (!o || !v || v.id === S.cur) return false;
  const copy = {home:o.home, anchor:o.anchor, rig:o.rig, jig:o.jig, places:o.places.map(q => ({...q, id:plan2Sid()})), wx:{...o.wx}, rhythm:o.rhythm, dep:o.dep, days:o.days, land:{...o.land}};
  onVessel(v, () => { const n = plan2New(copy); n.on = false; S.ops = n; });
  return true;
}
