// ===== Father's notebook, the trophy wall and the fight with the dream fish (05.10.2026; the rules are in core/09b-dream.js) =====
// The phone app «Notatbok»: Father's marks in his hand (Caveat on lined paper), each with the way from the harbour, how far, the place
// near by, the depth in fathoms and a word of his about the fish. «Vis i kartet» puts the circle the mark lies in on the chart (the
// point itself once it is found) and keeps it there. Below it the trophy wall: every dream fish landed, the record of each kind first.
// The fight: one bar for the strain on the line and one for the line out. Hold «Sveiv» to take line in; the strain rises, and fast if
// you hold while the fish runs. Let go before it has been red for half a second, or the line parts; let it take 120 m and it is gone.
// With the line in and the fish tired, it is gaffed; with the line in and the fish fresh, it dives again. 20 seconds without a touch
// and the crew takes it over (if there is anyone else aboard).
const FATHER = {
  torsk:['Når skreien går, står han på kanten mot djupet. Dra juksa sakte.', 'When the skrei runs, it stands on the edge of the deep. Jig slowly.'],
  hyse:['Hysa vil ha blaut bunn og stille vatn. Kjenn etter de små nappene.', 'Haddock wants soft bottom and quiet water. Feel for the small bites.'],
  sei:['Seien står der straumen river, i morgengry og kveldinga.', 'Saithe stands where the current runs, at dawn and in the evening.'],
  lange:['Langa ligger djupt i steinura. Ha nok lin, og ha tolmod.', 'Ling lies deep in the scree. Have line enough, and patience.'],
  kveite:['Kveita står der bunnen skrår, når straumen snur. Den store kommer når du minst venter det.', 'Halibut stands where the bottom slopes, as the tide turns. The big one comes when you least expect it.']
};
// what he wrote beside a mark, read once it is found
const FATHER_STORY = {
  torsk:['Her dro jeg min første skrei, fjorten år gammel. Far min sto bak meg og sa ingenting, men han smilte hele veien hjem.', 'Here I pulled my first skrei, fourteen years old. My father stood behind me and said nothing, but he smiled all the way home.'],
  hyse:['Mor ville alltid ha hyse til søndagsmiddagen. Her fikk jeg nok, også de årene det var smått ellers.', 'Mother always wanted haddock for Sunday dinner. Here I got enough, even in the years it was poor elsewhere.'],
  sei:['En høstkveld kokte det av sei her. Vi fylte båten på en time og var hjemme før det ble mørkt.', 'One autumn evening the sea boiled with saithe here. We filled the boat in an hour and were home before dark.'],
  lange:['Gamle Ole viste meg dette stedet. Han sa at den som har tolmod, får langa. Han hadde rett.', 'Old Ole showed me this place. He said the one with patience gets the ling. He was right.'],
  kveite:['Her mistet jeg den største fisken i mitt liv. Jeg så den ved ripa, bredere enn døra på naustet. Den er der fortsatt, tror jeg.', 'Here I lost the biggest fish of my life. I saw it at the rail, wider than the boathouse door. It is still there, I think.']
};
const NOTEBOOK = (() => {
  let busy = false;
  const L = (no, en) => S.lang === 'no' ? no : en;
  // the marks round the home harbour: made once its waters are loaded (and again after a move)
  function ready(){
    if (S.notes && S.notes.home === (S.home || 'finnsnes') && S.notes.marks && S.notes.marks.length) return true;
    if (busy) return false; busy = true;
    const home = noteHome();
    mapNeed(home.p, MAPD.simR).then(() => { busy = false; notesMake(); save(); if (PHONE.isOpen() && PHONE.app === 'notat') PHONE.render(); }, e => { busy = false; console.error(e); });
    return false;
  }
  const day = t => dayStr(t / 60).replace(/^\S+ /, '');
  function page(){
    const h = ['<div class="nb-paper">'];
    if (!ready()){ h.push('<p class="nb-hand">' + L('Du blar opp i fars notatbok …', 'You open Father’s notebook …') + '</p></div>'); return h.join(''); }
    const N = S.notes, home = portById(N.home), nf = N.marks.filter(m => N.found[m.id]).length;
    h.push('<h3 class="nb-hand nb-h">' + L('Fars méd', 'Father’s marks') + '</h3><p class="nb-lead">' +
      L('Notatboka lå i naustet. Far skrev ned stedene der fisken står, fra ' + home.name + '. Fisk innen 400 m fra et méd for å finne det. Der biter fisken bedre, og på Kveitebakken kommer storfisken oftere.',
        'The notebook was in the boathouse. Father wrote down where the fish stand, from ' + home.name + '. Fish within 400 m of a mark to find it. There the fish bite better, and on the halibut bank the big fish comes more often.') +
      ' <b>' + nf + ' / ' + N.marks.length + L(' funnet', ' found') + '</b>' + (noteAll() ? '<br>' + L('Du har funnet alle medene. Fars gamle pilk lå inni permen: litt bedre fangst overalt (+5 %).', 'You have found all the marks. Father’s old jig was inside the cover: a little better catch everywhere (+5 %).') : '') + '</p>');
    for (const m of N.marks){
      const nm = NOTE_NAME[m.sp], f = N.found[m.id], dir = m.dir[S.lang === 'no' ? 0 : 1];
      h.push('<div class="nb-mark' + (f ? ' found' : '') + '"><p class="nb-hand"><b>' + L(nm[0], nm[1]) + '.</b> ' + fmt(m.nm, 1) + L(' nm ' + dir + ' fra ' + home.name, ' nm ' + dir + ' of ' + home.name) +
        (m.near ? L(', mot ' + m.near, ', towards ' + m.near) : '') + '. ' + m.fv + L(' favner.', ' fathoms.') + '<br><i>' + L(FATHER[m.sp][0], FATHER[m.sp][1]) + '</i></p>' + (f ? '<p class="nb-hand nb-story">' + L(FATHER_STORY[m.sp][0], FATHER_STORY[m.sp][1]) + '</p>' : '') +
        '<div class="nb-row">' + (f ? '<span class="nb-stamp">✓ ' + L('Funnet ', 'Found ') + day(f) + '</span>' : '<span class="nb-sp">' + SPECIES[m.sp][S.lang] + '</span>') +
        '<button class="ph-btn alt" data-pa="notshow" data-id="' + m.id + '">' + L('Vis i kartet', 'Show on the chart') + '</button></div></div>');
    }
    // the trophy wall
    const T = (S.trophies || []).slice(), rec = {};
    for (const x of T) if (!rec[x.sp] || x.kg > rec[x.sp].kg) rec[x.sp] = x;
    h.push('<h3 class="nb-hand nb-h">' + L('Trofeveggen', 'The trophy wall') + '</h3>');
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
  // «Vis i kartet»: the circle (or the found point) on the chart, centred, and the chart shown
  function show(id){
    const N = S.notes, m = N && N.marks.find(x => x.id === id); if (!m) return;
    N.shown = N.shown || {}; N.shown[id] = 1; const c = N.found[id] ? m.p : m.c || m.p;
    PHONE.show(false); if (G3.isActive()) G3.toggle();
    view.cx = c.x; view.cy = c.y; view.z = Math.max(view.z, 4); save(); applyView(); renderStatic(); renderDyn();
  }
  // on the chart: the found marks as a pencil cross with the name, the circles looked up and not found yet
  function svg(u, inV){
    const N = S.notes; if (!N || !N.marks) return '';
    const g = [];
    for (const m of N.marks){
      const nm = NOTE_NAME[m.sp][S.lang === 'no' ? 0 : 1];
      if (N.found[m.id]){ if (!inV(m.p.x, m.p.y)) continue; const s = 5 * u;
        g.push('<path d="M' + (m.p.x - s) + ',' + (m.p.y - s) + 'L' + (m.p.x + s) + ',' + (m.p.y + s) + 'M' + (m.p.x + s) + ',' + (m.p.y - s) + 'L' + (m.p.x - s) + ',' + (m.p.y + s) + '" class="nbx" stroke-width="' + (2.2 * u) + '"/>');
        if (view.z > 2.5) g.push(txt({x:m.p.x + 7 * u, y:m.p.y - 5 * u}, nm, 'lbl-nb', 12 * u, 'stroke-width="' + (2.5 * u) + '"')); }
      else if (N.shown && N.shown[m.id] && m.c){ if (!inV(m.c.x, m.c.y)) continue;
        g.push('<circle cx="' + m.c.x + '" cy="' + m.c.y + '" r="0.5" class="nbc" stroke-width="' + (1.8 * u) + '" stroke-dasharray="' + (6 * u) + ' ' + (4 * u) + '"/>');
        if (view.z > 1.5) g.push(txt({x:m.c.x + 0.52, y:m.c.y}, nm + '?', 'lbl-nb', 12 * u, 'stroke-width="' + (2.5 * u) + '"')); }
    }
    return g.join('');
  }
  return {page, show, svg, ready};
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
      $e('.dr-sub').textContent = r.won ? (r.rel ? L('Kveita er fredet nå, så den gikk ut igjen. Den står på trofeveggen i notatboka.', 'Halibut is protected now, so it went back. It is on the trophy wall in the notebook.') : (r.crew ? L('Mannskapet fikk den inn. ', 'The crew got it in. ') : '') + L('Den ligger i lasten og står på trofeveggen i notatboka.', 'It is in the hold and on the trophy wall in the notebook.')) : L('Det var noe stort: ' + nm + ', kanskje ' + fmt(r.kg, 0) + ' kg.', 'It was something big: a ' + nm + ', perhaps ' + fmt(r.kg, 0) + ' kg.');
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
