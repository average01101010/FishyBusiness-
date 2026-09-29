from _env import GAME
import asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':480,'height':820})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(GAME); await pg.wait_for_timeout(1200); await pg.click('#obGo'); await pg.wait_for_timeout(400)
        # luck effect on a skrei day, with and without luxury luck (same random seed impossible, so average several days)
        eff = await pg.evaluate("""(()=>{ const run = (luckType) => { let tot = {torsk:0, all:0};
            for (let k = 0; k < 6; k++){ S.t = Math.round((Date.UTC(2028, 2, 6 + k, 7) - EPOCH) / 6e4); S.haill = luckType ? {type:luckType, t0:S.t - 60} : null; S.hold = []; S.facc = {}; S.fnext = {};
              S.boat.status = 'fishing'; S.boat.pos = {...GROUNDS[0].p}; S.boat.fishUntil = S.t + 240; S.boat.gear = true; S.equip.jukse = 0;
              for (let i = 0; i < 240 && S.boat.status === 'fishing'; i++){ S.t++; fish(S.t / 60, 5, 0.5); }
              tot.torsk += S.hold.filter(x => x.sp === 'torsk').reduce((a, x) => a + x.kg, 0); tot.all += holdTotal(); } return {torsk:Math.round(tot.torsk), all:Math.round(tot.all)}; };
          const r = {none:run(null), luksus:run('luksus'), kveit:run('kveit')};
          S.haill = {type:'haill', t0:S.t}; const f = []; for (const d of [0, 1.9, 3, 4.5, 6, 7.2]){ S.haill.t0 = S.t - d * 1440; f.push(+haillF().toFixed(2)); } r.decay = f;
          S.haill = null; S.boat.status = 'port'; S.boat.port = 'husoy'; S.boat.pos = {...portById('husoy').p}; S.hold = []; return r; })()""")
        print('luck:', json.dumps(eff))
        # shop
        await pg.evaluate("S.tut=0; S.cash=50000; S.t = Math.round((Date.UTC(2028, 2, 6, 18) - EPOCH) / 6e4); PHONE.open('haill')"); await pg.wait_for_timeout(500)
        await pg.evaluate("document.querySelector('[data-pa=haillbuy][data-k=luksus]').click()"); await pg.wait_for_timeout(400)
        await pg.screenshot(path='h1.png')
        print('after buy:', await pg.evaluate("JSON.stringify({h:S.haill && S.haill.type, f:haillF(), hud:document.querySelector('.haill') && document.querySelector('.haill').textContent})"))
        await pg.evaluate("PHONE.close && PHONE.close(); renderActs()"); await pg.wait_for_timeout(300)
        print('pub button:', await pg.evaluate("!!document.querySelector('#actbar [data-act=pub]')"))
        await pg.evaluate("document.querySelector('#actbar [data-act=pub]').click()"); await pg.wait_for_timeout(400)
        await pg.evaluate("document.querySelector('#pubUI [data-p=spin]').click()"); await pg.wait_for_timeout(2000); await pg.screenshot(path='h2.png')
        await pg.wait_for_timeout(4000); await pg.screenshot(path='h3.png')
        print('pub:', await pg.evaluate("JSON.stringify({cash:S.cash, pubE:S.pubE, ev:pubEvening(S.t/60), msg:document.querySelector('#pubUI .pubmsg').textContent, spinDisabled:document.querySelector('#pubUI [data-p=spin]').disabled, haill:S.haill && S.haill.type})"))
        await pg.evaluate("document.querySelector('#pubUI [data-p=close]').click(); renderActs()"); await pg.wait_for_timeout(300)
        print('pub button after round:', await pg.evaluate("!!document.querySelector('#actbar [data-act=pub]')"))
        # workshop overtime and rush
        await pg.evaluate("S.jobs = []; queueJob({kind:'repair', h:24, no:'Reparasjon av skrog', en:'Hull repair'}); PHONE.open('verksted')"); await pg.wait_for_timeout(500)
        u0 = await pg.evaluate("S.jobs[0].until - S.t"); c0 = await pg.evaluate("S.cash")
        await pg.evaluate("document.querySelector('[data-pa=jobOT]').click()"); await pg.wait_for_timeout(300)
        u1 = await pg.evaluate("S.jobs[0].until - S.t"); c1 = await pg.evaluate("S.cash")
        await pg.evaluate("document.querySelector('[data-pa=jobRush]').click()"); await pg.wait_for_timeout(1500)
        print('workshop: minutes left', round(u0), '->', round(u1), 'paid', c0 - c1, '; after rush jobs left:', await pg.evaluate("S.jobs.length"))
        await pg.evaluate("PHONE.close && PHONE.close(); S.haill={type:'luksus', t0:S.t}"); 
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(1500)
        await pg.evaluate("G3._debug.cam.helm=false; G3._debug.cam.dist=2.6; G3._debug.cam.pitch=0.25; G3._debug.cam.yaw=Math.PI;"); await pg.wait_for_timeout(4000); await pg.screenshot(path='h4.png')
        print('errors:', errs[:4]); await b.close()
asyncio.run(main())
