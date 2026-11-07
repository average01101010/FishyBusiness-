from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':480,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        pop = await pg.evaluate("""(()=>{ const N = 3000, g = []; for (let i = 0; i < N; i++) g.push(genCrew()); const band = a => a < 20 ? 0 : a < 30 ? 1 : a < 40 ? 2 : a < 50 ? 3 : a < 60 ? 4 : a < 70 ? 5 : 6, ages = [0,0,0,0,0,0,0]; g.forEach(c => ages[band(c.age)]++);
          const tr = {}; g.forEach(c => c.traits.forEach(t => tr[t] = (tr[t] || 0) + 1));
          return {agesPct:ages.map(v => +(v / N * 100).toFixed(1)), women:+(g.filter(c => c.sex === 'f').length / N * 100).toFixed(1), part:+(g.filter(c => c.bi).length / N * 100).toFixed(1), under30:+(g.filter(c => c.age < 30).length / N * 100).toFixed(1), ask:[Math.min(...g.map(c => c.ask)), Math.max(...g.map(c => c.ask))], topTraits:Object.entries(tr).sort((a, b) => b[1] - a[1]).slice(0, 5)}; })()""")
        print('population:', json.dumps(pop, ensure_ascii=False))
        # the crew exchange in port on the sjark (room for three)
        await pg.evaluate("S.tut=0; S.owned=['skiff','sjark']; S.boat.type='sjark'; Object.assign(BOAT, VESSELS.sjark); S.cash=200000; S.boat.status='port'; S.boat.port='husoy'; S.boat.pos={...portById('husoy').p}; S.bors=null; S.crew=[]; PHONE.open('bors')"); await pg.wait_for_timeout(500)
        await pg.screenshot(path='cr1.png')
        n = await pg.evaluate("S.bors.pool.length"); print('candidates in the exchange:', n, '· crew room', await pg.evaluate("BOAT.crewMax"))
        await pg.evaluate("document.querySelector('[data-pa=bneg]').click()"); await pg.wait_for_timeout(300)
        for i in range(3):
            ok = await pg.evaluate("(() => { const b = document.querySelector('[data-pa=bhire]:not([disabled])'); if (!b) return false; b.click(); return true; })()"); await pg.wait_for_timeout(250)
        print('hired:', await pg.evaluate("JSON.stringify(S.crew.map(c => [c.name, c.age, c.lv, Math.round(c.share*100)+'%', c.traits, c.known]))"))
        # four days of hard fishing with little rest
        sim = await pg.evaluate("""(()=>{ const log = []; S.cevt = null; S.workLog = [];
          S.clothes = {olje:4, varme:4}; for (let h = 0; h < 120; h++){ const fishing = (h % 24) >= 6 && (h % 24) < 16; if ((h % 24) === 16){ S.hold = [{sp:'torsk', cls:2, kg:600, n:120, bled:true, iced:true, hr:0, fresh:90, gut:false, hook:true}]; S.boat.status = 'port'; S.boat.port = 'husoy'; S.boat.pos = {...portById('husoy').p}; S.quota = null; sell(); } S.boat.status = fishing ? 'fishing' : 'port'; if (fishing){ S.boat.port = null; S.boat.pos = {...GROUNDS[0].p}; S.boat.fishUntil = S.t + 999; } else { S.boat.port = 'husoy'; S.boat.pos = {...portById('husoy').p}; }
            for (let m = 0; m < 60; m++){ S.t++; if (S.t % 60 === 0){ ordersTick(S.t / 60); crewTick(S.t / 60); } }
            if (h % 12 === 11) log.push({h:h + 1, crew:S.crew.map(c => [c.name.split(' ')[0], Math.round(c.morale), Math.round(c.fatigue)]), conflict:S.cevt ? S.cevt.type + ':' + S.cevt.topic : null, eff:+teamEff(crewAboard()).toFixed(2)}); }
          return {log, msgs:S.msgs.slice(-6).map(m => (m.from || '') + ': ' + (m.no || '').slice(0, 90))}; })()""")
        for r in sim['log']: print(json.dumps(r, ensure_ascii=False))
        print('messages:'); [print('  ', m) for m in sim['msgs']]
        # force a quarrel if none came, then settle it through the Crew app
        await pg.evaluate("if (S.crew.length < 2){ S.crew = [genCrew(), genCrew()]; } if (!S.cevt && S.crew.length >= 2) S.cevt = {type:'pair', a:S.crew[0].id, b:S.crew[1].id, topic:'sloying', t0:S.t}; PHONE.open('mannskap')"); await pg.wait_for_timeout(500)
        await pg.screenshot(path='cr2.png')
        before = await pg.evaluate("JSON.stringify(S.crew.map(c => Math.round(c.morale)))")
        await pg.evaluate("document.querySelector('[data-pa=cres][data-o=talk], [data-pa=cres][data-o=listen]').click()"); await pg.wait_for_timeout(300)
        print('resolved:', await pg.evaluate("S.cevt === null"), 'morale', before, '->', await pg.evaluate("JSON.stringify(S.crew.map(c => Math.round(c.morale)))"))
        print('errors:', errs[:4]); await b.close()
asyncio.run(main())
