"""The cloud on the fells (view3d 01-shaders.js fin(), 15-env-mooring.js computeEnv; Jonas' video 02.11.2026: with the camera still the
cloud boiled on the fells from frame to frame, and lay as a flat band). Under a full grey sky with the cloud base low, the camera held
still and high: pictures skodde_a.png and skodde_b.png 1.5 s apart, and skodde_c.png after the wind has changed by 0.3 m/s; skodde_hoy.png and skodde_hoy_tynn.png from high up under a full and a
thinner grey sky. Checks that
the cloud is drawn (the fells greyer than under a clear sky), that it hardly moves in 1.5 s with the camera still, that a small change
of the wind does not move it, and that it is drawn without GL errors. Prints OK or FEIL."""
from _env import GAME, boot
import asyncio, io, json
from PIL import Image, ImageChops
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra)) if extra != '' else ''))


SET = """(c => { const b = S.boat; S.t = Math.round((Date.UTC(2027, 1, 20, 12) - EPOCH) / 6e4); S.mult = 0; b.v = 0;
  window.__c = window.__c || cloudAt; cloudAt = () => c; precipAt = () => 0;
  const k = G3._debug.cam; k.helm = false; k.yaw = 0.55; k.pitch = 0.32; k.dist = 420; return 1; })"""


def diff(a, b):
    A = Image.open(io.BytesIO(a)).convert('L'); B = Image.open(io.BytesIO(b)).convert('L'); w, h = A.size
    box = (0, int(h * 0.05), w, int(h * 0.6)); d = ImageChops.difference(A.crop(box), B.crop(box))
    px = list(d.getdata()); return round(sum(px) / len(px), 2)


def grey(png):
    im = Image.open(io.BytesIO(png)).convert('RGB'); w, h = im.size; px = list(im.crop((0, int(h * 0.1), w, int(h * 0.55))).resize((80, 30)).getdata())
    return round(sum(max(p) - min(p) for p in px) / len(px), 1)   # the colour left: the cloud's grey has none


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await br.new_page(viewport={'width': 1100, 'height': 700}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(2500)
        await pg.evaluate(SET + "(0.05)"); await pg.wait_for_timeout(2500)
        clear = await pg.screenshot(path='skodde_klar.png')
        await pg.evaluate(SET + "(0.97)"); await pg.wait_for_timeout(3000)
        env = await pg.evaluate("(() => { const e = G3._debug.env || {}; return {cbase:e.cbase, cstr:e.cstr}; })()")
        a = await pg.screenshot(path='skodde_a.png'); await pg.wait_for_timeout(1500)
        b = await pg.screenshot(path='skodde_b.png')
        # a small change of the wind: windAt is read by the sea, which eases env.wind towards it
        await pg.evaluate("(() => { window.__w = windAt; windAt = (H, p) => window.__w(H, p) + 0.3; })()"); await pg.wait_for_timeout(1500)
        c = await pg.screenshot(path='skodde_c.png')
        # high up, as Jonas' picture over Tromsø 02.11.2026: the layer has a top, and from above it what is under it is under the cloud
        await pg.evaluate("(() => { const k = G3._debug.cam; k.dist = 6000; k.pitch = 0.55; })()"); await pg.wait_for_timeout(4000)
        await pg.screenshot(path='skodde_hoy.png')
        await pg.evaluate(SET + "(0.62)"); await pg.evaluate("(() => { const k = G3._debug.cam; k.dist = 6000; k.pitch = 0.55; })()"); await pg.wait_for_timeout(4000)
        await pg.screenshot(path='skodde_hoy_tynn.png')
        gerr = await pg.evaluate("G3._debug.glErr()")
        print('env', env, 'grey clear/cloud', grey(clear), grey(a), 'diff a-b', diff(a, b), 'b-c', diff(b, c), 'clear-a', diff(clear, a))
        check(grey(a) < grey(clear) * 0.85, 'the cloud greys the fells under a full grey sky', [grey(clear), grey(a)])
        check(diff(a, b) < 1.5, 'with the camera still the cloud hardly moves in 1.5 s', diff(a, b))
        check(diff(b, c) < 1.5, 'a change of the wind of 0.3 m/s does not move the cloud', diff(b, c))
        check(gerr == 0, 'drawn without GL errors', gerr)
        print('errors:', errs[:5])
        await br.close()

asyncio.run(main())
