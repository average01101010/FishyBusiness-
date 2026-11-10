from _env import GAME, boot
# The foam map's square seen from above (Jonas' video 09.11.2026, 5.20j in docs/systemer/vaer-og-hav.md): the foam map covers
# 600 m round the boat (FOAM.M), and before 09.11.2026 the whitecaps' tails lay inside it and not outside, with a sharp edge, so a
# big square showed round the boat from far above. Now the map's foam fades out over its outermost fifth (fe in SEA_FS) and the
# crests outside take all of Monahan's cover. SwiftShader draws a frame in seconds, so the tails would not build up in a test:
# FOAM.tauC (tests only) gives them a long life, as the foam branch saw the square with it. The check: the foam alone from above
# (seaDbg, white = foam) in a fresh gale, the share of white per column, and the step across where the map's edge falls on the
# screen against the step anywhere else in the picture (the patches of whitecaps make steps of their own).
# Seen red on the working branch before the foam branch was merged (ae7b6891, KYST_DIST), green after (10.11.2026).
import asyncio, math, os, sys
sys.stdout.reconfigure(line_buffering=True)
from playwright.async_api import async_playwright
from PIL import Image

ok = lambda c: 'OK  ' if c else 'FEIL'
SETUP = "S.t = Math.round((Date.UTC(2027, 3, 10, 13) - EPOCH) / 6e4); WX_FORCE = {w:14, d:270}; S.mult = 0.00001; const b = S.boat, g = GROUNDS[0].p; b.status = 'idle'; b.port = null; b.pos = {x:g.x, y:g.y}; b.v = 0; b.heading = 0;"
# where the map's left and right edges fall on the screen: the camera looks at the boat from cam.dist at cam.pitch (yaw 0 looks north,
# so the screen's x is the world's x), with the vertical field of view curFov
EDGE = """(() => { const D = G3._debug, F = D.foam, e = D.eye, bx = D.bv.x, bz = D.bv.z, W = innerWidth, H = innerHeight;
  const f = [bx - e[0], (D.bv.y || 0) - e[1], bz - e[2]], fl = Math.hypot(...f); f[0] /= fl; f[1] /= fl; f[2] /= fl;
  let r = [-f[2], 0, f[0]]; const rl = Math.hypot(r[0], r[2]); r = [r[0] / rl, 0, r[2] / rl]; const u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
  const t = Math.tan(D.curFov / 2), sx = p => { const d = [p[0] - e[0], p[1] - e[1], p[2] - e[2]], z = d[0] * f[0] + d[1] * f[1] + d[2] * f[2]; return [W / 2 + (d[0] * r[0] + d[1] * r[1] + d[2] * r[2]) / z / (t * W / H) * W / 2, H / 2 - (d[0] * u[0] + d[1] * u[1] + d[2] * u[2]) / z / t * H / 2]; };
  const x0 = F.ox, x1 = F.ox + F.M; return {M:F.M, x0:x0 - bx, x1:x1 - bx, L:sx([x0, 0, bz])[0], R:sx([x1, 0, bz])[0], C:sx([bx, 0, bz]), W, H}; })()"""

def steps(path, y0, y1, half=14):
    im = Image.open(path).convert('L'); W, H = im.size; px = im.load()
    col = [sum(1 for y in range(y0, y1) if px[x, y] > 128) / (y1 - y0) for x in range(W)]
    st = [0.0] * W
    for x in range(half, W - half): st[x] = sum(col[x:x + half]) / half - sum(col[x - half:x]) / half
    return col, st

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 320, 'height': 200})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg); await pg.evaluate(SETUP)
        await pg.wait_for_function("G3.isActive() && G3._debug.SSL.w.on && G3._debug.SSL.n.on", timeout=900000)
        await pg.set_viewport_size({'width': 1280, 'height': 800})
        await pg.evaluate("(() => { const D = G3._debug; D.foam.tauC = 60; const c = D.cam; c.helm = false; c.dist = 520; c.pitch = 1.45; c.yaw = 0; c.zoom = 1; D.seaDbg = true; })()")
        # (the tails build up frame by frame: a frame takes seconds in SwiftShader)
        f0 = await pg.evaluate("G3._debug.foam.n"); await pg.wait_for_timeout(90000); f1 = await pg.evaluate("G3._debug.foam.n")
        E = await pg.evaluate(EDGE)
        os.makedirs('skumkant', exist_ok=True); f = 'skumkant/ovenfra_skum.png'; await pg.screenshot(path=f, timeout=300000)
        await pg.evaluate("G3._debug.seaDbg = false"); await pg.wait_for_timeout(8000); await pg.screenshot(path='skumkant/ovenfra.png', timeout=300000)
        y0, y1 = int(E['H'] * 0.08), int(E['H'] * 0.68)   # (the sea between the top bar and the buttons)
        col, st = steps(f, y0, y1)
        W = len(col); near = lambda x, c: abs(x - c) <= 30
        inL = 40 < E['L'] < W - 40; inR = 40 < E['R'] < W - 40
        eL = max((abs(st[x]) for x in range(W) if near(x, E['L'])), default=0) if inL else None
        eR = max((abs(st[x]) for x in range(W) if near(x, E['R'])), default=0) if inR else None
        rest = sorted(abs(st[x]) for x in range(40, W - 40) if not near(x, E['L']) and not near(x, E['R']))
        q95 = rest[int(len(rest) * 0.95)] if rest else 0
        mean = sum(col) / W
        print('frames of the foam map meanwhile:', f1 - f0, '· map', E['M'], 'm, edges', round(E['x0']), round(E['x1']), 'm from the boat, on the screen at x =', round(E['L']), round(E['R']), '· white', round(mean * 100, 2), '%')
        print('step across the edges', eL and round(eL, 4), eR and round(eR, 4), '· elsewhere (95th percentile)', round(q95, 4))
        edge = max(e for e in (eL, eR) if e is not None) if (inL or inR) else None
        print(ok(f1 - f0 >= 5 and mean > 0.003), 'the foam map ran and there is foam to see from above', {'frames': f1 - f0, 'white': round(mean, 4)})
        print(ok(edge is not None and edge <= max(2.0 * q95, 0.004)), 'no square: the step in the foam where the map ends is no larger than the steps elsewhere (within twice the 95th percentile)', {'edge': edge and round(edge, 4), 'q95': round(q95, 4)})
        print('sidefeil:', errs[:3]); await b.close()

asyncio.run(main())
