"""The fish on its way up is alive until it is bled (Jonas 13.11.2026: «fisken som kommer opp når man fisker spreller litt helt til den er
bløgget, snøret dras i litt ulike retninger og fisken plasker litt i vannet når den kommer opp. Det samme gjelder liner, garn og andre
redskaper»): flap, tug, fishSplash and fishSurf in view3d/09-landing-deck.js, used by the hand jig and the jigging machines
(13-instruments.js), the line and the nets at the hauler (10-gear.js) and the hands on deck (08-plants.js). Counts the splashes
(G3._debug.dk.n.fsplash) per kind of fishing and takes three pictures a short moment apart of each (sprell_<kind>_<i>.png).
Prints OK or FEIL."""
from _env import boot
import asyncio
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


JIG = """(mach => { S.tut = 0; S.settings.speed = 1; S.t = Math.round((Date.UTC(2028, 2, 10, 11) - EPOCH) / 6e4); const b = S.boat; b.status = 'fishing'; b.port = null;
  b.pos = {...GROUNDS[0].p}; b.fishUntil = S.t + 900; b.deckStop = false; b.gop = null; S.hold = [{sp:'torsk', cls:2, kg:20, n:4, fresh:95, hr:0, bled:true, iced:true}];
  b.gear = true; S.equip.jukse = mach; const c = G3._debug.cam; c.helm = false; c.dist = 3.6; c.pitch = 0.06; c.yaw = -1.4; })"""
FEED = "window.CATCHQ = [{sp:'torsk', kg:5.5, t:performance.now()}, {sp:'sei', kg:2.4, t:performance.now() + 1}, {sp:'torsk', kg:3.1, t:performance.now() + 2}]"
HAUL = """(kind => { const b = S.boat, g = GROUNDS[0].p; S.t = Math.round((Date.UTC(2027, 5, 12, 11) - EPOCH) / 6e4); b.type = 'sjark'; applyVessel(); G3.vesselChanged();
  if (!S.crew.length) S.crew = [Object.assign(genCrew(), {bi:false, off:false, fatigue:10, morale:62, traits:[]})]; S.me = S.cur; b.rig = kind; S.equip[kind === 'garn' ? 'garnhaler' : 'linehaler'] = true;
  b.status = 'fishing'; b.port = null; b.deckStop = false; b.deckEnd = null; S.hold = []; b.pos = {x:g.x, y:g.y}; b.heading = 0.4; b.v = 0; b.fishUntil = S.t + 600; S.plan = null; S.mult = 0;
  S.sets = [{id:'t', kind, vid:S.cur, a:{x:g.x, y:g.y}, b:{x:g.x + 0.5, y:g.y}, n:6, tSet:S.t - 600, depth:60, acc:{torsk:{kg:3000, n:900}, hyse:{kg:1200, n:600}}, dead:0, lost:null, rep:false, warn:0}];
  b.gop = {op:'haul', kind, sid:'t', n:6, done:2, prog:0.4, a:{x:g.x, y:g.y}, b:{x:g.x + 0.5, y:g.y}, kg:0, rel:0, dead:0, hooksPer:kind === 'line' ? 100 : 0};
  const c = G3._debug.cam; c.helm = false; c.dist = 7.5; c.pitch = 0.25; c.yaw = -1.4; })"""


async def splashes(pg):
    return await pg.evaluate("(G3._debug.dk.n.fsplash || 0)")


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 800, 'height': 800}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e) + ' | ' + (e.stack or '')[:300]))
        await boot(pg)
        await pg.evaluate("S.tut = 0")
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(1500)
        for name, setup, arg in [('juksa', JIG, 0), ('maskin', JIG, 2)]:
            # (the last part's fish are let come up and out of the way first, so they do not count here)
            await pg.evaluate(setup, arg); await pg.evaluate("window.CATCHQ = []"); await pg.wait_for_timeout(4000)
            s0 = await splashes(pg); await pg.evaluate(FEED)
            # the fish come up over some seconds (SwiftShader is slow): pictures while they are on the line
            for i in range(3):
                await pg.wait_for_timeout(2200); await pg.screenshot(path=f'sprell_{name}_{i}.png')
            try: await pg.wait_for_function(f"(G3._debug.dk.n.fsplash || 0) > {s0}", timeout=25000)
            except Exception: pass
            s1 = await splashes(pg)
            check(s1 > s0, f'{name}: fisken plasker når den kommer opp av sjøen', (s0, s1))
            try: await pg.wait_for_function("(G3._debug.SK.anim.nb || 0) > 0", timeout=30000)
            except Exception: pass
            nb = await pg.evaluate("G3._debug.SK.anim.nb || 0")
            check(nb > 0, f'{name}: fisken blir bløgget og kastet i karet', nb)
        for kind in ['line', 'garn']:
            await pg.evaluate(HAUL, kind); await pg.wait_for_timeout(2500)
            s0 = await splashes(pg)
            for i in range(3):
                await pg.wait_for_timeout(2000); await pg.screenshot(path=f'sprell_{kind}_{i}.png')
            try: await pg.wait_for_function(f"(G3._debug.dk.n.fsplash || 0) > {s0}", timeout=60000)
            except Exception: pass
            s1 = await splashes(pg); ha = await pg.evaluate("Math.round(G3._debug.haulA * 100) / 100")
            check(s1 > s0, f'{kind}: fisken på redskapet plasker når den kommer opp ved haleren', (s0, s1, 'haulA', ha))
        print('sidefeil:', errs[:4]); await b.close()
asyncio.run(main())
