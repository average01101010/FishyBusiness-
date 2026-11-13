// ---------- Kappløpet on the screen (KL2, steg 117; docs/planer/kapplop.md KL2; the rules are in core/09o-kapplop.js) ----------
// The tab «Kappløp» in the Oppdrag app (lopPage, from ui/phone/02-havn-last-agn-ordre.js): the course with its six legs and your splits,
// the leg's task and the surprise when it is shown, «Meld på» at the quay in Lindesnes, «Begynn på nytt», and the rules in short
// sentences. The course in the chart while she is registered (lopSvg, from 03-map.js; the tasks' rings are turSvg's, which reads
// turActs). The race clock in the GPS box in 3D, the little chart's foot and the chart plotter's bar while a leg is sailed (lopClock).
// The card at each checkpoint with the leg's time, and at the finish with the time and the week (lopUi, once a tick from 08-actions.js).
// The card in the Sesong app with the week's best time (lopSeasonCard). The week's board from the cloud (KL3, steg 118; lopTop in
// ui/10h-world.js): the top 20 of a class and your place in the tab (lopBoard), the class's leader and your place in the Sesong card;
// without the cloud, or before the migration (404), only your own time, as before. Trim is never shown (V7 A). Nothing here points to
// a place where money is spent (kapplop.md «Det som ikke selges», V7 A): the race is sailed.
const lopKv = (k, v, cls) => '<div class="kv' + (cls ? ' ' + cls : '') + '"><span>' + k + '</span><b>' + v + '</b></div>';
const lopHmL = min => { const a = lopHm(min); return lopL(a[0], a[1]); };
// the clock short, for the GPS strip, the little chart's foot and the plotter's bar: «52 min», «3:07», «4 d 18:12» (the whole course
// is 4 to 7 game days, and the long form «4 d 18 t 12 min» wrapped the strip)
const lopHmS = min => { const m = Math.max(0, Math.round(min)), d = Math.floor(m / 1440), h = Math.floor(m % 1440 / 60), mm = String(m % 60).padStart(2, '0');
  return d ? d + ' d ' + String(h).padStart(2, '0') + ':' + mm : h ? h + ':' + mm : m + ' min'; };
const lopLegsN = () => LOP.cps.length + 1;
// the leg j's two ends (0: Lindesnes–Bergen … 5: Tromsø–Nordkapp)
const lopLegFrom = j => j ? LOP.cps[j - 1].name : LOP.start.name;
const lopLegTo = j => j < LOP.cps.length ? LOP.cps[j].name : LOP.goal.name;
// the leg's time from the splits (the split is the time on the clock at the checkpoint)
const lopLegMin = (splits, j) => splits[j] - (j ? splits[j - 1] : 0);
// the race clock now, for the race boat bound now while a leg is sailed: the time on the clock and the leg (1 to 6), or null
function lopClock(){
  const r = S.lop && S.lop.run; if (!r || r.st !== 'run' || r.vid !== S.cur || r.t0 == null) return null;
  return {min:lopTime(r, S.t).min, leg:Math.min(r.legs.length + 1, lopLegsN()), n:lopLegsN()};
}
// the race's title with the real week («Lindesnes–Nordkapp, uke 47»)
const lopTitle = wk => lopL(LOP.name[0] + ', uke ' + wk.w, LOP.name[1] + ', week ' + wk.w);
// a sea point past the finish line, east of the cape (Autonav goes there from Tromsø; the same as tests/kapplop.py)
const lopPast = () => P(71.215, 25.86);
// «Begynn på nytt» asks once more (the time of the first tap, put back when the tab is drawn more than 8 s after it, so the button
// always says what a tap does); LOP_TAB: the Oppdrag app opens on the race's tab (the card at a checkpoint, outside the phone)
let LOP_QUIT = 0, LOP_TAB = false;
// the class whose board the tab shows (null: the race boat's, or the boat's you are aboard)
let LOP_CLS = null;
// the race as it stands, read without making S.lop (only registering makes it: lopState)
const lopRead = () => S.lop || {run:null, hist:[], best:{}};

// ---- the tab ----
function lopPage(){
  const L = lopRead(), r = L.run, b = S.boat, V = VESSELS[b.type] || {}, wk = lopWeek(lopMs(S.t)), h = [], en = S.lang === 'en';
  const mine = !!(r && r.vid === S.cur), cls = mine ? r.cls : lopCls(V);
  if (LOP_QUIT && (Date.now() - LOP_QUIT > 8000 || !r || r.st !== 'run')) LOP_QUIT = 0;
  h.push('<div class="ph-card tur lop"><div class="tur-h"><span class="tur-c">' + lopL('Kappløp', 'Race') + '</span><small>' + lopL('Uke ', 'Week ') + wk.w + '</small></div><h4>' + lopL(LOP.name[0], LOP.name[1]) + '</h4>' +
    '<p class="ph-note">' + lopL('Den raskeste tida fra kaia i Lindesnes til mållinja nord for Nordkapp. Klokka går fra du kaster loss til du er over linja, også i havn og mens du sover.', 'The fastest time from the quay in Lindesnes to the finish line north of the North Cape. The clock runs from when you cast off until you are over the line, in harbour and while you sleep too.') + '</p>' +
    lopKv(lopL('Klasse', 'Class'), lopClsName(cls, en) + ' · ' + turEsc(mine ? ((VESSELS[r.type] || {}).name || {})[S.lang] || r.type : (V.name || {})[S.lang] || b.type)) +
    ((L.best || {})[wk.id] != null ? lopKv(lopL('Din beste tid denne uka', 'Your best time this week'), lopHmL(L.best[wk.id])) : '') + '</div>');
  // another of her boats is in the race: said here, with the clock; its tasks are done aboard it
  if (r && !mine){ const v = vesselById(r.vid), nm = v ? vget(v, 'boatName') || '' : r.name || '', T = lopTime(r, S.t);
    h.push('<div class="ph-card"><p class="ph-note">' + lopL('«' + turEsc(nm) + '» er med i kappløpet. Oppgavene underveis gjøres om bord i henne.', 'The «' + turEsc(nm) + '» is in the race. The tasks on the way are done aboard her.') + '</p>' +
      (r.st === 'run' ? lopKv(lopL('Klokka', 'The clock'), lopHmL(T.min)) + lopKv(lopL('Etappe', 'Leg'), Math.min(r.legs.length + 1, lopLegsN()) + lopL(' av ', ' of ') + lopLegsN()) : lopKv(lopL('Status', 'Status'), lopL('påmeldt, ligger i Lindesnes', 'registered, lies in Lindesnes'))) + '</div>'); }
  // the course: registered in Lindesnes first (ticked as soon as she is: nothing starts at nothing), the six legs, the line
  const T = r ? lopTime(r, S.t) : null, done = mine ? r.legs.length : 0, going = mine && r.st === 'run';
  const row = (st, k, v) => '<div class="kv lop-l ' + st + '"><span><i></i>' + k + '</span><b>' + v + '</b></div>';
  let course = row(mine ? 'ok' : '', lopL('Påmeldt i Lindesnes', 'Registered in Lindesnes'), mine ? (r.st === 'reg' ? lopL('klar', 'ready') : '✓') : '');
  for (let j = 0; j < lopLegsN(); j++){ const ok = mine && j < done, now = going && j === done;
    course += row(ok ? 'ok' : now ? 'now' : '', lopL('Etappe ', 'Leg ') + (j + 1) + ': ' + lopLegFrom(j) + '–' + lopLegTo(j), ok ? lopHmL(lopLegMin(T.splits, j)) : now ? lopL('pågår', 'under way') : LOP.legs[j].nm + ' nm'); }
  course += row(mine && r.st === 'done' ? 'ok' : '', lopL('Over mållinja', 'Over the finish line'), '');
  h.push('<div class="ph-card lop-c"><h4>' + lopL('Løypa', 'The course') + '</h4>' + course +
    (going ? lopKv(lopL('Klokka', 'The clock'), '<span class="lop-clock">' + lopHmL(T.min) + '</span>') + (T.pen ? lopKv(lopL('Lagt til', 'Added'), lopHmL(T.pen)) : '') + (T.ded ? lopKv(lopL('Trukket fra for hjelp til sjøs', 'Taken off for help at sea'), lopHmL(T.ded)) : '') : '') +
    lopButtons(r, mine) + '</div>');
  // the leg's tasks: the fixed one and the surprise when it is shown (and one carried on from the leg before)
  if (going){ const ts = (r.tasks || []).filter(m => m.leg === done || (m.st === 'go' && m.carry));
    if (ts.length) h.push('<h4 class="tur-sec">' + lopL('Etappe ' + (done + 1) + ': oppgavene', 'Leg ' + (done + 1) + ': the tasks') + '</h4>' + ts.map(lopTaskCard).join('')); }
  // the week's board in the cloud (KL3)
  h.push(lopBoard(cls, wk));
  // the attempts before
  if ((L.hist || []).length) h.push('<h4 class="tur-sec">' + lopL('Forsøkene dine', 'Your attempts') + '</h4><div class="ph-card">' + L.hist.slice(0, 5).map(e => {
    const w = lopWeek(lopMs(e.t1)).w;
    return lopKv(lopL('Uke ', 'Week ') + w + ' · ' + lopClsName(e.cls, en), e.st === 'done' ? lopHmL(e.min) : '<span class="r2">' + lopL('brutt', 'broken off') + ' (' + lopL(lopHowWords(e.how)[0], lopHowWords(e.how)[1]) + ')</span> · ' + e.legs + '/' + lopLegsN()); }).join('') + '</div>');
  h.push('<h4 class="tur-sec">' + lopL('Reglene', 'The rules') + '</h4><div class="ph-card"><ul class="lop-r">' + [
    ['Påmeldingen er ved kaia i Lindesnes. Klokka går når du kaster loss.', 'You register at the quay in Lindesnes. The clock starts when you cast off.'],
    ['Én klokke til mål: den går også i havn, ved bunkring og når spillet er lukket. Autonav seiler videre.', 'One clock to the finish: it runs in harbour, while bunkering and with the game closed too. Autonav sails on.'],
    ['Hvert sjekkpunkt teller når etappens oppgave er gjort. Overraskelsen er frivillig, men står den ugjort når etappen er over, legges ' + LOP.task.miss + ' minutter til.', 'Each checkpoint counts when the leg\'s task is done. The surprise is up to you, but left undone when the leg is over, it adds ' + LOP.task.miss + ' minutes.'],
    ['Over en fartsgrense, eller for nær en båt du skulle vike for, mens du styrer selv: ' + LOP.pen.fart + ' minutter lagt til.', 'Over a speed limit, or too close to a boat you should give way to, while you steer yourself: ' + LOP.pen.fart + ' minutes added.'],
    ['Svarer du på et nødanrop, trekkes tida hjelpen tok fra. Å hjelpe koster ingen plass.', 'If you answer a call for help, the time it took is taken off. Helping costs no place.'],
    ['Hopp er ikke lov fra påmeldingen til mål. Slep fra Redningsselskapet eller en annen spiller, og salg av båten, bryter forsøket.', 'No hops from the registration to the finish. A tow from the rescue service or another player, and selling the boat, break the attempt.'],
    ['Klassen er båttypens toppfart. Uka går fra mandag til søndag, og den beste tida di den uka står.', 'The class is the boat type\'s top speed. The week runs Monday to Sunday, and your best time that week stands.']
  ].map(x => '<li>' + lopL(x[0], x[1]) + '</li>').join('') + '</ul></div>');
  return h.join('');
}
// the week's board for a class (KL3): the top 20 with the boat, the player's name and the time, your place under them when you are
// further down, and how many have finished; the other classes a tap away. '' without the cloud (the tab shows your own time)
function lopBoard(cls0, wk){
  const T = typeof lopTop === 'function' ? lopTop(wk.id) : null; if (!T) return '';
  const en = S.lang === 'en', cls = LOP_CLS && LOP.cls.keys.includes(LOP_CLS) ? LOP_CLS : cls0, d = T.data, C = d && d.cls ? d.cls[cls] : null, rows = C ? C.rows || [] : [];
  // (your row: the race boat's name as the server has it, not the boat you are aboard now)
  const esc = turEsc, me0 = esc(S.boatName || lopL('Deg', 'You')), me = r => (r && r.boat && peerName(r.boat) !== '–' ? esc(peerName(r.boat)) : me0) + ' <small>(' + lopL('deg', 'you') + ')</small>';
  const nm = r => { const bn = peerName(r.boat), un = r.user ? peerName(r.user) : ''; return (bn === '–' ? lopL('Ukjent båt', 'Unknown boat') : esc(bn)) + (un && un !== '–' ? '<br><small class="ph-note">' + esc(un) + '</small>' : ''); };
  const tabs = '<div class="ph-sub" style="padding:0 0 8px">' + LOP.cls.keys.map(k => '<button class="' + (k === cls ? 'on' : '') + '" data-pa="lopcls" data-s="' + k + '">' + lopClsName(k, en) + '</button>').join('') + '</div>';
  const body = !d ? '<p class="ph-note">' + (T.err ? lopL('Tavla kan ikke hentes nå.', 'The board cannot be fetched now.') : lopL('Henter tavla …', 'Fetching the board …')) + '</p>'
    : !rows.length ? '<p class="ph-note">' + lopL('Ingen i klassen ' + lopClsName(cls).toLowerCase() + ' har kommet i mål denne uka ennå.', 'No one in the class ' + lopClsName(cls, true).toLowerCase() + ' has finished this week yet.') + '</p>'
    : '<table class="ph-tbl lop-top"><tr><th>#</th><th>' + lopL('Båt', 'Boat') + '</th><th class="n">' + lopL('Tid', 'Time') + '</th></tr>' +
      rows.map(r => '<tr class="' + (r.me ? 'me' : '') + '"><td>' + r.rank + '</td><td>' + (r.me ? me(r) : nm(r)) + '</td><td class="n">' + lopHmS(r.min) + '</td></tr>').join('') +
      (C.mine && C.mine.rank > rows.length ? '<tr class="me"><td>' + C.mine.rank + '</td><td>' + me(C.mine) + '</td><td class="n">' + lopHmS(C.mine.min) + '</td></tr>' : '') + '</table>';
  const n = C ? C.n || 0 : 0, guest = typeof isGuest === 'function' && isGuest();
  return '<h4 class="tur-sec">' + lopL('Ukas tavle', 'This week\'s board') + '</h4><div class="ph-card lop-board">' + tabs + body +
    '<p class="ph-note">' + (n ? lopL(n + (n === 1 ? ' båt' : ' båter') + ' i mål i klassen denne uka. ', n + (n === 1 ? ' boat' : ' boats') + ' finished in the class this week. ') : '') +
    lopL('Den beste tida til hver båt i uka står. Ny tavle mandag kl. 00.', 'Each boat\'s best time of the week stands. A new board on Monday at 00:00.') +
    (guest ? ' ' + lopL('Som gjest ser du bare din egen tid, og står ikke på tavla for andre.', 'As a guest you see only your own time, and are not on the board for others.') : '') + '</p></div>';
}
// the course card's buttons: «Meld på» (or why not, with the way to Lindesnes), «Kast loss mot …» / «Kjør til …», and «Begynn på nytt»
function lopButtons(r, mine){
  const b = S.boat, free = ['idle', 'port'].includes(b.status), B = [];
  if (!r){ const had = S.lop, why = lopWhyNot(); if (!had) delete S.lop;   // (lopWhyNot makes S.lop: not by looking)
    if (!why) B.push('<button class="ph-btn p" data-pa="lopreg">' + lopL('Meld på', 'Register') + '</button>');
    else { B.push('<p class="ph-note">' + lopL(why[0], why[1]) + '</p>');
      if (free && lopCpOf(b.port) !== 0) B.push('<button class="ph-btn p" data-pa="lopgo">' + lopL('Kjør til ' + LOP.start.name, 'Go to ' + LOP.start.name) + '</button>'); } }
  else if (mine){
    const next = r.st === 'reg' ? 0 : r.legs.length, to = lopLegTo(Math.min(next, LOP.cps.length));
    if (free) B.push('<button class="ph-btn p" data-pa="lopgo">' + (r.st === 'reg' ? lopL('Kast loss mot ', 'Cast off for ') : lopL('Kjør til ', 'Go to ')) + to + '</button>');
    B.push('<button class="ph-btn' + (LOP_QUIT ? ' warn' : '') + '" data-pa="lopquit">' + (r.st === 'reg' ? lopL('Stryk påmeldingen', 'Strike the registration') : LOP_QUIT ? lopL('Trykk igjen for å bryte', 'Tap again to break off') : lopL('Begynn på nytt', 'Start again')) + '</button>');
    if (r.st === 'run' && LOP_QUIT) B.push('<p class="ph-note">' + lopL('Forsøket brytes, og du melder deg på igjen i Lindesnes. Etappene du har seilt, teller fortsatt på merket.', 'The attempt is broken off, and you register again in Lindesnes. The legs you have sailed still count on the badge.') + '</p>'); }
  return B.length ? '<div class="tur-b lop-b">' + B.join('') + '</div>' : '';
}
// one task of the leg as a card: what it is, how far it has come, and its buttons (the missions' own: «Kjør dit», «Ta bilde», «Mål fisken»)
function lopTaskCard(m){
  const w = lopTaskWhat(m), b = S.boat, go = m.st === 'go', K = lopKv;
  let x = '';
  if (m.k === 'foto'){ const d = dist(b.pos, m.fyr), t = go && m.lys ? turLysNext(m, S.t / 60) : null;
    x = K(lopL('Fyret', 'The lighthouse'), turEsc(turFyrName(m)) + ' · ' + fmt(d, d < 10 ? 1 : 0) + ' km') + K(lopL('Lys', 'Light'), m.lys ? lopL(TUR_LYS[m.lys].no, TUR_LYS[m.lys].en) + (t != null && t > S.t / 60 + 0.1 ? ' · ' + lopL('ca. kl. ', 'about ') + hm(t) : '') : lopL('når som helst', 'any time')); }
  else if (m.k === 'prove' && m.kind === 'stasjon') x = K(lopL('Stasjon', 'Station'), coordStr(m.p)) + K(lopL('Fisket der', 'Fished there'), turMinR((m.min || 0) / 60) + ' / ' + turMinR(m.need / 60) + ' min') + (m.stage === 'measure' ? K(lopL('Målt', 'Measured'), ((m.meas || []).length) + ' / 10') : '');
  else if (m.k === 'prove') x = K(lopL('Linja', 'The line'), lopL('punkt ', 'point ') + Math.min(3, (m.at || 0) + 1) + lopL(' av 3', ' of 3')) + K(lopL('Fart', 'Speed'), lopL('høyst ', 'at most ') + TUR.ekkoMax + lopL(' knop', ' knots'));
  else if (m.k === 'slep') x = K(lopL('Båten', 'The boat'), '«' + turEsc(m.boat) + '»') + K(m.stage === 'tow' ? lopL('På slep til', 'In tow to') : lopL('Driver ved', 'Drifting at'), m.stage === 'tow' ? turEsc((portById(m.to) || {}).name || '') : coordStr(m.p)) + K(lopL('Fart på slep', 'Speed in tow'), lopL('høyst 5,5 knop', 'at most 5.5 knots'));
  else if (m.k === 'frakt') x = K(lopL('Lasta', 'The freight'), m.stage === 'pick' ? lopL('venter på kaia i ', 'waits on the quay in ') + turEsc((portById(m.from) || {}).name || '') : m.stage === 'go' ? lopL('om bord', 'aboard') : lopL('levert', 'landed'));
  const st = m.st === 'go' ? '' : m.st === 'done' ? lopL('gjort', 'done') : m.st === 'miss' ? lopL('ikke gjort', 'not done') : lopL('gikk ikke', 'failed');
  const adj = m.adj ? ' · ' + (m.adj > 0 ? '+' : '−') + lopHmL(Math.abs(m.adj)) : '';
  const note = m.role === 'fix' ? lopL('Sjekkpunktet teller når denne er gjort.', 'The checkpoint counts when this is done.') : lopL('Frivillig. Ugjort når etappen er over: ' + LOP.task.miss + ' minutter lagt til.', 'Up to you. Undone when the leg is over: ' + LOP.task.miss + ' minutes added.');
  let btn = '';
  if (go && m.vid === S.cur){
    if (m.k === 'prove' && m.stage === 'measure') btn += '<button class="ph-btn p" data-pa="turmeas" data-id="' + turEsc(m.id) + '">' + lopL('Mål fisken', 'Measure the fish') + '</button>';
    const near = m.k === 'foto' && dist(b.pos, m.fyr) <= TUR.fotoR;
    if (near && !turG3()) btn += '<button class="ph-btn p" data-pa="turfoto" data-id="' + turEsc(m.id) + '">' + lopL('Ta bilde', 'Take the picture') + '</button>';
    if (!(m.k === 'prove' && m.stage === 'measure') && !(m.k === 'frakt' && m.stage !== 'pick') && !(m.k === 'frakt' && b.status === 'port' && b.port === m.from))
      btn += '<button class="ph-btn' + (near ? '' : ' p') + '" data-pa="turgo" data-id="' + turEsc(m.id) + '">' + lopL('Kjør dit', 'Go there') + '</button>';
  }
  return '<div class="ph-card tur lop-t ' + (m.role === 'fix' ? 'fix' : 'surp') + (go ? '' : ' over') + '"><div class="tur-h"><span class="tur-c">' + (m.role === 'fix' ? lopL('Oppgaven', 'The task') : lopL('Overraskelsen', 'The surprise')) + '</span><small>' + (st ? st + adj : lopL('Etappe ', 'Leg ') + (m.leg + 1)) + '</small></div>' +
    '<h4>' + turEsc(lopL(w[0], w[1])) + '</h4><p class="ph-note">' + note + '</p>' + x + (btn ? '<div class="tur-b">' + btn + '</div>' : '') + '</div>';
}
// «Meld på» from the tab
function lopReg(){ const r = lopStart(); if (r && r.why){ toast(lopL(r.why[0], r.why[1])); return false; } save(); return true; }
// «Begynn på nytt»: twice for an attempt under way (the second while the button says «Trykk igjen»); the registration is struck at once
function lopQuit(){
  const r = S.lop && S.lop.run; if (!r) return;
  if (r.st === 'run' && !LOP_QUIT){ LOP_QUIT = Date.now(); return; }
  LOP_QUIT = 0; lopEnd('avbrutt'); save();
}
// «Meld på» is at Lindesnes: the way there; registered, casting off for Bergen (the clock starts, lopDepart); under way, the way to the
// next checkpoint's quay, or past the line after Tromsø. As «Kjør dit» does it for a mission (05f-turer.js turGo)
async function lopGo(){
  const r = S.lop && S.lop.run, mine = !!(r && r.vid === S.cur && (r.st === 'reg' || r.st === 'run'));
  const k = !mine ? -1 : r.st === 'reg' ? 0 : r.legs.length, toPort = k < 0 ? LOP.start.port : k < LOP.cps.length ? LOP.cps[k].port : null;
  await turSail(toPort ? portById(toPort).p : lopPast(), toPort);
}

// ---- the course in the chart, while she is registered: the checkpoints with their names, the finish line, and the legs as thin
// dotted lines between them; the leg she sails now as the way Autonav takes when her own route ends at the checkpoint (or past the
// line after Tromsø). No route is searched for the chart: a search holds the route search's things in the water and its tide
// (11-route.js LEIA_RUN) for every search under way while it runs, so one in the background would change the way she finds herself
// with «Kjør dit» or Autonav (kontrollen 13.11.2026)
function lopLegWay(r, j){
  const b = S.boat, P = S.plan, last = P && P.wps && P.wps[P.wps.length - 1], to = j < LOP.cps.length ? LOP.cps[j].port : null;
  if (r.vid !== S.cur || !last || P.idx >= P.wps.length) return null;
  return (to ? last.port === to : !last.port && last.y < LOP.goal.p.y) ? [b.pos].concat(P.wps.slice(P.idx)) : null;
}
function lopSvg(u, inV){
  const r = S.lop && S.lop.run; if (!r || !(r.st === 'reg' || r.st === 'run')) return '';
  const g = [], pts = [LOP.start.p].concat(LOP.cps.map(c => c.p)), done = r.st === 'run' ? r.legs.length : 0;
  for (let j = 0; j < lopLegsN(); j++){ const a = pts[j], c = j < LOP.cps.length ? pts[j + 1] : lopPast(), w = j === done ? lopLegWay(r, j) : null, line = w && w.length > 1 ? w : [a, c];
    g.push('<polyline points="' + line.map(q => q.x.toFixed(3) + ',' + q.y.toFixed(3)).join(' ') + '" class="lopmk' + (j < done ? ' done' : j === done ? ' now' : '') + '" fill="none" stroke-width="' + ((w ? 2.6 : 1.4) * u) + '"' + (w ? '' : ' stroke-dasharray="' + (1.5 * u) + ' ' + (4 * u) + '"') + '/>'); }
  // the checkpoints: a square at each, filled when passed, with the name on the sea side (left of it: the course runs up the west
  // coast, and the chart's own names for the towns stand right of their dots, so the two never lie on each other; kontrollen 13.11.2026)
  pts.forEach((p, i) => { if (!inV(p.x, p.y)) return; const s = 7 * u, ok = i === 0 ? r.st === 'run' : i <= done;
    g.push('<rect x="' + (p.x - s) + '" y="' + (p.y - s) + '" width="' + 2 * s + '" height="' + 2 * s + '" transform="rotate(45 ' + p.x + ' ' + p.y + ')" class="lopcp' + (ok ? ' ok' : '') + '" stroke-width="' + (1.8 * u) + '"/>');
    g.push(txt({x:p.x - 11 * u, y:p.y + 4 * u}, turEsc(i === 0 ? LOP.start.name : LOP.cps[i - 1].name), 'lbl-lop', 11 * u, 'text-anchor="end" stroke-width="' + (2.5 * u) + '"')); });
  // the finish line: due north in the chart's grid from the cape, 40 km out (lopCross)
  const G = LOP.goal, X = G.p.x, y0 = G.p.y + 0.3, y1 = G.p.y - G.north;
  if (inV(X, (y0 + y1) / 2) || inV(X, y0) || inV(X, y1)){
    g.push('<line x1="' + X + '" y1="' + y0 + '" x2="' + X + '" y2="' + y1 + '" class="lopgoal" stroke-width="' + (3 * u) + '" stroke-dasharray="' + (5 * u) + ' ' + (5 * u) + '"/>');
    g.push(txt({x:X + 8 * u, y:y1 + 14 * u}, lopL('Mål', 'Finish'), 'lbl-lop', 11 * u, 'stroke-width="' + (2.5 * u) + '"')); }
  return g.join('');
}

// ---- the card at a checkpoint and at the finish (once each; a checkpoint passed with the game closed shows when it opens, within a day) ----
function lopUi(){
  const L = S.lop, c = lopClock(), bd = document.body, on = !!c;
  if (bd.classList.contains('lopon') !== on) bd.classList.toggle('lopon', on);
  if (on){ const el = $('ecLop'); if (el){ const t = lopHmS(c.min); if (el.textContent !== t) el.textContent = t; } const l2 = $('ecLopL'); if (l2){ const t = lopL('KAPPLØP ', 'RACE ') + c.leg + '/' + c.n; if (l2.textContent !== t) l2.textContent = t; } }
  if (!L || (typeof tutOn === 'function' && tutOn())) return;
  const r = L.run, e = L.hist && L.hist[0];
  if (r && r.st === 'run' && r.vid === S.cur && (r.seenN || 0) < r.legs.length){ r.seenN = r.legs.length; const l = r.legs[r.legs.length - 1]; if (S.t - l.t < 1440) lopPop(lopCpHtml(r)); }
  if (e && e.st === 'done' && !e.seen){ e.seen = 1; if (S.t - e.t1 < 1440) lopPop(lopGoalHtml(e)); }
}
function lopCpHtml(r){
  const n = r.legs.length, T = lopTime(r), j = n - 1, k = lopCpOf(r.legs[j].pid), nm = k > 0 ? LOP.cps[k - 1].name : lopLegTo(j);
  const nx = (r.tasks || []).filter(m => m.leg === n);
  return '<h4>' + lopL('Sjekkpunkt ' + nm, 'Checkpoint ' + nm) + '</h4><p>' + lopL('Etappe ' + n + ' av ' + lopLegsN() + ' er seilt: ' + lopLegFrom(j) + '–' + lopLegTo(j) + '.', 'Leg ' + n + ' of ' + lopLegsN() + ' is sailed: ' + lopLegFrom(j) + '–' + lopLegTo(j) + '.') + '</p>' +
    lopKv(lopL('Etappetida', 'The leg\'s time'), lopHmL(lopLegMin(T.splits, j))) + lopKv(lopL('Klokka', 'The clock'), lopHmL(T.splits[j])) +
    (n < lopLegsN() ? '<p class="lop-nx">' + lopL('Neste: ' + lopLegFrom(n) + '–' + lopLegTo(n) + '.', 'Next: ' + lopLegFrom(n) + '–' + lopLegTo(n) + '.') + nx.map(m => { const w = lopTaskWhat(m); return ' ' + (m.role === 'fix' ? lopL('Oppgaven: ', 'The task: ') : lopL('Overraskelsen: ', 'The surprise: ')) + turEsc(lopL(w[0], w[1])) + '.'; }).join('') + '</p>' : '');
}
function lopGoalHtml(e){
  const wk = lopWeek(lopMs(e.t1)), best = S.lop.best[wk.id];
  return '<h4>' + lopL('Over mållinja ved ' + LOP.goal.name + '!', 'Over the finish line at ' + LOP.goal.name + '!') + '</h4><p>' + lopTitle(wk) + ' · ' + lopClsName(e.cls, S.lang === 'en') + '</p>' +
    lopKv(lopL('Tida', 'The time'), lopHmL(e.min)) + (e.pen ? lopKv(lopL('Lagt til', 'Added'), lopHmL(e.pen)) : '') + (e.ded ? lopKv(lopL('Trukket fra for hjelp', 'Taken off for help'), lopHmL(e.ded)) : '') +
    lopKv(lopL('Din beste tid denne uka', 'Your best time this week'), lopHmL(best != null ? best : e.min)) +
    (e.splits || []).map((s, j) => lopKv(lopL('Etappe ', 'Leg ') + (j + 1), lopHmL(lopLegMin(e.splits, j)), 'lop-s')).join('');
}
function lopPop(inner){
  let el = $('lopPop'); if (!el){ el = document.createElement('div'); el.id = 'lopPop'; document.body.appendChild(el); }
  el.innerHTML = '<div class="lp-box">' + inner + '<div class="lp-b"><button class="ph-btn" data-x="see">' + lopL('Se kappløpet', 'See the race') + '</button><button class="ph-btn p" data-x="ok">OK</button></div></div>';
  const close = () => { el.hidden = true; el.innerHTML = ''; };
  el.querySelector('[data-x=ok]').onclick = close;
  el.querySelector('[data-x=see]').onclick = () => { close(); LOP_TAB = true; if (typeof PHONE !== 'undefined') PHONE.open('ordl'); };
  el.hidden = false;
}

// ---- the card in the Sesong app: the race this week and your best time (the board for everyone is KL3) ----
function lopSeasonCard(){
  const L = lopRead(), wk = lopWeek(lopMs(S.t)), best = (L.best || {})[wk.id], c = lopClock(), r = L.run;
  // the week's leader in the class and your place (KL3), when the board has come
  const cls = r ? r.cls : lopCls(VESSELS[S.boat.type]), T = typeof lopTop === 'function' ? lopTop(wk.id) : null, C = T && T.data && T.data.cls ? T.data.cls[cls] : null, top = C && C.rows && C.rows[0];
  const lead = top ? lopKv(lopL('Ukas beste, ' + lopClsName(cls).toLowerCase(), 'This week\'s best, ' + lopClsName(cls, true).toLowerCase()), (top.me ? lopL('deg', 'you') : turEsc(peerName(top.boat))) + ' · ' + lopHmS(top.min)) +
    (C.mine ? lopKv(lopL('Din plass', 'Your place'), C.mine.rank + lopL(' av ', ' of ') + (C.n || 0)) : '') : '';
  return '<div class="ph-card lop-s"><h4>' + lopTitle(wk) + '</h4><p class="ph-note">' + lopL('Kappløpet fra Lindesnes til Nordkapp er åpent hele uka. Meld deg på ved kaia i Lindesnes, under Oppdrag › Kappløp.', 'The race from Lindesnes to the North Cape is open all week. Register at the quay in Lindesnes, under Orders › Race.') + '</p>' +
    (best != null ? lopKv(lopL('Din beste tid denne uka', 'Your best time this week'), lopHmL(best)) : '') + lead +
    (c ? lopKv(lopL('Forsøket ditt nå', 'Your attempt now'), lopL('etappe ', 'leg ') + c.leg + '/' + c.n + ' · ' + lopHmL(c.min)) : r && r.st === 'reg' ? lopKv(lopL('Forsøket ditt nå', 'Your attempt now'), lopL('påmeldt i Lindesnes', 'registered in Lindesnes')) : '') +
    '<div class="tur-b"><button class="ph-btn" data-pa="loptab">' + lopL('Til kappløpet', 'To the race') + '</button></div></div>';
}
