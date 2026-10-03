"""Sleep (core/15-energy.js, ui/05b-work.js; the user 03.10.2026: «Karakteren min har sovet kjempelenge», and the clock is one for
every player, so a sleep is not run faster): asleep at sea the clock runs as ever; «Våkn opp» shows after the first hour and wakes
you with the rest the sleep has given (a quarter of the way, a quarter of 60 %); coming back after five minutes or more away wakes
you the same way. With the bridge watch alarm (EQUIP.brovakt): dozing at sea it goes off after three minutes, a red flashing ACK
wakes you drowsy (10 %), you doze off again now and then until you have rested at the quay. Prints OK or FEIL."""
from _env import GAME, boot
import asyncio
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await (await b.new_context(viewport={'width': 1100, 'height': 760})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        await pg.wait_for_function("SIMREADY && S.boat.status === 'port'", timeout=60000)
        r0 = await pg.evaluate("simRate()")
        # at sea with a hand aboard, worn out: you fall asleep, the crew has the helm
        await pg.evaluate("""(() => { const b = S.boat; S.tut = 0; S.settings.autoOn = false; S.crew = [Object.assign(genCrew(), {bi:false, off:false, fatigue:10, morale:62, traits:[]})]; S.me = S.cur; b.status = 'idle'; b.port = null; S.energy = 0.001; step(); })()""")
        s = await pg.evaluate("({zz:asleep(), rate:simRate()})")
        await pg.wait_for_timeout(600)
        b0 = await pg.evaluate("document.getElementById('slSkip').disabled")
        check(s['zz'] and s['rate'] == r0 and b0, 'du sovner på sjøen, klokka går som før, og den første timen kan du ikke vekke deg', (s, r0, b0))
        # two hours on: «Våkn opp» wakes you with a quarter of 60 %
        await pg.evaluate("(() => { for (let i = 0; i < 120; i++) step(); })()"); await pg.wait_for_timeout(500)
        txt = await pg.evaluate("document.getElementById('slSkip').textContent")
        await pg.click('#slSkip'); await pg.wait_for_timeout(400)
        e = await pg.evaluate("({zz:asleep(), en:Math.round(S.energy)})")
        check(not e['zz'] and e['en'] == 15 and 'Våkn opp' in txt, '«Våkn opp» etter to timer: du våkner med 15 %', (txt, e))
        # asleep again; five minutes away (played as the time away) and back: awake
        await pg.evaluate("(() => { S.energy = 0.001; step(); for (let i = 0; i < 300; i++) step(); catchUp(5 * 60000); })()"); await pg.wait_for_timeout(700)
        e2 = await pg.evaluate("({zz:asleep(), en:Math.round(S.energy)})")
        check(not e2['zz'] and 30 <= e2['en'] <= 50, 'kommer du tilbake etter å ha vært borte, våkner du med energien fra søvnen', e2)
        # the bridge watch alarm
        await pg.evaluate("(() => { S.equip.brovakt = true; S.energy = 0.001; step(); })()"); await pg.wait_for_timeout(500)
        a0 = await pg.evaluate("({zz:asleep(), at:S.sleep && S.sleep.alarmAt - S.t, head:document.getElementById('slHead').textContent, ack:!document.getElementById('slAck').hidden})")
        await pg.evaluate("(() => { for (let i = 0; i < 3; i++) step(); })()"); await pg.wait_for_timeout(500)
        a1 = await pg.evaluate("({ring:alarmOn(), head:document.getElementById('slHead').textContent, ack:!document.getElementById('slAck').hidden && document.getElementById('slAck').textContent})")
        check(a0['zz'] and a0['at'] == 3 and not a0['ack'] and a1['ring'] and a1['ack'] == 'ACK', 'med brovaktsalarm: du døser av, og etter tre minutter går alarmen med en ACK-knapp', (a0, a1))
        await pg.click('#slAck'); await pg.wait_for_timeout(400)
        a2 = await pg.evaluate("({zz:asleep(), en:Math.round(S.energy), drowsy:!!S.drowsy})")
        check(not a2['zz'] and a2['en'] == 10 and a2['drowsy'], 'ACK vekker deg, trøtt og døsig (10 %)', a2)
        a3 = await pg.evaluate("(() => { let n = 0; while (!asleep() && n < 600){ step(); n++; } return {zz:asleep(), n, alarm:S.sleep && S.sleep.alarmAt - S.sleep.t0}; })()")
        check(a3['zz'] and a3['n'] < 300 and a3['alarm'] == 3, 'døsig døser du av igjen før lenge, og alarmen går igjen', a3)
        a4 = await pg.evaluate("(() => { for (let i = 0; i < 3; i++) step(); alarmAck(); const b = S.boat, q = portById('finnsnes'); b.status = 'port'; b.port = 'finnsnes'; b.pos = {x:q.p.x, y:q.p.y}; let n = 0; while (S.drowsy && n < 600){ step(); n++; } return {drowsy:!!S.drowsy, en:Math.round(S.energy), n}; })()")
        check(not a4['drowsy'] and a4['en'] >= 60, 'ved kai hviler du deg ut, og da er du ikke døsig lenger', a4)
        has = await pg.evaluate("(() => { PHONE.open('utstyr'); return [...document.querySelectorAll('.ph-card h4')].some(h => /Brovaktsalarm/.test(h.textContent)); })()")
        check(has, 'brovaktsalarmen kan kjøpes i utstyrsappen', has)
        print('errors:', errs[:5])
        await b.close()


asyncio.run(main())
