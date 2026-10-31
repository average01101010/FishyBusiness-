"""screenshots of the aluminium starter boat (skiff) in the game, in both formats, from the outside camera and the bridge (for Jonas; not in run.py)"""
import asyncio, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from _env import boot, HERE
ROOT = os.path.dirname(HERE)
from playwright.async_api import async_playwright
SET = """((t) => { const b = S.boat; S.tut = 0; S.mult = 0; S.t = Math.round((Date.UTC(2027, 2, 12, 11) - EPOCH) / 6e4);
  b.type = t; applyVessel(); G3.vesselChanged(); S.equip = {}; S.jobs = []; S.cargo = []; b.gop = null; S.hold = []; S.pgear = newPGear(); b.rig = 'juksa';
  b.status = 'sailing'; b.port = null; b.v = VESSELS[t].vcruise || 8; const p = P(69.532, 17.926); b.pos = {x:p.x, y:p.y}; b.heading = 1.2;
  S.plan = {wps:[{x:b.pos.x + 9, y:b.pos.y, port:null, fish:0}], idx:0, speed:b.v, returning:false}; G3.setHelm(true); })"""
SET2 = SET.replace('G3.setHelm(true);', '')
OUT = os.path.join(ROOT, 'tests', 'out')
async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        FMT = {'liggende': (1280, 800), 'staaende': (800, 1280)}
        for tag in (sys.argv[1:] or list(FMT)):
            w, h = FMT[tag]; print(tag, 'start', flush=True)
            pg = await br.new_page(viewport={'width': w, 'height': h}); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await boot(pg); print(tag, 'booted', flush=True)
            await pg.wait_for_function("G3.isActive()", timeout=120000); await pg.wait_for_timeout(3000)
            print(tag, '3D active', flush=True); await pg.evaluate(SET2, 'skiff'); await pg.wait_for_function("geoOf('skiff') && geoOf('skiff').skipperAt", timeout=120000); await pg.evaluate("G3.setHelm(true)"); await pg.wait_for_timeout(4000); print(tag, 'set', flush=True)
            await pg.screenshot(path=os.path.join(OUT, 'skiff_' + os.environ.get('TAG','') + '_bro_' + tag + '.png'), timeout=400000)
            await pg.evaluate("G3.setHelm(false)"); await pg.evaluate("(() => { const c = G3._debug.cam; c.dist = 11; c.pitch = 0.28; c.yaw = 2.2; })()"); await pg.wait_for_timeout(5000)
            await pg.screenshot(path=os.path.join(OUT, 'skiff_' + os.environ.get('TAG','') + '_' + tag + '.png'), timeout=400000)
            print(tag, 'errors', errs)
            await pg.close()
        await br.close()
asyncio.run(main())
