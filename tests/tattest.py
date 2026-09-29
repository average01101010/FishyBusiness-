from _env import GAME
# Sailors' tattoos (T): rewards that come by themselves. The counters count what you do yourself, aboard; four tattoos need waters
# beyond Senja and stay locked. The Seaman app shows them on a figure.
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':900, 'height':900})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(GAME); await pg.wait_for_timeout(1200); await pg.click('#obGo'); await pg.wait_for_timeout(400)
        r = await pg.evaluate("""(()=>{
          S.tut = 0; S.cash = 1e7; S.settings.autoOn = false; S.t = Math.round((Date.UTC(2027, 5, 9, 8) - EPOCH) / 6e4); S.tattoos = {}; S.tat = {}; S.deckMe = 0;
          const R = {}, b = S.boat, q = portById('finnsnes'), m0 = S.msgs.length;
          // a trip with you aboard: the miles count, and a trip home without trouble counts as safe
          b.status = 'port'; b.port = 'finnsnes'; b.pos = {...q.p}; S.plan = {wps:[{x:q.p.x - 1.5, y:q.p.y + 0.3, port:null, fish:0}, {x:q.p.x, y:q.p.y, port:'finnsnes', fish:0}], idx:0, speed:20, returning:false}; depart();
          for (let i = 0; i < 400 && b.status !== 'port'; i++) step(); R.trip = {st:b.status, nm:Math.round((S.tat.nm || 0) * 100) / 100, safe:S.tat.safe || 0};
          // without you aboard the miles do not count
          const nm0 = S.tat.nm; S.me = 'nobody'; b.status = 'sailing'; S.plan = {wps:[{x:q.p.x - 1.5, y:q.p.y + 0.3, port:null, fish:0}], idx:0, speed:20, returning:false}; for (let i = 0; i < 5; i++) step(); R.notAboard = S.tat.nm === nm0; S.me = S.cur;
          // run aground, towed in: not a safe trip, but the pig and the rooster
          b.status = 'port'; b.port = 'finnsnes'; b.pos = {...q.p}; S.plan = {wps:[{x:q.p.x - 1.5, y:q.p.y + 0.3, port:null, fish:0}], idx:0, speed:20, returning:false}; depart(); step(); step();
          const safe0 = S.tat.safe; runAground({...b.pos}); rescue(true); R.tow = {safe:S.tat.safe - safe0, rescued:S.tat.rescued, pig:!!S.tattoos.grishane};
          // the swallows, the deckhand's rope, the harpoon
          S.tat.nm = 5000; checkTattoos(); R.sw1 = !!S.tattoos.svale1 && !S.tattoos.svale2; S.tat.nm = 10000; checkTattoos(); R.sw2 = !!S.tattoos.svale2;
          S.deckMe = 99 * 60; checkTattoos(); R.rope0 = !!S.tattoos.tau; S.deckMe = 100 * 60; checkTattoos(); R.rope = !!S.tattoos.tau;
          newVesselObj('snekke', 'finnsnes'); newVesselObj('sjark', 'finnsnes'); checkTattoos(); R.harpoon = !!S.tattoos.harpun && S.fleet.length === 3;
          // loyalty: 50 landings at one plant; the star: 100 safe trips; crossed anchors: 50 trips with a full crew
          S.tat.plant = {husoy:50}; S.tat.safe = 100; S.tat.full = 50; checkTattoos(); R.rest = {rose:!!S.tattoos.rose, star:!!S.tattoos.stjerne, anchors:!!S.tattoos.ankere};
          // the four that need other waters stay locked
          S.tat.nm = 1e6; checkTattoos(); R.locked = ['anker', 'skilpadde', 'hula', 'neptun'].every(id => !S.tattoos[id]);
          R.msgs = S.msgs.slice(m0).filter(m => m.from === 'Sjømann').length; R.earned = Object.keys(S.tattoos).length;
          PHONE.open('sjomann'); const v = document.querySelector('.ph-appv'); R.app = {svg:v.querySelectorAll('svg').length, icons:v.querySelectorAll('svg g[transform^="translate"]').length, text:v.innerText.includes('Du har 8 av 12')};
          return R; })()""")
        print(json.dumps(r, ensure_ascii=False))
        await pg.screenshot(path='tattoos.png')
        print(ok(r['trip']['st'] == 'port' and r['trip']['nm'] > 1 and r['trip']['safe'] == 1), 'a trip with you aboard counts the nautical miles, and home without trouble counts as a safe trip')
        print(ok(r['notAboard']), 'without you aboard the miles do not count')
        print(ok(r['tow']['safe'] == 0 and r['tow']['rescued'] == 1 and r['tow']['pig']), 'run aground and towed in: not a safe trip, but the pig and the rooster')
        print(ok(r['sw1'] and r['sw2']), 'a swallow at 5,000 nm and the second at 10,000')
        print(ok(not r['rope0'] and r['rope']), 'the rope round the wrist after 100 hours of your own deck work')
        print(ok(r['harpoon'] and r['rest']['rose'] and r['rest']['star'] and r['rest']['anchors']), 'harpoon for three vessels; the rose, the star and the crossed anchors for their counts')
        print(ok(r['locked'] and r['earned'] == 8 and r['msgs'] == 8), 'the four that need other waters stay locked; a message for each one earned')
        print(ok(r['app']['text'] and r['app']['icons'] >= 8), 'the Seaman app shows them on the figure')
        print('errors:', errs[:4]); await b.close()
asyncio.run(main())
