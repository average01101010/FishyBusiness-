// ===== Drift: the standing operations plan, per vessel (Jonas 08.10.2026: «en skikkelig driftsplanlegger … flere turer om dagen … hvilket
// utstyr … hvor lenge det skal stå … hvile på rorbu … grenser for vind og bølgehøyde … må alltid ende opp på samme plass») =====
// S.ops (a vessel's own field, VKEYS) is a plan of SESSIONS repeated every `period` hours (24 by default):
//   tur   a route (wps, as the plotter draws it) from where the session starts to the port it ends in; the catch is landed there
//   hvile the boat goes to a quay or a rorbu and stays until the next session is due (the crew sleep at a rorbu, 07d-rorbu.js)
// A plan fishes with ONE rig (juksa, line, garn or teiner; bottom trawl, purse seine and Danish seine are in the table for the sea
// steps, flagged `soon`). The rig decides the rhythm:
//   tur   jigging: out, fill the hold, land, out again, as many times a day as the sessions say
//   sett  line, nets, pots: the route has stations (act:{op:'cycle'}) where what stands is hauled and set again; the soak is the time
//         between two rounds, so it is the gap between the sessions (the app shows it per round)
//   felt  trawl and seine: long periods on the grounds (the sessions are long, the period can be several days)
// A plan is approved (and can be switched on) only when it closes: the end of the last session is where the first one starts.
// the route being drawn for a session (ui/05c-drift.js): where it starts, so the plotter draws from there and not from the boat
let DRIFTCTX = null;
// the plotter draws from the trip's start only while a route for this vessel's plan is being drawn; a place being picked for the plan maker
// (DRIFTCTX.spot) does not move the start, so the boat's own route and Autonav always start where she is (tilbakemelding 09.10.2026)
const driftCtxOn = () => !!(DRIFTCTX && !DRIFTCTX.spot && DRIFTCTX.vid === S.cur);
const DRF = {landH:1, setH:{garn:0.8, line:0.9, teine:0.6}, late:8, window:8, maxDelay:8, failMax:3, tplMax:12, repMax:80,
  // the soak window each gear should have, hours: [too short under, good from, good to, too long over] (the fish and the gear suffer outside it)
  soak:{line:[4, 6, 20, 30], garn:[8, 12, 36, 60], teine:[18, 24, 60, 96]}};
const DRF_RIGS = {
  juksa:{mode:'tur'}, line:{mode:'sett', kind:'line'}, garn:{mode:'sett', kind:'garn'}, teiner:{mode:'sett', kind:'teine'},
  bunntral:{mode:'felt', soon:true, no:'Bunntrål', en:'Bottom trawl'}, ringnot:{mode:'felt', soon:true, no:'Ringnot', en:'Purse seine'}, snurrevad:{mode:'felt', soon:true, no:'Snurrevad', en:'Danish seine'}};
const driftRigName = r => DRF_RIGS[r] && DRF_RIGS[r].no ? gL(DRF_RIGS[r].no, DRF_RIGS[r].en) : rigName(r);
const driftMode = o => (DRF_RIGS[o.rig] || DRF_RIGS.juksa).mode;
function driftNew(over){
  const b = S.boat, o = {v:2, on:false, name:gL('Driftsplan', 'Operations plan'), rig:RIGS[b.rig] ? b.rig : 'juksa', skipper:(S.crew[0] || {}).id || null, mate:null, crewMode:'day', watchH:6,
    wx:{wind:12, hs:2.5, shelter:true}, days:[1, 1, 1, 1, 1, 0, 0], period:24, stock:{ice:true, fuel:true, gear:true, bait:true},
    sess:[], idx:0, cn:0, a0:null, hold:0, fails:0, paused:null, cur:null, rep:[], skipped:0};
  return Object.assign(o, over || {});
}
let DRF_SID = 0;
const driftSid = () => 's' + Date.now().toString(36) + (DRF_SID++).toString(36);
// the old plan (one route, one departure a day, a wind limit) becomes a plan of one session; an object a test or an old save wrote
// with only some fields gets the rest
function driftUp(o){
  if (!o || o.v === 2) return o;
  const n = driftNew({on:!!o.on, skipper:o.skipper || null, days:Array.isArray(o.days) ? o.days.slice() : [1, 1, 1, 1, 1, 0, 0], wx:{wind:o.maxWind || 12, hs:2.5, shelter:true}, hold:0});
  const act = (o.wps || []).find(w => w.act && w.act.kind);
  if (act) n.rig = rigOfKind(act.act.kind); else if (!RIGS[S.boat.rig]) n.rig = 'juksa';
  if (o.wps && o.wps.length){
    const first = o.wps[0], home = o.home || (first && first.port) || null;
    n.sess.push({id:driftSid(), type:'tur', dep:o.dep == null ? 5 : o.dep, route:{wps:o.wps.map(w => ({...w})), speed:o.speed || 9, home, end:o.end || home, hours:o.hours || 8}});
  }
  S.ops = n; return n;
}
const driftOps = () => { const o = S.ops; return o && o.v !== 2 ? driftUp(o) : o; };
const driftHod = H => { const g = gDate(H); return g.getUTCHours() + g.getUTCMinutes() / 60; };

// ---- how long things take (estimates; the plan's overview and its dry run use the same)
function driftLegHours(wps, speed, from){
  let h = 0, a = from; const v = Math.max(1, speed || 9);
  for (const w of wps){ if (a) h += dist(a, w) / (v * NM); h += (w.fish || 0); if (w.act && w.act.kind) h += DRF.setH[w.act.kind] || 0.7; a = w; }
  return h;
}
function driftSessHours(o, s){
  if (s.type === 'hvile') return 0;
  const r = s.route; if (!r || !r.wps || !r.wps.length) return 0;
  return driftLegHours(r.wps, r.speed, portById(r.home) ? portById(r.home).p : r.wps[0]) + DRF.landH;
}
const driftEndPort = s => s.type === 'hvile' ? (s.at === 'anker' ? s.near : s.at) : s.route && s.route.end;
const driftStartPort = s => s.type === 'hvile' ? null : s.route && s.route.home;
// the stations of a route (what the soak is measured between)
const driftStations = s => s.route && s.route.wps ? s.route.wps.filter(w => w.act && w.act.kind) : [];

// the hours a rest lasts: until the next session is due
function driftRestHours(o, s){ const S2 = o.sess.slice().sort((a, c) => a.dep - c.dep), i = S2.indexOf(s), nx = S2[(i + 1) % S2.length]; let g = nx.dep - s.dep; if (g <= 0) g += o.period; return Math.max(1, g); }
// ---- the check: errors stop the plan being switched on, warnings only inform. Also the overview the player reads.
function driftCheck(o){
  const E = [], W = [], rep = {work:0, trips:0, gaps:[], soak:[], period:o.period}, no = (a, b) => gL(a, b);
  const S2 = o.sess.slice().sort((a, c) => a.dep - c.dep);
  if (!o.sess.length) E.push(no('Planen har ingen økter. Legg til en tur.', 'The plan has no sessions. Add a trip.'));
  const kindOk = {juksa:null, line:'line', garn:'garn', teiner:'teine'}, want = kindOk[o.rig];
  if (DRF_RIGS[o.rig] && DRF_RIGS[o.rig].soon) E.push(no(driftRigName(o.rig) + ' kommer med havsteget og kan ikke settes opp ennå.', driftRigName(o.rig) + ' arrives with the ocean step and cannot be planned yet.'));
  else if (!rigHas(o.rig)) E.push(no('Båten har ikke utstyret for ' + driftRigName(o.rig).toLowerCase() + '. Monter det under Oppgrader.', 'The boat has no equipment for ' + driftRigName(o.rig).toLowerCase() + '. Fit it under Upgrade.'));
  for (const s of S2){
    if (s.type === 'hvile'){
      if (s.at === 'anker'){
        if (!s.near || !portById(s.near)) E.push(no('En hviløkt ved anker mangler havnen den ligger nær.', 'A rest at anchor has no harbour to lie near.'));
        else if (s.pos){ const sp = anchorSpot(s.pos), lim = BOAT.risk[2] / (0.7 + 0.3 * (sp.expo == null ? 1 : sp.expo));
          if (!sp.ok) W.push(no('Ankerplassen nær ' + portById(s.near).name + ' passer ikke lenger. Velg på nytt.', 'The anchorage near ' + portById(s.near).name + ' no longer fits. Choose again.'));
          else if (sp.level >= 1) W.push(no('Ankerplassen nær ' + portById(s.near).name + ' er ' + (sp.level === 2 ? 'åpen og utsatt' : 'noe åpen') + '. Ankeret begynner å slepe fra ca. ' + Math.round(lim) + ' m/s vind eller ' + fmt(BOAT.risk[0], 1) + ' m sjø. Ved dårligere vær ligger båten ved kai.', 'The anchorage near ' + portById(s.near).name + ' is ' + (sp.level === 2 ? 'open and exposed' : 'somewhat open') + '. The anchor starts to drag from about ' + Math.round(lim) + ' m/s of wind or ' + fmt(BOAT.risk[0], 1) + ' m of sea. In worse weather the boat lies at the quay.')); }
        continue; }
      if (!s.at || !portById(s.at)) E.push(no('En hviløkt mangler hvilested.', 'A rest session has no place to rest.')); continue; }
    const r = s.route;
    if (!r || !r.wps || !r.wps.length){ E.push(no('En tur kl. ' + driftClock(s.dep) + ' har ingen rute. Tegn ruta i kartplotteren.', 'The trip at ' + driftClock(s.dep) + ' has no route. Draw it in the plotter.')); continue; }
    if (!r.end || !portById(r.end)) E.push(no('Turen kl. ' + driftClock(s.dep) + ' må ende i en havn.', 'The trip at ' + driftClock(s.dep) + ' must end in a port.'));
    for (const w of r.wps) if (w.act && w.act.kind && w.act.kind !== want) { E.push(no('Turen kl. ' + driftClock(s.dep) + ' har ' + GEAR[w.act.kind].no.toLowerCase() + ', men planen fisker med ' + driftRigName(o.rig).toLowerCase() + '. Bare én type utstyr kan brukes i en plan.', 'The trip at ' + driftClock(s.dep) + ' has ' + GEAR[w.act.kind].en.toLowerCase() + ', but the plan fishes with ' + driftRigName(o.rig).toLowerCase() + '. Only one type of gear can be used in a plan.')); break; }
  }
  // the plan closes: each session starts where the one before ended, and the last ends where the first starts («må alltid ende opp på samme plass»)
  if (S2.length){
    let at = null, first = null; const named = p => (portById(p) || {}).name || '?';
    for (let i = 0; i < S2.length; i++){
      const s = S2[i], st = driftStartPort(s);
      if (first === null) first = st || s.at;
      if (at && st && at !== st) E.push(no('Turen kl. ' + driftClock(s.dep) + ' starter i ' + named(st) + ', men forrige økt slutter i ' + named(at) + '.', 'The trip at ' + driftClock(s.dep) + ' starts in ' + named(st) + ', but the session before ends in ' + named(at) + '.'));
      at = driftEndPort(s) || at;
    }
    if (first && at && first !== at) E.push(no('Planen ender i ' + named(at) + ', men begynner i ' + named(first) + '. Den må ende der den begynner.', 'The plan ends in ' + named(at) + ' but begins in ' + named(first) + '. It has to end where it begins.'));
  }
  // the day: work, trips, and the rest between the sessions
  let prevEnd = null;
  for (let i = 0; i < S2.length; i++){
    const s = S2[i], h = driftSessHours(o, s), end = s.dep + h;
    if (s.type !== 'hvile'){ rep.work += h; rep.trips++; }
    if (prevEnd !== null){ const gap = s.dep - prevEnd; if (gap < 0) E.push(no('Turen kl. ' + driftClock(s.dep) + ' starter før forrige tur er ferdig (ca. kl. ' + driftClock(prevEnd) + ').', 'The trip at ' + driftClock(s.dep) + ' starts before the last one is done (about ' + driftClock(prevEnd) + ').')); else rep.gaps.push(gap); }
    prevEnd = Math.max(prevEnd === null ? 0 : prevEnd, end);
  }
  if (S2.length){ const wrap = S2[0].dep + o.period - prevEnd; if (wrap < 0) E.push(no('Øktene tar mer enn ' + o.period + ' timer, så neste runde rekker ikke å begynne.', 'The sessions take more than ' + o.period + ' hours, so the next round cannot begin.')); else rep.gaps.push(wrap); }
  const hv = rep.gaps.length ? Math.min(...rep.gaps) : 0; rep.restMin = hv; rep.restTotal = rep.gaps.reduce((a, g) => a + g, 0);
  // the soak of the passive gear is the gap between two rounds; a plan with stations needs a second round to haul what the first set
  if (driftMode(o) === 'sett'){
    const st = S2.filter(s => s.type !== 'hvile' && driftStations(s).length), sk = DRF.soak[kindOk[o.rig]] || [0, 0, 1e9, 1e9];
    if (!st.length && S2.length) E.push(no('Planen har ingen stasjoner. Legg ut redskap i ruta (Stasjon i kartplotteren).', 'The plan has no stations. Put gear on the route (Station in the plotter).'));
    for (let i = 0; i < st.length; i++){
      const a = st[i], b2 = st[(i + 1) % st.length], gap = ((b2.dep - a.dep) % o.period + o.period) % o.period || o.period;
      rep.soak.push({from:a.dep, to:b2.dep, h:gap});
      if (gap < sk[0]) W.push(no('Ståtiden er bare ' + Math.round(gap) + ' t. Redskapet rekker å fange for lite.', 'The soak is only ' + Math.round(gap) + ' h. The gear gets too little time to catch.'));
      else if (gap > sk[3]) W.push(no('Ståtiden er ' + Math.round(gap) + ' t. Fangsten forringes og redskapet kan gå tapt.', 'The soak is ' + Math.round(gap) + ' h. The catch spoils and the gear can be lost.'));
    }
  }
  // the crew
  const sk = S.crew.find(c => c.id === o.skipper);
  if (!sk && !S.crew.length) W.push(no('Ingen mannskap er ansatt. Planen går bare når du selv er om bord.', 'No crew is hired. The plan only runs when you are aboard yourself.'));
  else if (!sk) W.push(no('Ingen skipper er valgt. Den første i mannskapet kjører planen.', 'No skipper is chosen. The first of the crew runs the plan.'));
  if (o.rig === 'garn' && S.crew.length < 1) W.push(no('Garn krever to om bord.', 'Nets need two aboard.'));
  if (o.crewMode === 'watch'){
    const R = driftRoles(o), need = Math.ceil(S.crew.length / 2);
    if (S.crew.length < driftNeedHands) E.push(no('Døgndrift 2 og 2 krever fire mann: skipper, styrmann og to på dekk. Du har ' + S.crew.length + '.', 'Round-the-clock 2 and 2 needs four hands: a skipper, a mate and two on deck. You have ' + S.crew.length + '.'));
    else if (!(R.mate)) E.push(no('Velg en styrmann.', 'Choose a mate.'));
    if ((VESSELS[S.boat.type].berths || 0) < need) E.push(no('Vaktene trenger køyer til dem som har fri (' + need + '). Båten har ' + (VESSELS[S.boat.type].berths || 0) + '.', 'The watch off needs bunks (' + need + '). The boat has ' + (VESSELS[S.boat.type].berths || 0) + '.'));
    rep.watch = {on:o.watchH || 6, rest:o.period / 2};
  } else if (S.crew.length >= 2 && rep.work > 14 && !(VESSELS[S.boat.type].berths > 0)) W.push(no('Mannskapet jobber lange dager uten køyer. Hvilen blir dårlig.', 'The crew works long days without bunks. The rest will be poor.'));
  if (S.crew.length && o.sess.some(s => s.type === 'hvile') && o.sess.filter(s => s.type === 'hvile').every(s => { const p = portById(s.at); return p && !p.rorbu; }) && !(VESSELS[S.boat.type].berths > 0)) W.push(no('Båten har ingen køyer, og hvilestedet er en vanlig kai. Mannskapet hviler best på en rorbu.', 'The boat has no bunks, and the place of rest is an ordinary quay. The crew rests best at a rorbu.'));
  if (typeof restRuleOn === 'function' && restRuleOn() && o.crewMode !== 'watch' && rep.restMin > 0 && rep.restTotal < 10) W.push(no('Mannskapet får under 10 timer hvile i døgnet. Hviletidskravet brytes.', 'The crew get under 10 hours of rest a day. The rest rule is broken.'));
  if (rep.work > o.period * 0.75) W.push(no('Over tre fjerdedeler av døgnet er arbeid. Mannskapet blir fort slitne.', 'Over three quarters of the day is work. The crew tire fast.'));
  // the weather limits against what the boat can take
  if (o.wx.hs > BOAT.risk[1] * 0.95) W.push(no('Grensen for sjø er over det båten tåler (' + fmt(BOAT.risk[1], 1) + ' m).', 'The sea limit is above what the boat can take (' + fmt(BOAT.risk[1], 1) + ' m).'));
  if (!o.wx.shelter) W.push(no('Båten snur ikke selv når været blir for dårlig.', 'The boat does not turn back by itself when the weather gets too bad.'));
  rep.errors = E; rep.warnings = W; rep.ok = !E.length; rep.sorted = S2;
  return rep;
}
const driftClock = h => { const x = ((h % 24) + 24) % 24, hh = Math.floor(x), mm = Math.round((x - hh) * 60); return String(mm === 60 ? (hh + 1) % 24 : hh).padStart(2, '0') + ':' + String(mm === 60 ? 0 : mm).padStart(2, '0') + (h >= 24 ? ' +' + Math.floor(h / 24) + 'd' : ''); };

// ---- the dry run: the plan hour by hour, as the engine will run it, without moving the boat
function driftPreview(o){
  const C = driftCheck(o), out = [];
  for (const s of C.sorted){
    if (s.type === 'hvile'){ const nm = (portById(s.at === 'anker' ? s.near : s.at) || {name:'?'}).name; out.push({t:s.dep, no:s.at === 'anker' ? 'Hvile til ankers nær ' + nm : 'Hvile i ' + nm, en:s.at === 'anker' ? 'Rest at anchor near ' + nm : 'Rest in ' + nm, kind:'rest'}); continue; }
    const r = s.route, h = driftSessHours(o, s); if (!r) continue;
    out.push({t:s.dep, no:'Kast loss fra ' + (portById(r.home) || {name:'?'}).name, en:'Cast off from ' + (portById(r.home) || {name:'?'}).name, kind:'dep'});
    for (const w of r.wps) if (w.act && w.act.kind) out.push({t:s.dep + 0.5, no:GEAR[w.act.kind].no + ' (stasjon)', en:GEAR[w.act.kind].en + ' (station)', kind:'st'});
    out.push({t:s.dep + h, no:'Levering i ' + (portById(r.end) || {name:'?'}).name, en:'Landing in ' + (portById(r.end) || {name:'?'}).name, kind:'land'});
  }
  return {events:out.sort((a, b) => a.t - b.t), check:C};
}

// ---- the crew: roles and the watch. Day work has everyone on deck at once. Round the clock («døgndrift 2 og 2») needs four hands: a
// skipper, a mate and two on deck; the skipper and one deckhand stand one watch, the mate and the other the other, `watchH` hours each.
// The watch off is asleep in the bunks (not on deck, not in the lists; c.sleepW), rests, and shares the catch as the rest.
const driftNeedHands = 4;
function driftRoles(o){
  const sk = S.crew.find(c => c.id === o.skipper) || S.crew[0] || null, mate = S.crew.find(c => c.id === o.mate && c !== sk) || S.crew.find(c => c !== sk) || null, deck = S.crew.filter(c => c !== sk && c !== mate);
  const A = [sk, deck[0]].filter(Boolean).concat(deck.slice(2).filter((c, i) => i % 2 === 0)), Bw = [mate, deck[1]].filter(Boolean).concat(deck.slice(2).filter((c, i) => i % 2 === 1));
  return {sk, mate, deck, A, B:Bw};
}
const driftWatchActive = o => !!o && o.v === 2 && o.crewMode === 'watch' && S.crew.length >= driftNeedHands && !!S.plan && !!S.plan.ops && S.boat.status !== 'port';
function driftWatch(H){
  const o = S.ops;
  if (!driftWatchActive(o)){ for (const c of S.crew) if (c.sleepW) delete c.sleepW; return; }
  const R = driftRoles(o), aOn = Math.floor(driftHod(H) / (o.watchH || 6)) % 2 === 0, off = aOn ? R.B : R.A;
  for (const c of S.crew){ if (off.includes(c)) c.sleepW = true; else delete c.sleepW; }
}

// ---- the weather the plan allows, while it runs
function driftWx(){ const o = S.ops; if (!o || o.v !== 2 || !S.plan || !S.plan.ops) return null; return {wind:o.wx.wind, hs:Math.min(o.wx.hs, BOAT.risk[1] * 0.95), shelter:!!o.wx.shelter}; }
function driftWxAhead(o, H, dur){ let w = 0, h = 0; for (let k = 0; k <= Math.ceil(dur); k++){ w = Math.max(w, windAt(H + k)); h = Math.max(h, hsOpen(H + k)); }
  return {w, h, ok:w <= o.wx.wind && h <= Math.min(o.wx.hs, BOAT.risk[1] * 0.95)}; }

// ---- the engine
const driftDue = o => o.a0 + o.cn * o.period + o.sess[o.idx].dep;
function driftDayOn(o){ if (o.period !== 24) return true; const wd = (gDate(o.a0 + o.cn * 24 + 12).getUTCDay() + 6) % 7; return !!o.days[wd]; }
function driftSync(o, H){
  if (o.a0 == null){ o.a0 = H - driftHod(H); o.cn = 0; o.idx = 0; }
  if (o.idx >= o.sess.length) o.idx = 0;
  for (let g = 0; g < 400; g++){
    const due = driftDue(o);
    if (o.idx === 0){ if (!driftDayOn(o) || due < H - DRF.window){ o.cn++; continue; } break; }
    if (due < H - DRF.late && !o.sess[o.idx].asap){ o.skipped++; o.idx = (o.idx + 1) % o.sess.length; if (!o.idx) o.cn++; continue; }
    break;
  }
}
// the session is begun: the next one is the one after it
function driftAdvance(o){ o.idx = (o.idx + 1) % o.sess.length; if (!o.idx) o.cn++; }
let OPS_PRE = null;   // the way from where she lies to the session's start, while it is found (not saved)
function driftFail(o, sk, no, en){
  o.fails++; o.hold = S.t / 60 + 2; msg(sk ? sk.name : gL('Driftsplan', 'Operations plan'), no, en);
  if (o.fails >= DRF.failMax){ o.on = false; o.paused = {t:S.t, no, en}; msg(gL('Driftsplan', 'Operations plan'), 'Driftsplanen er satt på pause etter ' + o.fails + ' mislykkede forsøk. Siste årsak: ' + no, 'The plan is paused after ' + o.fails + ' failed attempts. Last reason: ' + en); }
}
function opsStep(H){
  const o = driftOps(), b = S.boat; if (!o || !o.on || !o.sess.length) return;
  const atAnchor = b.status === 'idle' && !!b.anch;
  if ((b.status !== 'port' && !atAnchor) || (b.status === 'port' && portBusy(b)) || S.plan || b.land || b.shift) return;
  // the catch waits at a closed plant: it is landed when the plant opens (vesselStep), before anything else (feedback #57)
  if (b.status === 'port' && b.landWait && b.port === b.landWait) return;
  if (o.hold && H < o.hold) return;
  // the rest at the base (a plan from the plan maker, 06f-plan.js): it is counted from when the boat lies there, and the first trip of a
  // day waits until it has lasted PLANW.rest hours, so the crew's rest is always had in one stretch
  if (o.wiz && o.restWant && b.status === 'port' && b.port === o.wiz.base){ o.restT0 = S.t; o.restWant = false; }
  driftSync(o, H);
  const s = o.sess[o.idx], sk = opsSkipper() || S.crew[0] || null;
  // a session that follows straight on from the last (asap) goes when the boat is free, not at a clock
  if (H < driftDue(o) && !(s.asap && o.idx > 0)) return;
  // the crew have had the night's rest at the quay of a closed plant (opsLanded): the rest at the base is left out, and the first trip
  // waits out the rest from when they came in, and goes from where she lies
  if (s.type === 'hvile' && o.wiz && o.quayRest){ o.quayRest = null; driftAdvance(o); return; }
  if (o.wiz && o.idx === 0 && !o.restWant && o.restT0 != null && S.t < o.restT0 + PLANW.rest * 60){
    if ((o.restTold || -1e9) < o.restT0){ o.restTold = S.t; msg(sk ? sk.name : gL('Driftsplan', 'Operations plan'), 'Mannskapet hviler til kl. ' + driftClock(driftHod((o.restT0 + PLANW.rest * 60) / 60)) + ' før neste tur.', 'The crew rest until ' + driftClock(driftHod((o.restT0 + PLANW.rest * 60) / 60)) + ' before the next trip.'); }
    return; }
  if (!sk && !meAboard()){ driftFail(o, null, 'Planen kan ikke gå: ingen mannskap.', 'The plan cannot run: no crew.'); return; }
  if (S.jobs && S.jobs.length){ o.hold = H + 1; if (!o.jobTold || o.jobTold < S.t - 600){ o.jobTold = S.t; msg(sk ? sk.name : '', jobsCrewOnly() ? 'Vi er ikke ferdige med utstyret, så jeg venter.' : 'Verkstedet jobber på båten, så jeg venter.', jobsCrewOnly() ? 'We are not done with the gear, so I wait.' : 'The yard is working on the boat, so I wait.'); } return; }
  const anchorRest = s.type === 'hvile' && s.at === 'anker', restPort = s.type === 'hvile' ? (anchorRest ? s.near : s.at) : null;
  const dest = s.type === 'hvile' ? portById(restPort) : portById(s.route.home);
  if (!dest){ driftAdvance(o); return; }
  if (s.type === 'hvile' && (anchorRest ? b.anch : b.port === s.at)){ if (o.wiz){ o.restT0 = S.t; o.restWant = false; } driftAdvance(o); return; }
  // the weather over the session
  const dur = Math.max(1, driftSessHours(o, s)), wx = driftWxAhead(o, H, dur);
  // a plan from the plan maker: when the weather keeps her from going to the base to rest, she rests where she lies (hours at the quay are
  // rest by the rule, 14-crewlife.js restHour), and the next day waits out the rest as usual
  if (!wx.ok && s.type === 'hvile' && o.wiz && b.status === 'port'){ o.restT0 = S.t; o.restWant = false; driftAdvance(o); log((sk ? sk.name : gL('Båten', 'The boat')) + ' blir liggende i ' + (portById(b.port) || {name:'havna'}).name + ' og hviler. Været er for dårlig til å gå til ' + dest.name + '.', (sk ? sk.name : 'The boat') + ' stays in ' + (portById(b.port) || {name:'the harbour'}).name + ' to rest. The weather is too bad to go to ' + dest.name + '.'); return; }
  if (!wx.ok){ o.delay = (o.delay || 0) + 1; o.hold = H + 1;
    if (o.delay > DRF.maxDelay){ o.delay = 0; o.skipped++; driftAdvance(o); msg(sk ? sk.name : '', 'Hopper over turen. Været holdt seg over grensene i ' + DRF.maxDelay + ' timer.', 'Skipping the trip. The weather stayed over the limits for ' + DRF.maxDelay + ' hours.'); }
    else if (o.delay === 1) msg(sk ? sk.name : '', 'Blir på land. Varselet gir ' + fmt(wx.w, 0) + ' m/s og ' + fmt(wx.h, 1) + ' m sjø, over grensene (' + o.wx.wind + ' m/s, ' + fmt(o.wx.hs, 1) + ' m).', 'Staying ashore. The forecast gives ' + fmt(wx.w, 0) + ' m/s and ' + fmt(wx.h, 1) + ' m sea, over the limits (' + o.wx.wind + ' m/s, ' + fmt(o.wx.hs, 1) + ' m).');
    return; }
  o.delay = 0;
  // the way from where she lies to where the session starts (or, for a rest, to the place of rest: the quay, or the anchorage if the
  // weather over the rest is what the boat's own limits hold there; else she goes to the quay)
  const tgtPt = s.type === 'hvile' ? dest.p : s.route.wps[0], fromName = b.port ? portById(b.port).name : gL('sjøen', 'sea');
  let pre = [], anchored = false, fellBack = false;
  if (s.type === 'hvile' || b.port !== s.route.home){
    const key = o.cn + ':' + o.idx + ':' + (b.port || 'sea');
    if (!OPS_PRE || OPS_PRE.key !== key){
      const P = OPS_PRE = {key, wps:null, anchored:false, fellBack:false}, from = {x:b.pos.x, y:b.pos.y}, fromPort = b.port, rest = anchorRest ? driftRestHours(o, s) : 0;
      (async () => {
        let first, toPort = null, spot = null, want = false;
        if (s.type === 'hvile'){
          if (anchorRest){ try { await mapNeed(dest.p, 14); } catch (e){}
            spot = s.pos && anchorSpot(s.pos).ok ? s.pos : driftAnchorage(s.near);
            if (spot){ const sp = anchorSpot(spot); want = sp.ok && anchorForecast(spot, H, rest, sp) <= ANCH.hold && driftWxAhead(o, H, rest).ok; } }
          first = want ? {x:spot.x, y:spot.y} : {x:dest.p.x, y:dest.p.y}; toPort = want ? null : restPort;
        } else { first = {x:tgtPt.x, y:tgtPt.y}; toPort = tgtPt.port || null; }
        const r = await leiaRoute(from, first, fromPort, toPort);
        P.anchored = want; P.fellBack = anchorRest && !want;
        P.wps = r && r.wps && !r.why ? r.wps.map((q, i, l) => i === l.length - 1 && s.type === 'hvile' ? (want ? {x:q.x, y:q.y, port:null, fish:0, anchor:true} : {x:dest.p.x, y:dest.p.y, port:restPort, fish:0}) : {x:q.x, y:q.y, port:null, fish:0, leia:true}) : false;
      })().catch(() => { P.wps = false; });
      return;
    }
    if (OPS_PRE.wps === null) return;
    if (OPS_PRE.wps === false){ OPS_PRE = null; driftFail(o, sk, 'Fant ingen vei fra ' + fromName + ' til ' + (s.type === 'hvile' ? 'hvilestedet' : 'turens start') + '.', 'Found no way from ' + fromName + ' to ' + (s.type === 'hvile' ? 'the place of rest' : 'the start of the trip') + '.'); return; }
    anchored = OPS_PRE.anchored; fellBack = OPS_PRE.fellBack;
    pre = s.type === 'hvile' ? OPS_PRE.wps : OPS_PRE.wps.slice(0, -1);
  }
  OPS_PRE = null;
  if (s.type !== 'hvile'){
    // the rig the plan fishes with, and what that rig needs
    if (b.rig !== o.rig){ const why = rigSet(o.rig); if (why){ driftFail(o, sk, 'Kan ikke rigge om til ' + driftRigName(o.rig).toLowerCase() + ': ' + why[0], 'Cannot re-rig for ' + driftRigName(o.rig).toLowerCase() + ': ' + why[0]); return; } }
    const miss = opsGearNeeds({wps:s.route.wps}); if (miss){ driftFail(o, sk, 'Går ikke ut på planen: ' + miss.join(', ') + '.', 'Not running the plan: ' + miss.join(', ') + '.'); return; }
    autoRestock();
  }
  const me = meAboard();
  if (s.type !== 'hvile' && !me && !S.lic && b.kgear && !kveiteClosed(H)) S.target = 'kveite';
  const wps = s.type === 'hvile' ? pre : pre.concat(s.route.wps.map(w => ({...w})));
  if (!wps.length){ driftAdvance(o); return; }
  S.plan = {wps, idx:0, speed:s.type === 'hvile' ? S.draftSpeed : s.route.speed, returning:false, depAt:null, ops:true, unsafe:[], noJig:!!(o.wiz && PLAN_KIND[o.wiz.gear] && !o.wiz.jig)};
  if (s.type === 'hvile' && o.wiz) o.restWant = true;
  o.cur = {sid:s.id, type:s.type, t0:S.t, at:o.sess.indexOf(s)}; o.fails = 0; o.paused = null; driftAdvance(o);
  if (s.type === 'hvile') log((sk ? sk.name : gL('Båten', 'The boat')) + (anchored ? ' går ut og ligger til ankers nær ' + dest.name + ' for å hvile.' : fellBack ? ' går til kai i ' + dest.name + ' for å hvile. Været er for hardt til å ligge til ankers.' : ' går til ' + dest.name + ' for å hvile.'), (sk ? sk.name : 'The boat') + (anchored ? ' goes out and anchors near ' + dest.name + ' to rest.' : fellBack ? ' goes to the quay in ' + dest.name + ' to rest. The weather is too hard to lie at anchor.' : ' goes to ' + dest.name + ' to rest.'));
  else if (me) log('Gikk ut på driftsplanen med deg som høvedsmann. ' + (sk ? sk.name + ' er mannskap på turen.' : ''), 'Went out on the plan with you as master. ' + (sk ? sk.name + ' is crew on this trip.' : ''));
  else log(sk.name + ' gikk ut på driftsplanen.', sk.name + ' went out on the plan.');
  depart();
}
function opsLanded(pid){
  const o = driftOps(); if (!o) return;
  // the plant is closed: the boat waits at the quay until it opens (vesselStep asks again)
  const pt = portById(pid); if (pt && pt.mottak && holdTotal() >= 0.5 && !mottakOpen(S.t / 60)){
    if (S.boat.landWait !== pid){
      // a plan from the plan maker whose day is done: the crew take the night's rest here at the quay (feedback #57)
      const nx = o.sess[o.idx], night = o.wiz && nx && nx.type === 'hvile';
      if (night){ o.restT0 = S.t; o.restWant = false; o.quayRest = S.t; }
      log('Mottaket i ' + pt.name + ' er stengt. ' + (night ? 'Mannskapet hviler ved kaia og leverer' : 'Båten venter til det åpner') + ' ' + mottakWhen(S.t / 60, true) + '.', 'The plant in ' + pt.name + ' is closed. ' + (night ? 'The crew rest at the quay and land' : 'The boat waits until it opens') + ' ' + mottakWhen(S.t / 60, false) + '.');
    }
    S.boat.landWait = pid; return; }
  S.boat.landWait = null;
  opsGearAfter();
  // the catch goes up with the crane; the report comes with the landing note
  if (startLanding(true)) return;
  opsReport(pid, holdTotal(), 0, false);
}
// the bunker and ice at the plant, as the plan says (the plan's own stock options; no plan, as before: all of it)
function driftStock(){ const o = S.ops; return o && o.v === 2 && o.stock ? o.stock : {ice:true, fuel:true, gear:true, bait:true}; }
function opsReport(pid, kg, total, landed){
  const o = driftOps(), sk = opsSkipper() || S.crew[0] || null, port = portById(pid);
  autoRestock();
  const extra = S.tripOwner ? 0 : Math.round(Math.max(0, total) * 0.05); if (extra > 0){ S.cash -= extra; S.stats.costs += extra; }
  const what = landed ? [fmt(kg, 0) + ' kg levert i ' + port.name + ', ' + kr(Math.round(total)) + ' etter lott' + (extra ? ', skippertillegg ' + kr(extra) : '') + '.', fmt(kg, 0) + ' kg landed at ' + port.name + ', ' + kr(Math.round(total)) + ' after shares' + (extra ? ', skipper bonus ' + kr(extra) : '') + '.']
    : kg > 0.5 ? [fmt(kg, 0) + ' kg om bord. ' + port.name + ' har ikke fiskemottak.', fmt(kg, 0) + ' kg aboard. ' + port.name + ' has no fish plant.'] : ['ingen fangst å levere.', 'no catch to land.'];
  const b = S.boat, fuelling = b.shift || b.fueling, rest = fuelling ? [' Går bort og fyller drivstoff, så er båten klar.', ' Going over to fill fuel, then the boat is ready.'] : [' Båten er fylt opp og klar.', ' The boat is restocked and ready.'];
  if (o){ const c = o.cur || {}; o.rep.push({t:S.t, sid:c.sid || null, port:pid, kg:Math.round(kg), kr:Math.round(total), hours:c.t0 ? Math.round((S.t - c.t0) / 6) / 10 : null, landed:!!landed}); while (o.rep.length > DRF.repMax) o.rep.shift(); o.cur = null; }
  msg(sk ? sk.name : gL('Driftsplan', 'Operations plan'), 'Driftsrapport: ' + what[0] + rest[0], 'Operations report: ' + what[1] + rest[1]);
}
function opsSkipper(){ const o = S.ops; return o && S.crew.find(c => c.id === o.skipper) || null; }

// ---- templates: the company keeps a few plans by name, for any vessel that can run them
function driftTplSave(name){
  const o = driftOps(); if (!o) return false; S.driftTpl = S.driftTpl || [];
  const copy = JSON.parse(JSON.stringify(o)); for (const k of ['on', 'idx', 'cn', 'a0', 'hold', 'fails', 'paused', 'cur', 'rep', 'skipped', 'delay', 'jobTold']) delete copy[k];
  copy.name = name || o.name; const i = S.driftTpl.findIndex(t => t.name === copy.name); if (i >= 0) S.driftTpl[i] = copy; else S.driftTpl.push(copy);
  while (S.driftTpl.length > DRF.tplMax) S.driftTpl.shift(); return true;
}
function driftTplUse(i){
  const t = (S.driftTpl || [])[i]; if (!t) return false;
  const n = driftNew(JSON.parse(JSON.stringify(t))); n.skipper = (S.crew.find(c => c.id === n.skipper) || S.crew[0] || {}).id || null;
  for (const s of n.sess) s.id = driftSid();
  S.ops = n; return true;
}
