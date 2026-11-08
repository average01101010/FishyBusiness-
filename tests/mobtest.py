"""Man overboard (Ø11.6, KYST_MOB_AT=lat,lon for another place on the coast (the whole coast in KYST_DIST), KYST_MOB_SHOTS=0 without pictures; core/14b-sikkerhet.js and ui/10s-mob.js; docs/systemer/sjofart-og-lover.md kap. 6), in the game as it runs,
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
Ø11.7 (08.11.2026; docs/systemer/sjofart-og-lover.md kap. 7):
5. The emergency stop (SK4, V9 B): a string of line set and hauled with the hauler, the dice forced for the stop: a hand caught at the
   hauler, the other stops it, a near miss in the log, the hauler stands two minutes and the haul goes on to the end.
6. The Sikkerhet card in the Redning app (SK6): the near misses with the day, the place, the lesson and its source, the trips without harm.
7. Distress near by (L8, sjøloven § 135): in the rough sea a boat near by calls MAYDAY in the game's own minute (the dice for the call
   forced): the orange panel with the distance and the rescue, the chart's mark; «Svar: vi kommer», the person from the other boat in the
   water as in 2 (Autonav: MOB, the ladder), the end with the thanks, the badge «Hjelp i havsnød» and the story in Kystposten.
8. A PAN-PAN answered: the tow in the Oppdrag app with Autonav's way to her, and in the harbour the salvage and the honour; a call left
   be is taken by another without anything following; and with the game not open no call comes at all.
Screenshots in 1280x800 and 800x1280 of the alarm, of the mark in the chart plotter and of the pick-up (tests/out/mob_*.png).
Prints OK or FEIL per check."""
from _env import GAME, boot
import asyncio, json, os
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False)) if extra != '' else ''))


# a July day off Senja's outer coast in a fresh gale from the west; the sjark lies jigging in open water with two hands at the rail
SETUP = """async (A) => { PHONE.show(false); if (typeof DOCK !== 'undefined') DOCK.close(); S.jobs = []; S.cash = 1e6; S.plan = null; S.mob = null; S.mobs = []; S.mobOff = [];
  S.t = Math.round((Date.UTC(2027, 6, 14, 10, 0) - EPOCH) / 6e4); acc = 0; WX_FORCE = {w:15, d:260};
  const b = S.boat; b.type = 'sjark'; applyVessel(); b.dmg = null; b.damage = 0; b.tow = null; b.anch = null; b.hove = null; b.gop = null; S.boatName = 'Havbris'; S.home = 'finnsnes';
  let sea = null; for (let k = 0; k < 60 && !sea; k++){ const a = k / 60 * 2 * Math.PI, q = P(A[0] + Math.cos(a) * 0.05, A[1] + Math.sin(a) * 0.12); await mapNeed(q, MAPD.simR);
    if (!isLand(q) && depthF(q) > 40 && !inHarbour(q)){ let ok = true; for (let j = 0; j < 8 && ok; j++){ const r = {x:q.x + Math.sin(j / 8 * 2 * Math.PI) * 0.6, y:q.y - Math.cos(j / 8 * 2 * Math.PI) * 0.6}; if (isLand(r) || depthF(r) < 15 || groundCheck(q, r)) ok = false; } if (ok) sea = q; } }
  if (!sea) return {err:'fant ikke åpent hav'};
  b.port = null; b.pos = {x:sea.x, y:sea.y}; b.heading = 0; b.v = 0; b.status = 'fishing'; b.fishUntil = S.t + 600; b.dyn = null; DYN.line = null; S.settings.manual = false; if (typeof helmOff === 'function') helmOff();
  const c1 = genCrew(), c2 = genCrew(); c1.name = 'Stian Nilsen'; c1.sex = 'm'; c2.name = 'Kari Berg'; c2.sex = 'f'; for (const c of [c1, c2]){ c.fatigue = 10; c.morale = 70; c.off = false; c.bi = false; }
  S.crew = [c1, c2]; S.me = S.cur;
  window.__mobRnd0 = window.__mobRnd0 || mobRnd; mobRnd = k => (k === 'ev' || k === 'fall' || k === 'who') ? 0 : window.__mobRnd0(k);
  window.__sea = sea;
  return {sea, sst:+seaTemp(S.t / 60, sea).toFixed(1), W:windAt(S.t / 60, sea), hs:+hsAt(sea, S.t / 60).toFixed(2), r:BOAT.risk, t0:S.t, r0:(S.radio || []).length, live:mobLive()}; }"""
READ = """(L0) => { const M = S.mob, b = S.boat, p = M ? mobAt(liveFrac()) : null, lp = livePose().p, ui = document.getElementById('mobUI');
  return {mob:M && {name:M.name, st:M.st, lim:M.lim, able:M.able, mark:!!M.mark, buoy:M.buoy && {by:M.buoy.by, held:M.buoy.held}, resc:M.resc && {k:M.resc.k, n:M.resc.n, min:M.resc.min}, lift:M.lift && M.lift.how, side:M.side, tIn:+(S.t + liveFrac() - M.t0).toFixed(1)},
    d:p ? Math.round(kmTrue(lp, p) * 1000) : null, v:+(b.v || 0).toFixed(1), st:b.status, plan:!!S.plan, pmob:!!(S.plan && S.plan.mob), pn:S.plan ? S.plan.wps.length : 0, seen:M ? mobSeen(lp) : null,
    ui:ui && !ui.hidden ? ui.innerText.replace(/\\s+/g, ' ').trim() : '', btn:[...document.querySelectorAll('#mobUI [data-mb]')].map(x => x.dataset.mb + (x.disabled ? '-' : '+')),
    log:S.log.filter(l => l.t >= L0.t0).map(l => l.no).slice(-14), vhf:(S.radio || []).slice(L0.r0).map(x => x.from + ': ' + x.no), deck:workAssign().map(q => q.c ? q.c.name : 'me'),
    crew:S.crew.map(c => ({n:c.name, off:!!c.off, until:c.offUntil ? Math.round((c.offUntil - S.t) / 1440 * 10) / 10 : null, fat:Math.round(c.fatigue)})), ach:achC('mob'), mobs:(S.mobs || []).map(r => [r.k, r.out || null, r.how || null, r.days == null ? null : r.days])}; }"""


async def shot(pg, name):
    if os.environ.get('KYST_MOB_SHOTS') == '0': return
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
        AT = [float(v) for v in os.environ.get('KYST_MOB_AT', '69.33,17.05').split(',')]   # (the stikkprøve: KYST_MOB_AT=lat,lon with the whole coast in KYST_DIST)
        L0 = await pg.evaluate(SETUP, AT)
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
        check(r['d'] is not None and r['d'] <= 35 and r['v'] <= 2 and ('ladder+' in r['btn'] or 'sling+' in r['btn']), '2d. inntil og stille: leideren akter (eller stroppen) er klar (avstanden lest litt etter panelet, som krever 30 m)', [r['d'], r['v'], r['btn']])
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
        # ---- 5. the emergency stop on the hauler (SK4): a string of line set and hauled, the dice forced for the stop ----
        r5 = await pg.evaluate("""() => { const b = S.boat; S.mob = null; S.mobs = []; S.sets = []; S.hold = []; S.t += 24 * 60; acc = 0; S.plan = null;
          for (const c of S.crew){ c.off = false; delete c.offUntil; c.fatigue = 10; delete c.mobOff; } S.equip.linehaler = true;
          S.pgear = newPGear(); S.pgear.kits.n = 4; S.pgear.lines.hyse = {n:2, baited:2}; b.pos = {x:window.__sea.x, y:window.__sea.y}; b.status = 'idle'; b.v = 0; b.rig = 'line'; WX_FORCE = {w:6, d:260};
          const was = MOBF.live; MOBF.live = false; const why = startSet('line', {lk:'hyse', n:2}, 0); let k = 0; while (b.gop && k++ < 400) step();
          for (let i = 0; i < 6 * 60; i++) step(); b.status = 'idle'; const s0 = S.sets.find(x => x.kind === 'line'); if (!s0) { MOBF.live = was; return {err:'ingen line i sjøen', why:why || null, log:S.log.slice(-4).map(l => l.no)}; }
          b.pos = {x:s0.a.x, y:s0.a.y}; const n0 = S.log.length; startHaul(s0.id);
          mobRnd = q => (q === 'stop' || q === 'stopw') ? 0 : window.__mobRnd0(q); let st = null, hauling = [];
          for (let i = 0; i < 300 && b.gop; i++){ step(); if (!st && S.mobs.some(r => r.k === 'stop')) st = {t:S.t, done:b.gop ? b.gop.done : null, prog:b.gop ? +b.gop.prog.toFixed(3) : null}; if (st && S.t - st.t <= 3) hauling.push(b.gop ? +(b.gop.done + b.gop.prog).toFixed(3) : 'ferdig'); }
          mobRnd = window.__mobRnd0; MOBF.live = was;
          return {near:S.log.slice(n0).map(l => l.no).filter(t => /nødstopp/.test(t)), mobs:S.mobs.map(r => [r.k, r.name, r.by || null, r.gear || null]), st, hauling, done:!b.gop, end:S.log.slice(n0).map(l => l.no).filter(t => /Trakk|trukket|Halte|om bord/.test(t)).slice(-2), off:S.crew.map(c => !!c.off)}; }""")
        print('5:', json.dumps(r5, ensure_ascii=False))
        check(not r5.get('err') and len(r5['near']) == 1 and r5['near'][0].startswith('Nestenulykke: ') and 'slo av haleren med nødstoppen. Ingen ble skadet.' in r5['near'][0], '5a. under draget: en hang seg fast ved haleren, den andre stoppet den med nødstoppen, nestenulykke i dagboka', r5.get('near'))
        check(r5.get('mobs') and r5['mobs'][-1][0] == 'stop' and r5['mobs'][-1][3] == 'line' and not any(r5.get('off', [])), '5b. ført for Sikkerhet-kortet; ingen skadet eller sykmeldt', r5.get('mobs'))
        hv = r5.get('hauling') or []
        check(len(hv) >= 3 and hv[0] == hv[1] and r5.get('done'), '5c. haleren står litt, og draget går så til endes', [hv, r5.get('done')])
        # ---- 6. the Sikkerhet card in the Redning app ----
        await pg.evaluate("() => { const b = S.boat; S.nearMiss = [{t:S.t - 200, x:b.pos.x, y:b.pos.y, vid:S.cur, name:'Nordkyn', m:34, sit:'15', give:'a'}]; log('Grunt vann forut. Autonav stopper og finner en vei rundt.', 'Shallow water ahead. Autonav stops and finds a way round.', 'nav'); log('Tok inn sjø over ripa. Mistet 12 kg fisk.', 'Shipped water over the gunwale. Lost 12 kg of fish.'); S.t++; mobScan(); achAdd('safe', 3); }")
        r6 = await pg.evaluate("""() => { PHONE.open('redning'); const c = document.getElementById('safetyCard'); if (c) c.scrollIntoView({block:'start'});
          return c ? {txt:c.innerText.replace(/\\s+/g, ' ').trim(), rows:[...c.querySelectorAll('li')].map(li => li.dataset.k)} : null; }""")
        print('6:', json.dumps(r6, ensure_ascii=False)[:900])
        check(bool(r6) and 'Sikkerhet' in r6['txt'] and '3 turer uten skade' in r6['txt'], '6a. kortet «Sikkerhet» i Redning-appen med turene uten skade', (r6 or {}).get('txt', '')[:120])
        check(bool(r6) and set(['stop', 'pass', 'ground', 'sea']) <= set(r6['rows']), '6b. nødstoppen, passeringen, grunt vann og sjø over ripa i lista', (r6 or {}).get('rows'))
        check(bool(r6) and 'Sjøveisreglene regel 16' in r6['txt'] and 'God praksis' in r6['txt'] and 'regel 6 a vi' in r6['txt'], '6c. hver med hva den lærer og kilden', (r6 or {}).get('txt', '')[-300:])
        if os.environ.get('KYST_MOB_SHOTS') != '0':
            for w, h in ((1280, 800), (800, 1280)):
                await pg.set_viewport_size({'width': w, 'height': h}); await pg.wait_for_timeout(500)
                await pg.evaluate("""() => { MOBUI._U.done = null; MOBUI.draw(true); PHONE.open('redning'); const c = document.getElementById('safetyCard'); if (!c) return;
                  let sc = c.parentElement; while (sc && !(sc.scrollHeight > sc.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(sc).overflowY))) sc = sc.parentElement;
                  if (sc) sc.scrollTop += c.getBoundingClientRect().top - sc.getBoundingClientRect().top - 72; }"""); await pg.wait_for_timeout(400)
                await pg.screenshot(path='mob_sikkerhet_%s.png' % ('land' if w > h else 'port'))
            await pg.set_viewport_size({'width': 1280, 'height': 800}); await pg.wait_for_timeout(300)
        await pg.evaluate("PHONE.show(false)")
        # ---- 7. a MAYDAY from a boat near by in the game's own minute (the dice for the call forced) ----
        L7 = await pg.evaluate("""() => { const b = S.boat; S.mob = null; S.sos = null; S.sosT = null; S.t += 4 * 24 * 60; acc = 0; WX_FORCE = {w:15, d:260}; S.equip.vhf = true; S.plan = null; b.gop = null;
          b.pos = {x:window.__sea.x, y:window.__sea.y}; b.status = 'fishing'; b.fishUntil = S.t + 600; b.v = 0; for (const c of S.crew){ c.off = false; delete c.offUntil; c.fatigue = 10; delete c.mobOff; }
          mobRnd = k => k === 'sos' ? 0 : k === 'sosk' ? 0.1 : (k === 'ev' ? 0.999 : window.__mobRnd0(k)); return {t0:S.t, r0:(S.radio || []).length, ach:achC('sos')}; }""")
        try: await pg.wait_for_function('!!S.sos', timeout=30000)
        except Exception: pass
        await pg.evaluate("mobRnd = k => k === 'ev' ? 0.999 : window.__mobRnd0(k)")
        await pg.wait_for_timeout(500)
        r7 = await pg.evaluate("""(L) => { const Q = S.sos, ui = document.getElementById('mobUI'), lp = livePose().p;
          return {sos:Q && {k:Q.k, boat:Q.boat, who:Q.who, nm:+(kmTrue(lp, Q) / NM).toFixed(2), resc:Q.resc.min, ans:Q.ans}, ui:ui && !ui.hidden ? ui.innerText.replace(/\\s+/g, ' ').trim() : '', cls:ui ? ui.className : '',
            btn:[...document.querySelectorAll('#mobUI [data-mb]')].map(x => x.dataset.mb), vhf:(S.radio || []).slice(L.r0).map(x => x.no), npc:npcStates(S.t / 60).filter(n => Q && n.name === Q.boat).map(n => [n.id, n.v]), live:mobLive()}; }""", L7)
        print('7 call:', json.dumps(r7, ensure_ascii=False))
        Q = r7['sos'] or {}
        check(Q.get('k') == 'mob' and 1.1 <= Q.get('nm', 0) <= 4.3, '7a. MAYDAY fra en båt 1,2–4 nm unna, i spillets eget minutt i grov sjø', Q)
        check(any(v.startswith('MAYDAY, MAYDAY, MAYDAY. Dette er «' + Q.get('boat', '#') + '». Mann over bord i posisjon') for v in r7['vhf']) and any(v.startswith('Kystradioen: Alle stasjoner') and 'bes melde seg på kanal 16' in v for v in r7['vhf']), '7b. VHF 16: MAYDAY og kystradioen som ber fartøy i nærheten melde seg', r7['vhf'][:2])
        check(r7['cls'] == 'sos' and 'MAYDAY · VHF 16' in r7['ui'] and r7['btn'] == ['sosyes', 'sosno'], '7c. det oransje panelet med avstanden, redningen, «Svar: vi kommer» og «La være»', r7['ui'][:200])
        check(bool(r7['npc']) and r7['npc'][0][1] == 0, '7d. båten i nød ligger der hun ringte (npcStates)', r7['npc'])
        v3 = await pg.evaluate("document.body.classList.contains('v3d')")
        await shot(pg, 'anrop')
        if v3: await pg.evaluate("G3.toggle()")
        await pg.wait_for_timeout(1000); await pg.evaluate("renderDyn()"); await shot(pg, 'anrop_kart')
        mk = await pg.evaluate("(() => { const g = document.getElementById('gDyn'); return g ? g.innerHTML.includes('MAYDAY ' + S.sos.boat) : null; })()")
        check(mk is True, '7e. kartplotteren merker der hun ringte', mk)
        if v3: await pg.evaluate("G3.toggle()"); await pg.wait_for_timeout(500)
        await pg.click('#mobUI [data-mb="sosyes"]'); await pg.wait_for_timeout(500)
        r = await pg.evaluate(READ, L7); print('7 answered:', json.dumps(r['mob'], ensure_ascii=False), r['ui'][:160])
        check(bool(r['mob']) and r['mob']['name'] == Q.get('who') and r['mob']['mark'] and r['mob']['buoy'] and r['mob']['buoy']['by'] == Q.get('boat') and ('fra «' + Q.get('boat', '#') + '»') in r['ui'], '7f. svaret: personen fra «' + Q.get('boat', '') + '» i sjøen, merket satt, livbøya hennes, panelet for mann over bord', r['ui'][:160])
        check(any('Vi har dere' in v and 'og kommer' in v for v in r['vhf']), '7g. VHF 16: «vi kommer»', [v for v in r['vhf'] if 'kommer' in v][-1:])
        # (to save the real minutes the sail takes: the boat put 250 m off her, then Autonav: MOB and the ladder as in 2)
        await pg.evaluate("""() => { const M = S.mob, b = S.boat, p = mobAt(0); b.pos = {x:p.x - 0.25 * gridScale(p), y:p.y}; b.heading = Math.PI / 2; b.status = 'idle'; b.v = 0; S.plan = null; }""")
        for k in range(5):
            try: await pg.wait_for_selector(ready, timeout=6000); break
            except Exception: pass
            r = await pg.evaluate(READ, L7)
            if not r['mob']: break
            if not r['plan'] and 'auto+' in r['btn']: await pg.click('#mobUI [data-mb="auto"]')
            for i in range(80):
                await pg.wait_for_timeout(400)
                if await pg.evaluate("!S.plan || !!document.querySelector('" + ready.replace("'", "\\'") + "')"): break
        r = await pg.evaluate(READ, L7); print('7 by her:', r['d'], r['v'], r['btn'])
        how = 'ladder' if 'ladder+' in r['btn'] else 'sling'
        if how + '+' in r['btn']: await pg.click('#mobUI [data-mb="%s"]' % how)
        try: await pg.wait_for_function('!S.mob', timeout=60000)
        except Exception: pass
        await pg.wait_for_timeout(400)
        r7e = await pg.evaluate("""(L) => { const ui = document.getElementById('mobUI'), it = ((S.press || {}).own || []).filter(x => x.kind === 'sos').pop(), st = it ? pressStory(it) : null;
          return {mob:!!S.mob, sos:!!S.sos, log:S.log.filter(l => l.t >= L.t0).map(l => l.no).slice(-10), ach:achC('sos'), ui:ui && !ui.hidden ? ui.innerText.replace(/\\s+/g, ' ').trim() : '', press:st && st.h[0], body:st && st.body.map(x => x[0]),
            rec:(S.mobs || []).filter(r => r.k === 'sos').map(r => [r.out, r.boat]), own:S.crew.map(c => !!c.off)}; }""", L7)
        print('7 end:', json.dumps(r7e, ensure_ascii=False))
        up = [l for l in r7e['log'] if 'er oppe etter' in l]
        check(not r7e['mob'] and not r7e['sos'] and bool(up) and ('«' + Q.get('boat', '#') + '» kommer inntil') in up[-1], '7h. oppe i tide, og båten hennes tar personen om bord igjen', up[-1:])
        check(any('Tusen takk' in l for l in r7e['log']) and any('ingen bergelønn' in l for l in r7e['log']) and not any('Melding sendt til Sjøfartsdirektoratet' in l for l in r7e['log']), '7i. takken på VHF, ingen bergelønn for å redde folk, ingen melding fra deg', [l for l in r7e['log'] if 'takk' in l.lower() or 'bergelønn' in l][-2:])
        check(r7e['ach'] == L7['ach'] + 1 and r7e['press'] and 'reddet en fisker fra «' + Q.get('boat', '#') + '»' in r7e['press'] and any('§' not in b and 'ingen bergelønn' in b for b in r7e['body'] or []), '7j. heder: merket «Hjelp i havsnød» og saken i Kystposten', [r7e['ach'], r7e['press']])
        check(not any(r7e['own']) and r7e['rec'][-1:] == [['own', Q.get('boat')]], '7k. ingen av ditt eget mannskap rørt; ført for Sikkerhet-kortet', [r7e['own'], r7e['rec']])
        check('Tatt opp i tide' in r7e['ui'], '7l. panelet viser utfallet', r7e['ui'][:100])
        await shot(pg, 'anrop_oppe')
        # ---- 8. the PAN-PAN answered as a tow, a call left be, and no call with the game not open ----
        r8 = await pg.evaluate("""async () => { const b = S.boat, R = {}; S.sos = null; S.t += 60; S.mob = null; b.status = 'idle'; b.v = 0; S.turer = S.turer || turState();
          const Q = sosCall('eng'); R.call = Q && {boat:Q.boat, k:Q.k}; if (!Q) return R;
          R.ui = (document.getElementById('mobUI') || {}).innerText; MOBUI.draw(true); R.ui = document.getElementById('mobUI').innerText.replace(/\\s+/g, ' ').trim();
          document.querySelector('#mobUI [data-mb="sosyes"]').click(); await new Promise(r => setTimeout(r, 1500));
          const m = turState().act.find(x => x.sos === Q.id); R.m = m && {k:m.k, stage:m.stage, to:m.to, pay:m.pay, value:m.value, cls:m.cls}; R.plan = !!S.plan; R.sos = !!S.sos;
          if (!m) return R;
          m.stage = 'tow'; S.plan = null; b.status = 'port'; b.port = m.to; b.pos = {x:portById(m.to).p.x, y:portById(m.to).p.y}; const a0 = achC('sos'); turDock(m.to);
          R.paid = !turState().act.includes(m); R.ach = achC('sos') - a0; const it = (S.press.own || []).filter(x => x.kind === 'salv').pop(); R.press = it && it.d.sos === 1 ? pressStory(it).body.map(x => x[0]).filter(t => /PAN-PAN/.test(t)) : null;
          // a call left be: another takes it, and nothing follows
          b.status = 'sailing'; b.port = null; b.pos = {x:window.__sea.x, y:window.__sea.y}; b.v = 6; S.t += 10; const a1 = achC('sos'), n1 = turState().act.length; sosCall('mob');
          R.leftCall = !!S.sos; for (let i = 0; i <= SOSK.wait + 1; i++) step(); R.left = {sos:!!S.sos, mob:!!S.mob, ach:achC('sos') - a1, act:turState().act.length - n1, vhf:(S.radio || []).slice(-1).map(x => x.no)};
          // the game not open: never a call, the dice forced and the sea rough
          const was = MOBF.live; MOBF.live = false; S.sosT = null; mobRnd = k => k === 'sos' ? 0 : k === 'ev' ? 0.999 : window.__mobRnd0(k); for (let i = 0; i < 5; i++) step(); R.closed = !!S.sos; mobRnd = window.__mobRnd0; MOBF.live = was;
          return R; }""")
        print('8:', json.dumps(r8, ensure_ascii=False))
        check(r8.get('call') and r8['call']['k'] == 'eng' and 'PAN-PAN · VHF 16' in (r8.get('ui') or ''), '8a. PAN-PAN: motorstopp mot land, panelet', r8.get('ui', '')[:120])
        check(bool(r8.get('m')) and r8['m']['k'] == 'slep' and r8['m']['stage'] == 'reach' and 0 < r8['m']['pay'] <= r8['m']['value'] and not r8.get('sos'), '8b. svaret: slepet i Oppdrag-appen, bergelønn for skip og last etter verdien', r8.get('m'))
        check(r8.get('plan'), '8c. Autonav går til henne (turGo)', r8.get('plan'))
        check(r8.get('paid') and r8.get('ach') == 1 and r8.get('press'), '8d. i havn: bergelønnen, heder og Kystposten (etter PAN-PAN på kanal 16)', [r8.get('paid'), r8.get('ach'), r8.get('press')])
        L8 = r8.get('left') or {}
        check(r8.get('leftCall') and not L8.get('sos') and not L8.get('mob') and L8.get('ach') == 0 and L8.get('act') == 0, '8e. ingen svarte: en annen båt eller redningen tok det, uten følger', L8)
        check(r8.get('closed') is False, '8f. spillet ikke åpent: aldri noe anrop', r8.get('closed'))
        await pg.evaluate('WX_FORCE = null')
        print('errors:', errs)
        await br.close()

asyncio.run(main())
