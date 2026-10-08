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
  const kvr = (a, b) => '<div class="ph-kv"><span>' + a + '</span><span>' + b + '</span></div>';
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
  function page(){
    const o = driftOps(), b = S.boat, h = ['<div class="ph-c">'];
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
      kvr(L('Skipper', 'Skipper'), S.crew.length ? S.crew.map(c => T('dr-sk', c.name.split(' ')[0], o.skipper === c.id, 'data-id="' + c.id + '"')).join(' ') : L('Ingen mannskap ansatt', 'No crew hired')) +
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
    return '<div class="ph-card"><h4>' + L('Dagsrapport', 'Day report') + '</h4>' + (ks.length ? ks.map(k => kvr(k.slice(8) + '.' + k.slice(5, 7) + '.', days[k].n + L(' leveringer · ', ' landings · ') + fmt(days[k].kg, 0) + ' kg · ' + kr(days[k].kr))).join('') + (Object.keys(days).length > 3 ? B('dr-rep', repOpen ? L('Færre dager', 'Fewer days') : L('Flere dager', 'More days')) : '') : '<p class="ph-note">' + L('Ingen leveringer på planen ennå.', 'No landings on the plan yet.') + '</p>') + '</div>';
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
  function cancelRoute(){ DRIFTCTX = null; S.draft = []; if (typeof routeChanged === 'function') routeChanged(); }
  // ---- actions (data-pa="dr-…"); true when something changed
  function act(a, d){
    const o = driftOps();
    if (a === 'dr-new'){ S.ops = driftNew(); return true; }
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
  return {page, act, saveRoute, cancelRoute, draw};
})();
// the places a rest can be: the quay where the last trip ended, and the rorbuer near it
function driftRestPlaces(o, s){
  const from = portById(s.at === 'anker' ? s.near : s.at) || portById(S.boat.port) || nearestPort(S.boat.pos), out = [{id:from.id, name:from.name, rorbu:!!from.rorbu, d:0}];
  try { for (const R of rorbuSites(from.p, 40)) if (!out.some(q => q.id === R.id)) out.push({id:R.id, name:R.name, rorbu:true, d:dist(R.p, from.p)}); } catch (e){}
  return out.sort((a, c) => a.d - c.d).slice(0, 4);
}
