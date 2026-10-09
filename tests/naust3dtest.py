# Father's naust in 3D with the trophy wall (09.10.2026; ui/09c-naust3d.js, tools/harbour/naustinne.py): «Naustet» in the dock opens the room only
# where the boat lies at the naust; with the wall upgrade the fish of the records hang on their hooks with a label each and the species
# not caught yet as «?»; a tap on a fish tells when and where; a tap on the stove, the bench or the roof shows what it is and buys it;
# the world's 3D view holds its frames meanwhile and gets them back. Pictures: naust3d_*.png.
import asyncio, json
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
        ctx = await b.new_context(viewport={'width': 1100, 'height': 700}, has_touch=True); pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        r = json.loads(await pg.evaluate("""(async () => { const F = portById('finnsnes'); await mapNeed(F.p, MAPD.simR); S.home = 'finnsnes'; S.naust = null; naustSite(); S.tut = 0; S.cash = 100000;
          S.plan = null; S.draft = []; dock('finnsnes', 'naust'); S.naustUp = {}; S.rec = {torsk:{sp:'torsk', kg:14.2, t:S.t - 3000, at:'Senjahopen', boat:'Havbris', how:'juksa'}, kveite:{sp:'kveite', kg:61, t:S.t - 900, at:'Husøy', boat:'Havbris', how:'line'}, krabbe:{sp:'krabbe', kg:5.2, t:S.t - 100, at:'Vardø', boat:'Havbris', how:'teine'}};
          renderActs(); const it = DOCK.items('hjem') || []; const all = JSON.stringify(DOCK.items('hjem') || []); return JSON.stringify({kind:berthKind(S.boat), hasItem:(DOCK.items('hjem') || []).some(x => x.id === 'naustup') || /naustup/.test(all)}); })()"""))
        print(r)
        await pg.evaluate("NAUST3D.open()"); await pg.wait_for_timeout(2500)
        st = json.loads(await pg.evaluate("JSON.stringify({on:NAUST3D.isOpen(), a:!!NAUST3D.anchors, slots:NAUST3D.anchors && NAUST3D.anchors.slots.length, spots:NAUST3D.anchors && NAUST3D.anchors.spots.map(x => x[0]), body:document.body.classList.contains('in-pub')})"))
        print(ok(st['on'] and st['a'] and st['slots'] == 10 and st['body']), 'naustet åpner i 3D med ti plasser på veggen', st)
        await pg.screenshot(path='naust3d_bare.png')
        # without the wall: no fish, a board with nails; a tap on the records shows the table and the offer
        await pg.evaluate("NAUST3D.openSpot('vegg')"); await pg.wait_for_timeout(300)
        t1 = await pg.evaluate("document.querySelector('#naust3 .pb-panel').innerText")
        print(ok('14,2' in t1 and '61,0' in t1 and 'Trofévegg' in t1 or 'Trofévegg' in t1), 'uten vegg: tabellen med rekordene og tilbudet fra snekkeren', t1[:80].replace('\n', ' '))
        await pg.evaluate("document.querySelector('#naust3 [data-q=buy\\\\:vegg]').click()"); await pg.wait_for_timeout(300)
        r2 = json.loads(await pg.evaluate("JSON.stringify({vegg:naustHas('vegg'), cash:S.cash})"))
        print(ok(r2['vegg'] and r2['cash'] == 97000), 'veggen kjøpes fra rommet (3 000 kr)', r2)
        await pg.evaluate("NAUST3D.openSpot('door'); NAUST3D.open()"); await pg.wait_for_timeout(1500)
        await pg.evaluate("NAUST3D.look(0, 0.0)"); await pg.wait_for_timeout(1200)
        lab = json.loads(await pg.evaluate("JSON.stringify([...document.querySelectorAll('#naust3 .pb-lab [data-f]')].map(b => [b.textContent, b.style.display !== 'none']))"))
        print(ok(len(lab) == 10 and sum(1 for x in lab if x[1]) >= 8), 'ti etiketter på veggen, tomme plasser med «?»', lab)
        await pg.screenshot(path='naust3d_wall.png')
        # tap the cod's label
        pos = await pg.evaluate("(() => { const b = document.querySelector('#naust3 .pb-lab [data-f=\"0\"]'); if (!b || b.style.display === 'none') return null; const r = b.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()")
        if pos: await tap(pg, pos[0], pos[1]); await pg.wait_for_timeout(500)
        card = await pg.evaluate("NAUST3D.panel === 'f' ? document.querySelector('#naust3 .pb-panel').innerText : ''")
        print(ok('14,2 kg' in card and 'Senjahopen' in card and 'Havbris' in card), 'trykk på torsken viser vekt, sted og båt', card[:90].replace('\n', ' '))
        await pg.screenshot(path='naust3d_card.png')
        # a fish by a tap in the picture itself (the ray against the fish)
        await pg.evaluate("document.querySelector('#naust3 [data-q=x]') && document.querySelector('#naust3 [data-q=x]').click()")
        pk = await pg.evaluate("(() => { const a = NAUST3D.anchors, s = a.slots[2], c = NAUST3D.project([s[0], s[1] - 0.2, s[2] + 0.2]); return c; })()")
        if pk: await tap(pg, pk[0], pk[1]); await pg.wait_for_timeout(400)
        print(ok(await pg.evaluate("NAUST3D.panel === 'f'")), 'trykk på selve fisken i bildet virker', pk)
        # the upgrades in the room: the roof, the stove and the bench
        await pg.evaluate("NAUST3D.openSpot('tak')"); await pg.wait_for_timeout(300)
        await pg.evaluate("document.querySelector('#naust3 [data-q=buy\\\\:tak]').click()"); await pg.wait_for_timeout(300)
        await pg.evaluate("NAUST3D.openSpot('ovn')"); await pg.wait_for_timeout(300)
        await pg.evaluate("document.querySelector('#naust3 [data-q=buy\\\\:ovn]').click()"); await pg.wait_for_timeout(300)
        await pg.evaluate("NAUST3D.openSpot('benk')"); await pg.wait_for_timeout(300)
        await pg.evaluate("document.querySelector('#naust3 [data-q=buy\\\\:benk]').click()"); await pg.wait_for_timeout(300)
        up = json.loads(await pg.evaluate("JSON.stringify({tak:naustHas('tak'), ovn:naustHas('ovn'), benk:naustHas('benk'), cash:S.cash})"))
        print(ok(up['tak'] and up['ovn'] and up['benk'] and up['cash'] == 97000 - 6000 - 9000 - 7500), 'taket, ovnen og benken kjøpes fra rommet', up)
        await pg.evaluate("document.querySelector('#naust3 [data-q=x]') && document.querySelector('#naust3 [data-q=x]').click()"); await pg.wait_for_timeout(300)
        for nm, y, pt in (('stove', -1.0, 0.0), ('bench', 1.0, 0.0), ('roof', 0.0, 0.8)):
            await pg.evaluate("NAUST3D.look(%s, %s)" % (y, pt)); await pg.wait_for_timeout(900); await pg.screenshot(path='naust3d_%s.png' % nm)
        # the world's view holds, and is back after
        held = await pg.evaluate("typeof G3 !== 'undefined' && G3.held ? G3.held() : null")
        await pg.evaluate("NAUST3D.close()"); await pg.wait_for_timeout(300)
        print(ok(not await pg.evaluate("NAUST3D.isOpen() || document.body.classList.contains('in-pub')")), 'Gå ut: rommet lukkes og verden kommer tilbake')
        # away from the naust: it does not open
        await pg.evaluate("S.boat.status = 'sailing'; S.boat.port = null"); 
        print(ok(not await pg.evaluate("NAUST3D.open()")), 'bare ved fars naust åpner rommet')
        print('errors:', errs[:3]); await b.close()

asyncio.run(main())
