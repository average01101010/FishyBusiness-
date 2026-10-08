"""The phone's Fiskeguide app (08.10.2026, ui/06f-fishguide.js): the month view (the species best first, the months as chips, the rules'
closed months and the skrei marked), the year view (all species and months, the closed ones striped), the species card (when, where, how,
price, rules), the sea's own places (little Greenland halibut south of 62° N), and the way back. Everything is tapped as a player taps.
Prints OK or FEIL."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await (await b.new_context(viewport={'width': 420, 'height': 820})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME)
        # 1. the app is on the home screen, and opens on this month with all ten species
        r = await pg.evaluate("""(() => { S.tut = 0; S.lang = 'no'; PHONE.show(true); const home = !!document.querySelector('.ph-app[data-a=guide]'); PHONE.open('guide');
          const rows = [...document.querySelectorAll('.gd-row')].map(x => x.dataset.sp), chips = document.querySelectorAll('.gd-mon button').length, now = document.querySelectorAll('.gd-mon button.now.on').length;
          return {home, rows, chips, now, n:ALLSP.length}; })()""")
        print(json.dumps(r, ensure_ascii=False))
        print(ok(r['home'] and len(r['rows']) == r['n'] == 10 and r['chips'] == 12 and r['now'] == 1), 'the app is on the home screen and opens on this month: ten species, twelve month chips', [r['home'], len(r['rows']), r['chips'], r['now']])
        # 2. the months, tapped: March has the skrei first; January has the halibut closed (and last); July the redfish open, the cod without skrei
        async def tap(sel):
            await pg.evaluate("sel => document.querySelector(sel).click()", sel); await pg.wait_for_timeout(120)
        async def rows():
            return await pg.evaluate("""[...document.querySelectorAll('.gd-row')].map(x => ({sp:x.dataset.sp, dim:x.classList.contains('dim'), chips:[...x.querySelectorAll('.gd-chip')].map(c => c.innerText)}))""")
        await tap('.gd-mon button[data-m="2"]'); mar = await rows()
        await tap('.gd-mon button[data-m="0"]'); jan = await rows()
        await tap('.gd-mon button[data-m="6"]'); jul = await rows()
        await tap('.gd-mon button[data-m="3"]'); apr = await rows()
        await tap('.gd-mon button[data-m="9"]'); okt = await rows()
        f = lambda L, sp: next(x for x in L if x['sp'] == sp)
        print(ok(mar[0]['sp'] == 'torsk' and 'Skrei' in f(mar, 'torsk')['chips'] and 'Bare bifangst' in f(mar, 'uer')['chips']), 'March: the cod first with the skrei marked, redfish by-catch only', [x['sp'] for x in mar[:3]])
        print(ok(f(jan, 'kveite')['dim'] and 'Fredet' in f(jan, 'kveite')['chips'] and jan[-1]['sp'] == 'kveite'), 'January: the halibut is closed, dimmed and last', f(jan, 'kveite'))
        print(ok(not f(jul, 'uer')['chips'] and 'Skrei' not in f(jul, 'torsk')['chips'] and not f(jul, 'kveite')['dim']), 'July: the redfish open, no skrei, the halibut open', f(jul, 'uer'))
        print(ok(any('21. april' in c for c in f(apr, 'kveite')['chips']) and f(apr, 'kveite')['chips'] and not f(apr, 'kveite')['dim']), 'April: the halibut opens on the 21st', f(apr, 'kveite')['chips'])
        # 3. the year view: ten rows of twelve, the closed months striped (3 of the halibut), the redfish' nine by-catch months
        await tap('.gd-tabs button[data-t=ar]')
        y = await pg.evaluate("""(() => ({rows:document.querySelectorAll('.gd-yrow[data-sp]').length, cells:document.querySelectorAll('.gd-yrow[data-sp] i').length,
          kcl:document.querySelectorAll('.gd-yrow[data-sp=kveite] i.cl').length, ucl:document.querySelectorAll('.gd-yrow[data-sp=uer] i.by').length, heads:document.querySelectorAll('.gd-yh button').length}))()""")
        print(json.dumps(y))
        print(ok(y['rows'] == 10 and y['cells'] == 120 and y['kcl'] == 3 and y['ucl'] == 9 and y['heads'] == 12), 'the year view: ten species by twelve months, the halibut closed in three, the redfish by-catch in nine', y)
        # a letter in the header takes you to that month in the month view
        await tap('.gd-yh button[data-m="1"]')
        tb = await pg.evaluate("({tab:GUIDE.st.tab, m:GUIDE.st.m, rows:document.querySelectorAll('.gd-row').length})")
        print(ok(tb['tab'] == 'mnd' and tb['m'] in (1, None) and tb['rows'] == 10), 'a letter in the year view takes you to that month in the month view', tb)
        # 4. the species card: the cod with the skrei, the Greenland halibut with its shelf edge, the king crab with its pots; the way back
        await tap('.gd-row[data-sp=torsk]')
        c = await pg.evaluate("""(() => { const t = document.querySelector('.ph-appv').innerText; return {cols:document.querySelectorAll('.gd-col').length, sk:document.querySelectorAll('.gd-col u.sk').length,
          best:t.includes('feb–mar') || t.includes('feb'), where:t.includes('Skreien'), gear:t.includes('Juksa') && t.includes('Garn'), bait:t.includes('Reke'), price:/kr\\/kg/.test(t), rules:t.includes('Minstemål'), back:!!document.querySelector('.gd-back')}; })()""")
        print(json.dumps(c, ensure_ascii=False))
        print(ok(c['cols'] == 12 and c['sk'] == 5 and c['best'] and c['where'] and c['gear'] and c['bait'] and c['price'] and c['rules'] and c['back']), 'the cod card: twelve bars with the skrei in five (December to April), where, gear, bait, price, rules, and a way back', c)
        await tap('.gd-back')
        await tap('.gd-row[data-sp=blakveite]')
        bk = await pg.evaluate("""(() => { const t = document.querySelector('.ph-appv').innerText; return {depth:t.includes('300–1100 m'), egga:t.includes('Egga'), lines:t.includes('Bankline'), jig:!t.includes('Juksa')}; })()""")
        await tap('.gd-back'); await tap('.gd-row[data-sp=krabbe]')
        kr = await pg.evaluate("""(() => { const t = document.querySelector('.ph-appv').innerText; return {pots:t.includes('Teiner'), no_jig:!t.includes('Juksa') && !t.includes('Garn'), q:t.includes('26° Ø'), nomin:!t.includes('Minstemål')}; })()""")
        await tap('.gd-back'); await tap('.gd-row[data-sp=kveite]')
        kv = await pg.evaluate("""(() => { const t = document.querySelector('.ph-appv').innerText; return {pilk:t.includes('Stor pilk'), closed:t.includes('20. desember'), max:t.includes('100 kg')}; })()""")
        print(json.dumps([bk, kr, kv], ensure_ascii=False))
        print(ok(all(bk.values()) and all(kr.values()) and all(kv.values())), 'the cards: Greenland halibut on the shelf edge by bank line and not the jig, king crab in pots only, halibut on the big jig with its closed spell', [bk, kr, kv])
        await tap('.gd-back')
        # 5. the sea's own places: far south (60° N) there is little Greenland halibut and king crab; off Finnmark (70.5° N 25° E) next to no halibut worry and crab
        lo = await pg.evaluate("""(() => { S.boat.pos = natP(60.0, 5.0); PHONE.open('guide'); const t = i => [...document.querySelectorAll('.gd-row[data-sp=' + i + '] .gd-chip')].map(c => c.innerText).join('|'); const south = {bk:t('blakveite'), kr:t('krabbe')};
          S.boat.pos = natP(70.6, 25.0); PHONE.open('guide'); const north = {bk:t('blakveite'), kr:t('krabbe')}; return {south, north}; })()""")
        print(json.dumps(lo, ensure_ascii=False))
        print(ok('Lite der du er' in lo['south']['bk'] and 'Lite der du er' in lo['south']['kr'] and 'Lite der du er' not in lo['north']['bk'] and 'Lite der du er' not in lo['north']['kr']), 'little where you are: Greenland halibut and king crab are marked in the south, not off Finnmark', lo)
        # 6. English, and the link from the Sesong app
        en = await pg.evaluate("""(() => { S.lang = 'en'; PHONE.open('guide'); const a = document.querySelector('.ph-appv').innerText; S.lang = 'no'; PHONE.open('sesong'); const l = !!document.querySelector('.ph-appv [data-a=guide]'); PHONE.show(false); return {a:a.slice(0, 160), l}; })()""")
        print(ok('Month' in en['a'] and 'The year' in en['a'] and en['l']), 'English text, and the Sesong app links to the guide', en)
        await pg.evaluate("PHONE.open('guide')"); await pg.wait_for_timeout(250); await pg.screenshot(path='guide_app.png')
        await tap('.gd-row[data-sp=torsk]'); await pg.screenshot(path='guide_card.png')
        print(ok(not errs), 'no page errors', errs[:3])
        await b.close()

asyncio.run(main())
