"""Pictures of the land from the sea, for comparing the ground before and after a change to the terrain or the land cover (G1-G9 of
docs/planer/grafikk-natur-og-miljo.md). The boat is moved to a sea point near each place, the camera turned towards the side with the
most land within 1-4 km, and the canvas taken from low over the sea and from a drone, in the season asked for. No checks but the page
errors and the GL errors; the pictures are for the eye.
  KYST_DIST=<dist> python3 tests/terrshot.py [tag] [season: summer|autumn|winter|spring] [place ...] [close] [clear|grey|broken] [eve]
(close: also a near view, the boat 80-500 m off the land and the camera high behind her; clear or grey: the sky held clear, or
full grey with a little rain, by cloudAt and precipAt)
Pictures: tests/out/terr_<tag>_<season>_<place>_<low|high|close>.png"""
from _env import GAME, boot
import asyncio, base64, json, os, sys, time
from playwright.async_api import async_playwright

# lat, lon near the place (a sea point is looked for round it)
PLACES = {'finnsnes': (69.235, 17.97), 'gibostad': (69.35, 18.08), 'bergsfjord': (69.42, 17.32), 'senjahopen': (69.49, 17.53),
          'gryllefjord': (69.37, 17.07), 'botnhamn': (69.53, 17.98), 'stonglandet': (69.12, 17.27), 'torsken': (69.33, 17.1),
          # along the coast (a build with the whole coast, tools/map/out/game): south, middle and north
          'bergen': (60.42, 5.22), 'bodo': (67.29, 14.33), 'reine': (67.93, 13.09), 'hammerfest': (70.67, 23.66), 'hvaler': (59.05, 11.0)}
SEASON = {'summer': (2027, 6, 18, 12), 'autumn': (2027, 8, 24, 12), 'winter': (2027, 2, 10, 12), 'spring': (2027, 4, 20, 12)}
SEA = """([la, lo, dmin]) => { const c = P(la, lo); for (let r = 0; r <= 60; r++) for (let a = 0; a < Math.max(1, r * 6); a++){
  const t = a / Math.max(1, r * 6) * 2 * Math.PI, q = {x:c.x + Math.cos(t) * r * 0.1, y:c.y + Math.sin(t) * r * 0.1};
  if (!isLandFar(q) && coastDistFar(q) >= dmin && coastDistFar(q) <= dmin + 0.4) return q; } return null; }"""
# the direction (grid, radians from north, clockwise) with the most land 1-4 km out, and the camera's yaw for it (the eye stands
# behind the boat at head + yaw; it looks along (sin, -cos) of that)
AIM = """(q) => { let best = 0, bd = 0; for (let k = 0; k < 72; k++){ const a = k / 72 * 2 * Math.PI; let s = 0;
  for (let r = 1; r <= 4; r += 0.25) if (isLandFar({x:q.x + Math.sin(a) * r, y:q.y - Math.cos(a) * r})) s++;
  if (s > best){ best = s; bd = a; } } return bd; }"""


CLOSE = False
async def main():
    global CLOSE
    tag = sys.argv[1] if len(sys.argv) > 1 else 'x'; season = sys.argv[2] if len(sys.argv) > 2 else 'summer'
    WX = {'clear': (0.0, 0.0), 'grey': (0.95, 0.3), 'broken': (0.5, 0.0)}; wx = next((WX[n] for n in sys.argv[3:] if n in WX), None)
    names = [n for n in sys.argv[3:] if n not in ('close', 'eve') and n not in WX] or list(PLACES); CLOSE = 'close' in sys.argv[3:]
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-compositing'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 800})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + os.environ.get('KYST_HASH', ''))   # KYST_HASH: more of the address, e.g. '#water0' or '#air0'
        y, mo, d, h = SEASON[season]
        if 'eve' in sys.argv[3:]: h = 16.6   # the evening, the sun low (autumn: sunset in the north)
        await pg.evaluate("([y, mo, d, h]) => { S.cash = 1e6; S.t = Math.round((Date.UTC(y, mo, d, 0) + h * 3.6e6 - EPOCH) / 6e4); if (!G3.isActive()) G3.show(true); }", [y, mo, d, h])
        await pg.wait_for_function("G3.isActive()", timeout=60000)
        if wx:   # the weather held: the sky's cloud cover and the rain, the same for the pictures before and after
            await pg.evaluate("([c, p]) => { window.cloudAt = () => c; window.precipAt = () => p; }", list(wx))
        for name in names:
            la, lo = PLACES[name]; t0 = time.time()
            q = await pg.evaluate(SEA, [la, lo, 0.35])
            if not q: print('ingen sjø ved', name); continue
            await pg.evaluate("(q) => mapNeed(q, MAPD.simR)", q)
            await pg.evaluate("""(q) => { const b = S.boat; b.status = 'idle'; b.port = null; b.pos = {x:q.x, y:q.y}; S.plan = null; S.draft = []; b.v = 0; }""", q)
            a = await pg.evaluate(AIM, q)
            try:
                await pg.wait_for_function("""(q) => { const D = G3._debug, N = D.NEARM, F = D.FINEM; return N && !N.stale && F && !F.stale && Math.abs(N.cx - q.x * 1000) < 2500 && Math.abs(N.cz - q.y * 1000) < 2500 && mapViewIn(q); }""", arg=q, timeout=240000)
            except Exception as e:
                print('   (venter fortsatt:', name, str(e)[:80], ')')
            await pg.wait_for_timeout(9000)   # the chunks with the trees and the houses, a few a frame
            for view, dist, pitch in (('low', 260, 0.1), ('high', 1100, 0.42)):
                await pg.evaluate("([a, dist, pitch]) => { const c = G3._debug.cam; c.helm = false; c.dist = dist; c.pitch = pitch; c.yaw = a - G3._debug.bv.head; }", [a, dist, pitch])
                await pg.wait_for_timeout(3500)
                fn = f'terr_{tag}_{season}_{name}_{view}.png'
                # the canvas read in a frame, right after the game has drawn it (a Playwright screenshot waits for a still page)
                url = await pg.evaluate("() => new Promise(res => requestAnimationFrame(() => res(document.getElementById('gl').toDataURL('image/png'))))")
                open(fn, 'wb').write(base64.b64decode(url.split(',', 1)[1]))
                print(fn, round(time.time() - t0), 's')
            if CLOSE:
                q2 = await pg.evaluate(SEA, [la, lo, 0.08])
                if q2:
                    await pg.evaluate("(q) => mapNeed(q, MAPD.simR)", q2)
                    await pg.evaluate("""(q) => { const b = S.boat; b.pos = {x:q.x, y:q.y}; b.v = 0; }""", q2)
                    a2 = await pg.evaluate(AIM, q2)
                    try:
                        await pg.wait_for_function("""(q) => { const D = G3._debug, F = D.FINEM; return F && !F.stale && Math.abs(F.cx - q.x * 1000) < 300 && Math.abs(F.cz - q.y * 1000) < 300; }""", arg=q2, timeout=240000)
                    except Exception as e:
                        print('   (venter fortsatt, nær:', name, str(e)[:80], ')')
                    await pg.wait_for_timeout(9000)
                    await pg.evaluate("([a, dist, pitch]) => { const c = G3._debug.cam; c.helm = false; c.dist = dist; c.pitch = pitch; c.yaw = a - G3._debug.bv.head; }", [a2, 140, 0.55])
                    await pg.wait_for_timeout(3500)
                    fn = f'terr_{tag}_{season}_{name}_close.png'
                    url = await pg.evaluate("() => new Promise(res => requestAnimationFrame(() => res(document.getElementById('gl').toDataURL('image/png'))))")
                    open(fn, 'wb').write(base64.b64decode(url.split(',', 1)[1])); print(fn, round(time.time() - t0), 's')
            kn = await pg.evaluate("() => { const r = {}; for (const k of ['NEARM', 'FINEM']){ const m = G3._debug[k]; if (m && m.ck){ let s = 0, l = 0; for (let i = 0; i < m.ck.length; i++) if (m.h[i] > 0){ l++; s += m.ck[i]; } r[k] = l ? +(s / l).toFixed(3) : 0; } else r[k] = null; } return r; }")
            print('   punkter på land med kjent arealdekke:', kn)
            gl = await pg.evaluate("G3._debug.glErr()")
            if gl: print('GL-feil ved', name, gl)
        print('sidefeil:', errs[:3])
        await b.close()

asyncio.run(main())
