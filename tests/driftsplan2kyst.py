"""Driftsplan 2 along the coast (Ø12 A+B, 07.11.2026; docs/planer/driftsplan-2/00-oppdrag.md kap. 4, the backlog's «Driftsplan 2: GUI-
gjennomgangen, det som står igjen» and «stikkprøver langs kysten mangler»). Needs the whole coast in the build (tools/map/out/game, from
release.py and game.py) and the vec packs (dist-vec: the harbours' berths come from them), without 3D (LITE). The same harness as
driftsplan2test (D2: a fixed date, a seeded Math.random, the game's loop held).

  Per town (Bergen, Bodø, Hammerfest), from the plant nearest the town:
    - B, the whole plan from the page: «Ny plan», line and jig, two fields and a jig place put in as the chart does (PLAN2UI.put), Start
      (made with the legs), Levering every trip, and one day played closed: out once, set, jig, haul, land, home. One line per town.
    - F2, the nearest rorbu in the home list as home, two days: out once a day, not again in the evening, and you rest at the rorbu.
    - U14, the home list: the rorbuer nearest first, a harbour berth when the harbours have one, no yard, every line with its distance.
    - A harbour berth as home (havnOptions), two days: she comes back to the berth, holds it and pays the due each day.
    - Pause at sea: she anchors where anchorSpot lets her (4-40 m, 150 m from land), or drifts and says why; Start, and she goes on.
  Over several days with the real rules, quota and weather, played as catchUp plays them (playMinutes), and the push that would go out:
    - G, nets at Ålesund with one field in Borgundfjorden (closed to all fishing 1.3-31.5, rules.json layer 24, the real regulation):
      from 29 February the plan stops on 1 March (closed longer than it waits), and push says so the day before and when it has; from
      27 May it waits until 1 June with the date, and push says «Feltet er åpent igjen» on 1 June; then the nets set and hauled, the
      cod quota of the open group nearly used, so the cod over it is confiscated at the landing, and the weather as it comes; 8 days closed.
    - T, pots at Bodø, 15 + 15 at 48 h, four days: the push for the gear in the sea while closed, the strings hauled after the soak.
    - M, a trip of several days from Hammerfest on a sjark with bunks: home only on the last night, the nights at a quay out there,
      the landing every third day on the trip's last day, before home (Jonas 08.11.2026: A).
  python3 driftsplan2kyst.py Bergen      only that town (Bergen, Bodø, Hammerfest, G, T, M; several may be named)
  python3 driftsplan2kyst.py 3d          the drawer over the 3D sea (with 3D, alone): the plan page in 800x1280, 1280x800, 384x853
"""
import asyncio, json, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE); OUT = os.path.join(HERE, 'out')
# (dist-vec/ with the vec packs, as havntest: run.py builds it once before the tests that need it, KYST_VEC_BUILT; else it is built here)
os.environ['KYST_DIST'] = os.environ.get('KYST_DIST') or os.path.join(ROOT, 'dist-vec')
from playwright.async_api import async_playwright
from _env import boot, GAME_TUT
from driftsplan2test import D2
ok = lambda c: 'OK  ' if c else 'FEIL'
TOWNS = [('Bergen', 60.393, 5.312), ('Bodø', 67.285, 14.38), ('Hammerfest', 70.664, 23.68)]

KY = r"""window.KY = (() => {
  // the vec packs over a box of km round p, loaded and decoded (the harbours' berths come from them); in the game the boat's AIS asks for them each minute
  async function vecIn(p, r){
    vecWant(p.x - r, p.y - r, p.x + r, p.y + r); const T = MAPD.man.tile * 1000; let n = -1;
    for (let k = 0; k < 600; k++){ const P = mapPacksIn('vec', p.x - r, p.y - r, p.x + r, p.y + r); n = P.length;
      if (P.every(pk => pk.buf) && vecTilesIn((p.x - r) * 1000, (p.y - r) * 1000, (p.x + r) * 1000, (p.y + r) * 1000).length >= n) return n;
      await new Promise(res => setTimeout(res, 100)); }
    return -n;
  }
  const page = () => PHONE.page('drift'), act = (a, d) => PHONE.dact('drift', a, d || {});
  // the home list as the page shows it: [id, name, kind, the line under it]
  const homes = () => { act('p2-row', {k:'home'}); const h = page(); act('p2-row', {k:'home'});
    return [...h.matchAll(/data-pa="p2-home"[^>]*data-p="([^"]+)"[^>]*><b>([^<]*)<span class="dr-k">\(([^)]*)\)<\/span><\/b><small>([^<]*)<\/small>/g)].map(m => [m[1], m[2].trim(), m[3], m[4]]); };
  // the plant nearest the town, the boat there with you and one crew, the map and the vec packs in
  async function town(la, lo, seed, vt, n){
    D2.reset(seed); const c = P(la, lo), M = PORTS.filter(q => q.mottak && plantFor(q, vt || 'sjark')).sort((a, b) => dist(a.p, c) - dist(b.p, c))[0];
    D2.boat(vt || 'sjark', n == null ? 1 : n, true, M.id); S.lang = S.settings.lang = 'no'; DRIFT2 = true; window.confirm = () => true;
    await mapNeed(M.p, 16); const vec = await vecIn(M.p, 26); return {M, vec};
  }
  // places as the chart puts them (PLAN2UI.put tries each against land, depth and the rules): k of a kind between r0 and r1 km from c
  function put(o, kind, k, c, r0, r1){ const out = [];
    for (let r = r0; r < r1 && out.length < k; r += 0.5) for (let a = 0; a < 24 && out.length < k; a++){ const q = {x:c.x + r * Math.sin(a * 0.26), y:c.y - r * Math.cos(a * 0.26)};
      try { if (isLand(q) || depthF(q) < 20 || coastDist(q) < 0.4 || out.some(z => dist(z, q) < 1.2) || o.places.some(z => dist(z, q) < 1.2)) continue; const pl = PLAN2UI.put(o, kind, q); if (pl) out.push(q); } catch (e){} }
    return out; }
  async function start(o){ act('p2-start'); for (let k = 0; k < 600 && !o.on && !o.err; k++) await new Promise(r => setTimeout(r, 100)); return {on:o.on, err:o.err, M:o.M, chk:plan2Check(o)}; }
  // the run's departures from home, per day, and how she ended
  const outs = L => { const d = {}; for (const e of L.ev) if (/^fish:unmooring@/.test(e[1])) { const k = e[0].split(' ')[0]; d[k] = (d[k] || 0) + 1; } return d; };
  const sum = (L, o) => ({ev:L.ev.slice(0, 60), days:L.days.map(d => d.at + ' | ' + d.text.slice(0, 10).join(' | ')), gear:L.gearLog, stats:o.stats.days.map(d => [d.d, Math.round(d.kg), Math.round(d.kr), d.out || 0, Math.round(d.conf || 0), Object.keys(d.port || {}).join(',')]), sum:o.stats.sum, fin:L.fin, ops:L.ops,
    msgs:L.msgs.filter(m => /venter|stengt|Stoppet|inndr|kvote/i.test(m[1])).slice(0, 8), log:L.log.filter(e => /rorbua|Havneavgift|inndr|Inndr|ankr|Ankr|anker|Lettet/.test(e[1])).slice(0, 12)});
  return {vecIn, page, act, homes, town, put, start, outs, sum};
})();"""

# ---- per town: B (the whole plan, two days), F2 (the rorbu), U14 (the home list), the harbour berth, the pause at sea
TOWN = r"""async ([nm, la, lo, seed]) => { const R = {nm}; const {M, vec} = await KY.town(la, lo, seed); R.M = [M.id, M.name]; R.vec = vec;
  D2.gear('line', 4); S.pgear.bait = {makrell:60};
  // B: a new plan from the page, as a player makes it: line and jig, the landing every trip (the default keeps the catch until the hold is full)
  S.ops = null; KY.act('p2-new'); const o = S.ops; KY.act('p2-rig', {g:'line'}); KY.act('p2-jig', {v:'1'}); KY.act('p2-land-when', {v:'trip'});
  const F = KY.put(o, 'felt', 2, M.p, 3, 12), J = KY.put(o, 'juks', 1, M.p, 2, 6);
  for (const f of o.places.filter(q => q.k === 'felt')){ f.n = 2; f.soak = 6; }
  R.places = o.places.map(q => [q.k, Math.round(dist(q, M.p) * 10) / 10, Math.round(depthF(q))]); R.home0 = [o.home, (portById(o.home) || {}).name, isRorbu(o.home) ? 'rorbu' : isBerth(o.home) ? 'havneplass' : portServices(portById(o.home)).mottak ? 'mottak' : 'kai'];
  try { R.homes = KY.homes(); R.homesOk = true; } catch (e){ R.homes = []; R.homesOk = false; R.homesErr = String(e).slice(0, 200); return R; }
  try { R.havn = havnOptions(M.p, 25).map(q => [q.place.id, q.place.name, q.kind, Math.round(dist(q.place.p, M.p) * 10) / 10]); } catch (e){ R.havnErr = String(e); }
  const plan0 = JSON.stringify(o);
  R.start = await KY.start(o); if (!o.on) return R;
  const L = await D2.run(1440, 'closed', 'B' + nm); R.B = KY.sum(L, o); R.B.outs = KY.outs(L); R.B.home = o.home;
  const zero = () => ({days:[], sum:{trips:0, kg:0, kr:0, lott:0, cost:0, conf:0, sp:{}, port:{}}});
  const again = async (k) => { D2.reset(seed + k); D2.boat('sjark', 1, true, M.id); D2.gear('line', 4); S.pgear.bait = {makrell:60}; await KY.vecIn(M.p, 26);
    const o2 = S.ops = JSON.parse(plan0); o2.on = false; o2.run = null; o2.made = null; o2.legs = {}; o2.err = null; o2.stats = zero(); return o2; };
  // F2 (a rorbu) and a harbour berth as home: the same plan from each, two days closed
  const home = async (k, pick) => { const o2 = await again(k), hl = KY.homes(), h = hl.find(pick); if (!h) return {none:true, kinds:hl.map(x => x[2])};
    KY.act('p2-home', {p:h[0]}); const st = await KY.start(o2); const X = {h, chosen:o2.home === h[0], start:{on:st.on, err:st.err, errors:st.chk.errors}}; if (!o2.on) return X;
    const L2 = await D2.run(2 * 1440, 'closed', 'H' + k); const sv = S.havn && S.havn.s[h[0]]; X.run = KY.sum(L2, o2); X.outs = KY.outs(L2);
    X.end = {status:S.boat.status, port:S.boat.port, atHome:S.boat.port === h[0], held:!!(sv && sv.vid === S.cur), en:Math.round(S.energy)};
    X.rorbu = L2.log.filter(e => /tok inn på rorbua/.test(e[1])).length; X.due = L2.log.filter(e => /Havneavgift/.test(e[1])).length; return X; };
  R.F2 = await home(2, h => h[2] === 'rorbu');
  R.H = await home(3, h => /^hs:/.test(h[0]));
  // the pause at sea: played until she fishes, then Pause; once where she happens to be, once where she can anchor; Start again
  const pause = async (k, want) => { const o2 = await again(k); await KY.start(o2); let i = 0;
    for (; i < 1440 && !((S.boat.status === 'fishing' || (want && S.boat.status === 'sailing' && i > 30)) && !S.boat.gop && (!want || anchorSpot(S.boat.pos).ok)); i++){ DYN.on = false; step(); }
    if (i >= 1440) return {none:true};
    const at = {...S.boat.pos}, sp = anchorSpot(at), st0 = S.boat.status; KY.act('p2-pause'); const pp = KY.page(); for (let k = 0; k < 30; k++){ DYN.on = false; step(); }
    const X = {st:st0, min:i, at:gDate(S.t / 60).toISOString().slice(11, 16), depth:Math.round(depthF(at)), spot:sp.ok ? 'ok' : sp.why, anch:!!S.boat.anch, drift:o2.paused && o2.paused.drift, moved:Math.round(dist(at, S.boat.pos) * 1000), says:(pp.match(/Nå: <\/b>([^<]*)/) || [])[1] || null};
    KY.act('p2-start'); let gone = null; for (let k = 0; k < 900 && o2.on; k++){ DYN.on = false; step(); if (k % 10 === 9) await new Promise(r => setTimeout(r, 0)); if (gone == null && ['sailing', 'unmooring'].includes(S.boat.status)) gone = k; if (gone != null && k > gone + 5) break; }
    X.after = {on:o2.on, anch:!!S.boat.anch, status:S.boat.status, gone, wait:o2.run && o2.run.wait && o2.run.wait.no}; return X; };
  R.P = await pause(4, false); R.PA = await pause(5, true);
  return R; }"""

# ---- G: nets at Ålesund with Borgundfjorden closed until 1 June, the cod quota nearly used, the weather as it comes; played as catchUp
REAL_G = r"""async () => { const R = {};
  const {M} = await KY.town(62.472, 6.154, 71, 'sjark', 1); R.M = [M.id, M.name];
  const at = (y, m, d) => Math.round((Date.UTC(y, m - 1, d, 3, 0) - EPOCH) / 6e4), day = t => gDate(t / 60).toISOString().slice(0, 16);
  // (a push's time is real, the server sends it: back to the game's clock here)
  const pz = re => pushItems().filter(p => re.test(p.tag)).map(p => [p.tag.slice(0, 9), day(S.t + (Date.parse(p.at) - Date.now()) / 60000 * GAME_RATE), p.body]);
  S.t = at(2028, 2, 29); S.quota = null; D2.gear('garn', 12);
  // field 1 inside Borgundfjorden (rules.json layer 24: all fishing banned 1.3-31.5 save hand line and rod), field 2 outside it; both open on 29 February
  const Hc = at(2028, 3, 2) / 60, inB = q => /Borgundfjorden/.test(ruBlockMsg({p:q, len:BOAT.len, gear:'garn', sp:null, H:Hc}) || ''); let g1 = null, g2 = null;
  for (let r = 1; r < 25 && !(g1 && g2); r += 0.5) for (let a = 0; a < 36 && !(g1 && g2); a++){ const q = {x:M.p.x + r * Math.sin(a * 0.1745), y:M.p.y - r * Math.cos(a * 0.1745)};
    try { if (isLand(q) || depthF(q) < 20 || coastDist(q) < 0.3) continue; if (!g1 && inB(q) && !ruBlockMsg({p:q, len:BOAT.len, gear:'garn', sp:null})) g1 = q; else if (!g2 && !inB(q) && !ruBlockMsg({p:q, len:BOAT.len, gear:'garn', sp:null}) && !ruBlockMsg({p:q, len:BOAT.len, gear:'garn', sp:null, H:Hc}) && dist(q, M.p) > 3) g2 = q; } catch (e){} }
  if (!g1 || !g2) return {err:'fant ikke felt i og utenfor Borgundfjorden', g1, g2};
  R.d = [Math.round(dist(g1, M.p) * 10) / 10, Math.round(dist(g2, M.p) * 10) / 10]; R.why = ruBlockMsg({p:g1, len:BOAT.len, gear:'garn', sp:null, H:Hc});
  const o = S.ops = plan2New({home:M.id, rig:'garn', jig:false, places:[D2.felt('g1', g1, 6, 24), D2.felt('g2', g2, 6, 24)], dep:5, land:{mode:'near', port:null, when:'trip'}});
  const err = await D2.make(o); if (err) return {err}; o.on = true;
  // 1. from 29 February: the closing on 1 March is longer than the plan waits (a month), so the plan stops, and push says so before and when it does
  await D2.run(60, 'open', 'G1a'); R.push1 = pz(/^ops-|^p2-/);
  const t1 = performance.now(); for (let i = 0; i < 3 * 1440 && o.on; i += 60) playMinutes(60, true); R.wall1 = Math.round(performance.now() - t1);
  R.stop = o.stop && {k:o.stop.k, no:o.stop.no, fix:o.stop.fix, at:day(o.stop.t)}; R.push2 = pz(/^ops-/);
  R.left = mySets().map(s => [s.kind, s.n, dist(setMid(s), g1) < 2 ? 'g1' : 'g2']);
  // 2. on 27 May (the nets taken up, the plan on again): Borgundfjorden opens on 1 June, within the month: the plan waits with the date, and the push
  // «Feltet er åpent igjen» goes on 1 June; the cod quota of the open group nearly used, so cod over it is confiscated at the landing; six days as catchUp
  S.sets = (S.sets || []).filter(s => s.vid !== S.cur); D2.gear('garn', 12); S.t = at(2028, 5, 27); S.quota = null; const T2 = S.t;
  for (const q of [M.p, g1, g2]) await mapNeed(q, 8);
  o.stop = null; o.on = true; o.run = null; o.hold = 0;
  S.tripOwner = true; const lim = codLimitNow(S.t / 60); quotaState().torsk = Math.max(0, lim - 40); R.quota = {lim:Math.round(lim), used:Math.round(quotaState().torsk)};
  await D2.run(60, 'open', 'G2a'); const w = o.run && o.run.wait; R.wait = w && {k:w.k, no:w.no, until:w.until && day(w.until * 60), open:w.open && day(w.open * 60)};
  R.push3 = pz(/^p2-|^ops-/);
  const wall = []; for (let d = 0; d < 8; d++){ const t0 = performance.now(); playMinutes(1440, true); wall.push(Math.round(performance.now() - t0)); }
  R.wall = wall; R.stats = o.stats.days.map(d => [d.d, Math.round(d.kg), Math.round(d.kr), Math.round(d.conf || 0), d.trips || 0]); R.sum = o.stats.sum;
  R.gear = (S.gearLog || []).filter(e => e.tSet >= T2).map(e => [day(e.tSet).slice(5), e.tHaul ? Math.round((e.tHaul - e.n * DRP2.work.trekk[e.kind] * 60 - e.tSet) / 6) / 10 : null, e.lost ? 'tapt' : '', Math.round(e.kg || 0), dist(e, g1) < 2 ? 'g1' : 'g2']);
  R.log = S.log.filter(e => e.t >= T2 && /stengt|Stengt|inndr|Inndr|venter|Venter|kvote|Kvote/.test(e.no || '')).slice(0, 10).map(e => day(e.t).slice(5) + ' ' + (e.no || '').slice(0, 150));
  R.fin = {on:o.on, stop:o.stop && o.stop.no, wait:o.run && o.run.wait && o.run.wait.no, port:S.boat.port, status:S.boat.status, q:Math.round(quotaState().torsk), conf:Math.round(quotaState().conf || 0)};
  R.wx = [0, 1, 2, 3, 4, 5, 6, 7].map(d => { const h = T2 / 60 + 9 + d * 24; return [Math.round(windAt(h, g2) * 10) / 10, Math.round((hsAt(g2, h) || 0) * 10) / 10]; });
  return R; }"""

# ---- T: pots at Bodø, 15 + 15 at 48 h, four days closed: the push for the gear while closed, the strings hauled after their soak
REAL_T = r"""async () => { const R = {};
  const {M} = await KY.town(67.285, 14.38, 81, 'kyst15', 3); R.M = [M.id, M.name]; S.me = 'nobody'; setSkipper(S.crew[0].id); setMate(S.crew[1].id);
  D2.gear('teine', 30);
  const F = D2.spots(2, 4, 12, M.p);
  const o = S.ops = plan2New({home:M.id, rig:'teiner', jig:false, places:[D2.felt('t1', F[0], 15, 48), D2.felt('t2', F[1], 15, 48)], dep:5, land:{mode:'near', port:null, when:'full'}});
  const err = await D2.make(o); if (err) return {err}; o.on = true;
  // the first day open, then the app closed: what push would tell while it is away, then three days as catchUp plays them
  const L1 = await D2.run(1440, 'open', 'T1'); R.sets = mySets().map(s => [s.kind, s.n, gDate(s.tSet / 60).toISOString().slice(5, 16)]);
  R.push = pushItems().filter(p => /^gear-|^p2-/.test(p.tag)).map(p => [p.tag.slice(0, 8), p.at.slice(5, 16), p.body.slice(0, 80)]);
  const t0 = performance.now(); playMinutes(3 * 1440, true); R.wall_ms = Math.round(performance.now() - t0);
  R.gear = (S.gearLog || []).filter(e => e.tSet >= D2.T0).map(e => [gDate(e.tSet / 60).toISOString().slice(5, 16), e.tHaul ? Math.round((e.tHaul - e.n * DRP2.work.trekk[e.kind] * 60 - e.tSet) / 6) / 10 : null, e.lost ? 'tapt' : '', Math.round(e.kg || 0)]);
  R.stats = o.stats.days.map(d => [d.d, Math.round(d.kg), Math.round(d.kr), d.trips || 0]); R.fin = {on:o.on, stop:o.stop && o.stop.no, wait:o.run && o.run.wait && o.run.wait.no, port:S.boat.port, status:S.boat.status};
  return R; }"""

# ---- M: a trip of several days from Hammerfest on kyst15, you and three crew, line and jig, three days a trip
REAL_M = r"""async () => { const R = {};
  const {M} = await KY.town(70.664, 23.68, 91, 'sjark', 1); R.M = [M.id, M.name];
  D2.gear('line', 4); S.pgear.bait = {makrell:60};
  const F = D2.spots(2, 5, 16, M.p), J = D2.spots(1, 3, 8, M.p);
  const rb = rorbuNear(M.p, 30)[0]; if (rb) rorbuSite(rb.R); const home = rb ? rb.R.id : M.id; R.home = [home, portById(home).name];
  const o = S.ops = plan2New({home, rig:'line', jig:true, rhythm:'multi', days:3, places:[D2.felt('f1', F[0], 2, 6), D2.felt('f2', F[1], 2, 6), D2.juks('j1', J[0])], dep:5, land:{mode:'near', port:null, when:'days', days:3}});
  R.chk = plan2Check(o); const err = await D2.make(o); if (err) return {err, chk:R.chk}; o.on = true;
  const L = await D2.run(4 * 1440, 'closed', 'M'); R.run = KY.sum(L, o); R.outs = KY.outs(L);
  // where she lay each night at 01:00
  R.nights = [0, 1, 2, 3].map(d => { const e = L.ev.filter(x => { const [dd, hh] = x[0].split(' '); return +dd.slice(1) < d + 2 || (+dd.slice(1) === d + 2 && hh <= '01:00'); }).pop(); return e ? e[0] + ' ' + e[1] : null; });
  return R; }"""

# ---- the drawer over the 3D sea (with 3D drawn): the plan page at Bodø in each format
SHOT = r"""async () => { const {M} = await KY.town(67.285, 14.38, 5); S.t = D2.T0 + 9 * 60; D2.gear('line', 4); S.ops = null; KY.act('p2-new'); const o = S.ops; KY.act('p2-rig', {g:'line'});
  KY.put(o, 'felt', 2, M.p, 3, 10); KY.put(o, 'juks', 1, M.p, 2, 5); TAB.held = false; return {home:o.home, places:o.places.length, q:{...S.boat.pos}}; }"""
# the tile's 3D statics in (as vectest READY)
READY = """(q) => { const v = G3._debug.vec, tx = Math.floor(q.x / 50), ty = Math.floor(q.y / 50); return !vecHas(tx, ty) || (v.statics.some(s => s.k === tx + ':' + ty) && v.chunks > 15); }"""


async def towns(pg, names):
    for nm, la, lo in TOWNS:
        if names and nm not in names: continue
        print('== ' + nm)
        try: r = await pg.evaluate(TOWN, [nm, la, lo, 11 + len(nm)])
        except Exception as e: print('FEIL', nm + ': the plan page and the town\'s run threw:', str(e).split('\n')[0][:300]); continue
        print(ok(r.get('homesOk') is not False), nm + ': the Drift page draws its home list with the harbours as far as 25 km out, whose map may not be in yet (MAPD.simR is 4 km)', r.get('homesErr'))
        print('  mottak', r['M'], 'vec', r['vec'], 'plassene', r.get('places'), 'hjem', r.get('home0'))
        print('  hjem-lista:'); [print('    ', h) for h in r.get('homes', [])]
        print('  havneplasser:', r.get('havn'), r.get('havnErr') or '')
        st = r.get('start') or {}
        print(ok(st.get('on') and not st.get('err')), nm + ': B the plan made from the page (line 2 + 2, a jig place) is made and starts', [st.get('err'), st.get('M'), (st.get('chk') or {}).get('errors')])
        if not st.get('on'): continue
        B = r['B']; print('  B (hjem ' + str(r['home0']) + '):'); [print('    ', d) for d in B['days']]; [print('    ', e) for e in B['ev'][:40]]
        print('    redskap', [(g['set'], g['haul'], g['soak'], g['kg']) for g in B['gear']]); print('    stats', B['stats'], 'fin', B['fin']); print('    logg', B['log'][:6], 'meld', B['msgs'][:4])
        hauls = [g for g in B['gear'] if g['haul']]; d1 = B['stats'][:1]
        print(ok(len(B['gear']) >= 2 and len(hauls) >= 2 and all(6.0 <= g['soak'] <= 8.5 for g in hauls) and d1 and d1[0][1] > 0 and d1[0][5] == r['M'][0] and B['ops']['on'] and not B['ops']['stop'] and sum(B['outs'].values()) == 1), nm + ': B one day on the plan from the page: out once, both fields set and hauled after 6-8.5 h, landed at ' + r['M'][1] + ', home, the plan still on', [[(g['set'], g['soak']) for g in hauls], d1, B['outs'], B['fin']['port'], B['ops']['stop']])
        hm = r['homes']; kinds = [h[2] for h in hm]; rb = [i for i, h in enumerate(hm) if h[2] == 'rorbu']; rest = [i for i, h in enumerate(hm) if h[2] != 'rorbu']
        print(ok(hm and 'verft' not in kinds and rb and (not rest or max(rb) < min(rest)) and all(' nm ' in h[3] for h in hm)), nm + ': U14 the home list: the rorbuer first, no yard, every line says the distance', kinds)
        hv = r.get('havn') or []
        print(ok(not hv or any(h[0].startswith('hs:') for h in hm)), nm + ': U14 a harbour berth stands in the list when the harbours have one', [len(hv), [h[0] for h in hm if h[0].startswith('hs:')]])
        for k, what in (('F2', 'F2 a rorbu as home'), ('H', 'a harbour berth as home')):
            X = r.get(k) or {}
            if X.get('none'): print('HOPP', nm + ': ' + what + ': ingen i hjem-lista', X.get('kinds')); continue
            R2 = X.get('run') or {}; print('  ' + k + ':', json.dumps({q: X.get(q) for q in ('h', 'chosen', 'start', 'outs', 'end', 'rorbu', 'due')}, ensure_ascii=False)[:600])
            [print('    ', d) for d in (R2.get('days') or [])[:2]]; print('    stats', R2.get('stats'))
            st = R2.get('stats') or []; o_ = X.get('outs') or {}; e = X.get('end') or {}
            base = X.get('chosen') and (X.get('start') or {}).get('on') and len(o_) == 2 and all(v == 1 for v in o_.values()) and len(st) == 2 and all(d[1] > 0 for d in st) and e.get('atHome')
            if k == 'F2': print(ok(base and X.get('rorbu', 0) >= 2 and e.get('en', 0) >= 15), nm + ': F2 a rorbu as home (' + X['h'][1] + '): out once a day for two days, lands each day, back at the rorbu, and you rest there each night', [o_, [d[:2] for d in st], e, X.get('rorbu')])
            else: print(ok(base and e.get('held') and X.get('due', 0) >= 2), nm + ': a harbour berth as home (' + X['h'][1] + '): out once a day for two days, lands, comes back to the berth it holds, and pays the due', [o_, [d[:2] for d in st], e, X.get('due')])
        for k in ('P', 'PA'):
            P = r.get(k) or {}
            if P.get('none'): print('HOPP', nm + ': ingen fiskeplass i dag der hun kan ankre'); continue
            print('  pause ' + k + ':', P)
            print(ok((P['anch'] if P['spot'] == 'ok' else (not P['anch'] and P['drift'] == P['spot'])) and P['says'] and ('ankers' in P['says'] if P['anch'] else 'driver' in P['says'])), nm + ': Pause at sea (' + str(P['depth']) + ' m, ' + str(P.get('st')) + '): ' + ('anchors where she can' if k == 'PA' else 'anchors or drifts and says why'), [P['depth'], P['spot'], P['anch'], P['drift'], P['says']])
            print(ok(P['after']['on'] and not P['after']['anch'] and P['after']['gone'] is not None), nm + ': Start after the pause: she goes on' + (' and the anchor comes up when she goes' if P['anch'] else ''), P['after'])


async def real(pg, names):
    if not names or 'G' in names:
        print('== G: garn ved Ålesund med ett felt i Borgundfjorden (stengt 1.3.-31.5.), fra 29.2. og fra 27.5. i åtte døgn, torskekvoten nesten brukt, været som det kommer, lukket')
        r = await pg.evaluate(REAL_G); print('  ', json.dumps({k: r.get(k) for k in ('err', 'M', 'd', 'why', 'push1', 'wall1', 'stop', 'push2', 'left', 'quota', 'wait', 'push3', 'wall', 'stats', 'fin', 'wx')}, ensure_ascii=False)[:3000])
        if r.get('err'): print('FEIL G:', r['err'])
        else:
            [print('    ', x) for x in r['gear']]; [print('    ', x) for x in r['log']]
            st = r.get('stop') or {}
            print(ok(st.get('k') == 'closed' and st.get('fix') == 'places' and (st.get('at') or '').startswith('2028-03-01') and 'Borgundfjorden' in (st.get('no') or '')), 'G from 29 February: the plan stops on 1 March, when Borgundfjorden closes for three months (longer than it waits), with the reason and the place to change', st)
            print(ok(any(p[0].startswith('ops-') and p[1].startswith('2028-03-01') and 'stopper' in p[2] for p in r['push1']) and any('har stoppet' in p[2] for p in r['push2'])), 'G push: «Driftsplanen … stopper» for 1 March while the app is away the day before, and «har stoppet» when it has', [r['push1'], r['push2']])
            print('INFO G: garna som sto da planen stoppet:', r['left'], '(står i et felt som er stengt for alt fiske; se backloggen)')
            w = r.get('wait') or {}
            print(ok(w.get('k') == 'closed' and (w.get('open') or '').startswith('2028-06-01') and '1.6.' in (w.get('no') or '')), 'G from 27 May: Borgundfjorden opens on 1 June, within the month: the plan waits and says until when', w)
            print(ok(any(p[0].startswith('p2-closed') and p[1].startswith('2028-06-01') and 'åpent igjen' in p[2] for p in r['push3']) and not any(p[0].startswith('p2-closed') and p[1] < '2028-06-01' for p in r['push3'])), 'G push: «Feltet er åpent igjen» on 1 June, not the next day the plan looks again', r['push3'])
            g1 = [g for g in r['gear'] if g[4] == 'g1']; hauled = [g for g in r['gear'] if g[1] is not None]
            print(ok(g1 and all(g[0] >= '06-01' for g in g1) and hauled and all(23.9 <= g[1] <= 27 for g in hauled)), 'G nothing set in Borgundfjorden before 1 June, then both fields set, and the nets hauled after 24-27 h', [g[:3] for g in r['gear']])
            print(ok(r['sum']['conf'] > 0 or r['fin']['conf'] > 0), 'G the cod over the open group\'s quota is confiscated at the landing and counted in the plan\'s statistics', [r['sum'].get('conf'), r['fin']])
            print(ok(r['fin']['on'] and not r['fin']['stop'] and sum(r['wall']) < 30000), 'G eight days closed (playMinutes) in under 30 s, and the plan still on', [r['wall'], r['fin']])
    if not names or 'T' in names:
        print('== T: teiner ved Bodø, 15 + 15 ved 48 t, mannskapet alene, første døgn åpent og tre døgn lukket')
        r = await pg.evaluate(REAL_T); print('  ', json.dumps(r, ensure_ascii=False)[:2000])
        if r.get('err'): print('FEIL T:', r['err'])
        else:
            hauls = [g for g in r['gear'] if g[1] is not None]; lost = [g for g in r['gear'] if g[2] == 'tapt' and g[1] is None]
            print(ok(len(r['sets']) == 2 and any(p[0].startswith('gear-') for p in r['push'])), 'T two strings in the sea after day 1, and push tells when they have soaked', [r['sets'], r['push'][:3]])
            print(ok(len(hauls) + len(lost) >= 2 and hauls and all(48.0 - 0.05 <= g[1] <= 54 for g in hauls)), 'T the pots are hauled after 48 h (a string lost in the weather is not), three days closed', [r['gear'], r['wall_ms']])
            print(ok(r['fin']['on'] and not r['fin']['stop'] and r['stats'] and sum(x[1] for x in r['stats']) > 0), 'T landed, and the plan still on after four days', [r['stats'], r['fin']])
    if not names or 'M' in names:
        print('== M: flerdøgnstur fra Hammerfest på sjarken med køyer, deg og én i mannskapet, tre døgn per tur, levering hvert 3. døgn')
        r = await pg.evaluate(REAL_M)
        if r.get('err'): print('FEIL M:', r['err'], r.get('chk'))
        else:
            R = r['run']; [print('    ', d) for d in R['days']]; [print('    ', e) for e in R['ev'][:50]]; print('    netter', r['nights']); print('    stats', R['stats'], 'fin', R['fin']); print('    logg', R['log'][:8], R['msgs'][:4])
            hm = [e for e in r['run']['ev'] if e[1].startswith('fish:unmooring@' + r['home'][0])]
            print(ok(r['chk']['ok'] and len(hm) <= 1 and r['nights'][2] and '@' + r['home'][0] in r['nights'][2]), 'M a trip of three days: home only on the last night, out from home once (she started at the plant)', [[e[0] for e in hm], r['nights']])
            print(ok(r['nights'][0] and r['nights'][1] and '@' + r['home'][0] not in r['nights'][0] and '@' + r['home'][0] not in r['nights'][1]), 'M the first two nights of the trip are out (at anchor or a quay out there), not at home (' + r['home'][1] + ')', r['nights'])
            print(ok(len(R['stats']) >= 4 and R['stats'][2][1] > 0 and not any(x[1] > 0 for x in R['stats'][:2]) and R['stats'][3][1] == 0 and R['ops']['on'] and not R['ops']['stop']), 'M the catch is landed on the trip\'s third and last day, before home, not on day 1, nor on day 4, the next trip\'s first (Levering every third day; Jonas 08.11.2026: A), and the plan is still on', [R['stats'], R['ops']['stop']])


async def shots(p):
    # (with 3D drawn, as Jonas sees it: the drawer over the sea; not in run.py, run alone)
    for fmt, (w, h) in (('staaende', (800, 1280)), ('liggende', (1280, 800)), ('telefon', (384, 853))):
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        ctx = await b.new_context(viewport={'width': w, 'height': h}, has_touch=True, is_mobile=fmt != 'liggende'); pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME_TUT + '#notut'); await pg.evaluate(D2); await pg.evaluate(KY)
        r = await pg.evaluate(SHOT)
        try: await pg.wait_for_function(READY, arg=r['q'], timeout=240000)
        except Exception as e: print('  3D-flisa kom ikke inn:', str(e)[:120])
        await pg.evaluate("PHONE.close && PHONE.close(); DOCK.open('drift')")
        await pg.wait_for_timeout(8000)
        f = os.path.join(OUT, 'driftsplan2kyst-3d-' + fmt + '.png'); await pg.screenshot(path=f, timeout=300000)
        info = await pg.evaluate("(() => { const d = document.getElementById('drawer'); return {drawer:!!d && !d.hidden && Math.round(d.getBoundingClientRect().height), page:DOCK.page, three:!document.body.classList.contains('no3d') && typeof G3 !== 'undefined' && !!G3._debug, w:innerWidth, sx:document.documentElement.scrollWidth > innerWidth + 1}; })()")
        print(ok(info['drawer'] and info['three'] and not info['sx'] and not errs), '3d ' + fmt + ': the plan drawer over the 3D sea', r, info, f, errs[:2])
        await b.close()


async def main():
    names = [a for a in sys.argv[1:]]
    if not os.path.exists(os.path.join(ROOT, 'tools', 'map', 'out', 'game', 'manifest.json')):
        print('HOPP driftsplan2kyst: trenger hele kysten i bygget (python3 tools/map/release.py && python3 tools/map/game.py, så bygg)'); return
    if not os.environ.get('KYST_VEC_BUILT') and os.environ['KYST_DIST'].rstrip('/').endswith('dist-vec') and not os.environ.get('KYST_NOBUILD'):
        r = subprocess.run(['node', 'build.mjs'], cwd=ROOT, env=dict(os.environ, KYST_VEC='1'), capture_output=True, text=True)
        if r.returncode: print('FEIL dist-vec/ bygges med vec-pakkene', r.stderr[-200:]); return
    async with async_playwright() as p:
        if names == ['3d']: await shots(p); return
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await (await b.new_context(viewport={'width': 1100, 'height': 800})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        try: await boot(pg)
        except Exception as e: print('FEIL boot:', str(e)[:200], 'sidefeil:', errs[:5]); raise
        await pg.evaluate(D2); await pg.evaluate(KY)
        await pg.evaluate("lifeDay = () => {}; lifeInjury = () => {};")
        tn = [n for n in names if n in [t[0] for t in TOWNS]]; rn = [n for n in names if n in ('G', 'T', 'M')]
        if not names or tn: await towns(pg, tn)
        if not names or rn: await real(pg, rn)
        print('sidefeil:', errs[:5])
        await b.close()
if __name__ == '__main__': asyncio.run(main())
