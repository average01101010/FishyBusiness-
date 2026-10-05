from _env import GAME, boot
# The boot barrier (11-boot.js): after a reload the time away is played only when the depths are in, and the clock does not step before.
# Since the map packs (phase K3 of the coast plan) the saved game is not even read before the map is in, so before SIMREADY there is
# either no game yet or one whose clock stands.
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 900, 'height': 700})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        await pg.wait_for_function("SIMREADY === true", timeout=30000)
        t0 = await pg.evaluate("(() => { S.boatName = 'Prøve'; save(); window.removeEventListener('pagehide', save); window.save = () => {}; const o = JSON.parse(localStorage.getItem(KEY)); o.lastReal = Date.now() - 2 * 3600e3; localStorage.setItem(KEY, JSON.stringify(o)); return o.t; })()")
        # watch the reload: before the depths are in, the clock must stand
        await pg.add_init_script("window.__early = []; const iv = setInterval(() => { try { window.__early.push([typeof S !== 'undefined' && S ? S.t : null, typeof SIMREADY !== 'undefined' && SIMREADY, typeof DEPTH !== 'undefined' && !!DEPTH]); } catch (e) {} if (window.__early.length > 400) clearInterval(iv); }, 5);")
        await pg.reload()
        await pg.wait_for_function("typeof SIMREADY !== 'undefined' && SIMREADY === true", timeout=60000)
        r = await pg.evaluate("({t:S.t, away:!!document.querySelector('#modal:not([hidden]) .log, #modal:not([hidden]) h2'), depth:!!DEPTH, early:window.__early})")
        early = r['early']; before = [e for e in early if not e[1]]
        stood = all(e[0] is None or e[0] == t0 for e in before); moved = r['t'] - t0
        print(json.dumps({'t0': t0, 'moved': moved, 'samplesBefore': len(before), 'stood': stood, 'depth': r['depth'], 'awayModal': r['away']}))
        print(ok(len(before) > 0 and stood), 'before the depths are in, the clock stands')
        print(ok(r['depth'] and 715 <= moved <= 730 and r['away']), 'then the two hours away are played (720 game minutes) with the depths loaded, and «Mens du var borte» shows')
        # the free start skiff of an old save becomes Father's wooden boat, its 90 hp outboard paid back; a skiff bought at the yard stays
        # (05.10.2026, «Den båten der skal kun være tilgjengelig for kjøp i verftet … For alle brukere»)
        mk = """(owned => { SAVE_OFF = true; const o = JSON.parse(localStorage.getItem(KEY)), v = o.fleet && o.fleet.length ? o.fleet[0] : o; v.boat.type = 'skiff'; v.boat.fuel = 80; v.equip.motor90 = true;
          o.owned = owned; o.cash = 20000; localStorage.setItem(KEY, JSON.stringify(o)); })"""
        SK = "({type:S.boat.type, fuel:S.boat.fuel, motor:!!S.equip.motor90, cash:Math.round(S.cash), owned:S.owned, said:S.log.filter(l => /bare kjøpes på verftet/.test(l.no || '')).length})"
        res = []
        for owned in (['skiff'], ['trebat', 'skiff']):
            await pg.evaluate(mk + '(' + json.dumps(owned) + ')'); await pg.reload()
            await pg.wait_for_function("typeof SIMREADY !== 'undefined' && SIMREADY === true", timeout=60000); res.append(await pg.evaluate(SK))
        a, c = res
        print(ok(a['type'] == 'trebat' and a['fuel'] <= 60 and not a['motor'] and a['cash'] == 20000 + 148000 and a['owned'] == ['trebat'] and a['said'] == 1),
              "an old save's free start skiff becomes Father's wooden boat, the 90 hp outboard paid back, and the log says why", a)
        print(ok(c['type'] == 'skiff' and c['motor'] and c['cash'] == 20000 and c['said'] <= a['said']), 'a skiff bought at the yard stays (and no new line in the log)', {'kept': c, 'start': a})
        print('errors:', errs[:4]); await b.close()
asyncio.run(main())
