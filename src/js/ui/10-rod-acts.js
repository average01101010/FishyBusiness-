// ---------- fishing by hand with the rod, and the buttons and hooks around it ----------
window.ROD = (() => {
  let on = false, st = 'jig', tNext = 0, t0 = 0, prog = 0, tens = 0, hold = false, fish = null, raf = 0, last = 0, phase = 0;
  const el = document.createElement('div'); el.id = 'rodUI'; el.hidden = true;
  el.innerHTML = '<div class="rod-msg"></div><div class="rod-bars"><div class="rod-bar"><i class="rp"></i></div><div class="rod-bar tb"><i class="rt"></i></div></div><button type="button" class="rod-btn"></button>';
  document.getElementById('mapwrap').appendChild(el);
  const msgEl = el.querySelector('.rod-msg'), btn = el.querySelector('.rod-btn'), pEl = el.querySelector('.rp'), tEl = el.querySelector('.rt'), bars = el.querySelector('.rod-bars');
  const L = (no, en) => S.lang === 'no' ? no : en, MEAN = {torsk:3.8, sei:2.6, hyse:1.6, lange:5.5, brosme:3.2};
  const dens = () => SP.reduce((a, sp) => a + density(sp, S.boat.pos, S.t / 60) * luck(sp) * targetF(sp, S.t / 60), 0);
  function schedule(now){ if (S.tut && S.tut.catch){ tNext = now + (4 + Math.random() * 4) * 1000; return; } const mean = clamp(26 / Math.max(0.12, dens() * 1.4), 5, 50); tNext = now + mean * (0.35 + Math.random() * 1.3) * 1000; }
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
hooks.onView = on => { if (on && SETM) setModeEnd(false, true); setBodyView(on); if (on) $('loader').classList.add('gone'); $('view3d').textContent = on ? t('view_chart') : '3D'; if (!on){ tab = 'route'; renderPanel(); applyView(); renderStatic(); renderDyn(); } $('legend').hidden = !S.settings.plotter || on; updateMapButtons(); panelDirty = true; };
$('modeBtn').onclick = () => {
  if (G3.isActive()){ G3.setHelm(!G3.isHelm()); updateMapButtons(); return; }
  if (!S.equip.plotter){ toast(t('need_plotter')); PHONE.open('utstyr'); return; }
  S.settings.plotter = !S.settings.plotter; save(); renderBase(); scheduleStatic();
};
$('phoneBtn').onclick = () => PHONE.toggle();
hooks.onEquip = () => { updateMapButtons(); INSTR.show(); heatReset(); };
hooks.onMsg = () => { PHONE.setBadge(); const m = S.msgs[S.msgs.length - 1]; if (m && !PHONE.isOpen()) toast('✉ ' + m.from + ': ' + (S.lang === 'no' ? m.no : m.en)); if (PHONE.isOpen() && (PHONE.app === 'meld' || PHONE.app === 'home')) PHONE.render(); };
$('instrBtn').onclick = () => { S.settings.instr = S.settings.instr === false; save(); updateMapButtons(); INSTR.show(); };
if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => renderBase());
$('lang').onclick = () => { S.lang = S.lang === 'no' ? 'en' : 'no'; refreshAll(); save(); };
$('pace').onchange = e => { S.mult = +e.target.value; save(); };
function refreshAll(){ applyLang(); renderTabs(); applyView(); renderBase(); renderStatic(); renderDyn(); renderHud(); renderClock(); renderPanel(); $('pace').value = String(S.mult); }

