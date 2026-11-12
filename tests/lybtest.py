# Longyearbyen as a harbour (H1b R7, V4 B of docs/planer/havsteget-h1b-rammen.md, 05.11.2026): no plant, a yard (fuel) and a tackle shop
# placed by docs/handelssteder.md, a berth in the harbour by quayFit, and the crew flying to and from Tromsø (core/04-crew.js FLY).
#  - the yard and the shop: named after the place, 1.5 km or more apart and from every other place, on water, at a quay with land behind
#  - what they offer: the yard fuel and boats, the shop gear, nobody takes the catch; the nearest plant is on the mainland
#  - the harbour: a free berth from the packs for a sjark and a 15 m boat
#  - a trip from Tromsø: Autonav to the yard in Longyearbyen, the boat sails there and moors (catching up on the shared clock)
#  - the crew change: one hand signs off and flies home (the ticket booked), one signs on and is aboard when the plane is in, not before
# It builds dist-vec/ itself with the vec packs (KYST_VEC=1), as havntest, and needs the whole coast in tools/map/out/game.
import asyncio, json, os, subprocess
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.environ['KYST_DIST'] = os.path.join(ROOT, 'dist-vec')
from playwright.async_api import async_playwright
from _env import *
ok = lambda c: 'OK  ' if c else 'FEIL'

PLACES = """async () => {
  await mapNeed(P(78.228, 15.60), 8);
  const R = {}, L = PORTS.filter(pt => /^Longyearbyen/.test(pt.name));
  R.names = L.map(pt => pt.name); R.kinds = L.map(pt => pt.sted || (pt.mottak ? 'mottak' : ''));
  R.serv = L.map(pt => portServices(pt)); R.fly = L.map(pt => flyPort(pt));
  R.gap = L.length === 2 ? Math.round(dist(L[0].p, L[1].p) * 1000) : null;
  // every other place (plants, shops, yards, rorbuer) at least 1.5 km off
  R.near = Math.round(Math.min(...PORTS.filter(q => !L.includes(q)).map(q => Math.min(...L.map(pt => dist(pt.p, q.p))))) * 1000);
  R.wet = L.map(pt => !isLand(pt.p)); R.depth = L.map(pt => Math.round(depthF(pt.p) * 10) / 10);
  const pm = plantsNear(L[0].p, 1)[0]; R.plant = pm && [pm.pt.name, Math.round(pm.d)];
  R.yardNear = placesNear(P(78.22, 15.6), 'verft', 1).map(x => x.pt.name)[0]; R.shopNear = placesNear(P(78.22, 15.6), 'butikk', 1).map(x => x.pt.name)[0];
  return R; }"""

HAVN = """async () => {
  const p = P(78.228, 15.60), R = {}; await mapNeed(p, 6);
  let H = [];
  for (let k = 0; k < 120; k++){ vecWant(p.x - 3, p.y - 3, p.x + 3, p.y + 3); vecTilesIn((p.x - 3) * 1000, (p.y - 3) * 1000, (p.x + 3) * 1000, (p.y + 3) * 1000); coastIndexAt(p, true); H = havnsNear(p, 4);
    if (H.length && H.some(h => havnBerths(h, 'sjark', S.cur, 1).length)) break; await new Promise(r => setTimeout(r, 250)); }
  R.harbours = H.length; R.names = H.map(h => havnNm(h));
  const one = type => { for (const h of H){ const L = havnBerths(h, type, S.cur, 3); if (L.length) return {name:havnNm(h), kind:L[0].kind, depth:L[0].face && L[0].face.depth}; } return null; };
  R.sjark = one('sjark'); R.kyst15 = one('kyst15');
  return R; }"""

TRIP = """async () => {
  const R = {}, b = S.boat; S.tut = 0; S.cash = 2e6; S.lic = null;
  const yard = PORTS.find(pt => pt.name === 'Longyearbyen verft'), tos = plantsNear(P(69.648, 18.962), 1)[0].pt; await mapNeed(tos.p, 6);
  b.type = 'kyst15'; applyVessel(); b.fuel = BOAT.fuelCap || b.fuel; b.status = 'port'; b.port = tos.id; b.pos = {...tos.p};
  R.from = tos.name;
  // two hands aboard before the trip
  S.crew = []; for (let i = 0; i < 2; i++){ const c = genCrew(); c.hiredT = S.t; c.earn = []; S.crew.push(c); }
  const t0 = performance.now(); let route = null; try { route = await leiaRoute({...tos.p}, yard.p, tos.id, yard.id); } catch (e){ route = {why:[String(e)]}; }
  R.routeMs = Math.round(performance.now() - t0); R.route = route && route.wps ? route.wps.length : (route && route.why ? route.why[0] : null);
  if (!route || !route.wps) return R;
  R.km = Math.round(route.wps.reduce((a, w, i) => a + (i ? dist(route.wps[i - 1], w) : dist(b.pos, w)), 0));
  // she sails it on the shared clock, as when the game catches up (a sjark or 15 m boat at 9 knots: ~2 days)
  S.plan = {wps:route.wps.map(w => ({...w})), idx:0, speed:9}; S.plan.wps[S.plan.wps.length - 1].port = yard.id; depart();
  // (a gale on the way sends her by Autonav to the nearest quay, shelterReturn: off Svalbard that is Longyearbyen now; the search is waited for)
  const T0 = S.t; let n = 0;
  while (b.status !== 'port' && n < 8000){
    if (!simAreaReady()){ await mapNeed(b.pos, 4); await new Promise(r => setTimeout(r, 50)); continue; }
    DYN.on = false; step(); n++; if (b.fuel <= 0) b.fuel = 1000;
    if (n % 200 === 0) await new Promise(r => setTimeout(r, 0));
    if (b.status === 'idle' && !S.plan){ for (let k = 0; k < 200 && (S.shelter || sailWaiting()) && !S.plan; k++) await new Promise(r => setTimeout(r, 150)); if (!S.plan){ R.stuck = S.log.slice(-4).map(l => l.no || l); break; } } }
  R.min = S.t - T0; R.status = b.status; R.port = b.port; R.at = flyPort(portById(b.port)); R.atName = (portById(b.port) || {}).name;
  R.serv = portServices(portById(b.port)); R.shelter = S.log.some(l => /nærmeste kai, Longyearbyen/.test(l.no || l));
  // the crew change: one signs off here and flies home, one from the exchange signs on and flies up
  const c0 = S.cash, out = S.crew[0]; R.fly = flyPort(portById(b.port)); R.ticket = flyKr();
  const ev = (a, d) => PHONE.dact('mannskap', a, d);
  ev('cfire', {id:out.id}); R.outGone = !S.crew.includes(out); R.paidOut = Math.round(c0 - S.cash);
  borsTick(S.t / 60); if (!S.bors.pool.length){ const c = genCrew(); c.until = S.t + 2880; S.bors.pool.push(c); }
  // (full-time: a part-timer on his day ashore is rightly not aboard after the flight either, and about one in nine drawn is one (10.8 %, genCrew); seen 12.11.2026
  // as «[False, False]» when the draws moved, 3 of 40 in a probe, every one a part-timer on a day off)
  const cand = S.bors.pool[0], c1 = S.cash; cand.bi = false; cand.biDays = null; ev('bhire', {id:cand.id});
  R.hired = S.crew.includes(cand); R.paidIn = Math.round(c1 - S.cash); R.flying = !!cand.fly; R.aboardAtOnce = crewAboard().includes(cand);
  // an hour before the plane is in: still not aboard; the hour after: aboard
  for (let i = 0; i < 2; i++){ S.t += 60; crewTick(S.t / 60); } R.aboard2h = crewAboard().includes(cand);
  for (let i = 0; i < 3; i++){ S.t += 60; crewTick(S.t / 60); } R.aboard5h = crewAboard().includes(cand); R.flyLeft = !!cand.fly;
  R.log = S.log.slice(-6).map(l => l.no || l[1] || l);
  return R; }"""

async def main():
    if not os.path.exists(os.path.join(ROOT, 'tools', 'map', 'out', 'game', 'manifest.json')):
        print(ok(False), 'hele kysten i tools/map/out/game (python3 tools/map/release.py og game.py)'); return
    if os.environ.get('KYST_VEC_BUILT'): print(ok(True), 'dist-vec/ bygd av run.py før testene')
    else:
        r = subprocess.run(['node', 'build.mjs'], cwd=ROOT, env=dict(os.environ, KYST_VEC='1'), capture_output=True, text=True)
        print(ok(r.returncode == 0), 'dist-vec/ bygges med vec-pakkene', r.stderr[-200:])
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await (await b.new_context(viewport={'width': 1000, 'height': 800})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg); pg.set_default_timeout(600000)
        r = await pg.evaluate(PLACES); print('steder', json.dumps(r, ensure_ascii=False))
        print(ok(sorted(r['names']) == ['Longyearbyen utstyrsbutikk', 'Longyearbyen verft']), 'Longyearbyen har verft og utstyrsbutikk, navngitt etter stedet', r['names'])
        print(ok(r['gap'] and r['gap'] >= 1500 and r['near'] >= 1500), 'minst 1,5 km mellom dem og til alle andre steder', [r['gap'], r['near']])
        sv = r['serv']; print(ok(all(not s.get('mottak') for s in sv) and any(s.get('verft') and s.get('bunker') for s in sv) and any(s.get('butikk') for s in sv)), 'ikke mottak; diesel og båter på verftet, utstyr i butikken', sv)
        print(ok(all(r['wet']) and all(d >= 2 for d in r['depth'])), 'havnepunktene på vann med dybde', r['depth'])
        print(ok(all(r['fly']) and r['plant'] and r['plant'][1] > 500), 'flyhavn; nærmeste mottak er på fastlandet', r['plant'])
        print(ok(r['yardNear'] == 'Longyearbyen verft' and r['shopNear'] == 'Longyearbyen utstyrsbutikk'), 'nærmeste verft og butikk fra Adventfjorden', [r['yardNear'], r['shopNear']])
        r = await pg.evaluate(HAVN); print('havn', json.dumps(r, ensure_ascii=False))
        print(ok(r['harbours'] > 0 and r['sjark'] and r['kyst15']), 'havna i Longyearbyen har ledig plass for sjark og 15 m-båt', [r['sjark'], r['kyst15']])
        r = await pg.evaluate(TRIP); print('tur', json.dumps(r, ensure_ascii=False))
        print(ok(isinstance(r.get('route'), int)), 'Autonav fra ' + str(r.get('from')) + ' til Longyearbyen verft', [r.get('route'), r.get('km'), r.get('routeMs')])
        print(ok(r.get('at')), 'båten seiler dit og fortøyer i Longyearbyen (i kuling: nærmeste kai der)', [r.get('min'), r.get('atName'), r.get('shelter'), r.get('stuck')])
        print(ok(r.get('outGone') and r.get('paidOut', 0) >= r.get('ticket', 0) > 0), 'en mønstrer av og flyr hjem; billetten er bokført', [r.get('paidOut'), r.get('ticket')])
        print(ok(r.get('hired') and r.get('flying') and r.get('paidIn') == r.get('ticket') and not r.get('aboardAtOnce')), 'en mønstrer på og flyr opp fra Tromsø; ikke om bord før flyet er inne', [r.get('paidIn'), r.get('flying'), r.get('aboardAtOnce')])
        print(ok(not r.get('aboard2h') and r.get('aboard5h') and not r.get('flyLeft')), 'om bord etter reisetida (3 t 25 min), ikke før', [r.get('aboard2h'), r.get('aboard5h')])
        print('logg', r.get('log'))
        print('sidefeil:', errs[:5])
        await b.close()
asyncio.run(main())
