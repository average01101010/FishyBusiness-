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
        pgv = await pg.evaluate("""(() => { const sw = [...document.querySelectorAll('#drawerBody .pnt-sw[data-pa=pntsel]')], btn = document.querySelector('#drawerBody [data-pa=pntgo]');
          return {n:sw.length, title:document.getElementById('drawerTitle') ? document.getElementById('drawerTitle').textContent : '', btn:btn.textContent, dis:btn.disabled, painting:G3.painting}; })()""")
        check(pgv['n'] == 17 and pgv['dis'] and pgv['painting'], 'the paint shop shows the original and 16 hull colours, nothing to paint until one is chosen, and the 3D view turns round the boat', pgv)
        # trying a colour: on the boat, nothing paid
        cash0 = await pg.evaluate("S.cash")
        t = await pg.evaluate("""(() => { document.querySelector('#drawerBody .pnt-sw[data-k=kobolt]').click(); const btn = document.querySelector('#drawerBody [data-pa=pntgo]');
          return {pre:PAINTPRE, liv:hullLiv(S.boat), btn:btn.textContent, dis:btn.disabled, cash:S.cash, own:S.boat.liv || null}; })()""")
        check(t['pre'] and t['pre'].get('hull') == 'kobolt' and t['liv'] and abs(t['liv']['hull'][2] - 0.55) < 1e-6 and 'gratis' in t['btn'] and not t['dis'] and t['cash'] == cash0 and t['own'] is None,
              'a tapped colour shows on the boat at once, nothing is paid, and the first choice says free', t)
        # painting: free the first time
        await pg.evaluate("document.querySelector('#drawerBody [data-pa=pntgo]').click()")
        a = await pg.evaluate("({liv:S.boat.liv, cash:S.cash, log:S.log.slice(-1)[0].no})")
        check(a['liv'] == {'hull': 'kobolt'} and a['cash'] == cash0 and 'koboltblå' in a['log'], 'the first paint job is free and the boat keeps the colour', a)
        # the next costs about 1 % of the boat's price, at least 1 500 kr
        b = await pg.evaluate("""(() => { document.querySelector('#drawerBody .pnt-sw[data-k=oksblod]').click(); const btn = document.querySelector('#drawerBody [data-pa=pntgo]').textContent, pr = PAINT.price(S.boat);
          document.querySelector('#drawerBody [data-pa=pntgo]').click(); return {btn, pr, want:Math.max(1500, Math.round(VESSELS[S.boat.type].price / 10000) * 100), paid:%d - S.cash, liv:S.boat.liv}; })()""" % cash0)
        check(b['pr'] == b['want'] and b['paid'] == b['pr'] and b['liv'] == {'hull': 'oksblod'} and 'gratis' not in b['btn'], "painting again costs about 1 % of the boat's price, at least 1 500 kr", b)
        # a design: tried on before it is bought (shows on the boat, a buy button with the price), bought (a test here, no payment), then
        # the boat's and yours on every boat, and it goes to the others with the paint; its line is cut into the hull
        dz = await pg.evaluate("""(() => { const q = s => document.querySelector('#drawerBody ' + s);
          q('.pnt-sw[data-pa=pntd][data-d=ripe][data-k=hvit]').click(); const tried = {liv:hullLiv(S.boat), note:document.getElementById('drawerBody').innerText.includes('Du prøver ripestripe'), buy:!!q('[data-pa=pntbuy][data-d=ripe]'), own:PAINT.owned('ripe')};
          q('[data-pa=pntbuy][data-d=ripe]').click(); const after = {own:PAINT.owned('ripe'), liv:JSON.parse(JSON.stringify(S.boat.liv)), str:livStr(S.boat)};
          const base = buildVesselModel('sjark', 1, {hull:[0.1, 0.25, 0.55, 0.6]}), cut = buildVesselModel('sjark', 1, {hull:[0.1, 0.25, 0.55, 0.6], ripe:[0.93, 0.94, 0.93]});
          let white = 0; for (let i = 0; i < cut.o.c.length; i += 4) if (cut.o.c[i] > 0.3 && Math.abs(cut.o.c[i] - cut.o.c[i + 2]) < 0.02 && cut.o.c[i + 1] > 0.3) white++;
          return {tried, after, nBase:base.o.p.length / 3, nCut:cut.o.p.length / 3, white, fits:Object.keys(VESSELS).map(t => [t, DESIGNS.filter(k => designFits(t, k)).join(',')])}; })()""")
        tr, af = dz['tried'], dz['after']
        check(tr['liv'] and tr['liv'].get('ripe') and tr['note'] and tr['buy'] and not tr['own'] and af['own'] and af['liv'].get('d', {}).get('ripe') == 'hvit' and 'r:hvit' in af['str']
              and dz['nCut'] > dz['nBase'] and dz['white'] > 30 and all(f for t, f in dz['fits']),
              'a design is tried on the boat before it is bought, then it is yours, on the boat and in what the others see; its stripe is cut into the hull, and every type can wear some', {'tried': tr, 'after': af, 'n': [dz['nBase'], dz['nCut'], dz['white']], 'fits': dz['fits']})
        # the flag: Norway's rectangle as she came; another nation and shape tried, then the flags bought (a test), on the boat and in what the
        # others see; Norway's swallowtail is not offered (lov om Norges flagg); the picture keeps the notch clear
        fl = await pg.evaluate("""(() => { const q = s => document.querySelector('#drawerBody ' + s); const n0 = q('[data-pa=pntfs][data-k=splitt]').disabled;
          q('.pnt-fl[data-k=SE]').click(); q('[data-pa=pntfs][data-k=vimpel]').click(); const tried = {f:flagOf(PAINTPRE), buy:!!q('[data-pa=pntbuy][data-d=flagg]'), price:(q('[data-pa=pntbuy][data-d=flagg]') || {}).textContent};
          q('[data-pa=pntbuy][data-d=flagg]').click(); const after = {own:PAINT.owned('flagg'), flag:S.boat.liv && S.boat.liv.flag, str:livStr(S.boat)};
          const cv = document.createElement('canvas'); cv.width = 100; cv.height = 75; flagCanvas(cv, 'DK', 'splitt'); const g = cv.getContext('2d'), notch = g.getImageData(95, 37, 1, 1).data[3], body = g.getImageData(20, 10, 1, 1).data[3];
          return {n0, tried, after, notch, body, n:Object.keys(FLAGS).length}; })()""")
        check(fl['n0'] and fl['tried']['f'] == {'code': 'SE', 'shape': 'vimpel'} and fl['tried']['buy'] and fl['after']['own'] and fl['after']['flag'] == {'c': 'SE', 's': 'vimpel'}
              and 'f:SE.vimpel' in fl['after']['str'] and fl['notch'] == 0 and fl['body'] == 255 and fl['n'] >= 40,
              "the flag: Norway's swallowtail is not offered, another nation and shape show on the boat when tried, and once the flags are yours she flies it and the others see it", fl)
        # the registration mark: the home harbour's municipality's letters and a number no real vessel there has; a real boat's number is
        # refused; one's own number (a test purchase) goes on the boat, on the permit and to the others; Ø travels as 2 and comes back
        rg = await pg.evaluate("""(() => { const r0 = Object.assign({}, regOf(S.boat)), real = REGM.k.senja[2][2], q = s => document.querySelector('#drawerBody ' + s);
          const card = document.getElementById('drawerBody').innerText.includes(regText(r0));
          q('#pntNum').value = real; q('[data-pa=pntreg]').click(); const refused = regOf(S.boat).n === r0.n;
          let n = 777; while (REGM.k.senja[2].includes(n)) n++; q('#pntNum').value = n; q('[data-pa=pntreg]').click();
          return {r0, used:REGM.k.senja[2].includes(r0.n), card, refused, n, r1:regOf(S.boat), own:PAINT.owned('reg'), str:livStr(S.boat), back:livMark(livStr(S.boat)), oe:livMark('m:N.12.B2'),
            strips:Object.keys(VESSELS).filter(t => markStrips(t)).length, types:Object.keys(VESSELS).length}; })()""")
        await pg.wait_for_function("regOf(S.boat).n !== %d" % rg['r0']['n'], timeout=10000)
        rg2 = await pg.evaluate("({r:regOf(S.boat), papers:(PHONE.dact('home', 'papers', {}), PHONE.open('sjomann'), document.getElementById('phView').innerText)})")
        await pg.evaluate("PHONE.show(false)")
        want = 'T-%d-LK' % rg['n']
        check(rg['r0']['f'] == 'T' and rg['r0']['k'] == 'LK' and not rg['used'] and rg['card'] and rg['refused'] and rg2['r']['n'] == rg['n'] and want in rg2['papers']
              and rg['back'] in (want, 'T-%d-LK' % rg['r0']['n']) and rg['oe'] == 'N-12-BØ' and rg['strips'] >= rg['types'] - 1,
              "the registration mark: Senja's letters (T-..-LK) and a number no real boat there has; a real boat's number is refused, one's own goes on the boat and the permit; it travels to the others", {'rg': rg, 'r': rg2['r']})
        # too little money: the button is off
        c = await pg.evaluate("""(() => { S.cash = 100; document.querySelector('#drawerBody .pnt-sw[data-k=gul]').click(); const btn = document.querySelector('#drawerBody [data-pa=pntgo]');
          return {dis:btn.disabled, note:document.getElementById('drawerBody').innerText.includes('ikke nok penger')}; })()""")
        check(c['dis'] and c['note'], 'without the money the button is off and says so', c)
        # closing the drawer ends the trying; the paint is in the save
        d = await pg.evaluate("""(() => { DOCK.close(); save(); const sv = JSON.parse(localStorage.getItem('kystfiske_v2') || '{}'), v = (sv.fleet || []).find(x => x.id === sv.cur) || {};
          return {pre:PAINTPRE, painting:G3.painting, liv:hullLiv(S.boat), saved:(v.boat && v.boat.liv) || (sv.boat && sv.boat.liv) || null}; })()""")
        check(d['pre'] is None and not d['painting'] and d['liv'] and abs(d['liv']['hull'][0] - 0.42) < 1e-6 and d['saved'] and d['saved'].get('hull') == 'oksblod',
              'closing the drawer ends the trying and the turning camera; the boat keeps her paint, and it is in the save', d)
        # a boat bought in trade starts unpainted, with a free first choice
        e = await pg.evaluate("""(() => { PHONE.switchVessel('sjark'); return {type:S.boat.type, liv:S.boat.liv || null}; })()""")
        check(e['type'] == 'sjark' and e['liv'] is None, 'a boat taken in trade starts in her own colour with a free first choice', e)
        check(errs == [], 'sidefeil', errs)
        await br.close()

asyncio.run(main())
