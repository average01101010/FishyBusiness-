"""M2 in docs/planer/butikker-og-sponsorer.md: the Net app's web shop and the shop on the quay. An order is made anywhere and costs nothing
until it is fetched; it is fetched and paid only at the shop it was ordered to; the shop's top has the keeper with a line, what is ordered
there and what the boat needs; what the boat lacks comes first and what is aboard is one card; the Service sits under Inventory › Gear
at a shop's quay and is gone from the shop's fan; expensive equipment confirms in the button; the dock's Shop button has a dot when
something waits there. Pictures in both formats. Prints OK or FEIL per check."""
from _env import boot
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


FIT = """(() => { const d = document.getElementById('%s'), r = d.getBoundingClientRect();
  const wide = [...d.querySelectorAll('*')].filter(e => { const q = e.getBoundingClientRect(); return q.width && q.right > r.right + 1 && !e.closest('svg'); }).map(e => e.tagName + '.' + e.className).slice(0, 5);
  const small = [...d.querySelectorAll('.ph-btn, .chip-b')].filter(e => { const q = e.getBoundingClientRect(); return q.width && q.height < 30; }).map(e => e.textContent).slice(0, 5);
  return {wide, small}; })()"""


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 800})
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        J = lambda js: pg.evaluate("JSON.stringify(" + js + ")")
        # a snekke in Botnhamn, at the plant: no tackle shop here, Finnsnes is the nearest one
        await pg.evaluate("""(() => { S.cash = 300000; S.boat.type = 'snekke'; applyVessel(); S.boat.status = 'port'; const q = portById('botnhamn'); S.boat.port = 'botnhamn'; S.boat.pos = {x:q.p.x, y:q.p.y}; S.boat.berth = 'main';
          S.apps = null; S.pick = []; S.pickShop = null; renderActs(); })()""")

        # the app is on the phone, and its first page is the bookmarks with the web shop
        await pg.evaluate("PHONE.show(true); PHONE.open('home')"); await pg.wait_for_timeout(300)
        check(await pg.evaluate("!!document.querySelector('#phone .ph-app[data-a=nett]')"), 'Nettet ligger på telefonen')
        await pg.evaluate("document.querySelector('#phone .ph-app[data-a=nett]').click()"); await pg.wait_for_timeout(300)
        r = json.loads(await J("{tile:!!document.querySelector('#phone .net-tile[data-s=shop]'), bar:(document.querySelector('#phone .net-bar') || {}).textContent}"))
        check(r['tile'], 'Nettet åpner på bokmerkene, med nettbutikken', r)
        await pg.evaluate("document.querySelector('#phone .net-tile[data-s=shop]').click()"); await pg.wait_for_timeout(300)
        r = json.loads(await J("{shops:[...document.querySelectorAll('#phone .net-shops .chip-b')].map(x => x.textContent), on:(document.querySelector('#phone .net-shops .chip-b.on') || {}).textContent || '', cards:[...document.querySelectorAll('#phone .ph-card.ic')].map(c => c.dataset.ic)}"))
        check(len(r['shops']) >= 2 and r['on'] == r['shops'][0] and 'net' in r['cards'] and 'line' in r['cards'], 'nettbutikken viser redskapet og velger nærmeste butikk å hente i', r)
        # pick Finnsnes to fetch at (among the three nearest from Botnhamn)
        await pg.evaluate("[...document.querySelectorAll('#phone .net-shops .chip-b')].find(x => x.textContent.startsWith('Finnsnes')).click()"); await pg.wait_for_timeout(300)
        check(await pg.evaluate("S.pickShop") == 'finnsnes' and (await pg.evaluate("(document.querySelector('#phone .net-shops .chip-b.on') || {}).textContent || ''")).startswith('Finnsnes'), 'Finnsnes velges som hentested')
        await pg.screenshot(path='nett_shop_liggende.png')

        # ordering the line hauler, and nets (the nets need the hauler aboard: the rule says so, also on the Net)
        r = json.loads(await J("{gate:document.querySelector('#phone [data-ic=net]').textContent.includes('garnhaler')}"))
        check(r['gate'], 'garn kan ikke bestilles før garnhaleren er om bord (samme regel som i butikken)', r)
        await pg.evaluate("document.querySelector('#phone .ph-sub [data-s=eq]').click()"); await pg.wait_for_timeout(300)
        c0 = await pg.evaluate("S.cash")
        await pg.evaluate("document.querySelector('#phone [data-pa=pord][data-w=equip][data-k=linehaler]').click()"); await pg.wait_for_timeout(300)
        await pg.evaluate("document.querySelector('#phone [data-pa=pord][data-w=cloth][data-k=varme]').click()"); await pg.wait_for_timeout(300)
        r = json.loads(await J("{pick:S.pick.map(o => [o.port, o.w, o.k]), cash:S.cash, equip:!!S.equip.linehaler, jobs:(S.jobs || []).length, have:(document.querySelector('#phone [data-ic=linehaler] .ic-have') || {}).textContent || ''}"))
        check(r['pick'] == [['finnsnes', 'equip', 'linehaler'], ['finnsnes', 'cloth', 'varme']] and r['cash'] == c0 and not r['equip'] and r['jobs'] == 0, 'linehaler og varmedress er bestilt til Finnsnes, uten at noe er betalt eller gitt', r)
        check(r['have'].startswith('Bestilt i Finnsnes'), 'kortet sier hvor det er bestilt', r['have'])
        await pg.evaluate("document.querySelector('#phone [data-pa=pord][data-w=equip][data-k=linehaler]') && document.querySelector('#phone [data-pa=pord][data-w=equip][data-k=linehaler]').click()"); await pg.wait_for_timeout(200)
        check(await pg.evaluate("S.pick.length") == 2, 'samme utstyr bestilles ikke to ganger')
        await pg.screenshot(path='nett_order_liggende.png')
        # at the plant nothing can be fetched; the order waits for Finnsnes
        r = json.loads(await J("(() => { PHONE.show(false); const q = PHONE; return {dot:DOCK.items().some(x => x.id === 'butikk')}; })()"))
        check(not r['dot'], 'mottaket i Botnhamn har ingen butikk å hente i')

        # in Finnsnes: the dot on the shop, the keeper, the order on top, fetch and pay there
        await pg.evaluate("""(() => { const q = portById('finnsnes'); S.boat.port = 'finnsnes'; S.boat.pos = {x:q.p.x, y:q.p.y}; S.boat.berth = 'main'; renderActs(); })()""")
        dot = await pg.evaluate("(DOCK.items().find(x => x.id === 'butikk') || {}).dot")
        check(dot, 'Butikk-knappen har en prikk når noe er bestilt der')
        fan = await pg.evaluate("DOCK.items('butikk').map(x => x.id)")
        check(fan == ['fiskeutstyr', 'elektronikk'], 'butikkviften har to knapper, Service er flyttet', fan)
        await pg.evaluate("DOCK.open('fiske')"); await pg.wait_for_timeout(300)
        r = json.loads(await J("{say:(document.querySelector('#drawerBody .shop-say') || {}).textContent || '', pick:[...document.querySelectorAll('#drawerBody .pick-r')].map(x => x.textContent), tabs:[...document.querySelectorAll('#drawerTabs button')].map(x => x.textContent), need:[...document.querySelectorAll('#drawerBody .buyl .chip-b')].map(x => x.textContent)}"))
        check(r['say'].startswith('Solveig:') and len(r['say']) > 15, 'kjøpmannen i Finnsnes er Solveig, med en linje', r['say'])
        check(len(r['pick']) == 2 and 'Linehaler' in r['pick'][0], 'det som er bestilt hit, står øverst med «Hent»', r['pick'])
        check(r['tabs'] == ['Redskap', 'Elektronikk og haler'], 'butikken har fanene Redskap og Elektronikk og haler', r['tabs'])
        check(any('Klær' in x for x in r['need']), 'lista over det båten trenger nå, har klær til alle om bord', r['need'])
        await pg.screenshot(path='nett_butikk_liggende.png')
        c0 = await pg.evaluate("S.cash")
        await pg.evaluate("document.querySelector('#drawerBody [data-pa=ptakeall]').click()"); await pg.wait_for_timeout(300)
        r = json.loads(await J("{pick:S.pick.length, paid:" + str(c0) + " - S.cash, job:(S.jobs || []).some(j => j.kind === 'fit' && j.k === 'linehaler'), varme:(S.clothes || {}).varme || 0}"))
        check(r['pick'] == 0 and r['job'] and r['varme'] == 1 and r['paid'] == await pg.evaluate("EQUIP.linehaler.price + CLOTHES.varme.price"), '«Hent alt» betaler og gir det i butikken: haleren til montering, dressen om bord', r)
        # the chip for what is needed takes you to its card, on its page
        await pg.evaluate("document.querySelector('#drawerBody .buyl .chip-b') && document.querySelector('#drawerBody .buyl .chip-b').click()"); await pg.wait_for_timeout(400)
        r = json.loads(await J("{page:DOCK.page, flash:!!document.querySelector('#drawerBody .ph-card.flash')}"))
        check(r['flash'], 'en lapp i lista går til kortet sitt', r)

        # «Til båten» first: what is aboard is one card at the bottom, what does not suit her is folded away
        await pg.evaluate("S.equip.vhf = true; DOCK.open('utstyrb')"); await pg.wait_for_timeout(300)
        r = json.loads(await J("{cards:[...document.querySelectorAll('#drawerBody .ph-card.ic')].map(c => c.dataset.ic), aboard:(document.querySelector('#drawerBody .ic-aboard') || {}).textContent || '', nofit:(document.querySelector('#drawerBody details.ic-nofit') || {}).open, nofitT:(document.querySelector('#drawerBody details.ic-nofit') || {}).textContent || ''}"))
        check('vhf' not in r['cards'] and 'VHF' in r['aboard'], 'VHF-en om bord står i «Om bord», ikke som kort', r['aboard'])
        check(r['cards'][:3] == ['linehaler', 'garnhaler', 'teinehaler'] and r['nofit'] is False and 'Sonar' in r['nofitT'], 'halerne først, og det som ikke passer snekka, er lukket nederst', [r['cards'][:3], r['nofitT'][:60]])
        # expensive equipment confirms in the button
        c0 = await pg.evaluate("S.cash")
        await pg.evaluate("document.querySelector('#drawerBody [data-pa=equip][data-k=garnhaler]').click()"); await pg.wait_for_timeout(200)
        r = json.loads(await J("{cash:S.cash, btn:document.querySelector('#drawerBody [data-pa=equip][data-k=garnhaler]').textContent, x:!!document.querySelector('#drawerBody [data-ic=garnhaler] [data-pa=shop0]')}"))
        check(r['cash'] == c0 and 'Bekreft' in r['btn'] and r['x'], 'garnhaleren (95 000 kr) ber om bekreftelse i knappen først', r)
        await pg.evaluate("document.querySelector('#drawerBody [data-pa=equip][data-k=garnhaler]').click()"); await pg.wait_for_timeout(200)
        check(await pg.evaluate("S.cash === " + str(c0) + " - EQUIP.garnhaler.price && S.jobs.some(j => j.k === 'garnhaler')"), 'andre trykk kjøper den')
        await pg.screenshot(path='nett_utstyr_liggende.png')

        # Service under Inventory › Gear at the shop's quay, not at the plant
        await pg.evaluate("DOCK.open('beholdning:gear')"); await pg.wait_for_timeout(300)
        r = json.loads(await J("{svc:!!document.querySelector('#drawerBody .svc-l [data-a=service]')}"))
        check(r['svc'], 'Beholdning › Redskap har Service når båten ligger ved butikken', r)
        await pg.evaluate("document.querySelector('#drawerBody .svc-l [data-a=service]').click()"); await pg.wait_for_timeout(300)
        check(await pg.evaluate("DOCK.page") == 'service', 'knappen åpner Service')
        await pg.evaluate("const q = portById('botnhamn'); S.boat.port = 'botnhamn'; S.boat.pos = {x:q.p.x, y:q.p.y}; DOCK.open('beholdning:gear')"); await pg.wait_for_timeout(300)
        check(not await pg.evaluate("!!document.querySelector('#drawerBody .svc-l')"), 'på mottaket er det ingen Service å gå til')

        # standing: the Net and the shop fit the screen
        await pg.evaluate("DOCK.close()"); await pg.set_viewport_size({'width': 800, 'height': 1280}); await pg.wait_for_timeout(300)
        await pg.evaluate("PHONE.show(true); PHONE.open('home'); document.querySelector('#phone .ph-app[data-a=nett]').click(); document.querySelector('#phone .net-tile[data-s=shop]').click()"); await pg.wait_for_timeout(300)
        fit = json.loads(await J(FIT % 'phView')); check(not fit['wide'] and not fit['small'], 'stående: nettbutikken passer skjermen, knappene er store nok', fit)
        await pg.screenshot(path='nett_shop_staaende.png')
        await pg.evaluate("PHONE.show(false); const q = portById('finnsnes'); S.boat.port = 'finnsnes'; S.boat.pos = {x:q.p.x, y:q.p.y}; S.pick = []; pickAdd('finnsnes', 'equip', 'ais'); renderActs(); DOCK.open('fiske')"); await pg.wait_for_timeout(300)
        fit = json.loads(await J(FIT % 'drawerBody')); check(not fit['wide'] and not fit['small'], 'stående: butikken med kjøpmann og bestilling passer skjermen', fit)
        await pg.screenshot(path='nett_butikk_staaende.png')
        print('sidefeil', errs)
        await b.close()

asyncio.run(main())
