// ===== the Mannskap page in the drawer (once «Arbeid»): the crew at a glance, the boat's work as a flow of stations, each person's
// chain of them, and the standing plan (ui/05-phone.js opsCard) =====
// Tap Endre on a person, then the stations in the order you want them; Auto puts them back on the default chain. Tap the name
// for the person card: skills, fatigue, morale and rest.
const WORK = (() => {
  const L = (no, en) => S.lang === 'no' ? no : en;
  let edit = null, card = null;   // edit: {id, chain} while a chain is being built; card: the person whose card is open
  const SHORT = {ror:['Ror', 'Helm'], fiske:['Fiske', 'Fish'], haling:['Haling', 'Haul'], sort:['Krabbe', 'Crab'], sloy:['Sløying', 'Gut'], is:['Ising', 'Ice'], kokk:['Kokk', 'Cook'], pause:['Pause', 'Break']};
  const sn = k => L(SHORT[k][0], SHORT[k][1]);
  const first = p => p.c ? p.c.name.split(' ')[0] : L('Du', 'You');
  const pid = c => c ? c.id : 'me';
  // the stations this rig works through, in the order the fish goes
  function flowOf(){ const r = rigOf(); return r === 'juksa' ? ['ror', 'fiske', 'sloy', 'is'] : r === 'teiner' ? ['ror', 'haling', 'sort', 'sloy', 'is'] : ['ror', 'haling', 'sloy', 'is']; }
  // what waits at a station: the queue line on its card
  function queue(k){
    const b = S.boat, cg = catchGut(), ci = catchIce(), g = b.gop; let gut = 0, ice = 0;
    for (const x of S.hold){ if (SPECIES[x.sp].live || x.iced) continue; if (cg && !x.gut) gut += x.kg; else if (ci) ice += x.kg; }
    if (k === 'ror') return b.status === 'sailing' ? fmt(b.v || 0, 0) + ' kn' : '–';
    if (k === 'fiske') return b.status === 'fishing' && !g && S.fsess ? fmt(S.fsess.kg, 0) + ' kg' : '–';
    if (k === 'haling' || k === 'sort') return g ? g.done + '/' + g.n : '–';
    if (k === 'sloy') return cg ? fmt(gut, 0) + ' kg' : L('ingen på', 'nobody on it');
    if (k === 'is') return ci ? fmt(ice, 0) + ' kg' : L('ingen på', 'nobody on it');
    if (k === 'kokk'){ const M = mealState(), f = L('mat ', 'food ') + fmt(foodScore(), 1) + '/5'; if (b.status === 'port' || M.due == null) return f; return (S.t >= M.due ? '<b class="r2">' + L('måltid nå', 'meal due') + '</b>' : L('måltid om ', 'meal in ') + dur((M.due - S.t) / 60)) + ' · ' + f; }
    return '';
  }
  function flow(A){
    const who = k => A.filter(p => p.st === k).map(first).join(', ') || '<i>' + L('ingen', 'nobody') + '</i>';
    const cardOf = k => '<div class="wk-st' + (A.some(p => p.st === k) ? ' on' : '') + '"><b>' + sn(k) + '</b><span class="wk-q">' + queue(k) + '</span><span class="wk-who">' + who(k) + '</span></div>';
    return '<div class="wk-flow">' + flowOf().map(cardOf).join('<span class="wk-arr">→</span>') + '</div><div class="wk-flow side">' + ['kokk', 'pause'].map(cardOf).join('') + '</div>';
  }
  const chips = (job, cur) => job.map((k, i) => '<span class="wk-chip' + (k === cur ? ' on' : '') + '"><em>' + (i + 1) + '</em>' + sn(k) + '</span>').join('');
  const bar = (v, m, col) => '<div class="qbar"><i style="width:' + clamp(v / m * 100, 0, 100).toFixed(0) + '%;background:' + col + '"></i></div>';
  function personCard(c){
    if (!c) return '<div class="wk-card"><p class="ph-note">' + L('Du er skipper og står der du trengs mest. Kjeden din bestemmer hva du gjør når båten ikke trenger deg ved roret.', 'You are the skipper and stand where you are needed most. Your chain decides what you do when the boat does not need you at the helm.') + '</p></div>';
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
    if (S.boat.status === 'port') return '';
    const left = restLeft(c); if (left > 6) return '';
    return '<br><span class="' + (left ? 'r1' : 'r2') + '">' + (left ? L('Må hvile innen ' + left + ' t', 'Must rest within ' + left + ' h') : L('Brudd på hviletiden', 'Rest rule broken')) + '</span>';
  }
  function row(p, i){
    const id = pid(p.c), ed = edit && edit.id === id, job = ed ? edit.chain : jobOf(p.c, i), auto = p.c ? !p.c.job : !S.myJob;
    let h = '<div class="ph-card wk-p' + (ed ? ' ed' : '') + '"><div class="wk-top"><button class="wk-name" data-pa="wk-card" data-id="' + id + '">' + (p.c ? p.c.name : L('Du (skipper)', 'You (skipper)')) + '</button><span class="wk-now">' + (p.bl ? L('Bløgger', 'Bleeding') : STATIONS[p.st].ing[S.lang === 'no' ? 0 : 1]) + restLine(p.c) + '</span></div>';
    h += '<div class="wk-chain">' + (job.length ? chips(job, p.st) : '<span class="ph-note">' + L('Trykk stasjonene i den rekkefølgen du vil ha dem.', 'Tap the stations in the order you want them.') + '</span>') + (auto && !ed ? '<span class="wk-auto">Auto</span>' : '') + '</div>';
    if (ed) h += '<div class="wk-pick">' + WORK_ST.map(k => '<button class="' + (job.includes(k) ? 'on' : '') + '" data-pa="wk-add" data-k="' + k + '">' + (job.includes(k) ? (job.indexOf(k) + 1) + ' ' : '') + sn(k) + '</button>').join('') + '</div>' +
      '<div class="ph-btnrow"><button class="ph-btn p" data-pa="wk-done">' + L('Ferdig', 'Done') + '</button><button class="ph-btn" data-pa="wk-auto">Auto</button></div>';
    else h += '<button class="ph-btn wk-edit" data-pa="wk-edit" data-id="' + id + '">' + L('Endre', 'Change') + '</button>';
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
    const rows = S.crew.map(c => { const d = restLog(c).slice(-24).reduce((a, v) => a + v, 0);
      return '<div class="ph-kv"><span><b>' + c.name.split(' ')[0] + '</b></span><span>' + st(c) + '<br>' + L('Slitenhet ', 'Fatigue ') + Math.round(c.fatigue) + ' · ' + L('trivsel ', 'morale ') + Math.round(c.morale) + ' · ' + L('hvilt ', 'rested ') + d + L(' t siste døgn', ' h in the last day') + restLine(c) + '</span></div>'; }).join('');
    return '<div class="ph-card"><h4>' + L('Mannskapet', 'The crew') + '</h4>' + me + rows + (S.crew.length ? '<p class="ph-note">' + L('Den som er mønstret på, følger båten dit den ligger, og hviler i rorbua når båten ligger der.', 'Those signed on follow the boat wherever she lies, and rest in the rorbu when she lies there.') + '</p>' : '<p class="ph-note">' + L('Ingen mannskap ennå. Finn folk under Bygd, Ansatte.', 'No crew yet. Find people under Village, Employees.') + '</p>') + '</div>';
  }
  function page(){
    const team = crewAboard(), A = workAssign(), h = ['<div class="ph-c wk">', overview()];
    if (!team.length) return h.join('') + '</div>';
    h.push(flow(A));
    h.push('<div class="wk-pre">' + Object.keys(JOB_PRESETS).map(k => '<button class="ph-btn" data-pa="wk-pre" data-k="' + k + '">' + JOB_PRESETS[k][S.lang] + '</button>').join('') + '</div>');
    const ix = new Map(team.map((c, i) => [c.id, i]));
    if (meAboard() && asleep()) h.push('<div class="ph-card wk-p"><div class="wk-top"><b>' + L('Du (skipper)', 'You (skipper)') + '</b><span class="wk-now r2">' + L('Sover', 'Asleep') + '</span></div></div>');
    for (const p of A) h.push(row(p, p.c ? ix.get(p.c.id) : 0));
    h.push('<p class="ph-note">' + L('Hver person går til den første stasjonen i kjeden som har arbeid. Uten arbeid tar de pause. Roret og halingen står aldri tomme: da tar en som har pause over.', 'Each person goes to the first station in their chain that has work. With none, they take a break. The helm and the hauling are never left empty: someone on a break takes over.') + '</p>');
    return h.join('') + '</div>';
  }
  const who = id => id === 'me' ? null : crewById(id);
  function act(a, d){
    if (a === 'wk-card'){ card = card === d.id ? null : d.id; return true; }
    if (a === 'wk-edit'){ edit = {id:d.id, chain:[]}; return true; }
    if (a === 'wk-add' && edit){ const i = edit.chain.indexOf(d.k); if (i >= 0) edit.chain.splice(i, 1); else edit.chain.push(d.k); return true; }
    if (a === 'wk-done' && edit){ const c = who(edit.id), ch = edit.chain.length ? edit.chain.slice() : null; if (c) c.job = ch; else if (edit.id === 'me') S.myJob = ch; edit = null; return true; }
    if (a === 'wk-auto' && edit){ const c = who(edit.id); if (c) c.job = null; else S.myJob = null; edit = null; return true; }
    if (a === 'wk-pre'){ jobPreset(d.k); edit = null; toast(JOB_PRESETS[d.k][S.lang]); return true; }
    return false;
  }
  return {page, act};
})();
// a line from the crew shows as a toast when you are aboard
hooks.onSay = (c, no, en) => { if (typeof toast === 'function') toast(c.name.split(' ')[0] + ': «' + (S.lang === 'no' ? no : en) + '»'); };
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
hooks.onEnergy = k => { if (typeof toast !== 'function') return; const L = (no, en) => S.lang === 'no' ? no : en;
  if (k === 'warn') toast(bunks(S.boat) ? L('Du er sliten (25 %). Arbeidet ditt går tregere. Gå til kai for å hvile.', 'You are tired (25 %). Your work goes slower. Go to the quay to rest.') : L('Du er sliten (25 %). Arbeidet ditt går tregere. Seil til naustet eller en rorbu for å hvile.', 'You are tired (25 %). Your work goes slower. Sail to your boathouse or a rorbu to rest.'));
  if (k === 'ack') toast(L('Du er våken, men trøtt og døsig. Du kan døse av igjen til du har hvilt deg ut.', 'You are awake, but tired and drowsy. You may doze off again until you have had a proper rest.'));
  if (k === 'wake') toast(L('Du våknet. Energi ' + Math.round(S.energy) + ' %.', 'You woke up. Energy ' + Math.round(S.energy) + ' %.')); };
