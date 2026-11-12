from _env import GAME, ROUTES, boot
# The map data from map/ (01b-mapdata.js, phase K3 of the coast plan): the simulation's clock waits while a vessel's waters are not
# loaded, nothing reads a pack that is not in, and a trip played with a pack held back ends exactly as one with everything at hand.
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'
R = json.load(open(ROUTES))['3']   # Finnsnes north to Malangsgapet: the end is in the 50 km tile north of Finnsnes'
# the simulation draws from a PRNG of its own, seeded just before the trip, so what the page draws for itself meanwhile (the
# panels, the sounder) does not shift it
SEED = """(() => { let a = 20261002; const R = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const st = step; step = function(){ const o = Math.random; Math.random = R; try { return st(); } finally { Math.random = o; } }; })()"""
# (and the game's own seed is fixed: a new game draws S.qseed at random without the world's clock (05-vessels.js newState), and the
# spawning stock of cod, haddock and saithe for the year (03d-quota.js stockF, ssbAt) is keyed on it, so two new games fished the
# same ground with different densities: 61,2 against 69,8 kg in the regression of 24.10.2026, whichever pack was held back)
TRIP = """(w) => { S.mult = 0; S.qseed = 20261002; """ + SEED + """; S.tut = 0; S.settings.autoOn = false; S.t = Math.round((Date.UTC(2028, 2, 10, 6) - EPOCH) / 6e4);
  const f = PORTS[0].p, wps = w.map((q, i) => ({x:q.x, y:q.y, port:null, fish:i === w.length - 1 ? 2 : 0}));
  w.slice(0, -1).reverse().forEach(q => wps.push({x:q.x, y:q.y, port:null, fish:0})); wps.push({x:f.x, y:f.y, port:'finnsnes', fish:0});
  S.plan = {wps, idx:0, speed:8}; return depart(); }"""
OUT = "({t:S.t, st:S.boat.status, port:S.boat.port, pos:[+S.boat.pos.x.toFixed(6), +S.boat.pos.y.toFixed(6)], hold:+holdTotal().toFixed(3), cash:Math.round(S.cash), trail:S.trail.length, left:CATCH_LEFT, miss:MAPD.miss, log:S.log.slice(-4).map(l => hm(l.t / 60) + ' ' + l.no)})"

async def run(p, hold):
    pg = await (await p.new_context(viewport={'width': 900, 'height': 700})).new_page()
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    await boot(pg)
    # the game's own tick is held for the whole trip (TAB.held): it played minutes of wall-clock time between the test's steps, and
    # after the pack came it played the rest itself, so the trip ended a minute late or with another catch now and then (68.4 against
    # 61.69 kg; docs/BACKLOG.md 10.6, Ø2 05.11.2026). The test plays what is left the way tick() does (playMinutes(n, true))
    await pg.evaluate('S.mult = 0; TAB.held = true')
    pk = await pg.evaluate("(([e, f]) => { const at = q => mapPacksIn('sim', q.x, q.y, q.x, q.y)[0].file; return {file:at(e), other:at(f)}; })", [R[-1], R[0]])
    R0 = {'pack': pk}
    gate = asyncio.Event()
    if hold:
        async def handler(route):
            await gate.wait(); await route.continue_()
        await pg.route('**/map/' + pk['file'], handler)
        await pg.evaluate("(f => mapDrop(MAPD.packs.find(p => p.file === f)))", pk['file'])
    await pg.evaluate(TRIP, R)
    await pg.evaluate("DYN.on = false; catchUp(10 * 3600e3 / GAME_RATE)")   # ten game hours: out, two hours of fishing, home (caught up as the tick does it, the manoeuvring model off)
    R0['first'] = await pg.evaluate(OUT)
    if hold:
        # (the game's own loop is let go only here, where the check is that tick() itself plays nothing while the pack is away; held
        # the whole time, the check would hold by itself. Ø2 05.11.2026)
        await pg.evaluate("TAB.held = false; lastWall = Date.now()")
        await pg.wait_for_timeout(1500)
        R0['held'] = await pg.evaluate("(() => { TAB.held = true; return " + OUT + "; })()")   # the clock stands while the pack is held back
        R0['ready'] = await pg.evaluate("mapReadyAt(S.boat.pos, MAPD.simR)")
        gate.set()
        await pg.wait_for_function("mapReadyAt(S.boat.pos, MAPD.simR)", timeout=60000)
        for _ in range(100):
            left = await pg.evaluate("(() => { if (CATCH_LEFT > 0 && simAreaReady()){ DYN.on = false; const n = Math.min(CATCH_LEFT, 3000); CATCH_LEFT -= n; playMinutes(n, true); } return CATCH_LEFT; })()")
            if not left: break
            await pg.wait_for_timeout(300)
    R0['end'] = await pg.evaluate(OUT)
    R0['errs'] = errs
    return R0

# An old page and a new release (Ø13 K3, kartrelease-o13.md kap. 7 punkt 5): the server's manifest no longer lists a pack the page
# knows, and the pack gives 404 (deploy.yml removes what the new manifest does not list). The page should see that at once and put up
# «En ny versjon av spillet er klar», not ask five times and then fail with no word (before K3 the bar came only with the ten-minute
# check of version.json)
async def stale(p):
    pg = await (await p.new_context(viewport={'width': 900, 'height': 700})).new_page()
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    await boot(pg)
    # a pack the page has not loaded (and not kept in IndexedDB, which mapFetch asks first): dropped and forgotten if all are in
    pk = await pg.evaluate("""(async () => { let q = MAPD.packs.find(p => ['sim', 'view', 'chart', 'far'].includes(p.kind) && !p.buf && !p.load) || MAPD.packs.find(p => p.kind === 'sim');
      mapDrop(q); await idbDo('readwrite', s => s.delete(q.hash)); return {file:q.file, kind:q.kind}; })()""")
    gone = pk['file']
    async def man(route):
        r = await route.fetch(); j = await r.json(); j['packs'] = [q for q in j['packs'] if q['file'] != gone]
        await route.fulfill(response=r, json=j)
    await pg.route('**/map/manifest.json*', man)
    await pg.route('**/map/' + gone, lambda route: route.fulfill(status=404, body='not found'))
    await pg.evaluate("document.getElementById('updBar') && document.getElementById('updBar').remove()")
    r = await pg.evaluate("""(async f => { const pk = MAPD.packs.find(p => p.file === f), t0 = performance.now(); let err = '';
      try { await mapLoad(pk); } catch (e){ err = String(e.message || e); }
      return {err, ms:Math.round(performance.now() - t0), bar:!!document.getElementById('updBar'), stale:!!MAPD.stale}; })""", gone)
    r['errs'] = errs; r['file'] = gone
    return r

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        a = await run(b, False); h = await run(b, True); st = await stale(b)
        print(json.dumps({'all': a, 'held': h, 'stale': st}))
        print(ok(a['pack']['file'] != a['pack']['other']), 'the ground and Finnsnes lie in two different sim packs')
        print(ok(h['first']['left'] > 0 and h['held']['t'] == h['first']['t'] and h['held']['left'] == h['first']['left'] and not h['ready']), 'with the ground\'s pack held back the clock stops before the boat comes within reach of it, and stands while it is away')
        print(ok(h['end']['left'] == 0 and h['end']['t'] == a['end']['t']), 'when the pack comes, the rest of the ten hours is played')
        e1, e2 = dict(a['end']), dict(h['end'])
        print(ok(all(e1[k] == e2[k] for k in ['t', 'st', 'port', 'pos', 'hold', 'cash', 'trail', 'log'])), 'and the trip ends exactly as the one with every pack at hand (time, place, catch, cash)')
        print(ok(a['end']['miss'] == 0 and h['end']['miss'] == 0), 'nothing read a block whose pack was not in')
        print(ok(st['stale'] and st['bar'] and st['ms'] < 3000 and 'gone' in st['err']), 'a pack gone from a new manifest (404): the page sees it at once and the update bar comes (%d ms, %s)' % (st['ms'], st['err'][:60]))
        print('errors:', (a['errs'] + h['errs'] + st['errs'])[:4]); await b.close()
asyncio.run(main())
