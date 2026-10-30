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
// the weather on the first trip (Jonas 09.10.2026: «Alle skal kunne gå ut, fiske og levere sin første fisk på fiskemottaket»): the
// list only offers places where the sea stays under the starting boat's careful limit (risk[0]) the next six hours, about the real
// hour the first trip takes, along the whole trip: the most sheltered water 2 km out from the harbour (where the first trip's patch is
// then looked for, tutFieldNear) and, from Vangshamn, the way to Botnhamn; and never in a wind over the boat's danger limit. The sea is the game's own (hsAt with the lows where they are,
// V4), read from the national core so the whole coast can be asked before its map is in. A place over the limit stands grey with the
// hour it is expected to open again.
const START_WX = [0, 2, 4, 6];
// the sea, and the wind if it is over the boat's danger limit (risk[3]: in a full gale the fjord's short sea is no comfort), as one
// number against the careful sea limit: the most over the next six hours
function startSeaMax(q, H0){ const V = VESSELS[S.boat.type] || VESSELS.skiff; let m = 0;
  for (const w of START_WX){ let v; try { v = hsAt(q, H0 + w); } catch (e){ v = 0; } if (windAt(H0 + w, q) > V.risk[3]) v = 99; m = Math.max(m, v); } return m; }
function startRing(pt){ const out = []; for (let a = 0; a < 360; a += 45){ const q = {x:pt.p.x + Math.sin(a * Math.PI / 180) * 2, y:pt.p.y - Math.cos(a * Math.PI / 180) * 2}; if (!isLandFar(q)) out.push(q); } return out.length ? out : [pt.p]; }
function startWx(pt, H0){
  const lim = (VESSELS[S.boat.type] || VESSELS.skiff).risk[0], ring = pt._ring || (pt._ring = startRing(pt));
  const land = pt.mottak ? null : portById('botnhamn'), mid = land ? {x:(pt.p.x + land.p.x) / 2, y:(pt.p.y + land.p.y) / 2} : null;
  const at = H => { let best = Infinity, bq = null; for (const q of ring){ const v = startSeaMax(q, H); if (v < best){ best = v; bq = q; } } return {hs:Math.max(best, mid ? startSeaMax(mid, H) : 0), q:bq}; };
  const now = at(H0); if (now.hs <= lim) return {ok:true, hs:now.hs, q:now.q, lim};
  let open = null; for (let k = 6; k <= 48 && open == null; k += 6) if (at(H0 + k).hs <= lim) open = H0 + k;
  return {ok:false, hs:now.hs, lim, open};
}
function showStart(done){
  const L = (no, en) => S.lang === 'no' ? no : en;
  const H0 = S.t / 60, ports0 = PORTS.filter(q => q.mottak || q.id === HOME0).map(pt => ({pt, ...startInfo(pt), wx:startWx(pt, H0)}));
  // the places the first trip can be made from now come first; if the whole coast were over the limit (never seen), all are offered
  const anyOk = ports0.some(x => x.wx.ok); if (!anyOk) ports0.forEach(x => { x.wx.ok = true; });
  const ports = ports0.sort((a, b) => (b.wx.ok - a.wx.ok) || b.score - a.score);
  const openTx = x => { const o = x.wx.open; if (o == null) return L('Uvær de neste to døgnene', 'Heavy weather the next two days');
    const d = Math.floor((o + 0) / 24) - Math.floor(H0 / 24); return L('Uvær nå · åpner igjen ca. ', 'Heavy weather now · opens again about ') + (d === 0 ? '' : d === 1 ? L('i morgen ', 'tomorrow ') : dayStr(o) + ' ') + L('kl. ', '') + hm(Math.round(o)); };
  // the best now: the top of the list, marked; no map (Jonas 08.10.2026: «Fjern kartet fra start-skjermen for nye brukere»)
  const TOP = 12, rec = new Set(ports.filter(x => x.wx.ok).slice(0, TOP).map(x => x.pt.id));
  const spN = sp => SPECIES[sp] ? (S.lang === 'no' ? SPECIES[sp].no : SPECIES[sp].en).toLowerCase() : sp;
  const item = (x, i) => '<button class="st-it' + (rec.has(x.pt.id) ? ' rec' : '') + (x.wx.ok ? '' : ' wx') + '" data-id="' + x.pt.id + '" data-q="' + x.pt.name.toLowerCase() + '"><b>' + (i != null ? (i + 1) + '. ' : '') + x.pt.name + '</b><small>' + (x.wx.ok ? '' : '<span class="st-wx">' + openTx(x) + '</span><br>') +
    (x.pt.id === HOME0 ? L('Fars naust. Fisken leveres i Botnhamn', 'Father’s boathouse. The catch is landed at Botnhamn') + (x.now.length ? ' · ' : '') : '') +
    (x.now.length ? L('Landes nå: ', 'Landed now: ') + x.now.map(spN).join(', ') : L('Lite å levere nå', 'Little landed now')) +
    (x.small >= 0.3 ? L(' · mye fra små båter', ' · much from small boats') : '') + '</small></button>';
  const best = ports.filter(x => x.wx.ok).slice(0, TOP).map((x, i) => item(x, i)).join('');
  const byReg = REGIONS.map(r => { const xs = ports.filter(x => x.region === r[0]); return xs.length ? '<details class="st-reg"><summary>' + L(r[1], r[2]) + ' <span>' + xs.length + '</span></summary>' + xs.map(x => item(x)).join('') + '</details>' : ''; }).join('');
  const el = document.createElement('div'); el.id = 'startPick'; el.className = 'stp';   // not 'st': that is the HUD's status line
  el.innerHTML = '<div class="st-box"><h2>' + L('Hvor står fars naust?', 'Where is Father’s boathouse?') + '</h2><p class="st-lead">' +
    L('Velg hvor langs kysten du tar over. Øverst står stedene der det er mest å tjene akkurat nå. Vil du heller starte nær der du bor, kan du søke eller bla etter landsdel. Steder med uvær akkurat nå står grått, med når det ventes å løye.', 'Choose where along the coast you take over. At the top are the places where there is most to earn right now. If you would rather start near where you live, search or browse by region. Places with heavy weather right now are grey, with when it is expected to ease.') +
    '</p><input type="search" id="stQ" class="st-q" autocomplete="off" placeholder="' + L('Søk etter et sted', 'Search for a place') + '">' +
    '<div class="st-list" id="stHits" hidden></div><div class="st-list" id="stAll"><h3 class="st-h">' + L('Best akkurat nå', 'Best right now') + '</h3>' + best +
    '<h3 class="st-h">' + L('Alle steder etter landsdel', 'All places by region') + '</h3>' + byReg + '</div>' +
    '<div class="st-pick" id="stPick" hidden><div id="stPickTx"></div><button class="btn primary" id="stGo">' + L('Start her', 'Start here') + '</button></div></div>';
  document.body.appendChild(el);
  let sel = null;
  const pick = id => {
    const c = ports.find(x => x.pt.id === id); if (!c || !c.wx.ok) return; sel = c;
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
    if (!sel) return; const b = el.querySelector('#stGo'), tx = el.querySelector('#stPickTx'); b.disabled = true; if (S.tutT && !S.intro) S.tutT.pick = Date.now(); b.textContent = L('Laster kartet …', 'Loading the map …');
    try { await chooseStart(sel.pt, (n, m) => { b.textContent = L('Laster kartet · ', 'Loading the map · ') + n + L(' av ', ' of ') + m; }); }
    catch (e){   // no map, no start: the player is told, and tries again (Jonas 10.10.2026)
      console.error(e); b.disabled = false; b.textContent = L('Prøv igjen', 'Try again');
      tx.innerHTML = '<b>' + L('Kartet kom ikke fram.', 'The map did not arrive.') + '</b><br><small>' + L('Sjekk nettet og prøv igjen.', 'Check the connection and try again.') + '</small>'; return; }
    if (S.tutT && !S.intro) S.tutT.map = Date.now();
    el.remove(); done();
  });
}
// the patch for «Første tur» near a harbour (Onboarding 2, O1, docs/planer/onboarding-2.md, 27.10.2026). Never missing, never on Senja
// for a start elsewhere, never unlawful, and near, so the first bite comes within minutes: the best fish 1.5 to 2.5 km out first, then
// 3 to 6 km, then anything from 1 to 10 km in 10 to 250 m of water, the place in a ring worth most at this week's prices; in the sea under the starting boat's careful limit the next six
// hours; where the rules let a hand jig fish at all on the date (rulesAt: closed fields, the spawning areas south of 62° N 1.1–30.4,
// the Oslo fjord), the boat would otherwise lie and wait there (05-vessels.js). Its mix is the jig's fish that stand there now (density),
// each lawful there on the date and taken by the plant it is landed at; cod not outside the baseline in the Skagerrak, east of
// Lindesnes, where Norwegian vessels may not fish it (FOR-2022-12-16-2281 § 1, the same rule each year; the rules engine has no
// Skagerrak layer yet). The first catch's amount stays guaranteed (core/03-simulation.js TUTB, tutBonus).
const TUT_SP = ['torsk', 'sei', 'lyr', 'hyse'];
const TUT_TIERS = [[1.5, 2.5, 20, 150], [3, 6, 20, 150], [1, 10, 10, 250]];
const tutSkagOut = q => { const ll = natLL(q); return ll.lat < 59.95 && ll.lon > 7.05 && !(ruBits(q) & 1); };
// the mix at a place: shares of the lawful jig fish there now, the small ones (under 5 %) left out; {} when none is lawful. val: what it
// is worth, density by this week's price, so the patch is where the first landing pays best (cod where the cod is), not just where most stands
function tutMixAt(q, H, len, land){
  const takes = land && land.mk && land.mk.sp ? sp => !!land.mk.sp[sp] : () => true;
  const ok = sp => !(sp === 'torsk' && tutSkagOut(q)) && rulesAt({p:q, H, len, gear:'juksa', sp, hand:true}).v !== 'no';
  let sps = TUT_SP.filter(sp => takes(sp) && ok(sp)); if (!sps.length) sps = TUT_SP.filter(ok);   // a plant that takes none of them: the plant is not asked
  const den = {}; let sum = 0, val = 0; for (const sp of sps){ let d = 0, pr = 10; try { d = density(sp, q, H); pr = marketPrice(sp, H) || 10; } catch (e){} den[sp] = d; sum += d; val += d * pr; }
  const mix = {}; if (sum > 0){ let t = 0; for (const sp of sps) if (den[sp] / sum >= 0.05){ mix[sp] = den[sp] / sum; t += mix[sp]; } for (const sp in mix) mix[sp] = Math.round(mix[sp] / t * 100) / 100; }
  else for (const [sp, v] of Object.entries(TUTB.mix)) if (sps.includes(sp)) mix[sp] = v;
  if (!Object.keys(mix).length && sps.length) mix[sps[0]] = 1;
  return {mix, sum, val};
}
function tutFieldNear(pt, land){
  const H = S.t / 60, V = VESSELS[S.boat.type] || VESSELS.skiff, lim = V.risk[0], len = V.len || 7;
  const at = q => ({x:Math.round(q.x * 1000) / 1000, y:Math.round(q.y * 1000) / 1000});
  for (const [r0, r1, d0, d1] of TUT_TIERS){
    let best = null;
    for (let r = r0; r <= r1 + 1e-6; r += 0.25) for (let a = 0; a < 360; a += 15){
      const q = {x:pt.p.x + Math.sin(a * Math.PI / 180) * r, y:pt.p.y - Math.cos(a * Math.PI / 180) * r};
      if (isLand(q)) continue; const d = depthF(q); if (d < d0 || d > d1) continue;
      if (startSeaMax(q, H) > lim) continue;
      if (ruBlockMsg({p:q, H, len, gear:'juksa', sp:null, hand:true})) continue;
      const m = tutMixAt(q, H, len, land); if (!Object.keys(m.mix).length) continue;
      const s = m.val * (1 - r * 0.02); if (!best || s > best.s) best = {s, p:q, mix:m.mix};
    }
    if (best) return {p:at(best.p), r:1.2, mix:best.mix};
  }
  // nothing anywhere near (never seen): the most sheltered sea 2 km out, with what the rules allow there
  const q = startRing(pt)[0], m = tutMixAt(q, H, len, land);
  return {p:at(q), r:1.2, mix:Object.keys(m.mix).length ? m.mix : {sei:1}};
}
// move a new game to the harbour: its waters loaded first, then the boat, the trail, the first trip's patch and landing
// a game from before moving its home (Settings, «Hjemsted»): only the home and Father's naust go there; the boat stays where she is and
// is sailed there (Jonas 05.10.2026: «Fast travel er ikke mulig i spillet, punktum.»)
let START_HOMEONLY = false;
async function chooseStart(pt, onProgress){
  if (START_HOMEONLY){ START_HOMEONLY = false; S.home = pt.id; S.naust = null; view.cx = pt.p.x; view.cy = pt.p.y; save(); refreshAll(); return; }
  S.home = pt.id; S.naust = null; S.boat.berth = 'naust';   // the boat lies at Father's naust (07c-naust.js); the plant's quay until it is found
  await mapNeed(pt.p, Math.max(MAPD.simR, 10.5));   // the first trip's patch is looked for up to 10 km out (tutFieldNear)
  const b = S.boat; b.port = pt.id; b.status = 'port'; b.pos = {x:pt.p.x, y:pt.p.y}; b.v = 0; S.trail = [{x:pt.p.x, y:pt.p.y, port:pt.id}]; S.draft = []; S.plan = null;
  // the first trip (made when the boat gets her name, tutNew) starts from here
  // Vangshamn has no plant: the first catch goes to Botnhamn, 5.7 km west
  { const f = tutFieldNear(pt, portById(pt.mottak ? pt.id : 'botnhamn')); S.tutStart = {land:pt.mottak ? pt.id : 'botnhamn', reg:startInfo(pt).region}; if (f) S.tutStart.f = {...f, at:{no:'utenfor ' + pt.name, en:'off ' + pt.name}}; if (S.tut && S.tut.v === 2) Object.assign(S.tut, S.tutStart); }
  view.cx = pt.p.x; view.cy = pt.p.y;
  // the whole first trip's ground in before the game begins: the harbour, the patch of fish and the landing, every kind of pack the chart and
  // the 3D view read there (the player has nothing left to wait for after this screen)
  const lp = portById(S.tutStart.land), pts = [pt.p, S.tutStart.f ? S.tutStart.f.p : pt.p, lp ? lp.p : pt.p];
  await mapPreload(pts, [['sim', 8], ['chart', 8], ['view', 10], ['vec', 10], ['far', 30]], onProgress);
  save(); refreshAll();
}
