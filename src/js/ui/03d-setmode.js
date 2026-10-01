// ---------- «Sett ut»: draw the gear on the chart as a line out from the boat, as long as the gear is, and confirm ----------
// The line starts at the boat and is exactly as long as the string: nets 30 m each, line 1.5 m a hook, pots 25 m apart, the same
// lengths startSet uses (core/10-gear.js). Drag its end, or tap the chart, to turn it; − and + change how much goes out where that
// can change (a net string is set whole). The line turns red with the reason when its end is on land or in under 5 m of water, when
// it crosses land, or when the rules say no. «Sett ut» sets it exactly where it is drawn. SETM itself is declared in 03-map.js.
const setUnitKm = c => c.kind === 'garn' ? GEAR.garn.km : c.kind === 'line' ? LINE_KINDS[c.spec.lk].hooks * GEAR.line.kmHook : GEAR.teine.km;
const setKm = () => SETM.n * setUnitKm(SETM);
const setSpec = () => SETM.kind === 'garn' ? SETM.spec : Object.assign({}, SETM.spec, {n:SETM.n});
function setEnd(){ const p = S.boat.pos, km = setKm(); return {x:p.x + Math.sin(SETM.hdg) * km, y:p.y - Math.cos(SETM.hdg) * km}; }
function setLabelNow(){
  const n = SETM.n, L = (no, en) => S.lang === 'no' ? no : en;
  if (SETM.kind === 'garn') return L(SETM.lbl[0], SETM.lbl[1]);
  if (SETM.kind === 'line'){ const K = LINE_KINDS[SETM.spec.lk]; return L(n + ' ' + (n === 1 ? 'stamp' : 'stamper') + ' ' + K.no.toLowerCase(), n + ' ' + (n === 1 ? 'tub' : 'tubs') + ' of ' + K.en.toLowerCase()); }
  return L(n + ' ' + POTS[SETM.spec.pot].no.toLowerCase(), n + ' ' + POTS[SETM.spec.pot].en.toLowerCase());
}
// why the gear cannot go out as drawn, or null
function setWhy(){
  const p = S.boat.pos, e = setEnd(), L = (no, en) => S.lang === 'no' ? no : en;
  if (S.boat.status !== 'idle') return L('Båten må ligge stille for å sette.', 'The boat must lie still to set.');
  const r = gearRules(SETM.kind, setSpec(), p); if (r) return r[0];
  if (isLand(e)) return L('Enden av redskapet havner på land.', 'The end of the gear lands on land.');
  if (!legClear(p, e)) return L('Redskapet krysser land.', 'The gear crosses land.');
  if (depthF(e) < 5) return L('For grunt ved enden: under 5 m.', 'Too shallow at the end: under 5 m.');
  return null;
}
function setModeStart(c){
  const L = (no, en) => S.lang === 'no' ? no : en;
  if (S.boat.status !== 'idle'){ toast(L('Båten må ligge stille for å sette.', 'The boat must lie still to set.')); return; }
  SETM = {kind:c.kind, spec:Object.assign({}, c.spec), n:c.n, max:c.n, hdg:S.boat.heading || 0, lbl:c.lbl, fix:c.kind === 'garn'};
  if (typeof DOCK !== 'undefined') DOCK.close();
  if (!document.body.classList.contains('vplot')) openPlotter();
  document.body.classList.add('setmode');
  setModeFrame(); renderSetBar();
  requestAnimationFrame(() => { if (SETM){ setModeFrame(); renderSetBar(); } });
}
// zoom so the line fills about 40 % of the chart, centred on it
function setModeFrame(){
  const r = svg.getBoundingClientRect(); if (!r.height || !SETM) return;
  const want = 0.4 * Math.min(r.width, r.height) / Math.max(setKm(), 0.03);
  view.z = clamp(want * MAP_H / r.height, 0.8, 160);
  const p = S.boat.pos, e = setEnd(); view.cx = (p.x + e.x) / 2; view.cy = (p.y + e.y) / 2;
  applyView(); scheduleStatic(); renderDyn();
}
function setSvg(u){
  if (!SETM) return '';
  const p = S.boat.pos, e = setEnd(), bad = !!setWhy(), cls = 'setline' + (bad ? ' bad' : ''), m = {x:(p.x + e.x) / 2, y:(p.y + e.y) / 2};
  return '<line x1="' + p.x + '" y1="' + p.y + '" x2="' + e.x + '" y2="' + e.y + '" class="' + cls + '" stroke-width="' + (3.5 * u) + '"/>' +
    '<circle cx="' + p.x + '" cy="' + p.y + '" r="' + (4.5 * u) + '" class="setbuoy' + (bad ? ' bad' : '') + '" stroke-width="' + (1.5 * u) + '"/>' +
    '<circle cx="' + e.x + '" cy="' + e.y + '" r="' + (16 * u) + '" class="sethandle' + (bad ? ' bad' : '') + '" stroke-width="' + (2 * u) + '"/>' +
    '<circle cx="' + e.x + '" cy="' + e.y + '" r="' + (4.5 * u) + '" class="setbuoy' + (bad ? ' bad' : '') + '" stroke-width="' + (1.5 * u) + '"/>' +
    txt({x:m.x + 10 * u, y:m.y - 8 * u}, fmt(setKm() * 1000, 0) + ' m', 'wpn', 12 * u, 'stroke-width="' + (3 * u) + '"');
}
// a press near the end takes the line; elsewhere the chart pans as usual
const setGrab = mp => !!SETM && dist(mp, setEnd()) < 44 / view.px;
function setAim(mp){ const p = S.boat.pos; if (!SETM || dist(p, mp) < 1e-4) return; SETM.hdg = Math.atan2(mp.x - p.x, -(mp.y - p.y)); renderDyn(); renderSetBar(); }
function setCount(d){ if (!SETM || SETM.fix) return; SETM.n = clamp(SETM.n + d, 1, SETM.max); renderDyn(); renderSetBar(); }
function renderSetBar(){
  const el = $('setBar'); if (!el) return;
  if (!SETM){ el.hidden = true; return; }
  const L = (no, en) => S.lang === 'no' ? no : en, why = setWhy(), p = S.boat.pos, e = setEnd(), d0 = Math.round(depthF(p)), d1 = Math.round(depthF(e));
  el.hidden = false;
  el.querySelector('.sb-t').textContent = setLabelNow();
  el.querySelector('.sb-d').textContent = fmt(setKm() * 1000, 0) + ' m · ' + L('kurs ', 'course ') + deg3s(SETM.hdg * 180 / Math.PI) + ' · ' + d0 + '–' + d1 + ' m ' + L('dyp', 'deep');
  const w = el.querySelector('.sb-w'); w.textContent = why || L('Dra i enden av linja, eller trykk i kartet, for å velge retning.', 'Drag the end of the line, or tap the chart, to choose the direction.'); w.classList.toggle('bad', !!why);
  el.querySelector('.sb-n').hidden = SETM.fix; el.querySelector('.sb-n b').textContent = SETM.n;
  el.querySelector('[data-sb="-"]').disabled = SETM.n <= 1; el.querySelector('[data-sb="+"]').disabled = SETM.n >= SETM.max;
  const go = el.querySelector('[data-sb=go]'); go.textContent = L('Sett ut', 'Set'); go.classList.toggle('off', !!why);
  el.querySelector('[data-sb=x]').textContent = L('Avbryt', 'Cancel');
}
// go: set the gear as drawn; otherwise just leave. Back to the deck either way, unless the chart is closed already
function setModeEnd(go, stay){
  if (!SETM) return;
  if (go){ const why = setWhy(); if (why){ toast(why); return; } const err = startSet(SETM.kind, setSpec(), 0, SETM.hdg); if (err){ toast(err[0]); return; } }
  SETM = null; document.body.classList.remove('setmode'); renderSetBar(); renderDyn(); panelDirty = true;
  if (!stay && document.body.classList.contains('vplot') && !G3.isActive()) G3.show(true, true);
  renderActs(); renderHud(); save();
}
$('setBar').addEventListener('click', e => {
  const b = e.target.closest('[data-sb]'); if (!b || b.disabled) return; const k = b.dataset.sb;
  if (k === '-' || k === '+') setCount(k === '+' ? 1 : -1); else if (k === 'x') setModeEnd(false); else if (k === 'go') setModeEnd(true);
});
