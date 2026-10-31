# Jigging while the passive gear stands (Jonas 09.10.2026): the jig is there whenever the boat lies still, whatever the rig; room in the hold is kept
# for what the gear in the sea is likely to bring (gearReserve), so the jig catch does not fill the boat first.
import asyncio, json
from playwright.async_api import async_playwright
from _env import *
ok = lambda c: 'OK  ' if c else 'FEIL'
SEED = """(()=>{ let a = 20260930; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })()"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await (await b.new_context(viewport={'width': 1100, 'height': 800})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg); await pg.evaluate(SEED)
        r = await pg.evaluate("""(()=>{ const R = {}, b = S.boat; S.tut = 0; S.cash = 1e7; S.settings.autoOn = false; S.stock = initStock(); S.crew = [Object.assign(genCrew(), {bi:false, off:false})];
          S.equip.linehaler = true; S.equip.jukse = 0; b.rig = 'line'; R.rig = rigOf();
          const spot = GROUNDS[2].p; S.t = Math.round((Date.UTC(2028, 2, 5, 6) - EPOCH) / 3.6e6 * 60);
          b.status = 'fishing'; b.port = null; b.pos = {...spot}; b.gop = null; b.fishUntil = S.t + 300; S.hold = []; for (let i = 0; i < 120; i++) step();
          R.jigKg = Math.round(holdTotal());
          // the gear in the sea: what is kept free
          S.sets = [{vid:S.cur, kind:'line', n:4, acc:{torsk:{kg:100, n:10, ts:0}}}, {vid:S.cur, kind:'garn', n:2, acc:{}}, {vid:S.cur, kind:'teine', n:10, acc:{}, lost:true}];
          R.reserve = gearReserve(); S.sets = [];
          // a hold that is all kept for the gear in the sea takes no jig catch
          const keep = window.gearReserve; window.gearReserve = () => capHold(); S.hold = []; b.fishUntil = S.t + 300; for (let i = 0; i < 120; i++) step(); R.keptKg = Math.round(holdTotal()); window.gearReserve = keep;
          R.dock = (() => { b.status = 'fishing'; b.fishUntil = S.t + 300; b.gop = null; DOCK.render(); return DOCK.items().map(x => x.id); })();
          return R; })()""")
        print(json.dumps(r))
        print(ok(r['rig'] == 'line' and r['jigKg'] > 0), 'a boat rigged for line still jigs while it lies still', [r['rig'], r['jigKg']])
        print(ok(r['reserve'] == 280 + 80), 'the room kept for the gear in the sea: the larger of what it has caught (×1.2) and a typical haul per unit, lost gear left out', r['reserve'])
        print(ok(r['keptKg'] == 0), 'with the hold kept for the gear in the sea the jig takes nothing', r['keptKg'])
        print(ok('jigg' in r['dock']), 'the Jig button is on the dock whatever the rig', r['dock'])
        print(ok(not errs), 'no page errors', errs[:2])
        await b.close()
asyncio.run(main())
