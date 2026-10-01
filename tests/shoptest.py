"""The tackle shop «Fiskeutstyr» and the money trail (phase 5 after playtest 1): two-tap purchases with a log line, bagged ice in
Finnsnes and chute ice at the plants, the action bar, next goals at the top of Vessels and on the home screen, a landing note that
adds up in whole kroner (A7), minimum prices with two decimals (A8), status that does not look like buttons (A9), the Gisundet tip
only in Finnsnes (A10) and the unused bleed setting gone (A13). Prints OK or FEIL per check."""
from _env import GAME, boot
import asyncio, json, re
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


def num(s):
    s = s.replace(' ', '').replace(' ', '').replace(' ', '').replace('−', '-').replace(',', '.')
    return float(s) if s not in ('', '-') else 0.0


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1000, 'height': 700})
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        J = lambda js: pg.evaluate("JSON.stringify(" + js + ")")

        # A13: the bleed setting is gone, also from an old save
        await pg.evaluate("S.settings.bleed = true; save()"); await pg.reload(); await pg.wait_for_timeout(1500)
        check(await pg.evaluate("S.settings.bleed === undefined"), 'blødningsvalget er fjernet, også fra gamle lagringer')

        # the dock in Finnsnes: the shop under Verft, ice under Marked
        await pg.evaluate("S.cash = 20000; renderActs()")
        acts = await pg.evaluate("[DOCK.items('verft').map(x => x.id), DOCK.items('marked').map(x => x.id)]")
        check('fiskeutstyr' in acts[0] and 'is' in acts[1], 'Fiskeutstyr ligger under Verft og is under Marked', acts)

        # the shop: title in Finnsnes, two taps to buy, a log line on the operations page
        await pg.evaluate("DOCK.open('fiske')"); await pg.wait_for_timeout(300)
        title = await pg.evaluate("document.querySelector('#drawerBody .ph-card h4').textContent")
        check(title == 'Fiskeutstyr på kaia i Finnsnes', 'butikken heter Fiskeutstyr på kaia i Finnsnes', title)
        await pg.evaluate("document.querySelector('#drawerBody [data-pa=shop][data-k=jig]').click()"); await pg.wait_for_timeout(200)
        r = json.loads(await J("{gear:S.boat.gear, cash:S.cash, btn:document.querySelector('#drawerBody [data-pa=shop][data-k=jig]').textContent}"))
        check(not r['gear'] and r['cash'] == 20000 and 'Bekreft' in r['btn'] and '1 900' in r['btn'], 'første trykk viser prisen og ber om bekreftelse', r)
        await pg.evaluate("document.querySelector('#drawerBody [data-pa=shop0]').click()"); await pg.wait_for_timeout(200)
        r = json.loads(await J("{gear:S.boat.gear, btn:document.querySelector('#drawerBody [data-pa=shop][data-k=jig]').textContent}"))
        check(not r['gear'] and 'Bekreft' not in r['btn'], 'avbryt kjøper ingenting', r)
        await pg.evaluate("document.querySelector('#drawerBody [data-pa=shop][data-k=jig]').click()"); await pg.wait_for_timeout(150)
        await pg.evaluate("document.querySelector('#drawerBody [data-pa=shop][data-k=jig]').click()"); await pg.wait_for_timeout(200)
        r = json.loads(await J("{gear:S.boat.gear, cash:S.cash, log:S.log[S.log.length - 1].no, kind:logKind(S.log[S.log.length - 1])}"))
        check(r['gear'] and r['cash'] == 18100 and 'håndjuksa' in r['log'] and r['kind'] == 'drift', 'andre trykk kjøper juksa og skriver i driftsloggen', r)
        # bagged ice in Finnsnes: fill up 150 kg at 2 kr
        await pg.evaluate("DOCK.open('is')"); await pg.wait_for_timeout(300)
        room = await pg.evaluate("[...document.querySelectorAll('#drawerBody [data-pa=shop][data-k=ice]')].map(x => x.textContent)")
        await pg.evaluate("[...document.querySelectorAll('#drawerBody [data-pa=shop][data-k=ice]')].pop().click()"); await pg.wait_for_timeout(150)
        await pg.evaluate("[...document.querySelectorAll('#drawerBody [data-pa=shop][data-k=ice]')].pop().click()"); await pg.wait_for_timeout(200)
        r = json.loads(await J("{ice:S.boat.ice, cash:S.cash, log:S.log[S.log.length - 1].no}"))
        check(r['ice'] == 150 and r['cash'] == 17800 and 'sekker' in r['log'], 'sekkeis i Finnsnes: fyll opp 150 kg for 300 kr', [room, r])
        # the scroll position stays when a card further down asks to confirm
        await pg.evaluate("DOCK.open('fiske')"); await pg.wait_for_timeout(300)
        sc = json.loads(await J("(() => { const v = document.getElementById('drawerBody'); v.scrollTop = 9999; const y0 = v.scrollTop; document.querySelector('#drawerBody [data-pa=shop][data-k=kgear]').click(); return {y0, y1:v.scrollTop, btn:document.querySelector('#drawerBody [data-pa=shop][data-k=kgear]').textContent}; })()"))
        check(sc['y0'] > 0 and sc['y1'] == sc['y0'] and 'Bekreft' in sc['btn'], 'bekreftelsen lenger ned hopper ikke til toppen', sc)
        await pg.evaluate("document.querySelector('#drawerBody [data-pa=shop][data-k=kgear]').click()"); await pg.wait_for_timeout(200)
        check(await pg.evaluate("S.boat.kgear && S.cash === 17800 - PRICE.kgear"), 'kveiteutstyret er kjøpt')
        await pg.screenshot(path='shop_fs.png')

        # at sea the shop can be looked at, not bought from
        await pg.evaluate("S.boat.status = 'idle'; S.boat.gear = false; DOCK.open('fiske')"); await pg.wait_for_timeout(800)
        dis = await pg.evaluate("[...document.querySelectorAll('#drawerBody [data-pa=shop]')].every(x => x.disabled)")
        check(dis, 'på sjøen er kjøpsknappene grå')
        await pg.evaluate("S.boat.status = 'port'; S.boat.gear = true")

        # chute ice at the plant in Botnhamn, under Marked
        await pg.evaluate("DOCK.close(); const b = S.boat, q = portById('botnhamn'); b.port = 'botnhamn'; b.pos = {x:q.p.x, y:q.p.y}; b.berth = 'main'; b.ice = 0; DOCK.open('is')"); await pg.wait_for_timeout(300)
        btn = await pg.evaluate("document.querySelector('#drawerBody [data-pa=shop][data-k=ice][data-kg=\"50\"]').textContent")
        c0 = await pg.evaluate("S.cash")
        for _ in range(2): await pg.evaluate("document.querySelector('#drawerBody [data-pa=shop][data-k=ice][data-kg=\"50\"]').click()"); await pg.wait_for_timeout(200)
        r = json.loads(await J("{ice:S.boat.ice, log:S.log[S.log.length - 1].no, paid:" + str(c0) + " - S.cash}"))
        check(btn and r['ice'] == 50 and r['paid'] == 75 and 'isrenna' in r['log'], 'isrenna i Botnhamn: 50 kg for 75 kr med logglinje', [btn, r])

        # A10: the Gisundet tip only in Finnsnes
        tips = json.loads(await J("(() => { S.draft = []; tab = 'route'; renderPanel(); const a = document.getElementById('panel').textContent; const q = portById('finnsnes'); S.boat.port = 'finnsnes'; S.boat.pos = {x:q.p.x, y:q.p.y}; renderPanel(); const c = document.getElementById('panel').textContent; return {bot:/Gisundet/.test(a), fs:/Gisundet/.test(c)}; })()"))
        check(not tips['bot'] and tips['fs'], 'Gisundet-tipset bare i Finnsnes', tips)

        # next goals: at the top of Vessels and a line on the home screen
        await pg.evaluate("S.boat.gear = true; S.cash = 5000; PHONE.open('fartoy')"); await pg.wait_for_timeout(300)
        first = await pg.evaluate("document.querySelector('#drawerBody .ph-c .ph-card h4').textContent")
        await pg.evaluate("DOCK.close()")
        await pg.evaluate("PHONE.open('home')"); await pg.wait_for_timeout(200)
        home = await pg.evaluate("(document.querySelector('#phone .ph-goal') || {}).textContent || ''")
        check(first == 'Neste mål' and 'Første juksamaskin' in home, 'Neste mål øverst i Båthandel og på hjemskjermen', [first, home])
        await pg.screenshot(path='shop_home.png')

        # A8: minimum prices with two decimals
        await pg.evaluate("PHONE.open('salg')"); await pg.wait_for_timeout(200)
        mins = await pg.evaluate("[...document.querySelectorAll('#phone .ph-tbl')][0].querySelectorAll('tr').length > 1 ? [...[...document.querySelectorAll('#phone .ph-tbl')][0].querySelectorAll('tr')].slice(1).map(r => r.lastElementChild.textContent) : []")
        check(len(mins) > 3 and all(re.fullmatch(r'\d+,\d\d', m) for m in mins), 'minsteprisene har to desimaler', mins)
        await pg.evaluate("PHONE.show(false)")

        # A7: a landing with gutted cod (liver and roe), haddock and saithe, a crew member aboard and a login bonus
        r = json.loads(await J("""(() => { const b = S.boat, q = portById('botnhamn'); b.port = 'botnhamn'; b.pos = {x:q.p.x, y:q.p.y}; b.status = 'port'; b.land = null;
          S.crew = [{id:'t1', name:'Ola', age:30, lv:'Dekksmann', lvEn:'Deckhand', skill:1, share:0.23}]; S.streak.pct = 7;
          S.hold = [{sp:'torsk', cls:1, kg:123.37, n:25, bled:true, iced:true, hr:0, fresh:90, gut:true}, {sp:'torsk', cls:2, kg:88.91, n:30, bled:true, iced:true, hr:0, fresh:70, gut:false},
            {sp:'hyse', cls:1, kg:41.13, n:30, bled:true, iced:true, hr:0, fresh:90, gut:false}, {sp:'sei', cls:1, kg:57.77, n:20, bled:true, iced:true, hr:0, fresh:50, gut:true}];
          const c0 = S.cash; sell(); tab = 'port'; renderPanel();
          const h3 = [...document.querySelectorAll('#panel h3')].find(h => /Sluttseddel/.test(h.textContent)), tb = h3.nextElementSibling.querySelector('table');
          const rows = [...tb.querySelectorAll('tbody tr')].map(tr => ({sum:tr.classList.contains('sum'), c:[...tr.children].map(td => td.textContent)}));
          return {rows, cash:S.cash - c0, total:S.lastSale.total, lott:S.lastSale.lott, lines:S.lastSale.lines.map(x => x.sum)}; })()"""))
        rows = r['rows']; si = next(i for i, x in enumerate(rows) if x['sum'])
        body = [num(x['c'][-1]) for x in rows[:si]]; shown_total = num(rows[si]['c'][-1])
        kgs = [num(x['c'][3]) for x in rows[:si] if len(x['c']) == 6 and x['c'][0] not in ('Lever', 'Rogn')]
        check(all(v == int(v) for v in r['lines']) and sum(body) == shown_total == r['total'], 'radene på sluttseddelen summerer seg til totalen', [body, shown_total, r['total']])
        check(abs(sum(kgs) - num(rows[si]['c'][3])) < 0.01, 'kiloene summerer seg også', [kgs, rows[si]['c'][3]])
        lott_row = [x for x in rows[si + 1:] if 'Lott' in x['c'][0]]; kasse = [x for x in rows[si + 1:] if 'Til kassa' in x['c'][0]]
        check(r['cash'] == r['total'] - r['lott'] and lott_row and num(kasse[0]['c'][-1]) == r['cash'] and r['lott'] == round(r['total'] * 0.23), 'kassa får nøyaktig total minus lott', [r['cash'], r['total'], r['lott']])
        await pg.screenshot(path='shop_slip.png')

        # A9: status in the action bar is not a button
        st = json.loads(await J("(() => { S.boat.status = 'unmooring'; renderActs(); const s = document.getElementById('dockInfo'), cs = getComputedStyle(s); return {text:s.textContent, border:cs.borderTopStyle, pe:cs.pointerEvents, radius:cs.borderTopLeftRadius}; })()"))
        check(st['text'] == 'Kaster loss …' and st['border'] == 'dashed' and st['pe'] == 'none' and st['radius'] == '8px', 'statusfeltet over knappene ser ikke ut som en knapp', st)
        print('sidefeil', errs)
        await b.close()

asyncio.run(main())
