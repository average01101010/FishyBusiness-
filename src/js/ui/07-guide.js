// ---------- first-time guide ----------
const TUT = [null,
  {sel:'#gpsBtn', no:'Trykk på GPS-en for å åpne kartplotteren og planlegge turen.', en:'Tap the GPS to open the chart plotter and plan your trip.'},
  {sel:null, no:'Trykk på sjøen for å sette veipunkter. Gi ett av dem fisketid med +, og avslutt ruten ved å trykke på en havn.', en:'Tap the sea to set waypoints. Give one of them fishing time with +, and end the route by tapping a harbour.'},
  {sel:'#panel [data-act=start]', no:'Sjekk vær og drivstoff, og trykk Kast loss. Båten kjører turen selv, også når du er borte.', en:'Check the weather and fuel, then tap Cast off. The boat runs the trip on its own, even while you are away.'},
  {sel:'#phoneFab', no:'Telefonen har vær, priser, verksted, redning og mer.', en:'The phone has weather, prices, the workshop, rescue and more.', ok:true},
  {sel:'#logbook', no:'Dekksdagboka fører alt for deg. Trykk på den og bla med fingeren.', en:'The deck log records everything for you. Tap it and turn the pages with your finger.', ok:true}];
function tutUpdate(){
  const tip = $('tip'), st = S.tut || 0;
  if (st === 1 && document.body.classList.contains('vplot')) S.tut = 2;
  else if ((st === 2 || st === 3) && !document.body.classList.contains('vplot') && !S.plan) S.tut = 1;
  else if (st === 2 && S.draft.length && S.draft[S.draft.length - 1].port) S.tut = 3;
  else if (st === 3 && S.plan) S.tut = 4;
  if (S.tut === 3 && window.innerWidth <= 700) document.body.classList.add('drawer');
  const T0 = TUT[S.tut || 0];
  if (!T0 || PHONE.isOpen() || BOOK.isOpen() || !$('modal').hidden){ tip.hidden = true; return; }
  const target = T0.sel && document.querySelector(T0.sel);
  if (T0.sel && (!target || !target.offsetParent)){ tip.hidden = true; return; }
  const txt = S.lang === 'no' ? T0.no : T0.en; if ($('tipText').textContent !== txt) $('tipText').textContent = txt;
  $('tipOk').hidden = !T0.ok; $('tipOk').textContent = S.lang === 'no' ? 'Skjønner' : 'Got it'; $('tipSkip').textContent = S.lang === 'no' ? 'Hopp over' : 'Skip';
  tip.hidden = false;
  const tw = tip.offsetWidth, th = tip.offsetHeight, ar = tip.querySelector('.tip-arrow'), vw = window.innerWidth, vh = window.innerHeight;
  if (!target){ tip.style.left = Math.max(8, (vw - tw) / 2) + 'px'; tip.style.top = (72 + (window.visualViewport ? 0 : 0)) + 'px'; ar.style.display = 'none'; return; }
  const r = target.getBoundingClientRect(), above = r.top > th + 24, x = clamp(r.left + r.width / 2 - tw / 2, 8, vw - tw - 8), y = above ? r.top - th - 14 : Math.min(vh - th - 8, r.bottom + 14);
  tip.style.left = x + 'px'; tip.style.top = y + 'px'; ar.style.display = '';
  ar.style.left = clamp(r.left + r.width / 2 - x - 7, 12, tw - 26) + 'px'; ar.style.top = above ? (th - 7) + 'px' : '-7px';
}
$('tipOk').onclick = () => { S.tut = S.tut === 4 ? 5 : 0; save(); tutUpdate(); };
$('tipSkip').onclick = () => { S.tut = 0; save(); tutUpdate(); };

function renderClock(){
  $('clock').textContent = clockStr(S.t / 60);
  const c = $('cash'); c.textContent = kr(S.cash); c.classList.toggle('neg', S.cash < 0);
}

function chartSettings(){
  const L = (no, en) => S.lang === 'no' ? no : en, fish = S.settings.chart === 'fish', sd = safeDepth();
  return '<div class="ecs"><div class="seg"><button type="button" data-act="cm" data-m="nav" class="' + (fish ? '' : 'on') + '">' + L('Navigasjon', 'Navigation') + '</button><button type="button" data-act="cm" data-m="fish" class="' + (fish ? 'on' : '') + '">' + L('Fiskekart', 'Fishing chart') + (S.equip.plotter ? '' : ' 🔒') + '</button></div>' +
    '<div class="kv"><span>' + L('Sikker dybde', 'Safety depth') + '</span><span class="sdv"><button type="button" data-act="sd-">−</button><b>' + sd + ' m</b><button type="button" data-act="sd+">+</button></span></div>' +
    '<p class="note">' + (fish ? L('Havbunnen i farger med dybdekoter. Bruk den til å finne kanter og grunner med fisk.', 'The seabed in colour with depth contours. Use it to find edges and banks holding fish.') : L('Blått er grunnere enn sikker dybde. Båten stikker ', 'Blue is shallower than the safety depth. The boat draws ') + fmt(BOAT.draft, 1) + ' m.') + '</p></div>';
}
function panelRoute(){
  const b = S.boat, h = [];
  if (document.body.classList.contains('vplot')) h.push(chartSettings());
  if (b.status === 'adrift'){
    h.push('<h3>' + t('st_adrift') + '</h3><p class="bad">' + t('adrift_msg') + '</p>');
    h.push('<div class="btns"><button class="btn primary" data-act="tow">' + t('tow', kr(PRICE.tow)) + '</button></div>');
    return h.join('');
  }
  if (S.plan && S.plan.depAt){
    const H1 = S.plan.depAt / 60, rest = S.plan.wps.slice(S.plan.idx);
    h.push('<h3>' + t('dep_planned') + '</h3><p>' + dayStr(H1) + ' ' + hm(H1) + ' <small class="note">' + inReal(S.plan.depAt - S.t) + '</small> · ' + dirName(windDir(H1)) + ' ' + fmt(fcWind(H1, S.t / 60), 0) + ' m/s</p>');
    h.push('<ul class="wps">' + rest.map((w, i) => '<li><span class="n' + (w.fish > 0 ? ' f' : '') + '">' + (i + 1) + '</span><span class="lbl">' + (w.port ? portById(w.port).name : coordStr(w)) + '<small>' + (w.port ? '' : (w.fish > 0 ? t('fish_h', w.fish) : t('no_fish'))) + '</small></span></li>').join('') + '</ul>');
    if (S.settings.autoOn) h.push('<p class="note">' + (S.lang === 'no' ? 'Blåser det mer enn ' + S.settings.autoW + ' m/s ved avgang, venter båten en time om gangen.' : 'If it blows more than ' + S.settings.autoW + ' m/s at departure, the boat waits an hour at a time.') + '</p>');
    h.push('<div class="btns"><button class="btn primary" data-act="depnow">' + t('dep_go') + '</button><button class="btn" data-act="depcancel">' + t('dep_cancel') + '</button></div>');
    return h.join('');
  }
  if (S.plan && b.status !== 'idle'){
    const rest = S.plan.wps.slice(S.plan.idx);
    h.push('<h3>' + (S.plan.returning ? t('ret_active') : t('active')) + '</h3>');
    h.push('<ul class="wps">' + rest.map((w, i) => '<li><span class="n' + (w.fish > 0 ? ' f' : '') + '">' + (S.plan.idx + i + 1) + '</span><span class="lbl">' + (w.port ? portById(w.port).name : coordStr(w)) + '<small>' + (w.port ? '' : (w.act ? wpActLabel(w.act) + (w.fish > 0 ? ', ' : '') : '') + (w.fish > 0 ? t('fish_h', w.fish) : w.act ? '' : t('no_fish'))) + '</small></span></li>').join('') + '</ul>');
    h.push('<div class="range"><input type="range" min="2" max="' + BOAT.vmax + '" step="1" value="' + Math.min(S.plan.speed, BOAT.vmax) + '" id="spdLive" aria-label="' + t('speed') + '"><output id="spdLiveOut">' + S.plan.speed + ' kn</output></div>');
    if (b.status === 'sailing' && b.v < S.plan.speed - 0.5) h.push('<p class="note">' + t('speed_live') + ': ' + fmt(b.v, 0) + ' kn (' + t('waves').toLowerCase() + ')</p>');
    h.push('<div class="btns">' + (S.plan.returning ? '' : '<button class="btn" data-act="retrace">' + t('retrace') + '</button>') + (b.status === 'sailing' ? '<button class="btn" data-act="stop">' + t('stop') + '</button>' : '') + '</div>');
    return h.join('');
  }
  h.push('<p class="note">' + t('route_hint') + (S.marks.length ? ' ' + t('marks_n') : '') + '</p>');
  if (!S.draft.length){ h.push('<p>' + t('route_empty') + '</p>'); return h.join(''); }
  h.push('<ul class="wps">' + S.draft.map((w, i) => {
    const lbl = w.port ? portById(w.port).name : coordStr(w);
    const ctl = w.port ? '' : '<span class="step"><button data-act="fm" data-i="' + i + '" aria-label="−">−</button><output>' + (w.fish > 0 ? t('fish_h', w.fish) : t('no_fish')) + '</output><button data-act="fp" data-i="' + i + '" aria-label="+">+</button></span>';
    const gch = w.port ? '' : '<button class="gchip' + (w.act ? ' on' : '') + '" data-act="gwp" data-i="' + i + '">' + wpActLabel(w.act) + '</button>';
    return '<li><span class="n' + (wpStop(w) && !w.port ? ' f' : '') + '">' + (i + 1) + '</span><span class="lbl">' + lbl + gch + '</span>' + ctl + '<button class="x" data-act="rm" data-i="' + i + '" aria-label="×">×</button></li>';
  }).join('') + '</ul>');
  const e = estimate();
  h.push('<div class="range"><input type="range" min="2" max="' + BOAT.vmax + '" step="1" value="' + Math.min(S.draftSpeed, BOAT.vmax) + '" id="spd" aria-label="' + t('speed') + '"><output id="spdOut">' + S.draftSpeed + ' kn, ' + t('lpnm', fmt(fuelLph(S.draftSpeed, windAt(S.t / 60)) / S.draftSpeed, 2)) + '</output></div>');
  { const H0 = S.t / 60, opts = ['<option value="">' + t('dep_now') + '</option>'];
    for (let k = 1; k <= 36; k++){ const m = (Math.floor(H0) + k) * 60, H1 = m / 60; opts.push('<option value="' + m + '"' + (S.draftDep === m ? ' selected' : '') + '>' + (gDate(H1).getUTCDate() !== gDate(H0).getUTCDate() ? dayStr(H1).split(' ')[0] + ' ' : '') + hm(H1) + ' · ' + dirName(windDir(H1)) + ' ' + fmt(fcWind(H1, H0), 0) + ' m/s</option>'); }
    h.push('<div class="kv"><span>' + t('departure') + '</span><span><select id="dep" class="depsel">' + opts.join('') + '</select></span></div>'); }
  h.push('<div class="kv"><span>' + t('dist') + '</span><span>' + fmt(e.nm, 1) + ' nm</span></div>');
  h.push('<div class="kv"><span>' + t('sail_time') + '</span><span>' + dur(e.hours) + ' <small class="note">' + t('real', realDur(e.hours * 60)) + '</small></span></div>');
  if (e.fishH) h.push('<div class="kv"><span>' + t('fish_time') + '</span><span>' + dur(e.fishH) + '</span></div>');
  h.push('<div class="kv"><span>' + t('fuel_est') + '</span><span>' + fmt(e.fuel, 0) + ' L <small class="note">' + t('onboard', fmt(b.fuel, 0)) + '</small></span></div>');
  let can = true;
  if (e.bad >= 0){ h.push('<p class="bad">' + t('crosses', e.bad + 1) + '</p>'); can = false; }
  { const hz = draftHazards(), sd = safeDepth(), bad = hz.map((q, i) => [q, i]).filter(x => x[0].unsafe); if (bad.length) h.push('<p class="warn">' + (S.lang === 'no' ? 'Gult: ' : 'Yellow: ') + bad.slice(0, 4).map(([q, i]) => (S.lang === 'no' ? 'etappe ' : 'leg ') + (i + 1) + ' (' + (q.minD < sd ? fmt(q.minD, 1) + ' m' : '') + (q.minD < sd && q.rocks ? ', ' : '') + (q.rocks ? (S.lang === 'no' ? 'skjær' : 'rocks') : '') + ')').join(', ') + '. ' + (S.lang === 'no' ? 'Sikker dybde er ' + sd + ' m, båten stikker ' + fmt(BOAT.draft, 1) + ' m. Du kan kjøre ruten, men da på egen risiko.' : 'Safety depth is ' + sd + ' m, the boat draws ' + fmt(BOAT.draft, 1) + ' m. You can run the route, at your own risk.') + '</p>'); }
  if (S.draft.length && S.draft[S.draft.length - 1].port && b.status === 'port') h.push('<div class="btns"><button class="btn" data-act="opssave">' + (S.lang === 'no' ? 'Lagre som fast driftsplan' : 'Save as standing plan') + '</button></div>');
  if (false){ let rk = 0, a0 = b.pos; for (const w of S.draft){ rk += rocksNear(a0, w, 0.03); a0 = w; } if (rk) h.push('<p class="warn">' + (S.lang === 'no' ? 'Ruten går tett forbi ' + rk + (rk === 1 ? ' skjær eller båe' : ' skjær og båer') + '. Sjekk kartet.' : 'The route passes close to ' + rk + (rk === 1 ? ' rock' : ' rocks') + '. Check the chart.') + '</p>'); }
  if (e.fuel > b.fuel){ h.push('<p class="bad">' + t('nofuel') + '</p>'); can = false; }
  else if (e.fuel > b.fuel * 0.8) h.push('<p class="warn">' + t('lowres') + '</p>');
  h.push('<div class="btns"><button class="btn primary" data-act="start"' + (can ? '' : ' disabled') + '>' + t('start') + '</button><button class="btn" data-act="undo">' + t('undo') + '</button><button class="btn" data-act="clear">' + t('clear') + '</button></div>');
  return h.join('');
}

function echoSvg(){
  const b = S.boat, H = S.t / 60, dep = depthAt(b.pos);
  let tot = 0; SP.forEach(sp => tot += density(sp, b.pos, H));
  const W = 320, Hh = 110, bottom = 12 + 84 * Math.min(1, dep / 260);
  const g = ['<svg viewBox="0 0 ' + W + ' ' + Hh + '" class="echo" role="img" aria-label="' + t('echo') + '">'];
  let path = 'M0,' + Hh + ' ';
  for (let x = 0; x <= W; x += 8) path += 'L' + x + ',' + (bottom + 6 * (vn((S.t / 3 + x) / 40, 9) - 0.5)).toFixed(1) + ' ';
  path += 'L' + W + ',' + Hh + ' Z';
  g.push('<path d="' + path + '" fill="#b04a16"/>');
  const n = Math.round(Math.min(60, tot * 26));
  for (let i = 0; i < n; i++){
    const x = Math.random() * W, y = bottom * (0.55 + 0.42 * Math.random());
    g.push('<ellipse cx="' + x.toFixed(1) + '" cy="' + (y - 4).toFixed(1) + '" rx="' + (2 + Math.random() * 3).toFixed(1) + '" ry="1.6" fill="' + (Math.random() < 0.3 ? '#f2d33a' : '#4fc0e8') + '"/>');
  }
  g.push('</svg>');
  const lvl = tot < 0.15 ? 0 : tot < 0.45 ? 1 : tot < 0.9 ? 2 : 3;
  return g.join('') + '<div class="kv"><span>' + t('depth', dep) + '</span><span>' + t('echo' + lvl) + '</span></div>';
}
function panelFish(){
  const b = S.boat, h = [];
  h.push('<h3>' + t('echo') + '</h3>');
  h.push(b.status === 'port' ? '<p class="note">' + t('echo_off') + '</p>' : echoSvg());
  h.push('<h3>' + t('fishing') + '</h3>');
  h.push('<div class="kv"><span>' + t('gear') + '</span><span class="' + (b.gear ? 'r0' : 'r2') + '">' + (b.gear ? t('gear_ok') : t('gear_lost')) + '</span></div>');
  if (b.status === 'fishing' && b.gop){ h.push('<p class="note">' + GL('Redskapsarbeid, se under.', 'Gear work, see below.') + '</p>'); }
  else if (b.status === 'fishing'){
    const L = (no, en) => S.lang === 'no' ? no : en, dk = deckPending() > 0.5;
    h.push('<p>' + t('fish_left', dur((b.fishUntil - S.t) / 60)) + ' <small class="note">' + inReal(b.fishUntil - S.t) + '</small></p><div class="btns"><button class="btn" data-act="stopfish">' + t('stop_fish') + '</button>' +
      (b.deckStop && !b.deckEnd ? '<button class="btn" data-act="deckgo">' + L('Fisk videre', 'Fish on') + '</button>' : dk ? '<button class="btn" data-act="deckstop">' + L('Stopp og sløy', 'Stop and gut') + '</button>' : '') + '</div>');
  } else if (b.status === 'idle'){
    h.push('<div class="btns"><span class="step"><button data-act="fh-" aria-label="−">−</button><output>' + t('fish_h', S.fishPlanH) + '</output><button data-act="fh+" aria-label="+">+</button></span><button class="btn primary" data-act="startfish">' + t('start_fish') + '</button></div>');
  } else h.push('<p class="note">' + t('fish_where') + '</p>');
  h.push('<h3>' + t('handling') + '</h3>');
  h.push('<p class="note">' + (S.lang === 'no' ? 'Fisken blør du idet den kommer over ripa, og så ligger den i bløggekaret til den blir sløyd og iset.' : 'The fish is bled as it comes over the rail and lies in the bleeding tub until it is gutted and iced.') + '</p>');
  if (holdTotal() > 0.5) h.push('<p class="note"><b>' + deckText(false) + '</b></p>');
  h.push('<label class="tog"><input type="checkbox" id="setGut"' + (S.settings.gut ? ' checked' : '') + '><span>' + t('gut') + '<small>' + t('gut_n') + '</small></span></label>');
  h.push('<label class="tog"><input type="checkbox" id="setIce"' + (S.settings.ice ? ' checked' : '') + '><span>' + t('icing') + '<small>' + t('icing_n') + '</small></span></label>');
  h.push('<label class="tog"><input type="checkbox" id="setDeckFirst"' + (S.settings.deckFirst !== false ? ' checked' : '') + '><span>' + t('deck_first') + '<small>' + t('deck_first_n') + '</small></span></label>');
  h.push(gearPanel());
  return h.join('');
}
function valueEst(sp, g){ const H = S.t / 60, ps = PORTS.filter(p => p.mottak).map(p => price(p, sp, H)); return ps.reduce((a, c) => a + c, 0) / ps.length * GM[g]; }
function panelHold(){
  const b = S.boat, tot = holdTotal(), h = [];
  h.push('<div class="kv"><span>' + t('load') + '</span><span>' + fmt(tot, 0) + ' / ' + capHold() + ' kg</span></div><div class="bar"><i style="width:' + (100 * tot / BOAT.holdCap).toFixed(1) + '%"></i></div>');
  h.push('<div class="kv"><span>' + t('ice') + '</span><span>' + fmt(b.ice, 0) + ' / ' + BOAT.iceCap + ' kg</span></div>');
  h.push('<div class="kv"><span>' + t('fuel') + '</span><span>' + fmt(b.fuel, 0) + ' / ' + BOAT.fuelCap + ' L</span></div>');
  if (!tot){ h.push('<p class="note">' + t('hold_empty') + '</p>'); return h.join(''); }
  const agg = {};
  for (const x of S.hold){ const g = grade(x.fresh), k = x.sp + g; agg[k] = agg[k] || {sp:x.sp, g, kg:0}; agg[k].kg += x.kg; }
  const rows = Object.values(agg).sort((a, c) => ALLSP.indexOf(a.sp) - ALLSP.indexOf(c.sp) || 'EABX'.indexOf(a.g) - 'EABX'.indexOf(c.g));
  let sum = 0;
  h.push('<table class="tbl"><thead><tr><th>' + t('species') + '</th><th>' + t('quality') + '</th><th>' + t('kg') + '</th><th>' + t('value') + '</th></tr></thead><tbody>');
  rows.forEach(r => { const v = r.kg * valueEst(r.sp, r.g); sum += v; h.push('<tr><td>' + spName(r.sp) + '</td><td>' + t('grade_' + r.g) + '</td><td>' + fmt(r.kg, 0) + '</td><td>' + kr(v) + '</td></tr>'); });
  h.push('<tr class="sum"><td>' + t('total') + '</td><td></td><td>' + fmt(tot, 0) + '</td><td>' + kr(sum) + '</td></tr></tbody></table>');
  h.push('<p class="note">' + t('hold_n') + '</p>');
  return h.join('');
}
function fcChart(){
  const now = S.t / 60, W = 340, Hh = 130, l = 26, r = 8, top = 8, bot = 22, max = 25;
  const x = i => l + (W - l - r) * i / 48, y = w => top + (Hh - top - bot) * (1 - Math.min(w, max) / max);
  let d = '';
  for (let i = 0; i <= 48; i++) d += (i ? 'L' : 'M') + x(i).toFixed(1) + ',' + y(fcWind(now + i, now)).toFixed(1);
  const g = ['<svg viewBox="0 0 ' + W + ' ' + Hh + '" class="fc" role="img" aria-label="' + t('fc') + '">'];
  [[10.8, 'var(--warn)'], [13.9, 'var(--bad)']].forEach(([v, c]) => g.push('<line x1="' + l + '" x2="' + (W - r) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="' + c + '" stroke-dasharray="3 3" stroke-width="1"/>'));
  if (S.settings.autoOn) g.push('<line x1="' + l + '" x2="' + (W - r) + '" y1="' + y(S.settings.autoW) + '" y2="' + y(S.settings.autoW) + '" stroke="var(--mag)" stroke-width="1"/>');
  g.push('<path d="' + d + 'L' + x(48) + ',' + y(0) + ' L' + x(0) + ',' + y(0) + ' Z" fill="var(--water)" opacity=".12"/>');
  g.push('<path d="' + d + '" fill="none" stroke="var(--ink)" stroke-width="1.8"/>');
  [0, 5, 10, 15, 20, 25].forEach(v => g.push('<text x="' + (l - 5) + '" y="' + (y(v) + 3.5) + '" font-size="10" text-anchor="end" fill="var(--muted)">' + v + '</text>'));
  for (let i = 0; i <= 48; i++){ if (Math.floor(now + i) % 6 === 0) g.push('<text x="' + x(i) + '" y="' + (Hh - 6) + '" font-size="10" text-anchor="middle" fill="var(--muted)">' + hm(Math.floor(now + i)).slice(0, 2) + '</text>'); }
  g.push('</svg>');
  return g.join('');
}
function panelWx(){
  const b = S.boat, H = S.t / 60, W = windAt(H), hs = hsAt(b.pos, H), h = [];
  h.push('<h3>' + t('now') + '</h3>');
  h.push('<div class="kv"><span>' + t('wind') + '</span><span>' + dirName(windDir(H)) + ' ' + fmt(W, 1) + ' m/s, ' + BFN[S.lang][beaufort(W)] + '</span></div>');
  h.push('<div class="kv"><span>' + t('waves') + ', ' + t('here').toLowerCase() + '</span><span>' + fmt(hs, 1) + ' m <span class="r' + riskLevel(W, hs) + '">' + t('risk' + riskLevel(W, hs)) + '</span></span></div>');
  h.push('<div class="kv"><span>' + t('waves') + ', ' + t('open').toLowerCase() + '</span><span>' + fmt(hsOpen(H), 1) + ' m <span class="r' + riskLevel(W, hsOpen(H)) + '">' + t('risk' + riskLevel(W, hsOpen(H))) + '</span></span></div>');
  const pr = precipAt(H), snow = airTemp(H) < 1;
  const prs = pr < 0.08 ? t('p_none') : (pr < 0.4 ? t('p_light') + ' ' : pr > 0.75 ? t('p_heavy') + ' ' : '') + t(snow ? 'p_snow' : 'p_rain');
  h.push('<div class="kv"><span>' + t('temp') + '</span><span>' + fmt(Math.round(airTemp(H)) || 0, 0) + ' °C</span></div>');
  h.push('<div class="kv"><span>' + t('precip') + '</span><span>' + prs + '</span></div>');
  h.push('<div class="kv"><span>' + t('vis') + '</span><span>' + fmt(visibility(H), 0) + ' km</span></div>');
  h.push('<p class="note">' + t('limits') + '</p>');
  h.push('<h3>' + t('fc') + '</h3>' + fcChart());
  const ex = exposure(b.pos);
  h.push('<table class="tbl"><thead><tr><th>' + t('time') + '</th><th>' + t('wind') + '</th><th>' + t('open') + '</th><th>' + t('here') + '</th></tr></thead><tbody>');
  for (let i = 3; i <= 48; i += 3){
    const Hh = Math.floor(H / 3) * 3 + i, w = fcWind(Hh, H), ho = fcHsOpen(Hh, H), hh = Math.max(0.05, ho * Math.pow(ex, 1.3));
    const lab = (gDate(Hh).getUTCHours() < 3 ? dayStr(Hh) + ' ' : '') + hm(Hh);
    h.push('<tr><td>' + lab + '</td><td class="r' + riskLevel(w, 0) + '">' + dirName(windDir(Hh)) + ' ' + fmt(w, 0) + '</td><td class="r' + riskLevel(0, ho) + '">' + fmt(ho, 1) + ' m</td><td class="r' + riskLevel(w, hh) + '">' + fmt(hh, 1) + ' m</td></tr>');
  }
  h.push('</tbody></table><p class="note">' + t('fc_n') + '</p>');
  h.push('<label class="tog"><input type="checkbox" id="setAuto"' + (S.settings.autoOn ? ' checked' : '') + '><span>' + t('auto') + '<small>' + t('auto_n') + '</small></span></label>');
  h.push('<div class="range"><input type="range" min="6" max="20" step="1" value="' + S.settings.autoW + '" id="autoW" aria-label="' + t('auto') + '"' + (S.settings.autoOn ? '' : ' disabled') + '><output id="autoWOut">' + S.settings.autoW + ' m/s</output></div>');
  return h.join('');
}
// where a landing has got to, for the action bar and the harbour panel
function landText(short){
  const L0 = S.boat.land; if (!L0) return '';
  const st = landState(L0, S.t), L = (no, en) => S.lang === 'no' ? no : en, u = L0.kind === 'tub' ? L('kar', 'tubs') : L('kasser', 'boxes'), at = hm(L0.until / 60);
  // the action bar: a line for wide screens and a short one for narrow
  if (short) return st.phase === 'prep' ? [L('Gjør klar kranen', 'Rigging the crane'), L('Kran', 'Crane')] : st.phase === 'note' ? [L('Veier inn · seddel ', 'Weighing · note ') + at, L('Seddel ', 'Note ') + at] : [L('Losser ', 'Landing ') + st.units + '/' + L0.n + ' ' + u, st.units + '/' + L0.n + ' ' + u];
  return st.phase === 'prep' ? L('Mottaket gjør klar kranen og trucken.', 'The plant is getting the crane and the forklift ready.') : st.phase === 'note' ? L('Alt er på kaia. Fangsten veies inn.', 'Everything is ashore. The catch is being weighed in.')
    : L(st.units + ' av ' + L0.n + ' ' + u + ' er på kaia.', st.units + ' of ' + L0.n + ' ' + u + ' are ashore.');
}
// the bleeding tub: what lies in it and how long the work takes with the hands free for it now
function deckText(short){
  const L = (no, en) => S.lang === 'no' ? no : en, kg = deckPending(), hands = deckHands(), b = S.boat;
  if (kg < 0.5) return short ? '' : L('Karet er tomt. Alt er tatt unna.', 'The tub is empty. Everything is seen to.');
  const eta = deckEta(hands), when = hands ? (eta < 1 ? L('under ett minutt', 'under a minute') : dur(eta / 60)) : null;
  if (short) return [L('Dekk: ', 'Deck: ') + fmt(kg, 0) + ' kg' + (when ? ' · ' + when : ''), fmt(kg, 0) + ' kg'];
  return L(fmt(kg, 0) + ' kg i bløggekaret. ', fmt(kg, 0) + ' kg in the bleeding tub. ') + (hands ? L(hands + (hands > 1 ? ' mann' : ' mann') + ' på dekk, ferdig om ' + when + '.', hands + (hands > 1 ? ' hands' : ' hand') + ' on deck, done in ' + when + '.')
    : b.status === 'fishing' ? L('Alene kan du ikke sløye og fiske samtidig.', 'Alone you cannot gut and fish at once.') : L('Alene kan du ikke sløye mens du kjører.', 'Alone you cannot gut while you steer.'));
}
// what is going on at the quay besides a landing: moving to the other quay, or the pump running
function quayText(short){
  const b = S.boat, L = (no, en) => S.lang === 'no' ? no : en;
  if (b.shift){ const to = b.shift.to === 'bunker'; return short ? [to ? L('Går til bunkerskaia', 'To the bunker quay') : L('Går til mottakskaia', 'To the plant\'s quay'), to ? L('Til bunkers', 'To bunker') : L('Til mottak', 'To plant')] : (to ? L('Båten går bort til bunkerskaia.', 'The boat is moving to the bunker quay.') : L('Båten går tilbake til mottakskaia.', 'The boat is moving back to the plant\'s quay.')); }
  if (b.fueling){ const f = b.fueling, n = fmt(f.done, 0) + ' / ' + fmt(f.liters, 0) + ' L'; return short ? [L('Fyller ', 'Filling ') + n, n] : L('Pumpa går: ' + n + ', ferdig ca. kl. ' + whenTxt(f.until) + '.', 'The pump is running: ' + n + ', done at about ' + whenTxt(f.until) + '.'); }
  return '';
}
function panelPort(){
  const b = S.boat, H = S.t / 60, h = [];
  if (b.status === 'port'){
    const p = portById(b.port), svc = [];
    if (p.fuel) svc.push(t('svc_fuel')); if (p.ice) svc.push(t('svc_ice')); if (p.mottak) svc.push(t('svc_mottak'));
    h.push('<h3>' + p.name + '</h3><div class="kv"><span>' + t('services') + '</span><span>' + svc.join(', ') + '</span></div>');
    const btn = [];
    const tot = holdTotal();
    if (b.shift || b.fueling) h.push('<p class="note">' + quayText(false) + '</p>');
    if (b.land) h.push('<p class="note"><b>' + (S.lang === 'no' ? 'Lossing: ' : 'Landing: ') + '</b>' + landText(false) + ' ' + (S.lang === 'no' ? 'Sluttseddelen kommer ca. kl. ' : 'The landing note comes at about ') + whenTxt(b.land.until) + '.</p>');
    else if (p.mottak && tot > 0 && !b.shift && !b.fueling) btn.push('<button class="btn primary" data-act="sell">' + t('sell', fmt(tot, 0)) + '</button>');
    if (p.fuel){ const need = BOAT.fuelCap - b.fuel; btn.push('<button class="btn" data-act="fuel"' + (need < 0.5 || portBusy(b) ? ' disabled' : '') + '>' + t('fill_fuel', fmt(need, 0), kr(need * fuelPrice())) + '</button>'); }
    if (p.ice) btn.push('<button class="btn" data-act="ice"' + (b.ice > BOAT.iceCap - 1 || b.shift || b.land && berthKind(b) !== 'main' ? ' disabled' : '') + '>' + t('buy_ice', kr(50 * PRICE.ice)) + '</button>');
    if (!b.gear) btn.push('<button class="btn" data-act="gear">' + t('buy_gear', kr(PRICE.gear)) + '</button>');
    h.push('<div class="btns">' + btn.join('') + '</div>');
    if (!p.mottak) h.push('<p class="note">' + t('no_mottak') + '</p>');
    if (!p.ice) h.push('<p class="note">' + (S.lang === 'no' ? 'Is får du kjøpt på fiskemottakene.' : 'Ice is sold at the fish plants.') + '</p>');
    const ls = S.lastSale;
    if (ls && ls.port === b.port && S.t - ls.t < 240){
      const LN = (no, en) => S.lang === 'no' ? no : en;
      h.push('<h3>' + t('slip', portById(ls.port).name) + (ls.field ? ' · ' + LN('fangstfelt', 'field') + ' ' + ls.field : '') + (ls.gear && ls.gear.length ? ' · ' + ls.gear.map(k => k === 'juksa' ? LN('juksa', 'jig') : GEAR[k][S.lang].toLowerCase()).join(', ') : '') + '</h3><div style="overflow-x:auto"><table class="tbl"><thead><tr><th>' + t('species') + '</th><th>' + LN('Størrelse', 'Size') + '</th><th>' + t('quality') + '</th><th>' + t('kg') + '</th><th>kr/kg</th><th>kr</th></tr></thead><tbody>');
      ls.lines.forEach(r => { const sd = SPECIES[r.sp], cl = sd && sd.cls[r.c], pk = r.gut ? r.kg / sd.uh : r.kg;
        h.push('<tr><td>' + spName(r.sp) + (r.gut ? ' <small>' + LN('sløyd u/h', 'gutted') + '</small>' : '') + '</td><td>' + (cl ? cl[2] : '') + '</td><td>' + t('grade_' + r.g) + '</td><td>' + fmt(pk, 0) + '</td><td>' + fmt(r.sum / Math.max(pk, 0.01), 2) + '</td><td>' + fmt(r.sum, 0) + '</td></tr>'); });
      for (const n in (ls.ex || {})) if (ls.ex[n].kg > 0.05) h.push('<tr><td>' + (n === 'lever' ? LN('Lever', 'Liver') : LN('Rogn', 'Roe')) + '</td><td></td><td></td><td>' + fmt(ls.ex[n].kg, 1) + '</td><td></td><td>' + fmt(ls.ex[n].sum, 0) + '</td></tr>');
      if (ls.streak && ls.streak.kr > 0) h.push('<tr><td colspan="3">' + LN('Innloggingsbonus +', 'Login bonus +') + fmt(ls.streak.pct, 0) + ' %</td><td></td><td></td><td>' + fmt(ls.streak.kr, 0) + '</td></tr>');
      if (ls.crabFine) h.push('<tr><td colspan="3">' + LN('Gebyr for krabbe under minstemål', 'Fine for undersized crab') + '</td><td></td><td></td><td>−' + fmt(ls.crabFine, 0) + '</td></tr>');
      if (ls.roeCut > 0.5) h.push('<tr><td colspan="3">' + LN('Trekk for rognkrabbe (dårlig sortering)', 'Deduction for berried crab (poor sorting)') + '</td><td></td><td></td><td>−' + fmt(ls.roeCut, 0) + '</td></tr>');
      if (ls.confKg > 0.5) h.push('<tr><td colspan="3">' + (ls.acc === 'none' ? LN('Inndratt over bifangstgrensen', 'Over the bycatch limit, confiscated') : LN('Inndratt torsk over kvote', 'Cod over quota, confiscated')) + '</td><td>' + fmt(ls.confKg, 0) + '</td><td></td><td>−' + fmt(ls.confKr, 0) + '</td></tr>');
      h.push('<tr class="sum"><td>' + t('total') + '</td><td></td><td></td><td>' + fmt(ls.lines.reduce((a, r) => a + (r.gut ? r.kg / SPECIES[r.sp].uh : r.kg), 0), 0) + '</td><td></td><td>' + fmt(ls.total, 0) + '</td></tr></tbody></table></div>');
      for (const o of (ls.ord || [])) h.push('<p class="note">' + LN('Bestilling fra ' + o.cust + ': ' + fmt(o.kg, 0) + ' kg ' + SPECIES[o.sp].no.toLowerCase() + ', tillegg ' + kr(Math.round(o.kr)) + (o.done ? ', ferdig levert, bonus ' + kr(o.bonus) : ', ' + fmt(o.left, 0) + ' kg igjen') + '.', 'Order from ' + o.cust + ': ' + fmt(o.kg, 0) + ' kg ' + SPECIES[o.sp].en.toLowerCase() + ', premium ' + kr(Math.round(o.kr)) + (o.done ? ', fully delivered, bonus ' + kr(o.bonus) : ', ' + fmt(o.left, 0) + ' kg left') + '.') + '</p>');
      if (ls.ffKg > 0.5) h.push('<p class="note">' + LN(fmt(ls.ffKg, 0) + ' kg torsk gikk på ferskfiskordningen og belastes ikke kvoten.', fmt(ls.ffKg, 0) + ' kg of cod went on the fresh-fish scheme and does not count against the quota.') + '</p>');
    }
  } else h.push('<p class="note">' + t('not_port') + '</p>');
  h.push('<h3>' + t('prices') + '</h3><div style="overflow-x:auto"><table class="tbl"><thead><tr><th>' + t('port_col') + '</th>' + SP.map(sp => '<th>' + spName(sp) + '</th>').join('') + '</tr></thead><tbody>');
  PORTS.filter(p => p.mottak).forEach(p => h.push('<tr' + (b.port === p.id && b.status === 'port' ? ' class="here"' : '') + '><td>' + p.name + '</td>' + SP.map(sp => '<td>' + fmt(price(p, sp, H), 0) + '</td>').join('') + '</tr>'));
  h.push('</tbody></table></div><p class="note">' + t('prices_n') + '</p>');
  h.push('<h3>' + t('stats') + '</h3>');
  h.push('<div class="kv"><span>' + t('rev') + '</span><span>' + kr(S.stats.revenue) + '</span></div>');
  h.push('<div class="kv"><span>' + t('costs') + '</span><span>' + kr(S.stats.costs) + '</span></div>');
  h.push('<div class="kv"><span>' + t('net') + '</span><span>' + kr(S.stats.revenue - S.stats.costs) + '</span></div>');
  h.push('<div class="kv"><span>' + t('landed') + '</span><span>' + fmt(S.stats.kg, 0) + ' kg</span></div>');
  h.push('<div class="kv"><span>' + t('trips') + '</span><span>' + S.stats.trips + '</span></div>');
  h.push('<div class="btns"><button class="btn" data-act="reset">' + t('reset') + '</button></div>');
  return h.join('');
}
function panelLog(){
  if (!S.log.length) return '<p class="note">' + t('empty_log') + '</p>';
  return '<ul class="log">' + S.log.slice().reverse().map(e => '<li><time>' + dayStr(e.t / 60) + ' ' + hm(e.t / 60) + '</time><span>' + (S.lang === 'no' ? e.no : e.en) + '</span></li>').join('') + '</ul>';
}
let panelHtml = '';
function renderPanel(){
  const f = {route:panelRoute, fish:panelFish, hold:panelHold, wx:panelWx, port:panelPort, log:panelLog}[tab], html = f();
  if (html === panelHtml) return; panelHtml = html; panel.innerHTML = html;
}
function panelBusy(){ const a = document.activeElement; return pressHold || (a && panel.contains(a) && (a.type === 'range' || a.tagName === 'SELECT')); }

