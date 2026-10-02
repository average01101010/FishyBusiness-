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
TRIP = """(w) => { S.mult = 0; """ + SEED + """; S.tut = 0; S.settings.autoOn = false; S.t = Math.round((Date.UTC(2028, 2, 10, 6) - EPOCH) / 6e4);
  const f = PORTS[0].p, wps = w.map((q, i) => ({x:q.x, y:q.y, port:null, fish:i === w.length - 1 ? 2 : 0}));
  w.slice(0, -1).reverse().forEach(q => wps.push({x:q.x, y:q.y, port:null, fish:0})); wps.push({x:f.x, y:f.y, port:'finnsnes', fish:0});
  S.plan = {wps, idx:0, speed:8}; return depart(); }"""
OUT = "({t:S.t, st:S.boat.status, port:S.boat.port, pos:[+S.boat.pos.x.toFixed(6), +S.boat.pos.y.toFixed(6)], hold:+holdTotal().toFixed(3), cash:Math.round(S.cash), trail:S.trail.length, left:CATCH_LEFT, miss:MAPD.miss, log:S.log.slice(-4).map(l => hm(l.t / 60) + ' ' + l.no)})"

async def run(p, hold):
    pg = await (await p.new_context(viewport={'width': 900, 'height': 700})).new_page()
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    await boot(pg)
    await pg.evaluate('S.mult = 0')
    pk = await pg.evaluate("(([e, f]) => { const at = q => mapPacksIn('sim', q.x, q.y, q.x, q.y)[0].file; return {file:at(e), other:at(f)}; })", [R[-1], R[0]])
    R0 = {'pack': pk}
    gate = asyncio.Event()
    if hold:
        async def handler(route):
            await gate.wait(); await route.continue_()
        await pg.route('**/map/' + pk['file'], handler)
        await pg.evaluate("(f => mapDrop(MAPD.packs.find(p => p.file === f)))", pk['file'])
    await pg.evaluate(TRIP, R)
    await pg.evaluate("catchUp(10 * 3600e3 / GAME_RATE)")   # ten game hours: out, two hours of fishing, home
    R0['first'] = await pg.evaluate(OUT)
    if hold:
        await pg.wait_for_timeout(1500)
        R0['held'] = await pg.evaluate(OUT)   # the clock stands while the pack is held back
        R0['ready'] = await pg.evaluate("mapReadyAt(S.boat.pos, MAPD.simR)")
        gate.set()
        await pg.wait_for_function("CATCH_LEFT === 0", timeout=60000)
    R0['end'] = await pg.evaluate(OUT)
    R0['errs'] = errs
    return R0

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        a = await run(b, False); h = await run(b, True)
        print(json.dumps({'all': a, 'held': h}))
        print(ok(a['pack']['file'] != a['pack']['other']), 'the ground and Finnsnes lie in two different sim packs')
        print(ok(h['first']['left'] > 0 and h['held']['t'] == h['first']['t'] and h['held']['left'] == h['first']['left'] and not h['ready']), 'with the ground\'s pack held back the clock stops before the boat comes within reach of it, and stands while it is away')
        print(ok(h['end']['left'] == 0 and h['end']['t'] == a['end']['t']), 'when the pack comes, the rest of the ten hours is played')
        e1, e2 = dict(a['end']), dict(h['end'])
        print(ok(all(e1[k] == e2[k] for k in ['t', 'st', 'port', 'pos', 'hold', 'cash', 'trail', 'log'])), 'and the trip ends exactly as the one with every pack at hand (time, place, catch, cash)')
        print(ok(a['end']['miss'] == 0 and h['end']['miss'] == 0), 'nothing read a block whose pack was not in')
        print('errors:', (a['errs'] + h['errs'])[:4]); await b.close()
asyncio.run(main())
