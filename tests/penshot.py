"""The week's pennants in 3D (core/09f-merker.js, view3d.js penTex and mastTop; Jonas 07.10.2026): the Norwegian pennant at the masthead
of your own boat, longer for each chapter finished, and on another player's boat by their paint code (p:N). Pictures pen_*.png of the
start boat (no mast, no pennant), a sjark, a coastal boat and another player's sjark beside you. Prints OK or FEIL."""
from _env import GAME, boot
import asyncio
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


SET = """((a) => { const [type, pen] = a, b = S.boat, g = GROUNDS[0].p; S.tut = 0; S.t = Math.round((Date.UTC(2027, 5, 12, 11) - EPOCH) / 6e4);
  b.type = type; applyVessel(); G3.vesselChanged(); b.status = 'idle'; b.port = null; b.pos = {x:g.x, y:g.y}; b.heading = 0.4; b.v = 0; S.plan = null; S.mult = 0;
  S.ach = Object.assign(S.ach || {}, {pen}); S.ach.d = S.ach.d || {}; S.ach.g = S.ach.g || {}; S.ach.ch = S.ach.ch || {};
  PEERS.length = 0; PEERS.push({id:'pz', boat:'Fjordbris', vtype:'sjark', x:g.x + 0.025, y:g.y, hd:0.4, v:0, st:'fishing', liv:'h:gul;p:2', at:Date.now()});
  const c = G3._debug.cam; c.helm = false; c.dist = 16; c.pitch = 0.18; c.yaw = -1.25; })"""


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 960, 'height': 640}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(3000)
        shots = 0
        # a fresh breeze from the west (the pennant streams out with the apparent wind), seen from the side
        await pg.evaluate("WX_FORCE = {w:10, d:270}")
        # the start boat has no mast and flies only the ensign (Jonas 07.10.2026: «ser jo teit ut med 2 flagg på hverandre»)
        for type, pen, ks in [('trebat', 1, [1.6]), ('sjark', 1, [1.6, -1.6]), ('kyst15', 3, [1.6, -1.6])]:
            await pg.evaluate(SET, [type, pen]); await pg.wait_for_timeout(2500)
            for k, yaw in enumerate(ks):
                await pg.evaluate(f"(() => {{ const c = G3._debug.cam; c.dist = {14 if type == 'trebat' else 22 if type == 'sjark' else 34}; c.pitch = 0.08; c.yaw = {yaw}; }})()"); await pg.wait_for_timeout(2500)
                await pg.screenshot(path=f'pen_{type}_{pen}_{k}.png'); shots += 1
        # late evening under the midnight sun: the ensign is down (at 21 at the latest), the pennant still flies
        await pg.evaluate("(() => { S.t = Math.round((Date.UTC(2027, 5, 12, 23, 30) - EPOCH) / 6e4); const c = G3._debug.cam; c.yaw = 1.6; })()"); await pg.wait_for_timeout(2500)
        await pg.screenshot(path='pen_night.png'); shots += 1
        fu = await pg.evaluate("""(() => { const n = S.boat.pos, s = P(59.9, 10.7), at = (mo, d, h, m) => (Date.UTC(2027, mo, d, h, m || 0) - EPOCH) / 36e5;
          return {jun0730:flagUp(at(5, 12, 7, 30), n), jun0900:flagUp(at(5, 12, 9), n), jun2130:flagUp(at(5, 12, 21, 30), n), dec1100:flagUp(at(11, 12, 11), n), dec1600:flagUp(at(11, 12, 16), n),
            southOct1700:flagUp(at(9, 1, 17), s), southOct2030:flagUp(at(9, 1, 20, 30), s), southDec0830:flagUp(at(11, 12, 8, 30), s), southDec1000:flagUp(at(11, 12, 10), s)}; })()""")
        check(fu == {'jun0730': False, 'jun0900': True, 'jun2130': False, 'dec1100': True, 'dec1600': False, 'southOct1700': True, 'southOct2030': False, 'southDec0830': False, 'southDec1000': True},
              'the ensign in its hours: 08 (09 in winter) to sunset and 21 at the latest, 10 to 15 in the north in winter; the pennant day and night', fu)
        mast = await pg.evaluate("(() => { const o = {}; for (const t of ['skiff', 'trebat', 'snekke', 'sjark', 'kyst15']) o[t] = !!G3._debug.mastTop(t); return o; })()")
        check(not mast['trebat'] and not mast['skiff'] and mast['sjark'] and mast['kyst15'], 'a pennant only on a boat with a mast above the ensign (the open boats fly none)', mast)
        # another player's sjark with two pennants, 14 m abeam of yours, seen past your boat
        await pg.evaluate(SET, ['sjark', 0]); await pg.evaluate("(() => { const q = PEERS[0], b = S.boat; q.x = b.pos.x + Math.cos(b.heading) * 0.014; q.y = b.pos.y + Math.sin(b.heading) * 0.014; q.at = Date.now(); })()"); await pg.wait_for_timeout(1500)
        for k, yaw in enumerate([1.6, -1.6, 0.6, -0.6]):
            await pg.evaluate(f"(() => {{ const c = G3._debug.cam; c.dist = 30; c.pitch = 0.1; c.yaw = {yaw}; }})()"); await pg.wait_for_timeout(2500)
            await pg.screenshot(path=f'pen_peer_{k}.png'); shots += 1
        gerr = await pg.evaluate("G3._debug.glErr()")
        check(gerr == 0 and shots == 10 and errs == [], "pennants at the masthead of your own boat and on another player's, drawn without GL errors (look at pen_*.png)", (gerr, shots, errs[:3]))
        await b.close()


asyncio.run(main())
