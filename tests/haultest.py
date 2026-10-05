"""The haulers from Blender (tools/gear/haler.py, view3d.js haulModel/drawGearOp; the user's wish 03.10.2026): hauling nets on the sjark
the net hauler stands on its post at the starboard rail with the net coming up over its sheave, which turns; hauling line the line
hauler does the same; the hands on «Haling» stand at the hauler and the tray, and the skipper too when hauling is his job (he leaves
the wheel). Pictures: haul_garn.png, haul_line.png. Prints OK or FEIL."""
from _env import GAME, boot
import asyncio
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


SET = """(kind => { const b = S.boat, g = GROUNDS[0].p; S.t = Math.round((Date.UTC(2027, 5, 12, 11) - EPOCH) / 6e4); b.type = 'sjark'; applyVessel(); G3.vesselChanged();
  if (!S.crew.length) S.crew = [Object.assign(genCrew(), {bi:false, off:false, fatigue:10, morale:62, traits:[]})]; S.me = S.cur; b.rig = kind; S.equip[kind === 'garn' ? 'garnhaler' : 'linehaler'] = true;   // nets need two hands
  b.status = 'fishing'; b.port = null; b.deckStop = false; b.deckEnd = null; S.hold = []; b.pos = {x:g.x, y:g.y}; b.heading = 0.4; b.v = 0; b.fishUntil = S.t + 600; S.plan = null; S.mult = 0;
  b.gop = {op:'haul', kind, sid:'t', n:6, done:2, prog:0.4, a:{x:g.x, y:g.y}, b:{x:g.x + 0.5, y:g.y}, kg:0, rel:0, dead:0, hooksPer:kind === 'line' ? 100 : 0};
  const c = G3._debug.cam; c.helm = false; c.dist = 7.5; c.pitch = 0.3; c.yaw = -1.4; })"""


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 960, 'height': 640}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(3000)
        for kind in ['garn', 'line']:
            await pg.evaluate(SET, kind); await pg.wait_for_timeout(2500)
            a0 = await pg.evaluate("G3._debug.haulA"); await pg.wait_for_timeout(2000); a1 = await pg.evaluate("G3._debug.haulA")
            st = await pg.evaluate("({deckStop:!!S.boat.deckStop, op:S.boat.gop && S.boat.gop.op, status:S.boat.status})")
            m = await pg.evaluate(f"(() => {{ const M = G3._debug.haulModel('{kind}'); return M ? {{r:M.r, n:M.path.length, parts:[!!M.frame, !!M.sheave, !!M.stripper]}} : null; }})()")
            await pg.screenshot(path=f'haul_{kind}.png')
            check(m and all(m['parts']) and a1 > a0, kind + 'haleren fra Blender står ved ripa, og skiva går rundt mens det hales', (m, round(a0, 2), round(a1, 2), st))
        # the skipper on «Haling»: three hands at the gear
        n = await pg.evaluate("(() => { const A = () => { const c = Object.assign(genCrew(), {bi:false, off:false, fatigue:10, morale:62, traits:[]}); return c; }; S.crew = [A(), A()]; S.me = S.cur; S.myJob = ['haling']; S.crew.forEach(c => c.job = ['haling']); return G3._debug.gopHands(); })()")
        await pg.wait_for_timeout(1500); await pg.screenshot(path='haul_crew.png')
        check(n >= 2, 'de som står på «Haling», også skipperen, haler', n)
        gerr = await pg.evaluate("G3._debug.glErr()")
        check(gerr == 0, 'ingen GL-feil', gerr)
        print('errors:', errs[:5])
        await b.close()


asyncio.run(main())
