"""(OB11 round 4) where the crew stand on a boat (model frame: x from the aft perpendicular, y port +), per op, sampled while each runs.
    python3 tools/boats/qa/crewplaces.py [type]   (build first; prints per scene the places in the model frame, x from the aft perpendicular, y port +; XM is the breisjark's midship)"""
import asyncio, os, sys, json
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), 'tests'))
from _env import boot
import ombord as OB
from playwright.async_api import async_playwright
XM = 5.18
OPSL = [(f, op) for f, op in [('teiner', 'sett'), ('teiner', 'trekk'), ('juksa', 'maskin'), ('juksa', 'jig'), ('juksa', 'sloy'), ('line', 'sett'), ('garn', 'sett'), ('line', 'trekk'), ('garn', 'trekk'), ('felles', 'hvile'), ('felles', 'rydd'), ('felles', 'ut')]]
SAMPLE = """(() => CREW3D.visible().map(a => [a.id, a.mode, (a.goal && a.goal.task) || a.task || '', +(5.18 - a.z).toFixed(2), +(-a.x).toFixed(2), a.role || '']))()"""
async def main():
    T = sys.argv[1] if len(sys.argv) > 1 else 'breisjark'
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await br.new_page(viewport={'width': 800, 'height': 600}); await boot(pg)
        await pg.wait_for_function("G3.isActive()", timeout=120000); await pg.wait_for_timeout(2000)
        await pg.evaluate(OB.TIMESCALE)
        out = {}
        for f, op in OPSL:
            if op not in OB.OPS: continue
            js = OB.OPS[op][2]
            await pg.evaluate("__TK.set(1)")
            await pg.evaluate(OB.BASE.replace('__GI__', '0'), [T, f, op])
            res = await pg.evaluate("(async (a) => { const [type, fish, op] = a, b = S.boat, V = VESSELS[type], g = GROUNDS[0].p; " + js + " })", [T, f, op])
            if res and str(res).startswith('SKIP'): print(f, op, res, flush=True); continue
            await pg.evaluate("__TK.set(3)")
            seen = {}
            for i in range(40):
                await pg.wait_for_timeout(500)
                for a in await pg.evaluate(SAMPLE):
                    if a[1] != 'at': continue
                    k = (a[2], round(a[3], 1), round(a[4], 1))
                    seen[k] = seen.get(k, 0) + 1
            out[f + '_' + op] = sorted([[k[0], k[1], k[2], n] for k, n in seen.items()], key=lambda r: -r[3])
            print(f, op, json.dumps(out[f + '_' + op]), flush=True)
        json.dump(out, open(os.environ.get('PROBE_OUT', 'crewplaces.json'), 'w'))
        await br.close()
asyncio.run(main())
