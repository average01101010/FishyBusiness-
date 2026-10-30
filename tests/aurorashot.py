"""The aurora (view3d.js sky shader, core auroraAt; Jonas' list 04.10.2026, «realistiske draperier med stråler»): pictures of the
north sky from the bridge on a clear January night at three strengths, and the sky without aurora. Checks that the curtains light the
sky green where they stand, more the stronger they are, that it is drawn without GL errors, and that the activity needs a stronger
night further south (Senja against Oslo). Pictures aurora_*.png. Prints OK or FEIL."""
from _env import GAME, boot
import asyncio, io, json
from PIL import Image
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra)) if extra != '' else ''))


SET = """(() => { const b = S.boat; S.t = Math.round((Date.UTC(2027, 0, 12, 21) - EPOCH) / 6e4); S.mult = 0; b.heading = 0; b.v = 0;
  window.__cloud = cloudAt; cloudAt = () => 0.03; precipAt = () => 0; window.__aur = auroraAt;
  const c = G3._debug.cam; c.helm = true; c.hy = 0; c.hp = 0.32; return sunAt(S.t / 60).el; })()"""


def sky(png):
    im = Image.open(io.BytesIO(png)).convert('RGB'); w, h = im.size
    box = im.crop((int(w * 0.1), int(h * 0.05), int(w * 0.9), int(h * 0.45))).resize((64, 32))
    px = list(box.get_flattened_data()) if hasattr(box, "get_flattened_data") else list(box.getdata()); n = len(px)
    return {'g': round(sum(p[1] for p in px) / n, 1), 'r': round(sum(p[0] for p in px) / n, 1), 'b': round(sum(p[2] for p in px) / n, 1)}


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await br.new_page(viewport={'width': 1100, 'height': 700}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(2500)
        el = await pg.evaluate(SET); await pg.wait_for_timeout(1500)
        res = {}
        for a in (0, 0.3, 0.7, 1.0):
            await pg.evaluate(f"auroraAt = () => {a}"); await pg.wait_for_timeout(1200)
            png = await pg.screenshot(path=f'aurora_{int(a * 100)}.png'); res[a] = sky(png)
        gerr = await pg.evaluate("G3._debug.glErr()")
        lat = await pg.evaluate("""(() => { auroraAt = window.__aur; const H = S.t / 60; let n = 0, s = 0, k = 0;
          for (let h = 0; h < 24 * 60; h += 7){ const t = H + h; if (sunAt(t, P(69.4, 17.5)).el > -7 || sunAt(t, P(59.6, 10.6)).el > -7) continue; k++;
            if (auroraAt(t, P(69.4, 17.5)) > 0.05) n++; if (auroraAt(t, P(59.6, 10.6)) > 0.05) s++; }
          cloudAt = window.__cloud; return {nights:k, senja:n, oslo:s}; })()""")
        print('sky:', json.dumps({str(k): v for k, v in res.items()}), 'sun', round(el, 1))
        check(el < -7 and res[0.7]['g'] > res[0]['g'] + 3 and res[1.0]['g'] > res[0.3]['g'] and res[0.7]['g'] > res[0.7]['r'], 'the curtains light the north sky green, more the stronger the night', {k: res[k]['g'] for k in res})
        check(gerr == 0, 'the aurora is drawn without GL errors', gerr)
        check(lat['senja'] > lat['oslo'] * 2 and lat['oslo'] >= 0, 'the aurora is seen far more often at Senja than at Oslo on the same nights', lat)
        print('errors:', errs[:5])
        await br.close()

asyncio.run(main())
