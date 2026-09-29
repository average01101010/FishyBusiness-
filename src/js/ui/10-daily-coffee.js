// ---- "Kaffe på kaia": a reward for every real day you come by. The seven-day plan is shown in advance; one missed day a week
// is a free rest day, other missed days cost one step (never back to the start); milestones for total days; and a coffee cup
// with a small surprise. All rewards are free: nothing here can be bought. ----
const DAILY = [
  {k:'tubs', no:'Lånte fiskekar', en:'Borrowed fish tubs', ic:'🧺'},
  {k:'ice', no:'Full is', en:'Full ice', ic:'🧊'},
  {k:'tip', v:1500, no:'Rykte + 1 500 kr', en:'A tip + NOK 1,500', ic:'🗣️'},
  {k:'fuel', v:30, no:'30 l drivstoff', en:'30 l fuel', ic:'⛽'},
  {k:'pub', no:'Fri pubrunde', en:'Free pub round', ic:'🍺'},
  {k:'clean', no:'Rengjort bunn', en:'Clean hull', ic:'🧽'},
  {k:'box', no:'Overraskelse', en:'Surprise', ic:'🎁'}
];
const DAILY_MILES = [[10, 10000], [30, 25000], [60, 50000], [100, 100000]];
function dayKey(d){ d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function dayNum(k){ const [y, m, dd] = k.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, dd) / 864e5); }
function dailyState(){ return S.daily || (S.daily = {last:null, streak:0, total:0, restW:-1, pubV:0}); }
function dailyClaimable(){ return dailyState().last !== dayKey(); }
function dailyNext(){
  const d = dailyState(), today = dayNum(dayKey()), wk = Math.floor((today + 3) / 7);
  if (!d.last) return {streak:1, rest:false, lost:0, wk};
  const gap = today - dayNum(d.last); if (gap <= 0) return {streak:d.streak, rest:false, lost:0, wk};
  let missed = gap - 1, rest = false; if (missed > 0 && d.restW !== wk){ missed--; rest = true; }
  return {streak:Math.max(1, d.streak + 1 - missed), rest, lost:missed, wk};
}
function fishTip(){ const H = S.t / 60, hp = portById('husoy'); let best = null, bvv = 0;
  for (const g of GROUNDS) for (const sp of ['torsk', 'sei', 'hyse', 'kveite']){ if (sp === 'kveite' && kveiteClosed(H)) continue; const v = density(sp, g.p, H) * price(hp, sp, H); if (v > bvv){ bvv = v; best = [g, sp]; } }
  return best ? {no:'Det er godt med ' + SPECIES[best[1]].no.toLowerCase() + ' på ' + best[0].name.no + ' nå.', en:'There is good ' + SPECIES[best[1]].en.toLowerCase() + ' at ' + best[0].name.en + ' now.'} : {no:'Ingen har noe nytt å fortelle.', en:'Nobody has any news.'}; }
function giveDaily(k, v){
  const b = S.boat, L = (no, en) => ({no, en});
  if (k === 'kr'){ S.cash += v; return L('Du fikk ' + kr(v) + '.', 'You got ' + kr(v) + '.'); }
  if (k === 'tubs'){ const x = Math.round(BOAT.holdCap * 0.3 / 10) * 10; S.tubs = Math.max(S.tubs || 0, x); return L('Mottaket lånte deg fiskekar til dekket: ' + x + ' kg mer last til du lander neste gang.', 'The buyer lent you deck tubs: ' + x + ' kg more hold until your next landing.'); }
  if (k === 'clean'){ S.clean = Math.max(S.clean || 0, S.t) + 5 * 1440; return L('En dykker har rengjort bunnen: 10 % mindre drivstoff de neste fem døgnene.', 'A diver cleaned the hull: 10% less fuel for the next five days.'); }
  if (k === 'ice'){ const room = Math.max(0, BOAT.iceCap - b.ice); if (room < 5){ const c = Math.round(BOAT.iceCap * PRICE.ice); S.cash += c; return L('Isen var full, så du fikk ' + kr(c) + ' i stedet.', 'The ice was full, so you got ' + kr(c) + ' instead.'); } b.ice = BOAT.iceCap; return L('Mottaket fylte isen din gratis.', 'The buyer filled your ice for free.'); }
  if (k === 'fuel'){ const room = Math.max(0, BOAT.fuelCap - b.fuel), l = Math.min(v, room); b.fuel += l; const c = Math.round((v - l) * fuelPrice()); if (c > 0) S.cash += c; return L(fmt(l, 0) + ' liter drivstoff på tanken' + (c > 0 ? ', og ' + kr(c) + ' for resten.' : '.'), fmt(l, 0) + ' litres of fuel in the tank' + (c > 0 ? ', and ' + kr(c) + ' for the rest.' : '.')); }
  if (k === 'tip'){ S.cash += v; const tp = fishTip(); msg('Kaia', tp.no, tp.en); return L(tp.no + ' Og ' + kr(v) + ' fra kaffekassa.', tp.en + ' And ' + kr(v) + ' from the coffee fund.'); }
  if (k === 'pub'){ dailyState().pubV++; return L('En fri runde på puben. Den kan brukes i havn mellom 15:00 og 03:00.', 'A free round at the pub. Use it in port between 15:00 and 03:00.'); }
  if (k === 'box'){ const r = Math.random();
    if (r < 0.45){ const c = 6000 + Math.round(Math.random() * 6) * 1000; S.cash += c; return L('Overraskelse: ' + kr(c) + '!', 'Surprise: ' + kr(c) + '!'); }
    if (r < 0.7){ dailyState().pubV += 2; return L('Overraskelse: to frie pubrunder!', 'Surprise: two free pub rounds!'); }
    if (r < 0.9){ b.fuel = BOAT.fuelCap; b.ice = BOAT.iceCap; return L('Overraskelse: full tank og full is!', 'Surprise: a full tank and full ice!'); }
    S.cash += 20000; return L('Storgevinst: ' + kr(20000) + '!', 'Big win: ' + kr(20000) + '!'); }
  return L('', '');
}
const CUPS = [[0.4, 'kr', 500], [0.2, 'kr', 1000], [0.15, 'ice', 0], [0.15, 'tip', 0], [0.1, 'none', 0]];
function cupDraw(){ let r = Math.random(); for (const c of CUPS){ r -= c[0]; if (r <= 0) return c; } return CUPS[0]; }
function cupText(c, no){ return c[1] === 'kr' ? kr(c[2]) : c[1] === 'ice' ? (no ? 'Gratis is' : 'Free ice') : c[1] === 'tip' ? (no ? 'Et rykte' : 'A tip') : (no ? 'Bare god kaffe' : 'Just good coffee'); }
window.DAILYW = (() => {
  const el = document.createElement('div'); el.id = 'dailyUI'; el.hidden = true; document.getElementById('mapwrap').appendChild(el);
  const btn = document.createElement('button'); btn.id = 'dailyBtn'; btn.className = 'ov daily'; btn.type = 'button'; btn.setAttribute('aria-label', 'Kaffe på kaia'); btn.innerHTML = '☕<i></i>'; document.getElementById('mapwrap').appendChild(btn);
  const L = (no, en) => S.lang === 'no' ? no : en;
  let res = null, cups = null, picked = -1, shownOn = null;
  function render(){
    const d = dailyState(), can = dailyClaimable(), nx = can ? dailyNext() : {streak:d.streak, rest:false, lost:0}, cur = (nx.streak - 1) % 7;
    const tiles = DAILY.map((r, i) => { const st = i < cur || (!can && i === cur) ? 'done' : i === cur ? 'today' : ''; return '<div class="dt ' + st + '"><span class="ic">' + r.ic + '</span><b>' + L('Dag ', 'Day ') + (i + 1) + '</b><small>' + r[S.lang] + '</small></div>'; }).join('');
    const mile = DAILY_MILES.find(m => m[0] > d.total) || null, prev = DAILY_MILES.filter(m => m[0] <= d.total).pop();
    let h = '<div class="dbox"><h3>☕ ' + L('Kaffe på kaia', 'Coffee on the quay') + '</h3><p class="dsub">' + L('Rekke: ', 'Streak: ') + (can ? d.streak : nx.streak) + L(' dager · Totalt: ', ' days · Total: ') + d.total + L(' dager', ' days') + (d.pubV ? ' · 🍺 ' + d.pubV : '') + '</p><div class="dstrip">' + tiles + '</div>';
    if (can && nx.rest) h += '<p class="dnote">' + L('Du brukte ukas fridag, så rekka holder.', 'You used this week\'s rest day, so the streak holds.') + '</p>';
    if (can && nx.lost > 0) h += '<p class="dnote">' + L('Du gikk glipp av ' + nx.lost + (nx.lost > 1 ? ' dager' : ' dag') + ' og gikk ned tilsvarende trinn.', 'You missed ' + nx.lost + ' day' + (nx.lost > 1 ? 's' : '') + ' and dropped as many steps.') + '</p>';
    if (res) h += '<p class="dres">' + res[S.lang] + '</p>';
    if (cups) h += '<p class="dnote">' + (picked < 0 ? L('Velg en kaffekopp:', 'Pick a coffee cup:') : L('Dette lå i koppene:', 'This was in the cups:')) + '</p><div class="cups">' + cups.map((c, i) => '<button data-d="cup" data-i="' + i + '" class="cup' + (picked === i ? ' mine' : picked >= 0 ? ' other' : '') + '"' + (picked >= 0 ? ' disabled' : '') + '>' + (picked >= 0 ? cupText(c, S.lang === 'no') : '☕') + '</button>').join('') + '</div>';
    h += '<div class="dbtns">' + (can ? '<button class="pri" data-d="claim">' + L('Hent dagens premie', 'Get today\'s reward') + '</button>' : '') + '<button data-d="close">' + (can ? L('Senere', 'Later') : L('Lukk', 'Close')) + '</button></div>';
    if (!can && !cups) h += '<p class="dnote">' + L('Kom tilbake i morgen for dag ', 'Come back tomorrow for day ') + (((nx.streak) % 7) + 1) + '.</p>';
    if (mile) h += '<div class="dmile"><small>' + L('Neste milepæl: ', 'Next milestone: ') + mile[0] + L(' dager · ', ' days · ') + kr(mile[1]) + '</small><div class="qbar"><i style="width:' + Math.min(100, (d.total - (prev ? prev[0] : 0)) / (mile[0] - (prev ? prev[0] : 0)) * 100).toFixed(0) + '%;background:#c9a227"></i></div></div>';
    el.innerHTML = h + '</div>';
    btn.classList.toggle('dot', dailyClaimable());
  }
  function claim(){
    if (!dailyClaimable()) return; const d = dailyState(), nx = dailyNext(), slot = (nx.streak - 1) % 7, r = DAILY[slot];
    if (nx.rest) d.restW = nx.wk; d.streak = nx.streak; d.total++; d.last = dayKey();
    res = giveDaily(r.k, r.v); log('Kaffe på kaia, dag ' + (slot + 1) + ': ' + res.no, 'Coffee on the quay, day ' + (slot + 1) + ': ' + res.en);
    const m = DAILY_MILES.find(x => x[0] === d.total); if (m){ S.cash += m[1]; msg('Kaia', 'Du har vært innom kaia ' + m[0] + ' dager. Her er ' + kr(m[1]) + ' fra kaffekassa!', 'You have been by the quay ' + m[0] + ' days. Here is ' + kr(m[1]) + ' from the coffee fund!'); res = {no:res.no + ' Milepæl: ' + m[0] + ' dager, ' + kr(m[1]) + '!', en:res.en + ' Milestone: ' + m[0] + ' days, ' + kr(m[1]) + '!'}; }
    cups = [cupDraw(), cupDraw(), cupDraw()]; picked = -1; save(); render(); if (typeof renderHud === 'function') renderHud();
  }
  function pick(i){ if (!cups || picked >= 0) return; picked = i; const c = cups[i]; if (c[1] !== 'none'){ const g = giveDaily(c[1], c[2]); res = {no:res.no + ' Koppen: ' + g.no.charAt(0).toLowerCase() + g.no.slice(1), en:res.en + ' The cup: ' + g.en.charAt(0).toLowerCase() + g.en.slice(1)}; } else res = {no:res.no + ' Koppen: bare god kaffe.', en:res.en + ' The cup: just good coffee.'}; save(); render(); if (typeof renderHud === 'function') renderHud(); }
  function close(){ if (cups && picked < 0) pick(Math.floor(Math.random() * 3)); el.hidden = true; res = null; cups = null; picked = -1; render(); if (typeof renderActs === 'function') renderActs(); }
  el.addEventListener('click', e => { const b = e.target.closest('[data-d]'); if (!b || b.disabled) return; const a = b.dataset.d; if (a === 'claim') claim(); else if (a === 'cup') pick(+b.dataset.i); else if (a === 'close') close(); });
  btn.addEventListener('click', () => { render(); el.hidden = false; });
  // open by itself the first time you come by each day, when nothing else is showing
  function auto(){ btn.classList.toggle('dot', dailyClaimable()); if (!dailyClaimable() || shownOn === dayKey() || S.tut !== 0) return; const m = document.getElementById('modal'); if (m && !m.hidden) return; const pu = document.getElementById('pubUI'); if (pu && !pu.hidden) return; if (typeof PHONE !== 'undefined' && PHONE.isOpen && PHONE.isOpen()) return; shownOn = dayKey(); render(); el.hidden = false; }
  setTimeout(auto, 2500); setInterval(auto, 30000);
  return {open(){ render(); el.hidden = false; }, auto, claim, pick, close};
})();
window.ROD = (() => {
  let on = false, st = 'jig', tNext = 0, t0 = 0, prog = 0, tens = 0, hold = false, fish = null, raf = 0, last = 0, phase = 0;
  const el = document.createElement('div'); el.id = 'rodUI'; el.hidden = true;
  el.innerHTML = '<div class="rod-msg"></div><div class="rod-bars"><div class="rod-bar"><i class="rp"></i></div><div class="rod-bar tb"><i class="rt"></i></div></div><button type="button" class="rod-btn"></button>';
  document.getElementById('mapwrap').appendChild(el);
  const msgEl = el.querySelector('.rod-msg'), btn = el.querySelector('.rod-btn'), pEl = el.querySelector('.rp'), tEl = el.querySelector('.rt'), bars = el.querySelector('.rod-bars');
  const L = (no, en) => S.lang === 'no' ? no : en, MEAN = {torsk:3.8, sei:2.6, hyse:1.6, lange:5.5, brosme:3.2};
  const dens = () => SP.reduce((a, sp) => a + density(sp, S.boat.pos, S.t / 60) * luck(sp) * targetF(sp, S.t / 60), 0);
  function schedule(now){ const mean = clamp(26 / Math.max(0.12, dens() * 1.4), 5, 50); tNext = now + mean * (0.35 + Math.random() * 1.3) * 1000; }
  function pick(){ const w = SP.map(sp => [sp, density(sp, S.boat.pos, S.t / 60) * luck(sp) * targetF(sp, S.t / 60)]), tot = w.reduce((a, x) => a + x[1], 0) || 1; let r = Math.random() * tot, sp = w[0][0]; for (const [k, v] of w){ r -= v; if (r <= 0){ sp = k; break; } }
    const kg = sampleFish(sp, S.boat.pos, S.t / 60); return {sp, kg}; }
  function set(s2, now){ st = s2; t0 = now; phase = 0; }
  function loop(ts){
    raf = 0; if (!on) return; raf = requestAnimationFrame(loop); const dt = last ? Math.min(0.1, (ts - last) / 1000) : 0; last = ts;
    if (S.boat.status !== 'fishing' || !G3.isActive()){ stop(); return; }
    phase += dt;
    if (st === 'jig' && ts >= tNext){ fish = pick(); set('bite', ts); }
    else if (st === 'bite' && ts - t0 > 1100){ set('miss', ts); }
    else if (st === 'fight'){
      const heavy = 1 + fish.kg * 0.09, surge = Math.max(0, Math.sin(ts / 700 + fish.kg)) * 0.35 * Math.min(1, fish.kg / 4);
      if (hold){ prog += dt * 0.34 / heavy; tens += dt * (0.55 + surge) * (0.8 + fish.kg * 0.06); } else { prog -= dt * 0.03 * heavy; tens -= dt * 0.9; }
      prog = clamp(prog, 0, 1); tens = clamp(tens, 0, 1.05);
      if (tens >= 1){ set('snap', ts); } else if (prog >= 1){ set('land', ts); }
    }
    else if (st === 'land' && phase > 1.5){
      const room = capHold() - holdTotal(), kg = Math.min(fish.kg, room);
      if (fish.kg < SPECIES[fish.sp].minKg){ toast(SPECIES[fish.sp][S.lang] + ' ' + fmt(fish.kg, 1) + ' kg · ' + L('under minstemål, satt ut igjen', 'undersized, released')); }
      else if (fish.sp === 'kveite' && (kveiteClosed(S.t / 60) || fish.kg > SPECIES.kveite.maxKg)){ toast(L('Kveite ', 'Halibut ') + fmt(fish.kg, 0) + ' kg · ' + (kveiteClosed(S.t / 60) ? L('fredet, sluppet igjen', 'closed season, released') : L('over 200 cm, sluppet igjen', 'over 200 cm, released'))); }
      else if (kg > 0.05){ addCatch(fish.sp, kg, clsOf(fish.sp, fish.kg), true); S.rodN = (S.rodN || 0) + 1; if (!S.rodBest || kg > S.rodBest.kg) S.rodBest = {sp:fish.sp, kg}; toast(SPECIES[fish.sp][S.lang] + ' ' + fmt(kg, 1) + ' kg' + (S.rodBest.kg === kg && S.rodN > 1 ? L(' · ny rekord!', ' · new record!') : '')); }
      fish = null; set('jig', ts); schedule(ts);
    }
    else if ((st === 'miss' || st === 'snap') && phase > 1.6){ fish = null; set('jig', ts); schedule(ts); }
    render();
  }
  function render(){
    const txt = {jig:L('Rykk med juksa og kjenn etter napp …', 'Jig the line and feel for a bite …'), bite:L('NAPP! Trekk nå!', 'BITE! Strike now!'), fight:L('Hold inne for å sveive. Slipp når snøret strammer seg.', 'Hold to reel. Let go when the line gets tight.'), land:L('Fisken kommer over rekka …', 'Swinging the fish aboard …'), miss:L('For sent, den slapp.', 'Too late, it let go.'), snap:L('Snøret røk!', 'The line snapped!')}[st];
    msgEl.textContent = txt; el.dataset.st = st; bars.style.visibility = st === 'fight' ? 'visible' : 'hidden';
    pEl.style.width = Math.round(prog * 100) + '%'; tEl.style.width = Math.round(Math.min(1, tens) * 100) + '%'; tEl.style.background = tens > 0.8 ? '#e5484d' : tens > 0.55 ? '#f2b705' : '#35b37e';
    btn.textContent = st === 'bite' ? L('Trekk!', 'Strike!') : st === 'fight' ? L('Sveiv', 'Reel') : L('Rykk', 'Jig'); btn.disabled = st === 'land' || st === 'miss' || st === 'snap';
  }
  function press(e){ e.preventDefault(); const now = performance.now(); if (st === 'bite'){ prog = 0.05; tens = 0.2; set('fight', now); } else if (st === 'fight') hold = true; }
  function release(){ hold = false; }
  btn.addEventListener('pointerdown', press); window.addEventListener('pointerup', release); btn.addEventListener('pointerleave', release);
  function start(){ if (on || S.boat.status !== 'fishing') return; on = true; window.rodActive = true; el.hidden = false; set('jig', performance.now()); schedule(performance.now()); last = 0; if (G3.isActive() && G3.fishCam) G3.fishCam(); raf = requestAnimationFrame(loop); render(); }
  function stop(){ on = false; window.rodActive = false; el.hidden = true; hold = false; fish = null; if (raf) cancelAnimationFrame(raf); raf = 0; }
  return {start, stop, toggle(){ on ? stop() : start(); }, state:() => ({on, st, prog, tens, hold, fish, phase}), _bite(){ tNext = 0; }, _prog(v){ prog = v; }, _strike(){ fish = fish || pick(); prog = 0.05; tens = 0.2; set('fight', performance.now()); }};
})();
function renderActs(){
  const b = S.boat, L = (no, en) => S.lang === 'no' ? no : en, LS = (no, en, sno, sen) => '<span class="lg">' + L(no, en) + '</span><span class="sh">' + L(sno, sen) + '</span>', h = [];
  if (S.plan && S.plan.depAt){
    h.push('<span class="stp">' + L('Avgang ', 'Departs ') + hm(S.plan.depAt / 60) + '</span><button class="pri" data-act="depnow">' + t('dep_go') + '</button><button data-act="depcancel">' + L('Avbryt', 'Cancel') + '</button>');
  } else if (b.status === 'port'){
    const p = portById(b.port), tot = holdTotal();
    if (S.jobs && S.jobs.length) h.push('<button data-ui="verksted">' + LS('Verksted til ', 'Yard until ', 'Verksted ', 'Yard ') + hm((jobsDone() || S.t) / 60) + '</button>');
    if (p.mottak && tot > 0.5) h.push('<button class="pri" data-act="sell">' + L('Lever ', 'Land ') + fmt(tot, 0) + ' kg</button>');
    if (p.fuel && BOAT.fuelCap - b.fuel > 0.5) h.push('<button data-act="fuel">' + LS('Fyll drivstoff', 'Refuel', 'Drivstoff', 'Fuel') + '</button>');
    if (p.ice && b.ice < BOAT.iceCap - 1) h.push('<button data-act="ice">' + LS('Kjøp is', 'Buy ice', 'Is', 'Ice') + '</button>');
    if (!b.gear) h.push('<button data-act="gear">' + LS('Ny juksa', 'New jig line', 'Juksa', 'Jig') + '</button>');
    if (pubOpen(S.t / 60) && S.pubE !== pubEvening(S.t / 60)) h.push('<button data-act="pub">🍺 ' + LS('Pubrunde', 'Pub round', 'Pub', 'Pub') + '</button>');
    if (!b.kgear && (p.fuel || p.ice)) h.push('<button data-act="kgear">' + LS('Kveiteutstyr (' + kr(PRICE.kgear) + ')', 'Halibut gear (' + kr(PRICE.kgear) + ')', 'Kveiteutstyr', 'Halibut gear') + '</button>');
    h.push('<button' + (tot > 0.5 && p.mottak ? '' : ' class="pri"') + ' data-ui="plot">' + LS('Planlegg tur', 'Plan a trip', 'Planlegg', 'Plan') + '</button>');
  } else if (b.status === 'idle'){
    h.push('<span class="stp"><button data-act="fh-" aria-label="−">−</button>' + S.fishPlanH + ' t<button data-act="fh+" aria-label="+">+</button></span><button class="pri" data-act="startfish">' + LS('Start fiske', 'Start fishing', 'Fisk', 'Fish') + '</button>');
    if (b.kgear){ const cl = kveiteClosed(S.t / 60); h.push('<button data-act="target"' + (cl && S.target !== 'kveite' ? ' disabled' : '') + '>🎯 ' + (S.target === 'kveite' && !cl ? LS('Fisker kveite', 'Fishing halibut', 'Kveite', 'Halibut') : cl ? LS('Kveita er fredet', 'Halibut closed', 'Fredet', 'Closed') : LS('Blandet fiske', 'Mixed fishing', 'Blandet', 'Mixed')) + '</button>'); }
    h.push('<button data-act="retrace">' + LS('Hjem samme vei', 'Home same way', 'Hjem', 'Home') + '</button><button data-ui="plot">' + LS('Ny rute', 'New route', 'Rute', 'Route') + '</button>');
  } else if (b.status === 'fishing'){
    h.push('<button data-act="stopfish">' + LS('Stopp fiske', 'Stop fishing', 'Stopp', 'Stop') + ' · ' + dur((b.fishUntil - S.t) / 60) + '</button>');
    if (G3.isActive()) h.push('<button data-act="rod" class="' + (window.rodActive ? 'on' : 'pri') + '">' + (window.rodActive ? LS('Legg fra deg stanga', 'Put the rod down', 'Stang av', 'Rod off') : LS('🎣 Fisk selv', '🎣 Fish yourself', '🎣 Stang', '🎣 Rod')) + '</button>');
  } else if (b.status === 'sailing'){
    h.push('<button data-act="stop">' + LS('Stopp båten', 'Stop the boat', 'Stopp', 'Stop') + '</button>');
    if (!(S.plan && S.plan.returning)) h.push('<button data-act="retrace">' + LS('Hjem samme vei', 'Home same way', 'Hjem', 'Home') + '</button>');
  } else if (b.status === 'adrift' || b.status === 'engine' || b.status === 'aground'){
    h.push('<button class="warn" data-ui="rescue">' + LS('Ring etter hjelp', 'Call for help', 'Hjelp', 'Help') + '</button>');
  }
  const html = h.join(''); if (html !== actsHtml){ actsHtml = html; $('actbar').innerHTML = html; }
}
$('actbar').addEventListener('click', e => {
  const el = e.target.closest('button'); if (!el || el.disabled) return;
  if (el.dataset.ui === 'plot') openPlotter(); else if (el.dataset.ui === 'rescue') PHONE.open('redning'); else if (el.dataset.ui === 'verksted') PHONE.open('verksted'); else if (el.dataset.act) doAct(el);
});
hooks.onView = on => { setBodyView(on); if (on) $('loader').classList.add('gone'); $('view3d').textContent = on ? t('view_chart') : '3D'; if (!on){ tab = 'route'; renderPanel(); applyView(); renderStatic(); renderDyn(); } $('legend').hidden = !S.settings.plotter || on; updateMapButtons(); panelDirty = true; };
$('modeBtn').onclick = () => {
  if (G3.isActive()){ G3.setHelm(!G3.isHelm()); updateMapButtons(); return; }
  if (!S.equip.plotter){ toast(t('need_plotter')); PHONE.open('utstyr'); return; }
  S.settings.plotter = !S.settings.plotter; save(); renderBase(); scheduleStatic();
};
$('phoneBtn').onclick = () => PHONE.toggle();
hooks.onEquip = () => { updateMapButtons(); INSTR.show(); };
hooks.onMsg = () => { PHONE.setBadge(); const m = S.msgs[S.msgs.length - 1]; if (m && !PHONE.isOpen()) toast('✉ ' + m.from + ': ' + (S.lang === 'no' ? m.no : m.en)); if (PHONE.isOpen() && (PHONE.app === 'meld' || PHONE.app === 'home')) PHONE.render(); };
$('instrBtn').onclick = () => { S.settings.instr = S.settings.instr === false; save(); updateMapButtons(); INSTR.show(); };
if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => renderBase());
$('lang').onclick = () => { S.lang = S.lang === 'no' ? 'en' : 'no'; refreshAll(); save(); };
$('pace').onchange = e => { S.mult = +e.target.value; save(); };
function refreshAll(){ applyLang(); renderTabs(); applyView(); renderBase(); renderStatic(); renderDyn(); renderHud(); renderClock(); renderPanel(); $('pace').value = String(S.mult); }

