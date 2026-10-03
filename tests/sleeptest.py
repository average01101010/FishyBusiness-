"""Sleep (core/15-energy.js, ui/05b-work.js; the user 03.10.2026: «Karakteren min har sovet kjempelenge»): asleep at sea the clock runs
ten times faster, so eight hours of sleep are minutes and not over an hour of a black screen, and «Spol fram til du våkner» plays the
rest at once: you wake with 60 % and the crew has carried on. Prints OK or FEIL."""
from _env import GAME, boot
import asyncio
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await (await b.new_context(viewport={'width': 1100, 'height': 760})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        await pg.wait_for_function("SIMREADY && S.boat.status === 'port'", timeout=60000)
        r0 = await pg.evaluate("simRate()")
        # at sea with a hand aboard, worn out: you fall asleep, the crew has the helm
        await pg.evaluate("""(() => { const b = S.boat; S.tut = 0; S.settings.autoOn = false; S.crew = [Object.assign(genCrew(), {bi:false, off:false, fatigue:10, morale:62, traits:[]})]; S.me = S.cur; b.status = 'idle'; b.port = null; S.energy = 0.001; step(); })()""")
        s = await pg.evaluate("({zz:asleep(), rate:simRate(), left:S.sleep ? S.sleep.until - S.t : null})")
        await pg.wait_for_timeout(600)
        vis = await pg.evaluate("!document.getElementById('sleep').hidden && getComputedStyle(document.getElementById('slSkip')).display !== 'none'")
        check(s['zz'] and s['rate'] == r0 * 10 and vis, 'du sovner på sjøen, klokka går ti ganger fortere, og «Spol fram» vises', (s, r0, vis))
        t0 = await pg.evaluate("S.t"); await pg.click('#slSkip'); await pg.wait_for_timeout(500)
        e = await pg.evaluate("({zz:asleep(), en:Math.round(S.energy), t:S.t})")
        check(not e['zz'] and e['en'] == 60 and e['t'] - t0 >= s['left'] - 1, '«Spol fram» spiller resten av søvnen: du våkner med 60 %', (e, s['left']))
        print('errors:', errs[:5])
        await b.close()


asyncio.run(main())
