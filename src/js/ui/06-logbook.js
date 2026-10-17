// ---------- deck log ----------
const NAVRE = /Kastet loss|Fortøyd|Fremme|Ny rute|Stoppet båten|Returnerer|går hjem|Avgang|drivstoff\. Båten driver|Motorstopp|Motoren startet|Tok inn sjø|rulling|Slept inn|slepte|Veipunkt|WP\d+ passert|Vinden økte|Overtok/;
const logKind = e => e.k || (NAVRE.test(e.no) ? 'nav' : 'drift');
const dayOf = t0 => Math.floor((t0 / 60 + 6) / 24);
const DAYF = {no:['Søndag','Mandag','Tirsdag','Onsdag','Torsdag','Fredag','Lørdag'], en:['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']};
const MONF = {no:['januar','februar','mars','april','mai','juni','juli','august','september','oktober','november','desember'], en:['January','February','March','April','May','June','July','August','September','October','November','December']};
function longDate(day){ const d = gDate(day * 24 - 6 + 12); return S.lang === 'no' ? DAYF.no[d.getUTCDay()] + ' ' + d.getUTCDate() + '. ' + MONF.no[d.getUTCMonth()] + ' ' + d.getUTCFullYear() : DAYF.en[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + MONF.en[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); }
// the deck log: a book with tabs down the left edge; the pages of the tabs besides Dagbok come from bookTabPages (ui/06b-book-tabs.js)
const BOOK = (() => {
  const el = $('book'), stage = $('bkStage'), dEl = $('bkDate'), tabsEl = $('bkTabs');
  let spread = true, idx = 0, drag = null, busy = false, tab = 'dag', list = [];
  // the tabs down the left edge, coloured as in a real log book; Dagbok is the day-by-day log as before
  const TABS = [['dag', 'Dagbok', 'Log', '#cfc8b4'], ['ses', 'Sesonger', 'Seasons', '#f1a9b7'], ['hen', 'Hendelser', 'Events', '#ece08c'], ['uts', 'Utstyr', 'Gear', '#90dbe0'], ['salg', 'Salg', 'Sales', '#a3b6ee']];
  const L = (no, en) => S.lang === 'no' ? no : en;
  const today = () => dayOf(S.t);
  function first(){ let t0 = S.t; if (S.log.length) t0 = Math.min(t0, S.log[0].t); if (S.navrows.length) t0 = Math.min(t0, S.navrows[0].t); return Math.max(dayOf(t0), today() - 59); }
  const vessel = () => '«' + (S.boatName || 'Havbris') + '» · ' + L('hjemmehavn Finnsnes', 'home port Finnsnes');
  const ll = (x, y) => { const q = LL({x, y}), f = (v, w) => { const a = Math.abs(v), d = Math.floor(a); return String(d).padStart(w, '0') + '°' + ((a - d) * 60).toFixed(1).replace('.', S.lang === 'no' ? ',' : '.') + "'"; }; return f(q.lat, 2) + 'N<br>' + f(q.lon, 3) + (S.lang === 'no' ? 'Ø' : 'E'); };
  function navPage(day){
    const rows = S.navrows.filter(r => dayOf(r.t) === day).map(r => ({t:r.t, r})), ev = S.log.filter(e => dayOf(e.t) === day && logKind(e) === 'nav').map(e => ({t:e.t, e}));
    const wx = S.msgs.filter(m => dayOf(m.t) === day && (m.from === 'Kystradio' || m.from === 'Værvarsel')).map(m => ({t:m.t, e:{no:m.from + ': ' + m.no, en:m.from + ': ' + m.en}}));
    const all = rows.concat(ev, wx).sort((a, b) => a.t - b.t);
    let h = '<div class="pg-h"><span class="pg-t">' + L('Navigasjon', 'Navigation') + '</span><span class="pg-d">' + longDate(day) + '</span></div><div class="pg-v">' + vessel() + '</div>';
    if (!all.length) return h + '<p class="hw">' + L('Ingen føringer denne dagen.', 'No entries this day.') + '</p>';
    h += '<table class="lg"><thead><tr><th>' + L('Kl.', 'Time') + '</th><th>' + L('Kurs', 'Co.') + '</th><th>' + L('Fart', 'Spd') + '</th><th>' + L('Posisjon', 'Position') + '</th><th>' + L('Vind', 'Wind') + '</th><th>' + L('Sjø', 'Sea') + '</th></tr></thead><tbody>';
    for (const a of all){
      if (a.r){ const r = a.r; h += '<tr><td>' + hm(r.t / 60).slice(0, 2) + '</td><td>' + (r.port || r.st !== 'sailing' ? '–' : String(r.hd).padStart(3, '0') + '°') + '</td><td>' + (r.port ? '–' : fmt(r.v, 1)) + '</td><td class="pos">' + (r.port ? portById(r.port).name : ll(r.x, r.y)) + '</td><td>' + dirName(r.wd) + ' ' + fmt(r.W, 0) + '</td><td>' + fmt(r.hs, 1) + ' m</td></tr>'; }
      else h += '<tr class="ev"><td>' + hm(a.t / 60) + '</td><td colspan="5">' + (S.lang === 'no' ? a.e.no : a.e.en) + '</td></tr>';
    }
    return h + '</tbody></table>';
  }
  function driftPage(day){
    const ev = S.log.filter(e => dayOf(e.t) === day && logKind(e) === 'drift');
    let h = '<div class="pg-h"><span class="pg-t">' + L('Driftsplan', 'Operations plan') + '</span><span class="pg-d">' + longDate(day) + '</span></div><div class="pg-v">' + (S.company || '') + '</div><div class="dr">';
    h += ev.length ? ev.map(e => '<p class="hw"><b>' + hm(e.t / 60) + '</b>' + (S.lang === 'no' ? e.no : e.en) + '</p>').join('') : '<p class="hw">' + L('Ingen føringer denne dagen.', 'No entries this day.') + '</p>';
    h += '</div>';
    const sales = S.sales.filter(x => dayOf(x.t) === day);
    if (sales.length){ const kg = sales.reduce((a, x) => a + x.kg, 0), kr0 = sales.reduce((a, x) => a + x.total, 0); h += '<div class="pg-sum">' + L('Landet i dag: ', 'Landed today: ') + fmt(kg, 0) + ' kg · ' + kr(kr0) + '</div>'; }
    return h;
  }
  // page lists: in the log a spread shows one day and a single page alternates navigation and operations; the other tabs are a
  // plain list of pages, two to a spread
  const nPages = () => tab === 'dag' ? (spread ? today() - first() + 1 : (today() - first() + 1) * 2) : Math.max(1, spread ? Math.ceil(list.length / 2) : list.length);
  function pageAt(i, side){
    if (tab !== 'dag') return list[spread ? i * 2 + (side === 'R' ? 1 : 0) : i] || '';
    if (spread){ const day = first() + i; return side === 'L' ? navPage(day) : driftPage(day); }
    const day = first() + Math.floor(i / 2); return i % 2 ? driftPage(day) : navPage(day);
  }
  const lastIdx = () => tab === 'dag' ? (spread ? today() - first() : (today() - first()) * 2) : nPages() - 1;
  function setTab(t, page){
    tab = t; list = t === 'dag' ? [] : bookTabPages(t);
    idx = page != null && t !== 'dag' ? (spread ? Math.floor(page / 2) : page) : lastIdx();
    idx = clamp(idx, 0, nPages() - 1);
  }
  function renderTabs(){
    tabsEl.innerHTML = TABS.map(([k, no, en, c]) => '<button type="button" class="bk-tab' + (k === tab ? ' on' : '') + '" data-bk="tab" data-t="' + k + '" style="--tc:' + c + '"><span>' + L(no, en) + '</span></button>').join('');
  }
  const face = (html, cls, num) => '<div class="face ' + (cls || '') + '"><div class="pgc">' + html + '</div>' + (num ? '<div class="pg-n">' + num + '</div>' : '') + '</div>';
  function label(){
    if (tab !== 'dag'){ const T0 = TABS.find(x => x[0] === tab); dEl.textContent = L(T0[1], T0[2]) + ' · ' + (idx + 1) + ' / ' + nPages(); return; }
    const day = spread ? first() + idx : first() + Math.floor(idx / 2); dEl.textContent = dayStr(day * 24 - 6 + 12) + (spread ? '' : ' · ' + (idx % 2 ? L('drift', 'ops') : L('navigasjon', 'navigation')));
  }
  function render(){
    stage.className = 'bk-stage ' + (spread ? 'spread' : 'single');
    stage.innerHTML = '<div class="bk-cover"></div>' + (spread ? '<div class="pg L">' + face(pageAt(idx, 'L'), '', idx * 2 + 1) + '</div><div class="pg R">' + face(pageAt(idx, 'R'), '', idx * 2 + 2) + '</div>' : '<div class="pg">' + face(pageAt(idx), '', idx + 1) + '</div>');
    label(); renderTabs();
  }
  // open at a tab (the log by default) and, for the other tabs, at one of its pages (the newest when none is given)
  function open(t, page){
    spread = window.innerWidth >= 760 && window.innerHeight >= 480;
    setTab(t || 'dag', page);
    render(); el.hidden = false; void el.offsetWidth; el.classList.add('on');
  }
  function close(){ el.classList.remove('on'); setTimeout(() => { if (!el.classList.contains('on')) el.hidden = true; }, 380); }
  // page turning: the leaf follows the finger around the spine
  function startFlip(dir){
    if (dir > 0 && idx >= nPages() - 1) return null; if (dir < 0 && idx <= 0) return null;
    const leaf = document.createElement('div');
    if (spread){
      if (dir > 0){ stage.querySelector('.pg.R').innerHTML = face(pageAt(idx + 1, 'R'), '', idx * 2 + 4); leaf.className = 'leaf R'; leaf.style.transformOrigin = 'left center'; leaf.innerHTML = face(pageAt(idx, 'R'), 'front', idx * 2 + 2) + face(pageAt(idx + 1, 'L'), 'back', idx * 2 + 3); }
      else { stage.querySelector('.pg.L').innerHTML = face(pageAt(idx - 1, 'L'), '', idx * 2 - 1); leaf.className = 'leaf L'; leaf.style.transformOrigin = 'right center'; leaf.innerHTML = face(pageAt(idx, 'L'), 'front', idx * 2 + 1) + face(pageAt(idx - 1, 'R'), 'back', idx * 2); }
    } else {
      if (dir > 0){ stage.querySelector('.pg').innerHTML = face(pageAt(idx + 1), '', idx + 2); leaf.className = 'leaf'; leaf.style.transformOrigin = 'left center'; leaf.innerHTML = face(pageAt(idx), 'front', idx + 1) + face('', 'back'); }
      else { leaf.className = 'leaf'; leaf.style.transformOrigin = 'left center'; leaf.innerHTML = face(pageAt(idx - 1), 'front', idx) + face('', 'back'); }
    }
    stage.appendChild(leaf); return leaf;
  }
  function setAngle(leaf, dir, p){
    const a = spread ? (dir > 0 ? -180 * p : 180 * p) : (dir > 0 ? -180 * p : -180 * (1 - p));
    leaf.style.transform = 'rotateY(' + a + 'deg)'; leaf.style.setProperty('--sh', (Math.sin(Math.abs(a) * Math.PI / 180) * 0.35).toFixed(3));
  }
  function finish(leaf, dir, p, done){
    busy = true; leaf.style.transition = 'transform .32s cubic-bezier(.3,.7,.3,1)';
    requestAnimationFrame(() => { setAngle(leaf, dir, done ? 1 : 0); });
    setTimeout(() => { busy = false; if (done) idx += dir; render(); }, 340);
  }
  function flip(dir){ if (busy) return; const leaf = startFlip(dir); if (!leaf){ render(); return; } setAngle(leaf, dir, 0); void leaf.offsetWidth; finish(leaf, dir, 0, true); }
  stage.addEventListener('pointerdown', e => { if (busy) return; drag = {x:e.clientX, y:e.clientY, t:performance.now(), dir:0, leaf:null, id:e.pointerId}; });
  stage.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.dir){ if (Math.abs(dx) < 8 || Math.abs(dy) > Math.abs(dx)) return; drag.dir = dx < 0 ? 1 : -1; drag.leaf = startFlip(drag.dir); try { stage.setPointerCapture(e.pointerId); } catch (_){ } if (!drag.leaf){ drag = null; return; } }
    const w = stage.clientWidth / (spread ? 2 : 1), p = clamp((drag.dir > 0 ? -dx : dx) / (w * (spread ? 2 : 0.9)), 0, 1);
    drag.p = p; setAngle(drag.leaf, drag.dir, p);
  });
  const end = e => { if (!drag) return; const d = drag; drag = null; if (!d.leaf) return; const v = (e.clientX - d.x) / Math.max(1, performance.now() - d.t); finish(d.leaf, d.dir, d.p || 0, (d.p || 0) > 0.35 || Math.abs(v) > 0.5); };
  stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);
  el.addEventListener('click', e => { const b = e.target.closest('[data-bk]'); if (!b) return; const a = b.dataset.bk; if (a === 'close') close(); else if (a === 'prev') flip(-1); else if (a === 'next') flip(1); else if (a === 'today'){ idx = lastIdx(); render(); } else if (a === 'tab' && !busy){ setTab(b.dataset.t); render(); } });
  document.addEventListener('keydown', e => { if (el.hidden) return; if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft') flip(-1); else if (e.key === 'ArrowRight') flip(1); });
  window.addEventListener('resize', () => { if (el.hidden) return; const sp = window.innerWidth >= 760 && window.innerHeight >= 480; if (sp !== spread){ const day = spread ? idx : Math.floor(idx / 2); spread = sp; idx = spread ? day : day * 2; idx = clamp(idx, 0, nPages() - 1); render(); } });
  return {open, close, isOpen:() => !el.hidden, get tab(){ return tab; }, get idx(){ return idx; }, get pages(){ return nPages(); }};
})();
$('logbook').onclick = () => BOOK.open();

