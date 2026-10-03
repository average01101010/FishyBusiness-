// ---------- the heat map on the chart plotter (cells: core/12-heat.js) ----------
// A canvas between the depth chart (#chartcv) and the vector chart (svg#map): land, coast, contours, names, route and boat lie
// crisply on top, so the heat never covers land. Only the fish shows (the user's wish 02.10.2026): no disk or ring for the range,
// and the colours run from clear where there is next to no fish through light turquoise and blue to purple where it is densest,
// on a log scale (the simple sounder shows four steps), over the afterglow of what the boat has passed. The player never sees a
// number for the fish: the map shows where it is dense, not how much a boat would take. Nothing here runs at load except making
// the canvas, and other files call heatPaint() only through window.heatReady, so the `let`s below are always set up first.
const heatCv = document.createElement('canvas'); heatCv.id = 'heatcv'; svg.parentNode.insertBefore(heatCv, svg);
const HEATPAL = (() => {
  // 256 colours: index 0 is under 3 kg/h (nothing), then a log ramp from 4.5 to 150 kg/h (HEAT_TOP)
  // clear, then light turquoise, blue and purple (the user's wishes 02.10.2026): the hue tells the amounts apart, and the colour is
  // solid from about 40 kg/h, so how much stands there reads at a glance
  const stops = [[0, [150, 236, 226]], [0.28, [52, 200, 210]], [0.52, [38, 120, 222]], [0.76, [96, 44, 196]], [1, [62, 0, 118]]], out = new Uint8ClampedArray(256 * 4);
  for (let i = 1; i < 256; i++){
    const t = (i - 1) / 254, k = i * 4; let j = 0; while (j < stops.length - 2 && t > stops[j + 1][0]) j++;
    const [ta, a] = stops[j], [tb, c] = stops[j + 1], u = (t - ta) / (tb - ta);
    for (let q = 0; q < 3; q++) out[k + q] = a[q] + (c[q] - a[q]) * u;
    out[k + 3] = 255 * Math.pow(Math.min(1, Math.max(0, (t - 0.06) / 0.56)), 1.15);   // thin fish stays clear, so the schools stand out
  }
  out[7] = 0;   // the faintest trace: clear
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
    // the edge: full from the middle out to 55 % of the radius, then softly out to nothing at the ring (the user's wish 02.10.2026)
    const age = S.t - c.seen, e = Math.min(1, Math.max(0, (1 - c.near) / 0.45)), fade = (age <= 0 ? 1 : 0.6 * Math.max(0, 1 - age / HEAT.glow)) * e * e * (3 - 2 * e); if (fade <= 0) continue;
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
  if (heatImage()){
    // softened, so the fish fades out towards the ring's edge instead of stopping at the cells' hard border (the user's wish 02.10.2026)
    const cs = HEATC.cs; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.filter = 'blur(' + Math.max(2, rad * 0.05).toFixed(1) + 'px)';
    ctx.drawImage(HP.off, X(HP.ix0 * cs), Y(HP.iy0 * cs), HP.w * cs * k, HP.h * cs * k); ctx.filter = 'none';
  }
  heatCv.dataset.on = tier; heatCv.dataset.r = (rad / dpr).toFixed(1);
}
// the same heat on the skiff's console screen in 3D (view3d.js paintPlotter) and the little chart: g its 2D context, p the boat (km), (ox, oy) the boat
// on the screen, k pixels a km; plain: no blur (over the 3D view a canvas filter costs a software GPU dearly; the cells' own edge fade
// and the smoothing are enough on a small screen)
function heatDrawInto(g, p, ox, oy, k, plain){
  const tier = heatTier(); if (!tier || S.boat.status === 'port' || !DEPTH) return;
  if (heatImage()){ const cs = HEATC.cs, sm = g.imageSmoothingEnabled, rad = HEAT.tiers[tier].r * k; g.imageSmoothingEnabled = true; if (!plain) g.filter = 'blur(' + Math.max(1.5, rad * 0.05).toFixed(1) + 'px)'; g.drawImage(HP.off, (HP.ix0 * cs - p.x) * k + ox, (HP.iy0 * cs - p.y) * k + oy, HP.w * cs * k, HP.h * cs * k); if (!plain) g.filter = 'none'; g.imageSmoothingEnabled = sm; }
}

// ---------- the box with the instrument, its range, the species and the scale ----------
const COMPASS = {no:['N', 'NØ', 'Ø', 'SØ', 'S', 'SV', 'V', 'NV'], en:['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']};
const compassOf = a => COMPASS[S.lang === 'no' ? 'no' : 'en'][Math.round((((a * 180 / Math.PI) % 360) + 360) % 360 / 45) % 8];
const SPNAME = {all:['all fisk', 'all fish'], torsk:['torsk', 'cod'], hyse:['hyse', 'haddock'], sei:['sei', 'saithe']};
// what the box says besides the scale: never a number for the fish, only the guide's promise and where the schools are heading
function heatReadout(){
  const L = (no, en) => S.lang === 'no' ? no : en;
  if (S.boat.status === 'port') return '<p class="hr-note">' + t('echo_off') + '</p>';
  let h = '';
  if (S.tut && S.tut.catch) h += '<p class="hr-note">' + L('Første tur: full last er garantert.', 'First trip: a full hold is guaranteed.') + '</p>';
  if (HEATC.tier === 'sonar'){ const sp = heatSpecies(), s2 = sp === 'all' ? 'torsk' : sp, nm = {torsk:['Torskestimene', 'The cod schools'], hyse:['Hysestimene', 'The haddock schools'], sei:['Seistimene', 'The saithe schools']}[s2];
    h += '<p class="hr-note">' + nm[S.lang === 'no' ? 0 : 1] + L(' trekker mot ', ' are heading ') + compassOf(schoolDrift(s2).a) + '.</p>'; }
  return h;
}
// where a value sits on the scale (0–1), and the scale as a CSS gradient in the same colours as the map
const heatPos = v => clamp(Math.log(v / 4.5) / Math.log(HEAT_TOP / 4.5), 0, 1);
function heatBar(steps){
  const col = i => 'rgba(' + HEATPAL[i * 4] + ',' + HEATPAL[i * 4 + 1] + ',' + HEATPAL[i * 4 + 2] + ',' + (HEATPAL[i * 4 + 3] / 255).toFixed(2) + ')';
  if (steps){ const st = HEAT_STEPS.map((v, i) => [heatPos(v), heatPos(HEAT_STEPS[i + 1] || HEAT_TOP), col(heatIndex(v, true))]); return 'linear-gradient(90deg,' + st.map(([a, c, k]) => k + ' ' + (a * 100).toFixed(1) + '%,' + k + ' ' + (c * 100).toFixed(1) + '%').join(',') + ')'; }
  return 'linear-gradient(90deg,' + [0, 0.25, 0.5, 0.75, 1].map(f => col(1 + Math.round(f * 254)) + ' ' + f * 100 + '%').join(',') + ')';
}
// the echo sounder's field in the chart plotter's top bar (the user's wish 02.10.2026): its name and range, the scale from clear to
// dark purple over the sea's colour, and the species button; what it says besides (heatReadout) is its tooltip and under «Innstillinger»
function heatBox(on){
  const el = $('heatBox'); if (!el) return;
  if (!on){ if (!el.hidden) el.hidden = true; return; }
  const now = performance.now(), tier = heatTier(), sp = heatSpecies(), key = [tier, sp, S.lang, S.boat.status].join('|');
  if (!el.hidden && key === HP.box && now - HP.last < 1000) return; HP.last = now; HP.box = key; el.hidden = false;
  const L = (no, en) => S.lang === 'no' ? no : en, pick = HEAT.tiers[tier].pick, nx = {all:'torsk', torsk:'hyse', hyse:'sei', sei:'all'}[sp];
  const title = tier === 'sonar' ? L('Sonar', 'Sonar') : tier === 'chirp' ? L('CHIRP-ekkolodd', 'CHIRP echo sounder') : L('Ekkolodd', 'Echo sounder');
  const range = fmt(HEAT.tiers[tier].r * 2 / NM, 1) + ' nm';
  el.innerHTML = '<small>' + title.toUpperCase() + ' · ' + range + '</small><span class="hb-row"><span class="hb-lab">' + L('lite', 'little') + '</span><span class="hb-bar" style="background-image:' + heatBar(tier === 'basic') + '"></span><span class="hb-lab">' + L('mye fisk', 'much fish') + '</span>' +
    (pick ? '<button type="button" class="hb-sp" data-act="hsp" data-s="' + nx + '">' + SPNAME[sp][S.lang === 'no' ? 0 : 1].replace(/^./, c => c.toUpperCase()) + ' ›</button>' : '') + '</span>';
  el.title = heatReadout().replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
$('heatBox').addEventListener('click', e => { const el = e.target.closest('[data-act]'); if (el && !el.disabled) doAct(el); });
hooks.onHeat = () => heatPaint();
window.heatReady = true;
