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
        # where you hear it from (the user's wish 03.10.2026): the ear is the camera; here set as the 3D view gives it (G3.ear, G3.sndSrc)
        await pg.evaluate("(() => { const b = S.boat; b.status = 'sailing'; b.port = null; b.v = BOAT.vmax * 0.9; S.plan = {wps:[{x:b.pos.x + 3, y:b.pos.y}], idx:0, speed:BOAT.vmax, returning:false}; SND.testSrc = {boat:[0, 1, 0]}; })()")
        near = await pg.evaluate("(() => { SND.testEar = {x:0, y:6, z:21, fx:0, fz:-1}; SND.tick(); return Object.assign({}, SND.LV); })()")
        far = await pg.evaluate("(() => { SND.testEar = {x:0, y:30, z:400, fx:0, fz:-1}; SND.tick(); return Object.assign({}, SND.LV); })()")
        check(near['eng'] > far['eng'] * 5 and far['eng'] > 0, 'motoren er tydelig svakere med kameraet 400 m unna enn 21 m', (round(near['eng'], 4), round(far['eng'], 4)))
        # high up in the air only the music is left: the sea round you, the wind and the rain die away with the camera's height (Jonas
        # 05.10.2026, a clip of steady low noise from far up)
        hi = await pg.evaluate("""(() => { WX_FORCE = {w:20, d:225}; const r = {}; for (const y of [3, 60, 400]){ SND.testEar = {x:0, y, z:21, fx:0, fz:-1}; SND.testSrc = {boat:[0, 1, 0]}; SND.tick(); r[y] = {sea:SND.LV.sea, wind:SND.LV.wind, rain:SND.LV.rain, mus:SND.LV.music, lap:SND.LV.lapP}; } WX_FORCE = null; return r; })()""")
        lo, top = hi['3'], hi['400']
        check(lo['wind'] > 0.05 and top['sea'] < lo['sea'] * 0.25 and top['wind'] < lo['wind'] * 0.1 and top['rain'] < lo['rain'] * 0.05 + 1e-9 and hi['60']['wind'] < lo['wind'], 'høyt oppe dør sjøen, vinden og regnet ut, bare musikken blir igjen', hi)
        check(lo['lap'] > 0.05 and top['lap'] == 0 and lo['sea'] < 0.12, 'nede ved sjøen skvulper små bølger, havet er et svakt sus og ikke en rumling, og høyt oppe er skvulpet borte', {k: hi[k]['lap'] for k in hi})
        right = await pg.evaluate("(() => { SND.testEar = {x:-20, y:2, z:0, fx:0, fz:-1}; SND.tick(); return SND.LV.engPan; })()")
        left = await pg.evaluate("(() => { SND.testEar = {x:20, y:2, z:0, fx:0, fz:-1}; SND.tick(); return SND.LV.engPan; })()")
        check(right > 0.5 and left < -0.5, 'båten øst for et kamera som ser nordover høres til høyre, vest for det til venstre', (round(right, 2), round(left, 2)))
        cr2 = await pg.evaluate("(() => { const e = d => ({x:d, y:2, z:0, fx:0, fz:-1}); return [SND.at([30, 9, 0], 18, e(0)).g, SND.at([30, 9, 0], 18, e(1500)).g]; })()")
        check(cr2[0] > 0.5 and cr2[1] < 0.03, 'kranen høres nær mottaket, men knapt halvannen kilometer unna', [round(x, 3) for x in cr2])
        al = await pg.evaluate("(() => { S.sleep = {t0:S.t - 5, until:S.t + 400, v:S.me, alarmAt:S.t - 1}; SND.testEar = {x:0, y:40, z:2000, fx:0, fz:-1}; SND.tick(); const r = {on:SND.LV.alarm, g:SND.LV.alarmG}; S.sleep = null; return r; })()")
        check(al['on'] == 1 and al['g'] >= 0.5, 'brovaktsalarmen høres med minst halv styrke også med kameraet 2 km unna', al)
        nb = await pg.evaluate("""(() => { const r = []; for (const d of [120, 3000]){ SND.testEar = {x:0, y:6, z:0, fx:0, fz:-1}; SND.testSrc = {boat:[0, 1, 0], npc:[{x:d, z:0, v:8, st:'out', big:false}]}; SND.tick(); r.push(SND.LV.npc0); } SND.testEar = null; SND.testSrc = null; return r; })()""")
        check(nb[0] > 0.01 and nb[1] == 0, 'en fiskebåt i fart 120 m unna høres, en 3 km unna ikke', nb)
        await pg.evaluate("(() => { S.settings.sound = false; })()"); off = await pg.evaluate(LV)
        check(off['master'] == 0, 'med lyden av i innstillingene er alt stille', off['master'])
        has = await pg.evaluate("(() => { PHONE.open('innst'); return document.querySelectorAll('[data-pa=snd]').length; })()")
        check(has == 5, 'Innstillinger har lydvalget (av og fire styrker)', has)
        # the music: on its own volume, playing with the sound effects off, a chord under way; off in the settings is silent
        mu = await pg.evaluate("""(() => { S.settings.sound = false; S.settings.music = 0.35; SND.tick(); const on = {lv:SND.LV.music, chord:!!SND.MUS.chord, out:!!SND.MUS.out};
          document.querySelector('[data-pa=mus][data-v="0"]').click(); SND.tick(); return {on, off:SND.LV.music, buttons:document.querySelectorAll('[data-pa=mus]').length}; })()""")
        check(mu['on']['lv'] > 0 and mu['on']['chord'] and mu['off'] == 0 and mu['buttons'] == 4, 'musikken spiller med egen styrke (også med lydeffektene av), og Av i Innstillinger gjør den stille', mu)
        print('errors:', errs[:5])
        await b.close()


asyncio.run(main())
