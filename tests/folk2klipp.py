"""Clips of the new people at work, a frame at a time (Jonas 14.11.2026; CLAUDE.md «bildeklipp»): the software GPU draws a frame in
10 to 40 s, so a recording in real time is useless. Here the man's own clock is set to a moment (SJOBEIN.test.t), the frame is drawn
and saved, and the clock is moved one step on; the frames are sewn to a clip with ffmpeg. The boat, the deck and what stands on it
are drawn (not the white room: whether a hand is on the table or the rail must be seen), the sea and the terrain are left out for speed.
Not in run.py: a tool, as folk2live.py.

  python3 tests/folk2klipp.py <name> <scene> <task> <t0> <t1> [--fps 8] [--lay] [--dist 3.4] [--pitch 0.35] [--face 0.6]
      <task>: the work of the one the camera is on (the agents' own name: gut, pack, haul, bleedst, egn ...)
      --lay: the moments are the packer's laying of a fish (SJOBEIN.test.lay), not the round
      --still 0.7,1.0,1.6: only these moments, as pictures on one sheet and no clip (a frame with the whole deck takes a minute)
      --ev gaff: the moments are of the last event of that kind, played again (gaff, bleed, jigup)
  -> tests/out/klipp/<name>.mp4 and <name>_ark.jpg (every fourth frame on one sheet, for the session's own eyes)
"""
import asyncio, json, os, subprocess, sys, time
from _env import boot, GAME
from lemmer import SET, BOATS, frames
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out', 'klipp')


async def main():
    a = sys.argv[1:]; name, scene, task, t0, t1 = a[0], a[1], a[2], float(a[3]), float(a[4]); o = {'fps': 8, 'dist': 3.4, 'pitch': 0.35, 'face': 0.6}; lay = '--lay' in a
    for k in o:
        if '--' + k in a: o[k] = float(a[a.index('--' + k) + 1])
    still = [float(x) for x in a[a.index('--still') + 1].split(',')] if '--still' in a else None; ev = a[a.index('--ev') + 1] if '--ev' in a else None
    n = len(still) if still else int(round((t1 - t0) * o['fps'])) + 1; d = os.path.join(OUT, name); os.makedirs(d, exist_ok=True)
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await br.new_page(viewport={'width': 640, 'height': 400}); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + ('' if ',folk2' in GAME else ',folk2')); await pg.wait_for_function("G3.isActive()", timeout=120000); await pg.wait_for_timeout(2000)
        t = (await pg.evaluate(BOATS))[1]; await pg.evaluate(SET, [t, scene, 1, -0.9, 0.3, 6])
        await pg.evaluate("S.crew.forEach((c, i) => { c.sex = 'm'; c.age = 30 + i * 7; }); CREW3D.reset()"); await frames(pg, t, 2)
        await pg.wait_for_function("(k) => CREW3D.agents().some(a => a.task === k && a.mode === 'at')", arg=task, timeout=400000)
        if ev: n0 = await pg.evaluate("G3._debug.dk.n"); await pg.wait_for_function("([k, n0]) => G3._debug.dk.n[k] > (n0[k] || 0)", arg=[ev, n0], timeout=400000)   # (an event is played again only once it has been played)
        who = await pg.evaluate("(k) => CREW3D.agents().findIndex(a => a.task === k && a.mode === 'at')", task)
        # (the HUD away, the sea and the land not drawn: the deck and the people are what is looked at)
        await pg.add_style_tag(content="body * { visibility: hidden !important; } canvas { visibility: visible !important; }")
        await pg.evaluate("([w, d, p, f]) => G3._debug.camOn(w, d, p, f, false)", [who, o['dist'], o['pitch'], o['face']])
        t_0 = time.time(); files = []
        for k in range(n):
            tt = still[k] if still else t0 + k / o['fps']
            await pg.evaluate("([tt, lay, ev]) => { SJOBEIN.test = ev ? {roll:0, pitch:0, T:103.1, t:tt, ev} : lay ? {roll:0, pitch:0, T:103.1, t:0, lay:tt} : {roll:0, pitch:0, T:103.1, t:tt, lay:-1}; }", [tt, lay, ev]); await frames(pg, t, 2, 600000)
            f = os.path.join(d, '%03d.png' % k); await pg.screenshot(path=f, timeout=400000); files.append(f)
            if k == 0: print('første bilde etter %.0f s' % (time.time() - t_0), flush=True)
        await pg.evaluate("SJOBEIN.test = null"); print('%d bilder på %.0f s' % (n, time.time() - t_0), 'sidefeil', errs[:2], flush=True); await br.close()
    mp4 = os.path.join(OUT, name + '.mp4')
    if not still: subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(o['fps']), '-i', os.path.join(d, '%03d.png'), '-pix_fmt', 'yuv420p', '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2', mp4], check=True)
    from PIL import Image
    pick = files if still else files[::4][:12]; cols = 4; rows = (len(pick) + cols - 1) // cols; sheet = Image.new('RGB', (480 * cols, 300 * rows), 'white')
    for i, f in enumerate(pick): sheet.paste(Image.open(f).convert('RGB').resize((480, 300)), ((i % cols) * 480, (i // cols) * 300))
    sheet.save(os.path.join(OUT, name + '_ark.jpg'), quality=85); print(mp4, flush=True)

asyncio.run(main())
