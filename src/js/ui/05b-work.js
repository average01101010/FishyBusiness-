// ===== the Mannskap page in the drawer (once «Arbeid»): the samhold on top, «På dekk nå» as chips of who stands where, and one card per
// person aboard with what they do and why, how they work, energy and mood, the last thing said and the regular place (Jonas 23.10.2026).
// The crew share the work themselves (core/13-work.js workAssign); you choose the mate. Tap the name for skills, traits and more lines. =====
const WORK = (() => {
  const L = (no, en) => S.lang === 'no' ? no : en;
  let card = null;   // the person whose card is open
  const SHORT = {ror:['Ror', 'Helm'], fiske:['Fiske', 'Fish'], haling:['Haling', 'Haul'], blogg:['Bløgging', 'Bleed'], sort:['Krabbe', 'Crab'], sloy:['Sløying', 'Gut'], is:['Ising', 'Ice'], kokk:['Kokk', 'Cook'],
    egn:['Egning', 'Bait'], strip:['Rensing', 'Strip'], mend:['Bøting', 'Mend'], stell:['Vedlikehold', 'Upkeep'], last:['Last', 'Cargo'], pause:['Pause', 'Break']};
  const sn = k => L(SHORT[k][0], SHORT[k][1]);
  // the first name, with the surname's initial when two aboard share it
  const first = p => { if (!p.c) return L('Du', 'You'); const n = p.c.name.split(' '); return S.crew.some(c => c !== p.c && c.name.split(' ')[0] === n[0]) ? n[0] + ' ' + n[n.length - 1][0] + '.' : n[0]; };
  const pid = c => c ? c.id : 'me';
  // the stations the gear being worked (else the rig) goes through, in the order the fish goes
  function flowOf(){ const g = S.boat.gop, r = g && g.kind ? (g.kind === 'teine' ? 'teiner' : g.kind) : rigOf(); return r === 'juksa' ? ['ror', 'fiske', 'sloy', 'is'] : r === 'teiner' ? ['ror', 'haling', 'sort', 'sloy', 'is'] : ['ror', 'haling', 'blogg', 'sloy', 'is']; }
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
  // ---- «På dekk nå» (Jonas 23.10.2026: brikker): who stands where, nothing to tap, and in one line what waits on deck ----
  function deckNow(A){
    const ks = flowOf().concat(jobSt(), ['kokk']).filter((k, i, a) => a.indexOf(k) === i);
    const chip = k => { const W = A.filter(p => p.st === k).map(first); return '<span class="wk-dk' + (W.length ? ' on' : '') + '"><b>' + sn(k) + '</b>' + (W.join(', ') || '–') + '</span>'; };
    const wait = ['haling', 'sloy', 'is', 'kokk'].concat(jobSt()).filter((k, i, a) => a.indexOf(k) === i && (k !== 'haling' || S.boat.gop)).map(k => [k, queue(k)])
      .filter(([k, q]) => q && q !== '–' && !/^0 kg/.test(q) && q !== L('ingen på', 'nobody on it')).map(([k, q]) => sn(k).toLowerCase() + ' ' + q);
    return '<div class="ph-card"><h4>' + L('På dekk nå', 'On deck now') + '</h4><div class="wk-dks">' + ks.map(chip).join('') + '</div>' + (wait.length ? '<p class="ph-note">' + L('Venter: ', 'Waiting: ') + wait.join(' · ') + '</p>' : '') + '</div>';
  }
  const bar = (v, m, col) => '<div class="qbar"><i style="width:' + clamp(v / m * 100, 0, 100).toFixed(0) + '%;background:' + col + '"></i></div>';
  // energy and mood as small bars without numbers, coloured by how it stands
  const meter = (lbl, v) => '<span class="wk-m"><span>' + lbl + '</span>' + bar(v, 100, v >= 65 ? '#35b37e' : v >= 40 ? '#f2b705' : '#e5484d') + '</span>';
  const badge = (cl, t) => '<span class="wk-b ' + cl + '">' + t + '</span>';
  // the card a tap on the name opens: what they can do, who they are, and more of what they have said
  function personCard(c){
    const g = c.gear, A = c.attr, sk = [['juksa', 'Juksa', 'Jig', g.juksa], ['line', 'Line', 'Line', g.line], ['garn', 'Garn', 'Nets', g.garn], ['teiner', 'Teiner', 'Pots', g.teiner], ['sloy', 'Sløying', 'Gutting', g.sloy], ['is', 'Ising', 'Icing', g.is], ['sort', 'Krabbesortering', 'Crab sorting', g.sort], ['kokk', 'Matlaging', 'Cooking', A.kokk], ['sjo', 'Sjømannskap', 'Seamanship', A.sjo], ['styrke', 'Styrke', 'Strength', A.styrke]];
    return '<div class="wk-card"><div class="wk-sk">' + sk.filter(x => x[3] != null).map(([k, no, en, v]) => '<span>' + L(no, en) + '</span><span class="wk-v">' + fmt(v || 1, 1) + '</span>' + bar(v || 1, 5, '#2f7fc1')).join('') + '</div>' +
      '<p class="ph-note">' + c.age + L(' år · ', ' years · ') + c.traits.filter((t, i) => c.known[i]).map(t => TRAITS[t][S.lang]).join(', ') + ' · ' + L('lærer ', 'learns ') + (ageLearn(c.age) * moraleLearn(c.morale) * (c.traits.includes('laerevillig') ? 2 : 1) >= 1.5 ? L('fort', 'fast') : ageLearn(c.age) * moraleLearn(c.morale) < 0.6 ? L('sakte', 'slowly') : L('jevnt', 'steadily')) + '</p>' +
      ((c.said || []).length > 1 ? '<div class="wk-said">' + c.said.slice(-6, -1).reverse().map(x => '<p>«' + x[S.lang] + '» <span class="ph-note">' + hm(x.t / 60) + '</span></p>').join('') + '</div>' : '') + '</div>';
  }
  // one card per person aboard: what and why in one line, how they work, energy and mood, the last thing said, the regular place
  function row(p){
    const c = p.c, id = pid(c), role = c && crewRole(c), why = workWhyText(p), ef = c && p.st !== 'pause' ? crewEffort(c) : null;
    const tags = c ? (c.sk ? badge('mate', meAboard() ? L('Skipper uten deg', 'Skipper without you') : L('Skipper', 'Skipper')) : '') + (c.mate ? badge('mate', L('Styrmann', 'Mate')) : '') + (c.cut && S.t < c.cut ? badge('cut', L('Skåret seg', 'Cut a hand')) : '') + (p.idle === 'seasick' ? badge('sick', L('Sjøsyk', 'Seasick')) : '') : badge('mate', L('Skipper', 'Skipper'));
    const e = c ? 100 - c.fatigue : (S.energy == null ? 100 : S.energy), last = c && (c.said || []).length ? c.said[c.said.length - 1] : null;
    let h = '<div class="ph-card wk-p"><div class="wk-top">' + (c ? '<button class="wk-name" data-pa="wk-card" data-id="' + id + '">' + c.name + '</button>' : '<b class="wk-name">' + L('Du', 'You') + '</b>') + '<span class="wk-bs">' + tags + '</span></div>';
    h += '<p class="wk-now">' + workDoing(p) + (why && p.why !== 'skipper' ? ' – ' + why : '') + '</p>';
    if (ef) h += '<p class="wk-eff e' + ef.lvl + '">' + ef.text + '</p>';
    h += '<div class="wk-ms">' + meter(L('Energi', 'Energy'), e) + (c ? meter(L('Humør', 'Mood'), c.morale) : '') + '</div>';
    if (last) h += '<p class="wk-last">«' + last[S.lang] + '» <span class="ph-note">' + hm(last.t / 60) + '</span></p>';
    if (role) h += '<p class="ph-note">' + L('Fast på ', 'Regular at ') + sn(role).toLowerCase() + '</p>';
    // the skipper runs the boat and the operations plan when you are not aboard, the mate is at the helm when you sleep (13-work.js)
    if (c && (!c.mate || !c.sk)) h += '<div class="ph-row2">' + (c.sk ? '' : '<button class="ph-btn wk-edit" data-pa="wk-sk" data-id="' + id + '">' + L('Gjør til skipper', 'Make skipper') + '</button>') + (c.mate ? '' : '<button class="ph-btn wk-edit" data-pa="wk-mate" data-id="' + id + '">' + L('Gjør til styrmann', 'Make mate') + '</button>') + '</div>';
    if (c && card === id) h += personCard(c);
    return h + '</div>';
  }
  // where the boat and the crew are, the samhold, and a short line for each one who is off
  function head(){
    const b = S.boat, at = b.status === 'port', rb = at && typeof isRorbu === 'function' && isRorbu(b.port), shore = meAboard() && typeof resting === 'function' && resting();
    const on = new Set(crewAboard().map(c => c.id)), bn = S.boatName ? '«' + S.boatName + '»' : L('båten', 'the boat'), lie = rb ? L('rorbua', 'the rorbu') : L('naustet', 'the boathouse');
    const where = at ? (shore || rb ? L('Hviler i ', 'Resting in ') + lie : L('Ved kai', 'At the quay')) : L('Til sjøs', 'At sea');
    const tl = on.size ? teamLine() : null;
    return '<div class="ph-card"><h4>' + L('Mannskapet', 'The crew') + '</h4>' + (tl ? '<p class="wk-team t' + tl.lvl + '">' + tl.text + '</p>' : '') +
      '<p class="ph-note">' + (on.size ? L(on.size === 1 ? '1 mønstret på ' : on.size + ' mønstret på ', on.size + ' signed on ') + bn + ' · ' : '') + where + (meAboard() ? '' : ' · ' + L('du er ikke om bord', 'you are not aboard')) + '</p>' +
      (S.crew.length ? '' : '<p class="ph-note">' + L('Ingen mannskap ennå. Finn folk under Bygd, Ansatte.', 'No crew yet. Find people under Village, Employees.') + '</p>') + '</div>';
  }
  function offLines(){
    const on = new Set(crewAboard().map(c => c.id)), off = S.crew.filter(c => !on.has(c.id)); if (!off.length) return '';
    return '<div class="ph-card"><h4>' + L('Fri', 'Off') + '</h4>' + off.map(c => '<div class="ph-kv"><span><b>' + c.name.split(' ')[0] + '</b></span><span>' + (c.off ? L('Fri denne turen', 'Off this trip') : L('Fri i dag (biyrke)', 'Off today (part-time)')) + '</span></div>').join('') + '</div>';
  }
  function page(){
    const team = crewAboard(), h = ['<div class="ph-c wk">', head()];
    if (team.length){ const A = workAssign(); h.push(deckNow(A));
      if (meAboard() && asleep()) h.push('<div class="ph-card wk-p"><div class="wk-top"><b class="wk-name">' + L('Du', 'You') + '</b><span class="wk-bs">' + badge('mate', L('Skipper', 'Skipper')) + '</span></div><p class="wk-now r2">' + L('Sover', 'Asleep') + '</p></div>');
      for (const p of A) h.push(row(p));
      h.push('<p class="ph-note">' + L('Mannskapet fordeler arbeidet selv, etter hva de kan, hva de er vant med, hvor slitne de er og hva som hoper seg opp. Når båten går, står du til rors. Ellers er du på dekk sammen med de andre. Styrmannen tar roret når du sover eller ikke er om bord.', 'The crew share the work themselves, by what they can do, what they are used to, how tired they are and what is piling up. Under way you are at the helm; otherwise you are on deck with the others. The mate takes the helm when you sleep or are not aboard.') + '</p>'); }
    h.push(offLines());
    return h.join('') + '</div>';
  }
  const who = id => id === 'me' ? null : crewById(id);
  function act(a, d){
    if (a === 'wk-card'){ card = card === d.id ? null : d.id; return true; }
    if (a === 'wk-mate'){ setMate(d.id); const c = who(d.id); if (c) toast(L(c.name.split(' ')[0] + ' er styrmann.', c.name.split(' ')[0] + ' is the mate.')); return true; }
    if (a === 'wk-sk'){ setSkipper(d.id); const c = who(d.id); if (c) toast(L(c.name.split(' ')[0] + ' er skipper når du ikke er om bord.', c.name.split(' ')[0] + ' is the skipper when you are not aboard.')); return true; }
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
// a slip or a cut seen on deck in 3D (view3d.js G3.crewFx)
hooks.onCrewFx = (c, kind, o) => typeof G3 !== 'undefined' && G3.isActive() && G3.crewFx ? G3.crewFx(c, kind, o) : false;
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
