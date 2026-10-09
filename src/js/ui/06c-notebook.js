// ===== Father's naust: setting it to rights and the trophy wall (core/07c-naust.js), and the fight with the dream fish (core/09b-dream.js) =====
// The page «Naustet» opens from the dock when the boat lies at Father's naust, and only there (Jonas 09.10.2026: «Muligheten til å
// oppgradere fars naust skal bare være tilgjengelig om man ligger ved fars naust. Samme med trofeveggen»). Father's notebook and his marks
// on the chart were taken out the same day.
// The fight: one bar for the strain on the line and one for the line out. Hold «Sveiv» to take line in; the strain rises, and fast if
// you hold while the fish runs. Let go before it has been red for half a second, or the line parts; let it take 120 m and it is gone.
// With the line in and the fish tired, it is gaffed; with the line in and the fish fresh, it dives again. 20 seconds without a touch
// and the crew takes it over (if there is anyone else aboard).
const NOTEBOOK = (() => {
  const L = (no, en) => S.lang === 'no' ? no : en;
  const day = t => dayStr(t / 60).replace(/^\S+ /, '');
  const atNaust = () => S.boat.status === 'port' && berthKind(S.boat) === 'naust';
  function page(){
    const h = ['<div class="nb-paper">'];
    if (!atNaust()){ h.push('<p class="nb-lead">' + L('Naustet og trofeveggen er hjemme ved fars naust. Legg til der for å se dem.', 'The naust and the trophy wall are at Father\u2019s naust. Moor there to see them.') + '</p></div>'); return h.join(''); }
    // the naust: set it to rights step by step (core/07c-naust.js)
    h.push('<h3 class="nb-hand nb-h">' + L('Naustet', 'The boathouse') + '</h3><p class="nb-lead">' + L('Naustet trenger en hånd. Snekkeren tar jobben når du ligger i hjemhavna.', 'The boathouse needs a hand. The carpenter does the work while you lie in the home harbour.') + '</p>');
    for (const U of NAUST_UP){ const done = naustHas(U.k), why = done ? null : naustWhy(U.k);
      h.push('<div class="nb-up' + (done ? ' done' : '') + '"><div><b>' + L(U.no, U.en) + '</b><small>' + L(U.d[0], U.d[1]) + '</small></div>' + (done ? '<span class="nb-stamp">✓ ' + L('Gjort', 'Done') + '</span>' :
        '<button class="ph-btn' + (why ? ' alt' : ' p') + '" data-pa="naustbuy" data-k="' + U.k + '"' + (why ? ' disabled title="' + L(why[0], why[1]) + '"' : '') + '>' + kr(U.kr) + '</button>') + '</div>');
    }
    { const w = NAUST_UP.map(U => !naustHas(U.k) && naustWhy(U.k)).find(Boolean); if (w && w[0] !== 'Du har ikke nok penger.') h.push('<p class="ph-note">' + L(w[0], w[1]) + '</p>'); }
    // the trophy wall
    const T = (S.trophies || []).slice(), rec = {};
    for (const x of T) if (!rec[x.sp] || x.kg > rec[x.sp].kg) rec[x.sp] = x;
    h.push('<h3 class="nb-hand nb-h">' + L('Trofeveggen', 'The trophy wall') + '</h3>' + (naustHas('vegg') ? '<p class="nb-lead">' + L('Den henger i naustet nå.', 'It hangs in the boathouse now.') + '</p>' : ''));
    if (!T.length) h.push('<p class="nb-lead">' + L('Ingen storfisk ennå. Noen ganger tar noe stort juksa: en kveite på over hundre kilo, en skrei på 30 eller en lange på 25. Sveiv når snøret tåler det, og slipp når fisken drar.', 'No big fish yet. Sometimes something big takes the jig: a halibut of over a hundred kilos, a skrei of 30 or a ling of 25. Reel when the line can take it, and let go when the fish runs.') + '</p>');
    else {
      h.push('<div class="nb-recs">' + Object.values(rec).sort((a, b) => b.kg - a.kg).map(x => '<div class="nb-rec"><b>' + SPECIES[x.sp][S.lang] + '</b><span>' + fmt(x.kg, 1) + ' kg</span><small>' + x.at + ' · ' + day(x.t) + '</small></div>').join('') + '</div>');
      h.push('<table class="ph-tbl nb-tbl"><tr><th>' + L('Fisk', 'Fish') + '</th><th>kg</th><th>' + L('Hvor', 'Where') + '</th><th>' + L('Når', 'When') + '</th></tr>' +
        T.sort((a, b) => b.t - a.t).slice(0, 15).map(x => '<tr><td>' + SPECIES[x.sp][S.lang] + (x.rel ? L(' (satt ut)', ' (released)') : '') + (x.crew ? ' ⚓' : '') + '</td><td>' + fmt(x.kg, 1) + '</td><td>' + x.at + '</td><td>' + day(x.t) + '</td></tr>').join('') + '</table>' +
        '<p class="ph-note">' + L('⚓: tatt av mannskapet.', '⚓: taken by the crew.') + '</p>');
    }
    h.push('</div>');
    return h.join('');
  }
  // on the chart: Father's naust, a small house on the shore by the home harbour
  function svg(u, inV){
    const g = [], ns = S.naust && S.naust.o; if (ns && view.z > 2.2){ const x = ns[0] / 1000, y = ns[1] / 1000, s = 4.5 * u; if (inV(x, y)){
      g.push('<path d="M' + (x - s) + ',' + (y + s * 0.8) + 'v' + (-s * 1.1) + 'l' + s + ',' + (-s * 0.9) + 'l' + s + ',' + (s * 0.9) + 'v' + (s * 1.1) + 'z" class="nbh" stroke-width="' + (1.2 * u) + '"/>');
      if (view.z > 3) g.push(txt({x:x + 7 * u, y:y + 4 * u}, S.lang === 'no' ? 'Fars naust' : 'Father\u2019s boathouse', 'lbl-nb', 12 * u, 'stroke-width="' + (2.5 * u) + '"')); } }
    return g.join('');
  }
  return {page, svg, atNaust};
})();
// the fight with the dream fish
window.DREAMUI = (() => {
  let on = false, raf = 0, last = 0, s = null, resT = 0;
  const el = document.createElement('div'); el.id = 'dreamUI'; el.hidden = true;
  el.innerHTML = '<div class="dr-h"></div><div class="dr-sub"></div><div class="dr-lab"><span class="a"></span><span class="b"></span></div><div class="dr-bar dr-ten"><i></i></div>' +
    '<div class="dr-lab"><span class="c"></span><span class="d"></span></div><div class="dr-bar dr-line"><i></i></div><button type="button" class="dr-btn"></button>';
  document.body.appendChild(el);
  const $e = q => el.querySelector(q), btn = $e('.dr-btn');
  const L = (no, en) => S.lang === 'no' ? no : en;
  const buzz = ms => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e){} };
  function start(){
    if (on) return true; const D = S.dream; if (!D) return false;
    const X = DREAM[D.sp], big = clamp((D.kg - X.min) / (X.max - X.min), 0, 1);
    s = {line:40, ten:0, red:0, sta:1, run:0, runS:0, hold:false, idle:0, str:0.55 + 0.45 * big + (D.sp === 'kveite' ? 0.2 : 0), t:0, res:null};
    if (window.JIGG) window.JIGG.stop();
    on = true; resT = 0; el.hidden = false; el.dataset.st = 'fight'; last = 0; buzz([80, 60, 120]); raf = requestAnimationFrame(loop); render(); return true;
  }
  function end(won, why){
    on = false; s.hold = false; const D = S.dream, r = won === null ? dreamEnd(handsAboard() >= 2 && Math.random() < 0.5, true) : dreamEnd(won, false);
    s.res = {won:!!(r && r.won), why, sp:D && D.sp, kg:D && D.kg, rel:r && r.rel, crew:won === null};
    el.dataset.st = 'res'; resT = performance.now(); render(); save(); if (typeof refreshAll === 'function') refreshAll();
  }
  function close(){ el.hidden = true; s = null; if (raf) cancelAnimationFrame(raf); raf = 0; }
  function loop(ts){
    raf = requestAnimationFrame(loop);
    if (!on){ if (resT && ts - resT > 6000) close(); return; }
    const spd = window.DREAMSPD || 1, dt = (last ? Math.min(0.05, (ts - last) / 1000) : 0) * spd; last = ts; s.t += dt;
    // the fish: runs at random, more often and longer while it is fresh
    if (s.run > 0) s.run -= dt;
    else if (Math.random() < dt * (0.1 + 0.35 * s.sta)){ s.run = 0.6 + Math.random() * 2.2 * s.sta + 0.3; s.runS = s.str * (0.7 + Math.random() * 0.6); buzz(70); }
    const run = s.run > 0;
    // the strain: reeling raises it, and a run while you reel much more; it eases when you let go
    if (s.hold) s.ten += dt * (0.32 + (run ? 1.1 * s.runS : 0)); else s.ten -= dt * (run ? 0.35 : 0.9);
    s.ten = clamp(s.ten, 0, 1.25);
    // the line: in while you reel (slowly in a run), out while it runs (the brake gives a little even when you hold)
    if (s.hold) s.line -= dt * (run ? 0.8 : 4.2);
    if (run) s.line += dt * (s.hold ? 2 : 9) * s.runS;
    // it tires while the strain is on
    s.sta = Math.max(0, s.sta - dt * (s.ten > 0.3 ? 0.04 + 0.045 * Math.min(1, s.ten) : 0.008) / (0.6 + 0.6 * s.str));
    if (s.line <= 2){ if (s.sta < 0.35) return end(true, 'gaff'); s.line = 2; s.run = 1.2 + s.sta * 2; s.runS = s.str; buzz(90); }
    if (s.ten >= 1){ s.red += dt; if (s.red > 0.5) return end(false, 'snap'); } else s.red = Math.max(0, s.red - dt * 2);
    if (s.line >= 120) return end(false, 'out');
    s.idle = s.hold ? 0 : s.idle + dt / spd; if (s.idle > 20) return end(null, 'crew');
    render();
  }
  function render(){
    if (!s) return;
    if (s.res){
      const r = s.res, nm = r.sp ? SPECIES[r.sp][S.lang].toLowerCase() : '';
      $e('.dr-h').textContent = r.won ? (L('En ', 'A ') + nm + L(' på ', ' of ') + fmt(r.kg, 1) + ' kg!') : r.why === 'snap' ? L('Snøret røk.', 'The line parted.') : r.why === 'out' ? L('Den tok all lina.', 'It took all the line.') : L('Den slet seg.', 'It got away.');
      $e('.dr-sub').textContent = r.won ? (r.rel ? L('Kveita er fredet nå, så den gikk ut igjen. Den står på trofeveggen i naustet.', 'Halibut is protected now, so it went back. It is on the trophy wall in the naust.') : (r.crew ? L('Mannskapet fikk den inn. ', 'The crew got it in. ') : '') + L('Den ligger i lasten og kommer på trofeveggen i naustet.', 'It is in the hold and goes on the trophy wall in the naust.')) : L('Det var noe stort: ' + nm + ', kanskje ' + fmt(r.kg, 0) + ' kg.', 'It was something big: a ' + nm + ', perhaps ' + fmt(r.kg, 0) + ' kg.');
      btn.textContent = 'OK'; return;
    }
    const run = s.run > 0;
    $e('.dr-h').textContent = L('Noe stort tok juksa!', 'Something big took the jig!');
    $e('.dr-sub').textContent = run ? L('Den drar! Slipp sveiva.', 'It runs! Let go of the reel.') : s.ten > 0.8 ? L('Snøret strammer seg …', 'The line is tight …') : s.line <= 8 && s.sta >= 0.35 ? L('Den er ved båten, men har krefter igjen.', 'It is at the boat, but has strength left.') : L('Hold for å sveive inn.', 'Hold to reel in.');
    $e('.dr-lab .a').textContent = L('Belastning', 'Strain'); $e('.dr-lab .b').textContent = Math.round(Math.min(1, s.ten) * 100) + ' %';
    $e('.dr-lab .c').textContent = L('Line ute', 'Line out'); $e('.dr-lab .d').textContent = Math.round(s.line) + ' m';
    const ti = $e('.dr-ten i'); ti.style.width = (Math.min(1, s.ten) * 100).toFixed(1) + '%'; ti.style.background = s.ten >= 1 ? '#d6336c' : s.ten > 0.75 ? '#f2b705' : '#35b37e';
    $e('.dr-line i').style.width = (s.line / 120 * 100).toFixed(1) + '%';
    el.dataset.run = run ? '1' : ''; el.dataset.red = s.ten >= 1 ? '1' : '';
    btn.textContent = L('Sveiv', 'Reel'); btn.classList.toggle('on', s.hold);
  }
  const down = e => { if (e) e.preventDefault(); if (!s) return; if (s.res){ close(); return; } s.hold = true; s.idle = 0; render(); };
  const up = e => { if (s && !s.res){ s.hold = false; render(); } };
  btn.addEventListener('pointerdown', down);
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) btn.addEventListener(ev, up);
  addEventListener('keydown', e => { if (on && e.code === 'Space' && !e.repeat){ e.preventDefault(); down(); } });
  addEventListener('keyup', e => { if (on && e.code === 'Space') up(); });
  // a fight is the crew's when the page goes away
  document.addEventListener('visibilitychange', () => { if (document.hidden && on) end(null, 'crew'); });
  return {start, active:() => on, state:() => s && {...s}, _hold(v){ if (s && !s.res){ s.hold = !!v; s.idle = 0; } }, close};
})();
