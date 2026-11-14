"""The new people's poses close in (steg 125, FB7): everyone on the line haul's places put in one pose at a time (SJOBEIN.test, as
tests/folk2diag.py), pictures for the session and Jonas of what the hands hold against the body: the box, the shovel, the cup, the
gaff, the binoculars (Jonas 13.11.2026: «Sørg for at objekter ikke kan clippe inn i menneskene»). Not in run.py.
python3 tests/folk2poses.py [liggende|staaende] [pose ...]   pictures tests/out/folk2pose_<pose>_<format>.png"""
import asyncio, os, sys
from playwright.async_api import async_playwright
from _env import boot, GAME, OUT
from lemmer import SET, BOATS, frames
# the poses and when: coffee over a whole sip's round (the cup is at the mouth for 1.7 s of 12.6)
POSES = [('coffee', 100.0), ('coffee', 101.4), ('coffee', 102.8), ('coffee', 104.2), ('coffee', 105.6), ('coffee', 107.0), ('coffee', 108.4), ('coffee', 109.8), ('coffee', 111.2),
         ('smoke', 100.0), ('smoke', 101.0), ('smoke', 102.0), ('smoke', 103.0), ('smoke', 104.0), ('smoke', 105.0), ('smoke', 106.0), ('smoke', 107.0),
         ('sweep', 103.1), ('sweep', 103.8), ('jig', 103.1), ('jig', 103.4), ('binoc', 103.1), ('carry', 103.1), ('stack', 103.6), ('stack', 105.8), ('stow', 103.1), ('pack', 103.1), ('gaff', 103.1), ('lunch', 104.1), ('cold', 106.6), ('phone', 103.1)]
FMT = {'liggende': (1280, 800), 'staaende': (800, 1280), 'liten': (640, 480)}
async def main():
    """The eye on one man (G3._debug.camOn: POSE_WHO his number on deck, 1; POSE_FACE rad to his side from straight before him, 0.5;
    POSE_DIST m, 2.6; POSE_PITCH, 0.1), everyone put in the pose."""
    fmts = [a for a in sys.argv[1:] if a in FMT] or ['liten']; want = [a for a in sys.argv[1:] if a not in FMT]
    who = int(os.environ.get('POSE_WHO', '1')); face = float(os.environ.get('POSE_FACE', '0.5')); dist = float(os.environ.get('POSE_DIST', '2.6')); pitch = float(os.environ.get('POSE_PITCH', '0.1'))
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        for fmt in fmts:
            w, h = FMT[fmt]; pg = await br.new_page(viewport={'width': w, 'height': h}); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await boot(pg, GAME + ',folk2'); await pg.wait_for_function("G3.isActive()", timeout=120000); await pg.wait_for_timeout(3000)
            t = (await pg.evaluate(BOATS))[1]
            await pg.evaluate(SET, [t, os.environ.get('POSE_SCENE', 'pause'), 1, -0.9, 0.3, 6]); await frames(pg, t, 2)   # (in the break everyone takes the pose that is asked for)
            try: await pg.wait_for_function("CREW3D.agents().filter(a => a.mode === 'at').length >= 3", timeout=240000)
            except Exception: pass
            if os.environ.get('POSE_STUDIO', '1') != '0': await pg.evaluate("G3._debug.studio(true)")   # (the white room: only the people and what they hold)
            await pg.evaluate("([w, d, p, f, s]) => G3._debug.camOn(w, d, p, f, s)", [who, dist * (1.3 if fmt == 'staaende' else 1), pitch, face, os.environ.get('POSE_ALENE', '1') != '0'])   # (alone: the others are not drawn)
            seen = {}
            for task, T in POSES:
                if want and task not in want: continue
                await pg.evaluate("([task, T]) => { SJOBEIN.test = {roll:0, pitch:0, T, task}; }", [task, T]); await frames(pg, t, 2)
                seen[task] = seen.get(task, 0) + 1
                await pg.screenshot(path=os.path.join(OUT, 'folk2pose_%s%s_%s.png' % (task, '' if seen[task] == 1 else str(seen[task]), fmt)), timeout=400000)
                print(task, T, fmt, 'gl', await pg.evaluate("G3._debug.glErr()"), 'feil', errs[:2], flush=True)
            await pg.evaluate("SJOBEIN.test = null; G3._debug.camOn(null)"); await pg.close()
        await br.close()
asyncio.run(main())
