// ---------- the heat map on the chart plotter (cells: core/12-heat.js) ----------
// A canvas between the depth chart (#chartcv) and the vector chart (svg#map): land, coast, contours, names, route and boat lie
// crisply on top, so the heat never covers land. Painted in this order: the afterglow of what the boat has passed, a dimmed disk
// that makes the heat readable on both chart styles, the live cells, and a thin ring for the range. One amber hue, darker to
// lighter on a log scale from 4.5 to 150 kg an hour (the simple sounder shows four steps). Nothing here runs at load except making
// the canvas, and other files call heatPaint() only through window.heatReady, so the `let`s below are always set up first.
const heatCv = document.createElement('canvas'); heatCv.id = 'heatcv'; svg.parentNode.insertBefore(heatCv, svg);
const HEATPAL = (() => {
  // 256 colours: index 0 is under 3 kg/h (nothing), then a log ramp from 4.5 to 150 kg/h (HEAT_TOP)
  // on the dark disk: little fish is a faint ember, more is brighter and more solid, the best is pale gold
  const stops = [[0, [120, 42, 12]], [0.35, [214, 104, 22]], [0.7, [250, 196, 64]], [1, [255, 246, 196]]], out = new Uint8ClampedArray(256 * 4);
  for (let i = 1; i < 256; i++){
    const t = (i - 1) / 254, k = i * 4; let j = 0; while (j < stops.length - 2 && t > stops[j + 1][0]) j++;
    const [ta, a] = stops[j], [tb, c] = stops[j + 1], u = (t - ta) / (tb - ta);
    for (let q = 0; q < 3; q++) out[k + q] = a[q] + (c[q] - a[q]) * u;
    out[k + 3] = 255 * (0.24 + 0.68 * Math.min(1, t / 0.85));
  }
  out[7] = 255 * 0.14;   // 3–4.5 kg/h: barely there
  return out;
})();
const HEAT_TOP = 150, HEAT_STEPS = [4.5, 13.5, 30, 60];   // the scale's top, and the simple sounder's four steps (kg/h)
function heatIndex(v, steps){
  if (!(v >= 3)) return 0;
  if (v < 4.5) return 1;   // the faint edge of anything worth a look
  if (steps){ let s = 0; for (let i = 0; i < HEAT_STEPS.length; i++) if (v >= HEAT_STEPS[i]) s = i; return 1 + Math.round(heatPos(HEAT_STEPS[s] * 1.25) * 254); }
  return 1 + Math.round(heatPos(v) * 254);
}
// the cells as one small picture, one pixel a cell, with the afterglow faded in its alpha; rebuilt when the cells, the species or
// the game minute change
const HP = {rev:-1, t:-1, sp:'', tier:'', off:document.createElement('canvas'), ix0:0, iy0:0, w:0, h:0, last:0, box:''};
function heatImage(){
  const sp = heatSpecies(), tier = HEATC.tier;
  if (HP.rev === HEATC.rev && HP.t === S.t && HP.sp === sp && HP.tier === tier) return HP.w > 0;
  HP.rev = HEATC.rev; HP.t = S.t; HP.sp = sp; HP.tier = tier;
  const cs = HEATC.cs; let ix0 = 1e9, iy0 = 1e9, ix1 = -1e9, iy1 = -1e9;
  for (const c of HEATC.cells.values()){ if (!c.v) continue; const ix = Math.floor(c.x / cs), iy = Math.floor(c.y / cs); if (ix < ix0) ix0 = ix; if (iy < iy0) iy0 = iy; if (ix > ix1) ix1 = ix; if (iy > iy1) iy1 = iy; }
  if (ix1 < ix0){ HP.w = 0; return false; }
  const w = ix1 - ix0 + 1, h = iy1 - iy0 + 1, off = HP.off; if (off.width !== w) off.width = w; if (off.height !== h) off.height = h;
  const g = off.getContext('2d'), img = g.createImageData(w, h), d = img.data, steps = tier === 'basic';
  for (const c of HEATC.cells.values()){
    if (!c.v) continue;
    const age = S.t - c.seen, fade = age <= 0 ? 1 : 0.6 * Math.max(0, 1 - age / HEAT.glow); if (fade <= 0) continue;
    const i = heatIndex(heatValue(c.v, sp), steps); if (!i) continue;
    const k = ((Math.floor(c.y / cs) - iy0) * w + Math.floor(c.x / cs) - ix0) * 4;
    d[k] = HEATPAL[i * 4]; d[k + 1] = HEATPAL[i * 4 + 1]; d[k + 2] = HEATPAL[i * 4 + 2]; d[k + 3] = HEATPAL[i * 4 + 3] * fade;
  }
  g.putImageData(img, 0, 0); HP.ix0 = ix0; HP.iy0 = iy0; HP.w = w; HP.h = h;
  return true;
}
function heatPaint(force){
  if (!window.heatReady) return;
  const on2d = document.body.classList.contains('vplot') && !G3.isActive(), tier = heatTier(), b = S.boat;
  const show = on2d && tier && b.status !== 'port' && DEPTH;
  heatBox(on2d && tier);
  const ctx = heatCv.getContext('2d');
  if (!show){ if (heatCv.width) ctx.clearRect(0, 0, heatCv.width, heatCv.height); heatCv.dataset.on = ''; return; }
  const r = svg.getBoundingClientRect(), mr = svg.parentNode.getBoundingClientRect(); if (!r.width || !r.height) return;
  heatCv.style.left = (r.left - mr.left) + 'px'; heatCv.style.top = (r.top - mr.top) + 'px'; heatCv.style.width = r.width + 'px'; heatCv.style.height = r.height + 'px';
  const dpr = Math.min(2, window.devicePixelRatio || 1), W = Math.max(2, Math.round(r.width * dpr)), H = Math.max(2, Math.round(r.height * dpr));
  if (heatCv.width !== W) heatCv.width = W; if (heatCv.height !== H) heatCv.height = H;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H);
  const hh = MAP_H / view.z, ww = hh * (r.width / r.height), x0 = view.cx - ww / 2, y0 = view.cy - hh / 2, k = W / ww;   // screen pixels a km
  const X = x => (x - x0) * k, Y = y => (y - y0) * k, T = HEAT.tiers[tier], pose = livePose(), cx = X(pose.p.x), cy = Y(pose.p.y), rad = T.r * k;
  // the dimmed disk: a neutral dark glass with a soft edge, a little stronger over the colourful fishing chart
  const dim = chartMode() === 'fish' ? 0.8 : 0.72, gr = ctx.createRadialGradient(cx, cy, rad * 0.9, cx, cy, rad * 1.05);
  gr.addColorStop(0, 'rgba(5,14,22,' + dim + ')'); gr.addColorStop(1, 'rgba(5,14,22,0)');
  ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, cy, rad * 1.04, 0, Math.PI * 2); ctx.fill();
  if (heatImage()){
    const cs = HEATC.cs; ctx.imageSmoothingEnabled = tier !== 'basic'; if (ctx.imageSmoothingEnabled) ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(HP.off, X(HP.ix0 * cs), Y(HP.iy0 * cs), HP.w * cs * k, HP.h * cs * k);
  }
  ctx.strokeStyle = 'rgba(255,214,120,.55)'; ctx.lineWidth = Math.max(1, dpr); ctx.setLineDash([6 * dpr, 5 * dpr]);
  ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  heatCv.dataset.on = tier; heatCv.dataset.r = (rad / dpr).toFixed(1);
}

// ---------- the box with the scale and the readout: what the fish here is worth to your boat, and why ----------
const COMPASS = {no:['N', 'NØ', 'Ø', 'SØ', 'S', 'SV', 'V', 'NV'], en:['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']};
const compassOf = a => COMPASS[S.lang === 'no' ? 'no' : 'en'][Math.round((((a * 180 / Math.PI) % 360) + 360) % 360 / 45) % 8];
const SPNAME = {all:['all fisk', 'all fish'], torsk:['torsk', 'cod'], hyse:['hyse', 'haddock'], sei:['sei', 'saithe']};
const pct = f => (f >= 0 ? '+' : '−') + Math.round(Math.abs(f) * 100) + ' %';
function heatReadout(){
  const L = (no, en) => S.lang === 'no' ? no : en, b = S.boat;
  if (b.status === 'port') return '<p class="hr-note">' + t('echo_off') + '</p>';
  const pose = livePose(), H = (S.t + pose.frac) / 60, E = expectedRate(pose.p, H); if (!E) return '';
  const sp = heatSpecies(), fishing = b.status === 'fishing', sub = sp === 'all' ? '' : ' · ' + L('herav ', 'of which ') + SPNAME[sp][S.lang === 'no' ? 0 : 1] + ' ' + fmt(E.by[sp] || 0, 0);
  let h = '<p class="hr-now">' + (fishing ? L('Her nå: ca. ', 'Here now: about ') : L('Fisker du her: ca. ', 'Fishing here: about ')) + '<b>' + fmt(E.t, 0) + '</b> ' + L('kg/t med din båt', 'kg/h with your boat') + sub + '</p>';
  const f = E.f, parts = [L('fisken her ', 'fish here ') + fmt(E.base, 0) + ' kg/' + L('t', 'h'), L('redskap ×', 'gear ×') + fmt(f.eff, f.eff < 1 ? 2 : 1)];
  if (Math.abs(f.luck - 1) > 0.005) parts.push(L('haill ', 'luck ') + pct(f.luck - 1));
  if (f.cold > 0.005) parts.push(L('kulde ', 'cold ') + pct(-f.cold));
  if (f.sea < 0.995) parts.push(L('sjø ', 'sea ') + pct(f.sea - 1));
  if (f.deck < 0.995) parts.push(L('én på dekk ', 'one on deck ') + pct(f.deck - 1));
  if (f.rod) parts.push(L('stang ', 'rod ') + pct(-0.5));
  h += '<p class="hr-f">' + parts.join(' · ') + '</p>';
  if (S.tut && S.tut.catch) h += '<p class="hr-note">' + L('Første tur: full last er garantert. Vanlig fiske med håndjuksa gir 10–40 kg/t.', 'First trip: a full hold is guaranteed. Ordinary fishing with a hand jig gives 10–40 kg/h.') + '</p>';
  if (HEATC.tier === 'sonar'){ const s2 = sp === 'all' ? 'torsk' : sp, dr = schoolDrift(s2), nm = {torsk:['Torskestimene', 'The cod schools'], hyse:['Hysestimene', 'The haddock schools'], sei:['Seistimene', 'The saithe schools']}[s2];
    h += '<p class="hr-note">' + nm[S.lang === 'no' ? 0 : 1] + L(' trekker mot ', ' are heading ') + compassOf(dr.a) + L(', ca. ', ', about ') + fmt(dr.v, 1) + ' km/' + L('t', 'h') + '.</p>'; }
  return h;
}
// where a value sits on the scale (0–1), and the scale as a CSS gradient in the same colours as the map
const heatPos = v => clamp(Math.log(v / 4.5) / Math.log(HEAT_TOP / 4.5), 0, 1);
function heatBar(steps){
  const col = i => 'rgba(' + HEATPAL[i * 4] + ',' + HEATPAL[i * 4 + 1] + ',' + HEATPAL[i * 4 + 2] + ',' + (HEATPAL[i * 4 + 3] / 255).toFixed(2) + ')';
  if (steps){ const st = HEAT_STEPS.map((v, i) => [heatPos(v), heatPos(HEAT_STEPS[i + 1] || HEAT_TOP), col(heatIndex(v, true))]); return 'linear-gradient(90deg,' + st.map(([a, c, k]) => k + ' ' + (a * 100).toFixed(1) + '%,' + k + ' ' + (c * 100).toFixed(1) + '%').join(',') + ')'; }
  return 'linear-gradient(90deg,' + [0, 0.25, 0.5, 0.75, 1].map(f => col(1 + Math.round(f * 254)) + ' ' + f * 100 + '%').join(',') + ')';
}
function heatBox(on){
  const el = $('heatBox'); if (!el) return;
  if (!on){ if (!el.hidden) el.hidden = true; return; }
  const now = performance.now(), tier = heatTier(), sp = heatSpecies(), key = [tier, sp, S.lang, S.boat.status].join('|');
  if (!el.hidden && key === HP.box && now - HP.last < 1000) return; HP.last = now; HP.box = key; el.hidden = false;
  const L = (no, en) => S.lang === 'no' ? no : en, pick = HEAT.tiers[tier].pick, nx = {all:'torsk', torsk:'hyse', hyse:'sei', sei:'all'}[sp];
  const title = tier === 'sonar' ? L('Sonar', 'Sonar') : tier === 'chirp' ? L('CHIRP-ekkolodd', 'CHIRP echo sounder') : L('Ekkolodd', 'Echo sounder');
  const range = fmt(HEAT.tiers[tier].r * 2 / NM, 1) + ' nm';
  el.innerHTML = '<div class="hb-top"><b>' + title + '</b><span>' + range + '</span>' + (pick ? '<button type="button" class="hb-sp" data-act="hsp" data-s="' + nx + '">' + SPNAME[sp][S.lang === 'no' ? 0 : 1].replace(/^./, c => c.toUpperCase()) + ' ›</button>' : '') + '</div>' +
    '<div class="hb-bar" style="background:' + heatBar(tier === 'basic') + '"></div><div class="hb-lab">' + [5, 15, 30, 60, 150].map(v => '<span style="left:' + (heatPos(v) * 100).toFixed(1) + '%">' + v + '</span>').join('') + '</div>' +
    '<p class="hb-sub">' + L('kg/t for én person med håndjuksa', 'kg/h for one person with a hand jig') + '</p>' + heatReadout();
}
$('heatBox').addEventListener('click', e => { const el = e.target.closest('[data-act]'); if (el && !el.disabled) doAct(el); });
hooks.onHeat = () => heatPaint();
window.heatReady = true;
