"""Lights that light up round them at night (view3d.js pickLights, PLG; the user's wish 03.10.2026): in Finnsnes on a January night the
boat's deck light and the quay's floodlights are picked and light the scene (brighter than with them off), on «Lav» at most two, none
by day; off Hekkingen the lighthouse's beams sweep round. Pictures: light_night.png, light_off.png, light_beam.png. Prints OK or FEIL."""
from _env import GAME, boot
import asyncio, json
from PIL import Image, ImageStat
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


NL = "(() => { const A = G3._debug.PLA, C = G3._debug.PCA; let n = 0; for (let i = 0; i < 8; i++) if (A[i * 4 + 3] > 0 && C[i * 3] + C[i * 3 + 1] + C[i * 3 + 2] > 0) n++; return n; })()"


def lum(path, box):
    return ImageStat.Stat(Image.open(path).convert('L').crop(box)).mean[0]


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 900, 'height': 640}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        await pg.evaluate("S.t = Math.round((Date.UTC(2027, 0, 12, 22) - EPOCH) / 6e4); S.mult = 0; const b = S.boat, q = portById('finnsnes'); b.status = 'port'; b.port = 'finnsnes'; b.pos = {x:q.p.x, y:q.p.y}; b.berth = 'main'; b.moorT = S.t - 60")
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(4000)
        await pg.evaluate("(() => { const c = G3._debug.cam; c.helm = false; c.dist = 38; c.pitch = 0.32; c.yaw = 2.4; })()"); await pg.wait_for_timeout(2500)
        n = await pg.evaluate(NL); night = await pg.evaluate("G3._debug.env.night")
        await pg.screenshot(path='light_night.png', timeout=120000)
        await pg.evaluate("G3._debug.noPL = true"); await pg.wait_for_timeout(1500); await pg.screenshot(path='light_off.png', timeout=120000)
        await pg.evaluate("G3._debug.noPL = false")
        box = (0, 160, 900, 640); on, off = lum('light_night.png', box), lum('light_off.png', box)
        check(night > 0.5 and n >= 2, 'en januarnatt i Finnsnes er dekkslyset og lyskasterne på kaia valgt', {'lys': n, 'natt': round(night, 2)})
        check(on > off * 1.08 + 0.5, 'og de lyser opp rundt seg: bildet er lysere med dem enn uten', {'med': round(on, 1), 'uten': round(off, 1)})
        # the tests' #qfix holds «Høy»: let go of it first, as teleport3d does
        await pg.evaluate("() => { G3._debug.QUAL.fix = false; G3.quality('low'); }"); await pg.wait_for_timeout(2500); nl = await pg.evaluate(NL)
        await pg.evaluate("() => { G3.quality('high'); G3._debug.QUAL.fix = true; }"); await pg.wait_for_timeout(1500)
        check(1 <= nl <= 2, 'på «Lav» høyst to lys', nl)
        # off Hekkingen fyr: its two beams turn
        await pg.evaluate("(() => { const L = SEAMARKS.lights.find(l => l[7] === 'Hekkingen'); const b = S.boat; b.status = 'idle'; b.port = null; b.pos = {x:L[0] + 2.2, y:L[1] + 1.2}; b.v = 0; b.heading = 4.9; })()")
        await pg.wait_for_timeout(5000)
        await pg.evaluate("(() => { const c = G3._debug.cam; c.helm = false; c.dist = 30; c.pitch = 0.12; const L = SEAMARKS.lights.find(l => l[7] === 'Hekkingen'); const e = G3._debug.bv; c.yaw = Math.atan2(L[0] * 1000 - e.x, -(L[1] * 1000 - e.z)) - G3._debug.bv.head + Math.PI; })()")
        await pg.wait_for_timeout(2500); nb = await pg.evaluate("G3._debug.beams"); await pg.screenshot(path='light_beam.png', timeout=120000)
        check(nb >= 1, 'ved Hekkingen fyr sveiper lyskjeglene rundt (to kjegler per fyr)', nb)
        # by day nothing is picked
        await pg.evaluate("S.t = Math.round((Date.UTC(2027, 5, 12, 12) - EPOCH) / 6e4)"); await pg.wait_for_timeout(2500)
        nd = await pg.evaluate(NL); nbd = await pg.evaluate("G3._debug.beams")
        check(nd == 0 and nbd == 0, 'om dagen lyser ingen av dem', (nd, nbd))
        gerr = await pg.evaluate("G3._debug.glErr()")
        check(gerr == 0, 'ingen GL-feil', gerr)
        print('errors:', errs[:5])
        await b.close()


asyncio.run(main())
