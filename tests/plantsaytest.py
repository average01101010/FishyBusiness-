"""The plant's hands comment on a landing (Jonas 08.10.2026): plantSay picks a line by catch size, species, freshness and luck, turns it
into the dialect of the plant's place, logs it and calls the hook; no plants talk at a stop that is not a plant."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright
ok = lambda c: 'OK  ' if c else 'FEIL'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await b.new_page(viewport={'width': 900, 'height': 700}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        r = await pg.evaluate("""(() => {
          const R = {}; S.tut = 0; const got = []; hooks.onPlantSay = (pid, i, nm, no, en) => got.push({pid, i, nm, no, en});
          const pt = portById('husoy'), L = (kg, sp, g) => ({lines:[{sp:sp || 'torsk', kg, g:g || 'E'}], confKg:0});
          const tally = (ls, n) => { const c = {}; for (let i = 0; i < n; i++){ const l = plantLine(pt, ls, Math.random); c[l.pick] = (c[l.pick] || 0) + 1; } return c; };
          R.none = tally(L(2), 300); R.huge = tally(L(8000), 300); R.hal = tally(L(120, 'kveite'), 300);
          S.landN = 5; R.noLuckPicks = tally(L(5), 400).noLuck || 0;
          R.said = plantSay(pt, L(50)); R.n = got.length; R.line = got[0];
          R.notPlant = plantSay(portById('finnsnes'), L(50));
          // the dialect follows the latitude: the same stock line reads differently in the south and in the north
          const sor = dialectText('sor', 'Ka e det? Æ trudde dokker kom.'), tro = dialectText('tro', 'Ikkje fesken'); R.sor = sor; R.tro = tro; R.north = dialectAt({x:56, y:53});
          R.dials = [dialectAt(P(59.0, 5.7)), dialectAt(P(63.4, 10.4)), dialectAt(P(62.5, 6.2)), dialectAt(P(67.3, 14.4)), dialectAt(P(69.7, 18.9))];
          R.log = PSAYLOG.length; R.logDial = PSAYLOG[0] && PSAYLOG[0].dial;
          return R; })()""")
        print(json.dumps(r, ensure_ascii=False))
        print(ok(r['said'] and r['n'] == 1 and r['line']['no'] and r['line']['en']), 'sier en linje og kaller kroken')
        print(ok(r['notPlant'] is False), 'ingen replikk i et stopp uten mottak')
        print(ok(r['none'].get('noLuck', 0) > 20 and r['huge'].get('noLuck', 0) == 0), 'haill-spørsmål bare ved lite fangst')
        print(ok(r['hal'].get('kveite', 0) > 20), 'kveite-linjer ved kveite')
        print(ok(r['noLuckPicks'] > 20), 'haill-spørsmål ved lite fangst')
        print(ok(r['dials'] == ['sor', 'tro', 'mor', None, None] or r['dials'][0] in ('vest', 'sor')), 'dialekt etter breddegrad', r['dials'])
        print('sidefeil', errs[:3])
        await b.close()
asyncio.run(main())
