"""One clock for everyone (05.10.2026, core/01-world.js WCLOCK; Jonas: «det er viktig at alle har en delt klokke fordi dette er et
online-spill»), with #world on the local test server: a new game begins at the world's minute on the world's seed, the admin's pace
does nothing, the clock is set from the server's Date, a game behind the world plays the time away up to it, a game ahead (a save from
before) is not put back but goes at half pace, a jump of the world's clock is caught up, a save behind it is caught up after a reload,
and the Admin app shows the shared clock instead of the pace. Prints OK or FEIL per check."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:400]) if extra != '' else ''))


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        ctx = await br.new_context(viewport={'width': 1100, 'height': 800}); pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + '#world#notut'); await pg.wait_for_timeout(800)
        # 1. a new game at the world's minute, on the world's seed; no pace of one's own; the clock from the server
        a = await pg.evaluate("(() => { S.mult = 30; return {on:WCLOCK.on, t:S.t, w:worldT(), seed:S.qseed === WORLD_SEED, rate:simRate(), off:WCLOCK.off, date:dayStr(S.t / 60) + ' ' + hm(S.t / 60), wdate:dayStr(worldT() / 60) + ' ' + hm(worldT() / 60)}; })()")
        check(a['on'] and abs(a['t'] - a['w']) <= 2 and a['seed'] and a['date'] == a['wdate'], 'a new game begins at the world\'s date and hour, on the seed everyone shares', a)
        check(a['rate'] == 6 and abs(a['off']) < 3000, 'the admin\'s pace does nothing (6×), and the clock is set from the server\'s Date', {'rate': a['rate'], 'off': a['off']})
        # 2. behind the world (the tab slept): the time away is played up to it
        b = await pg.evaluate("(() => { S.t = worldT() - 600; window.__t0 = S.t; return S.t; })()")
        await pg.wait_for_timeout(2500)
        b = await pg.evaluate("({t:S.t, w:worldT(), away:!document.getElementById('modal').hidden && /borte|away/i.test(document.getElementById('modal').innerText)})")
        check(abs(b['t'] - b['w']) <= 2 and b['away'], 'ten game hours behind the world: the time away is played up to it, and «Mens du var borte» shows', b)
        await pg.evaluate("document.getElementById('modal').hidden = true")
        # 3. ahead of the world (a save from before): not put back, half pace until the world catches up
        c = await pg.evaluate("(() => { S.t = worldT() + 120; window.__c0 = S.t; return S.t; })()")
        await pg.wait_for_timeout(4000)
        c = await pg.evaluate("({t:S.t, t0:window.__c0, w:worldT()})")
        check(c['t'] >= c['t0'] and c['t'] - c['t0'] <= 1 and c['t'] > c['w'], 'two game hours ahead of the world: not put back, and it goes at half pace', c)
        # 4. the world's clock jumps an hour (the server's time): caught up
        d = await pg.evaluate("(() => { S.t = worldT(); WCLOCK.off += 3600000; return worldT(); })()")
        await pg.wait_for_timeout(2500)
        d = await pg.evaluate("({t:S.t, w:worldT()})")
        check(abs(d['t'] - d['w']) <= 2, 'an hour on the world\'s clock (six game hours) is caught up', d)
        await pg.evaluate("document.getElementById('modal').hidden = true; WCLOCK.off -= 3600000")
        # 5. a save behind the world is caught up after a reload
        await pg.evaluate("(() => { S.t = worldT() - 300; S.intro = true; S.boatName = S.boatName || 'Prøve'; save(); window.removeEventListener('pagehide', save); })()")
        await pg.reload(); await pg.wait_for_function("typeof SIMREADY !== 'undefined' && SIMREADY", timeout=90000); await pg.wait_for_timeout(2000)
        e = await pg.evaluate("({t:S.t, w:worldT(), seed:S.qseed === WORLD_SEED})")
        check(abs(e['t'] - e['w']) <= 2 and e['seed'], 'a save five game hours behind is on the world\'s clock after a reload', e)
        # 6. the Admin app: the shared clock instead of the pace buttons
        f = await pg.evaluate("(() => { document.getElementById('modal').hidden = true; PHONE.open('admin'); const t = document.querySelector('#phone .ph-c').innerText; PHONE.show(false); return {clock:/Felles klokke/.test(t), pace:/Tidsskala/.test(t)}; })()")
        check(f['clock'] and not f['pace'], 'the Admin app shows the shared clock, and no pace buttons', f)
        print('errors:', errs[:3]); await br.close()

asyncio.run(main())
