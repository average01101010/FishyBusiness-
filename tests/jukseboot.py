from _env import boot
# Valg 31 A (Jonas 10.11.2026: «Valg A»): the used hurtigsjark takes three jigging reels, the places her rails have (OB9, anchors.jigZ).
# A save with six reels at the tier with a display and counting: on load (ui/11-boot.js) the tier is bought back for every reel at what it
# cost, and the three reels over go ashore at the plain price; none of it is lost. Seen red without the tier's buy-back (102 000 back
# against 318 000). Prints OK or FEIL per check.
import asyncio
from playwright.async_api import async_playwright
ok = lambda c: 'OK  ' if c else 'FEIL'
async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await (await br.new_context(viewport={'width': 1000, 'height': 760})).new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        c0 = await pg.evaluate("""() => { S.boat.type = 'hurtigsjark'; applyVessel(); S.equip.jukse = 6; S.equip.jukseLv = 3; S.cash = 100000; save();
          return {cash:S.cash, max:VESSELS.hurtigsjark.jukseMax, want:EQUIP.jukse.price * 3 + 6 * (EQUIP.jukseLv.tiers[1].kr + EQUIP.jukseLv.tiers[2].kr)}; }""")
        await pg.reload(); await pg.wait_for_function("typeof S !== 'undefined' && S && S.boat && S.equip", timeout=120000); await pg.wait_for_timeout(3000)
        r = await pg.evaluate("() => ({type:S.boat.type, jukse:S.equip.jukse, lv:S.equip.jukseLv || 1, cash:S.cash})")
        print(ok(c0['max'] == 3), 'den brukte hurtigsjarken har plass til tre juksamaskiner', c0['max'])
        print(ok(r['type'] == 'hurtigsjark' and r['jukse'] == 3 and r['lv'] == 1), 'lagringen med seks maskiner i trinn 3: tre om bord, trinnet tatt bort', r)
        print(ok(r['cash'] - c0['cash'] == c0['want']), 'trinnet og maskinene over er kjøpt tilbake til det de kostet', r['cash'] - c0['cash'], c0['want'])
        print(ok(not errs), 'ingen sidefeil', errs)
        await br.close()
asyncio.run(main())
