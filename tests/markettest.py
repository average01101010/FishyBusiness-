"""M4 in docs/planer/butikker-og-sponsorer.md: the used-boat market. Kystmegleren in the Net app lists the boats for sale along the coast
(core/09k-market.js), sorted and filtered; a listing has its number, the key facts, the seller's lines, Tilstand, Følger med and the
spec sheet; a bid is made from anywhere, once a day; the survey and the purchase only at the yard where she lies, where «Båter til salgs
her» shows her; bought, she comes with her hours and her gear and is gone from the market. Pictures in both formats. Prints OK or FEIL."""
from _env import boot
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:400]) if extra != '' else ''))


FIT = """(() => { const d = document.querySelector('%s'), r = d.getBoundingClientRect();
  return [...d.querySelectorAll('*')].filter(e => { const q = e.getBoundingClientRect(); return q.width && q.right > r.right + 1 && !e.closest('svg'); }).map(e => e.tagName + '.' + e.className).slice(0, 5); })()"""


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch()
        pg = await br.new_page(viewport={'width': 1280, 'height': 800}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        await pg.evaluate("(() => { S.cash = 300000; S.mkt = null; S.boat.status = 'port'; renderActs(); })()")
        n = await pg.evaluate("mktListings().length")
        check(n >= 10, 'markedet har båter til salgs', n)
        # the Net app: the broker's tile, then the list
        await pg.evaluate("PHONE.show(true); PHONE.open('nett')"); await pg.wait_for_timeout(300)
        tile = await pg.evaluate("!!document.querySelector('#phone .net-tile[data-s=megler]')")
        check(tile, 'Nettet har Kystmegleren som bokmerke')
        await pg.evaluate("document.querySelector('#phone .net-tile[data-s=megler]').click()"); await pg.wait_for_timeout(300)
        cards = await pg.evaluate("[...document.querySelectorAll('#phone .mg-card')].map(c => c.dataset.id)")
        check(len(cards) == n, 'lista viser alle båtene til salgs', [len(cards), n])
        await pg.screenshot(path='megler_liste_liggende.png')
        await pg.evaluate("document.querySelector('#phone [data-pa=mgsort][data-s=cheap]').click()"); await pg.wait_for_timeout(200)
        pr = await pg.evaluate("[...document.querySelectorAll('#phone .mg-card')].map(c => mktPrice(mktById(c.dataset.id)))")
        check(pr == sorted(pr), '«Billigst» sorterer etter pris')
        await pg.evaluate("document.querySelector('#phone [data-pa=mgtab][data-s=kyst]').click()"); await pg.wait_for_timeout(200)
        cl = await pg.evaluate("[...document.querySelectorAll('#phone .mg-card')].map(c => VESSELS[mktById(c.dataset.id).type].cls)")
        check(all(c == 'kyst' for c in cl), 'fanen Kystflåten viser bare kystbåtene', cl)
        await pg.evaluate("document.querySelector('#phone [data-pa=mgtab][data-s=alle]').click(); document.querySelector('#phone [data-pa=mgsort][data-s=near]').click()"); await pg.wait_for_timeout(200)
        # a listing, away from where she lies: everything to read, a bid, no survey and no purchase
        Lid = await pg.evaluate("(() => { const A = mktListings().filter(x => x.port !== S.boat.port && VESSELS[x.type].cls === 'open' && x.H1 > S.t / 60 + 72); return A.sort((a, b) => mktPrice(a) - mktPrice(b))[0].id; })()")
        await pg.evaluate("(id => { mgSel = null; document.querySelector('#phone .mg-card[data-id=\"' + id + '\"]') ? document.querySelector('#phone .mg-card[data-id=\"' + id + '\"]').click() : null; })('%s')" % Lid); await pg.wait_for_timeout(300)
        sh = await pg.evaluate("""(() => { const t = document.querySelector('#phone .mg-sheet').textContent;
          return {nr:t.includes('%s'), tilstand:t.includes('Tilstand'), folger:t.includes('Følger med'), seller:!!document.querySelector('#phone .mg-seller'), forbehold:t.includes('uten ansvar'), buy:!!document.querySelector('#phone [data-pa=mgbuy]'), takst:!!document.querySelector('#phone [data-pa=mgtakst]'), go:!!document.querySelector('#phone [data-pa=goplace]'), bid:!!document.querySelector('#phone [data-pa=mgbid]')}; })()""" % Lid)
        check(sh['nr'] and sh['tilstand'] and sh['folger'] and sh['seller'] and sh['forbehold'] and sh['go'] and sh['bid'] and not sh['buy'] and not sh['takst'],
              'oppføringen har nummer, Tilstand, Følger med, selgerkortet med forbeholdet, bud og Autonav, men ikke takst og kjøp herfra', sh)
        await pg.screenshot(path='megler_bat_liggende.png')
        fit = await pg.evaluate(FIT % '#phone')
        check(not fit, 'ingenting stikker ut av telefonen liggende', fit)
        # bids: under 90 % says the floor; a fair bid gets yes or a counter; one a day
        b1 = await pg.evaluate("(() => { const L = mktById('%s'); document.getElementById('mgBid').value = Math.round(mktAsk(L) * 0.5); document.querySelector('#phone [data-pa=mgbid]').click(); return document.querySelector('#phone .mg-sheet').innerText.includes('minst'); })()" % Lid)
        b2 = await pg.evaluate("(() => { const L = mktById('%s'); document.getElementById('mgBid').value = Math.ceil(mktAsk(L) * 0.93); document.querySelector('#phone [data-pa=mgbid]').click(); const t = document.querySelector('#phone .mg-sheet').textContent; return {ok:/tar budet|sier nei/.test(t), again:!!document.querySelector('#phone [data-pa=mgbid]')}; })()" % Lid)
        check(b1 and b2['ok'] and not b2['again'], 'et for lavt bud sier hva som trengs, et bud fra 90 % får svar, og ett bud om dagen', [b1, b2])
        # standing up
        await pg.set_viewport_size({'width': 800, 'height': 1280}); await pg.wait_for_timeout(400)
        await pg.screenshot(path='megler_bat_staaende.png')
        fit2 = await pg.evaluate(FIT % '#phone')
        await pg.evaluate("document.querySelector('#phone [data-pa=mgsel]:not([data-id])').click()"); await pg.wait_for_timeout(300)
        await pg.screenshot(path='megler_liste_staaende.png')
        fit3 = await pg.evaluate(FIT % '#phone')
        check(not fit2 and not fit3, 'ingenting stikker ut av telefonen stående', [fit2, fit3])
        await pg.set_viewport_size({'width': 1280, 'height': 800})
        await pg.evaluate("PHONE.show(false)")

        # at the yard where she lies: «Båter til salgs her», the free survey, and the purchase
        await pg.evaluate("""(id => { const L = mktById(id), q = portById(L.port); S.boat.port = L.port; S.boat.pos = {x:q.p.x, y:q.p.y}; S.boat.status = 'port'; S.boat.berth = 'main'; S.cash = mktPrice(L) * 3 + 500000; S.sales = S.sales.length >= 3 ? S.sales : [{}, {}, {}]; mgSel = null; renderActs(); DOCK.open('fartoy'); })('%s')""" % Lid)
        await pg.wait_for_timeout(400)
        hr = await pg.evaluate("(() => { const c = document.querySelector('#drawerBody .mg-here'); return c ? [...c.querySelectorAll('.mg-card')].map(x => x.dataset.id) : null; })()")
        check(hr is not None and Lid in hr, 'verftet der hun ligger, viser henne under «Båter til salgs her»', hr)
        await pg.evaluate("document.querySelector('#drawerBody .mg-here .mg-card[data-id=\"%s\"]').click()" % Lid); await pg.wait_for_timeout(300)
        cash0 = await pg.evaluate("S.cash")
        await pg.evaluate("document.querySelector('#drawerBody [data-pa=mgtakst]').click()"); await pg.wait_for_timeout(300)
        tk = await pg.evaluate("({takst:!!mktState().takst['%s'], free:mktState().freeTakst, cash:S.cash, motor:document.querySelector('#drawerBody .mg-sheet').innerText.includes('oppgitt')})" % Lid)
        check(tk['takst'] and not tk['free'] and tk['cash'] == cash0 and tk['motor'], 'den første taksten er gratis, og den sier om motoren er som oppgitt', tk)
        await pg.screenshot(path='megler_verft_liggende.png')
        L0 = await pg.evaluate("JSON.parse(JSON.stringify(mktById('%s')))" % Lid)
        btn = await pg.evaluate("(() => { const b = document.querySelector('#drawerBody [data-pa=mgbuy][data-ti=\"1\"]'); return b ? !b.disabled : null; })()")
        await pg.evaluate("document.querySelector('#drawerBody [data-pa=mgbuy][data-ti=\"1\"]').click()"); await pg.wait_for_timeout(400)
        af = await pg.evaluate("({type:S.boat.type, engH:S.boat.engH, eq:JSON.parse(JSON.stringify(S.equip)), gone:!mktListings().some(x => x.id === '%s'), log:S.log.slice(-3).map(x => x.no).join(' | ')})" % Lid)
        ex_ok = all(af['eq'].get(q) for q in L0['ex'])
        check(btn and af['type'] == L0['type'] and af['engH'] == L0['engH'] and ex_ok and af['gone'], 'kjøpt med innbytte: båten er hennes, med motortimene og utstyret, og hun er borte fra markedet', [btn, af, L0['ex']])
        # the wish
        await pg.evaluate("(() => { mktState().wish = {cls:'open', max:1e9}; PHONE.show(true); PHONE.open('nett'); const bk = document.querySelector('#phone .mkback[data-s=home]'); if (bk) bk.click(); })()"); await pg.wait_for_timeout(300)
        wt = await pg.evaluate("(document.querySelector('#phone .net-tile[data-s=megler]') || {}).innerText || ''")
        check('passer ønsket' in wt, 'Nettet sier hvor mange som passer ønsket båt', wt)
        # the goal line on the cards
        gl = await pg.evaluate("(() => { const bk = document.querySelector('#phone .net-tile[data-s=megler]'); if (bk) bk.click(); return document.querySelectorAll('#phone .mg-card .mg-goal').length === document.querySelectorAll('#phone .mg-card').length; })()")
        await pg.wait_for_timeout(200)
        gl = await pg.evaluate("document.querySelectorAll('#phone .mg-card .mg-goal').length > 0 && document.querySelectorAll('#phone .mg-card .mg-goal').length === document.querySelectorAll('#phone .mg-card').length")
        check(gl, 'hvert kort sier hvor nær egenkapitalen er det banken krever')
        # your own boat: a second boat at a yard, listed with the broker from the Company app, withdrawn, and delivered to where you are
        r = await pg.evaluate("""(() => { const yard = PORTS.find(p => portServices(p).verft && p.id !== S.boat.port && dist(p.p, S.boat.pos) / NM < 150 && dist(p.p, S.boat.pos) / NM > 10);
          const v = newVesselObj('skiff', yard.id); vget(v, 'boat').status = 'port'; S.cash = 2e6; window._v = v.id; PHONE.open('rederi'); const q = s => document.querySelector('#phone ' + s);
          const btn = {own:!!q('[data-pa=mgown][data-id=' + v.id + ']'), del:[...document.querySelectorAll('#phone [data-pa=mgdel][data-id=' + v.id + ']')].map(b => b.dataset.to)};
          q('[data-pa=mgown][data-id=' + v.id + ']').click(); const listed = !!mktOwn(v.id), un = !!q('[data-pa=mgunown][data-id=' + v.id + ']');
          q('[data-pa=mgunown][data-id=' + v.id + ']').click(); const c0 = S.cash; q('[data-pa=mgdel][data-id=' + v.id + '][data-to=' + S.boat.port + ']').click();
          return {btn, listed, un, gone:!mktOwn(v.id), del:(mktState().del || []).length, paid:c0 - S.cash, home:S.boat.port, row:(q('.mg-own') || {}).textContent || ''}; })()""")
        check(r['btn']['own'] and r['home'] in r['btn']['del'] and r['listed'] and r['un'] and r['gone'] and r['del'] == 1 and r['paid'] > 0,
              'Rederi-appen legger en båt ut hos megleren, trekker henne, og får henne levert dit du er', r)
        await pg.screenshot(path='megler_rederi_liggende.png')
        d = await pg.evaluate("(() => { const D = mktState().del[0]; S.t = Math.ceil(D.H1) * 60; mktHour(S.t / 60); return {port:vget(vesselById(window._v), 'boat').port, me:S.boat.port}; })()")
        check(d['port'] == d['me'], 'når seilingstida er gått, ligger hun der du er', d)
        await pg.set_viewport_size({'width': 800, 'height': 1280}); await pg.evaluate("PHONE.open('rederi')"); await pg.wait_for_timeout(300)
        await pg.screenshot(path='megler_rederi_staaende.png')
        fit4 = await pg.evaluate(FIT % '#phone')
        check(not fit4, 'Rederi-appen får plass stående', fit4)
        print('sidefeil', errs)
        await br.close()

asyncio.run(main())
