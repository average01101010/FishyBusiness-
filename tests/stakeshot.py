"""Steg 107: the strip at an iron stake passed on the wrong side (the side its arrow points away from), in 3D, standing and lying.
A real stake from Senja's marks with its arrow (viser), the boat 80 m on the wrong side by hand at 4 knots, going across the arrow.
Prints what the strip says and writes docs/okter/2026-11-12-107/<format>-stake.png."""
from _env import GAME, boot
import asyncio, os
from playwright.async_api import async_playwright

DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'docs', 'okter', '2026-11-12-107')
os.makedirs(DIR, exist_ok=True)

# the nearest stake with an arrow to Gryllefjord where both 80 m points are water; the boat set 80 m opposite the arrow, heading across it
PUT = """async () => { const c = P(69.36, 17.06); await mapNeed(c, 6); await new Promise(r => setTimeout(r, 1500));
  const all = marksNear('marks', c.x, c.y, 6).filter(m => typeof m[4] === 'number' && m[2] !== 'C' && m[2] !== 'S').sort((a, b) => dist({x:a[0], y:a[1]}, c) - dist({x:b[0], y:b[1]}, c));
  for (const mk of all){ const gs = gridScale({x:mk[0], y:mk[1]}), g = gridGamma({x:mk[0], y:mk[1]}) * Math.PI / 180;
    const at = (brg, d) => { const a = brg * Math.PI / 180 - g; return {x:mk[0] + Math.sin(a) * d / 1000 * gs, y:mk[1] - Math.cos(a) * d / 1000 * gs}; };
    const w = at(mk[4] + 180, 80), r = at(mk[4], 80); if (isLand(w) || isLand(r) || !(depthF(w) > 3)) continue;
    const b = S.boat; b.port = null; b.anch = null; b.hove = null; b.gop = null; b.pos = {x:w.x, y:w.y}; b.heading = (mk[4] + 90) * Math.PI / 180 - g; b.v = 2; b.status = 'sailing'; b.dyn = null; DYN.line = null; DYN.dep = null;
    S.plan = null; S.trail = []; FART.w = null; FART.mk.clear(); SJV.at = -1; S.settings.manual = true; helmTake(); S.helm.thr = 0.35; S.helm.rud = 0;
    return {mk, w}; }
  return null; }"""


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        errs = []
        for fmt, vw, vh in (('staende', 800, 1280), ('liggende', 1280, 800)):
            pg = await (await br.new_context(viewport={'width': vw, 'height': vh}, device_scale_factor=2)).new_page()
            pg.on('pageerror', lambda e: errs.append(str(e)))
            await boot(pg)
            await pg.wait_for_function("SIMREADY && S.boat.status === 'port'", timeout=60000)
            r = await pg.evaluate(PUT)
            print(fmt, 'staken', r and r['mk'])
            said = ''
            for _ in range(20):
                await pg.wait_for_timeout(1000)
                s = await pg.evaluate("() => { const w = farvWarn(), nx = document.querySelector('#hud .st.nx'); return {w:w ? w.k : '', l3:nx ? nx.textContent : '', v:+(dynLive() ? dynPose().sog / KN_MS : S.boat.v).toFixed(1)}; }")
                if s['w'] == 'stake' and s['l3']: said = s; break
            await pg.wait_for_timeout(1500)
            await pg.screenshot(path=os.path.join(DIR, fmt + '-stake.png'))
            print(('OK  ' if said else 'FEIL'), fmt, 'stripa:', said)
            await pg.context.close()
        print('sidefeil', errs)
        await br.close()

if __name__ == '__main__': asyncio.run(main())
