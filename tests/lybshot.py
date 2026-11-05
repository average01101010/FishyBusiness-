# Pictures of Longyearbyen as a harbour (H1b R7): the boat at the yard and at the shop in 3D, the units on their quays among the town's
# buildings and quays from the vec packs, and the crew exchange there (the flight from Tromsø), in both formats:
# tests/out/lyb_<what>_<w>x<h>.png. Needs dist-vec/ and the whole coast, as lybtest. Prints OK or FEIL per check.
import asyncio, json, os, subprocess
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.environ['KYST_DIST'] = os.path.join(ROOT, 'dist-vec')
from playwright.async_api import async_playwright
from _env import *
ok = lambda c: 'OK  ' if c else 'FEIL'

AT = """async (nm) => { const pt = PORTS.find(q => q.name === nm), b = S.boat; S.tut = 0; S.cash = 1e6; S.t = Math.round((Date.UTC(2027, 7, 10, 13) - EPOCH) / 6e4); S.mult = 0;
  await mapNeed(pt.p, MAPD.simR + 2); b.type = 'kyst15'; applyVessel(); b.status = 'sailing'; b.port = null; b.pos = {...pt.p}; S.plan = null; dock(pt.id);
  if (typeof G3 !== 'undefined' && G3.vesselChanged) G3.vesselChanged(); return {port:b.port, status:b.status}; }"""

async def main():
    if not os.environ.get('KYST_VEC_BUILT'):
        r = subprocess.run(['node', 'build.mjs'], cwd=ROOT, env=dict(os.environ, KYST_VEC='1'), capture_output=True, text=True)
        print(ok(r.returncode == 0), 'dist-vec/ bygges med vec-pakkene', r.stderr[-200:])
    os.makedirs('out', exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-compositing'])
        errs = []
        for w, h in ((1280, 800), (800, 1280)):
            pg = await b.new_page(viewport={'width': w, 'height': h}); pg.on('pageerror', lambda e: errs.append(str(e)))
            await boot(pg); pg.set_default_timeout(300000)
            await pg.evaluate("() => { if (!G3.isActive()) G3.show(true); }"); await pg.wait_for_function("G3.isActive()", timeout=60000)
            for nm, tag in (('Longyearbyen verft', 'verft'), ('Longyearbyen utstyrsbutikk', 'butikk')):
                r = await pg.evaluate(AT, nm); print(nm, r)
                print(ok(r['status'] == 'port'), nm + ': fortøyd', w, h)
                try: await pg.wait_for_function("() => { const v = G3._debug.vec; return v && v.chunks > 10; }", timeout=240000)
                except Exception as e: print('FEIL vec-pakkene i 3D', str(e)[:80])
                await pg.evaluate("() => { const c = G3._debug.cam; c.helm = false; c.dist = 140; c.pitch = 0.32; c.yaw = 2.4; }")
                await pg.wait_for_timeout(12000)
                await pg.screenshot(path=f'out/lyb_{tag}_{w}x{h}.png', timeout=120000)
                gl = await pg.evaluate("G3._debug.glErr ? G3._debug.glErr() : 0"); print(ok(not gl), 'ingen GL-feil', gl)
            await pg.evaluate("() => { PHONE.open('bors'); }"); await pg.wait_for_timeout(1500)
            txt = await pg.evaluate("document.body.innerText.includes('flyr hit fra Tromsø')"); print(ok(txt), 'Mannskapsbørsen sier at den som ansettes, flyr fra Tromsø', w, h)
            await pg.screenshot(path=f'out/lyb_bors_{w}x{h}.png', timeout=120000)
            await pg.close()
        print('sidefeil:', errs[:5])
        await b.close()
asyncio.run(main())
