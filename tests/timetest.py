"""Time shown to the player: the clock runs six times as fast, real-time countdowns next to game times, and the «Neste»
chip in the HUD. Prints OK or FEIL per check."""
from _env import GAME, ROUTES
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


async def main():
    route = json.load(open(ROUTES))['4']
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1293, 'height': 830})
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(GAME); await pg.wait_for_timeout(1200)
        intro = await pg.evaluate("t('intro3')")
        check('seks ganger' in intro, 'introen sier seks ganger så fort', intro[:50])
        await pg.click('#obGo'); await pg.wait_for_timeout(400)
        opts = await pg.evaluate("[...document.querySelectorAll('#pace option')].map(o => o.textContent)")
        check(opts == ['6× (normalt)', '180×', '1\xa0800×', '10\xa0800×'], 'tempovalgene viser hva de gir', opts)

        v = await pg.evaluate("S.mult = 1; [realDur(0.5), realDur(6), realDur(60), realDur(600), realDur(6 * 60 * 26), inReal(90)]")
        check(v == ['under 1 min', '1 min', '10 min', '1 t 40 min', '1 d 2 t', 'om 15 min'], 'ekte tid regnes med 6×', v)
        v2 = await pg.evaluate("S.mult = 30; const r = realDur(60 * 18); S.mult = 1; r")
        check(v2 == '6 min', 'og med testtempo 180×', v2)

        # the route estimate: sailing time in game hours and the real time next to it
        await pg.evaluate("w => { S.draft = w.map((q, i) => ({x:q.x, y:q.y, port:null, fish:i === w.length - 1 ? 2 : 0})); w.slice(0, -1).reverse().forEach(q => S.draft.push({x:q.x, y:q.y, port:null, fish:0})); tab = 'route'; renderPanel(); }", route)
        r = json.loads(await pg.evaluate("(() => { const e = estimate(); const txt = [...document.querySelectorAll('#panel .kv')].map(k => k.textContent).find(s => /Seilingstid/.test(s)) || ''; return JSON.stringify({h:e.hours, want:realDur(e.hours * 60), txt}); })()"))
        check(r['want'] in r['txt'] and 'ekte tid' in r['txt'], 'ruteanslaget viser riktig ekte tid', r)

        # the Neste chip: planned departure, sailing, fishing, landing
        chip = lambda: pg.evaluate("(document.querySelector('#hud .st.nx') || {}).textContent || ''")
        await pg.evaluate("S.draftDep = S.t + 120; doAct({dataset:{act:'start'}}); renderHud()")
        c = await chip()
        check(c.startswith('⏱ Avgang om 20 min'), 'planlagt avgang om 20 min', c)
        await pg.evaluate("S.plan.depAt = S.t + 1; for (let i = 0; i < 14; i++) step(); renderHud()")
        c = await chip()
        check('Fremme' in c and 'om' in c, 'underveis: når båten er fremme', c)
        await pg.evaluate("const b = S.boat; b.status = 'fishing'; b.fishUntil = S.t + 90; renderHud(); renderActs()")
        c = await chip()
        stop = await pg.evaluate("document.getElementById('dockInfo').textContent")
        check('Fisket er ferdig om 15 min' in c and 'om 15 min' in stop, 'fisket: nedtelling i HUD og på stoppknappen', [c, stop])
        await pg.evaluate("""(() => { const b = S.boat, q = portById('botnhamn'); S.plan = null; b.status = 'port'; b.port = 'botnhamn'; b.pos = {x:q.p.x, y:q.p.y}; b.fishUntil = null;
          S.hold = [{sp:'torsk', cls:2, kg:120, n:30, bled:true, iced:true, hr:0, fresh:90, gut:false}]; startLanding(); renderHud(); tab = 'port'; renderPanel(); })()""")
        c = await chip()
        note = await pg.evaluate("[...document.querySelectorAll('#panel p.note')].map(p => p.textContent).find(s => /Sluttseddelen/.test(s)) || ''")
        check(c.startswith('⏱ Sluttseddelen om') and ' · om ' in note, 'lossing: seddelen med nedtelling', [c, note[-40:]])
        await pg.screenshot(path='time_hud.png', clip={'x': 0, 'y': 0, 'width': 320, 'height': 220})
        print('sidefeil', errs)
        await b.close()

asyncio.run(main())
