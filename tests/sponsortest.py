"""M6 in docs/planer/butikker-og-sponsorer.md: the sponsor groundwork. Without an agreement there is no mark anywhere and the handbook says
there are none; with the made-up test sponsor (#sptest) the partner's item stands beside the generic one, marked «Samarbeid», at the same
price and with the same numbers, its link out marked, in a new tab and tagged; bought, it is the same equipment with the model's name,
and the handbook lists the partner. Pictures in both formats. Prints OK or FEIL per check."""
from _env import boot, GAME
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:400]) if extra != '' else ''))


SETUP = """(() => { S.cash = 400000; S.boat.type = 'snekke'; applyVessel(); S.boat.status = 'port'; const q = portById('finnsnes'); S.boat.port = 'finnsnes'; S.boat.pos = {x:q.p.x, y:q.p.y}; S.boat.berth = 'main';
  S.equip.garnhaler = false; S.jobs = []; renderActs(); })()"""
FIT = """(() => { const d = document.getElementById('drawerBody'), r = d.getBoundingClientRect();
  return [...d.querySelectorAll('#ic-garnhaler-sp *')].filter(e => { const q = e.getBoundingClientRect(); return q.width && q.right > r.right + 1; }).map(e => e.tagName + '.' + e.className).slice(0, 5); })()"""


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch()
        # 1. no agreement: nothing marked
        pg = await br.new_page(viewport={'width': 1280, 'height': 800}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg); await pg.evaluate(SETUP)
        await pg.evaluate("DOCK.open('utstyrb')"); await pg.wait_for_selector('#drawerBody #ic-garnhaler')
        r = await pg.evaluate("({sp:document.querySelectorAll('#drawerBody .ic-sp-tag, #drawerBody .ic-sp-link').length, list:SPN.list.length, hb:SPUI.hb('no')})")
        check(r['sp'] == 0 and r['list'] == 0 and r['hb'].startswith('Ingen ennå'), 'uten avtale står ingen sponsor i butikken, og Håndboka sier «Ingen ennå»', r)
        await pg.close()

        # 2. the test sponsor
        pg = await br.new_page(viewport={'width': 1280, 'height': 800})
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + ',sptest'); await pg.evaluate(SETUP)
        await pg.wait_for_function("SPN.list.length > 0", timeout=10000)
        await pg.evaluate("DOCK.open('utstyrb')"); await pg.wait_for_selector('#drawerBody #ic-garnhaler-sp')
        c = await pg.evaluate("""(() => { const g = document.querySelector('#drawerBody #ic-garnhaler'), s = document.querySelector('#drawerBody #ic-garnhaler-sp'), a = s.querySelector('a.ic-sp-link');
          const t = q => (q.querySelector('.ic-fx') || {}).textContent || '', pr = q => (q.querySelector('.ic-pr b') || {}).textContent || '';
          return {tag:(s.querySelector('.ic-sp-tag') || {}).textContent, name:s.querySelector('h4').textContent, fx:[t(g), t(s)], pr:[pr(g), pr(s)], href:a && a.href, target:a && a.target, rel:a && a.rel, out:s.textContent.includes('åpner utenfor spillet'), btn:!!s.querySelector('[data-pa=equip][data-sp]'), order:[...document.querySelectorAll('#drawerBody .ic')].map(x => x.id).slice(0, 4)}; })()""")
        check(c['tag'] == 'Samarbeid' and 'Nordlys GH-200' in c['name'] and 'Nordlys Utstyr' in c['name'] and c['out'] and c['btn'], 'partnerens garnhaler står merket «Samarbeid», med modellnavnet og hvem som leverer', c)
        check(c['fx'][0] == c['fx'][1] and c['fx'][0] and c['pr'][0] == c['pr'][1], 'den har samme tall og samme pris som den usponsede', c)
        check(c['href'] and 'fra=detstorebla' in c['href'] and c['href'].startswith('https://') and c['target'] == '_blank' and 'noopener' in c['rel'] and 'sponsored' in c['rel'], 'lenken ut er merket, åpner i ny fane og sier hvor den kom fra', c)
        check(c['order'].index('ic-garnhaler-sp') == c['order'].index('ic-garnhaler') + 1, 'den står rett under den usponsede', c['order'])
        await pg.evaluate("document.querySelector('#ic-garnhaler-sp').scrollIntoView()"); await pg.wait_for_timeout(200)
        await pg.screenshot(path='sponsor_kort_liggende.png')
        await pg.set_viewport_size({'width': 800, 'height': 1280}); await pg.wait_for_timeout(300)
        await pg.evaluate("document.querySelector('#ic-garnhaler-sp').scrollIntoView()"); await pg.wait_for_timeout(200)
        await pg.screenshot(path='sponsor_kort_staaende.png')
        fit = await pg.evaluate(FIT)
        check(not fit, 'kortet får plass stående', fit)
        await pg.set_viewport_size({'width': 1280, 'height': 800})
        # buying the partner's item: two taps, the same price, the same equipment with the model's name
        cash0 = await pg.evaluate("S.cash")
        await pg.evaluate("document.querySelector('#drawerBody [data-pa=equip][data-sp][data-k=garnhaler]').click()"); await pg.wait_for_timeout(150)
        await pg.evaluate("document.querySelector('#drawerBody [data-pa=equip][data-sp][data-k=garnhaler]').click()"); await pg.wait_for_timeout(200)
        b = await pg.evaluate("(() => { for (const j of (S.jobs || []).filter(j => j.kind === 'fit')) finishJob(j); S.jobs = []; DOCK.redraw && DOCK.redraw(); return {paid:%d - S.cash, price:EQUIP.garnhaler.price, eq:S.equip.garnhaler, brand:SPUI.brandOf('garnhaler')}; })()" % cash0)
        await pg.evaluate("DOCK.close(); DOCK.open('utstyrb')"); await pg.wait_for_timeout(300)
        ab = await pg.evaluate("(document.querySelector('#drawerBody .ic-aboard') || {}).textContent || ''")
        check(b['paid'] == b['price'] and b['eq'] is True and b['brand'] and b['brand']['m'] == 'Nordlys GH-200' and 'Nordlys GH-200' in ab, 'kjøpt: samme pris, samme garnhaler, med modellnavnet under «Om bord»', [b, ab])
        hb = await pg.evaluate("SPUI.hb('no')")
        check('Nordlys Utstyr' in hb and 'koster det samme' in hb, 'Håndboka lister samarbeidspartneren og sier at varen er lik', hb)
        print('sidefeil', errs)
        await br.close()

asyncio.run(main())
