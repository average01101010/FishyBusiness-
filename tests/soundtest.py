"""The sound (ui/10e-sound.js; the user's wish 03.10.2026): it starts at the first touch, and its layers follow the boat: the engine off
in port and running under way (louder and higher at speed), the wash louder under way, the crane while the catch is landed, the pump
while she is fuelled, the hauler while gear is hauled; off in the settings, the master is silent. Prints OK or FEIL."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


LV = "(() => { SND.tick(); return Object.assign({state:SND.state}, SND.LV); })()"


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
        pg = await (await b.new_context(viewport={'width': 1100, 'height': 760})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        await pg.wait_for_function("SIMREADY && S.boat.status === 'port'", timeout=60000)
        await pg.mouse.click(600, 380); await pg.wait_for_timeout(500)
        st = await pg.evaluate("[SND.started, SND.state]")
        check(st[0] and st[1] == 'running', 'lyden starter ved første trykk', st)
        port = await pg.evaluate(LV)
        await pg.evaluate("(() => { const b = S.boat; b.status = 'sailing'; b.port = null; b.v = BOAT.vmax * 0.9; S.plan = {wps:[{x:b.pos.x + 3, y:b.pos.y}], idx:0, speed:BOAT.vmax, returning:false}; })()")
        sea = await pg.evaluate(LV)
        await pg.evaluate("(() => { S.boat.v = 3; })()"); slow = await pg.evaluate(LV)
        check(port['eng'] == 0 and sea['eng'] > slow['eng'] > 0, 'motoren er av i havn og går under seiling, sterkere i fart', (port['eng'], round(slow['eng'], 3), round(sea['eng'], 3)))
        check(sea['sea'] > slow['sea'] > port['sea'], 'skvulpet langs skroget øker med farten', (round(port['sea'], 3), round(slow['sea'], 3), round(sea['sea'], 3)))
        await pg.evaluate("(() => { const b = S.boat; b.gop = {op:'haul', kind:'garn'}; b.v = 2.5; })()"); h = await pg.evaluate(LV)
        check(h['haul'] > 0.05, 'haleren går når redskapet hales', h['haul'])
        await pg.evaluate("(() => { const b = S.boat; b.gop = null; b.status = 'port'; b.port = 'finnsnes'; S.plan = null; b.v = 0; b.land = {pid:'finnsnes', t0:S.t, until:S.t + 60}; b.fueling = {t0:S.t, pumpAt:S.t - 1, until:S.t + 30}; })()")
        cr = 0
        for i in range(30):
            l = await pg.evaluate(LV); cr = max(cr, l['crane']); await pg.wait_for_timeout(500)
            if cr > 0: break
        check(cr > 0 and l['pump'] > 0, 'i havna går kranen mens fangsten landes, og pumpa mens hun fylles', (cr, l['pump']))
        await pg.evaluate("(() => { const b = S.boat; b.land = null; b.fueling = null; })()")
        await pg.evaluate("(() => { S.settings.sound = false; })()"); off = await pg.evaluate(LV)
        check(off['master'] == 0, 'med lyden av i innstillingene er alt stille', off['master'])
        has = await pg.evaluate("(() => { PHONE.open('innst'); return document.querySelectorAll('[data-pa=snd]').length; })()")
        check(has == 5, 'Innstillinger har lydvalget (av og fire styrker)', has)
        print('errors:', errs[:5])
        await b.close()


asyncio.run(main())
