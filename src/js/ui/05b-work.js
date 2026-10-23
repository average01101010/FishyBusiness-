// ===== the Mannskap page in the drawer (once «Arbeid»): the crew at a glance, the boat's work as a flow of stations with who is at each,
// and each person with what they do and why. The crew share the work themselves (core/13-work.js workAssign); you choose the mate.
// Tap the name for the person card: skills, fatigue, morale and rest. =====
const WORK = (() => {
  const L = (no, en) => S.lang === 'no' ? no : en;
  let card = null;   // the person whose card is open
  const SHORT = {ror:['Ror', 'Helm'], fiske:['Fiske', 'Fish'], haling:['Haling', 'Haul'], blogg:['Bløgging', 'Bleed'], sort:['Krabbe', 'Crab'], sloy:['Sløying', 'Gut'], is:['Ising', 'Ice'], kokk:['Kokk', 'Cook'],
    egn:['Egning', 'Bait'], strip:['Rensing', 'Strip'], mend:['Bøting', 'Mend'], stell:['Vedlikehold', 'Upkeep'], last:['Last', 'Cargo'], pause:['Pause', 'Break']};
  const sn = k => L(SHORT[k][0], SHORT[k][1]);
  const first = p => p.c ? p.c.name.split(' ')[0] : L('Du', 'You');
  const pid = c => c ? c.id : 'me';
  // the stations this rig works through, in the order the fish goes
  function flowOf(){ const r = rigOf(); return r === 'juksa' ? ['ror', 'fiske', 'sloy', 'is'] : r === 'teiner' ? ['ror', 'haling', 'sort', 'sloy', 'is'] : ['ror', 'haling', 'blogg', 'sloy', 'is']; }
  // the crew's own jobs on the gear now (core/13-work.js JOB_ST): their stations beside the flow, with how far each has come
  const jobSt = () => [...new Set((S.jobs || []).filter(j => crewJob(j) && JOB_ST[j.kind]).map(j => JOB_ST[j.kind]))];
  // what waits at a station: the queue line on its card
  function queue(k){
    const b = S.boat, cg = catchGut(), ci = catchIce(), g = b.gop; let gut = 0, ice = 0;
    for (const x of S.hold){ if (SPECIES[x.sp].live || x.iced) continue; if (cg && !x.gut) gut += x.kg; else if (ci) ice += x.kg; }
    if (k === 'ror') return b.status === 'sailing' ? fmt(b.v || 0, 0) + ' kn' : '–';
    if (k === 'fiske') return b.status === 'fishing' && !g && S.fsess ? fmt(S.fsess.kg, 0) + ' kg' : '–';
    if (k === 'haling' || k === 'sort') return g ? g.done + '/' + g.n : '–';
    if (k === 'blogg') return g && g.op === 'haul' ? L('når fisken kommer', 'as the fish come') : '–';
    if (Object.values(JOB_ST).includes(k)){ const J = (S.jobs || []).filter(j => crewJob(j) && JOB_ST[j.kind] === k); return J.length ? J.map(j => Math.round(jobDone(j) * 100) + ' %' + (j.until != null ? ' · ' + L('ferdig ', 'done ') + hm(j.until / 60) : '')).join(', ') : '–'; }
    if (k === 'sloy') return cg ? fmt(gut, 0) + ' kg' : L('ingen på', 'nobody on it');
    if (k === 'is') return ci ? fmt(ice, 0) + ' kg' : L('ingen på', 'nobody on it');
    if (k === 'kokk'){ const M = mealState(), f = L('mat ', 'food ') + fmt(foodScore(), 1) + '/5'; if (b.status === 'port' || M.due == null) return f; return (S.t >= M.due ? '<b class="r2">' + L('måltid nå', 'meal due') + '</b>' : L('måltid om ', 'meal in ') + dur((M.due - S.t) / 60)) + ' · ' + f; }
    return '';
  }
  function flow(A){
    const who = k => A.filter(p => p.st === k).map(first).join(', ') || '<i>' + L('ingen', 'nobody') + '</i>';
    const cardOf = k => '<div class="wk-st' + (A.some(p => p.st === k) ? ' on' : '') + '"><b>' + sn(k) + '</b><span class="wk-q">' + queue(k) + '</span><span class="wk-who">' + who(k) + '</span></div>';
    return '<div class="wk-flow">' + flowOf().map(cardOf).join('<span class="wk-arr">→</span>') + '</div><div class="wk-flow side">' + jobSt().concat(['kokk', 'pause']).map(cardOf).join('') + '</div>';
  }
  const bar = (v, m, col) => '<div class="qbar"><i style="width:' + clamp(v / m * 100, 0, 100).toFixed(0) + '%;background:' + col + '"></i></div>';
  function personCard(c){
    if (!c) return '<div class="wk-card"><p class="ph-note">' + L('Du er skipper: til rors når båten går, ellers på dekk der du trengs mest.', 'You are the skipper: at the helm while the boat is under way, otherwise on deck where you are needed most.') + '</p></div>';
    const g = c.gear, A = c.attr, sk = [['juksa', 'Juksa', 'Jig', g.juksa], ['line', 'Line', 'Line', g.line], ['garn', 'Garn', 'Nets', g.garn], ['teiner', 'Teiner', 'Pots', g.teiner], ['sloy', 'Sløying', 'Gutting', g.sloy], ['is', 'Ising', 'Icing', g.is], ['sort', 'Krabbesortering', 'Crab sorting', g.sort], ['kokk', 'Matlaging', 'Cooking', A.kokk], ['sjo', 'Sjømannskap', 'Seamanship', A.sjo], ['styrke', 'Styrke', 'Strength', A.styrke]];
    return '<div class="wk-card"><div class="wk-sk">' + sk.map(([k, no, en, v]) => '<span>' + L(no, en) + '</span><span class="wk-v">' + fmt(v || 1, 1) + '</span>' + bar(v || 1, 5, '#2f7fc1')).join('') + '</div>' +
      '<div class="wk-sk">' + '<span>' + L('Slitenhet', 'Fatigue') + '</span><span class="wk-v">' + Math.round(c.fatigue) + '</span>' + bar(c.fatigue, 100, c.fatigue > 70 ? '#e5484d' : c.fatigue > 45 ? '#f2b705' : '#35b37e') +
      '<span>' + L('Trivsel', 'Morale') + '</span><span class="wk-v">' + Math.round(c.morale) + '</span>' + bar(c.morale, 100, c.morale >= 65 ? '#35b37e' : c.morale >= 40 ? '#f2b705' : '#e5484d') + '</div>' +
      '<p class="ph-note">' + c.age + L(' år · ', ' years · ') + c.traits.filter((t, i) => c.known[i]).map(t => TRAITS[t][S.lang]).join(', ') + ' · ' + L('lærer ', 'learns ') + (ageLearn(c.age) * moraleLearn(c.morale) * (c.traits.includes('laerevillig') ? 2 : 1) >= 1.5 ? L('fort', 'fast') : ageLearn(c.age) * moraleLearn(c.morale) < 0.6 ? L('sakte', 'slowly') : L('jevnt', 'steadily')) + '</p>' +
      ((c.said || []).length ? '<div class="wk-said">' + c.said.slice(-3).reverse().map(x => '<p>«' + x[S.lang] + '» <span class="ph-note">' + hm(x.t / 60) + '</span></p>').join('') + '</div>' : '') + '</div>';
  }
  // how long until the rest rule is broken, at sea (you as skipper are not under it)
  function restLine(c){
    if (!c){ const e = S.energy == null ? 100 : S.energy; return '<br><span class="' + (e < ENERGY.dim ? 'r2' : e < ENERGY.warn ? 'r1' : '') + '">' + L('Energi ', 'Energy ') + Math.round(e) + ' %</span>'; }
    return '';
  }
  function row(p){
    const id = pid(p.c), role = p.c && crewRole(p.c), why = workWhyText(p);
    // how they are working just now, in words (core/04-crew.js crewEffort: fatigue, mood, hunger, the sea, samhold, …)
    const ef = p.c && p.st !== 'pause' ? crewEffort(p.c) : null;
    let h = '<div class="ph-card wk-p"><div class="wk-top"><button class="wk-name" data-pa="wk-card" data-id="' + id + '">' + (p.c ? p.c.name : L('Du (skipper)', 'You (skipper)')) + '</button><span class="wk-now">' + workDoing(p) + restLine(p.c) + (ef ? '<br><span class="wk-eff e' + ef.lvl + '">' + ef.text + '</span>' : '') + '</span></div>';
    h += '<div class="wk-chain"><span class="ph-note">' + (why ? why.charAt(0).toUpperCase() + why.slice(1) : '') + (role && p.c ? ' · ' + L('fast på ', 'regular at ') + sn(role).toLowerCase() : '') + '</span>' + (p.c && p.c.mate ? '<span class="wk-auto">' + L('Styrmann', 'Mate') + '</span>' : '') + '</div>';
    if (p.c && !p.c.mate) h += '<button class="ph-btn wk-edit" data-pa="wk-mate" data-id="' + id + '">' + L('Gjør til styrmann', 'Make mate') + '</button>';
    if (card === id) h += personCard(p.c);
    return h + '</div>';
  }
  // everyone at a glance (tilbakemelding #11: «en total oversikt over alt som har med mannskap og arbeidsoppgaver å gjøre»): signed on
  // the boat and where, or off; fatigue, the rest in the last day and how long until the rest rule is broken
  function overview(){
    const b = S.boat, at = b.status === 'port', rb = at && typeof isRorbu === 'function' && isRorbu(b.port), shore = meAboard() && typeof resting === 'function' && resting();
    const on = new Set(crewAboard().map(c => c.id)), bn = S.boatName ? '«' + S.boatName + '»' : L('båten', 'the boat'), lie = rb ? L('rorbua', 'the rorbu') : L('naustet', 'the boathouse');
    const where = at ? (shore || rb ? L(' · hviler i ', ' · resting in ') + lie : L(' · ved kai', ' · at the quay')) : L(' · til sjøs', ' · at sea');
    const st = c => c.off ? L('Fri denne turen', 'Off this trip') : !on.has(c.id) ? L('Fri i dag (biyrke)', 'Off today (part-time)') : L('Mønstret på ', 'Signed on ') + bn + where;
    const me = meAboard() ? '<div class="ph-kv"><span><b>' + L('Du (skipper)', 'You (skipper)') + '</b></span><span>' + (shore ? L('Hviler i ', 'Resting in ') + lie : at ? L('Om bord, ved kai', 'Aboard, at the quay') : L('Om bord', 'Aboard')) + restLine(null) + '</span></div>' : '<div class="ph-kv"><span><b>' + L('Du', 'You') + '</b></span><span>' + L('Ikke om bord', 'Not aboard') + '</span></div>';
    const rows = S.crew.map(c => {
      return '<div class="ph-kv"><span><b>' + c.name.split(' ')[0] + '</b></span><span>' + st(c) + '<br>' + L('Slitenhet ', 'Fatigue ') + Math.round(c.fatigue) + ' · ' + L('trivsel ', 'morale ') + Math.round(c.morale) + restLine(c) + '</span></div>'; }).join('');
    // samhold in one line (core/04-crew.js teamLine), when there is a crew aboard
    const tl = on.size ? teamLine() : null, team = tl ? '<p class="wk-team t' + tl.lvl + '">' + tl.text + '</p>' : '';
    return '<div class="ph-card"><h4>' + L('Mannskapet', 'The crew') + '</h4>' + team + me + rows + (S.crew.length ? '<p class="ph-note">' + L('Den som er mønstret på, følger båten dit den ligger, og hviler i rorbua når båten ligger der.', 'Those signed on follow the boat wherever she lies, and rest in the rorbu when she lies there.') + '</p>' : '<p class="ph-note">' + L('Ingen mannskap ennå. Finn folk under Bygd, Ansatte.', 'No crew yet. Find people under Village, Employees.') + '</p>') + '</div>';
  }
  function page(){
    const team = crewAboard(), A = workAssign(), h = ['<div class="ph-c wk">', overview()];
    if (!team.length) return h.join('') + '</div>';
    h.push(flow(A));
    if (meAboard() && asleep()) h.push('<div class="ph-card wk-p"><div class="wk-top"><b>' + L('Du (skipper)', 'You (skipper)') + '</b><span class="wk-now r2">' + L('Sover', 'Asleep') + '</span></div></div>');
    for (const p of A) h.push(row(p));
    h.push('<p class="ph-note">' + L('Mannskapet fordeler arbeidet selv, etter hva de kan, hva de er vant med, hvor slitne de er og hva som hoper seg opp. Fisken bløgges, sløyes og ises. Når båten går, står du til rors. Ellers er du på dekk sammen med de andre. Styrmannen tar roret når du sover eller ikke er om bord.', 'The crew share the work themselves, by what they can do, what they are used to, how tired they are and what is piling up. The fish are bled, gutted and iced. While the boat is under way you are at the helm; otherwise you work on deck with the others. The mate takes the helm when you sleep or are not aboard.') + '</p>');
    return h.join('') + '</div>';
  }
  const who = id => id === 'me' ? null : crewById(id);
  function act(a, d){
    if (a === 'wk-card'){ card = card === d.id ? null : d.id; return true; }
    if (a === 'wk-mate'){ setMate(d.id); const c = who(d.id); if (c) toast(L(c.name.split(' ')[0] + ' er styrmann.', c.name.split(' ')[0] + ' is the mate.')); return true; }
    return false;
  }
  return {page, act};
})();
// a line from the crew shows as a toast when you are aboard
hooks.onAnchorAlarm = (kind, n) => { const L = (no, en) => S.lang === 'no' ? no : en; if (typeof SND !== 'undefined' && SND.anchorAlarm) SND.anchorAlarm(); if (typeof G3 !== 'undefined' && G3.anchorAlarm) G3.anchorAlarm(kind);
  if (typeof toast === 'function') toast(kind === 'gale' ? L('ANKERALARM: ankeret slepper i kuling.', 'ANCHOR ALARM: the anchor is dragging in a gale.') : L('ANKERALARM: ankeret slepper (' + n + ').', 'ANCHOR ALARM: the anchor is dragging (' + n + ').')); };
// the bilge (core/16c-hull.js hullMinute): the pump running, the water rising (the alarm every third game minute), the engine room full
hooks.onBilge = (kind, b, left) => { const L = (no, en) => S.lang === 'no' ? no : en, nm = S.fleet && S.fleet.length > 1 ? '«' + S.boatName + '» ' : '';
  if (kind !== 'pump' && typeof SND !== 'undefined' && SND.anchorAlarm) SND.anchorAlarm();
  if (typeof toast === 'function') toast(kind === 'pump' ? L(nm + 'Lensepumpa går. Den holder unna lekkasjen.', nm + 'The bilge pump is running. It keeps up with the leak.') : kind === 'flood' ? L(nm + 'Motorrommet er fullt av vann. Redningsskøyta er ringt etter.', nm + 'The engine room is full of water. The rescue boat is called.') : L('VANN I BÅTEN: ' + nm + 'lensepumpa klarer ikke å holde unna, motorrommet er fullt om ' + left + ' min.', 'WATER IN THE BOAT: ' + nm + 'the bilge pump cannot keep up, the engine room is full in ' + left + ' min.')); };
hooks.onPlantSay = (pid, idx, nm, no, en) => { if (typeof G3 !== 'undefined' && G3.isActive() && G3.sayWorker(pid, idx, nm, no, en)) return; if (typeof toast === 'function') toast(nm + ': «' + (S.lang === 'no' ? no : en) + '»'); };
hooks.onSay = (c, no, en) => { if (typeof G3 !== 'undefined' && G3.isActive() && G3.say(c, no, en)) return; if (typeof toast === 'function') toast(c.name.split(' ')[0] + ': «' + (S.lang === 'no' ? no : en) + '»'); };
// your energy on screen: the edges darken under 15 %, and asleep the screen is black with a countdown in real time
function energyUi(){
  const L = (no, en) => S.lang === 'no' ? no : en, e = S.energy == null ? 100 : S.energy, sl = $('sleep'), vg = $('vign'), zz = asleep();
  vg.style.opacity = zz ? 0 : e < ENERGY.dim ? ((ENERGY.dim - e) / ENERGY.dim * 0.9).toFixed(2) : 0;
  if (zz){
    if (sl.hidden){ sl.hidden = false; requestAnimationFrame(() => sl.classList.add('on')); }
    const al = S.sleep.alarmAt != null, ring = alarmOn();
    $('slHead').textContent = ring ? L('BROVAKTSALARM', 'BRIDGE WATCH ALARM') : al ? L('Du døser av …', 'You are dozing off …') : L('Du sover', 'You are asleep');
    $('slTime').textContent = ring ? L('Trykk ACK for å kvittere', 'Press ACK to acknowledge') : al ? L('Brovaktsalarmen går ', 'The bridge watch alarm goes off ') + inReal(S.sleep.alarmAt - S.t) : L('Du våkner ', 'You wake ') + inReal(S.sleep.until - S.t);
    $('slAck').hidden = !ring; sl.classList.toggle('alarm', ring);
    const canW = S.t - S.sleep.t0 >= WAKE_MIN; $('slSkip').disabled = !canW; $('slSkip').hidden = al;
    $('slSkip').textContent = canW ? L('Våkn opp (energi ' + Math.round(sleepGain()) + ' %)', 'Wake up (energy ' + Math.round(sleepGain()) + ' %)') : L('Du kan vekke deg ', 'You can wake ') + inReal(S.sleep.t0 + WAKE_MIN - S.t);
    $('slNote').textContent = S.sleep.alone ? L('Båten ligger og driver med vinden.', 'The boat is drifting with the wind.') : L('Mannskapet har roret og fortsetter turen.', 'The crew has the helm and carries on with the trip.');
  } else if (!sl.hidden){ sl.classList.remove('on', 'alarm'); sl.hidden = true; }
}
// «ACK»: the alarm is acknowledged and you are awake (15-energy.js alarmAck)
$('slAck').onclick = () => { if (alarmAck()){ save(); panelDirty = true; if (typeof refreshAll === 'function') refreshAll(); } energyUi(); };
// «Våkn opp»: the sleep is broken off with the rest it has given (15-energy.js wakeEarly)
$('slSkip').onclick = () => { if (wakeEarly(false)){ save(); panelDirty = true; if (typeof refreshAll === 'function') refreshAll(); } energyUi(); };
hooks.onTurnBack = (plan, sea, W, hs, limW, limHs) => { if (typeof toast !== 'function') return; const L = (no, en) => S.lang === 'no' ? no : en, f = x => x.toFixed(1).replace('.', S.lang === 'no' ? ',' : '.');
  toast(sea ? L('Sjøen er ' + f(hs) + ' m, over grensen ' + f(limHs) + ' m i driftsplanen. Båten snur mot nærmeste kai.', 'The sea is ' + f(hs) + ' m, over the ' + f(limHs) + ' m limit of the plan. The boat turns to the nearest quay.')
    : plan ? L('Vinden er ' + f(W) + ' m/s, over grensen ' + f(limW) + ' m/s i driftsplanen. Båten snur mot nærmeste kai.', 'The wind is ' + f(W) + ' m/s, over the ' + f(limW) + ' m/s limit of the plan. The boat turns to the nearest quay.')
    : L('Vinden er ' + f(W) + ' m/s, over grensen din på ' + f(limW) + '. Båten snur mot nærmeste kai. Endres under Innstillinger → Snu ved.', 'The wind is ' + f(W) + ' m/s, over your limit of ' + f(limW) + '. The boat turns to the nearest quay. Change it under Settings → Turn back at.')); };
hooks.onEnergy = k => { if (typeof toast !== 'function') return; const L = (no, en) => S.lang === 'no' ? no : en;
  if (k === 'warn') toast(bunks(S.boat) ? L('Du er sliten (25 %). Arbeidet ditt går tregere. Gå til kai for å hvile.', 'You are tired (25 %). Your work goes slower. Go to the quay to rest.') : L('Du er sliten (25 %). Arbeidet ditt går tregere. Seil til naustet eller en rorbu for å hvile.', 'You are tired (25 %). Your work goes slower. Sail to your boathouse or a rorbu to rest.'));
  if (k === 'ack') toast(L('Du er våken, men trøtt og døsig. Du kan døse av igjen til du har hvilt deg ut.', 'You are awake, but tired and drowsy. You may doze off again until you have had a proper rest.'));
  if (k === 'wake') toast(L('Du våknet. Energi ' + Math.round(S.energy) + ' %.', 'You woke up. Energy ' + Math.round(S.energy) + ' %.')); };
