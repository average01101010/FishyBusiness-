// ===== «Hvor står fars naust?»: where a new game starts (05.10.2026) =====
// Jonas 04.10.2026: «alle nye brukere skal få bestemme selv hvor i landet de ønsker å starte spillet ... de burde jo få en anbefaling om
// å starte en plass der det er torsk, slik at de tjener penger». After the letter, before the boat's name: the coast's harbours with a
// fish plant (06b-coastports.js and Senja's own) on a small map of Norway and in a list by region, the recommended ones marked: where the
// plant takes in much cod, from small boats, and cod is landed there this month. A tap picks one; «Start her» loads the map round it and
// moves the boat there. Finnsnes (the game's own start, with its guided first trip at Gisundet) stays first in the list.
// The start is also where «Første tur» goes: S.tut.f is the patch of fish nearest the harbour (the best cod within 1.5 to 6 km), S.tut.land
// the plant to land at (the harbour itself; Botnhamn from Finnsnes). Saves from before keep Senja.
const REGIONS = [
  ['ofin', 'Øst-Finnmark', 'East Finnmark', (la, lo) => lo >= 27.3],
  ['vfin', 'Vest-Finnmark', 'West Finnmark', (la, lo) => la >= 70.05],
  ['troms', 'Troms', 'Troms', (la, lo) => la >= 68.8 && lo >= 16.4],
  ['lofv', 'Lofoten og Vesterålen', 'Lofoten and Vesterålen', (la, lo) => la >= 67.75],
  ['hel', 'Helgeland og Salten', 'Helgeland and Salten', (la, lo) => la >= 65.0],
  ['tro', 'Trøndelag', 'Trøndelag', (la, lo) => la >= 63.3],
  ['more', 'Møre og Romsdal', 'Møre og Romsdal', (la, lo) => la >= 62.0],
  ['vest', 'Vestlandet', 'Western Norway', (la, lo) => la >= 59.2],
  ['sor', 'Rogaland og Sørlandet', 'Rogaland and the south coast', () => true]
];
function startInfo(pt){
  const ll = natLL(pt.p), la = ll.lat, lo = ll.lon;
  const mk = pt.mk, cod = mk && mk.sp.torsk ? mk.sp.torsk : null, mon = gDate(S.t / 60).getUTCMonth();
  const inSeason = !!(cod && cod.months & (1 << mon)), codT = cod ? cod.kg / 1000 : 0;
  const score = (Math.log10(1 + codT) + (inSeason ? 1 : 0)) * (0.4 + Math.min(1, (mk ? mk.small : 0) * 2));
  return {la, lo, region:REGIONS.find(r => r[3](la, lo))[0], codT, inSeason, small:mk ? mk.small : 0, score};
}
function showStart(done){
  const L = (no, en) => S.lang === 'no' ? no : en;
  const ports = PORTS.filter(q => q.mottak || q.id === 'finnsnes').map(pt => ({pt, ...startInfo(pt)}));
  // the two best in each region (where there is cod to speak of), so there are good places all along the coast
  const rec = new Set(REGIONS.flatMap(r => ports.filter(x => x.region === r[0] && x.pt.mottak && x.codT >= 30).sort((a, b) => b.score - a.score).slice(0, 2).map(x => x.pt.id)));
  // the map: longitude squeezed by the cosine of 66°, Norway from 4.5° to 31.5° E and 57.8° to 71.4° N
  const W = 300, H = 360, X = lo => (lo - 4.5) / 27 * W, Y = la => (71.4 - la) / 13.6 * H;
  const dots = ports.map(x => '<circle class="st-dot' + (rec.has(x.pt.id) ? ' rec' : '') + (x.pt.id === 'finnsnes' ? ' home' : '') + '" data-id="' + x.pt.id + '" cx="' + X(x.lo).toFixed(1) + '" cy="' + Y(x.la).toFixed(1) + '" r="' + (rec.has(x.pt.id) || x.pt.id === 'finnsnes' ? 5 : 3.2) + '"/>').join('');
  const item = x => '<button class="st-it' + (rec.has(x.pt.id) ? ' rec' : '') + '" data-id="' + x.pt.id + '"><b>' + (rec.has(x.pt.id) ? '★ ' : '') + x.pt.name + '</b><small>' +
    (x.pt.id === 'finnsnes' ? L('Spillets eget startsted, med «Første tur» på Senja', 'The game’s own start, with «First trip» on Senja') :
      (x.codT >= 1 ? L('Torsk ', 'Cod ') + fmt(x.codT, 0) + L(' t i året', ' t a year') : L('Lite torsk', 'Little cod')) + (x.inSeason ? L(' · i sesong nå', ' · in season now') : '') + ' · ' + fmt(x.small * 100, 0) + L(' % fra små båter', ' % from small boats')) + '</small></button>';
  const byReg = REGIONS.map(r => { const xs = ports.filter(x => x.region === r[0] && x.pt.id !== 'finnsnes').sort((a, b) => b.score - a.score); return xs.length ? '<details class="st-reg"' + (xs.some(x => rec.has(x.pt.id)) ? ' open' : '') + '><summary>' + L(r[1], r[2]) + ' <span>' + xs.length + '</span></summary>' + xs.map(item).join('') + '</details>' : ''; }).join('');
  const el = document.createElement('div'); el.id = 'startPick'; el.className = 'stp';   // not 'st': that is the HUD's status line
  el.innerHTML = '<div class="st-box"><h2>' + L('Hvor står fars naust?', 'Where is Father’s boathouse?') + '</h2><p class="st-lead">' +
    L('Velg hvor langs kysten du tar over. Stjernene er steder der mottaket tar imot mye torsk fra små båter, og der det fiskes torsk nå. Der er det lettest å tjene penger i starten.', 'Choose where along the coast you take over. The stars are places where the plant takes in much cod from small boats, and where cod is fished now. That is where money comes easiest at first.') +
    '</p><div class="st-main"><div class="st-mapw"><svg class="st-map" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + L('Kart over kysten', 'Map of the coast') + '"><rect width="' + W + '" height="' + H + '" rx="10" class="st-sea"/>' + dots + '</svg>' +
    '<p class="st-key"><i class="rec"></i>' + L('anbefalt', 'recommended') + ' <i class="home"></i>Finnsnes <i></i>' + L('andre mottak', 'other plants') + '</p></div><div class="st-list">' + item(ports.find(x => x.pt.id === 'finnsnes')) + byReg + '</div></div>' +
    '<div class="st-pick" id="stPick" hidden><div id="stPickTx"></div><button class="btn primary" id="stGo">' + L('Start her', 'Start here') + '</button></div></div>';
  document.body.appendChild(el);
  let sel = null;
  const pick = id => {
    sel = ports.find(x => x.pt.id === id); if (!sel) return;
    el.querySelectorAll('.on').forEach(e => e.classList.remove('on')); el.querySelectorAll('[data-id="' + id + '"]').forEach(e => e.classList.add('on'));
    const p = el.querySelector('#stPick'); p.hidden = false;
    el.querySelector('#stPickTx').innerHTML = '<b>' + sel.pt.name + '</b> · ' + L(REGIONS.find(r => r[0] === sel.region)[1], REGIONS.find(r => r[0] === sel.region)[2]) +
      (sel.pt.mk ? '<br><small>' + sel.pt.mk.names.slice(0, 2).join(', ') + '</small>' : '');
  };
  el.addEventListener('click', e => { const t = e.target.closest('[data-id]'); if (t) pick(t.dataset.id); });
  pick('finnsnes');
  el.querySelector('#stGo').addEventListener('click', async () => {
    if (!sel) return; const b = el.querySelector('#stGo'); b.disabled = true; b.textContent = L('Laster kartet …', 'Loading the map …');
    try { await chooseStart(sel.pt); } catch (e){ console.error(e); }
    el.remove(); done();
  });
}
// the patch for «Første tur» near a harbour: the best cod within 1.5 to 6 km, in 20 to 150 m of water (r 1.2 km)
function tutFieldNear(pt){
  const H = S.t / 60; let best = null;
  for (let r = 1.5; r <= 6; r += 0.5) for (let a = 0; a < 360; a += 15){
    const q = {x:pt.p.x + Math.sin(a * Math.PI / 180) * r, y:pt.p.y - Math.cos(a * Math.PI / 180) * r};
    if (isLand(q)) continue; const d = depthF(q); if (d < 20 || d > 150) continue;
    const s = density('torsk', q, H) - r * 0.02; if (!best || s > best.s) best = {s, p:q};
  }
  return best ? {p:{x:Math.round(best.p.x * 1000) / 1000, y:Math.round(best.p.y * 1000) / 1000}, r:1.2} : null;
}
// move a new game to the harbour: its waters loaded first, then the boat, the trail, the first trip's patch and landing
async function chooseStart(pt){
  S.home = pt.id; S.naust = null; S.boat.berth = 'naust';   // the boat lies at Father's naust (07c-naust.js); the plant's quay until it is found
  if (pt.id === S.boat.port && S.boat.status === 'port') return;   // a new game is in Finnsnes already
  await mapNeed(pt.p, Math.max(MAPD.simR, 7.5));   // the first trip's patch is looked for up to 6 km out (tutFieldNear)
  const b = S.boat; b.port = pt.id; b.status = 'port'; b.pos = {x:pt.p.x, y:pt.p.y}; b.v = 0; S.trail = [{x:pt.p.x, y:pt.p.y, port:pt.id}]; S.draft = []; S.plan = null;
  // the first trip (made when the boat gets her name, tutNew) starts from here
  if (pt.id === 'finnsnes') S.tutStart = null;   // Senja's own first trip: Gisundet nord and Botnhamn
  else { const f = tutFieldNear(pt); S.tutStart = {land:pt.id}; if (f) S.tutStart.f = {...f, at:{no:'utenfor ' + pt.name, en:'off ' + pt.name}}; if (S.tut && S.tut.v === 2) Object.assign(S.tut, S.tutStart); }
  view.cx = pt.p.x; view.cy = pt.p.y;
  save(); refreshAll();
}
