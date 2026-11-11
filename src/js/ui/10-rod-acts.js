// ---------- the jig game: jigging by hand yourself, and the buttons and hooks around it ----------
// The rod is gone (the user's list 04.10.2026). While you play, your own share of the hand-jig catch (jigMeShare) is left out of the
// automatic catch and comes through your bites instead, at the same rate on average: at a bite a needle sweeps over a bar, and «Rykk»
// with it in the middle sets the hook. The hit gives 2×, 1.5×, 1× or 0.5× what the bite is worth: the pilk and a fly hook both took,
// half the time one more on a fly, one fish, or it slipped half the time (no tap at all is a slip too).
window.JIGG = (() => {
  let on = false, st = 'jig', tNext = 0, t0 = 0, last = 0, raf = 0, due = 0, debt = 0, mult = 1, got = null, miss = 0, pre = 0, fNext = 0, dupT = -1e9;
  const SWEEP = 1.4, GR = [[0.06, 2], [0.15, 1.5], [0.3, 1]];   // seconds off the middle, and what the hit is worth
  // jigging yourself pays (Jonas 06.11.2026, Tony's test: «Øk mengde man får på jukse selv til 5x kanskje?»): the bites are worth SELF times
  // what your share of the hand jig would take on its own (jigMeShare, which the automatic catch leaves out while you play); the hit's
  // 2×, 1.5×, 1× or 0.5× comes on top as before. One number to tune
  const SELF = 5;
  const el = document.createElement('div'); el.id = 'jigUI'; el.hidden = true;
  el.innerHTML = '<div class="jig-msg"></div><div class="jig-bar"><i class="z1"></i><i class="z15"></i><i class="z2"></i><b class="jn"></b></div><button type="button" class="jig-btn"></button>';
  document.getElementById('mapwrap').appendChild(el);
  const msgEl = el.querySelector('.jig-msg'), btn = el.querySelector('.jig-btn'), needle = el.querySelector('.jn');
  const L = (no, en) => S.lang === 'no' ? no : en;
  // your share in kg a real second: as fish() counts it, at the game's rate (game seconds a real second)
  function kgps(){
    const b = S.boat, H = S.t / 60, sh = jigMeShare(); if (sh <= 0) return 0;
    const f = catchFactors(H, windAt(H), hsAt(b.pos, H)); let d = 0; for (const sp of SP) d += density(sp, b.pos, H) * luck(sp) * jigTake(sp, H);   // as fish() takes them: the jig factor (Greenland halibut next to none) and the tackle
    return SELF * 30 * f.eff * sh * d * f.wpen * (1 - f.cold) / 3600 * simRate();
  }
  // the next bite: about one fish a bite, 5 to 40 real seconds apart (4 to 8 on the first trip)
  function schedule(now){ if (S.tut && S.tut.catch) tNext = now + (4 + Math.random() * 4) * 1000; else { const k = kgps() / SELF, mean = clamp(3 / Math.max(1e-6, k), 5, 40); tNext = now + mean * (0.6 + Math.random() * 0.8) * 1000; }   // (the bites' timing as before SELF: each bite carries more)
    // the wait has life (spilltest 3, U12; Jonas 05.11.2026, V5 A): a nudge on the line 1–3 s before the bite, and now and then one with
    // no bite after it, so a nudge is a sign and not a promise. The catch and the bites' timing are as before
    pre = tNext - (1 + Math.random() * 2) * 1000; if (pre < now + 400) pre = 0; fNext = now + (5 + Math.random() * 9) * 1000; }
  function dupp(ts){ dupT = ts; el.classList.remove('dupp'); void el.offsetWidth; el.classList.add('dupp'); try { SND.nudge(); } catch (e){} if (navigator.vibrate) try { navigator.vibrate(25); } catch (e){} }
  function pick(){ const H = S.t / 60, w = SP.map(sp => [sp, density(sp, S.boat.pos, H) * luck(sp) * jigTake(sp, H)]), tot = w.reduce((a, x) => a + x[1], 0) || 1; let r = Math.random() * tot, sp = w[0][0]; for (const [k, v] of w){ r -= v; if (r <= 0){ sp = k; break; } } return {sp, kg:sampleFish(sp, S.boat.pos, H)}; }
  function grade(off){ if (off == null) return 0.5; for (const [s, m] of GR) if (Math.abs(off) <= s) return m; return 0.5; }
  // the bite worth what came due since the last one, times the hit: whole fish until it is used up (the rest carries to the next)
  function land(m){
    // 0.5×: half the time it slips and the bite is lost, else one fish's worth (so on average half); a better gaff takes more of them
    // (OPP1, core jigSlip: 50, 40 and 30 %)
    if (m === 0.5 && Math.random() < jigSlip()){ due = 0; got = {n:0, m}; return; }
    let left = due * (m === 0.5 ? 1 : m) + debt, n = 0, kgSum = 0; const H = S.t / 60; due = 0;
    while (left > 0 && n < 6){
      const f = pick(), room = capHold() - holdLoad(); if (room <= 0.05) break; left -= f.kg; n++;
      if (letGo(f.sp, f.kg, S.boat.pos, H)){ S.stats.released = (S.stats.released || 0) + 1; continue; }
      const kg = Math.min(f.kg, room); addCatch(f.sp, kg, clsOf(f.sp, f.kg), true); kgSum += kg;
      const cq = window.CATCHQ || (window.CATCHQ = []); if (cq.length < 30) cq.push({sp:f.sp, kg, t:performance.now()});
    }
    debt = Math.min(0, left); got = {n, m, kg:kgSum}; S.jigN = (S.jigN || 0) + 1;
  }
  function set(s2, now){ st = s2; t0 = now; }
  // not with jigging machines aboard: then you tend them (Jonas 06.10.2026)
  function ok(){ const b = S.boat; return b.status === 'fishing' && !b.gop && !b.deckStop && G3.isActive() && S.target !== 'kveite' && !(S.equip && S.equip.jukse > 0) && jigMeShare() > 0; }
  function loop(ts){
    raf = 0; if (!on) return; raf = requestAnimationFrame(loop); const dt = last ? Math.min(0.1, (ts - last) / 1000) : 0; last = ts;
    if (!ok()){ stop(); return; }
    if (st === 'jig' || st === 'res') due += kgps() * dt;
    if (st === 'jig' && pre && ts >= pre){ pre = 0; dupp(ts); }
    if (st === 'jig' && fNext && ts >= fNext){ fNext = ts + (5 + Math.random() * 9) * 1000; if (ts < tNext - 3500 && Math.random() < 0.6) dupp(ts); }
    if (st === 'jig' && ts >= tNext) set('bite', ts);
    else if (st === 'bite' && (ts - t0) / 1000 > SWEEP){ mult = grade(null); land(mult); set('res', ts);
      // two bites in a row without a strike: you have put it down, so the jig fishes on its own again (Adrian 05.10.2026: «får ingenting
      // hvis æ ikke fiske manuelt»)
      if (++miss >= 2){ stop(); renderActs(); toast(L('Du rykket ikke, så juksa fisker av seg selv igjen.', 'You did not strike, so the jig fishes on its own again.')); return; } }
    else if (st === 'res' && ts - t0 > 1300){ set('jig', ts); schedule(ts); }
    render(ts);
  }
  function render(ts){
    const u = st === 'bite' ? clamp((ts - t0) / 1000 / SWEEP, 0, 1) : 0.5;
    needle.style.left = (u * 100).toFixed(1) + '%';
    const res = got ? (got.n ? (got.m === 2 ? L('2× · to på kroken!', '2× · two on the hooks!') : got.m === 1.5 ? L('1,5× · godt rykk', '1.5× · a good strike') : got.m === 1 ? L('1× · fisk', '1× · a fish') : L('0,5× · tidlig eller seint', '0.5× · early or late')) + ' · ' + fmt(got.kg || 0, 1) + ' kg' : L('Fisken slapp', 'It got away')) : '';
    msgEl.textContent = st === 'bite' ? L('NAPP! Rykk når nåla er midt på', 'BITE! Strike as the needle is in the middle') : st === 'res' ? res : ts - dupT < 1100 ? L('Det dupper i snøret …', 'A nudge on the line …') : L('Vent på napp …', 'Wait for a bite …');
    el.dataset.st = st; el.querySelector('.jig-bar').style.visibility = st === 'bite' ? 'visible' : 'hidden';
    // always «Rykk»; red when it bites (Jonas 05.10.2026)
    btn.textContent = L('Rykk', 'Strike'); btn.disabled = st === 'res';
  }
  function press(e){ if (e) e.preventDefault(); const now = performance.now(); if (st !== 'bite') return; miss = 0; mult = grade((now - t0) / 1000 - SWEEP / 2); land(mult); set('res', now); render(now); }
  btn.addEventListener('pointerdown', press);
  function start(){ if (on || !ok()) return; on = true; window.jigActive = true; el.hidden = false; due = 0; debt = 0; got = null; miss = 0; set('jig', performance.now()); schedule(performance.now()); last = 0; raf = requestAnimationFrame(loop); render(performance.now()); }
  function stop(){ on = false; window.jigActive = false; el.hidden = true; if (raf) cancelAnimationFrame(raf); raf = 0; }
  return {start, stop, toggle(){ on ? stop() : start(); }, ok, state:() => ({on, st, due, debt, mult, got}), grade, kgps,
    _bite(){ tNext = 0; }, _hit(off){ if (st !== 'bite') return null; due = due || 10; mult = grade(off); land(mult); set('res', performance.now()); return got; }};
})();
hooks.onView = on => { if (on && SETM) setModeEnd(false, true); setBodyView(on); if (on) loaderGone(); $('view3d').textContent = on ? t('view_chart') : '3D'; if (!on){ tab = 'route'; renderPanel(); applyView(); renderStatic(); renderDyn(); } $('legend').hidden = !S.settings.plotter || on; updateMapButtons(); panelDirty = true; };
$('modeBtn').onclick = () => {
  if (G3.isActive()){ G3.setHelm(!G3.isHelm()); updateMapButtons(); return; }
  if (!S.equip.plotter){ toast(t('need_plotter')); PHONE.open('utstyrb'); return; }
  S.settings.plotter = !S.settings.plotter; save(); renderBase(); scheduleStatic();
};
$('phoneBtn').onclick = () => PHONE.toggle();
// the tub is full: the jig stops while you gut, and starts again after (a toast says so, with how long in real time)
// a mile off her own gear (core/16b-dyn.js gearWatch; spilltest 3, U2): the anchor alarm's beeps and a word, with «Kjør dit» in the HUD
hooks.onGearFar = nb => { try { SND.anchorAlarm(); } catch (e){} toast(S.lang === 'no' ? 'Båten har drevet ' + fmt(nb.d / NM, 1) + ' nm fra blåsa. «Kjør dit» står i infoboksen.' : 'The boat has drifted ' + fmt(nb.d / NM, 1) + ' nm from the buoy. «Go there» is in the info box.', 6000); renderHud(); };
hooks.onDeck = k => { const L = (no, en) => S.lang === 'no' ? no : en;
  if (k === 'stop'){ const e = deckEta(deckHands()); toast(L('Bløggekaret er fullt. Du sløyer og iser fangsten' + (e < Infinity ? ' (ca. ' + durBoth(e) + ')' : '') + ', så fisker du videre.', 'The bleeding tub is full. You gut and ice the catch' + (e < Infinity ? ' (about ' + durBoth(e) + ')' : '') + ', then you fish on.')); }
  else toast(L('Ferdig på dekk. Du fisker videre.', 'Deck work done. You fish on.')); };
hooks.onEquip = () => { updateMapButtons(); INSTR.show(); heatReset(); };
// the queue at the plant (core/07-harbours.js, K3): the strip, the dock and the Lever page follow it; the first answer as a toast
hooks.onLandQ = (Q, first) => { renderHud(); panelDirty = true; if (typeof renderActs === 'function') renderActs(); if (typeof DOCK !== 'undefined' && DOCK.page === 'lever' && DOCK.open) DOCK.open('lever');
  if (Q && first) toast(landQText(false)[0] + (S.lang === 'no' ? '. Lossingen starter av seg selv. «Lever» viser mottakene i nærheten.' : '. The landing starts by itself. «Land» shows the plants near by.'), 9000); };
// the coast radio is heard as it is sent (core/06-services.js radio): what it sent while the time away was played (catchUp, LANDQ.away)
// was not heard, and stays in the deck log only; before, every forecast from the hours away came up on the screen, 15 s each, in a row
// once the coast had loaded (tilbakemelding #119)
hooks.onRadio = (no, en) => { if (!LANDQ.away) toast('📻 Kystradio: ' + (S.lang === 'no' ? no : en), 15000); };
hooks.onMsg = () => { PHONE.setBadge(); const m = S.msgs[S.msgs.length - 1]; if (m && !PHONE.isOpen()) toast('✉ ' + m.from + ': ' + (S.lang === 'no' ? m.no : m.en), 10000); if (PHONE.isOpen() && (PHONE.app === 'meld' || PHONE.app === 'home')) PHONE.render(); };
$('instrBtn').onclick = () => { S.settings.instr = S.settings.instr === false; save(); updateMapButtons(); INSTR.show(); };
// the chart is drawn once the game is built (11-boot.js); a theme change before that waits for it
if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (S && SIMREADY) renderBase(); });
$('lang').onclick = () => { S.lang = S.lang === 'no' ? 'en' : 'no'; refreshAll(); save(); };
$('pace').onchange = e => { if (WCLOCK.on){ e.target.value = '1'; return; } S.mult = +e.target.value; save(); };
function refreshAll(){ applyLang(); renderTabs(); applyView(); renderBase(); renderStatic(); renderDyn(); renderHud(); renderClock(); renderPanel(); $('pace').value = String(S.mult); }

