# The sea voyages of H1b R8 (docs/planer/havsteget-h1b-rammen.md R8, 05.11.2026): from a harbour on the coast to a ground far out,
# by Autonav, sailed on the shared clock with step() (as lybtest) and without topping up the tank. For each voyage:
#  - the chart: the target is water with a depth, the route has no leg on the ground or into the ice (groundCheck, as autonavtest)
#  - the rules and the zone at the target (ruSea, rulesAt) and that the Russian, British and Faroese zones want their licence
#  - the weather there: the climate point it leans on, the month's mean wind, the air and sea temperature, January against July
#  - the ice: March and September at the target, and that Autonav does not go into it in March
#  - the fuel: which boats have the range for the trip there (the route panel's estimate, estimate() in ui/04-panels-instruments.js),
#    and what the boat really burnt on the way against the estimate
#  - a storm (WX_FORCE): far out a boat lies to and goes on when it eases; near the coast a coastal boat runs for the nearest quay as
#    before; an ocean vessel works on through 20 m/s and lies to over her own limit even near the coast (lieTo, core/05-vessels.js)
# The whole trip with the autoliner (H2e of docs/planer/havsteget-h2-autoline.md, 06.11.2026), from Båtsfjord, Tromsø, Ålesund and Bergen:
#  - bought with her permit at the yard nearest the town, through Båthandelen (blad B, the register, the price with the quota)
#  - to the plant nearest the town that takes conventional catch from an ocean vessel (portWhy), bait by the tonne and bunkers there
#  - out by Autonav to the NPC autoliners' nearest ground where the rules let her set (§ 26, § 32, the zones), the stores filled as she casts off
#  - four lenker set and hauled by the teams, the catch gutted and frozen in the factory, the fuel, the coast guard if she comes
#  - home by Autonav, landed on pallets, the landing note in round weight with the price for frozen fish, the share and the crews' change
#  - pictures in both formats: the sale sheet, on the ground while hauling, the landing note
# The whole trip with the snow crab vessel (H3e of docs/planer/havsteget-h3-snokrabbe.md, 10.11.2026): `havtur.py krabbe [town ...]`
#  - bought with her snow crab permit at the yard nearest the town, through Båthandelen (blad B), February 2027
#  - pots, buoy sets and heavy anchors in the tackle shop, squid and bunkers at the plant nearest the town that takes her (portWhy, V2 C)
#  - out by Autonav to Sentralbanken where the snow crab rules let her set, four lenker of 200 set, three days in the sea, hauled,
#    the crab sorted, cooked and frozen as clusters; the coast guard boards her during the hauling (kvSnoCheck, 09j-kystvakt.js)
#  - home by Autonav, landed on pallets at the plant, the landing note on the vessel quota
#  - from Båtsfjord a live trip too: the crab into the tanks, landed in tubs, on the extra quota
#  - pictures in both formats: the sale sheet, on the field while hauling with the coast guard's word, the landing note
#  The places (stikkprove): Båtsfjord and Kjøllefjord (north), Tromsdalen (middle), Selje (south), among the plants that take her
# Run alone: python3 tests/havtur.py tur [town ...]; with no arguments the voyages, the storm and the trips all run.
# LITE (no 3D). Needs the whole coast in tools/map/out/game and dist-vec (the harbours in Longyearbyen), as lybtest.
import asyncio, json, os, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.environ['KYST_DIST'] = os.path.join(ROOT, 'dist-vec')
from playwright.async_api import async_playwright
from _env import *
ok = lambda c: 'OK  ' if c else 'FEIL'

# from, (lat, lon) of the ground, name, the zone expected there
TRIPS = [
    ('Båtsfjord', 76.0, 35.0, 'Båtsfjord–Sentralbanken', ('sv', 'int', 'no', 'smh')),
    ('Båtsfjord', 69.9, 48.0, 'Båtsfjord–Petsjorahavet', ('ru',)),
    ('Hammerfest', 74.35, 19.6, 'Hammerfest–Bjørnøya', ('sv', 'svt')),
    ('Tromsdalen', 78.25, 15.3, 'Tromsø–Longyearbyen (Isfjorden)', ('svt', 'sv')),
    ('Ålesund', 66.8, -18.5, 'Ålesund–Nord-Island', ('is',)),
    ('Ålesund', 61.9, -6.0, 'Ålesund–Færøyane', ('fo',)),
    ('Måløy', 60.0, 2.6, 'Måløy–Vikingbanken', ('no',)),
    ('Måløy', 61.0, -1.0, 'Måløy–Shetland', ('gb',)),
]
ONLY = [a for a in sys.argv[1:] if not a.startswith('-')]
TUR = 'tur' in ONLY; KRABBE = 'krabbe' in ONLY; ONLY = [a for a in ONLY if a not in ('tur', 'krabbe')]
# the trips: the town, its middle (stikkprove's places)
TOWNS = [('Båtsfjord', 70.633, 29.72), ('Tromsø', 69.649, 18.96), ('Ålesund', 62.472, 6.155), ('Bergen', 60.393, 5.312)]
# the snow crab trips (H3e): the town and its middle; the plant is the one nearest it that takes the vessel
KTOWNS = [('Båtsfjord', 70.633, 29.72), ('Kjøllefjord', 70.946, 27.35), ('Tromsdalen', 69.65, 18.99), ('Selje', 62.05, 5.35)]
OUTD = os.path.join(ROOT, 'tests', 'out')

# the helpers the trip uses: running the shared clock while a condition holds (loading the chart as she goes), and sailing by Autonav
HT = """() => { window.HT = {
  run: async (cond, max) => { const b = S.boat; let k = 0; while (cond() && k < max){ if (!simAreaReady()){ await mapNeed(b.pos, 4); await new Promise(r => setTimeout(r, 30)); continue; } DYN.on = false; step(); k++; if (k % 150 === 0) await new Promise(r => setTimeout(r, 0)); } return k; },
  sail: async (to, toPort, max) => { const b = S.boat, a = {...b.pos}, ap = b.status === 'port' ? b.port : null; let r = null;
    try { r = await leiaRoute(a, to, ap, toPort || null); } catch (e){ r = {why:[String(e)]}; }
    if (!r || !r.wps) return {why:r && r.why ? String(r.why[0]).slice(0, 140) : 'ingen'};
    S.plan = {wps:r.wps.map((q, i) => i === r.wps.length - 1 && toPort ? {x:to.x, y:to.y, port:toPort, fish:0} : {x:q.x, y:q.y, port:null, fish:0, leia:true}), idx:0, speed:BOAT.vcruise, returning:false};
    const T0 = S.t, f0 = b.fuel; depart(); let n = 0;
    for (let i = 0; i < 6; i++){ n += await HT.run(() => !!S.plan || ['sailing', 'unmooring'].includes(b.status), max || 4000);
      if (!S.plan && (S.shelter || sailWaiting())){ for (let w = 0; w < 200 && (S.shelter || sailWaiting()) && !S.plan; w++) await new Promise(r => setTimeout(r, 150)); } if (!S.plan) break; }
    return {nm:+r.nm.toFixed(0), h:+((S.t - T0) / 60).toFixed(1), fuel:Math.round(f0 - b.fuel), status:b.status, port:b.port ? (portById(b.port) || {}).name : null, atEnd:+(kmTrue(b.pos, to) / NM).toFixed(1), n}; },
  shot: (app) => { PHONE.show(true); PHONE.open(app); PHONE.render(); }
}; return true; }"""

# at the yard nearest the town, in a coastal vessel with no right, the cash for the autoliner on blad B; Båthandelen › Havfiske › the autoliner
PREP = """async ([la, lo]) => {
  const R = {}, b = S.boat, T = P(la, lo), H0 = (Date.UTC(2027, 5, 8, 6) - EPOCH) / 36e5;
  S.t = Math.round(H0 * 60); S.tut = 0; S.landN = Math.max(S.landN || 0, 8); S.fm = Object.assign(S.fm || {}, {b:true}); S.cash = Math.max(S.cash, 4e8);
  const yard = PORTS.filter(q => /verft/.test(q.sted || '')).sort((a, c) => dist(a.p, T) - dist(c.p, T))[0];
  const plant = PORTS.filter(q => (q.mottak || q.havOnly) && !portWhy(q, 'autoliner')).sort((a, c) => dist(a.p, T) - dist(c.p, T))[0];
  R.yard = yard.name; R.yardNm = +(kmTrue(yard.p, T) / NM).toFixed(1); R.plant = plant.name; R.plantId = plant.id; R.plantNm = +(kmTrue(plant.p, T) / NM).toFixed(1); R.plantGear = plant.mk && plant.mk.gear;
  await mapNeed(yard.p, 6);
  if (S.lic){ try { regFree(S.lic.id); } catch (e){} } S.lic = null;
  b.type = 'kyst15'; applyVessel(); freshQuota(); b.status = 'port'; b.port = yard.id; b.pos = {...yard.p}; b.berth = 'main'; b.land = null; b.gop = null; b.fueling = null; b.shift = null; b.hove = null; b.anch = null;
  S.plan = null; S.sets = []; S.hold = []; S.kvHaul = []; S.me = S.cur; S.crew = []; S.lag = null; S.ops = null;
  R.reg = (npcReg().konv || 0); R.price = havPrice('autoliner', S.t / 60); R.why = havLicWhy('autoliner');
  PHONE.show(true); PHONE.open('fartoy'); PHONE.render(); await new Promise(r => setTimeout(r, 100));
  const tab = document.querySelector('[data-pa="mktab"][data-s="hav"]'); if (tab) tab.click(); await new Promise(r => setTimeout(r, 100));
  const card = document.querySelector('[data-pa="mksel"][data-k="autoliner"]'); if (card) card.click(); await new Promise(r => setTimeout(r, 150));
  const v = document.querySelector('.vsheet') || document.getElementById('drawerBody'); R.sheet = v ? v.closest('#drawerBody, #phView').innerText : '';
  const btn = document.querySelector('[data-pa="buy"][data-ti="1"][data-k="autoliner"]'); R.btn = btn ? !btn.disabled : null;
  if (btn) btn.scrollIntoView({block:'center'});
  return R; }"""

BUY = """async () => {
  const R = {}, b = S.boat, c0 = S.cash, r0 = npcReg().konv || 0, m0 = S.msgs.length;
  document.querySelector('[data-pa="buy"][data-ti="1"][data-k="autoliner"]').click(); await new Promise(r => setTimeout(r, 200));
  R.type = b.type; R.lic = S.lic ? {id:S.lic.id, hav:S.lic.hav, kf:S.lic.kf, from:S.lic.from} : null; R.paid = Math.round(c0 - S.cash); R.loan = Math.round((S.loan || 0));
  R.reg = [r0, npcReg().konv || 0]; R.msg = S.msgs.slice(m0).map(m => m.from + ': ' + m.no).join(' | ').slice(0, 300);
  R.q = (q => ({torsk:Math.round(q.torsk / 1000), hyse:Math.round(q.hyse[0] / 1000)}))(licQ(S.lic, S.t / 60));
  // the moment of the purchase (ui/10q-buymoment.js): her name painted on and the flag up; skipped, as a player would once seen
  await new Promise(r => setTimeout(r, 400)); const sk = document.querySelector('.bm-skip'); R.moment = !!sk; if (sk) sk.click();
  PHONE.show(false); return R; }"""

# to the plant: bunkers and bait by the tonne there, then out by Autonav to the ground
OUT = """async ([la, lo, plantId]) => {
  const R = {}, b = S.boat, pg = S.pgear, T = P(la, lo), plant = portById(plantId);
  await mapNeed(plant.p, 6);
  if (b.port !== plant.id){ R.toPlant = await HT.sail({...plant.p}, plant.id, 2000); }
  R.atPlant = b.status === 'port' && b.port === plant.id;
  // bunkers at the plant's pump, and the bait: half squid, half saury, for a short trip of four lenker twice over and some to spare
  const f0 = b.fuel, tb = S.t; R.fuelStart = startFueling(false); await HT.run(() => !!(b.fueling || b.shift), 1500); R.bunkered = Math.round(b.fuel - f0); R.fuelCap = BOAT.fuelCap; R.fuelFull = BOAT.fuelCap - b.fuel < 1; R.bunkerH = +((S.t - tb) / 60).toFixed(1);
  R.bait = [buyGear('bait', 'blekksprut', 1000), buyGear('bait', 'saury', 1000)].map(w => w ? w[0] : null); R.baitKg = Object.assign({}, baitOf(pg)); R.lenker = autoL(pg).n; R.hooks = pg.hooks;
  // the ground: the NPC autoliners' grounds nearest the plant where a line with a baiting machine may be set this month, in Norwegian waters
  const H = S.t / 60, GR = havData().g.line.filter(e => e[1] != null).map(e => ({x:e[1], y:e[2]})).sort((a, c) => dist(a, plant.p) - dist(c, plant.p));
  let gnd = null, tried = 0; R.skip = [];
  for (const p of GR.slice(0, 30)){ tried++; await mapNeed(p, 4); if (isLand(p) || depthF(p) < 60) continue;
    const r = rulesAt({p, H, len:BOAT.len, gear:'line', sp:'torsk', egn:true}), bl = r.items.find(i => i.block && i.v === 'no'); if (bl){ R.skip.push([+(kmTrue(plant.p, p) / NM).toFixed(0), bl.k, ruSea(p)]); continue; }
    const far = {x:p.x + 13, y:p.y}; await mapNeed(far, 4); if (rulesAt({p:far, H, len:BOAT.len, gear:'line', sp:'torsk', egn:true}).items.some(i => i.block && i.v === 'no')) continue;
    gnd = p; break; }
  R.tried = tried; if (!gnd) return R;
  R.ground = LL(gnd); R.groundNm = +(kmTrue(plant.p, gnd) / NM).toFixed(0); R.blNm = +blNm(gnd).toFixed(1); R.depth = Math.round(depthF(gnd)); R.zone = ruSeaName(ruSea(gnd)); window.__g = gnd;
  const p0 = b.prov; R.out = await HT.sail(gnd, null, 6000); R.prov = [p0, +(b.prov || 0).toFixed(0)]; R.status = b.status;
  return R; }"""

# on the ground: two lenker at a time eastwards, two strings 1.2 km apart, each hauled when it has stood six hours; until stopAt hauls
# are under way (a picture), then on until all four are hauled; the factory freezes meanwhile
FISH = """async (stopAt) => {
  const R = window.__F || (window.__F = {set:0, hauls:0, why:[], f0:S.boat.fuel, T0:S.t, kg0:holdTotal()}), b = S.boat, pg = S.pgear, p0 = window.__g; let k = 0;
  while (k < 4000 && (R.set < 4 || mySets().length || b.gop)){
    if (!b.gop && b.status !== 'port'){
      const sets = mySets(), old = sets.filter(s => !s.hauling && S.t - s.tSet >= 6 * 60).sort((a, c) => a.tSet - c.tSet)[0];
      if (old){ b.pos = {...old.a}; b.status = 'idle'; const w = startHaul(old.id, false, 0); if (w) R.why.push(w[0]); else R.hauls++; }
      else if (R.set < 4 && autoL(pg).n >= 2){ b.pos = {x:p0.x, y:p0.y + 1.2 * (R.set / 2)}; b.status = 'idle'; b.heading = Math.PI / 2;
        const ch = setChoices().find(c => c.spec && c.spec.lk === 'auto' && c.n === 2), w = ch ? startSet('line', ch.spec, 0, Math.PI / 2) : ['no choice']; if (w) { R.why.push(w[0]); R.set = 4; } else R.set += 2; }
    }
    if (stopAt && R.hauls >= stopAt && b.gop && b.gop.op === 'haul' && b.gop.done >= 1) break;
    if (!simAreaReady()){ await mapNeed(b.pos, 4); await new Promise(r => setTimeout(r, 30)); continue; }
    DYN.on = false; step(); k++; if (k % 150 === 0) await new Promise(r => setTimeout(r, 0)); }
  const fr = S.hold.filter(x => x.frozen).reduce((a, x) => a + x.kg, 0), sp = {}; for (const x of S.hold) sp[x.sp] = (sp[x.sp] || 0) + Math.round(x.kg);
  return {set:R.set, hauls:R.hauls, why:R.why, h:+((S.t - R.T0) / 60).toFixed(1), fuel:Math.round(R.f0 - b.fuel), round:Math.round(holdTotal()), prod:Math.round(holdLoad()), frozen:Math.round(fr), sp,
    sets:mySets().length, gop:b.gop ? b.gop.op : null, sleep:S.log.filter(l => /sovnet av utmattelse/.test(l.no || '')).map(l => l.no).slice(-2), slNote:(document.getElementById('slNote') || {}).textContent || null, haul:(S.kvHaul || [])[0] ? {ms:S.kvHaul[0].ms, kg:Object.fromEntries(Object.entries(S.kvHaul[0].kg).map(([a, v]) => [a, Math.round(v)]))} : null, kv:S.kv ? {n:S.kv.n, k:(S.kv.log[0] || {}).k} : null}; }"""

# home by Autonav to the plant, the freezing done, landed on pallets; the landing note
HOME = """async (plantId) => {
  const R = {}, b = S.boat, plant = portById(plantId), m0 = S.msgs.length; window.__F = null;
  await HT.run(() => S.hold.some(x => !x.frozen), 24 * 60); R.unfrozen = Math.round(S.hold.filter(x => !x.frozen).reduce((a, x) => a + x.kg, 0));
  R.round = Math.round(holdTotal()); R.prod = Math.round(holdLoad());
  R.home = await HT.sail({...plant.p}, plant.id, 6000); R.atPlant = b.status === 'port' && b.port === plant.id;
  R.portWhy = portWhy(plant, b.type); const n0 = S.stats.trips;
  let k = 0, started = false; while (k++ < 3000 && !started){ started = startLanding(false); if (!started) await HT.run(() => true, 5); }
  const L = b.land; R.started = started; R.land = L ? {kind:L.kind, n:L.n, pk:L.pk, h:+((L.until - L.t0) / 60).toFixed(1)} : null; R.wait = k;
  await HT.run(() => !!b.land, 3000); R.done = !b.land;
  const ls = S.lastSale || {}, LN = ls.lines || []; R.total = Math.round(ls.total || 0); R.kg = Math.round(LN.reduce((a, l) => a + l.kg, 0)); R.lott = Math.round(ls.lott || 0); R.dl = ls.ls ? [ls.ls.n, +ls.ls.M.toFixed(3)] : null;
  R.fz = LN.every(l => l.fz); R.lines = LN.slice(0, 8).map(l => [l.sp, Math.round(l.kg), Math.round(l.sum), +(l.sum / Math.max(1, l.kg)).toFixed(1)]); R.left = S.hold.length; R.conf = Math.round(ls.confKg || 0);
  R.msg = S.msgs.slice(m0).map(m => m.from + ': ' + m.no).join(' | ').slice(0, 400); R.log = S.log.slice(-4).map(l => l.no).join(' | ').slice(0, 400);
  return R; }"""

PLAN = """async ([an, la, lo]) => {
  const R = {}, A = PORTS.find(p => p.name === an && p.mottak) || PORTS.find(p => p.name.startsWith(an)), B = P(la, lo), H7 = (Date.UTC(2027, 6, 5, 6) - EPOCH) / 36e5;
  R.from = A.name; S.t = Math.round(H7 * 60); S.tut = 0; S.cash = 5e6;
  await mapNeed(B, 4);
  // the chart at the target
  R.land = isLand(B); R.depth = Math.round(depthF(B)); R.ll = LL(B); R.gamma = +gridGamma(B).toFixed(1); R.k = +gridScale(B).toFixed(4);
  R.crowNm = +(kmTrue(A.p, B) / NM).toFixed(0);
  // the zone and the rules
  R.zone = ruSea(B); R.zoneName = ruSeaName(R.zone);
  const rl = rulesAt({p:B, H:H7, len:15}); R.rulesV = rl.v; R.rules = rl.items.map(r => r.k); R.ruleNo = rl.items.slice(0, 4).map(r => r.no.slice(0, 90));
  R.lic = ZLIC.includes(R.zone) ? {needs:true, have:zoneLic(R.zone)} : {needs:false};
  // the weather: the nearest climate points and the mean of the month, January and July
  R.clim = (climW(B) || []).map(([c, w]) => c.n + ' ' + Math.round(w * 100) + '%');
  const mean = (y, m, f) => { let s = 0, n = 0; for (let d = 0; d < 28; d++) for (let h = 0; h < 24; h += 3){ s += f((Date.UTC(y, m, 1 + d, h) - EPOCH) / 36e5); n++; } return +(s / n).toFixed(1); };
  R.wx = {}; for (const [k, m] of [['jan', 0], ['jul', 6]]) R.wx[k] = {wind:mean(2027, m, H => windAt(H, B)), hs:mean(2027, m, H => hsAt(B, H)), air:mean(2027, m, H => airTemp(H, B)), sea:mean(2027, m, H => seaTemp(H, B)),
    gale:(() => { let g = 0, n = 0; for (let d = 0; d < 28; d++) for (let h = 0; h < 24; h += 3){ if (windAt((Date.UTC(2027, m, 1 + d, h) - EPOCH) / 36e5, B) >= 14) g++; n++; } return Math.round(g / n * 100); })()};
  // the ice
  R.ice = {mar:Math.round(seaIceAt(B, (Date.UTC(2027, 2, 15) - EPOCH) / 36e5)), sep:Math.round(seaIceAt(B, (Date.UTC(2027, 8, 15) - EPOCH) / 36e5))};
  // the route in July
  const t0 = performance.now(); let r = null; try { r = await leiaRoute({...A.p}, B, A.id, null); } catch (e){ r = {why:[String(e)]}; }
  R.ms = Math.round(performance.now() - t0);
  if (!r || !r.wps){ R.why = r && r.why ? String(r.why[0]).slice(0, 160) : 'ingen'; return R; }
  R.wps = r.wps; R.nm = +r.nm.toFixed(0);
  let pr = {...A.p}, land = 0, ice = 0; for (const w of r.wps){ await lnetLoad([pr, w]); if (groundCheck(pr, w)) land++; if (seaIceOnLeg(pr, w, H7, VESSELS.kyst15)) ice++; pr = w; } R.badLegs = land; R.iceLegs = ice;
  // the route in March, if the ice is near: Autonav round it or not at all, never into it
  if (R.ice.mar > 5 || /Sentral|Longyear|Bjørn/.test(an + la)){ const H3 = (Date.UTC(2027, 2, 15, 6) - EPOCH) / 36e5, t3 = S.t; S.t = Math.round(H3 * 60);
    let r3 = null; try { r3 = await leiaRoute({...A.p}, B, A.id, null); } catch (e){ r3 = {why:[String(e)]}; }
    if (r3 && r3.wps){ let q = A.p, n = 0; for (const w of r3.wps){ if (seaIceOnLeg(q, w, H3, VESSELS.kyst15)) n++; q = w; } R.mar = {nm:+r3.nm.toFixed(0), iceLegs:n}; }
    else R.mar = {why:r3 && r3.why ? String(r3.why[0]).slice(0, 120) : 'ingen'}; S.t = t3; }
  // the fuel: every boat type, with a full tank, at its cruising speed in the month's mean wind, the route panel's sum
  const keep = S.boat.type; R.fuel = {};
  for (const t of Object.keys(VESSELS)){ S.boat.type = t; applyVessel(); const v = BOAT.vcruise, W = R.wx.jul.wind, need = fuelLph(v, W) * r.nm / v; R.fuel[t] = {cap:BOAT.fuelCap, need:Math.round(need), pct:Math.round(need / BOAT.fuelCap * 100), v}; }
  S.boat.type = keep; applyVessel();
  return R; }"""

SAIL = """async ([an, wps, type]) => {
  const R = {}, b = S.boat, A = PORTS.find(p => p.name === an && p.mottak) || PORTS.find(p => p.name.startsWith(an));
  b.type = type; applyVessel(); b.fuel = BOAT.fuelCap; b.status = 'port'; b.port = A.id; b.pos = {...A.p}; S.lic = null;
  const v = BOAT.vcruise, W = windAt(S.t / 60), km = wps.reduce((a, w, i) => a + kmTrue(i ? wps[i - 1] : b.pos, w), 0);
  R.type = type; R.est = Math.round(fuelLph(v, W) * km / NM / v); R.cap = BOAT.fuelCap; R.v = v;
  S.plan = {wps:wps.map(w => ({...w, port:null, fish:0})), idx:0, speed:v}; depart();
  const T0 = S.t, f0 = b.fuel; let n = 0, empty = null, lastTarget = wps[wps.length - 1]; R.events = [];
  while (n < 30000){
    if (!simAreaReady()){ await mapNeed(b.pos, 4); await new Promise(r => setTimeout(r, 50)); continue; }
    DYN.on = false; step(); n++;
    if (b.fuel <= 0 && !empty){ empty = {h:Math.round((S.t - T0) / 60), ll:LL(b.pos), left:+(kmTrue(b.pos, lastTarget) / NM).toFixed(0)}; break; }
    if (n % 200 === 0) await new Promise(r => setTimeout(r, 0));
    if (!S.plan && b.status !== 'sailing'){
      if (S.shelter || sailWaiting()){ for (let k = 0; k < 200 && (S.shelter || sailWaiting()) && !S.plan; k++) await new Promise(r => setTimeout(r, 150)); }
      if (!S.plan) break; }
    if (S.plan && S.plan.returning && !R.shelter){ const q = S.plan.wps[S.plan.wps.length - 1]; R.shelter = {h:Math.round((S.t - T0) / 60), at:LL(b.pos), to:(portById(q.port) || {}).name, nm:+(kmTrue(b.pos, q) / NM).toFixed(0), w:+windAt(S.t / 60).toFixed(1)}; }
  }
  R.h = +((S.t - T0) / 60).toFixed(1); R.used = Math.round(f0 - b.fuel); R.left = Math.round(b.fuel); R.status = b.status; R.port = (portById(b.port) || {}).name || null;
  R.empty = empty; R.atEnd = +(kmTrue(b.pos, lastTarget) / NM).toFixed(1);
  R.log = S.log.slice(-5).map(l => (l.no || l[1] || String(l)).slice(0, 140));
  return R; }"""

STORM = """async ([type, la, lo, wHi]) => {
  const R = {}, b = S.boat, p = P(la, lo); await mapNeed(p, 4); S.sleep = null; S.energy = 100; S.drowsy = false;   // (awake and rested: asleep alone she drifts, 15-energy.js sleepDrift)
  S.settings.autoOn = true; S.settings.autoW = 11; S.settings.autoTo = 'near';
  b.type = type; applyVessel(); b.fuel = BOAT.fuelCap; b.status = 'idle'; b.port = null; b.pos = {...p}; b.hove = null; b.v = 0;
  // a route 60 km to the west, out to sea, at cruising speed
  const to = {x:p.x - 60, y:p.y}; S.plan = {wps:[{x:to.x, y:to.y, port:null, fish:0}], idx:0, speed:BOAT.vcruise}; b.status = 'sailing';
  const run = async n => { for (let i = 0; i < n; i++){ if (!simAreaReady()){ await mapNeed(b.pos, 4); i--; continue; } DYN.on = false; step(); if (i % 100 === 0) await new Promise(r => setTimeout(r, 0)); } };
  WX_FORCE = {w:6, d:240}; await run(5);
  WX_FORCE = {w:wHi, d:240}; const p0 = {...b.pos}, f0 = b.fuel; await run(120);
  for (let k = 0; k < 100 && (S.shelter || sailWaiting()); k++) await new Promise(r => setTimeout(r, 150));
  R.hove = !!b.hove; R.status = b.status; R.returning = !!(S.plan && S.plan.returning); R.to = S.plan && S.plan.returning ? (portById(S.plan.wps[S.plan.wps.length - 1].port) || {}).name : null;
  R.moved = +(dist(p0, b.pos) * 1000).toFixed(0); R.log = S.log.slice(-5).map(l => [l.t, (l.no || String(l)).slice(0, 80)]); R.t = S.t; R.burnt = Math.round(f0 - b.fuel); R.text = statusText(); R.lim = windLim(); R.hs = +hsAt(b.pos, S.t / 60).toFixed(1); R.seaLim = seaLim();
  if (b.hove){ WX_FORCE = {w:7, d:240}; await run(90); R.after = {status:b.status, plan:!!S.plan, hove:!!b.hove, log:S.log.slice(-1).map(l => l.no || l)[0]}; }
  WX_FORCE = null; S.plan = null; b.hove = null; b.status = 'idle';
  return R; }"""

# ---- the snow crab trip (H3e)
# at the yard nearest the town in February 2027, a coastal vessel with no right, the cash for the snow crab vessel; Båthandelen › Havfiske
KPREP = """async ([la, lo]) => {
  const R = {}, b = S.boat, T = P(la, lo), H0 = (Date.UTC(2027, 1, 8, 6) - EPOCH) / 36e5;
  S.t = Math.round(H0 * 60); S.tut = 0; S.landN = Math.max(S.landN || 0, 8); S.fm = Object.assign(S.fm || {}, {b:true}); S.cash = Math.max(S.cash, 4e8);
  const yard = PORTS.filter(q => /verft/.test(q.sted || '')).sort((a, c) => dist(a.p, T) - dist(c.p, T))[0];
  const plant = PORTS.filter(q => (q.mottak || q.havOnly) && !portWhy(q, 'snokrabbe')).sort((a, c) => dist(a.p, T) - dist(c.p, T))[0];
  const shop = PORTS.filter(q => q.sted === 'butikk' || (q.mottak && portServices(q, 'main').butikk)).sort((a, c) => dist(a.p, plant.p) - dist(c.p, plant.p))[0];
  R.yard = yard.name; R.yardNm = +(kmTrue(yard.p, T) / NM).toFixed(1); R.plant = plant.name; R.plantId = plant.id; R.plantNm = +(kmTrue(plant.p, T) / NM).toFixed(1); R.shop = shop.name; R.shopId = shop.id;
  await mapNeed(yard.p, 6);
  if (S.lic){ try { regFree(S.lic.id); } catch (e){} } S.lic = null;
  b.type = 'kyst15'; applyVessel(); freshQuota(); b.status = 'port'; b.port = yard.id; b.pos = {...yard.p}; b.berth = 'main'; b.land = null; b.gop = null; b.fueling = null; b.shift = null; b.hove = null; b.anch = null; b.snoMode = 'frys';
  S.plan = null; S.sets = []; S.hold = []; S.kvHaul = []; S.me = S.cur; S.crew = []; S.lag = null; S.ops = null; S.snoSoft = null; S.pgear = newPGear();
  if (S.kv){ S.kv.visit = null; S.kv.at = null; }
  R.reg = npcReg().krab || 0; R.price = havPrice('snokrabbe', S.t / 60); R.why = havLicWhy('snokrabbe');
  PHONE.show(true); PHONE.open('fartoy'); PHONE.render(); await new Promise(r => setTimeout(r, 100));
  const tab = document.querySelector('[data-pa="mktab"][data-s="hav"]'); if (tab) tab.click(); await new Promise(r => setTimeout(r, 100));
  const card = document.querySelector('[data-pa="mksel"][data-k="snokrabbe"]'); if (card) card.click(); await new Promise(r => setTimeout(r, 150));
  const v = document.querySelector('.vsheet') || document.getElementById('drawerBody'); R.sheet = v ? v.closest('#drawerBody, #phView').innerText : '';
  const btn = document.querySelector('[data-pa="buy"][data-ti="1"][data-k="snokrabbe"]'); R.btn = btn ? !btn.disabled : null;
  if (btn) btn.scrollIntoView({block:'center'});
  return R; }"""

KBUY = """async () => {
  const R = {}, b = S.boat, c0 = S.cash, r0 = npcReg().krab || 0, m0 = S.msgs.length;
  document.querySelector('[data-pa="buy"][data-ti="1"][data-k="snokrabbe"]').click(); await new Promise(r => setTimeout(r, 200));
  R.type = b.type; R.lic = S.lic ? {id:S.lic.id, hav:S.lic.hav, kf:S.lic.kf} : null; R.paid = Math.round(c0 - S.cash);
  R.reg = [r0, npcReg().krab || 0]; R.msg = S.msgs.slice(m0).map(m => m.from + ': ' + m.no).join(' | ').slice(0, 300);
  const Q = snoQuota(S.t / 60); R.q = Q ? [Math.round(Q.base / 1000), Math.round(Q.extra / 1000)] : null;
  await new Promise(r => setTimeout(r, 400)); const sk = document.querySelector('.bm-skip'); R.moment = !!sk; if (sk) sk.click();
  PHONE.show(false); return R; }"""

# the gear in the shop, the squid and the bunkers at the plant, the trip's choice (frozen or live), then out to Sentralbanken
KOUT = """async ([plantId, shopId, nL, mode, ground]) => {
  const R = {}, b = S.boat, pg = S.pgear, plant = portById(plantId), shop = portById(shopId);
  const go = async q => { await mapNeed(q.p, 6); if (b.status === 'port' && b.port === q.id) return null; return await HT.sail({...q.p}, q.id, 3000); };
  // the tackle shop: the pots (200 a lenke), a buoy set and a heavy anchor for each
  if ((pg.pots.sno || 0) < nL * 200){ R.toShop = await go(shop); R.atShop = b.status === 'port' && b.port === shop.id;
    R.buy = [buyGear('pot', 'sno', nL * 200 - (pg.pots.sno || 0)), buyGear('kit', null, Math.max(0, nL - pg.kits.n)), buyGear('heavy', null, Math.max(0, nL - pg.kits.heavy))].map(w => w ? w[0] : null); }
  R.pots = pg.pots.sno || 0; R.kits = [pg.kits.n, pg.kits.heavy];
  R.toPlant = await go(plant); R.atPlant = b.status === 'port' && b.port === plant.id;
  const f0 = b.fuel, tb = S.t; R.fuelStart = startFueling(false); await HT.run(() => !!(b.fueling || b.shift), 1500); R.bunkered = Math.round(b.fuel - f0); R.fuelFull = BOAT.fuelCap - b.fuel < 1; R.bunkerH = +((S.t - tb) / 60).toFixed(1);
  const need = Math.ceil(nL * 200 * POTS.sno.bait * 1.2) - Math.round(baitOf(pg).blekksprut || 0);
  R.bait = need > 0 ? buyGear('bait', 'blekksprut', need) : null; R.bait = R.bait ? R.bait[0] : null; R.baitKg = Math.round(baitOf(pg).blekksprut || 0);
  R.mode = snoSetMode(mode) || (b.snoMode || 'frys') === mode; R.live = snoLive();
  // the ground: Sentralbanken at the banks' depth where the snow crab rules let her set along the whole lenke and the lenker beside it
  const H = S.t / 60, ok = q => !isLand(q) && !ruBlockMsg({p:q, H, len:BOAT.len, gear:'teiner', sp:'snokrabbe', hav:'krab'});
  let gnd = null; R.tried = 0;
  for (let k = 0; k < 300 && !gnd; k++){ const q = P(ground[0] + 0.2 * Math.sin(k), ground[1] + 0.6 * Math.cos(k * 1.3)); R.tried++; await mapNeed(q, 14); const d = depthF(q);
    if (d < 230 || d > 340 || !ok(q)) continue; let all = true; for (let i = 0; i < nL && all; i++) for (const dx of [0, 5]){ const e = {x:q.x + dx, y:q.y + 1.5 * i}; await mapNeed(e, 4); if (!ok(e)) all = false; } if (all) gnd = q; }
  if (!gnd) return R;
  R.ground = LL(gnd); R.groundNm = +(kmTrue(plant.p, gnd) / NM).toFixed(0); R.blNm = +blNm(gnd).toFixed(1); R.depth = Math.round(depthF(gnd)); R.zone = ruSeaName(ruSea(gnd)); window.__g = gnd;
  const p0 = b.prov; R.out = await HT.sail(gnd, null, 6000); R.prov = [p0, +(b.prov || 0).toFixed(0)]; R.status = b.status;
  return R; }"""

# on the field: nL lenker of 200 eastwards, 1.5 km apart, each hauled when it has stood soak days; the coast guard comes over while the
# first is hauled (kvArrive, as the week's roll would bring her) and her word is read when she is done; stopAt hauls under way for a picture
KFISH = """async ([nL, soak, stopAt]) => {
  const R = window.__K || (window.__K = {set:0, hauls:0, why:[], f0:S.boat.fuel, T0:S.t, kv:null}), b = S.boat, pg = S.pgear, p0 = window.__g; let k = 0;
  while (k < 20000 && (R.set < nL || mySets().length || b.gop || (S.kv && S.kv.visit))){
    if (!b.gop && b.status !== 'port'){
      const sets = mySets(), old = sets.filter(s => !s.hauling && S.t - s.tSet >= soak * 1440).sort((a, c) => a.tSet - c.tSet)[0];
      if (old){ b.pos = {...old.a}; b.status = 'idle'; b.heading = Math.PI / 2; const w = startHaul(old.id, false, 0); if (w) { R.why.push(w[0]); break; } else R.hauls++; }
      else if (R.set < nL){ b.pos = {x:p0.x, y:p0.y + 1.5 * R.set}; b.status = 'idle'; b.heading = Math.PI / 2;
        const ch = setChoices().find(c => c.spec && c.spec.pot === 'sno' && c.n === 200), w = ch ? startSet('teine', ch.spec, 0, Math.PI / 2) : ['ingen valg: ' + setChoices().map(c => c.lbl[0]).join(', ')]; if (w){ R.why.push(w[0]); R.set = nL; } else R.set++; }
    }
    // the coast guard during the first hauling, once half the lenke is aboard
    if (!R.kv && b.gop && b.gop.op === 'haul' && b.gop.done >= 100 && !(S.kv && S.kv.visit)){ R.kv = {m0:S.msgs.length, t:S.t}; kvArrive(); R.kv.sea = !!(S.kv.visit && S.kv.visit.hav); R.kv.npc = kvNpcs().length; }
    if (R.kv && !R.kv.done && !(S.kv && S.kv.visit)){ const m = S.msgs.slice(R.kv.m0).find(x => x.from === 'Kystvakta'); R.kv.done = true; R.kv.min = S.t - R.kv.t; R.kv.msg = m ? m.no : null; R.kv.log = S.kv.log[0]; }
    if (stopAt && R.hauls >= stopAt && b.gop && b.gop.op === 'haul' && b.gop.done >= 120 && S.kv && S.kv.visit) break;
    if (!simAreaReady()){ await mapNeed(b.pos, 4); await new Promise(r => setTimeout(r, 30)); continue; }
    DYN.on = false; step(); k++; if (k % 150 === 0) await new Promise(r => setTimeout(r, 0)); }
  const sp = {}; for (const x of S.hold) sp[x.sp + (x.tank ? ' levende' : x.rund ? ' død' : x.frozen ? ' klør' : ' ufryst')] = (sp[x.sp + (x.tank ? ' levende' : x.rund ? ' død' : x.frozen ? ' klør' : ' ufryst')] || 0) + Math.round(x.kg);
  const so = (S.kvHaul || []).filter(h => h.sno).map(h => h.sno), sum = f => so.reduce((a, x) => a + (x[f] || 0), 0);
  return {set:R.set, hauls:R.hauls, why:R.why, h:+((S.t - R.T0) / 60).toFixed(1), d:+((S.t - R.T0) / 1440).toFixed(1), fuel:Math.round(R.f0 - b.fuel), round:Math.round(holdTotal()), prod:Math.round(holdLoad()), tank:Math.round(tankLoad()), sp,
    sets:mySets().length, gop:b.gop ? b.gop.op : null, sort:{kept:sum('kept'), rel:sum('rel'), small:sum('small'), soft:sum('soft'), dead:sum('dead'), n:so.length}, potsAboard:pg.pots.sno, kv:R.kv,
    sorted:S.log.filter(l => /^Sortert/.test(l.no || '')).slice(-1).map(l => l.no)[0] || null}; }"""

# home by Autonav to the plant, the factory done, landed: pallets of clusters, tubs of live crab; the landing note and the quotas
KHOME = """async (plantId) => {
  const R = {}, b = S.boat, plant = portById(plantId), m0 = S.msgs.length; window.__K = null;
  await HT.run(() => S.hold.some(x => !x.frozen && !x.tank && !x.rund), 24 * 60); R.unfrozen = Math.round(S.hold.filter(x => !x.frozen && !x.tank && !x.rund).reduce((a, x) => a + x.kg, 0));
  R.round = Math.round(holdTotal()); R.prod = Math.round(holdLoad()); R.tank = Math.round(tankLoad());
  R.home = await HT.sail({...plant.p}, plant.id, 6000); R.atPlant = b.status === 'port' && b.port === plant.id; R.portWhy = portWhy(plant, b.type);
  const q = quotaState(); R.q0 = [Math.round(q.snokrabbe), Math.round(q.snoTq || 0)]; R.tankHome = Math.round(tankLoad()); R.roundHome = Math.round(holdTotal());
  let k = 0, started = false; while (k++ < 3000 && !started){ started = startLanding(false); if (!started) await HT.run(() => true, 5); }
  const L = b.land; R.started = started; R.land = L ? {kind:L.kind, n:L.n, np:L.np, kar:L.kar, pk:L.pk, lv:L.lv, h:+((L.until - L.t0) / 60).toFixed(1)} : null; R.wait = k;
  await HT.run(() => !!b.land, 3000); R.done = !b.land;
  const ls = S.lastSale || {}, LN = (ls.lines || []).filter(l => l.sp === 'snokrabbe'); R.total = Math.round(ls.total || 0); R.lott = Math.round(ls.lott || 0); R.sno = ls.sno || null; R.conf = Math.round(ls.confKg || 0);
  R.lines = LN.map(l => [SPECIES.snokrabbe.cls[l.c] ? SPECIES.snokrabbe.cls[l.c][2] : l.c, Math.round(l.kg), Math.round(l.sum)]); R.kg = Math.round(LN.reduce((a, l) => a + l.kg, 0));
  R.q1 = [Math.round(q.snokrabbe), Math.round(q.snoTq || 0)]; R.left = S.hold.length;
  R.msg = S.msgs.slice(m0).map(m => m.from + ': ' + m.no).join(' | ').slice(0, 300);
  return R; }"""

async def main():
    if not os.path.exists(os.path.join(ROOT, 'tools', 'map', 'out', 'game', 'manifest.json')):
        print('FEIL hele kysten mangler i tools/map/out/game (release.py og game.py)'); return
    if not os.environ.get('KYST_VEC_BUILT'):
        r = subprocess.run(['node', 'build.mjs'], cwd=ROOT, env=dict(os.environ, KYST_VEC='1'), capture_output=True, text=True)
        print(ok(r.returncode == 0), 'dist-vec/ bygges med vec-pakkene', r.stderr[-200:])
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 800}); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg); pg.set_default_timeout(1800000)
        if KRABBE:
            await pg.evaluate(HT)
            for i, (town, la, lo) in enumerate(KTOWNS):
                if ONLY and not any(o.lower() in town.lower() for o in ONLY): continue
                await krabbe(pg, town, la, lo, live=(i == 0))
            print('sidefeil:', errs[:5]); await b.close(); return
        for an, la, lo, name, zones in ([] if TUR else TRIPS):
            if ONLY and not any(o.lower() in name.lower() for o in ONLY): continue
            r = await pg.evaluate(PLAN, [an, la, lo]); wps = r.pop('wps', None)
            print('plan', name, json.dumps(r, ensure_ascii=False))
            print(ok(not r['land'] and r['depth'] > 5), name + ': målet er sjø med dybde', [r['depth'], r['ll']])
            print(ok(r['zone'] in zones), name + ': sonen der', [r['zone'], r['zoneName']])
            print(ok(not r['lic']['needs'] or not r['lic']['have']), name + ': lisens trengs der det skal (uten lisens i lagringen)', r['lic'])
            print(ok(len(r['clim']) > 0 and r['wx']['jan']['wind'] > r['wx']['jul']['wind']), name + ': været lener seg på klimapunktene, vinteren hardere enn sommeren', [r['clim'], r['wx']])
            print(ok(wps and r['badLegs'] == 0 and r['iceLegs'] == 0), name + ': Autonav i juli, ingen etappe over land eller inn i isen', [r.get('nm'), r.get('crowNm'), r.get('ms'), r.get('why')])
            if 'mar' in r: print(ok('why' in r['mar'] or r['mar']['iceLegs'] == 0), name + ': i mars rundt isen eller ikke i det hele tatt', [r['ice'], r['mar']])
            if not wps: continue
            reach = [t for t, f in r['fuel'].items() if f['pct'] <= 100]
            print('drivstoff', name, 'rekker (≤100 % av tanken):', reach, '| kyst15', r['fuel'].get('kyst15'), '| kyst21', r['fuel'].get('kyst21'), '| sjark', r['fuel'].get('sjark'))
            for t in (('kyst15', 'kyst21') if '-all' in sys.argv else ('kyst15',)):
                s = await pg.evaluate(SAIL, [an, wps, t]); print('seilas', name, json.dumps(s, ensure_ascii=False))
                arrived = s['atEnd'] < 1.0
                print(ok(arrived or s.get('shelter')), name + ' med ' + t + ': fram, eller til nærmeste kai i kuling', [s['h'], s['atEnd'], s.get('shelter'), s.get('port')])
                print(ok(not s['empty'] or r['fuel'][t]['pct'] > 100), name + ' med ' + t + ': tanken holder der overslaget sier den gjør det', [s['used'], s['est'], s['cap'], s['empty']])
                if arrived and not s.get('shelter'): print(ok(s['used'] <= s['est'] * 1.25), name + ' med ' + t + ': brukt mot overslaget i rutepanelet (høyst 25 % over)', [s['used'], s['est']])
        if not TUR and (not ONLY or 'storm' in ONLY):
            r = await pg.evaluate(STORM, ['kyst15', 66.0, -12.0, 20]); print('uvær kyst15 langt ute', json.dumps(r, ensure_ascii=False))
            print(ok(r['hove'] and r['moved'] < 50 and r['burnt'] > 0 and 'bi' in r['text']), 'kyst15 langt ute i 20 m/s: ligger bi (holder stedet, bruker diesel), løper ikke hundrevis av nm til kai', [r['moved'], r['burnt'], r['text']])
            print(ok(r.get('after') and r['after']['status'] == 'sailing' and r['after']['plan'] and not r['after']['hove']), 'kyst15: fortsetter ruta når det har løyet en time', r.get('after'))
            r = await pg.evaluate(STORM, ['kyst15', 62.55, 5.6, 16]); print('uvær kyst15 ved kysten', json.dumps(r, ensure_ascii=False))
            print(ok(not r['hove'] and r['returning']), 'kyst15 ved kysten i 16 m/s (over 11 i innstillingen): til nærmeste kai som før', [r['to'], r['status']])
            r = await pg.evaluate(STORM, ['snokrabbe', 62.55, 5.6, 20]); print('uvær havfartøy 20 m/s', json.dumps(r, ensure_ascii=False))
            print(ok(not r['hove'] and not r['returning'] and r['status'] == 'sailing' and r['moved'] > 1000), 'havfartøyet går videre i 20 m/s (grensen er dens egen)', [r['lim'], r['status'], r['moved']])
            r = await pg.evaluate(STORM, ['snokrabbe', 62.55, 5.6, 28]); print('uvær havfartøy 28 m/s', json.dumps(r, ensure_ascii=False))
            print(ok(r['hove'] and not r['returning']), 'havfartøyet ligger bi i 28 m/s også nær kysten, og går ikke i havn', [r['lim'], r['text']])
        if TUR or not ONLY:
            await pg.evaluate(HT)
            for town, la, lo in TOWNS:
                if ONLY and not any(o.lower() in town.lower() for o in ONLY): continue
                await tur(pg, town, la, lo)
        print('sidefeil:', errs[:5])
        await b.close()

async def krabbe(pg, town, la, lo, live=False):
    import re as _re
    r = await pg.evaluate(KPREP, [la, lo]); sheet = r.pop('sheet', '')
    print('krabbe', town, 'forberedt', json.dumps(r, ensure_ascii=False)); print('krabbe', town, 'databladet', json.dumps(sheet[-700:], ensure_ascii=False))
    pay = [int(_re.sub(r'\D', '', x)) for x in _re.findall(r'(?:bytte|innbytte): ([\d\s\u00a0\u202f]+?)\s*kr', sheet)]
    print(ok(r['btn'] and r['why'] is None and r['reg'] > 0 and 'snøkrabbetillatelse' in sheet.lower()), town + ': Båthandelen › Havfiske viser snøkrabbefartøyet med tillatelsen og kjøpsknappen på ' + r['yard'], [r['yard'], r['yardNm'], r['price'], r['reg']])
    await pics(pg, 'krabbe-' + town, 'kjop', "(() => { const btn = document.querySelector('[data-pa=\"buy\"][data-ti=\"1\"][data-k=\"snokrabbe\"]'); if (btn) btn.scrollIntoView({block:'center'}); })()")
    k = await pg.evaluate(KBUY); print('krabbe', town, 'kjøpt', json.dumps(k, ensure_ascii=False))
    print(ok(k['type'] == 'snokrabbe' and k['lic'] and k['lic']['id'] == 'krab' and k['reg'][1] == k['reg'][0] - 1 and k['q'] and k['q'][0] > 300 and (not pay or k['paid'] == pay[0])), town + ': kjøpt med snøkrabbetillatelsen fra registeret (fartøykvote %s t, tilleggskvote %s t)' % tuple(k['q'] or [None, None]), [k['lic'], k['reg'], k['paid'], pay])
    trips = [('frys', 4, 3)] + ([('lev', 2, 3)] if live else [])
    for mode, nL, soak in trips:
        tag = 'fryst' if mode == 'frys' else 'levende'
        o = await pg.evaluate(KOUT, [r['plantId'], r['shopId'], nL, mode, [74.8, 34.0]]); print('krabbe', town, tag, 'ut', json.dumps(o, ensure_ascii=False))
        print(ok(o['pots'] >= nL * 200 and o['kits'][0] >= nL and o['kits'][1] >= nL and not any(o.get('buy') or [])), town + ' (%s): %s teiner, %s blåsesett og %s tunge dregger fra %s' % (tag, o['pots'], o['kits'][0], o['kits'][1], r['shop']), o.get('buy'))
        print(ok(o['atPlant'] and o['fuelFull'] and not o['bait'] and o['baitKg'] >= nL * 100 and o['mode'] and o['live'] == (mode == 'lev')), town + ' (%s): til %s (tar fartøyet), bunkret %s l, %s kg akkar, turen for %s krabbe' % (tag, r['plant'], o['bunkered'], o['baitKg'], tag), [o.get('toPlant'), o['bait']])
        if not o.get('ground'):
            print('FEIL', town + ' (%s): fant ikke et felt der lenkene kan settes' % tag, o.get('tried')); return
        out = o['out']
        print(ok(not out.get('why') and out['atEnd'] < 1 and o['status'] in ('idle', 'fishing') and o['prov'][1] > 0), town + ' (%s): ut med Autonav til Sentralbanken %s nm unna (%s nm fra grunnlinja, %s m, %s)' % (tag, o['groundNm'], o['blNm'], o['depth'], o['zone']), [out, o['prov']])
        if mode == 'frys':
            f = await pg.evaluate(KFISH, [nL, soak, 1]); print('krabbe', town, tag, 'feltet', json.dumps(f, ensure_ascii=False))
            print(ok(f['gop'] == 'haul' and f['kv'] and f['kv']['sea'] and f['kv']['npc'] == 1), town + ': Kystvakta setter over inspektører mens den første lenka trekkes (%s døgn etter settingen)' % f['d'], f['kv'])
            await pics(pg, 'krabbe-' + town, 'feltet', "(() => { if (S.sleep) wakeUp(); PHONE.show(false); refreshAll(); })()")
        f = await pg.evaluate(KFISH, [nL, soak, 0]); print('krabbe', town, tag, 'fisket', json.dumps(f, ensure_ascii=False))
        print(ok(f['set'] == nL and f['hauls'] == nL and f['sets'] == 0 and not f['why'] and f['round'] > 500 * nL and f['potsAboard'] >= nL * 200 * 0.97), town + ' (%s): %s lenker satt, %s døgn i sjøen og trukket (%s kg rund vekt, %s timer)' % (tag, nL, soak, f['round'], f['h']), [f['sp'], f['why'], f['potsAboard']])
        so = f['sort']
        print(ok(so['kept'] > 0 and so['rel'] > 0 and so['small'] > 0 and so['rel'] < so['kept']), town + ' (%s): sortert på dekk (de tre siste trekkene): %s beholdt (%s bløte, %s døde), %s satt ut levende (%s hanner under 9,5 cm)' % (tag, so['kept'], so['soft'], so['dead'], so['rel'], so['small']), f['sorted'])
        if mode == 'frys':
            kv = f['kv'] or {}; m = kv.get('msg') or ''
            print(ok(kv.get('done') and kv.get('min', 0) >= 85 and 'Havkontroll' in m and 'alt i orden' in m and 'taket på' in m and 'registreringsmerket' in m and 'stikkprøve' in m and 'tilleggskvoten' in m and kv.get('log') and kv['log']['ok']), town + ': Kystvakta: alt i orden etter %s min (posisjonen langs lenkene, taket, merket, røktingen, kvotene og stikkprøven)' % kv.get('min'), m[:600])
            await pics(pg, 'krabbe-' + town, 'kystvakta', "(() => { if (S.sleep) wakeUp(); PHONE.show(true); PHONE.open('meld'); PHONE.render(); })()")
            print(ok(f['prod'] < f['round'] and f['tank'] == 0), town + ': fabrikken delte, kokte og frøs krabben (%s kg produkt av %s kg rund vekt)' % (f['prod'], f['round']), f['sp'])
        else:
            print(ok(f['tank'] > 0.5 * f['round']), town + ' (levende): %s kg levende i tankene av %s kg rund vekt' % (f['tank'], f['round']), f['sp'])
        h = await pg.evaluate(KHOME, r['plantId']); print('krabbe', town, tag, 'hjem', json.dumps(h, ensure_ascii=False))
        print(ok(h['atPlant'] and h['portWhy'] is None and not h['home'].get('why') and h['unfrozen'] == 0), town + ' (%s): hjem med Autonav til %s' % (tag, r['plant']), h['home'])
        L = h['land'] or {}
        if mode == 'frys':
            print(ok(h['started'] and L.get('kind') == 'pall' and not L.get('kar') and h['done'] and h['left'] == 0), town + ': losset klør på %s paller på %s timer' % (L.get('np'), L.get('h')), L)
            print(ok(h['total'] > 0 and h['conf'] == 0 and h['q1'][0] - h['q0'][0] >= 0.98 * h['roundHome'] and h['q1'][1] == h['q0'][1]), town + ': sluttseddelen %s kr; %s kg rund vekt på fartøykvoten, ingen på tilleggskvoten, ingenting inndratt' % (h['total'], h['q1'][0] - h['q0'][0]), h['lines'])
        else:
            print(ok(h['started'] and L.get('kar') and h['done'] and h['left'] == 0), town + ' (levende): losset %s kg levende krabbe i %s kar på %s timer' % (L.get('lv'), L.get('kar'), L.get('h')), L)
            print(ok(h['total'] > 0 and h['conf'] == 0 and h['q1'][1] - h['q0'][1] > 0 and any(str(x[0]).startswith('Levende') for x in h['lines'])), town + ' (levende): sluttseddelen %s kr; %s kg på tilleggskvoten, %s kg på fartøykvoten' % (h['total'], h['q1'][1] - h['q0'][1], h['q1'][0] - h['q0'][0]), h['lines'])
        await pics(pg, 'krabbe-' + town + '-' + tag, 'levert', "(() => { if (S.sleep) wakeUp(); HT.shot('salg'); const t = [...document.querySelectorAll('#phView button')].find(x => /Mine landinger/.test(x.textContent)); if (t) t.click(); })()")

async def pics(pg, town, what, js):
    # both formats: 1280×800 and 800×1280, the phone open on what the step shows
    for tag, w, h in (('liggende', 1280, 800), ('staaende', 800, 1280)):
        await pg.set_viewport_size({'width': w, 'height': h}); await pg.wait_for_timeout(300)
        if js: await pg.evaluate(js)
        await pg.wait_for_timeout(300); await pg.screenshot(path=os.path.join(OUTD, 'havtur-%s-%s-%s.png' % (town.lower().replace('ø', 'o').replace('å', 'a').replace('æ', 'ae'), what, tag)))
    await pg.set_viewport_size({'width': 1280, 'height': 800})

async def tur(pg, town, la, lo):
    r = await pg.evaluate(PREP, [la, lo]); sheet = r.pop('sheet', '')
    print('tur', town, 'forberedt', json.dumps(r, ensure_ascii=False)); print('tur', town, 'databladet', json.dumps(sheet[-900:], ensure_ascii=False))
    import re as _re
    pay = [int(_re.sub(r'\D', '', x)) for x in _re.findall(r'(?:bytte|innbytte): ([\d\s\u00a0\u202f]+?)\s*kr', sheet)]
    print(ok(r['btn'] and r['why'] is None and r['reg'] > 0 and 'tillatelse' in sheet.lower() and 'Kvotefaktor' in sheet and 'Uten hjemmel' not in sheet), town + ': Båthandelen › Havfiske viser autolineren med tillatelsen og kjøpsknappen på ' + r['yard'], [r['yard'], r['yardNm'], r['price'], r['reg']])
    print(ok(len(pay) == 2 and pay[1] == r['price'] and pay[0] < pay[1]), town + ': prisen ved knappene er skroget med tillatelsen (%s kr), som kjøpet betaler' % r['price'], pay)
    await pics(pg, town, 'kjop', "(() => { const btn = document.querySelector('[data-pa=\"buy\"][data-ti=\"1\"][data-k=\"autoliner\"]'); if (btn) btn.scrollIntoView({block:'center'}); })()")
    k = await pg.evaluate(BUY); print('tur', town, 'kjøpt', json.dumps(k, ensure_ascii=False))
    print(ok(k['type'] == 'autoliner' and k['lic'] and k['lic']['hav'] and k['lic']['id'] == 'konv' and k['reg'][1] == k['reg'][0] - 1 and 'Fiskeridirektoratet' in k['msg'] and k['paid'] == pay[0] if pay else False), town + ': autolineren kjøpt med konvensjonell havfisketillatelse fra registeret, for mellomlegget ved knappen', [k['lic'], k['q'], k['reg'], k['paid']])
    o = await pg.evaluate(OUT, [la, lo, r['plantId']]); print('tur', town, 'ut', json.dumps(o, ensure_ascii=False))
    print(ok(o['atPlant'] and o['bunkered'] > 0 and o['fuelFull'] and o['bunkerH'] < 8 and not any(o['bait']) and o['lenker'] == 8), town + ': til ' + r['plant'] + ' (tar konvensjonelt), bunkret %s l på %s timer og kjøpte agn i tonn' % (o['bunkered'], o['bunkerH']), [o.get('toPlant'), o['baitKg']])
    if not o.get('ground'):
        print('FEIL', town + ': fant ikke et felt der lina kan settes', o.get('tried')); return
    out = o['out']
    print(ok(not out.get('why') and out['atEnd'] < 1 and o['status'] in ('idle', 'fishing') and o['prov'][1] > 0), town + ': ut med Autonav til feltet %s nm unna (%s nm fra grunnlinja, %s m, %s), proviant ved avgang' % (o['groundNm'], o['blNm'], o['depth'], o['zone']), [out, o['prov'], 'hoppet over (nm, regel, sone):', o.get('skip')])
    f = await pg.evaluate(FISH, 2); print('tur', town, 'feltet', json.dumps(f, ensure_ascii=False))
    print(ok(all('driver' not in x for x in f['sleep']) and (not f['slNote'] or 'driver' not in f['slNote'])), town + ': sovner du om bord, tar vakta på broa over og lagene arbeider videre (ikke «driver»)', [f['sleep'], f['slNote']])
    await pics(pg, town, 'feltet', "(() => { if (S.sleep) wakeUp(); PHONE.show(false); refreshAll(); })()")
    f = await pg.evaluate(FISH, 0); print('tur', town, 'fisket', json.dumps(f, ensure_ascii=False))
    print(ok(f['set'] == 4 and f['hauls'] == 2 and f['sets'] == 0 and not f['why'] and f['round'] > 1000), town + ': fire lenker satt og trukket (%s kg rund vekt, %s timer)' % (f['round'], f['h']), [f['sp'], f['why']])
    print(ok(f['frozen'] > 0.5 * f['round'] and f['prod'] < f['round']), town + ': fabrikken sløyde og frøs %s av %s kg; lasten er %s kg produkt' % (f['frozen'], f['round'], f['prod']))
    h = await pg.evaluate(HOME, r['plantId']); print('tur', town, 'hjem', json.dumps(h, ensure_ascii=False))
    print(ok(h['atPlant'] and h['portWhy'] is None and not h['home'].get('why')), town + ': hjem med Autonav til ' + r['plant'], h['home'])
    print(ok(h['started'] and h['land'] and h['land']['kind'] == 'pall' and h['done'] and h['left'] == 0), town + ': losset på %s paller (%s t produkt) på %s timer' % (h['land'] and h['land']['n'], h['land'] and round((h['land']['pk'] or 0) / 1000, 1), h['land'] and h['land']['h']))
    print(ok(h['total'] > 0 and abs(h['kg'] - h['round']) < 0.02 * h['round'] + 5 and h['fz'] and h['dl'] and h['dl'][0] == 15), town + ': sluttseddelen på %s kg rund vekt, fryst, %s kr (inndratt %s kg), lott etter § 6 (%s mann, %s)' % (h['kg'], h['total'], h['conf'], h['dl'] and h['dl'][0], h['dl'] and h['dl'][1]), h['lines'])
    await pics(pg, town, 'levert', "(() => { if (S.sleep) wakeUp(); HT.shot('salg'); const t = [...document.querySelectorAll('#phView button')].find(x => /Mine landinger/.test(x.textContent)); if (t) t.click(); })()")
asyncio.run(main())
