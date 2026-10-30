"""The item card (M1 in docs/planer/butikker-og-sponsorer.md): every thing sold for the game's kroner at the tackle shop and the plant is
one card with a picture, one line in numbers, the price, what is aboard and the buttons; the long texts are in the Håndboka, opened by
«Mer»; a purchase confirms in the button itself and falls back after a few seconds; nothing says the prices are provisional. Pictures of
the shop, the electronics, the ice and the bait in both formats. Prints OK or FEIL per check."""
from _env import boot
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


CARDS = """(() => { const cs = [...document.querySelectorAll('#drawerBody .ph-card.ic')];
  return cs.map(c => ({k:c.dataset.ic, pic:!!c.querySelector('.ic-pic svg'), name:(c.querySelector('h4') || {}).textContent || '', fx:(c.querySelector('.ic-fx') || {}).textContent || '',
    price:(c.querySelector('.ic-pr b') || {}).textContent || '', more:!!c.querySelector('.ic-more'), btns:c.querySelectorAll('.ic-btns .ph-btn').length, have:(c.querySelector('.ic-have') || {}).textContent || ''})); })()"""
# anything wider than the drawer, and buttons under the touch size
FIT = """(() => { const d = document.getElementById('drawerBody'), r = d.getBoundingClientRect();
  const wide = [...d.querySelectorAll('.ph-card.ic, .ph-card.ic *')].filter(e => { const q = e.getBoundingClientRect(); return q.width && q.right > r.right + 1; }).map(e => e.tagName + '.' + e.className).slice(0, 5);
  const small = [...d.querySelectorAll('.ic-btns .ph-btn')].filter(e => { const q = e.getBoundingClientRect(); return q.width && q.height < 30; }).length;
  return {wide, small, sw:d.scrollWidth, cw:d.clientWidth}; })()"""


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 800})
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        J = lambda js: pg.evaluate("JSON.stringify(" + js + ")")
        await pg.evaluate("S.cash = 500000; S.boat.gear = false; S.boat.status = 'port'; S.boat.type = 'snekke'; applyVessel(); S.equip.garnhaler = true; S.crew = S.crew || []; renderActs()")

        # the tackle shop in Finnsnes: the hand jig and the halibut gear, then the gear
        await pg.evaluate("DOCK.open('fiske')"); await pg.wait_for_timeout(300)
        cs = json.loads(await J(CARDS)); ks = [c['k'] for c in cs]
        check(ks[:2] == ['jig', 'kgear'] and all(k in ks for k in ['net', 'line', 'pot', 'kit', 'hooks']), 'Fiskeutstyr: juksa, kveiteutstyr, garn, line, teiner, blåser og kroker er varekort', ks)
        check(all(c['pic'] and c['name'] and c['price'] and c['fx'] for c in cs), 'hvert kort har bilde, navn, pris og én linje med hva det gjør', [c for c in cs if not (c['pic'] and c['name'] and c['price'] and c['fx'])])
        check(all(c['more'] for c in cs), 'hvert kort har «Mer» til Håndboka', [c['k'] for c in cs if not c['more']])
        net = next(c for c in cs if c['k'] == 'net')
        check(net['btns'] == 6 and '156 mm' in net['fx'], 'garnkortet har de seks garnvalgene og maskeviddene i linja', net)
        txt = await pg.evaluate("document.getElementById('drawerBody').textContent")
        check('foreløpig' not in txt and 'Minste lovlige maskevidde' not in txt, 'ingen «prisene er foreløpige» og ingen leksikontekst i butikken', [w for w in ['foreløpig', 'Minste lovlige maskevidde'] if w in txt])

        # the confirm lives in the button: a tap shows «Bekreft» with a ✕ in the same card, and it falls back by itself
        await pg.evaluate("document.querySelector('#drawerBody [data-pa=shop][data-k=jig]').click()"); await pg.wait_for_timeout(200)
        r = json.loads(await J("{cf:!!document.querySelector('#drawerBody [data-ic=jig] .ic-cf [data-pa=shop0]'), btn:document.querySelector('#drawerBody [data-pa=shop][data-k=jig]').textContent, rows:document.querySelectorAll('#drawerBody .ph-row2').length}"))
        check(r['cf'] and 'Bekreft' in r['btn'], 'første trykk gjør knappen til «Bekreft» med ✕ ved siden av', r)
        await pg.wait_for_timeout(5000)
        btn = await pg.evaluate("document.querySelector('#drawerBody [data-pa=shop][data-k=jig]').textContent")
        check('Bekreft' not in btn, 'bekreftelsen faller tilbake av seg selv etter noen sekunder', btn)
        await pg.evaluate("document.querySelector('#drawerBody [data-pa=shop][data-k=jig]').click()"); await pg.wait_for_timeout(150)
        await pg.evaluate("document.querySelector('#drawerBody [data-pa=shop][data-k=jig]').click()"); await pg.wait_for_timeout(200)
        r = json.loads(await J("{gear:S.boat.gear, have:(document.querySelector('#drawerBody [data-ic=jig] .ic-have') || {}).textContent}"))
        check(r['gear'] and r['have'] == 'Om bord', 'to trykk kjøper juksa, og kortet sier «Om bord»', r)
        fit = json.loads(await J(FIT)); check(not fit['wide'] and not fit['small'] and fit['sw'] <= fit['cw'] + 1, 'liggende: ingenting stikker ut av skuffen, knappene er store nok', fit)
        await pg.screenshot(path='itemcard_fiske_liggende.png')

        # «Mer» opens the one entry in the Håndboka, with the way back to the whole book
        await pg.evaluate("document.querySelector('#drawerBody [data-ic=net] .ic-more').click()"); await pg.wait_for_timeout(400)
        r = json.loads(await J("{open:PHONE.isOpen(), h:(document.querySelector('#phone .hb-list .ph-card h4') || {}).textContent, n:document.querySelectorAll('#phone .hb-list .ph-card').length, txt:(document.querySelector('#phone .hb-list .ph-card p') || {}).textContent || '', all:!!document.querySelector('#phone [data-pa=hball]')}"))
        check(r['open'] and r['h'] == 'Garn' and r['n'] == 1 and '62° N' in r['txt'] and r['all'], '«Mer om garn» åpner Håndboka på garn, med leksikonteksten og «Hele Håndboka»', r)
        await pg.evaluate("document.querySelector('#phone [data-pa=hball]').click()"); await pg.wait_for_timeout(300)
        r = json.loads(await J("{n:document.querySelectorAll('#phone .hb-list .ph-card').length, dots:document.querySelectorAll('#phone .hb-list [id^=hb-lex_] .hb-dot').length, skip:document.querySelectorAll('#phone [data-pa=hbskip]').length, chs:HB_CH.length}"))
        check(r['n'] > 20 and r['dots'] == 0 and r['skip'] == r['chs'] - 1, 'hele Håndboka igjen; oppslagskapitlet har ingen prikker og ingen «Jeg kan dette»', r)
        await pg.evaluate("PHONE.show(false)")

        # electronics and haulers: the equipment and the clothes are cards too
        await pg.evaluate("DOCK.open('utstyrb')"); await pg.wait_for_timeout(300)
        cs = json.loads(await J(CARDS)); ks = [c['k'] for c in cs]
        check(all(k in ks for k in ['linehaler', 'vhf', 'olje', 'varme']) and all(c['pic'] and c['price'] for c in cs), 'Elektronikk og haler: utstyret og klærne er varekort med bilde og pris', ks)
        lh = next(c for c in cs if c['k'] == 'linehaler')
        check('raskere enn for hånd' in lh['fx'], 'linehaleren sier hvor mye raskere den trekker enn for hånd', lh)
        await pg.evaluate("document.querySelector('#drawerBody [data-pa=equip][data-k=vhf]').click()"); await pg.wait_for_timeout(300)
        r = json.loads(await J("{job:(S.jobs || []).some(j => j.kind === 'fit' && j.k === 'vhf'), have:(document.querySelector('#drawerBody [data-ic=vhf] .ic-have') || {}).textContent}"))
        check(r['job'] and r['have'] == 'Til montering', 'kjøpt utstyr står «Til montering» på kortet', r)
        await pg.screenshot(path='itemcard_utstyr_liggende.png')

        # ice and bait at the plant in Botnhamn
        await pg.evaluate("DOCK.close(); const b = S.boat, q = portById('botnhamn'); b.port = 'botnhamn'; b.pos = {x:q.p.x, y:q.p.y}; b.berth = 'main'; b.ice = 0; DOCK.open('is')"); await pg.wait_for_timeout(300)
        cs = json.loads(await J(CARDS))
        check(len(cs) == 1 and cs[0]['k'] == 'ice' and cs[0]['btns'] == 2 and 'kr/kg' in cs[0]['price'], 'Is er ett varekort med kilopris og to knapper', cs)
        await pg.screenshot(path='itemcard_is_liggende.png')
        await pg.evaluate("S.pgear.lines.hyse.n = 2; DOCK.open('agn')"); await pg.wait_for_timeout(300)
        cs = json.loads(await J(CARDS))
        check(cs and cs[0]['k'] == 'bait' and cs[0]['btns'] == 0 and await pg.evaluate("document.querySelectorAll('#baitStore [data-pa=grbuy][data-w=bait]').length") == 14, 'Agn er et varekort med de sju slagene og 20 og 100 kg', cs[:1])

        # standing: the same pages, nothing outside the drawer
        await pg.set_viewport_size({'width': 800, 'height': 1280}); await pg.wait_for_timeout(300)
        for pgid in ['agn', 'is']:
            await pg.evaluate("DOCK.open('" + pgid + "')"); await pg.wait_for_timeout(300)
            fit = json.loads(await J(FIT)); check(not fit['wide'] and not fit['small'], 'stående ' + pgid + ': ingenting stikker ut, knappene er store nok', fit)
            await pg.screenshot(path='itemcard_' + pgid + '_staaende.png')
        await pg.evaluate("DOCK.close(); const b = S.boat, q = portById('finnsnes'); b.port = 'finnsnes'; b.pos = {x:q.p.x, y:q.p.y}; b.berth = 'main'"); await pg.wait_for_timeout(200)
        for pgid in ['fiske', 'utstyrb']:
            await pg.evaluate("DOCK.open('" + pgid + "')"); await pg.wait_for_timeout(300)
            fit = json.loads(await J(FIT)); check(not fit['wide'] and not fit['small'], 'stående ' + pgid + ': ingenting stikker ut, knappene er store nok', fit)
            await pg.screenshot(path='itemcard_' + pgid + '_staaende.png')
        print('sidefeil', errs)
        await b.close()

asyncio.run(main())
