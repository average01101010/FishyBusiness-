from _env import GAME
import asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':480,'height':820})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(GAME); await pg.wait_for_timeout(1200); await pg.click('#obGo'); await pg.wait_for_timeout(400)
        await pg.evaluate("S.tut=0; S.daily=null; DAILYW.auto()"); await pg.wait_for_timeout(500)
        print('opens by itself:', await pg.evaluate("!document.getElementById('dailyUI').hidden"), '· dot on button:', await pg.evaluate("document.getElementById('dailyBtn').classList.contains('dot')"))
        await pg.screenshot(path='d1.png')
        c0 = await pg.evaluate("S.cash"); await pg.click('#dailyUI [data-d=claim]'); await pg.wait_for_timeout(300)
        c1 = await pg.evaluate("S.cash"); await pg.click('#dailyUI [data-d=cup][data-i="1"]'); await pg.wait_for_timeout(300)
        print('day 1: +', c1 - c0, 'kr; after cup:', await pg.evaluate("S.cash") - c0, 'kr; state', await pg.evaluate("JSON.stringify(S.daily)"))
        await pg.screenshot(path='d2.png')
        # streak rules, relative to today
        r = await pg.evaluate("""(()=>{ const t = dayNum(dayKey()), key = n => { const d = new Date(Date.UTC(1970, 0, 1) + n * 864e5); return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0'); }, wk = Math.floor((t + 3) / 7);
          const T = (gap, streak, restW) => { S.daily = {last:key(t - gap), streak, total:20, restW, pubV:0}; return dailyNext(); };
          return {yesterday:T(1, 4, -1), missed1_rest:T(2, 4, -1), missed2_rest:T(3, 4, -1), missed3_restUsed:T(4, 4, wk), long_break:T(30, 6, -1)}; })()""")
        for k,v in r.items(): print('  ', k, '-> streak', v['streak'], '(rest day used)' if v['rest'] else '', '(lost %d)' % v['lost'] if v['lost'] else '')
        # milestone at 10 days
        await pg.evaluate("S.daily = {last:null, streak:0, total:9, restW:-1, pubV:0}; S.daily.last = null;"); c2 = await pg.evaluate("S.cash")
        await pg.evaluate("DAILYW.claim(); DAILYW.close();"); print('milestone 10 days: +', await pg.evaluate("S.cash") - c2, 'kr (1 000 day 1 + 10 000 milestone + cup)')
        # free pub round
        await pg.evaluate("S.daily.pubV = 1; S.t = Math.round((Date.UTC(2028, 2, 6, 19) - EPOCH) / 6e4); S.boat.status='port'; S.boat.port='husoy'; S.boat.pos={...portById('husoy').p}; S.pubE=-1; PUBW.open();"); await pg.wait_for_timeout(300)
        lab = await pg.evaluate("document.querySelector('#pubUI [data-p=spin]').textContent"); c3 = await pg.evaluate("S.cash")
        await pg.evaluate("document.querySelector('#pubUI [data-p=spin]').click()"); await pg.wait_for_timeout(500)
        print('pub button:', lab, '· cash change:', await pg.evaluate("S.cash") - c3, '· vouchers left:', await pg.evaluate("S.daily.pubV"))
        print('errors:', errs[:3]); await b.close()
asyncio.run(main())
