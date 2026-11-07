"""The king crab pot from Blender and its hauling and setting in 3D (tools/gear/teine.py, view3d.js drawPots; the user's wish
04.10.2026): on the sjark with a pot hauler and a crab tank, pictures through one hauled pot (on its way up, at the block, on deck with
the hatch open and crabs going to the tank, to the stack) and one set pot (over the rail, sinking). Pictures pot_*.png. Prints OK or FEIL."""
from _env import GAME, boot
import asyncio
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


SET = """((a) => { const [op, type] = a, b = S.boat, g = GROUNDS[0].p; S.tut = 0; S.t = Math.round((Date.UTC(2027, 5, 12, 11) - EPOCH) / 6e4); b.type = type; applyVessel(); G3.vesselChanged();
  if (!S.crew.length) S.crew = [Object.assign(genCrew(), {bi:false, off:false, fatigue:10, morale:62, traits:[]})]; S.me = S.cur; b.rig = 'teiner'; S.equip.teinehaler = true; S.equip.krabbekar = true;
  S.hold = [{sp:'krabbe', cls:1, kg:40, n:16, bled:true, iced:false, hr:0, fresh:98, gut:false, hook:false}];
  S.sets = [{id:'pz', vid:S.cur, kind:'teine', pot:'big', n:12, a:{x:g.x, y:g.y}, b:{x:g.x + 0.3, y:g.y}, tSet:S.t - 1440, acc:{krabbe:{kg:60, n:40, ts:0}}, dead:0, lost:null, rep:false, warn:0, heavy:false, depth:60}];
  b.status = 'fishing'; b.port = null; b.pos = {x:g.x, y:g.y}; b.heading = 0.4; b.v = 0; b.fishUntil = S.t + 600; S.plan = null; S.mult = 0;
  b.gop = op === 'haul' ? {op:'haul', kind:'teine', sid:'pz', n:12, done:5, prog:0.4, a:{x:g.x, y:g.y}, b:{x:g.x + 0.3, y:g.y}, kg:0, rel:0, dead:0, hooksPer:0}
                        : {op:'set', kind:'teine', s:{kind:'teine', pot:'big'}, n:12, done:4, prog:0.4, a:{x:g.x, y:g.y}, b:{x:g.x + 0.3, y:g.y}, fishAfter:0, hooksPer:0};
  const c = G3._debug.cam; c.helm = false; c.dist = 9; c.pitch = 0.42; c.yaw = -1.1; })"""


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 960, 'height': 640}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(3000)
        parts = await pg.evaluate("(() => typeof glbHas === 'function' && glbHas('gear-pot') ? ['teine', 'teinedor', 'davit', 'davitskive', 'krabbekar'].map(n => !!glbPart('gear-pot', n)) : [])()")
        check(len(parts) == 5 and all(parts), 'teina, luka, davitten, haleskiva og krabbekaret fra Blender er med', parts)
        shots = 0
        for op, type, us in [('haul', 'sjark', [0.3, 0.5, 0.6, 0.75, 0.95]), ('set', 'sjark', [0.2, 0.45, 0.7]), ('haul', 'breisjark', [0.6, 0.75])]:
            await pg.evaluate(SET, [op, type]); await pg.wait_for_timeout(2500)
            for u in us:
                await pg.evaluate(f"G3._debug.pota.fix = {u}"); await pg.wait_for_timeout(900)
                await pg.screenshot(path=f'pot_{type}_{op}_{int(u * 100)}.png'); shots += 1
        await pg.evaluate("G3._debug.pota.fix = null")
        gerr = await pg.evaluate("G3._debug.glErr()")
        check(gerr == 0 and shots == 10, 'bildene gjennom en halt og en satt teine er tatt uten GL-feil', (gerr, shots))
        print('errors:', errs[:5])
        await b.close()


asyncio.run(main())
