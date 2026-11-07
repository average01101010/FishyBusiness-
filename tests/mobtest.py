"""Man overboard (Ø11.6, core/14b-sikkerhet.js and ui/10s-mob.js; docs/systemer/sjofart-og-lover.md kap. 6), in the game as it runs,
without 3D (the 3D picture is mobshot.py, run alone):
1. In a heavy sea off Senja in July, the sjark jigging with two hands at the rail: with the dice forced, a hand goes over the side in the
   game's own minute (workAssign → mobDeck → risk → mobRisk): the alarm, the panel «MANN OVER BORD», the log, the MAYDAY on VHF 16 with
   the rescue on its way, the lifebuoy thrown by the other hand, the one in the water off the deck (workAssign).
2. She is under way away from him: «MOB» sets the mark where the boat is, «Autonav: MOB» runs the Williamson turn and up to him
   (once more when he is seen and not yet by her), the ladder aft when she lies by him, and the end: up in time, the report after
   sjøloven § 475 and skipssikkerhetsloven § 47, the badge, the panel's end.
3. Too late: the boat away from him and the clock run on (S.mult): past the limit he is badly chilled, the rescue takes him, and he is off
   sick and ashore (V8 A: nobody dies).
4. The game not open (the time away played): only a near miss in the log, never a fall.
Screenshots in 1280x800 and 800x1280 of the alarm, of the mark in the chart plotter and of the pick-up (tests/out/mob_*.png).
Prints OK or FEIL per check."""
from _env import GAME, boot
import asyncio, json, os
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False)) if extra != '' else ''))


# a July day off Senja's outer coast in a fresh gale from the west; the sjark lies jigging in open water with two hands at the rail
SETUP = """async () => { PHONE.show(false); if (typeof DOCK !== 'undefined') DOCK.close(); S.jobs = []; S.cash = 1e6; S.plan = null; S.mob = null; S.mobs = []; S.mobOff = [];
  S.t = Math.round((Date.UTC(2027, 6, 14, 10, 0) - EPOCH) / 6e4); acc = 0; WX_FORCE = {w:15, d:260};
  const b = S.boat; b.type = 'sjark'; applyVessel(); b.dmg = null; b.damage = 0; b.tow = null; b.anch = null; b.hove = null; b.gop = null; S.boatName = 'Havbris'; S.home = 'finnsnes';
  let sea = null; for (let k = 0; k < 60 && !sea; k++){ const a = k / 60 * 2 * Math.PI, q = P(69.33 + Math.cos(a) * 0.05, 17.05 + Math.sin(a) * 0.12); await mapNeed(q, MAPD.simR);
    if (!isLand(q) && depthF(q) > 40 && !inHarbour(q)){ let ok = true; for (let j = 0; j < 8 && ok; j++){ const r = {x:q.x + Math.sin(j / 8 * 2 * Math.PI) * 0.6, y:q.y - Math.cos(j / 8 * 2 * Math.PI) * 0.6}; if (isLand(r) || depthF(r) < 15 || groundCheck(q, r)) ok = false; } if (ok) sea = q; } }
  if (!sea) return {err:'fant ikke åpent hav'};
  b.port = null; b.pos = {x:sea.x, y:sea.y}; b.heading = 0; b.v = 0; b.status = 'fishing'; b.fishUntil = S.t + 600; b.dyn = null; DYN.line = null; S.settings.manual = false; if (typeof helmOff === 'function') helmOff();
  const c1 = genCrew(), c2 = genCrew(); c1.name = 'Stian Nilsen'; c1.sex = 'm'; c2.name = 'Kari Berg'; c2.sex = 'f'; for (const c of [c1, c2]){ c.fatigue = 10; c.morale = 70; c.off = false; c.bi = false; }
  S.crew = [c1, c2]; S.me = S.cur;
  window.__mobRnd0 = window.__mobRnd0 || mobRnd; mobRnd = k => (k === 'ev' || k === 'fall' || k === 'who') ? 0 : window.__mobRnd0(k);
  return {sea, sst:+seaTemp(S.t / 60, sea).toFixed(1), W:windAt(S.t / 60, sea), hs:+hsAt(sea, S.t / 60).toFixed(2), r:BOAT.risk, t0:S.t, r0:(S.radio || []).length, live:mobLive()}; }"""
READ = """(L0) => { const M = S.mob, b = S.boat, p = M ? mobAt(liveFrac()) : null, lp = livePose().p, ui = document.getElementById('mobUI');
  return {mob:M && {name:M.name, st:M.st, lim:M.lim, able:M.able, mark:!!M.mark, buoy:M.buoy && {by:M.buoy.by, held:M.buoy.held}, resc:M.resc && {k:M.resc.k, n:M.resc.n, min:M.resc.min}, lift:M.lift && M.lift.how, side:M.side, tIn:+(S.t + liveFrac() - M.t0).toFixed(1)},
    d:p ? Math.round(kmTrue(lp, p) * 1000) : null, v:+(b.v || 0).toFixed(1), st:b.status, plan:!!S.plan, pmob:!!(S.plan && S.plan.mob), pn:S.plan ? S.plan.wps.length : 0, seen:M ? mobSeen(lp) : null,
    ui:ui && !ui.hidden ? ui.innerText.replace(/\\s+/g, ' ').trim() : '', btn:[...document.querySelectorAll('#mobUI [data-mb]')].map(x => x.dataset.mb + (x.disabled ? '-' : '+')),
    log:S.log.filter(l => l.t >= L0.t0).map(l => l.no).slice(-14), vhf:(S.radio || []).slice(L0.r0).map(x => x.from + ': ' + x.no), deck:workAssign().map(q => q.c ? q.c.name : 'me'),
    crew:S.crew.map(c => ({n:c.name, off:!!c.off, until:c.offUntil ? Math.round((c.offUntil - S.t) / 1440 * 10) / 10 : null, fat:Math.round(c.fatigue)})), ach:achC('mob'), mobs:(S.mobs || []).map(r => [r.k, r.out || null, r.how || null, r.days == null ? null : r.days])}; }"""


async def shot(pg, name):
    for w, h in ((1280, 800), (800, 1280)):
        await pg.set_viewport_size({'width': w, 'height': h}); await pg.wait_for_timeout(600)
        await pg.screenshot(path='mob_%s_%s.png' % (name, 'land' if w > h else 'port'))
    await pg.set_viewport_size({'width': 1280, 'height': 800}); await pg.wait_for_timeout(300)


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await br.new_page(viewport={'width': 1280, 'height': 800}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + ('#no3d' if os.environ.get('KYST_LITE') else ''))
        L0 = await pg.evaluate(SETUP)
        print('setup:', json.dumps(L0, ensure_ascii=False))
        if not L0 or L0.get('err'):
            check(False, '0. åpent hav utenfor Senja', L0); print('errors:', errs); await br.close(); return
        check(L0['live'], '0. spillet er åpent og går (mobLive)', L0)
        # ---- 1. the fall, in the game's own minute ----
        try: await pg.wait_for_function('!!S.mob', timeout=30000)
        except Exception: pass
        await pg.evaluate("mobRnd = window.__mobRnd0")
        r = await pg.evaluate(READ, L0); print('1:', json.dumps(r, ensure_ascii=False))
        M = r['mob'] or {}
        check(bool(M) and M.get('st') == 'water', '1a. mann over bord i spillets eget minutt, med to på dekk i grov sjø', M)
        check('MANN OVER BORD' in r['ui'] and M.get('name', '#') in r['ui'], '1b. panelet: «MANN OVER BORD» med navnet', r['ui'][:160])
        check(any('Mann over bord! ' in l for l in r['log']), '1c. dagboka: «Mann over bord!»', [l for l in r['log'] if 'over bord' in l][:2])
        check(any(v.startswith('VHF 16: MAYDAY, MAYDAY, MAYDAY') for v in r['vhf']) and any('Kystradioen' in v and 'minutter' in v for v in r['vhf']), '1d. MAYDAY på VHF 16, og svaret med redningen', r['vhf'][:2])
        check(bool(M.get('buoy')) and M['buoy']['by'] not in (None, 'me'), '1e. den andre på dekk kastet livbøya', M.get('buoy'))
        check(M.get('name') not in r['deck'], '1f. den i sjøen er ikke på dekk (workAssign)', r['deck'])
        check(r['btn'][:2] == ['mark+', 'auto+'], '1g. knappene: MOB, Autonav: MOB', r['btn'])
        await shot(pg, 'alarm')
        # ---- 2. under way away from him: the mark, the Williamson turn, the ladder ----
        await pg.evaluate("""() => { const b = S.boat, hd = b.heading = Math.PI / 2 + 0.2, far = {x:b.pos.x + Math.sin(hd) * 3, y:b.pos.y - Math.cos(hd) * 3};
          b.status = 'sailing'; b.fishUntil = null; b.v = 7; S.plan = {wps:[{x:far.x, y:far.y, port:null, fish:0}], idx:0, speed:7, full:false, returning:false, unsafe:[false]}; }""")
        await pg.wait_for_timeout(5000)
        r = await pg.evaluate(READ, L0); d0 = r['d']; print('2 away:', d0, r['v'], r['st'])
        await pg.click('#mobUI [data-mb="mark"]'); await pg.wait_for_timeout(300)
        r = await pg.evaluate(READ, L0)
        check(r['mob']['mark'] and any('MOB-merket satt i plotteren' in l for l in r['log']), '2a. «MOB»: merket i plotteren der båten er, med avstanden til ham', [l for l in r['log'] if 'MOB-merket' in l])
        v3 = await pg.evaluate("document.body.classList.contains('v3d')")
        if v3: await pg.evaluate("G3.toggle()")
        await pg.wait_for_timeout(1200); await pg.evaluate("renderDyn()"); await shot(pg, 'merket')
        if v3: await pg.evaluate("G3.toggle()"); await pg.wait_for_timeout(500)
        await pg.click('#mobUI [data-mb="auto"]'); await pg.wait_for_timeout(600)
        r = await pg.evaluate(READ, L0)
        check(r['pmob'] and r['pn'] == 5 and any('Williamson-svingen' in l for l in r['log']), '2b. «Autonav: MOB»: Williamson-svingen og inn til ham (fem punkter)', [r['pn'], [l for l in r['log'] if 'Autonav: MOB' in l]])
        track = []
        for i in range(160):
            await pg.wait_for_timeout(500); q = await pg.evaluate(READ, L0); track.append([q['d'], q['v'], q['st']])
            if not q['plan'] or not q['mob']: break
        print('  track:', track[::6], track[-3:])
        r = await pg.evaluate(READ, L0); dmin = min(t[0] for t in track if t[0] is not None)
        check(r['mob'] and dmin < 60, '2c. Autonav tok båten tilbake til ham', {'fra': d0, 'nærmest': dmin, 'nå': r['d'], 'fart': r['v']})
        # in to her: the ladder or the sling as soon as it can be had (within 30 m, under 2 knots); Autonav again while she is not by her
        ready = '#mobUI [data-mb="ladder"]:not([disabled]), #mobUI [data-mb="sling"]:not([disabled])'
        for k in range(5):
            try: await pg.wait_for_selector(ready, timeout=8000); break
            except Exception: pass
            r = await pg.evaluate(READ, L0)
            if not r['mob']: break
            if not r['plan'] and 'auto+' in r['btn']: await pg.click('#mobUI [data-mb="auto"]')
            for i in range(80):
                await pg.wait_for_timeout(400)
                if await pg.evaluate("!S.plan || !!document.querySelector('" + ready.replace("'", "\\'") + "')"): break
        r = await pg.evaluate(READ, L0); print('2 by him:', r['d'], r['v'], r['btn'], r['mob'] and r['mob']['tIn'])
        check(r['d'] is not None and r['d'] <= 30 and r['v'] <= 2 and ('ladder+' in r['btn'] or 'sling+' in r['btn']), '2d. inntil og stille: leideren akter (eller stroppen) er klar', [r['d'], r['v'], r['btn']])
        await shot(pg, 'opptak')
        how = 'ladder' if 'ladder+' in r['btn'] else 'sling'
        if how + '+' in r['btn']: await pg.click('#mobUI [data-mb="%s"]' % how)
        try: await pg.wait_for_function('!S.mob', timeout=60000)
        except Exception: pass
        r = await pg.evaluate(READ, L0); print('2 end:', json.dumps(r, ensure_ascii=False))
        up = [l for l in r['log'] if 'er oppe etter' in l]
        check(not r['mob'] and bool(up) and ('leideren akter' in up[-1] or 'løftestroppen' in up[-1]) and 'i orden' in up[-1], '2e. oppe i tide, kald og våt, men i orden', up[-1:])
        check(any('Melding sendt til Sjøfartsdirektoratet for deg (sjøloven § 475 og skipssikkerhetsloven § 47)' in l for l in r['log']), '2f. meldingen etter § 475 og § 47 i dagboka', [l for l in r['log'] if 'Melding sendt' in l][-1:])
        check(r['ach'] == 1 and r['mobs'][-1][:2] == ['mob', 'own'], '2g. merket «tatt opp i tide», og ført for Sikkerhet-kortet', [r['ach'], r['mobs']])
        check(('Tatt opp i tide' in r['ui']), '2h. panelet viser utfallet', r['ui'][:120])
        await shot(pg, 'oppe')
        # ---- 3. too late: the rescue takes her, off sick ----
        L3 = await pg.evaluate("""() => { S.mob = null; S.mobs = []; S.t += 2 * 24 * 60; acc = 0; const b = S.boat; b.status = 'fishing'; b.fishUntil = S.t + 600; S.plan = null; b.v = 0;
          for (const c of S.crew){ c.off = false; delete c.offUntil; c.fatigue = 10; }
          mobRnd = k => (k === 'ev' || k === 'fall') ? 0 : k === 'who' ? 0.99 : window.__mobRnd0(k); return {t0:S.t, r0:(S.radio || []).length}; }""")
        try: await pg.wait_for_function('L => !!S.mob && S.mob.t0 >= L.t0', arg=L3, timeout=30000)
        except Exception: pass
        check(await pg.evaluate('L => !!S.mob && S.mob.t0 >= L.t0', L3), '3. en ny mann over bord', '')
        await pg.evaluate("""() => { mobRnd = window.__mobRnd0; const b = S.boat, hd = 0; b.pos = {x:b.pos.x, y:b.pos.y - 1.5}; b.status = 'idle'; b.v = 0; S.mult = 10; }""")
        try: await pg.wait_for_function('!S.mob', timeout=120000)
        except Exception: pass
        await pg.evaluate('S.mult = 1')
        r = await pg.evaluate(READ, L3); print('3:', json.dumps(r, ensure_ascii=False))
        res = [l for l in r['log'] if ' opp etter ' in l]
        off = [c for c in r['crew'] if c['off']]
        check(not r['mob'] and bool(res) and ('Redningsskøyta' in res[-1] or 'Redningshelikopteret' in res[-1] or 'Kystvaktskipet' in res[-1]) and 'sykmeldt' in res[-1], '3a. for sent tilbake: redningen tar henne opp og bringer henne til sykehuset', res[-1:])
        check(len(off) == 1 and (off[0]['until'] or 0) >= 1, '3b. sykmeldt og i land (V8 A: ingen dør)', r['crew'])
        check(r['ach'] == 1, '3c. ikke noe nytt merke', r['ach'])
        # ---- 4. the game not open: only a near miss ----
        r4 = await pg.evaluate("""() => { const was = MOBF.live; MOBF.live = false; S.mobs = []; S.t += 60; const b = S.boat; b.status = 'fishing'; b.fishUntil = S.t + 600; b.pos = {x:b.pos.x, y:b.pos.y + 1.5};
          for (const c of S.crew){ c.off = false; delete c.offUntil; } mobRnd = k => 0; const n0 = S.log.length; for (let i = 0; i < 3; i++) step();
          mobRnd = window.__mobRnd0; MOBF.live = was; return {mob:!!S.mob, near:S.log.slice(n0).map(l => l.no).filter(t => /^Nestenulykke/.test(t)), mobs:S.mobs.map(r => r.k)}; }""")
        print('4:', json.dumps(r4, ensure_ascii=False))
        check(not r4['mob'] and len(r4['near']) == 1 and r4['mobs'] == ['near'], '4. spillet ikke åpent: bare en nestenulykke i dagboka', r4)
        await pg.evaluate('WX_FORCE = null')
        print('errors:', errs)
        await br.close()

asyncio.run(main())
