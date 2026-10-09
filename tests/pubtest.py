# The pub in 3D (ui/09b-pub.js, ui/09c-pubsoc.js; tools/harbour/pub.py, Jonas 08.10.2026): from the Bygd fan into the room on a stool
# at the bar, the wheel's segments as the game's PUB_WHEEL, a tap on the wheel's label opens it, a round turns the wheel in 3D and it stops
# in the segment the draw picked, paid once; the bartender's round for the crew lifts their mood once an evening; the week's quiz pays for
# the right answers and is done once; the world's 3D view holds its frames while the pub is open and gets them back after.
import asyncio, json, math
from playwright.async_api import async_playwright
from _env import *
ok = lambda c: 'OK  ' if c else 'FEIL'

async def tap(pg, x, y):
    s = await pg.context.new_cdp_session(pg)
    await s.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x, 'y': y}]})
    await s.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-compositing'])
        ctx = await b.new_context(viewport={'width': 1000, 'height': 640}, has_touch=True); pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        await pg.evaluate("""(() => { S.tut = 0; S.cash = 50000; S.pubE = -1e9; S.pubLast = null; S.crewRoundE = null;
          S.t = Math.round((Date.UTC(2027, 2, 3, 19) - EPOCH) / 6e4); const q = portById(S.boat.port) || PORTS.find(x => x.mottak); S.boat.status = 'port'; S.boat.port = q.id; S.boat.pos = {...q.p};
          S.crew = [genCrew(), genCrew()].map(c => Object.assign(c, {morale:50, hiredT:S.t})); renderActs(); })()""")
        fan = await pg.evaluate("DOCK.items('bygd').some(x => x.id === 'pub' && !x.off)")
        print(ok(fan), 'Pub i Bygd-vifta kl. 19', fan)
        await pg.evaluate("doAct({dataset:{act:'pub'}, disabled:false})"); await pg.wait_for_timeout(2500)
        st = json.loads(await pg.evaluate("JSON.stringify({on:PUB3.isOpen(), a:!!PUB3.anchors, segs:PUB3.anchors && PUB3.anchors.wheel.segs, w:PUB_WHEEL, body:document.body.classList.contains('in-pub')})"))
        print(ok(st['on'] and st['a'] and st['body']), 'puben åpner i 3D', {k: st[k] for k in ('on', 'a', 'body')})
        tot = sum(w for _, w in st['w']); a = 0; same = len(st['segs'] or []) == len(st['w'])
        for (k, w), sg in zip(st['w'], st['segs'] or []):
            same = same and sg[0] == k and abs(sg[1] - a) < 0.01 and abs(sg[2] - (a + w / tot * 360)) < 0.01; a += w / tot * 360
        print(ok(same), 'hjulets felt i modellen er de samme som PUB_WHEEL')
        await pg.screenshot(path='pub_in.png')
        # the wheel's label, tapped with a finger
        await pg.evaluate("PUB3.look(-0.75, 0.02)"); await pg.wait_for_timeout(1200)
        lab = await pg.evaluate("(() => { const b = document.querySelector('#pub3 .pb-lab [data-s=wheel]'); if (!b || b.style.display === 'none') return null; const r = b.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()")
        if lab: await tap(pg, lab[0], lab[1]); await pg.wait_for_timeout(600)
        pn = await pg.evaluate("PUB3.panel")
        print(ok(pn == 'wheel'), 'trykk på hjulet åpner hjulet', {'lab': lab, 'panel': pn})
        await pg.evaluate("document.querySelector('#pub3 [data-q=spin]') && document.querySelector('#pub3 [data-q=spin]').click()"); await pg.wait_for_timeout(1500)
        await pg.screenshot(path='pub_spin.png')
        await pg.wait_for_function("!PUB3.busy", timeout=30000); await pg.wait_for_timeout(300)
        r = json.loads(await pg.evaluate("JSON.stringify({cash:S.cash, k:S.pubLast && S.pubLast.k, ev:pubEvening(S.t / 60), pubE:S.pubE, a:PUB3.wheelA, segs:PUB3.anchors.wheel.segs, why:(document.querySelector('#pub3 .pb-why') || {}).textContent || ''})"))
        top = (360 - math.degrees(r['a'])) % 360
        land = next((s for s in r['segs'] if s[1] <= top < s[2]), None)
        print(ok(r['cash'] == 49000 and r['pubE'] == r['ev']), 'runden er betalt én gang', r['cash'])
        print(ok(land and land[0] == r['k']), 'hjulet stopper i feltet trekningen valgte', {'top': round(top, 1), 'felt': land and land[0], 'trukket': r['k']})
        print(ok('kveldens runde' in r['why']), 'knappen sier hvorfor den er grå etterpå', r['why'][:50])
        await pg.screenshot(path='pub_wheel.png')
        # the bartender: a round for the crew
        await pg.evaluate("PUB3.openSpot('bartender')"); await pg.wait_for_timeout(300)
        m0 = await pg.evaluate("S.crew.map(c => c.morale)")
        await pg.evaluate("document.querySelector('#pub3 [data-q=round]') && document.querySelector('#pub3 [data-q=round]').click()"); await pg.wait_for_timeout(300)
        m1 = await pg.evaluate("JSON.stringify({m:S.crew.map(c => c.morale), cash:S.cash, e:S.crewRoundE === pubEvening(S.t / 60), dis:(document.querySelector('#pub3 [data-q=round]') || {}).disabled})")
        m1 = json.loads(m1)
        print(ok(not m0 or (all(b > a for a, b in zip(m0, m1['m'])) and m1['e'] and m1['dis'])), 'runde på mannskapet løfter stemningen én gang i kvelden', {'før': m0, 'etter': m1['m'], 'kr': m1['cash']})
        await pg.screenshot(path='pub_bar.png')
        # the week's quiz: five answers, paid for the right ones, then done
        await pg.evaluate("PUB3.openSpot('quiz')"); await pg.wait_for_timeout(300)
        c0 = await pg.evaluate("S.cash")
        for i in range(5):
            await pg.evaluate("(() => { const s = PUBSOC.quizSet(weekOf(S.t / 60)), Q = S.pubSoc.quiz, q = PUBSOC.QUIZ[s[Q.a.length]]; document.querySelector('#pub3 [data-q=\"qz:' + q[2] + '\"]').click(); })()"); await pg.wait_for_timeout(250)
        q = json.loads(await pg.evaluate("JSON.stringify({cash:S.cash, n:S.pubSoc.quiz.a.length, left:document.querySelectorAll('#pub3 [data-q^=qz]').length, ach:(S.ach && S.ach.c && S.ach.c.quiz) || 0})"))
        print(ok(q['cash'] - c0 == 2000 and q['n'] == 5 and q['left'] == 0 and q['ach'] == 1), 'quizen betaler 400 kr per riktig svar og er ferdig for uka', q)
        await pg.screenshot(path='pub_quiz.png')
        # the room from the stool, turned to the tables; then out again
        await pg.evaluate("PUB3.openSpot('board')"); await pg.wait_for_timeout(300); await pg.screenshot(path='pub_board.png')
        await pg.evaluate("document.querySelector('#pub3 [data-q=x]').click(); PUB3.look(2.6, -0.12)"); await pg.wait_for_timeout(1500); await pg.screenshot(path='pub_room.png')
        await pg.evaluate("document.querySelector('#pub3 [data-q=out]').click()"); await pg.wait_for_timeout(400)
        out = json.loads(await pg.evaluate("JSON.stringify({on:PUB3.isOpen(), body:document.body.classList.contains('in-pub')})"))
        print(ok(not out['on'] and not out['body']), 'Gå ut lukker puben', out)
        # closing time throws you out
        await pg.evaluate("PUB3.open(); S.t = Math.round((Date.UTC(2027, 2, 4, 4) - EPOCH) / 6e4)"); await pg.wait_for_timeout(1600)
        print(ok(not await pg.evaluate("PUB3.isOpen()")), 'puben stenger klokka 03')
        print('sidefeil', errs)
        await b.close()

asyncio.run(main())
