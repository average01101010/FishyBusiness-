"""Pictures of the shore before and after the fine ground along the sea (Ø13 K1, the layer 'fin'; docs/planer/kartrelease-o13.md): the
same places, the same hour and sky (seed, noon in June, the sky held clear), with the layer («med») and with «#fin0» in the address
(«uten»), from the boat close under the land and from the harbour, in 1280x800 and 800x1280. It also prints what the layer costs
where the boat lies: the fine blocks unpacked, MAPD.bytes and the JS memory. No checks but the page errors and the GL errors; the
pictures are for the eye.
  KYST_DIST=<dist> python3 tests/finshot.py [place ...]          (husoy finnsnes bovaer vangshamn; K2 adds the coast's)
Pictures: tests/out/fin_<place>_<baat|kai>_<liggende|staaende>_<med|uten>.png"""
from _env import GAME, boot
import asyncio, base64, json, sys, time
from playwright.async_api import async_playwright

# a port of the game by its id, or lat, lon
PLACES = {'husoy': 'husoy', 'finnsnes': 'finnsnes', 'bovaer': (69.42, 17.175), 'vangshamn': 'vangshamn'}
AT = """(w) => { if (typeof w === 'string'){ const pt = portById(w); return {x:pt.p.x, y:pt.p.y}; } return P(w[0], w[1]); }"""
# a sea point d km (or a little more) off the land near c, the nearest to c; and the direction (grid, radians from north, clockwise)
# of the nearest land from it
SEA = """([c, d]) => { let best = null, bd = 1e9; for (let j = -40; j <= 40; j++) for (let i = -40; i <= 40; i++){ const q = {x:c.x + i * 0.025, y:c.y + j * 0.025};
  try { if (isLand(q)) continue; const cd = coastDist(q); if (cd < d || cd > d + 0.05) continue; } catch (e){ continue; }
  const dd = Math.hypot(i, j); if (dd < bd){ bd = dd; best = q; } } return best; }"""
AIM = """(q) => { for (let r = 0.02; r <= 1; r += 0.01) for (let k = 0; k < 72; k++){ const a = k / 72 * 2 * Math.PI; if (isLand({x:q.x + Math.sin(a) * r, y:q.y - Math.cos(a) * r})) return a; } return 0; }"""
SHAPES = (('liggende', 1280, 800), ('staaende', 800, 1280))

async def run(tag, extra, names):
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-compositing', '--enable-precise-memory-info'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 800})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + extra)
        await pg.evaluate("() => { S.cash = 1e6; S.t = Math.round((Date.UTC(2027, 5, 18, 0) + 12 * 3.6e6 - EPOCH) / 6e4); window.cloudAt = () => 0; window.precipAt = () => 0; if (!G3.isActive()) G3.show(true); }")
        await pg.wait_for_function("G3.isActive()", timeout=60000)
        for name in names:
            c = await pg.evaluate(AT, PLACES[name]); await pg.evaluate("(q) => mapNeed(q, MAPD.simR)", c)
            for view, d, dist, pitch in (('baat', 0.07, 55, 0.16), ('kai', 0.16, 150, 0.3)):
                t0 = time.time(); q = await pg.evaluate(SEA, [c, d])
                if not q: print('ingen sjø', d, 'km fra land ved', name); continue
                await pg.evaluate("""(q) => { const b = S.boat; b.status = 'idle'; b.port = null; b.pos = {x:q.x, y:q.y}; S.plan = null; S.draft = []; b.v = 0; }""", q)
                a = await pg.evaluate(AIM, q)
                try:
                    await pg.wait_for_function("""(q) => { const D = G3._debug, N = D.NEARM, F = D.FINEM; return N && !N.stale && F && !F.stale && Math.abs(F.cx - q.x * 1000) < 300 && Math.abs(F.cz - q.y * 1000) < 300 && Math.abs(N.cx - q.x * 1000) < 2500 && Math.abs(N.cz - q.y * 1000) < 2500 && mapViewIn(q); }""", arg=q, timeout=240000)
                    await pg.wait_for_timeout(5000)   # a fine pack that came after the meshes makes them stale: wait for the second round too
                    await pg.wait_for_function("""() => { const D = G3._debug; return D.NEARM && !D.NEARM.stale && D.FINEM && !D.FINEM.stale; }""", timeout=240000)
                except Exception as e:
                    print('   (venter fortsatt:', name, str(e)[:80], ')')
                await pg.wait_for_timeout(9000)   # the chunks with the trees and the houses, a few a frame
                for shape, w, h in SHAPES:
                    await pg.set_viewport_size({'width': w, 'height': h})
                    await pg.evaluate("([a, dist, pitch]) => { const c = G3._debug.cam; c.helm = false; c.dist = dist; c.pitch = pitch; c.yaw = a - G3._debug.bv.head; }", [a, dist, pitch])
                    await pg.wait_for_timeout(4000)
                    fn = f'fin_{name}_{view}_{shape}_{tag}.png'
                    url = await pg.evaluate("() => new Promise(res => requestAnimationFrame(() => res(document.getElementById('gl').toDataURL('image/png'))))")
                    open(fn, 'wb').write(base64.b64decode(url.split(',', 1)[1])); print(fn, round(time.time() - t0), 's')
                await pg.set_viewport_size({'width': 1280, 'height': 800})
            m = await pg.evaluate("""() => { const L = MAPD.L.fin; let nb = 0, by = 0; if (L) for (const [k, a] of MAPD.blk) if (k % 64 === L.id){ nb++; by += a.byteLength; }
              return {finBlokker:nb, finMB:+(by / 1e6).toFixed(2), mapdMB:+(MAPD.bytes / 1e6).toFixed(1), jsMB:performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null,
                finPakker:[...MAPD.byTile.values()].filter(pk => pk.kind === 'fin' && pk.buf).length, miss:MAPD.miss}; }""")
            print('  ', name, tag, json.dumps(m))
            gl = await pg.evaluate("G3._debug.glErr()")
            if gl: print('GL-feil ved', name, gl)
        print('sidefeil:', errs[:3])
        await b.close()

async def main():
    names = [n for n in sys.argv[1:] if n in PLACES] or list(PLACES)
    for tag, extra in (('med', ''), ('uten', '#fin0')):
        if tag in sys.argv[1:] or not ({'med', 'uten'} & set(sys.argv[1:])): await run(tag, extra, names)

asyncio.run(main())
