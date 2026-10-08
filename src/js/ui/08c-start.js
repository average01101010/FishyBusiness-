// ===== «Hvor står fars naust?»: where a new game starts (05.10.2026) =====
// Jonas 04.10.2026: «alle nye brukere skal få bestemme selv hvor i landet de ønsker å starte spillet ... de burde jo få en anbefaling om
// å starte en plass der det er torsk, slik at de tjener penger». After the letter, before the boat's name: the coast's harbours with a
// fish plant (06b-coastports.js and Senja's own) and Vangshamn (Father's naust on Senja, landing at Botnhamn), best now first, then by
// region, with a search. A tap picks one; «Start her» loads the map round it and moves the boat there.
// The start is also where «Første tur» goes: S.tut.f is the patch of fish nearest the harbour (the best cod within 1.5 to 6 km), S.tut.land
// the plant to land at (the harbour itself; Botnhamn from Vangshamn). Saves from before go to Vangshamn (ui/02-format-state.js).
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
// what the plant (Vangshamn: Botnhamn's, where its catch goes) takes in now: per species, the year's landings spread over the months it
// takes that species, at this week's price (kr a month), weighed up where much comes from small boats. The list's order: where a new
// player earns most right now (Jonas 08.10.2026: «Sorter heller etter hvilke plasser som har høyest potensiale for inntjening i det
// øyeblikket de starter spillet i synkende rekkefølge»)
function startInfo(pt){
  const ll = natLL(pt.p), la = ll.lat, lo = ll.lon, H = S.t / 60;
  const mk = pt.mk || (pt.id === HOME0 && (portById('botnhamn') || {}).mk) || null, cod = mk && mk.sp.torsk ? mk.sp.torsk : null, mon = gDate(H).getUTCMonth();
  const inSeason = !!(cod && cod.months & (1 << mon)), codT = cod ? cod.kg / 1000 : 0;
  let pot = 0; const now = [];
  if (mk) for (const [sp, v] of Object.entries(mk.sp)){ if (!SPECIES[sp] || !(v.months & (1 << mon)) || !v.kg) continue;
    let n = 0; for (let m = 0; m < 12; m++) if (v.months & (1 << m)) n++;
    let p = 10; try { p = marketPrice(sp, H) || 10; } catch (e){}
    const kr = v.kg / Math.max(1, n) * p; pot += kr; now.push([sp, kr]); }
  pot *= 0.4 + Math.min(1, (mk ? mk.small : 0) * 2);
  now.sort((a, b) => b[1] - a[1]);
  return {la, lo, region:REGIONS.find(r => r[3](la, lo))[0], codT, inSeason, small:mk ? mk.small : 0, score:pot, now:now.slice(0, 3).map(x => x[0])};
}
function showStart(done){
  const L = (no, en) => S.lang === 'no' ? no : en;
  const ports = PORTS.filter(q => q.mottak || q.id === HOME0).map(pt => ({pt, ...startInfo(pt)})).sort((a, b) => b.score - a.score);
  // the best now: the top of the list, marked; no map (Jonas 08.10.2026: «Fjern kartet fra start-skjermen for nye brukere»)
  const TOP = 12, rec = new Set(ports.slice(0, TOP).map(x => x.pt.id));
  const spN = sp => SPECIES[sp] ? (S.lang === 'no' ? SPECIES[sp].no : SPECIES[sp].en).toLowerCase() : sp;
  const item = (x, i) => '<button class="st-it' + (rec.has(x.pt.id) ? ' rec' : '') + '" data-id="' + x.pt.id + '" data-q="' + x.pt.name.toLowerCase() + '"><b>' + (i != null ? (i + 1) + '. ' : '') + x.pt.name + '</b><small>' +
    (x.pt.id === HOME0 ? L('Fars naust. Fisken leveres i Botnhamn', 'Father’s boathouse. The catch is landed at Botnhamn') + (x.now.length ? ' · ' : '') : '') +
    (x.now.length ? L('Landes nå: ', 'Landed now: ') + x.now.map(spN).join(', ') : L('Lite å levere nå', 'Little landed now')) +
    (x.small >= 0.3 ? L(' · mye fra små båter', ' · much from small boats') : '') + '</small></button>';
  const best = ports.slice(0, TOP).map((x, i) => item(x, i)).join('');
  const byReg = REGIONS.map(r => { const xs = ports.filter(x => x.region === r[0]); return xs.length ? '<details class="st-reg"><summary>' + L(r[1], r[2]) + ' <span>' + xs.length + '</span></summary>' + xs.map(x => item(x)).join('') + '</details>' : ''; }).join('');
  const el = document.createElement('div'); el.id = 'startPick'; el.className = 'stp';   // not 'st': that is the HUD's status line
  el.innerHTML = '<div class="st-box"><h2>' + L('Hvor står fars naust?', 'Where is Father’s boathouse?') + '</h2><p class="st-lead">' +
    L('Velg hvor langs kysten du tar over. Øverst står stedene der det er mest å tjene akkurat nå. Vil du heller starte nær der du bor, kan du søke eller bla etter landsdel.', 'Choose where along the coast you take over. At the top are the places where there is most to earn right now. If you would rather start near where you live, search or browse by region.') +
    '</p><input type="search" id="stQ" class="st-q" autocomplete="off" placeholder="' + L('Søk etter et sted', 'Search for a place') + '">' +
    '<div class="st-list" id="stHits" hidden></div><div class="st-list" id="stAll"><h3 class="st-h">' + L('Best akkurat nå', 'Best right now') + '</h3>' + best +
    '<h3 class="st-h">' + L('Alle steder etter landsdel', 'All places by region') + '</h3>' + byReg + '</div>' +
    '<div class="st-pick" id="stPick" hidden><div id="stPickTx"></div><button class="btn primary" id="stGo">' + L('Start her', 'Start here') + '</button></div></div>';
  document.body.appendChild(el);
  let sel = null;
  const pick = id => {
    sel = ports.find(x => x.pt.id === id); if (!sel) return;
    el.querySelectorAll('.on').forEach(e => e.classList.remove('on')); el.querySelectorAll('[data-id="' + id + '"]').forEach(e => e.classList.add('on'));
    const p = el.querySelector('#stPick'); p.hidden = false; const rg = REGIONS.find(r => r[0] === sel.region);
    el.querySelector('#stPickTx').innerHTML = '<b>' + sel.pt.name + '</b> · ' + L(rg[1], rg[2]) + (sel.pt.mk ? '<br><small>' + sel.pt.mk.ids.length + L(' mottak · ', ' receivers · ') + fmt(sel.pt.mk.kg / 1000, 0) + L(' t i året', ' t a year') + '</small>' : '');
  };
  el.addEventListener('click', e => { const t = e.target.closest('[data-id]'); if (t) pick(t.dataset.id); });
  // the search: by the place's name, over the whole coast
  const q = el.querySelector('#stQ'), hits = el.querySelector('#stHits'), all = el.querySelector('#stAll');
  q.addEventListener('input', () => { const v = q.value.trim().toLowerCase(); hits.hidden = !v; all.hidden = !!v; if (!v) return;
    const xs = ports.filter(x => x.pt.name.toLowerCase().includes(v)).sort((a, b) => (b.pt.name.toLowerCase().startsWith(v) ? 1 : 0) - (a.pt.name.toLowerCase().startsWith(v) ? 1 : 0) || b.score - a.score);
    hits.innerHTML = xs.length ? xs.slice(0, 30).map(x => item(x)).join('') : '<p class="st-lead">' + L('Ingen mottak med det navnet. Prøv et sted i nærheten.', 'No plant by that name. Try a place nearby.') + '</p>';
    if (sel) hits.querySelectorAll('[data-id="' + sel.pt.id + '"]').forEach(e => e.classList.add('on')); });
  pick(ports[0].pt.id);
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
// a game from before moving its home (Settings, «Hjemsted»): only the home and Father's naust go there; the boat stays where she is and
// is sailed there (Jonas 05.10.2026: «Fast travel er ikke mulig i spillet, punktum.»)
let START_HOMEONLY = false;
async function chooseStart(pt){
  if (START_HOMEONLY){ START_HOMEONLY = false; S.home = pt.id; S.naust = null; view.cx = pt.p.x; view.cy = pt.p.y; save(); refreshAll(); return; }
  S.home = pt.id; S.naust = null; S.boat.berth = 'naust';   // the boat lies at Father's naust (07c-naust.js); the plant's quay until it is found
  await mapNeed(pt.p, Math.max(MAPD.simR, 7.5));   // the first trip's patch is looked for up to 6 km out (tutFieldNear)
  const b = S.boat; b.port = pt.id; b.status = 'port'; b.pos = {x:pt.p.x, y:pt.p.y}; b.v = 0; S.trail = [{x:pt.p.x, y:pt.p.y, port:pt.id}]; S.draft = []; S.plan = null;
  // the first trip (made when the boat gets her name, tutNew) starts from here
  // Vangshamn has no plant: the first catch goes to Botnhamn, 5.7 km west
  { const f = tutFieldNear(pt); S.tutStart = {land:pt.mottak ? pt.id : 'botnhamn'}; if (f) S.tutStart.f = {...f, at:{no:'utenfor ' + pt.name, en:'off ' + pt.name}}; if (S.tut && S.tut.v === 2) Object.assign(S.tut, S.tutStart); }
  view.cx = pt.p.x; view.cy = pt.p.y;
  save(); refreshAll();
}
