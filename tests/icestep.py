"""The jig and the ice (Jonas 07.10.2026): the hand jig is mounted from the start and there is no ice on the first fishing; Father's naust
is a home, not a place of trade (no market, village or yard buttons, nothing sold); after the first trip the first fill of ice waits on the
plant as the task left open, and the handbook's first drip sends the player to the ice page, where it is on the house. Prints OK or FEIL per check."""
from _env import GAME_TUT, GAME, boot
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:400]) if extra != '' else ''))


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        ctx = await br.new_context(viewport={'width': 1100, 'height': 800}); pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + '#qfix'); await pg.wait_for_timeout(600)
        # 1. a new boat has the jig and no ice; an old first trip begun without the jig gets it
        a = await pg.evaluate("({gear:S.boat.gear, ice:S.boat.ice})")
        check(a['gear'] is True and a['ice'] == 0, 'a new boat has the hand jig aboard and no ice', a)
        b = await pg.evaluate("(() => { S.tut = {v:2, m:{}, catch:true, pAt:Date.now()}; S.boat.gear = false; tutUpdate(); return S.boat.gear; })()")
        check(b is True, 'a first trip begun without the jig gets it', b)
        # 2. Father's naust sells nothing
        ok = await pg.evaluate("(async () => { for (let i = 0; i < 200 && !quayFace(S.home || 'finnsnes', 'naust'); i++) await new Promise(r => setTimeout(r, 100)); return !!quayFace(S.home || 'finnsnes', 'naust'); })()")
        if ok:
            c = await pg.evaluate("(() => { const b = S.boat; b.berth = 'naust'; S.tut = 0; DOCK.render(); return {items:DOCK.items().map(x => x.id), buy:shopBuy('ice', 50, false), atTrade:berthKind(b)}; })()")
            check(c['atTrade'] == 'naust' and not any(i in c['items'] for i in ('marked', 'bygd', 'verft')) and 'naustup' in c['items'] and 'beh' in c['items'] and c['buy'] and 'hjem' in c['buy'][0], 'at the naust: no market, village or yard buttons, and nothing is sold', c)
        else: check(False, 'the naust is found in the home harbour')
        # 3. the ice is the task the first trip leaves open (Onboarding 2, O4, V5 A, 27.10.2026): after the first trip the first fill waits on
        # the plant (S.iceFree), the handbook's first drip points to the ice page, and two taps give it, paid by the plant
        d = await pg.evaluate("""(() => { const b = S.boat; b.berth = 'main'; b.status = 'port'; b.port = 'botnhamn'; const q = portById('botnhamn'); b.pos = {x:q.p.x, y:q.p.y}; b.ice = 0;
          S.tut = {v:2, m:{}, catch:false, pAt:Date.now()}; tutFinish(); S.landN = 1; S.hb = {seen:{}, skip:{}, at:0}; if (DOCK.page) DOCK.close(); PHONE.show(false); tutUpdate();
          return {iceFree:!!S.iceFree, free:tutFree('ice'), drip:tutCur && tutCur.st.id, tip:$('tip').hidden ? '' : $('tipText').textContent}; })()""")
        check(d['iceFree'] and d['free'] and d['drip'] == 'hb:is' and 'Mottak' in d['tip'], 'after the first trip the first fill of ice waits on the plant, and the first drip sends the player to it', d)
        await pg.evaluate("DOCK.open('is'); tutUpdate()"); await pg.wait_for_timeout(400)
        e = await pg.evaluate("""(() => { const bt = document.querySelector('#drawerBody [data-pa=shop][data-k=ice][data-fill]'); tutUpdate(); return {btn:bt ? bt.textContent : null, ring:!!(tutCur && tutCur.T0 && tutCur.T0.el === bt)}; })()""")
        check(e['btn'] and 'på huset' in e['btn'] and e['ring'], 'on the ice page the fill-up button is the drip\'s target and says it is on the house', e)
        await pg.evaluate("document.querySelector('#drawerBody [data-pa=shop][data-k=ice][data-fill]').click()"); await pg.wait_for_timeout(200)
        await pg.evaluate("document.querySelector('#drawerBody [data-pa=shop][data-k=ice][data-fill]').click()"); await pg.wait_for_timeout(400)
        f = await pg.evaluate("({ice:S.boat.ice, cash:S.cash, shift:!!S.boat.shift, iceFree:!!S.iceFree, free:tutFree('ice')})")
        check((f['ice'] >= 149 or f['shift']) and not f['iceFree'] and not f['free'], 'two taps give the first fill of ice, paid by the plant, once', f)
        print('errors:', errs[:3]); await br.close()

asyncio.run(main())
