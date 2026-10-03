"""Manual steering (core/16-helm.js, ui/10d-helm.js; the user's wish 03.10.2026): with «Manuell styring» on, «Kast loss» in port lets
go with the hand on the helm, the throttle on the screen drives her ahead (and on the game's one clock), the joystick
turns her and springs back, neutral slows her, touching the controls takes over from a route, she runs aground on land as under a
route, and «Fortøy» moors her when she is slow by the quay. With the mouse as the finger (pointer events). Prints OK or FEIL."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


ST = "(() => { const b = S.boat, h = S.helm || {}; return {st:b.status, x:b.pos.x, y:b.pos.y, hd:b.heading, v:b.v, fuel:b.fuel, t:S.t, on:helmOn(), rate:simRate(), thr:h.thr, rud:h.rud, hv:h.v, plan:!!S.plan, btn:document.getElementById('helmAct').hidden ? null : document.getElementById('helmAct').textContent, shown:document.body.classList.contains('helm')}; })()"


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await (await b.new_context(viewport={'width': 1280, 'height': 800})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        await pg.wait_for_function("SIMREADY && S.boat.status === 'port'", timeout=60000)
        port0 = await pg.evaluate("S.boat.port")
        # 1. the setting, from the phone's settings
        await pg.evaluate("() => { S.settings.manual = false; }")
        has = await pg.evaluate("(() => { PHONE.open('innst'); return !!document.querySelector('[data-pa=manual]'); })()")
        await pg.evaluate("() => { S.settings.manual = true; PHONE.show(false); }")
        await pg.wait_for_timeout(600)
        s = await pg.evaluate(ST)
        check(s['btn'] == 'Kast loss' and not s['shown'], 'med «Manuell styring» på (fra Innstillinger) viser havna «Kast loss», og gass og ratt er ikke ute i havna', (has, s['btn'], s['shown']))
        # 2. cast off: the lines come in, then she lies at the berth with the hand on the helm, in real time
        await pg.click('#helmAct')
        await pg.wait_for_function("S.boat.status === 'sailing' && helmOn()", timeout=60000); await pg.wait_for_timeout(400)
        s = await pg.evaluate(ST); bp = await pg.evaluate(f"berthPose('{port0}', S.boat.type || 'skiff')")
        dbp = ((s['x'] - bp['x']) ** 2 + (s['y'] - bp['y']) ** 2) ** 0.5 * 1000 if bp else -1
        check(s['on'] and s['shown'] and dbp < 5, 'etter «Kast loss» ligger hun ved kaiplassen med hånda på roret, og gass og ratt vises', round(dbp, 1))
        # 3. full ahead with the throttle (the mouse at its top): she gathers way along her heading; the game minutes pass slowly
        # she lies with the quay to starboard: swing her bow out to port first (the quay and the land ahead stop her now)
        await pg.evaluate("(() => { S.boat.heading -= Math.PI / 2; })()")
        box = await pg.locator('#helmThr').bounding_box()
        await pg.mouse.move(box['x'] + box['width'] / 2, box['y'] + 22); await pg.mouse.down(); await pg.mouse.up()
        s0 = await pg.evaluate(ST); await pg.wait_for_timeout(8000); s1 = await pg.evaluate(ST)
        moved = ((s1['x'] - s0['x']) ** 2 + (s1['y'] - s0['y']) ** 2) ** 0.5 * 1000
        check(s0['thr'] > 0.9 and s1['hv'] > 2 and moved > 10 and s1['fuel'] < s0['fuel'], 'gassen helt fram gir fart og fremdrift, og drivstoff går', {'thr': s0['thr'], 'kn': round(s1['hv'], 1), 'm': round(moved), 'fuel': round(s0['fuel'] - s1['fuel'], 3)})
        check(s1['rate'] == s0['rate'] == 6, 'klokka er den felles: den går som ellers mens du styrer', (s0['rate'], s1['rate']))
        check(not s1['btn'] or 'Fortøy' not in s1['btn'], 'i fart er det ingen «Fortøy»-knapp', s1['btn'])
        # 4. the joystick held to starboard turns her to starboard; let go, it springs back
        jb = await pg.locator('#helmJoy').bounding_box()
        await pg.mouse.move(jb['x'] + jb['width'] * 0.92, jb['y'] + jb['height'] / 2); await pg.mouse.down()
        h0 = await pg.evaluate("S.boat.heading"); await pg.wait_for_timeout(3000); h1 = await pg.evaluate("S.boat.heading"); rud = await pg.evaluate("S.helm.rud")
        await pg.mouse.up(); await pg.wait_for_timeout(300); rud2 = await pg.evaluate("S.helm.rud")
        import math
        turn = math.degrees((h1 - h0 + math.pi) % (2 * math.pi) - math.pi)
        check(rud > 0.8 and turn > 5 and rud2 == 0, 'rattet til styrbord svinger henne til styrbord, og det går tilbake til midten når du slipper', {'rud': round(rud, 2), 'deg': round(turn, 1), 'after': rud2})
        # 5. neutral (the middle of the throttle): she loses way
        await pg.mouse.move(box['x'] + box['width'] / 2, box['y'] + box['height'] / 2); await pg.mouse.down(); await pg.mouse.up()
        v0 = await pg.evaluate("S.helm.v"); await pg.wait_for_timeout(5000); s = await pg.evaluate(ST)
        check(s['thr'] == 0 and s['hv'] < v0 - 1, 'nøytral (midt på gassen, den klikker inn) og hun mister farten', {'thr': s['thr'], 'kn': [round(v0, 1), round(s['hv'], 1)]})
        # 6. a route takes over the helm, and touching the throttle takes it back
        await pg.evaluate("(() => { const b = S.boat; S.plan = {wps:[{x:b.pos.x + 0.5, y:b.pos.y, port:null, fish:0}], idx:0, speed:6, returning:false}; })()")
        r = await pg.evaluate("[helmOn(), simRate()]")
        await pg.mouse.move(box['x'] + box['width'] / 2, box['y'] + box['height'] * 0.35); await pg.mouse.down(); await pg.mouse.up()
        s = await pg.evaluate(ST)
        check(r[0] is False and s['on'] and not s['plan'] and s['thr'] > 0, 'med en rute styrer ruta; rører du gassen, tar du roret og ruta stopper', (r, s['on'], s['plan'], s['thr']))
        # 7. aground: straight for the nearest land at speed, as under a route
        g = await pg.evaluate("""(() => { const b = S.boat; let best = null;
          for (let a = 0; a < 72; a++){ const hd = a * Math.PI / 36; for (let d = 0.02; d < 1.5; d += 0.02){ const q = {x:b.pos.x + Math.sin(hd) * d, y:b.pos.y - Math.cos(hd) * d}; if (isLand(q)){ if (!best || d < best.d) best = {d, hd}; break; } } }
          if (!best) return null; const p0 = {x:b.pos.x, y:b.pos.y}; b.heading = best.hd; S.helm.thr = 1; S.helm.rud = 0; S.helm.v = 8; let n = 0;
          while (S.boat.status === 'sailing' && n < 2000){ helmStep(0.5); n++; }
          return {st:S.boat.status, d:best.d, n}; })()""")
        check(g and g['st'] == 'aground', 'rett mot land i fart går hun på grunn (land stopper henne, ikke bare grunt vann)', g)
        # 8. moor: slow by the quay of a harbour, «Fortøy» moors her
        await pg.evaluate(f"""(() => {{ const b = S.boat; b.status = 'sailing'; b.damage = 0; const bp = berthPose('{port0}', b.type || 'skiff') || {{x:portById('{port0}').p.x, y:portById('{port0}').p.y, hd:0}};
          b.pos = {{x:bp.x + 0.03, y:bp.y}}; b.heading = bp.hd; S.helm = {{on:true, thr:0, rud:0, v:1, yaw:0}}; }})()""")
        await pg.wait_for_timeout(600); s = await pg.evaluate(ST)
        check(s['btn'] and s['btn'].startswith('Fortøy'), 'sakte ved kaia viser «Fortøy i …»', s['btn'])
        if s['btn']: await pg.click('#helmAct')
        await pg.wait_for_timeout(500); s = await pg.evaluate(ST)
        check(s['st'] == 'port' and not s['on'], '«Fortøy» fortøyer henne', (s['st'], s['on']))
        # 9. off in the settings: nothing shows, the port has no «Kast loss» of its own
        await pg.evaluate("() => { S.settings.manual = false; }"); await pg.wait_for_timeout(500); s = await pg.evaluate(ST)
        check(not s['btn'] and not s['shown'], 'med innstillingen av vises verken gass, ratt eller knappen', (s['btn'], s['shown']))
        await pg.screenshot(path='helm.png')
        print('errors:', errs[:5])
        await b.close()


asyncio.run(main())
