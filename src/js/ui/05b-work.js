// ===== the Arbeid page in the drawer: the boat's work as a flow of stations, and each person's chain of them =====
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
    const b = S.boat, st = S.settings, g = b.gop; let gut = 0, ice = 0;
    for (const x of S.hold){ if (SPECIES[x.sp].live || x.iced) continue; if (st.gut && !x.gut) gut += x.kg; else if (st.ice !== false) ice += x.kg; }
    if (k === 'ror') return b.status === 'sailing' ? fmt(b.v || 0, 0) + ' kn' : '–';
    if (k === 'fiske') return b.status === 'fishing' && !g && S.fsess ? fmt(S.fsess.kg, 0) + ' kg' : '–';
    if (k === 'haling' || k === 'sort') return g ? g.done + '/' + g.n : '–';
    if (k === 'sloy') return st.gut ? fmt(gut, 0) + ' kg' : L('av', 'off');
    if (k === 'is') return st.ice !== false ? fmt(ice, 0) + ' kg' : L('av', 'off');
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
    if (!c || S.boat.status === 'port') return '';
    const left = restLeft(c); if (left > 6) return '';
    return '<br><span class="' + (left ? 'r1' : 'r2') + '">' + (left ? L('Må hvile innen ' + left + ' t', 'Must rest within ' + left + ' h') : L('Brudd på hviletiden', 'Rest rule broken')) + '</span>';
  }
  function row(p, i){
    const id = pid(p.c), ed = edit && edit.id === id, job = ed ? edit.chain : jobOf(p.c, i), auto = p.c ? !p.c.job : !S.myJob;
    let h = '<div class="ph-card wk-p' + (ed ? ' ed' : '') + '"><div class="wk-top"><button class="wk-name" data-pa="wk-card" data-id="' + id + '">' + (p.c ? p.c.name : L('Du (skipper)', 'You (skipper)')) + '</button><span class="wk-now">' + STATIONS[p.st].ing[S.lang === 'no' ? 0 : 1] + restLine(p.c) + '</span></div>';
    h += '<div class="wk-chain">' + (job.length ? chips(job, p.st) : '<span class="ph-note">' + L('Trykk stasjonene i den rekkefølgen du vil ha dem.', 'Tap the stations in the order you want them.') + '</span>') + (auto && !ed ? '<span class="wk-auto">Auto</span>' : '') + '</div>';
    if (ed) h += '<div class="wk-pick">' + WORK_ST.map(k => '<button class="' + (job.includes(k) ? 'on' : '') + '" data-pa="wk-add" data-k="' + k + '">' + (job.includes(k) ? (job.indexOf(k) + 1) + ' ' : '') + sn(k) + '</button>').join('') + '</div>' +
      '<div class="ph-btnrow"><button class="ph-btn p" data-pa="wk-done">' + L('Ferdig', 'Done') + '</button><button class="ph-btn" data-pa="wk-auto">Auto</button></div>';
    else h += '<button class="ph-btn wk-edit" data-pa="wk-edit" data-id="' + id + '">' + L('Endre', 'Change') + '</button>';
    if (card === id) h += personCard(p.c);
    return h + '</div>';
  }
  function page(){
    const team = crewAboard(), A = workAssign(), h = ['<div class="ph-c wk">'];
    if (!team.length) return '<div class="ph-c"><p class="ph-note">' + L('Ingen mannskap om bord. Finn folk under Bygd, Mannskap.', 'No crew aboard. Find people under Village, Crew.') + '</p></div>';
    h.push(flow(A));
    h.push('<div class="wk-pre">' + Object.keys(JOB_PRESETS).map(k => '<button class="ph-btn" data-pa="wk-pre" data-k="' + k + '">' + JOB_PRESETS[k][S.lang] + '</button>').join('') + '</div>');
    const ix = new Map(team.map((c, i) => [c.id, i]));
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
