"""The new people's poses close in (steg 125, FB7): everyone on the line haul's places put in one pose at a time (SJOBEIN.test, as
tests/folk2diag.py), pictures for the session and Jonas of what the hands hold against the body: the box, the shovel, the cup, the
gaff, the binoculars (Jonas 13.11.2026: «Sørg for at objekter ikke kan clippe inn i menneskene»). Not in run.py.
python3 tests/folk2poses.py [liggende|staaende] [pose ...]   pictures tests/out/folk2pose_<pose>_<format>.png"""
import asyncio, os, sys
from playwright.async_api import async_playwright
from _env import boot, GAME, OUT
from lemmer import SET, BOATS, frames
POSES = [('coffee', 103.1), ('coffee', 104.9), ('binoc', 103.1), ('carry', 103.1), ('stack', 103.6), ('pack', 103.1), ('ice', 103.9), ('gaff', 103.1), ('smoke', 101.5), ('lunch', 104.1), ('cold', 106.6), ('phone', 103.1)]
FMT = {'liggende': (1280, 800), 'staaende': (800, 1280)}
async def main():
    fmts = [a for a in sys.argv[1:] if a in FMT] or ['liggende']; want = [a for a in sys.argv[1:] if a not in FMT]
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        for fmt in fmts:
            w, h = FMT[fmt]; pg = await br.new_page(viewport={'width': w, 'height': h}); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await boot(pg, GAME + ',folk2'); await pg.wait_for_function("G3.isActive()", timeout=120000); await pg.wait_for_timeout(3000)
            t = (await pg.evaluate(BOATS))[1]
            await pg.evaluate(SET, [t, 'arbeid', 1, -0.9, 0.3, 3.6 * (1.3 if fmt == 'staaende' else 1)]); await frames(pg, t, 2)
            try: await pg.wait_for_function("CREW3D.agents().filter(a => a.mode === 'at').length >= 3", timeout=240000)
            except Exception: pass
            seen = {}
            for task, T in POSES:
                if want and task not in want: continue
                await pg.evaluate("([task, T]) => { SJOBEIN.test = {roll:0, pitch:0, T, task}; }", [task, T]); await frames(pg, t, 2)
                seen[task] = seen.get(task, 0) + 1
                await pg.screenshot(path=os.path.join(OUT, 'folk2pose_%s%s_%s.png' % (task, '' if seen[task] == 1 else str(seen[task]), fmt)), timeout=400000)
                print(task, T, fmt, 'gl', await pg.evaluate("G3._debug.glErr()"), 'feil', errs[:2], flush=True)
            await pg.evaluate("SJOBEIN.test = null"); await pg.close()
        await br.close()
asyncio.run(main())
