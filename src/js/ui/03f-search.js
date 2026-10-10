// ===== Search in the chart plotter (Jonas 09.10.2026: «Kan du bygge inn en søke-knapp i kartplotteren slik at man kan søke opp plasser?
// Det vil gjøre det mye enklere å planlegge en seilas»). The magnifier over the boat button opens a field; what is typed is looked for
// among the places of the game (fish plants, yards, tackle shops, rorbuer, the naust) and the chart's own names (towns, fjords and sounds,
// islands, peaks and capes: the core's names0 everywhere, the chart packs' names as they come). The packs of the whole coast are fetched
// while the field is open (the chart's own queue, 03-map.js CHQ), so the names of a far tile come in a moment later. A position can be
// typed too, as decimal degrees («70.99 24.87»). The place chosen is shown with a ring, and its card offers Autonav there, or a mark.
const SRCH = {el:null, card:null, hit:null, list:null, nPk:-1, t:0, fetching:false};
const SRCH_SEA = ['Tettsted', 'Fjord, sund eller bukt', 'Øy', 'Topp eller nes'], SRCH_SEA_EN = ['Town', 'Fjord, sound or bay', 'Island', 'Peak or cape'];
function srchKind(p){
  const k = p.rorbu ? 'rorbu' : portKind(p) || 'havn';
  return {mottak:['Fiskemottak', 'Fish plant'], verft:['Verft', 'Yard'], butikk:['Utstyrsbutikk', 'Tackle shop'], naust:['Fars naust', 'Father\'s naust'], rorbu:['Rorbu', 'Rorbu'], havn:['Havn', 'Harbour']}[k];
}
// the chart's tiles (a joined pack, tools/map/game.py, is filed under each of its tiles; 01b-mapdata.js mapStart)
const srchTiles = () => [...MAPD.byTile.values()].filter(pk => pk.kind === 'chart');
// everything that can be found, built again when more chart packs have come
function srchItems(){
  const T = MAPD.man ? MAPD.man.tile : 50, loaded = srchTiles().filter(pk => pk.buf);
  if (SRCH.list && SRCH.nPk === loaded.length) return SRCH.list;
  const out = [], seen = new Map(), add = (name, sub, p, port, rank) => {
    const key = name.toLowerCase(), prev = seen.get(key);
    if (prev && prev.some(q => dist(q.p, p) < 2)) return;
    const it = {name, lc:key, sub, p, port, rank}; out.push(it); if (prev) prev.push(it); else seen.set(key, [it]);
  };
  for (const p of PORTS) add(p.name, srchKind(p), p.p, p, 0);
  for (const r of (typeof RORBUER !== 'undefined' ? RORBUER : [])) add(r.name, srchKind(r), r.p, r, 1);
  if (MAPD.core && MAPD.core.buf) for (const q of chartNamesOf(MAPD.core, 'names0', 0.01, 0, 0)) add(q[4], [SRCH_SEA[q[2]] || '', SRCH_SEA_EN[q[2]] || ''], {x:q[0], y:q[1]}, null, 2);
  for (const pk of loaded){ if (!mapVec(pk, 'names')) continue; for (const q of chartNamesOf(pk, 'names', 0.001, pk.tile[0] * T, pk.tile[1] * T)) add(q[4], [SRCH_SEA[q[2]] || '', SRCH_SEA_EN[q[2]] || ''], {x:q[0], y:q[1]}, null, 3 + q[3]); }
  SRCH.nPk = loaded.length; return SRCH.list = out;
}
// a typed position: two decimal numbers, latitude then longitude (a comma may be the decimal mark when they are parted by a space)
function srchPos(s){
  const m = s.trim().replace(/[°NnØøEe]/g, ' ').match(/^(-?\d{1,2}(?:[.,]\d+)?)[\s;]+(-?\d{1,3}(?:[.,]\d+)?)\s*$/) || s.trim().match(/^(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)$/);
  if (!m) return null; const lat = +m[1].replace(',', '.'), lon = +m[2].replace(',', '.');
  if (!(lat >= 57 && lat <= 72 && lon >= 3 && lon <= 32)) return null;
  const p = P(lat, lon); return {name:lat.toFixed(4).replace('.', ',') + '° N ' + lon.toFixed(4).replace('.', ',') + '° Ø', sub:['Posisjon', 'Position'], p, port:null, rank:0};
}
// the best matches: the name itself (or with the definite ending: «mefjord» finds Mefjorden), then the name starting with what is typed first, then a word in it, then anywhere; the game's places before the chart's
// names, and the nearer the boat the better
function srchFind(q){
  q = q.trim().toLowerCase(); if (q.length < 2) return [];
  const pos = srchPos(q); if (pos) return [pos];
  const b = S.boat.pos, res = [];
  for (const it of srchItems()){
    const i = it.lc.indexOf(q); if (i < 0) continue;
    const sc = (it.lc === q || it.lc === q + 'en' || it.lc === q + 'a' ? -1 : i === 0 ? 0 : /[\s\-(]/.test(it.lc[i - 1]) ? 1 : 2) * 1e6 + Math.min(it.rank, 3) * 1e5 + dist(b, it.p);
    res.push([sc, it]);
  }
  return res.sort((a, c) => a[0] - c[0]).slice(0, 12).map(r => r[1]);
}
function srchEsc(s){ return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'}[c])); }
const srchNm = p => (dist(S.boat.pos, p) / NM).toFixed(1).replace('.', S.lang === 'no' ? ',' : '.') + ' nm';
// the chart packs of the whole coast, fetched while the field is open (the first time; they are on the device afterwards)
function srchFetch(){
  if (SRCH.fetching) return; const want = srchTiles().filter(pk => !pk.buf);
  if (!want.length) return; SRCH.fetching = true; let left = want.length, i = 0;
  const one = () => { const pk = want[i++]; if (!pk){ return; } mapLoad(pk).catch(() => {}).then(() => { left--; if (SRCH.el && !SRCH.el.hidden) srchRender(); if (!left) SRCH.fetching = false; one(); }); };
  for (let k = 0; k < 3; k++) one();
}
function srchRender(){
  const el = SRCH.el; if (!el || el.hidden) return; const no = S.lang === 'no', inp = el.querySelector('input'), ul = el.querySelector('.sr-l');
  const q = inp.value, rs = srchFind(q), T0 = srchTiles(), tot = T0.length, got = T0.filter(pk => pk.buf).length;
  SRCH.rs = rs;
  ul.innerHTML = rs.map((it, i) => '<button type="button" data-i="' + i + '"><b>' + srchEsc(it.name) + '</b><small>' + (no ? it.sub[0] : it.sub[1]) + ' · ' + srchNm(it.p) + '</small></button>').join('') +
    (q.trim().length >= 2 && !rs.length ? '<p class="sr-n">' + (no ? 'Fant ingen plass med det navnet.' : 'No place by that name.') + '</p>' : '') +
    (got < tot ? '<p class="sr-n">' + (no ? 'Henter kartnavn langs kysten … ' : 'Fetching the chart\'s names along the coast … ') + got + (no ? ' av ' : ' of ') + tot + '</p>' : '') +
    (q.trim().length < 2 ? '<p class="sr-n">' + (no ? 'Skriv et stedsnavn, et mottak, et verft, en rorbu, eller en posisjon (70.99 24.87).' : 'Type a place, a fish plant, a yard, a rorbu, or a position (70.99 24.87).') + '</p>' : '');
}
function srchOpen(on){
  if (!SRCH.el){
    const el = SRCH.el = document.createElement('div'); el.id = 'srch'; el.hidden = true;
    el.innerHTML = '<div class="sr-h"><input type="search" enterkeyhint="search" autocomplete="off" spellcheck="false"><button type="button" class="sr-x" aria-label="Lukk">×</button></div><div class="sr-l"></div>';
    $('aisCard').after(el);
    const inp = el.querySelector('input');
    inp.oninput = () => srchRender();
    inp.onkeydown = e => { if (e.key === 'Enter' && SRCH.rs && SRCH.rs[0]) srchGo(SRCH.rs[0]); if (e.key === 'Escape') srchOpen(false); };
    el.querySelector('.sr-x').onclick = () => srchOpen(false);
    el.querySelector('.sr-l').onclick = e => { const b = e.target.closest('[data-i]'); if (b && SRCH.rs) srchGo(SRCH.rs[+b.dataset.i]); };
  }
  const el = SRCH.el; el.hidden = !on;
  if (on){ const inp = el.querySelector('input'); inp.placeholder = S.lang === 'no' ? 'Søk etter sted …' : 'Search for a place …'; srchRender(); srchFetch(); setTimeout(() => inp.focus(), 30); }
  else { const inp = el.querySelector('input'); inp.blur(); }
  $('zsearch').classList.toggle('on', !!on);
}
// the place chosen: the chart goes there (a harbour close in, a fjord or an island wider), with a ring and a card
function srchGo(it){
  srchOpen(false); if (!it) return;
  SRCH.hit = it; view.cx = it.p.x; view.cy = it.p.y; view.z = clamp(MAP_H / (it.port || it.rank === 0 ? 6 : it.rank === 2 ? 40 : 15), ZMIN, ZMAX); applyView(); scheduleStatic(); srchCard();
}
function srchCard(){
  const it = SRCH.hit, no = S.lang === 'no';
  const c = SRCH.card || (SRCH.card = Object.assign(document.createElement('div'), {id:'srchCard'})); if (!c.parentNode) $('aisCard').after(c);
  if (!it){ c.hidden = true; return; }
  c.hidden = false;
  c.innerHTML = '<div class="ai-h"><b>' + srchEsc(it.name) + '</b><button type="button" data-s="x" aria-label="' + (no ? 'Lukk' : 'Close') + '">×</button></div>' +
    '<div class="ai-t">' + (no ? it.sub[0] : it.sub[1]) + ' · ' + srchNm(it.p) + (no ? ' fra båten' : ' from the boat') + '</div>' +
    '<div class="pin-b"><button type="button" data-s="go">Autonav ' + (no ? 'hit' : 'here') + '</button><button type="button" data-s="pin">' + (no ? 'Lagre merke' : 'Save a mark') + '</button></div>';
  c.querySelector('[data-s=x]').onclick = () => { SRCH.hit = null; c.hidden = true; scheduleStatic(); };
  c.querySelector('[data-s=pin]').onclick = () => {
    const P0 = S.pins = S.pins || []; if (P0.length >= PIN_MAX) P0.shift();
    const id = (S.pinN = (S.pinN || 0) + 1); P0.push({id, x:Math.round(it.p.x * 1000) / 1000, y:Math.round(it.p.y * 1000) / 1000, name:it.name.slice(0, 28), t:S.t});
    SRCH.hit = null; c.hidden = true; save(); scheduleStatic(); toast(no ? 'Merket «' + it.name + '» er lagret i kartet.' : 'The mark «' + it.name + '» is saved on the chart.');
  };
  c.querySelector('[data-s=go]').onclick = () => {
    // a town or an island: to the harbour nearest it within 4 km if there is one, else to the place itself (Autonav finds the water)
    let tgt = it.port ? it.port.p : it.p;
    if (!it.port){ let bd = 4; for (const p of PORTS.concat(typeof RORBUER !== 'undefined' ? RORBUER : [])){ const d = dist(p.p, it.p); if (d < bd){ bd = d; tgt = p.p; } } }
    SRCH.hit = null; c.hidden = true; scheduleStatic();
    if (!canEditDraft()){ toast(no ? 'Ruta kan ikke endres nå.' : 'The route cannot be changed now.'); return; }
    leiaTo({x:tgt.x, y:tgt.y});
  };
}
// the ring round the place found, in the chart's static layer (03-map.js renderStatic)
function srchSvg(u){
  const it = SRCH.hit; if (!it) return '';
  return '<circle cx="' + it.p.x + '" cy="' + it.p.y + '" r="' + (14 * u) + '" class="srchring" stroke-width="' + (3 * u) + '"/><circle cx="' + it.p.x + '" cy="' + it.p.y + '" r="' + (2.5 * u) + '" class="srchdot"/>';
}
if ($('zsearch')) $('zsearch').onclick = () => srchOpen(!(SRCH.el && !SRCH.el.hidden));
