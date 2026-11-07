// ---------- Kystkartet: the collection on one chart (core/09m-kystkart.js; docs/planer/oppdrag-2.md K2) ----------
// The Milepæler app's tab «Kystkartet»: a small chart of the whole coast with Fiskeridirektoratet's statistical areas (filled where you
// have fished), the plants (a dot where you have landed) and the lighthouses (a star where you have taken the picture), the four counts
// with their bars, and what is had in each list. «Vis i sjøkartet» lays the same marks over the chart plotter, from the whole coast in,
// with a bar that says what they are and closes them again.
const KK = {on:false, geo:null, bar:null};
const KL = (no, en) => S.lang === 'en' ? en : no;
const kkEsc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'})[c]);
// the areas' rings thinned to a point every 2 km (they are drawn small or under the chart's own coast), once
function kkGeo(){
  if (KK.geo) return KK.geo;
  const thin = (r, step) => { const out = []; let lx = Infinity, ly = Infinity; for (let i = 0; i + 1 < r.length; i += 2){ const x = r[i], y = r[i + 1]; if (Math.hypot(x - lx, y - ly) >= step || i + 3 >= r.length){ out.push(x.toFixed(1) + ',' + y.toFixed(1)); lx = x; ly = y; } } return out.length >= 3 ? 'M' + out.join('L') + 'Z' : ''; };
  const areas = RU.hom.map(h => {
    let sx = 0, sy = 0, n = 0, big = 0, c = null;
    for (const p of h.P){ const r = p.rings[0], b = p.bb, a = (b[2] - b[0]) * (b[3] - b[1]); if (a > big){ big = a; c = [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]; } }
    for (const p of h.P) for (const r of p.rings){ for (let i = 0; i + 1 < r.length; i += 20){ sx += r[i]; sy += r[i + 1]; n++; } }
    return {c:h.c, d:h.P.map(p => p.rings.map(r => thin(r, 2)).join('')).join(''), at:c || (n ? [sx / n, sy / n] : [0, 0])}; });
  // the frame: the plants and the lighthouses with 40 km round them (the areas reach far out to sea; the coast is what is shown)
  const xs = [], ys = []; for (const q of kkPlants()){ xs.push(q.p.x); ys.push(q.p.y); } for (const f of FYR || []){ xs.push(f[0]); ys.push(f[1]); }
  const box = [Math.min(...xs) - 40, Math.min(...ys) - 40, Math.max(...xs) + 40, Math.max(...ys) + 40];
  return KK.geo = {areas, box};
}
// the small chart in the phone: the areas, the plants and the lighthouses, what is had in colour
function kkChartSvg(){
  const G = kkGeo(), K = kkState(), had = kkPlantsHad(), [x0, y0, x1, y1] = G.box, w = x1 - x0, h = y1 - y0, u = h / 420;
  const g = ['<svg class="kk-map" viewBox="' + x0.toFixed(0) + ' ' + y0.toFixed(0) + ' ' + w.toFixed(0) + ' ' + h.toFixed(0) + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="' + KL('Kystkartet', 'The coast map') + '">'];
  g.push('<rect x="' + x0 + '" y="' + y0 + '" width="' + w + '" height="' + h + '" class="kk-land"/>');
  for (const a of G.areas) g.push('<path d="' + a.d + '" class="kk-omr' + (K.hom[a.c] ? ' on' : '') + '" stroke-width="' + (0.8 * u) + '"/>');
  for (const f of FYR || []){ const i = FYR.indexOf(f), on = !!K.fyr[i], r = (on ? 3.2 : 1.8) * u;
    g.push('<path d="M' + f[0] + ',' + (f[1] - r) + 'L' + (f[0] + r * 0.6) + ',' + (f[1] + r * 0.8) + 'L' + (f[0] - r * 0.6) + ',' + (f[1] + r * 0.8) + 'Z" class="kk-fyr' + (on ? ' on' : '') + '" stroke-width="' + (0.6 * u) + '"/>'); }
  for (const q of kkPlants()){ const on = had.has(q.id); g.push('<circle cx="' + q.p.x + '" cy="' + q.p.y + '" r="' + ((on ? 5.5 : 2.4) * u) + '" class="kk-mot' + (on ? ' on' : '') + '" stroke-width="' + (0.7 * u) + '"/>'); }
  if (S.boat && S.boat.pos) g.push('<circle cx="' + S.boat.pos.x + '" cy="' + S.boat.pos.y + '" r="' + (4.5 * u) + '" class="kk-me" stroke-width="' + (1.4 * u) + '"/>');
  g.push('</svg>');
  return g.join('');
}
// the four counts, with the bar of each
function kkRows(c){
  // the next step of the badge behind each list (core/09f-merker.js ACHL), each with a gift as the other badges
  const next = (id, n) => { const L0 = typeof ACHL !== 'undefined' && ACHL.find(x => x.id === id); if (!L0) return ''; const t = L0.tiers.find(v => v > n); return t != null ? '<small class="kk-next" style="grid-column:2/-1;color:#5b6c76;font-size:11.5px">' + KL('neste trinn: ', 'next step: ') + t + '</small>' : '<small class="kk-next" style="grid-column:2/-1;color:#5b6c76;font-size:11.5px">' + KL('alle trinn tatt', 'every step taken') + '</small>'; };
  const row = (k, no, en, mark) => { const [n, N] = c[k]; return '<div class="kk-row"><span class="kk-key ' + mark + '"></span><b>' + KL(no, en) + '</b><span class="kk-n">' + n + ' / ' + N + '</span><span class="gb"><i style="width:' + (N ? Math.round(n / N * 100) : 0) + '%"></i></span>' + next(k, n) + '</div>'; };
  return row('mottak', 'Mottak du har levert til', 'Plants you have landed at', 'mot') + row('fyr', 'Fyr du har fotografert', 'Lighthouses you have photographed', 'fyr') +
    row('omr', 'Statistikkområder fisket i', 'Statistical areas fished in', 'omr') + row('arter', 'Arter du har levert', 'Species you have landed', 'art');
}
// the Milepæler app's tab
function kkTab(){
  const c = kkCount(), K = kkState(), sp = (S.ach && S.ach.sp) || {}, had = [...kkPlantsHad()].map(id => portById(id)).filter(Boolean);
  const h = ['<div class="ph-card kk-card"><h4>' + KL('Kystkartet', 'The coast map') + '</h4><p class="ph-note">' +
    KL('Kysten du har sett. Hver levering, hvert fyrbilde for Kystposten og hver time med fiske setter en prikk.', 'The coast you have seen. Every landing, every lighthouse picture for Kystposten and every hour of fishing sets a dot.') + '</p>' +
    kkChartSvg() + kkRows(c) + '<button class="ph-btn p" data-pa="kkmap">' + KL('Vis i sjøkartet', 'Show on the chart') + '</button></div>'];
  h.push('<div class="ph-card"><h4>' + KL('Arter', 'Species') + '</h4><div class="kk-chips">' + kkSpecies().map(s => '<span class="kk-chip' + (sp[s] ? ' on' : '') + '">' + (sp[s] ? '✓ ' : '') + kkEsc(SPECIES[s][S.lang === 'en' ? 'en' : 'no']) + '</span>').join('') + '</div></div>');
  const list = (title, items, none) => '<div class="ph-card"><h4>' + title + '</h4>' + (items.length ? '<p class="kk-list">' + items.map(kkEsc).join(' · ') + '</p>' : '<p class="ph-note">' + none + '</p>') + '</div>';
  h.push(list(KL('Mottak', 'Plants'), had.map(pt => pt.name).sort((a, b) => a.localeCompare(b, 'nb')), KL('Ingen ennå. Den første leveringen setter den første prikken.', 'None yet. The first landing sets the first dot.')));
  h.push(list(KL('Fyr', 'Lighthouses'), Object.keys(K.fyr).map(i => FYR && FYR[i] ? (/fyr/i.test(FYR[i][3]) ? FYR[i][3] : FYR[i][3] + KL(' fyr', ' lighthouse')) : null).filter(Boolean).sort((a, b) => a.localeCompare(b, 'nb')),
    KL('Ingen ennå. Kystposten ber om fyrbilder på oppdragstavla.', 'None yet. Kystposten asks for lighthouse pictures on the mission board.')));
  h.push(list(KL('Statistikkområder', 'Statistical areas'), Object.keys(K.hom).sort().map(c => KL('område ', 'area ') + c),
    KL('Ingen ennå. Området teller når du fisker der.', 'None yet. An area counts when you fish there.')));
  h.push('<div class="ph-card"><p class="ph-note">' + KL('Områdene er Fiskeridirektoratets statistiske hovedområder, de samme som sesongene og reglene bruker.', 'The areas are the Directorate of Fisheries\' statistical main areas, the same as the seasons and the rules use.') + '</p></div>');
  return '<div class="ph-c-kk">' + h.join('') + '</div>';
}
// ---- the same marks over the chart plotter (03-map.js renderStatic) ----
function kkSvg(u, inV){
  if (!KK.on) return '';
  // never in the way of navigation: gone as soon as a route is being laid (Jonas 03.11.2026: «Det blir bare støy»)
  if (document.body.classList.contains('routing')){ KK.on = false; kkBar(); return ''; }
  const G = kkGeo(), K = kkState(), had = kkPlantsHad(), g = [];
  for (const a of G.areas){ if (!K.hom[a.c]) continue; g.push('<path d="' + a.d + '" class="kk-omr on map" stroke-width="' + (1.2 * u) + '"/>'); }
  if (view.z < 4) for (const a of G.areas) if (inV(a.at[0], a.at[1])) g.push(txt({x:a.at[0], y:a.at[1]}, a.c, 'kk-omrc' + (K.hom[a.c] ? ' on' : ''), 13 * u, 'stroke-width="' + (3 * u) + '"'));
  // only what is had: the chart has its own harbour icons, so a plant landed at gets a ring round its icon and a lighthouse photographed a
  // star beside it
  for (const i in K.fyr){ const f = FYR && FYR[i]; if (!f || !inV(f[0], f[1])) continue; const r = 8 * u;
    g.push('<path d="M' + f[0] + ',' + (f[1] - r) + 'L' + (f[0] + r * 0.6) + ',' + (f[1] + r * 0.8) + 'L' + (f[0] - r * 0.6) + ',' + (f[1] + r * 0.8) + 'Z" class="kk-fyr on" stroke-width="' + (1.4 * u) + '"/>'); }
  for (const id of had){ const q = portById(id); if (!q || !inV(q.p.x, q.p.y)) continue; g.push('<circle cx="' + q.p.x + '" cy="' + q.p.y + '" r="' + (13 * u) + '" class="kk-mot ring" stroke-width="' + (3.5 * u) + '"/>'); }
  return g.join('');
}
function kkBar(){
  let el = KK.bar; if (!el){ el = KK.bar = Object.assign(document.createElement('div'), {id:'kkBar'}); $('aisCard').after(el); }
  el.hidden = !KK.on; if (!KK.on) return;
  const c = kkCount();
  el.innerHTML = '<div class="ai-h"><b>' + KL('Kystkartet', 'The coast map') + '</b><button type="button" data-k="x" aria-label="' + KL('Lukk', 'Close') + '">×</button></div>' +
    '<div class="kk-leg"><span><i class="kk-key mot"></i>' + KL('Mottak ', 'Plants ') + c.mottak[0] + '/' + c.mottak[1] + '</span><span><i class="kk-key fyr"></i>' + KL('Fyr ', 'Lighthouses ') + c.fyr[0] + '/' + c.fyr[1] + '</span><span><i class="kk-key omr"></i>' + KL('Områder ', 'Areas ') + c.omr[0] + '/' + c.omr[1] + '</span><span>' + KL('Arter ', 'Species ') + c.arter[0] + '/' + c.arter[1] + '</span></div>';
  el.querySelector('[data-k=x]').onclick = () => kkChart(false);
}
// on: the plotter from the whole coast, the marks and the bar; off: the marks gone
function kkChart(on){
  KK.on = !!on; kkBar();
  if (on){ if (typeof openPlotter === 'function') openPlotter();
    const G = kkGeo(), go = () => { view.cx = (G.box[0] + G.box[2]) / 2; view.cy = (G.box[1] + G.box[3]) / 2; view.z = clamp(MAP_H / (G.box[3] - G.box[1]), ZMIN, ZMAX); applyView(); scheduleStatic(); };
    go(); setTimeout(go, 120); }
  else scheduleStatic();
}
