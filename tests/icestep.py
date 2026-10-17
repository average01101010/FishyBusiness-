"""The jig and the ice (Jonas 07.10.2026): the hand jig is mounted from the start and there is no ice on the first fishing; Father's naust
is a home, not a place of trade (no market, village or yard buttons, nothing sold); after the first landing the guide's «ice» step sends the
player to the plant's ice page, where the first fill is on the house, with a word from the plant. Prints OK or FEIL per check."""
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
        # 3. after the first landing the guide sends the player to the ice page, and the first fill is on the house
        d = await pg.evaluate("""(() => { const b = S.boat; b.berth = 'main'; b.status = 'port'; b.port = 'botnhamn'; const q = portById('botnhamn'); b.pos = {x:q.p.x, y:q.p.y}; b.ice = 0;
          const m = {}; for (const s of TSTEPS) { if (s.id === 'ice' || s.id === 'goal') break; m[s.id] = 1; }
          S.tut = {v:2, m, catch:false, pAt:Date.now()}; S.lastSale = {port:'botnhamn', total:1000}; b.land = null; tutUpdate();
          const st = tutStep(), T = st && tutTip(st); return {step:st && st.id, tip:T && T.no}; })()""")
        check(d['step'] == 'ice' and 'Mottak' in (d['tip'] or ''), 'after the landing the guide asks for the ice, pointing to the market', d)
        await pg.evaluate("DOCK.open('is')"); await pg.wait_for_timeout(400)
        e = await pg.evaluate("""(() => { const bt = document.querySelector('#drawerBody [data-pa=shop][data-k=ice][data-fill]'); const T = tutTip(tutStep()); return {btn:bt ? bt.textContent : null, ring:T.el === bt}; })()""")
        check(e['btn'] and 'på huset' in e['btn'] and e['ring'], 'on the ice page the fill-up button is the guide\'s target and says it is on the house', e)
        await pg.evaluate("document.querySelector('#drawerBody [data-pa=shop][data-k=ice][data-fill]').click()"); await pg.wait_for_timeout(200)
        await pg.evaluate("document.querySelector('#drawerBody [data-pa=shop][data-k=ice][data-fill]').click()"); await pg.wait_for_timeout(400)
        f = await pg.evaluate("({ice:S.boat.ice, cash:S.cash, shift:!!S.boat.shift, mark:!!S.tut.m.free_ice, msg:(S.msgs || []).slice(-3).map(m => (m.no || m.txt || '').slice(0, 60))})")
        check((f['ice'] >= 149 or f['shift']) and f['mark'], 'two taps give the first fill of ice, paid by the plant', f)
        print('errors:', errs[:3]); await br.close()

asyncio.run(main())
