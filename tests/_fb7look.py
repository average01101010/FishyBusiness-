"""Scratch for FB7 (steg 125): one close picture of the deck at work, with or without #folk2. python3 tests/_fb7look.py <out.jpg> [scene] [folk2|plain] [w h]"""
import asyncio, json, os, sys
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'lemmer.py')).read().replace('asyncio.run(main())', '')
sys.argv = [sys.argv[0]] + sys.argv[1:]
ARGS = sys.argv[1:]; sys.argv = sys.argv[:1]
exec(src)
async def look():
    out = ARGS[0]; scene = ARGS[1] if len(ARGS) > 1 else 'arbeid'; plain = len(ARGS) > 2 and ARGS[2] == 'plain'; w = int(ARGS[3]) if len(ARGS) > 3 else 1280; h = int(ARGS[4]) if len(ARGS) > 4 else 800
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await br.new_page(viewport={'width': w, 'height': h}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: print('CONSOLE', m.text[:300]) if m.type == 'error' else None)
        await boot(pg, GAME if plain else GAME + ',folk2' + os.environ.get('KYST_X', ''))
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(3000)
        boats = await pg.evaluate(BOATS); t = boats[1]
        await pg.evaluate(SET, [t, scene, 1, -0.9, 0.32, 5.6 * (1.35 if h > w else 1)]); await frames(pg, t, 3)
        try: await pg.wait_for_function("CREW3D.agents().filter(a => a.mode === 'at').length >= 3", timeout=240000)
        except Exception: pass
        await pg.evaluate("SJOBEIN.test = {T:103.1}"); await frames(pg, t, 2)
        await pg.screenshot(path=out, type='jpeg', quality=80)
        print(json.dumps(await pg.evaluate("({ag:CREW3D.agents().map(a => a.mode + ':' + a.task), gl:G3._debug.glErr(), fig:G3._debug.figStat ? G3._debug.figStat() : null})")), errs[:3], flush=True)
        await br.close()
asyncio.run(look())
