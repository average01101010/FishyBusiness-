// ===== Driftsplan 2, part 6: the chart plotter in plan mode (docs/planer/driftsplan-2/02-design.md 4.2). «Velg i kartet …» on the
// Plasser row opens the plotter itself, with a bar over the chart (Felt / Juksplass / Ferdig): a tap in the sea adds a place of the
// kind chosen, a pin dragged moves it, a tap on a pin opens its card (units, soak, order, remove). The state lives here, not on the
// page, so a redraw of the page cannot cut the picking short (the old DRIFTCTX did, tilbakemelding #95). Hooked into 03-map.js:
// tap, grab, drag and renderDyn. The places are checked as on the page (PLAN2UI.placeWhy: land, depth, the rules).
const PLANMAP = (() => {
  const L = (no, en) => S.lang === 'no' ? no : en;
  let on = false, vid = null, tool = 'felt', sel = null;
  const bar = document.createElement('div'); bar.id = 'pmBar'; bar.hidden = true;
  const card = document.createElement('div'); card.id = 'pmCard'; card.hidden = true;
  { const host = $('aisCard'); host.after(bar); host.after(card); }
  const ops = () => { const o = typeof plan2Ops === 'function' ? plan2Ops() : null; return o && vid === S.cur ? o : null; };
  const labels = o => { const fi = {felt:0, juks:0}, out = {}; for (const q of o.places){ fi[q.k]++; out[q.id] = q.k === 'felt' ? L('Felt ', 'Field ') + fi[q.k] : L('Juksplass ', 'Jig place ') + fi[q.k]; } return out; };
  const find = (o, id) => o ? o.places.find(p => p.id === id) : null;
  // the string of a field: its length from the units (startSet: the line by hooks, nets and pots by the unit), and where it ends for a heading
  const stringKm = (o, q) => { const kind = p2Kind(o); if (!kind) return 0; return kind === 'line' ? q.n * LINE_KINDS[q.lk || 'hyse'].hooks * GEAR.line.kmHook : q.n * GEAR[kind].km; };
  const stringEnd = (q, hdg, km) => ({x:q.x + Math.sin(hdg) * km, y:q.y - Math.cos(hdg) * km});
  const degOf = (q, hdg) => Math.round(((typeof trueDeg === 'function' ? trueDeg(hdg, q) : hdg * 180 / Math.PI) % 360 + 360) % 360);
  const hit = (o, mp, rr) => { let best = null, bd = rr; for (const q of o.places){ const d = dist(q, mp); if (d < bd){ bd = d; best = q; } } return best; };
  // the chart round the whole plan: home, the plant and the places
  function fit(o){
    const pts = o.places.slice(), hp = portById(o.home), mp = o.M ? portById(o.M) : null; if (hp) pts.push(hp.p); if (mp) pts.push(mp.p); if (!pts.length) return;
    const xs = pts.map(p => p.x), ys = pts.map(p => p.y), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    view.cx = (x0 + x1) / 2; view.cy = (y0 + y1) / 2;
    const span = Math.max(x1 - x0, y1 - y0) * 1.5 + 2; view.z = clamp(view.z * PLOT_KM / Math.max(PLOT_KM, span), ZMIN, ZMAX);
    applyView(); scheduleStatic();
  }
  function open(){
    const o = typeof plan2Ops === 'function' ? plan2Ops() : null; if (!o) return false;
    vid = S.cur; on = true; sel = null; tool = p2Kind(o) ? 'felt' : 'juks'; document.body.classList.add('pm');   // (body.pm hides the HUD under the bar)
    if (typeof PHONE !== 'undefined' && PHONE.show) PHONE.show(false); if (typeof DOCK !== 'undefined' && DOCK.close) DOCK.close();
    openPlotter(); fit(o); render(); renderDyn(); return true;
  }
  // «Ferdig»: back to the page, where the day is reckoned anew from the places
  function close(){ if (!on) return; on = false; sel = null; bar.hidden = card.hidden = true; document.body.classList.remove('pm'); if (typeof save === 'function') save(); renderDyn(); if (typeof DOCK !== 'undefined' && DOCK.open) DOCK.open('drift'); else if (typeof PHONE !== 'undefined' && PHONE.open) PHONE.open('drift'); }
  function changed(){ if (typeof save === 'function') save(); render(); renderDyn(); }
  function render(){
    const o = ops(); if (!on || !o){ bar.hidden = card.hidden = true; return; }
    const kind = p2Kind(o), lb = labels(o), full = o.places.length >= DRP2.placesMax;
    bar.hidden = false;
    bar.innerHTML = '<div class="pm-h"><b>' + L('Driftsplan: plassene til «', 'Operations plan: the places of «') + S.boatName + '»</b><button type="button" data-pm="done">' + L('Ferdig', 'Done') + '</button></div>' +
      '<div class="pm-t">' + (kind ? '<button type="button" data-pm="tool" data-k="felt" class="' + (tool === 'felt' ? 'on' : '') + '">' + L('Felt', 'Field') + '</button>' : '') +
      (p2Jig(o) ? '<button type="button" data-pm="tool" data-k="juks" class="' + (tool === 'juks' ? 'on' : '') + '">' + L('Juksplass', 'Jig place') + '</button>' : '') +
      '<span class="pm-hint">' + (full ? L('Planen har ' + DRP2.placesMax + ' plasser, det er alt den tar.', 'The plan has ' + DRP2.placesMax + ' places, all it takes.') : L('Trykk i sjøen for å legge til · dra en nål for å flytte · trykk en nål for antall, ståtid og retning', 'Tap the sea to add · drag a pin to move it · tap a pin for units, soak and heading')) + '</span></div>' + dayLine(o);
    const q = find(o, sel); if (!q){ card.hidden = true; return; }
    const i = o.places.indexOf(q), isF = q.k === 'felt', hp = portById(o.home), m = typeof planMark === 'function' ? planMark(q, isF ? kind : null) : null;
    const dkm = hp ? fmt(dist(hp.p, q) / NM, 1) + L(' nm fra hjem', ' nm from home') : '';
    const own = m ? (isF ? L(' · sist ' + fmt(m.kgu, 1) + ' kg per ' + GEAR[kind].u[0] + ' etter ' + Math.round(m.soak || 0) + ' t', ' · last ' + fmt(m.kgu, 1) + ' kg a ' + GEAR[kind].u[2] + ' after ' + Math.round(m.soak || 0) + ' h') : L(' · sist ' + m.kgph + ' kg/t', ' · last ' + m.kgph + ' kg/h')) : L(' · ikke fisket her ennå', ' · not fished here yet');
    card.hidden = false;
    card.innerHTML = '<div class="ai-h"><b>' + lb[q.id] + '</b><button type="button" data-pm="x" aria-label="' + L('Lukk', 'Close') + '">×</button></div>' +
      (isF ? (kind === 'line' && ['hyse', 'bank'].filter(lk => p2Units('line', lk) > 0).length > 1 ? '<div class="pm-kv"><span>' + L('Line', 'Line') + '</span><span><button type="button" data-pm="lk" class="pm-w">' + LINE_KINDS[q.lk || 'hyse'].no + ' ⇄</button></span></div>' : '') +
        '<div class="pm-kv"><span>' + (kind === 'line' ? LINE_KINDS[q.lk || 'hyse'].no : L(GEAR[kind].no, GEAR[kind].en)) + '</span><span><button type="button" data-pm="n" data-d="-1" aria-label="−">−</button><b>' + q.n + ' ' + unitName(kind, q.n) + ' <small>' + L('av ', 'of ') + Math.max(0, p2Left(o, q)) + '</small></b><button type="button" data-pm="n" data-d="1" aria-label="+">+</button></span></div>' +
        '<div class="pm-kv"><span>' + L('Ståtid', 'Soak') + '</span><span><button type="button" data-pm="s" data-d="-1" aria-label="−">−</button><b>' + q.soak + ' t</b><button type="button" data-pm="s" data-d="1" aria-label="+">+</button></span></div>' +
        '<div class="pm-kv"><span>' + L('Lenka', 'The string') + ' <small>' + fmt(stringKm(o, q), 1) + ' km</small></span><span><button type="button" data-pm="h" data-d="-15" aria-label="↶">↶</button><b>' + (q.hdg == null ? L('etter kursen', 'by the course') : degOf(q, q.hdg) + '°') + '</b><button type="button" data-pm="h" data-d="15" aria-label="↷">↷</button>' + (q.hdg != null ? '<button type="button" data-pm="h0" class="pm-w">' + L('fri', 'free') + '</button>' : '') + '</span></div>' : '') +
      '<div class="ai-t">' + dkm + own + '</div>' +
      '<div class="pin-b"><button type="button" data-pm="up"' + (i ? '' : ' disabled') + ' aria-label="' + L('Før', 'Earlier') + '">↑</button><button type="button" data-pm="dn"' + (i < o.places.length - 1 ? '' : ' disabled') + ' aria-label="' + L('Etter', 'Later') + '">↓</button><button type="button" data-pm="del">' + L('Fjern', 'Remove') + '</button></div>';
  }
  // the day as the page reckons it from the places (PLAN2UI.preview): its length and the hour home
  function dayLine(o){ let P = null; try { P = PLAN2UI.preview(o); } catch (e){} if (!P || !P.day) return ''; const d = P.day, h = d.home != null ? d.home - d.t0 : 24;
    return '<div class="pm-day">' + (o.rhythm === 'watch' ? L('Døgndrift: to vakter à 12 t', 'Round the clock: two watches of 12 h') : L('Dagen blir ' + fmt(h, 1) + ' t' + (d.home != null ? ', hjemme kl. ' + driftClock(driftHod(d.home)) : ''), 'The day comes to ' + fmt(h, 1) + ' h' + (d.home != null ? ', home at ' + driftClock(driftHod(d.home)) : ''))) + (h > DRP2.dayMax + 0.1 ? ' · ' + L('over ' + DRP2.dayMax + ' t: mannskapet blir slitne', 'over ' + DRP2.dayMax + ' h: the crew will be tired') : '') + '</div>'; }
  function act(el){
    const o = ops(); if (!o) return; const a = el.dataset.pm, q = find(o, sel), i = q ? o.places.indexOf(q) : -1;
    if (a === 'done'){ close(); return; }
    if (a === 'tool'){ tool = el.dataset.k; render(); return; }
    if (a === 'x'){ sel = null; render(); renderDyn(); return; }
    if (!q) return;
    if (a === 'n') PLAN2UI.act('p2-pn', {id:q.id, d:el.dataset.d});
    else if (a === 'lk') PLAN2UI.act('p2-plk', {id:q.id});
    // the string's heading, in steps of 15 degrees: the string must fit in the sea there (startSet setGeomExact), else the turn is refused and said
    else if (a === 'h'){ const d = (+el.dataset.d) * Math.PI / 180, h0 = q.hdg != null ? q.hdg : (S.boat.heading || 0), hdg = ((h0 + d) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
      let okG = false; try { okG = !!setGeomExact(q, hdg, stringKm(o, q)); } catch (e){ okG = true; }
      if (!okG){ toast(L('Lenka går på land eller for grunt i den retningen. Prøv en annen.', 'The string runs on land or too shallow that way. Try another.')); return; } q.hdg = hdg; }
    else if (a === 'h0') q.hdg = null;
    else if (a === 's') PLAN2UI.act('p2-ps', {id:q.id, d:el.dataset.d});
    else if (a === 'up' || a === 'dn') PLAN2UI.act(a === 'up' ? 'p2-pup' : 'p2-pdn', {i:String(i)});
    else if (a === 'del'){ PLAN2UI.act('p2-pdel', {id:q.id}); sel = null; }
    changed();
  }
  for (const el of [bar, card]) el.addEventListener('click', e => { const b = e.target.closest('[data-pm]'); if (b && !b.disabled) act(b); });
  // ---- the chart: a tap adds a place or opens a pin's card; a pin dragged moves (03-map.js pointer handlers)
  function tap(mp, rr){
    const o = ops(); if (!on || !o) return false;
    const q = hit(o, mp, rr); if (q){ sel = q.id; render(); renderDyn(); return true; }
    if (o.places.length >= DRP2.placesMax){ toast(L('Planen har alt ' + DRP2.placesMax + ' plasser.', 'The plan already has ' + DRP2.placesMax + ' places.')); return true; }
    if (tool === 'felt' && !p2Kind(o)) tool = 'juks';
    if (PLAN2UI.put(o, tool, mp)){ sel = o.places[o.places.length - 1].id; changed(); }   // (put says why a place is refused)
    return true;
  }
  function grab(mp){ const o = ops(); if (!on || !o) return null; const q = hit(o, mp, 14 / view.px); return q ? {id:q.id, before:{x:q.x, y:q.y}, moved:false} : null; }
  function dragMove(g, mp){ const q = find(ops(), g.id); if (!q) return; q.x = mp.x; q.y = mp.y; g.moved = true; renderDyn(); }
  function dragEnd(g){
    const o = ops(), q = find(o, g.id); if (!q) return;
    if (!g.moved){ sel = q.id; render(); renderDyn(); return; }
    const why = PLAN2UI.placeWhy(o, q.k, q); if (why){ q.x = g.before.x; q.y = g.before.y; toast(why); }
    sel = q.id; changed();
  }
  function dragCancel(g){ const q = find(ops(), g.id); if (q){ q.x = g.before.x; q.y = g.before.y; } renderDyn(); }
  // the plan on the chart: home, the plant, the places numbered in their order, and the way between them, thin
  function svg(u){
    const o = ops(); if (!on || !o) return '';
    const g = [], lb = labels(o), hp = portById(o.home), mp = o.M ? portById(o.M) : null;
    const pin = (p, s, c, big) => { g.push('<circle cx="' + p.x.toFixed(3) + '" cy="' + p.y.toFixed(3) + '" r="' + ((big ? 8.5 : 6.5) * u).toFixed(3) + '" fill="' + c + '" stroke="' + (big ? '#ffd95e' : '#fff') + '" stroke-width="' + ((big ? 3 : 2) * u).toFixed(3) + '"/>'); g.push(txt({x:p.x + 9 * u, y:p.y - 7 * u}, s, 'wpn', 12 * u, 'stroke-width="' + (3 * u) + '"')); };
    if (hp && o.places.length){ const pts = [hp.p].concat(o.places, [hp.p]); g.push('<polyline points="' + pts.map(p => p.x.toFixed(3) + ',' + p.y.toFixed(3)).join(' ') + '" fill="none" stroke="#ffd95e" stroke-opacity=".55" stroke-width="' + (1.5 * u).toFixed(3) + '" stroke-dasharray="' + (6 * u).toFixed(3) + ' ' + (5 * u).toFixed(3) + '"/>'); }
    if (hp) pin(o.homeA || hp.p, L('Hjem', 'Home'), '#29a36a');
    if (mp && mp.id !== o.home) pin(mp.p, mp.name, '#2f7fd0');
    for (const q of o.places) if (q.k === 'felt' && q.hdg != null){ const e = stringEnd(q, q.hdg, stringKm(o, q)); g.push('<line x1="' + q.x.toFixed(3) + '" y1="' + q.y.toFixed(3) + '" x2="' + e.x.toFixed(3) + '" y2="' + e.y.toFixed(3) + '" stroke="#d9822b" stroke-width="' + (3 * u).toFixed(3) + '" stroke-linecap="round" class="pm-string"/>'); }
    for (const q of o.places) pin(q, lb[q.id], q.k === 'felt' ? '#d9822b' : '#b05ad6', q.id === sel);
    return '<g class="pm">' + g.join('') + '</g>';
  }
  return {open, close, tap, grab, dragMove, dragEnd, dragCancel, svg, render, isOn:() => on, tool:k => { if (k) { tool = k; render(); } return tool; }, sel:() => sel};
})();
