"""The daily login bonus that replaced «Kaffe på kaia»: +1 % a day, −3 % for each day away, nothing for a clock turned back,
its own row on the landing note, and old saves migrated. The device date is moved with localStorage.__dayoff (days)."""
from _env import GAME
import asyncio, json
from playwright.async_api import async_playwright

SHIFT = """(() => { const inj = localStorage.getItem('__inject'); if (inj){ localStorage.setItem('kystfiske_proto_v1', inj); localStorage.removeItem('__inject'); } })();
(() => { const off = +(localStorage.getItem('__dayoff') || 0) * 864e5; if (!off) return;
  const RD = Date; class D extends RD { constructor(...a){ if (a.length) super(...a); else super(RD.now() + off); } static now(){ return RD.now() + off; } }
  window.Date = D; })();"""


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        ctx = await b.new_context(viewport={'width': 900, 'height': 820})
        await ctx.add_init_script(SHIFT)
        pg = await ctx.new_page()
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        st = lambda: pg.evaluate("JSON.stringify(S.streak)")

        await pg.goto(GAME); await pg.wait_for_timeout(1200); await pg.click('#obGo'); await pg.wait_for_timeout(400)
        s = json.loads(await st())
        check(s['pct'] == 1 and s['days'] == 1, 'første dag gir +1 %', s)
        check(not await pg.evaluate("!!document.getElementById('dailyBtn') || !!document.getElementById('dailyUI') || typeof DAILYW !== 'undefined'"), 'Kaffe på kaia er borte')

        async def day(n):
            await pg.evaluate("n => { save(); localStorage.setItem('__dayoff', n); }", n)
            await pg.reload(); await pg.wait_for_timeout(1500)
            return json.loads(await st())

        s = await day(1)
        check(s['pct'] == 2 and s['days'] == 2, 'neste dag gir +2 %', s)
        s2 = json.loads(await pg.evaluate("(() => { streakTouch(); return JSON.stringify(S.streak); })()"))
        check(s2['pct'] == 2, 'samme dag gir ikke mer', s2)
        await pg.evaluate("S.streak.pct = 10; save()")
        s = await day(4)
        check(s['pct'] == 5, 'to tapte dager: 10 − 6 + 1 = 5 %', s)
        s = await day(2)
        check(s['pct'] == 5, 'klokka tilbake gir ingen endring', s)
        s = await day(5)
        check(s['pct'] == 6, 'dagen etter igjen gir +1 %', s)

        # the bonus on the landing note: its own row, and the crew share includes it
        await pg.evaluate("document.querySelectorAll('#modal [data-close]').forEach(x => x.click())")
        r = json.loads(await pg.evaluate("""(() => { const b = S.boat, q = portById('botnhamn');
          b.status = 'port'; b.port = 'botnhamn'; b.pos = {x:q.p.x, y:q.p.y}; S.streak.pct = 20;
          S.hold = [{sp:'torsk', cls:2, kg:200, n:50, bled:true, iced:true, hr:0, fresh:90, gut:false}];
          const cash0 = S.cash; sell(); const ls = S.lastSale;
          const fish = ls.lines.reduce((a, r) => a + r.sum, 0);
          return JSON.stringify({pct:ls.streak.pct, kr:ls.streak.kr, want:Math.round(fish * 0.2), total:Math.round(ls.total), fish:Math.round(fish), got:Math.round(S.cash - cash0), lott:ls.lott}); })()"""))
        check(r['pct'] == 20 and r['kr'] == r['want'] and r['kr'] > 0, 'bonusen er 20 % av fisken', r)
        check(abs(r['total'] - (r['fish'] + r['kr'])) <= 1 and abs(r['got'] - r['total']) <= 1, 'bonusen går inn i oppgjøret', r)
        await pg.evaluate("tab = 'port'; renderPanel()"); await pg.wait_for_timeout(300)
        row = await pg.evaluate("[...document.querySelectorAll('#panel td')].some(td => /Innloggingsbonus \\+20 %/.test(td.textContent))")
        check(row, 'sluttseddelen har en egen bonuslinje')
        await pg.evaluate("PHONE.open('salg')"); await pg.wait_for_timeout(300)
        card = await pg.evaluate("document.querySelector('#phone .ph-card h4').textContent")
        check('Innloggingsbonus' in card and '+20' in card, 'Salg-appen viser bonusen', card)
        await pg.screenshot(path='streak_salg.png')

        # an old save with coffee state: unused free pub rounds are paid out, tubs and clean hull are gone
        old = json.loads(await pg.evaluate("(() => { const o = JSON.parse(localStorage.getItem(KEY)); o.daily = {last:'2026-09-01', streak:4, total:9, restW:-1, pubV:2}; o.tubs = 110; o.clean = o.t + 999; o.streak = undefined; o.cash = 5000; if (o.fleet) for (const v of o.fleet){ v.tubs = 110; v.clean = 1; } localStorage.setItem('__inject', JSON.stringify(o)); return JSON.stringify({cash:o.cash}); })()"))
        await pg.reload(); await pg.wait_for_timeout(1500)
        r = json.loads(await pg.evaluate("JSON.stringify({cash:S.cash, daily:S.daily === undefined, tubs:S.tubs === undefined, clean:S.clean === undefined, fleetTubs:(S.fleet || []).some(v => 'tubs' in v), cap:capHold() === BOAT.holdCap, pct:S.streak.pct})"))
        check(r['cash'] == old['cash'] + 2000 and r['daily'] and r['tubs'] and r['clean'] and not r['fleetTubs'] and r['cap'], 'gammel lagring: pubrunder betalt ut, kar og skrogvask fjernet', r)
        check(r['pct'] == 1, 'bonusen starter på null for gamle lagringer og får dagens 1 %', r['pct'])
        print('sidefeil', errs)
        await b.close()

asyncio.run(main())
