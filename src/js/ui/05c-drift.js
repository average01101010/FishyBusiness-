// ===== the Drift app: the operations plan of a vessel (core/06d-drift.js). Sessions (trips and rests), the one rig, the weather it may
// run in, stock, an overview with the day on a bar, templates, a dry run and the day's report. The route of a trip is drawn in the
// chart plotter ("Tegn rute"), which comes back here when it is saved. =====
const DRIFTUI = (() => {
  const L = (no, en) => S.lang === 'no' ? no : en;
  const nm = id => (portById(id) || {name:'?'}).name;
  const hh = driftClock;
  let prev = false, tplOpen = false, repOpen = false;
  const B = (a, label, extra, cls) => '<button class="ph-btn' + (cls ? ' ' + cls : '') + '" data-pa="' + a + '"' + (extra ? ' ' + extra : '') + '>' + label + '</button>';
  const T = (a, label, on, extra) => '<button data-pa="' + a + '" class="' + (on ? 'on' : '') + '"' + (extra ? ' ' + extra : '') + '>' + label + '</button>';
  const kvr = (a, b) => '<div class="ph-kv dr-kv"><span>' + a + '</span><span>' + b + '</span></div>';
  const sorted = o => o.sess.slice().sort((a, c) => a.dep - c.dep);
  const dur = h => h >= 48 ? fmt(h / 24, 1) + L(' døgn', ' days') : Math.floor(h) + L(' t ', ' h ') + (Math.round((h % 1) * 60) ? Math.round((h % 1) * 60) + ' min' : '');
  // ---- the day on a bar: work in blue, rest in green
  function bar(o, C){
    const seg = [], P = o.period, pct = x => (Math.max(0, Math.min(P, x)) / P * 100).toFixed(2);
    for (let i = 0; i < C.sorted.length; i++){
      const s = C.sorted[i], d = driftSessHours(o, s), nxt = C.sorted[i + 1] ? C.sorted[i + 1].dep : C.sorted[0].dep + P;
      if (s.type === 'hvile') seg.push('<i class="rest" style="left:' + pct(s.dep) + '%;width:' + (pct(Math.min(nxt, P)) - pct(s.dep)).toFixed(2) + '%"></i>');
      else seg.push('<i class="work" style="left:' + pct(s.dep) + '%;width:' + (pct(Math.min(s.dep + d, P)) - pct(s.dep)).toFixed(2) + '%" title="' + hh(s.dep) + '"></i>');
    }
    const ticks = P === 24 ? [0, 6, 12, 18].map(h => '<b style="left:' + (h / 24 * 100) + '%">' + String(h).padStart(2, '0') + '</b>').join('') : '';
    return '<div class="dr-bar">' + seg.join('') + ticks + '</div>';
  }
  // ---- one session
  function sessRow(o, s, i, C){
    const n = C.sorted.length, tm = '<span class="dr-tm"><button data-pa="dr-dep" data-id="' + s.id + '" data-d="-0.5">−</button> ' + hh(s.dep) + ' <button data-pa="dr-dep" data-id="' + s.id + '" data-d="0.5">+</button></span>';
    if (s.type === 'hvile'){
      const at = s.at, opts = driftRestPlaces(o, s).map(q => T('dr-at', q.name + (q.rorbu ? L(' (rorbu)', ' (rorbu)') : L(' (kai)', ' (quay)')), q.id === at, 'data-id="' + s.id + '" data-p="' + q.id + '"')).join('') +
        T('dr-at', L('Anker', 'Anchor'), at === 'anker', 'data-id="' + s.id + '" data-p="anker"');
      const sp = at === 'anker' && s.pos ? anchorSpot(s.pos) : null, lim = sp && sp.ok ? Math.round(BOAT.risk[2] / (0.7 + 0.3 * sp.expo)) : 0;
      return '<div class="dr-s rest"><div class="dr-h">' + tm + '<b>' + L('Hvile', 'Rest') + '</b> ' + (at === 'anker' ? L('til ankers nær ', 'at anchor near ') + nm(s.near) : at ? L('i ', 'in ') + nm(at) : '') + '</div><div class="ops-days">' + opts + '</div>' +
        (at === 'anker' ? '<p class="ph-note">' + (sp && sp.ok ? L('Ankerplass ' + fmt(s.pos ? dist(s.pos, portById(s.near).p) : 0, 1) + ' km fra havna, ' + Math.round(sp.depth) + ' m dypt, ' + (sp.level === 0 ? 'godt skjermet' : sp.level === 1 ? 'noe åpent' : 'åpent og utsatt') + '. Ankeret begynner å slepe fra ca. ' + lim + ' m/s vind eller ' + fmt(BOAT.risk[0], 1) + ' m sjø; da ligger båten ved kai i stedet.', 'Anchorage ' + fmt(s.pos ? dist(s.pos, portById(s.near).p) : 0, 1) + ' km from the harbour, ' + Math.round(sp.depth) + ' m deep, ' + (sp.level === 0 ? 'well sheltered' : sp.level === 1 ? 'somewhat open' : 'open and exposed') + '. The anchor starts to drag from about ' + lim + ' m/s of wind or ' + fmt(BOAT.risk[0], 1) + ' m of sea; the boat then lies at the quay instead.') : L('Finner ankerplass …', 'Finding an anchorage …')) + '</p>' : '<p class="ph-note">' + L('Kai er standard. Anker kan velges der været tillater det.', 'The quay is the default. Anchor can be chosen where the weather allows it.') + '</p>') +
        '<div class="ph-row2">' + B('dr-del', L('Fjern', 'Remove'), 'data-id="' + s.id + '"') + '</div></div>';
    }
    const r = s.route, has = r && r.wps && r.wps.length, st = driftStations(s).length;
    return '<div class="dr-s"><div class="dr-h">' + tm + '<b>' + L('Tur ', 'Trip ') + (i + 1) + '</b> ' + (has ? nm(r.home) + ' → ' + nm(r.end) : '<i>' + L('ingen rute ennå', 'no route yet') + '</i>') + '</div>' +
      (has ? '<p class="ph-note">' + dur(driftSessHours(o, s)) + (st ? ' · ' + st + L(' stasjoner', ' stations') : '') + (r.wps.some(w => w.fish > 0) ? ' · ' + L('fisketid ', 'fishing ') + r.wps.reduce((a, w) => a + (w.fish || 0), 0) + L(' t', ' h') : '') + '</p>' : '') +
      '<div class="ph-row2">' + B('dr-draw', has ? L('Endre rute i kartplotteren', 'Edit route in the plotter') : L('Tegn rute i kartplotteren', 'Draw route in the plotter'), 'data-id="' + s.id + '"', 'p') + B('dr-del', L('Fjern', 'Remove'), 'data-id="' + s.id + '"') + '</div></div>';
  }
  // who stands which watch
  function watchInfo(o){
    const R = driftRoles(o), f = c => c ? c.name.split(' ')[0] : '–', roleOf = c => c === R.sk ? L(' (skipper)', ' (skipper)') : c === R.mate ? L(' (styrmann)', ' (mate)') : '';
    return '<div class="dr-watch"><div><b>' + L('Vakt A', 'Watch A') + '</b> ' + R.A.map(c => f(c) + roleOf(c)).join(', ') + '</div><div><b>' + L('Vakt B', 'Watch B') + '</b> ' + R.B.map(c => f(c) + roleOf(c)).join(', ') + '</div>' +
      '<div>' + L('Vakt hver ', 'A watch every ') + '<button data-pa="dr-wh" data-d="-1">−</button> ' + (o.watchH || 6) + L(' t', ' h') + ' <button data-pa="dr-wh" data-d="1">+</button> · ' + L('Den som har fri sover i køyene, og er ikke på dekk.', 'The watch off sleeps in the bunks and is not on deck.') + '</div></div>';
  }

  // ===== the plan maker (core/06f-plan.js): a few questions, one at a time, and the day made out of the answers =====
  let wz = null, adv = false, building = false, spotCache = null;
  const rerender = () => { if (typeof refreshAll === 'function') refreshAll(); else if (typeof PHONE !== 'undefined') PHONE.render(); };
  const STEPS = 5, BIG = (a, label, sub, on, extra, off) => '<button class="dr-big' + (on ? ' on' : '') + '" data-pa="' + a + '"' + (extra ? ' ' + extra : '') + (off ? ' disabled' : '') + '><b>' + label + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</button>';
  const head = (i, q) => '<div class="ph-card"><p class="dr-step">' + L('Steg ', 'Step ') + (i + 1) + L(' av ', ' of ') + STEPS + '</p><h4>' + q + '</h4>';
  const nav = (back, next, nextOk) => '<div class="ph-row2">' + (back ? B('dr-zstep', L('← Tilbake', '← Back'), 'data-s="' + (wz.step - 1) + '"') : B('dr-zcancel', L('Avbryt', 'Cancel'))) + (next ? B('dr-zstep', L('Neste →', 'Next →'), 'data-s="' + (wz.step + 1) + '"' + (nextOk === false ? ' disabled' : ''), 'p') : '') + '</div></div>';
  const km = (p, q) => fmt(dist(p, q) / NM, 1) + ' nm';
  function gearWhy(g){
    if (g === 'juksa') return null;
    const k = PLAN_KIND[g]; if (!rigHas(g)) return L('Båten mangler ' + GEAR[k].no.toLowerCase().replace(/r$/, '') + 'haler', 'The boat has no hauler for ' + GEAR[k].en.toLowerCase());
    if (planUnits(k) < 1) return L('Ingen ' + GEAR[k].no.toLowerCase() + ' om bord', 'No ' + GEAR[k].en.toLowerCase() + ' aboard');
    if ((BOAT.gearMax || {})[k === 'line' ? 'stamp' : k] === 0) return L('Passer ikke denne båten', 'Does not suit this boat');
    return null;
  }
  function spotLine(q, kind){
    // only what the player knows: his own catch here (S.marks), never the fish the sea holds
    const a = wz.a, base = portById(a.base), m = planMark(q, kind || null);
    const known = m ? (kind ? L('du fikk ' + fmt(m.kgu, 1) + ' kg per ' + GEAR[kind].u[0] + ' her', 'you got ' + fmt(m.kgu, 1) + ' kg a ' + GEAR[kind].u[2] + ' here') : L('du fikk ' + m.kgph + ' kg/t her', 'you got ' + m.kgph + ' kg/h here')) : L('ikke fisket her ennå', 'not fished here yet');
    return (base ? km(base.p, q) + L(' fra ', ' from ') + base.name + ' · ' : '') + known;
  }
  function wizPage(){
    const a = wz.a, h = ['<div class="ph-c">'], kind = PLAN_KIND[a.gear] || null;
    if (wz.step === 0){
      const here = S.boat.status === 'port' ? S.boat.port : nearestPort(S.boat.pos).id, pl = driftRestPlaces({}, {at:here}), home = S.home || HOME0;
      if (portById(home) && !pl.some(q => q.id === home) && dist(portById(home).p, portById(here).p) < 60) pl.push({id:home, name:portById(home).name, d:dist(portById(home).p, portById(here).p)});
      h.push(head(0, L('Hvor skal båten ligge og hvile om natta?', 'Where shall the boat lie and rest at night?')) + '<p class="ph-note">' + L('Dagen starter og slutter her. Planen kan slås på hvor båten enn ligger; den går hit først.', 'The day starts and ends here. The plan can be switched on wherever the boat lies; she goes here first.') + '</p>' +
        pl.map(q => BIG('dr-zbase', q.name + (q.id === home ? L(' (naustet)', ' (the naust)') : isRorbu(q.id) ? L(' (rorbu)', ' (rorbu)') : ''), planRestOk(q.id) ? L('Mannskapet kan sove her', 'The crew can sleep here') : L('Ingen køyer her: dårlig hvile', 'No bunks here: poor rest'), a.base === q.id, 'data-p="' + q.id + '"')).join('') + nav(false, true, !!a.base));
    } else if (wz.step === 1){
      h.push(head(1, L('Hva skal båten fiske med?', 'What shall the boat fish with?')) + ['juksa', 'line', 'garn', 'teiner'].map(g => { const why = gearWhy(g); return BIG('dr-zgear', g === 'juksa' ? L('Bare juksa', 'Jigging only') : driftRigName(g), why || (g === 'juksa' ? L('Ut, fyll lasten, lever, og ut igjen', 'Out, fill the hold, land, and out again') : L(planUnits(PLAN_KIND[g]) + ' ' + GEAR[PLAN_KIND[g]].u[1] + ' om bord', planUnits(PLAN_KIND[g]) + ' ' + GEAR[PLAN_KIND[g]].u[3] + ' aboard')), a.gear === g, 'data-g="' + g + '"', !!why); }).join(''));
      if (kind) h.push('<h4 style="margin-top:14px">' + L('Jukse i tillegg mens redskapet står?', 'Jig as well while the gear stands?') + '</h4>' + BIG('dr-zjig', L('Ja, juks til lasten er full', 'Yes, jig until the hold is full'), L('Mer fisk per døgn. Det holdes plass til redskapet.', 'More fish a day. Room is kept for the gear.'), a.jig, 'data-v="1"') + BIG('dr-zjig', L('Nei, bare redskapet', 'No, only the gear'), L('Båten venter ved redskapet', 'The boat waits by the gear'), !a.jig, 'data-v="0"'));
      h.push(nav(true, true, !gearWhy(a.gear)));
    } else if (wz.step === 2){
      const sp = spotCache || (spotCache = planSpots(a.base)), pick = (k, q) => a[k] && dist(a[k], q) < 0.3;
      const list = (k, kd) => sp.map((q, i) => BIG('dr-zspot', q.kind === 'mark' ? L('Fangstplass (' + q.kgph + ' kg/t da du var der)', 'Catch mark (' + q.kgph + ' kg/h when you were there)') : q.kind === 'set' ? L('Der redskapet står nå', 'Where the gear stands now') : L('Der båten er nå', 'Where the boat is now'), spotLine(q, kd), pick(k, q), 'data-k="' + k + '" data-i="' + i + '"')).join('') +
        BIG('dr-zspot', L('Velg i kartet …', 'Choose in the chart …'), a[k] && !sp.some(q => pick(k, q)) ? L('Valgt: ', 'Chosen: ') + spotLine(a[k], kd) : L('Trykk der du vil i kartplotteren', 'Tap where you like in the plotter'), a[k] && !sp.some(q => pick(k, q)), 'data-k="' + k + '" data-i="map"');
      h.push(head(2, kind ? L('Hvor skal redskapet stå?', 'Where shall the gear stand?') : L('Hvor skal dere jukse?', 'Where will you jig?')) + '<p class="ph-note">' + L('Plassen avgjør fangsten. Finn fisken med ekkoloddet, eller bruk plasser du har fisket godt på før. Fangstrapporten viser etter hvert hvordan plassene gir.', 'The place decides the catch. Find the fish with the sounder, or use places you have fished well before. The catch report shows in time how the places give.') + '</p>' + list(kind ? 'gp' : 'jp', kind));
      if (kind && a.jig) h.push('<h4 style="margin-top:14px">' + L('Hvor skal dere jukse?', 'Where will you jig?') + '</h4>' + BIG('dr-zspot', L('Ved redskapet', 'By the gear'), L('Båten er på plass når det skal trekkes', 'The boat is in place for the haul'), !a.jp, 'data-k="jp" data-i="gear"') + list('jp', null));
      // more jig places, in turn: the crew move on when the catch falls (feedback #57)
      if (kind ? a.jig : a.jp){
        h.push('<h4 style="margin-top:14px">' + L('Flytte til en annen plass når fangsten faller?', 'Move on to another place when the catch falls?') + '</h4>' + BIG('dr-zspot', L('Nei, bli på plassen', 'No, stay at the place'), '', !a.jp2, 'data-k="jp2" data-i="none"') + list('jp2', null));
        if (a.jp2) h.push('<h4 style="margin-top:14px">' + L('Og en tredje plass?', 'And a third place?') + '</h4>' + BIG('dr-zspot', L('Nei, to plasser er nok', 'No, two places will do'), '', !a.jp3, 'data-k="jp3" data-i="none"') + list('jp3', null));
      }
      h.push(nav(true, true, !!(kind ? a.gp : a.jp)));
    } else if (wz.step === 3){
      const W = PLANW.wx;
      h.push(head(3, L('Hvor tøft vær skal båten gå ut i?', 'How rough a weather shall the boat go out in?')) +
        BIG('dr-zwx', L('Forsiktig', 'Careful'), L('Inntil ' + W.safe.wind + ' m/s og ' + fmt(W.safe.hs, 1) + ' m sjø', 'Up to ' + W.safe.wind + ' m/s and ' + fmt(W.safe.hs, 1) + ' m sea'), a.wx === 'safe', 'data-v="safe"') +
        BIG('dr-zwx', L('Vanlig', 'Normal'), L('Inntil ' + W.normal.wind + ' m/s og ' + fmt(W.normal.hs, 1) + ' m sjø', 'Up to ' + W.normal.wind + ' m/s and ' + fmt(W.normal.hs, 1) + ' m sea'), a.wx === 'normal', 'data-v="normal"') +
        BIG('dr-zwx', L('Tøff', 'Rough'), L('Inntil ' + W.tough.wind + ' m/s og ' + fmt(W.tough.hs, 1) + ' m sjø (aldri mer enn båten tåler)', 'Up to ' + W.tough.wind + ' m/s and ' + fmt(W.tough.hs, 1) + ' m sea (never more than the boat takes)'), a.wx === 'tough', 'data-v="tough"') +
        '<h4 style="margin-top:14px">' + L('Når starter dagen?', 'When does the day begin?') + '</h4>' + kvr(L('Første avgang', 'First departure'), '<button data-pa="dr-zstart" data-d="-0.5">−</button> ' + hh(a.start) + ' <button data-pa="dr-zstart" data-d="0.5">+</button>') +
        '<p class="ph-note">' + L('Planen holder arbeidsdagen innenfor ' + PLANW.work + ' timer, så mannskapet alltid får ' + PLANW.rest + ' timer hvile i strekk.', 'The plan keeps the working day within ' + PLANW.work + ' hours, so the crew always get ' + PLANW.rest + ' hours of rest in one stretch.') + '</p>' + nav(true, true));
    } else {
      const o = driftOps(), w = o && o.wiz === a ? a : null, est = w && w.est;
      h.push(head(4, L('Slik blir dagen', 'This is the day')));
      if (building) h.push('<p class="ph-note">' + L('Lager planen …', 'Making the plan …') + '</p></div>');
      else if (!est){ if (a.err) h.push('<p class="bad">' + a.err + '</p>'); h.push('<p class="ph-note">' + L('Planen legger turene, stasjonene og leveringene slik at båten fisker mest mulig, og så mannskapet får hvilen sin.', 'The plan lays out the trips, stations and landings so the boat fishes as much as she can, and the crew get their rest.') + '</p>' + B('dr-zbuild', L('Lag planen', 'Make the plan'), '', 'p') + nav(true, false)); }
      else h.push(dayCard(o, true) + '<div class="ph-row2">' + B('dr-zstep', L('← Tilbake', '← Back'), 'data-s="3"') + B('dr-zuse', L('Bruk planen og slå den på', 'Use the plan and switch it on'), '', 'p') + '</div></div>');
    }
    h.push('</div>'); return h.join('');
  }
  // the day, as the plan maker reckoned it: the figure to beat, the rest kept, and each step with its clock
  function dayCard(o, inWiz){
    const w = o.wiz, e = w && w.est; if (!e) return '';
    return '<div class="dr-day">' + kvr(L('Turer i døgnet', 'Trips a day'), e.trips) +
      kvr(L('Arbeid / hvile', 'Work / rest'), fmt(e.work, 1) + L(' t / ', ' h / ') + fmt(e.rest, 1) + L(' t i strekk', ' h in one stretch')) + kvr(L('Levering', 'Landing'), nm(e.mottak)) +
      '<div class="dr-pv">' + e.tl.map(x => '<div class="dr-ev"><span>' + hh(x.t) + '</span><span>' + (S.lang === 'no' ? x.no : x.en) + '</span></div>').join('') + '</div>' +
      '<p class="ph-note">' + (inWiz ? L('Tidene er anslag. Båten jukser bare til lasten er full, og venter på mottaket hvis det er stengt.', 'The times are estimates. The boat only jigs until the hold is full, and waits at the plant if it is closed.') : L('Fangstrapporten under viser hva planen leverer. Prøv andre plasser og se om tallet går opp.', 'The catch report below shows what the plan lands. Try other places and see if the figure goes up.')) + '</p></div>';
  }
  function summary(o){
    const w = o.wiz, C = driftCheck(o), h = ['<div class="ph-c">'];
    h.push('<div class="ph-card"><h4>' + L('Driftsplan · «', 'Operations plan · «') + S.boatName + '»</h4>' +
      '<button class="dr-onoff' + (o.on ? ' on' : '') + '" data-pa="dr-on"' + (!o.on && !C.ok ? ' disabled' : '') + '>' + (o.on ? L('På · trykk for å slå av', 'On · tap to switch off') : C.ok ? L('Av · trykk for å slå på', 'Off · tap to switch on') : L('Ikke klar', 'Not ready')) + '</button>' +
      (o.paused ? '<p class="bad">' + L('Satt på pause: ', 'Paused: ') + (S.lang === 'no' ? o.paused.no : o.paused.en) + '</p>' : '') + (!C.ok ? C.errors.map(e => '<p class="bad">' + e + '</p>').join('') : '') +
      (o.on ? '<p class="ph-note">' + driftNext(o) + '</p>' : '') +
      kvr(L('Hviler i', 'Rests in'), nm(w.base)) + kvr(L('Fisker med', 'Fishes with'), w.gear === 'juksa' ? L('bare juksa', 'jigging only') : driftRigName(w.gear).toLowerCase() + (w.jig ? L(' og juksa', ' and the jig') : '')) +
      kvr(L('Vær', 'Weather'), {safe:L('forsiktig', 'careful'), normal:L('vanlig', 'normal'), tough:L('tøft', 'rough')}[w.wx] || '') + '</div>');
    h.push('<div class="ph-card"><h4>' + L('Dagen', 'The day') + '</h4>' + dayCard(o, false) + '<div class="ph-row2">' + B('dr-zedit', L('Endre planen', 'Change the plan'), '', 'p') + B('dr-zadv', L('Flere valg', 'More choices')) + '</div></div>');
    h.push(report(o));
    h.push('<div class="ph-card">' + B('dr-reset', L('Slett driftsplanen', 'Delete the plan')) + '</div></div>');
    return h.join('');
  }
  // a place being picked for the plan maker is dropped when the questions are left (it must never be left behind: tilbakemelding 09.10.2026)
  const dropSpot = () => { if (DRIFTCTX && DRIFTCTX.spot){ DRIFTCTX = null; S.draft = []; if (typeof routeChanged === 'function') routeChanged(); } };
  function page(){
    if (!wz) dropSpot();
    if (wz) return wizPage();
    const o = driftOps();
    if (!o) return '<div class="ph-c"><div class="ph-card"><h4>' + L('Driftsplan for «', 'Operations plan for «') + S.boatName + '»</h4><p class="ph-note">' + L('Med en driftsplan fisker, leverer og hviler båten på egen hånd, hver dag. Du svarer på fem spørsmål, og planen regner ut turene som gir mest levert per døgn innenfor hviletiden.', 'With an operations plan the boat fishes, lands and rests on her own, every day. You answer five questions, and the plan works out the trips that land the most a day within the rest rules.') + '</p>' +
      B('dr-znew', L('Lag driftsplan', 'Make a plan'), '', 'p') + '</div></div>';
    if (adv || !o.wiz || !o.wiz.est) return advPage();
    return summary(o);
  }
  function advPage(){
    const o = driftOps(), b = S.boat, h = ['<div class="ph-c">'];
    if (o && o.wiz) h.push('<div class="ph-card">' + B('dr-zsimple', L('← Tilbake til den enkle visningen', '← Back to the simple view')) + '<p class="ph-note">' + L('Endrer du øktene her, lages de ikke på nytt av spørsmålene før du trykker «Endre planen» igjen.', 'If you change the sessions here, the questions do not remake them until you press «Change the plan» again.') + '</p></div>');
    if (!o){
      h.push('<div class="ph-card"><h4>' + L('Driftsplan for «', 'Operations plan for «') + S.boatName + '»</h4><p class="ph-note">' + L('En driftsplan lar båten fiske, levere og hvile på egen hånd, med flere turer i døgnet om du vil. Du velger utstyr, tegner rutene i kartplotteren og setter grenser for vær. Planen gjelder båten, uansett hvem som er om bord.', 'An operations plan lets the boat fish, land and rest on its own, with several trips a day if you like. You choose the gear, draw the routes in the plotter and set the weather limits. The plan belongs to the boat, whoever is aboard.') + '</p>' +
        B('dr-new', L('Lag driftsplan', 'Make a plan'), '', 'p') + (S.driftTpl && S.driftTpl.length ? tplList() : '') + '</div>'); h.push('</div>'); return h.join('');
    }
    const C = driftCheck(o), sk = opsSkipper();
    // ---- status
    h.push('<div class="ph-card"><h4>' + L('Driftsplan · «', 'Operations plan · «') + S.boatName + '»</h4>' +
      kvr(L('Status', 'Status'), '<button data-pa="dr-on" class="' + (o.on ? 'on' : '') + '"' + (!o.on && !C.ok ? ' disabled' : '') + '>' + (o.on ? L('På', 'On') : C.ok ? L('Av. Slå på', 'Off. Switch on') : L('Ikke godkjent', 'Not approved')) + '</button>') +
      (o.paused ? '<p class="bad">' + L('Satt på pause: ', 'Paused: ') + (S.lang === 'no' ? o.paused.no : o.paused.en) + '</p>' : '') +
      (o.on ? '<p class="ph-note">' + driftNext(o) + '</p>' : '') + '</div>');
    // ---- the set-up
    const rigs = Object.keys(DRF_RIGS).map(r => DRF_RIGS[r].soon ? '<button disabled title="' + L('Kommer med havsteget', 'Arrives with the ocean step') + '">' + driftRigName(r) + '</button>' : T('dr-rig', driftRigName(r), o.rig === r, 'data-r="' + r + '"')).join('');
    const mode = driftMode(o);
    h.push('<div class="ph-card"><h4>' + L('Oppsett', 'Set-up') + '</h4>' +
      kvr(L('Utstyr', 'Gear'), '<span class="ops-days">' + rigs + '</span>') +
      '<p class="ph-note">' + (mode === 'tur' ? L('Juksa: båten drar ut, fyller lasten, leverer og drar ut igjen. Legg inn så mange turer i døgnet du vil.', 'Jigging: the boat goes out, fills the hold, lands and goes out again. Put in as many trips a day as you like.') :
        mode === 'sett' ? L('Redskapet blir stående i sjøen mellom rundene. Hver runde trekker det som står og setter på nytt. Ståtiden er tiden mellom to runder.', 'The gear stays in the sea between rounds. Each round hauls what stands and sets again. The soak is the time between two rounds.') :
        L('Lange perioder på feltet.', 'Long periods on the grounds.')) + '</p>' +
      kvr(L('Mannskapsordning', 'Crew system'), T('dr-mode', L('Dagdrift', 'Day work'), o.crewMode !== 'watch', 'data-m="day"') + ' ' + T('dr-mode', L('Døgndrift 2+2', 'Round the clock 2+2'), o.crewMode === 'watch', 'data-m="watch"' + (S.crew.length < driftNeedHands ? ' disabled' : ''))) +
      (o.crewMode === 'watch' ? watchInfo(o) : '<p class="ph-note">' + L('Dagdrift: alle på dekk samtidig. Mannskapet hviler mellom turene og om natta.', 'Day work: everyone on deck at once. The crew rests between trips and at night.') + (S.crew.length < driftNeedHands ? ' ' + L('Døgndrift 2+2 krever fire mann.', 'Round the clock 2+2 needs four hands.') : '') + '</p>') +
      kvr(L('Skipper', 'Skipper'), [T('dr-sk', L('Meg', 'Me'), o.skipper === 'me', 'data-id="me"')].concat(S.crew.map(c => T('dr-sk', c.name.split(' ')[0], o.skipper === c.id, 'data-id="' + c.id + '"'))).join(' ')) +
      (o.crewMode === 'watch' && S.crew.length ? kvr(L('Styrmann', 'Mate'), S.crew.map(c => T('dr-mate', c.name.split(' ')[0], driftRoles(o).mate === c, 'data-id="' + c.id + '"')).join(' ')) : '') +
      (o.period === 24 ? kvr(L('Dager', 'Days'), '<span class="ops-days">' + (S.lang === 'no' ? OPS_DAYS_NO : OPS_DAYS_EN).map((d, i) => T('dr-day', d, o.days[i], 'data-i="' + i + '"')).join('') + '</span>') : '') +
      kvr(L('Maks vind', 'Max wind'), '<button data-pa="dr-w" data-d="-1">−</button> ' + o.wx.wind + ' m/s <button data-pa="dr-w" data-d="1">+</button>') +
      kvr(L('Maks sjø', 'Max sea'), '<button data-pa="dr-hs" data-d="-0.5">−</button> ' + fmt(o.wx.hs, 1) + ' m <button data-pa="dr-hs" data-d="0.5">+</button>') +
      kvr(L('Om været snur', 'If the weather turns'), T('dr-shelter', o.wx.shelter ? L('Gå til nærmeste kai', 'Go to the nearest quay') : L('Fortsett', 'Carry on'), o.wx.shelter)) +
      kvr(L('Bunkre ved mottaket', 'Stock at the plant'), ['ice', 'fuel', 'gear', 'bait'].map(k => T('dr-stock', {ice:L('Is', 'Ice'), fuel:L('Diesel', 'Diesel'), gear:L('Redskap', 'Tackle'), bait:L('Agn', 'Bait')}[k], o.stock[k], 'data-k="' + k + '"')).join(' ')) +
      '</div>');
    // ---- the sessions
    h.push('<div class="ph-card"><h4>' + L('Økter', 'Sessions') + '</h4>' + (C.sorted.length ? C.sorted.map((s, i) => sessRow(o, s, i, C)).join('') : '<p class="ph-note">' + L('Ingen økter ennå.', 'No sessions yet.') + '</p>') +
      '<div class="ph-row2">' + B('dr-add', L('+ Ny tur', '+ New trip')) + B('dr-addrest', L('+ Hvile', '+ Rest')) + '</div></div>');
    // ---- the overview
    h.push('<div class="ph-card"><h4>' + L('Oversikt', 'Overview') + '</h4>' + bar(o, C) +
      kvr(L('Arbeidstid', 'Working time'), dur(C.work) + L(' per ', ' per ') + (o.period === 24 ? L('døgn', 'day') : dur(o.period))) + kvr(L('Turer', 'Trips'), C.trips + L(' per ', ' per ') + (o.period === 24 ? L('døgn', 'day') : dur(o.period))) +
      kvr(L('Hvile mellom øktene', 'Rest between sessions'), C.gaps.length ? C.gaps.map(g => dur(g)).join(' · ') : '–') +
      (C.soak.length ? kvr(L('Ståtid', 'Soak'), C.soak.map(s => dur(s.h)).join(' · ')) : '') +
      C.errors.map(e => '<p class="bad">' + e + '</p>').join('') + C.warnings.map(e => '<p class="warn">' + e + '</p>').join('') +
      (C.ok ? '<p class="ph-note">' + L('Planen er godkjent. Den starter og slutter i ', 'The plan is approved. It starts and ends in ') + nm(C.sorted[0].type === 'hvile' ? C.sorted[0].at : C.sorted[0].route.home) + '.</p>' : '') +
      B('dr-prev', prev ? L('Skjul test av planen', 'Hide the dry run') : L('Test planen', 'Test the plan')) + (prev ? previewList(o) : '') + '</div>');
    // ---- templates and report
    h.push('<div class="ph-card"><h4>' + L('Maler', 'Templates') + '</h4><div class="ph-row2">' + B('dr-tplsave', L('Lagre som mal', 'Save as template')) + (S.driftTpl && S.driftTpl.length ? B('dr-tplopen', tplOpen ? L('Skjul', 'Hide') : L('Bruk en mal', 'Use a template')) : '') + '</div>' + (tplOpen ? tplList() : '') + '</div>');
    h.push(report(o));
    h.push('<div class="ph-card">' + B('dr-reset', L('Slett driftsplanen', 'Delete the plan')) + '</div></div>'); return h.join('');
  }
  const tplList = () => (S.driftTpl || []).map((t, i) => '<div class="ph-kv"><span>' + t.name + ' · ' + driftRigName(t.rig) + ', ' + t.sess.length + L(' økter', ' sessions') + '</span><span>' + T('dr-tpluse', L('Bruk', 'Use'), false, 'data-i="' + i + '"') + ' ' + T('dr-tpldel', '×', false, 'data-i="' + i + '"') + '</span></div>').join('');
  function driftNext(o){
    if (!o.sess.length) return '';
    if (S.plan && S.plan.ops) return L('Båten er ute på planen.', 'The boat is out on the plan.');
    const s = o.sess[o.idx % o.sess.length]; if (o.a0 == null) return L('Starter ved første tur i dag eller i morgen.', 'Starts at the first trip today or tomorrow.');
    const due = driftDue(o); return L('Neste: ', 'Next: ') + (s.type === 'hvile' ? L('hvile', 'rest') : L('tur', 'trip')) + L(' om ', ' in ') + dur(Math.max(0, due - S.t / 60)) + (o.hold && o.hold > S.t / 60 ? ' · ' + L('venter', 'waiting') : '');
  }
  function previewList(o){
    const P = driftPreview(o); return '<div class="dr-pv">' + P.events.map(e => '<div class="dr-ev ' + e.kind + '"><span>' + hh(e.t) + '</span><span>' + (S.lang === 'no' ? e.no : e.en) + '</span></div>').join('') + '</div>' +
      '<p class="ph-note">' + L('Tidene er anslag ut fra rutelengde, fart, stasjoner og levering (' + DRF.landH + ' t). Været og køen på mottaket kan flytte dem.', 'The times are estimates from route length, speed, stations and landing (' + DRF.landH + ' h). Weather and the queue at the plant can move them.') + '</p>';
  }
  // ---- the day's report: the landings of the last days, by calendar day
  function report(o){
    const days = {}; for (const r of o.rep){ const k = gDate(r.t / 60).toISOString().slice(0, 10); const d = days[k] || (days[k] = {n:0, kg:0, kr:0}); d.n++; d.kg += r.kg; d.kr += r.kr; }
    const ks = Object.keys(days).sort().reverse().slice(0, repOpen ? 14 : 3);
    const all = Object.keys(days).sort().reverse(), last7 = all.slice(0, 7), sum7 = last7.reduce((a, k) => a + days[k].kg, 0), best = all.reduce((m, k) => days[k].kg > (m ? days[m].kg : -1) ? k : m, null);
    const head2 = all.length ? kvr(L('Snitt per døgn (siste ' + last7.length + ')', 'Average a day (last ' + last7.length + ')'), fmt(sum7 / Math.max(1, last7.length), 0) + ' kg') + (best ? kvr(L('Beste døgn', 'Best day'), best.slice(8) + '.' + best.slice(5, 7) + '. · ' + fmt(days[best].kg, 0) + ' kg') : '') : '';
    return '<div class="ph-card"><h4>' + L('Fangstrapport', 'Catch report') + '</h4>' + head2 + (ks.length ? ks.map(k => kvr(k.slice(8) + '.' + k.slice(5, 7) + '.', days[k].n + L(' leveringer · ', ' landings · ') + fmt(days[k].kg, 0) + ' kg · ' + kr(days[k].kr))).join('') + (Object.keys(days).length > 3 ? B('dr-rep', repOpen ? L('Færre dager', 'Fewer days') : L('Flere dager', 'More days')) : '') : '<p class="ph-note">' + L('Ingen leveringer på planen ennå.', 'No landings on the plan yet.') + '</p>') + '</div>';
  }
  // ---- the route of a trip: the chart plotter draws it, from where the trip starts (core DRIFTCTX)
  function draw(sid){
    const o = driftOps(), s = o && o.sess.find(x => x.id === sid), b = S.boat; if (!s) return false;
    if (!['port', 'idle'].includes(b.status) || S.plan){ toast(L('Båten må ligge i havn for å tegne en rute.', 'The boat must lie in port to draw a route.')); return false; }
    const C = driftCheck(o), i = C.sorted.indexOf(s), before = C.sorted[i - 1] || C.sorted[C.sorted.length - 1] && null;
    const home = s.route && s.route.home || (before && driftEndPort(before)) || (b.status === 'port' ? b.port : null) || nearestPort(b.pos).id, ph = portById(home);
    DRIFTCTX = {vid:S.cur, sid, home, origin:{x:ph.p.x, y:ph.p.y}, rig:o.rig, name:o.name};
    S.draft = s.route ? s.route.wps.map(w => ({...w, act:w.act ? {op:'set', kind:w.act.kind, spec:w.act.spec} : undefined})) : []; S.draftSpeed = s.route ? s.route.speed : S.draftSpeed; S.draftDep = 0;
    S.draft.forEach(w => { if (!w.act) delete w.act; });
    if (typeof routeChanged === 'function') routeChanged(); return true;
  }
  // the route is saved to the session
  function saveRoute(){
    if (DRIFTCTX && DRIFTCTX.spot){ const c = DRIFTCTX, q = S.draft.filter(w => !w.port).pop(); if (!q) return false; if (wz){ wz.a[c.spot] = {x:q.x, y:q.y}; wz.a.est = null; } S.draft = []; DRIFTCTX = null; if (typeof routeChanged === 'function') routeChanged(); return true; }
    const c = DRIFTCTX, o = driftOps(), s = c && o && o.sess.find(x => x.id === c.sid), last = S.draft[S.draft.length - 1];
    if (!s) { DRIFTCTX = null; return false; }
    if (!last || !last.port){ toast(L('Ruta må slutte i en havn.', 'The route must end in a port.')); return false; }
    const e = estimate(), want = DRF_RIGS[o.rig] && DRF_RIGS[o.rig].kind;
    if (S.draft.some(w => w.act && w.act.kind !== want)){ toast(L('Planen fisker med ' + driftRigName(o.rig).toLowerCase() + '. Fjern stasjoner med annet utstyr.', 'The plan fishes with ' + driftRigName(o.rig).toLowerCase() + '. Remove stations with other gear.')); return false; }
    const wps = S.draft.map(w => { const q = {...w}; if (q.act) q.act = {op:'cycle', kind:q.act.kind, spec:q.act.spec}; return q; });
    s.route = {wps, speed:S.draftSpeed, home:c.home, end:last.port, hours:Math.ceil(driftLegHours(wps, S.draftSpeed, c.origin) * 10) / 10};
    S.draft = []; DRIFTCTX = null; if (typeof routeChanged === 'function') routeChanged();
    toast(L('Ruta er lagret i driftsplanen.', 'The route is saved in the plan.')); return true;
  }
  function cancelRoute(){ if (DRIFTCTX && DRIFTCTX.spot){ DRIFTCTX = null; S.draft = []; if (typeof routeChanged === 'function') routeChanged(); return; } DRIFTCTX = null; S.draft = []; if (typeof routeChanged === 'function') routeChanged(); }
  // ---- actions (data-pa="dr-…"); true when something changed
  function act(a, d){
    const o = driftOps();
    if (a === 'dr-new'){ S.ops = driftNew(); return true; }
    if (a === 'dr-znew' || a === 'dr-zedit'){ wz = {step:0, a:o && o.wiz ? Object.assign({}, o.wiz, {est:null, err:null}) : planWizDefaults()}; spotCache = null; adv = false; return true; }
    if (a === 'dr-zcancel'){ wz = null; dropSpot(); return true; }
    if (a === 'dr-zadv'){ adv = true; return true; }
    if (a === 'dr-zsimple'){ adv = false; return true; }
    if (wz){
      const A = wz.a;
      if (a === 'dr-zstep'){ wz.step = clamp(+d.s, 0, STEPS - 1); if (wz.step === 2) spotCache = null; return true; }
      if (a === 'dr-zbase'){ A.base = d.p; A.est = null; spotCache = null; return true; }
      if (a === 'dr-zgear'){ if (gearWhy(d.g)) return false; A.gear = d.g; A.est = null; if (!PLAN_KIND[d.g]) A.gp = null; return true; }
      if (a === 'dr-zjig'){ A.jig = d.v === '1'; A.est = null; return true; }
      if (a === 'dr-zwx'){ A.wx = d.v; A.est = null; return true; }
      if (a === 'dr-zstart'){ A.start = clamp(A.start + (+d.d), 0, 12); A.est = null; return true; }
      if (a === 'dr-zspot'){
        if (d.i === 'gear'){ A.jp = null; A.est = null; return true; }
        if (d.i === 'none'){ A[d.k] = null; if (d.k === 'jp2') A.jp3 = null; A.est = null; return true; }
        if (d.i === 'map'){ const base = portById(A.base) || portById(S.boat.port) || nearestPort(S.boat.pos);
          DRIFTCTX = {vid:S.cur, sid:null, spot:d.k, rig:A.gear, name:L('Driftsplan', 'Operations plan')}; S.draft = []; if (typeof routeChanged === 'function') routeChanged();
          PHONE.show(false); if (typeof DOCK !== 'undefined' && DOCK.close) DOCK.close(); toast(d.k === 'gp' ? L('Trykk i kartet der redskapet skal stå.', 'Tap the chart where the gear shall stand.') : L('Trykk i kartet der dere skal jukse.', 'Tap the chart where you will jig.')); return true; }
        const q = (spotCache || [])[+d.i]; if (!q) return false; A[d.k] = {x:q.x, y:q.y}; A.est = null; return true; }
      if (a === 'dr-zbuild'){ const op = o || (S.ops = driftNew()); op.on = false; op.wiz = A; building = true; planBuild(op, () => { building = false; rerender(); }); return true; }
      if (a === 'dr-zuse'){ const op = driftOps(); if (!op || !op.wiz || !op.wiz.est) return false; const C = driftCheck(op); if (!C.ok){ toast(C.errors[0]); return true; }
        op.bestKg = Math.max(op.bestKg || 0, op.wiz.est.kg); op.on = true; op.paused = null; op.fails = 0; op.a0 = null; op.idx = 0; op.cn = 0; op.hold = 0; wz = null; adv = false; toast(L('Driftsplanen er på.', 'The plan is on.')); return true; }
    }
    if (!o) return false;
    const s = d.id && o.sess.find(x => x.id === d.id);
    if (a === 'dr-on'){ if (o.on){ o.on = false; return true; } const C = driftCheck(o); if (!C.ok){ toast(C.errors[0]); return true; } o.on = true; o.paused = null; o.fails = 0; o.a0 = null; o.idx = 0; o.cn = 0; o.hold = 0; toast(L('Driftsplanen er på.', 'The plan is on.')); return true; }
    if (a === 'dr-rig'){ if (!DRF_RIGS[d.r] || DRF_RIGS[d.r].soon) return false; o.rig = d.r; if (o.on) o.on = false; for (const q of o.sess) if (q.route) for (const w of q.route.wps) if (w.act) delete w.act; return true; }
    if (a === 'dr-sk'){ o.skipper = d.id; if (o.mate === d.id) o.mate = null; return true; }
    if (a === 'dr-mate'){ o.mate = d.id; if (o.skipper === d.id) o.skipper = (S.crew.find(c => c.id !== d.id) || {}).id || null; return true; }
    if (a === 'dr-mode'){ if (d.m === 'watch' && S.crew.length < driftNeedHands){ toast(L('Døgndrift 2+2 krever fire mann.', 'Round the clock 2+2 needs four hands.')); return false; } o.crewMode = d.m === 'watch' ? 'watch' : 'day'; if (o.on) o.on = false; return true; }
    if (a === 'dr-wh'){ o.watchH = clamp((o.watchH || 6) + (+d.d), 4, 8); return true; }
    if (a === 'dr-day'){ const i = +d.i; o.days[i] = o.days[i] ? 0 : 1; return true; }
    if (a === 'dr-w'){ o.wx.wind = clamp(o.wx.wind + (+d.d), 4, 24); return true; }
    if (a === 'dr-hs'){ o.wx.hs = clamp(Math.round((o.wx.hs + (+d.d)) * 2) / 2, 0.5, 8); return true; }
    if (a === 'dr-shelter'){ o.wx.shelter = !o.wx.shelter; return true; }
    if (a === 'dr-stock'){ o.stock[d.k] = !o.stock[d.k]; return true; }
    if (a === 'dr-dep' && s){ s.dep = clamp(Math.round((s.dep + (+d.d)) * 2) / 2, 0, o.period - 0.5); return true; }
    if (a === 'dr-del' && s){ o.sess.splice(o.sess.indexOf(s), 1); o.idx = 0; o.on = o.on && o.sess.length > 0; return true; }
    if (a === 'dr-add'){ const C = driftCheck(o), last = C.sorted[C.sorted.length - 1], at = last ? Math.min(o.period - 1, Math.ceil((last.dep + Math.max(driftSessHours(o, last), 1) + 1) * 2) / 2) : 5;
      o.sess.push({id:driftSid(), type:'tur', dep:at, route:null}); return true; }
    if (a === 'dr-addrest'){ const C = driftCheck(o), last = C.sorted[C.sorted.length - 1], end = last && driftEndPort(last), from = end || S.boat.port, pl = from ? driftRestPlaces(o, {at:from}) : [];
      const dep = last ? Math.min(o.period - 0.5, Math.ceil((last.dep + Math.max(driftSessHours(o, last), 0)) * 2) / 2) : 18;
      o.sess.push({id:driftSid(), type:'hvile', dep, at:(pl.find(q => q.rorbu) || pl[0] || {}).id || from}); return true; }
    if (a === 'dr-at' && s){
      if (d.p === 'anker'){ const C = driftCheck(o), i = C.sorted.indexOf(s), pv = C.sorted[i - 1] || C.sorted[C.sorted.length - 1], near = (pv && pv !== s && driftEndPort(pv)) || (portById(s.near) ? s.near : null) || S.boat.port || nearestPort(S.boat.pos).id;
        s.at = 'anker'; s.near = near; s.pos = null; driftPickAnchorage(s, () => { if (typeof refreshAll === 'function') refreshAll(); else if (typeof PHONE !== 'undefined') PHONE.render(); }); return true; }
      s.at = d.p; delete s.near; delete s.pos; return true; }
    if (a === 'dr-draw' && s){ if (!draw(d.id)) return false; PHONE.show(false); if (typeof DOCK !== 'undefined' && DOCK.close) DOCK.close(); toast(L('Tegn ruta, og trykk «Lagre i driftsplanen» nederst i ruteboksen.', 'Draw the route, then press "Save in the plan" at the bottom of the route box.')); return true; }
    if (a === 'dr-prev'){ prev = !prev; return true; }
    if (a === 'dr-rep'){ repOpen = !repOpen; return true; }
    if (a === 'dr-tplsave'){ const name = (prompt(L('Navn på malen', 'Name of the template'), o.name) || '').replace(/[<>&"]/g, '').trim().slice(0, 24); if (!name) return false; driftTplSave(name); tplOpen = true; toast(L('Malen er lagret.', 'The template is saved.')); return true; }
    if (a === 'dr-tplopen'){ tplOpen = !tplOpen; return true; }
    if (a === 'dr-tpluse'){ if (!driftTplUse(+d.i)) return false; toast(L('Malen er tatt i bruk. Sjekk rutene.', 'The template is in use. Check the routes.')); return true; }
    if (a === 'dr-tpldel'){ (S.driftTpl || []).splice(+d.i, 1); return true; }
    if (a === 'dr-reset'){ if (!confirm(L('Slette driftsplanen for «' + S.boatName + '»?', 'Delete the plan for «' + S.boatName + '»?'))) return false; S.ops = null; return true; }
    return false;
  }
  return {page, act, saveRoute, cancelRoute, draw, wizOn:() => !!wz};
})();
// the places a rest can be: the quay where the last trip ended, and the rorbuer near it
function driftRestPlaces(o, s){
  const from = portById(s.at === 'anker' ? s.near : s.at) || portById(S.boat.port) || nearestPort(S.boat.pos), out = [{id:from.id, name:from.name, rorbu:!!from.rorbu, d:0}];
  try { for (const R of rorbuSites(from.p, 40)) if (!out.some(q => q.id === R.id)) out.push({id:R.id, name:R.name, rorbu:true, d:dist(R.p, from.p)}); } catch (e){}
  return out.sort((a, c) => a.d - c.d).slice(0, 4);
}
