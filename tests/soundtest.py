"""The sound (ui/10e-sound.js; the user's wish 03.10.2026): it starts at the first touch, and its layers follow the boat: the engine off
in port and running under way (louder and higher at speed), the wash louder under way, the crane while the catch is landed, the pump
while she is fuelled, the hauler while gear is hauled; off in the settings, the master is silent. Ø11.2: the whistle's signals (the
rules of the road queue them, core/05e-sjovei.js SJV.sig): the note by the vessel's length (vedlegg III), how long a signal takes (short
1 s, long 4.5 s, two seconds between two long), a 10 m boat's whistle heard 400 m off but not 2 km off where the coastal ship's is, to
the right when she is east of a boat heading north, your own at full strength, and the dock's horn fan. Prints OK or FEIL."""
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
        # a slam (Fysikk 4 F2, 24-cinema.js): the bow comes down on the sea and the hull thuds, from the bow, louder the harder she hits
        sl = await pg.evaluate("""(() => { if (typeof SND.slam !== 'function') return null; const r = {}; SND.testSrc = {boat:[0, 1, 0]};
          for (const [k, z, s] of [['near', 8, 2], ['soft', 8, 1], ['far', 2000, 2]]){ SND.testEar = {x:0, y:6, z, fx:0, fz:-1}; const n0 = SND.LV.slam || 0; SND.slam(s, [0, 1, -5]); r[k] = {n:(SND.LV.slam || 0) - n0, g:SND.LV.slamG}; }
          return r; })()""")
        check(sl is not None and sl['near']['n'] == 1 and sl['near']['g'] > 0.3 and sl['soft']['g'] < sl['near']['g'] and sl['far']['g'] < 0.03, 'et slag høres som et dunk fra baugen, sterkere jo hardere hun slår, og knapt med kameraet 2 km unna', sl)
        nb = await pg.evaluate("""(() => { const r = []; for (const d of [120, 3000]){ SND.testEar = {x:0, y:6, z:0, fx:0, fz:-1}; SND.testSrc = {boat:[0, 1, 0], npc:[{x:d, z:0, v:8, st:'out', big:false}]}; SND.tick(); r.push(SND.LV.npc0); } SND.testEar = null; SND.testSrc = null; return r; })()""")
        check(nb[0] > 0.01 and nb[1] == 0, 'en fiskebåt i fart 120 m unna høres, en 3 km unna ikke', nb)
        # Ø11.2: the whistle and the bell (sjøveisreglene rules 32-35, vedlegg III)
        hz = await pg.evaluate("[10, 49.9, 121.8, 250].map(L => SND.hornHz(L))")
        check(hz == [420, 300, 190, 110], 'vedlegg III 1 b: tonen etter lengden (250-700 Hz under 75 m, 130-350 til 200 m, 70-200 over)', hz)
        du = await pg.evaluate("['S', 'SSSSS', 'L', 'LL', 'LSS', 'bell'].map(p => +SND.blasts(p, {k:0.01, L:10}).toFixed(2))")
        check(du == [1, 9, 4.5, 11, 8.5, 5], 'regel 32 og 35: kort støt 1 s, langt 4,5 s, 1 s mellom, 2 s mellom to lange, klokka 5 s', du)
        sg = await pg.evaluate("""(() => { SND.testEar = null; SND.testSrc = null; const b = S.boat; b.status = 'sailing'; b.port = null; b.heading = 0; const r = {};
          const one = (id, pat, dx, dy, L, own) => { SJV.sig.length = 0; const n0 = SND.LV.sigN || 0; sjvSig(id, pat, {x:b.pos.x + dx, y:b.pos.y + dy}, L, own); SND.tick(); return {n:(SND.LV.sigN || 0) - n0, g:+(SND.LV.sigG || 0).toFixed(3), pan:+(SND.LV.sigPan || 0).toFixed(2), pat:SND.LV.sig}; };
          r.own = one('_own', 'S', 0, 0, 10, true); r.near = one('x', 'L', 0.4, 0, 10, false); r.far = one('x', 'L', 2, 0, 10, false); r.ship = one('cs', 'L', -2, 0, 121.8, false);
          SJV.sig.push({pat:'L', x:b.pos.x, y:b.pos.y, L:10, own:false, id:'old', t:Date.now() - 9000}); const n0 = SND.LV.sigN; SND.tick(); r.old = SND.LV.sigN - n0; return r; })()""")
        check(sg['own']['n'] == 1 and sg['own']['g'] > 0.9 and sg['own']['pat'] == 'S', 'ditt eget horn høres for fullt', sg['own'])
        check(sg['near']['n'] == 1 and 0.04 < sg['near']['g'] < 0.3 and sg['near']['pan'] > 0.3, 'fløyta til en båt på 10 m 400 m øst høres svakt og til høyre når båten din går nordover', sg['near'])
        check(sg['far']['n'] == 0 and sg['ship']['n'] == 1 and sg['ship']['pan'] < -0.3, '2 km unna høres ikke en båt på 10 m (en halv mil), men kystruteskipet (halvannen mil), til venstre', [sg['far'], sg['ship']])
        check(sg['old'] == 0, 'et signal som er eldre enn åtte sekunder, spilles ikke', sg['old'])
        # the dock's horn: while the warning stands, «Horn» with the five signals of rule 34; a signal sounds out before the next
        hf = await pg.evaluate("""(() => { const I = (id, ic, no, en, o) => Object.assign({id, lbl:[no, en]}, o || {}); const w0 = sjvWarn, W = {id:'f', sit:'15', give:'a', cpa:80, tcpa:3, R:{}, sev:'r2'};
          sjvWarn = () => W; const it = HAIL.dockItem(I), fan = HAIL.menuItems(I); SJV.sig.length = 0; HAIL._H.hornUntil = 0; const a = HAIL.signal('SS'), b2 = HAIL.signal('S'), q = SJV.sig.map(x => [x.pat, x.own]); sjvWarn = w0;
          return {id:it && it.id, menu:it && it.menu, fan:fan.map(x => x.lbl[0]), a, b2, q, none:HAIL.dockItem(I) === null}; })()""")
        check(hf['id'] == 'tut' and hf['menu'] == 'horn' and len(hf['fan']) == 5 and hf['a'] and not hf['b2'] and hf['q'] == [['SS', True]] and hf['none'], 'Horn i knappelinja mens varselet står, med 1, 2, 3 og 5 korte og ett langt; ett signal om gangen; borte uten varsel', hf)
        await pg.evaluate("(() => { S.settings.sound = false; })()"); off = await pg.evaluate(LV)
        check(off['master'] == 0, 'med lyden av i innstillingene er alt stille', off['master'])
        has = await pg.evaluate("(() => { PHONE.open('innst'); return document.querySelectorAll('[data-pa=snd]').length; })()")
        check(has == 5, 'Innstillinger har lydvalget (av og fire styrker)', has)
        # the music: on its own volume, playing with the sound effects off, a chord under way; off in the settings is silent
        mu = await pg.evaluate("""(() => { S.settings.sound = false; S.settings.music = 0.35; SND.tick(); const on = {lv:SND.LV.music, chord:!!SND.MUS.chord, out:!!SND.MUS.out};
          document.querySelector('[data-pa=mus][data-v="0"]').click(); SND.tick(); return {on, off:SND.LV.music, buttons:document.querySelectorAll('[data-pa=mus]').length}; })()""")
        check(mu['on']['lv'] > 0 and mu['on']['chord'] and mu['off'] == 0 and mu['buttons'] == 4, 'musikken spiller med egen styrke (også med lydeffektene av), og Av i Innstillinger gjør den stille', mu)
        # Father's naust (09.10.2026): inside, the outdoors goes through a wall (the low-pass closes) and the stove and the roof have sounds of their own
        ro = await pg.evaluate("""(() => { S.settings.sound = true; S.settings.vol = 0.6; const r = {}; SND.testEar = null; SND.testSrc = null;
          SND.room(true, {ovn:true, tak:false}); SND.tick(); r.on = {room:SND.LV.room, fire:SND.LV.fire}; SND.room(true, {ovn:false, tak:true}); SND.tick(); r.cold = {fire:SND.LV.fire};
          SND.room(false); SND.tick(); r.off = SND.LV.room; return r; })()""")
        check(ro['on']['room'] == 1 and ro['on']['fire'] == 1 and ro['cold']['fire'] == 0 and ro['off'] == 0, 'i naustet har ovnen og taket egne lyder, og de er borte utenfor', ro)
        # an ear that is not a number (a 3D camera gone NaN, as gfxtest makes it): the layers must not get a value that is not finite.
        # Found by gfxtest as page errors from setTargetAtTime (04.11 and 05.11.2026); checked here on purpose, since gfxtest now puts
        # the camera back within a second and no longer shows it (Ø2 05.11.2026). Red until ui/10e-sound.js set/place skip such a value
        nn = await pg.evaluate("""(() => { S.settings.sound = true; S.settings.vol = 0.6; const out = [];
          SND.testEar = {x:NaN, y:6, z:NaN, fx:NaN, fz:-1}; SND.testSrc = {boat:[0, 1, 0], npc:[{x:120, z:0, v:8, st:'out', big:false}]};
          for (let i = 0; i < 3; i++){ try { SND.tick(); } catch (e){ out.push(String(e.message || e).slice(0, 120)); } }
          SND.testEar = null; SND.testSrc = null; return out; })()""")
        check(not nn, 'et øre som ikke er et tall (kameraet NaN) gir ingen feil i lyden (ui/10e-sound.js set og place)', nn[:2])
        print('errors:', errs[:5])
        await b.close()


asyncio.run(main())
