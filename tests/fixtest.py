"""Fixes from playtest 1: the line hauler that locked the boat in port (A1), the pub evening (A3),
and a pub round that survives closing the app mid-spin (A4). Prints OK or FEIL per check."""
from _env import GAME
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        ctx = await b.new_context(viewport={'width': 900, 'height': 820})
        pg = await ctx.new_page()
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(GAME); await pg.wait_for_timeout(1200); await pg.click('#obGo'); await pg.wait_for_timeout(400)

        # A1: buy an electric hauler in the Equipment app, the job gets a length and finishes
        await pg.evaluate("S.cash = 100000; PHONE.open('utstyr')"); await pg.wait_for_timeout(400)
        await pg.evaluate("document.querySelector('[data-pa=equip][data-k=elhaler]').click()"); await pg.wait_for_timeout(300)
        j = await pg.evaluate("JSON.stringify(S.jobs.map(j => ({k:j.k, h:j.h, until:j.until})))")
        jobs = json.loads(j)
        check(len(jobs) == 1 and jobs[0]['h'] == 3 and isinstance(jobs[0]['until'], (int, float)), 'haleren får 3 t i verkstedet', j)
        await pg.evaluate("for (let i = 0; i < 200; i++) step()")
        r = await pg.evaluate("JSON.stringify({jobs:S.jobs.length, fitted:!!S.equip.elhaler})")
        check(json.loads(r) == {'jobs': 0, 'fitted': True}, 'haleren er montert og køen er tom', r)
        await pg.evaluate("PHONE.show && PHONE.show(false)")

        # A1: a broken job from an old save (no length, until saved as null) is repaired after a reload (the plotter, 4 h, suits
        # every boat; a hauler the skiff cannot carry would be paid back instead of fitted)
        await pg.evaluate("S.equip.plotter = false; S.jobs = [{kind:'fit', k:'plotter', no:'Montering', en:'Fitting', until:null}]; save()")
        await pg.reload(); await pg.wait_for_timeout(1500)
        r = await pg.evaluate("JSON.stringify(S.jobs.map(j => ({h:j.h, until:j.until})))")
        check(json.loads(r)[0]['h'] == 4, 'gammel jobb uten lengde får 4 t etter omlasting', r)
        await pg.evaluate("for (let i = 0; i < 300; i++) step()")
        r = await pg.evaluate("JSON.stringify({jobs:S.jobs.length, fitted:!!S.equip.plotter})")
        check(json.loads(r) == {'jobs': 0, 'fitted': True}, 'den reparerte jobben blir ferdig', r)

        # A3: the pub evening runs from 15:00 to 03:00 on the clock
        ev = await pg.evaluate("""(() => { const at = (d, h, m) => (Date.UTC(2027, 2, 1 + d, h, m) - EPOCH) / 36e5;
          return [pubEvening(at(0, 14, 59)), pubEvening(at(0, 15, 0)), pubEvening(at(0, 20, 59)), pubEvening(at(0, 21, 0)), pubEvening(at(1, 2, 59)), pubEvening(at(1, 15, 0))]; })()""")
        check(ev[1] == ev[2] == ev[3] == ev[4] and ev[0] == ev[1] - 1 and ev[5] == ev[1] + 1, 'pubkvelden er 15:00–03:00', ev)
        first = await pg.evaluate("(() => { const s = newState(); S.t = Math.round((Date.UTC(2027, 2, 1, 16) - EPOCH) / 6e4); return s.pubE !== pubEvening(S.t / 60); })()")
        check(first, 'puben er åpen den første kvelden', first)

        # A4 and A15: spin, reload mid-spin; paid once, prize kept, result shown, odds include the empty share
        await pg.evaluate("S.cash = 20000; S.pubE = -1e9; S.pubLast = null; S.haill = null; S.t = Math.round((Date.UTC(2027, 2, 3, 18) - EPOCH) / 6e4); PUBW.open()")
        await pg.wait_for_timeout(300)
        odds = await pg.evaluate("document.querySelector('#pubUI .pubodds').textContent")
        check('tomhendt 53 %' in odds, 'oddslinja viser tomhendt 53 %', odds[:60])
        await pg.evaluate("document.querySelector('#pubUI [data-p=spin]').click()"); await pg.wait_for_timeout(500)
        mid = json.loads(await pg.evaluate("JSON.stringify({cash:S.cash, last:S.pubLast, haill:S.haill && S.haill.type})"))
        await pg.reload(); await pg.wait_for_timeout(1500)
        after = json.loads(await pg.evaluate("JSON.stringify({cash:S.cash, last:S.pubLast, haill:S.haill && S.haill.type, ev:pubEvening(S.t / 60), pubE:S.pubE})"))
        won = after['last'] and after['last']['k'] in ('kveit', 'haill', 'luksus')
        check(after['cash'] == 19000 and after['last'] and after['pubE'] == after['ev'], 'runden er betalt én gang og lagret før hjulet', {'cash': after['cash'], 'k': (after['last'] or {}).get('k')})
        check((after['haill'] == after['last']['k']) if won else True, 'premien er med etter omlasting', after['haill'])
        await pg.evaluate("PUBW.open()"); await pg.wait_for_timeout(300)
        ui = json.loads(await pg.evaluate("JSON.stringify({msg:document.querySelector('#pubUI .pubmsg').textContent, dis:document.querySelector('#pubUI [data-p=spin]').disabled, why:(document.querySelector('#pubUI .pubwhy') || {}).textContent || ''})"))
        check(ui['msg'] == after['last']['m'] and ui['dis'] and 'kveldens runde' in ui['why'], 'puben viser resultatet og hvorfor knappen er grå', ui)
        bg = await pg.evaluate("getComputedStyle(document.querySelector('#pubUI [data-p=spin]')).backgroundColor")
        check(bg != 'rgb(201, 162, 39)', 'grå knapp er grå, ikke blek gull', bg)
        await pg.screenshot(path='fix_pub.png')
        print('sidefeil', errs)
        await b.close()

asyncio.run(main())
