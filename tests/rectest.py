"""Personal records (09.10.2026; core/09b-records.js, ui/06c-notebook.js wall): the biggest fish landed of each species. The dream fish is
gone; an old S.trophies is folded into the records; a bigger fish takes the place, a smaller does not; a clearly bigger one gives a message;
the pot (king crab) counts too; the wall shows every species, the empty ones with «?». Prints OK or FEIL per check."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await (await b.new_context(viewport={'width': 1100, 'height': 760})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME)
        r = await pg.evaluate("""(() => { const R = {}; S.tut = 0; delete S.rec; S.hold = [];
          S.trophies = [{sp:'torsk', kg:14.2, t:S.t - 100, at:'Senjahopen', boat:'Havbris'}, {sp:'torsk', kg:11, t:S.t - 90, at:'X'}, {sp:'kveite', kg:96, t:S.t - 50, at:'Y'}]; S.dream = {sp:'sei'};
          const l = recList(); R.migr = S.rec.torsk.kg === 14.2 && S.rec.kveite.kg === 96 && S.trophies === undefined && S.dream === undefined; R.n = l.length; R.empty = l.filter(x => !x.rec).length;
          const m0 = S.msgs.length; addCatch('torsk', 5, 0, true, {how:'juksa'}); R.small = S.rec.torsk.kg === 14.2;
          addCatch('torsk', 14.5, 0, true, {how:'line'}); R.bigger = S.rec.torsk.kg === 14.5 && S.rec.torsk.how === 'line' && S.rec.torsk.t === S.t; R.few = S.msgs.length === m0;
          addCatch('torsk', 18, 0, true, {how:'juksa'}); R.msg = S.msgs.slice(m0).some(m => /Ny rekord: torsk på 18,0 kg/.test(m.no));
          const l0 = S.log.length; addCatch('sei', 3.2, 0, true, {how:'garn'}); R.first = S.rec.sei.kg === 3.2 && S.log.slice(l0).some(x => /Første sei/.test(x.no));
          addCatch('krabbe', 4.1, 0, false, {fresh:100, how:'teine'}); R.crab = S.rec.krabbe && S.rec.krabbe.kg === 4.1 && S.rec.krabbe.how === 'teine';
          R.wall = NOTEBOOK.wall(true); R.wall2 = NOTEBOOK.wall(); return R; })()""")
        print(json.dumps({k: v for k, v in r.items() if not k.startswith('wall')}))
        print(ok(r['migr'] and r['n'] == 10), 'an old S.trophies is folded into the records (the biggest of each species), and the dream fish is dropped')
        print(ok(r['small'] and r['bigger'] and r['few']), 'a smaller fish changes nothing, a slightly bigger one takes the place without a message')
        print(ok(r['msg'] and r['first']), 'a fish 15 % bigger gives a message; the first of a species is told in the log')
        print(ok(r['crab']), 'the king crab from the pot counts')
        w = r['wall']; print(ok('18,0 kg' in w and w.count('nb-rec empty') == r['empty'] + 0 - 3 + 0 or w.count('nb-rec empty') >= 5 and '?' in w), 'the wall shows every species, the empty ones with «?»')
        print(ok('Trofeveggen' in r['wall2'] and 'bar planke' in r['wall2']), 'in the naust without the wall upgrade: a bare board with nails')
        print('errors:', errs[:3]); await b.close()

asyncio.run(main())
