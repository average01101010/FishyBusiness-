"""The paint shop (ui/10j-paint.js, vessel3d.js HULLPAL/hullLiv; Jonas 06.10.2026): a button of its own under Verft; the page shows the
hull colours, a tapped colour shows on the boat (hullLiv) before anything is paid; the first choice on a boat is free, the next costs
about 1 % of the boat's price (at least 1 500 kr); the paint is kept in the save; closing the drawer ends the trying; a boat bought in
trade starts unpainted with a free first choice again. Prints OK or FEIL per check."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:400]) if extra != '' else ''))


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        ctx = await br.new_context(viewport={'width': 1100, 'height': 800}); pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        await pg.evaluate("(() => { S.boat.status = 'port'; S.cash = 50000; DOCK.render(); })()")
        fan = await pg.evaluate("DOCK.items('verft').map(x => x.id)")
        check('maler' in fan, 'Verft has a button of its own for the paint shop', fan)
        # the page: the colours, the first choice free
        await pg.evaluate("DOCK.open('maler')"); await pg.wait_for_selector('#drawerBody .pnt-sw')
        pgv = await pg.evaluate("""(() => { const sw = [...document.querySelectorAll('#drawerBody .pnt-sw')], btn = document.querySelector('#drawerBody [data-pa=pntgo]');
          return {n:sw.length, title:document.getElementById('drawerTitle') ? document.getElementById('drawerTitle').textContent : '', btn:btn.textContent, dis:btn.disabled, painting:G3.painting}; })()""")
        check(pgv['n'] == 17 and pgv['dis'] and pgv['painting'], 'the paint shop shows the original and 16 hull colours, nothing to paint until one is chosen, and the 3D view turns round the boat', pgv)
        # trying a colour: on the boat, nothing paid
        cash0 = await pg.evaluate("S.cash")
        t = await pg.evaluate("""(() => { document.querySelector('#drawerBody .pnt-sw[data-k=kobolt]').click(); const btn = document.querySelector('#drawerBody [data-pa=pntgo]');
          return {pre:PAINTPRE, liv:hullLiv(S.boat), btn:btn.textContent, dis:btn.disabled, cash:S.cash, own:S.boat.liv || null}; })()""")
        check(t['pre'] == 'kobolt' and t['liv'] and abs(t['liv']['hull'][2] - 0.55) < 1e-6 and 'gratis' in t['btn'] and not t['dis'] and t['cash'] == cash0 and t['own'] is None,
              'a tapped colour shows on the boat at once, nothing is paid, and the first choice says free', t)
        # painting: free the first time
        await pg.evaluate("document.querySelector('#drawerBody [data-pa=pntgo]').click()")
        a = await pg.evaluate("({liv:S.boat.liv, cash:S.cash, pre:PAINTPRE, log:S.log.slice(-1)[0].no})")
        check(a['liv'] == {'hull': 'kobolt'} and a['cash'] == cash0 and a['pre'] is None and 'koboltblå' in a['log'], 'the first paint job is free and the boat keeps the colour', a)
        # the next costs about 1 % of the boat's price, at least 1 500 kr
        b = await pg.evaluate("""(() => { document.querySelector('#drawerBody .pnt-sw[data-k=oksblod]').click(); const btn = document.querySelector('#drawerBody [data-pa=pntgo]').textContent, pr = PAINT.price(S.boat);
          document.querySelector('#drawerBody [data-pa=pntgo]').click(); return {btn, pr, want:Math.max(1500, Math.round(VESSELS[S.boat.type].price / 10000) * 100), paid:%d - S.cash, liv:S.boat.liv}; })()""" % cash0)
        check(b['pr'] == b['want'] and b['paid'] == b['pr'] and b['liv'] == {'hull': 'oksblod'} and 'gratis' not in b['btn'], "painting again costs about 1 % of the boat's price, at least 1 500 kr", b)
        # too little money: the button is off
        c = await pg.evaluate("""(() => { S.cash = 100; document.querySelector('#drawerBody .pnt-sw[data-k=gul]').click(); const btn = document.querySelector('#drawerBody [data-pa=pntgo]');
          return {dis:btn.disabled, note:document.getElementById('drawerBody').innerText.includes('ikke nok penger')}; })()""")
        check(c['dis'] and c['note'], 'without the money the button is off and says so', c)
        # closing the drawer ends the trying; the paint is in the save
        d = await pg.evaluate("""(() => { DOCK.close(); save(); const sv = JSON.parse(localStorage.getItem('kystfiske_v2') || '{}'), v = (sv.fleet || []).find(x => x.id === sv.cur) || {};
          return {pre:PAINTPRE, painting:G3.painting, liv:hullLiv(S.boat), saved:(v.boat && v.boat.liv) || (sv.boat && sv.boat.liv) || null}; })()""")
        check(d['pre'] is None and not d['painting'] and d['liv'] and abs(d['liv']['hull'][0] - 0.42) < 1e-6 and d['saved'] == {'hull': 'oksblod'},
              'closing the drawer ends the trying and the turning camera; the boat keeps her paint, and it is in the save', d)
        # a boat bought in trade starts unpainted, with a free first choice
        e = await pg.evaluate("""(() => { PHONE.switchVessel('sjark'); return {type:S.boat.type, liv:S.boat.liv || null}; })()""")
        check(e['type'] == 'sjark' and e['liv'] is None, 'a boat taken in trade starts in her own colour with a free first choice', e)
        check(errs == [], 'sidefeil', errs)
        await br.close()

asyncio.run(main())
