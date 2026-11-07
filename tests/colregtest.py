"""The rules of the road (Ø11.1, core/05e-sjovei.js; sjøveisreglene FOR-1975-12-01-5 rules 13-18): Senja's ferry and a boat of the
local fleet on crossing courses with the boat you follow, on Autonav, without 3D. With the other coming from her port side (rule 15:
the NPC gives way) the NPC turns to starboard within about a kilometre, never onto land, and comes back to the shared course after; she
holds course and Autonav does not turn. With the other from her starboard side (she gives way) the NPC holds course and speed, Autonav
turns to starboard, opens the CPA and comes back to the route; the warning stands in the strip's third line and in the chart plotter
(the ring, the vectors) while it applies. The NPCs with no manoeuvre on are where the clock says. Ø11.2: the same ferry in thick fog
(not in sight, rule 19): the warning comes earlier, both act (the ferry to starboard, Autonav by 19 d), the ferry's fog signal heard
forward of the beam takes Autonav down to the minimum steerage speed (19 e), and both sound their fog signals (rule 35). Prints OK or FEIL."""
from _env import GAME, boot
import asyncio, json, time
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


# the setting: a calm day in June (the ferry runs May to September, 07-21), the hour h:m
AT = "([h, m]) => { S.t = Math.round((Date.UTC(2027, 5, 15, h, m) - EPOCH) / 6e4); WX_FORCE = {w:4, d:200}; COASTM.k = ''; HAV.k = ''; SJV.E.clear(); SJV.sits.clear(); SJV.own = null; SJV.ownOff = 0; SJV.warn = null; SJV.at = -1; }"
# the boat you follow on Autonav towards the point where the NPC is in T game minutes (her own course, as the clock has it), from her
# starboard side (npc: the NPC gives way) or her port side (own: you give way), at vp knots: the first minute from now (up to an hour on)
# where the NPC steams at speed clear of the harbours and the whole way across, there and on, is clear of the ground
SETUP = """async ([id, side, T, vp]) => { const H0 = S.t / 60; vp = Math.min(vp, BOAT.vcruise || 7);
  for (let k = 0; k < 60; k++){
    const n = npcStates(H0 + k / 60, id)[0], q = npcStates(H0 + (k + T) / 60, id)[0], q2 = npcStates(H0 + (k + T + 3) / 60, id)[0];
    if (!n || !q || !q2 || n.hidden || !(n.v >= 6) || !(q.v >= 6) || inHarbour(n.p) || inHarbour(q.p) || inHarbour(q2.p) || n.st === 'port' || n.st === 'fishing' || q.st === 'fishing') continue;
    const M = q.p, c = q.cog != null ? q.cog : q.hd, gs = gridScale(M), hp = side === 'npc' ? c - Math.PI / 2 : c + Math.PI / 2, d = vp * NM * gs * T / 60;
    const st = {x:M.x - Math.sin(hp) * d, y:M.y + Math.cos(hp) * d}, end = {x:M.x + Math.sin(hp) * d * 1.8, y:M.y - Math.cos(hp) * d * 1.8};
    await mapNeed(M, MAPD.simR);
    if (groundCheck(st, M) || groundCheck(M, end) || inHarbour(st) || inHarbour(end)) continue;
    S.t = Math.round(H0 * 60) + k; acc = 0; const b = S.boat; b.port = null; b.anch = null; b.hove = null; b.gop = null; b.pos = {x:st.x, y:st.y}; b.heading = hp; b.v = vp; b.status = 'sailing'; b.dyn = null; DYN.line = null; DYN.dep = null;
    S.plan = {wps:[{x:end.x, y:end.y, port:null, fish:0}], idx:0, speed:vp, returning:false, unsafe:[false]}; S.trail = [];
    return {k, M, st, end, hp, vp, clear:true, H:S.t / 60}; }
  return {err:'ingen klar kryssing innen en time for ' + id}; }"""
# one sample: the NPC where she is shown and where the clock has her, the boat you follow, the manoeuvres, the warning, the strip, the chart
SAMPLE = """([id, L0]) => { const H = (S.t + liveFrac()) / 60, all = npcStates(H), n = all.find(q => q.id === id), base = npcStates(H, id)[0], b = S.boat, gs = gridScale(b.pos);
  const own = livePose().p, dev = n && base ? dist(n.p, base.p) / gs * 1000 : -1, R = n ? colregSit(sjvOwn(), n, {gs}) : null;
  // the others with no manoeuvre on (not giving way, not on their way back to their course): where the clock says (npc-flåten 4 A)
  let far = 0, man = 0; for (const q of all){ if (q.player || q.rs || q.kv) continue; if (SJV.E.has(q.id)){ man++; continue; } const z = npcStates(H, q.id)[0]; if (z && z.p) far = Math.max(far, dist(q.p, z.p) / gs * 1000); }
  // how far she is off the route's line (m, starboard +)
  const a = L0.st, e = L0.end, ux = e.x - a.x, uy = e.y - a.y, ul = Math.hypot(ux, uy), xte = ((own.x - a.x) * (-uy) + (own.y - a.y) * ux) / ul / gs * 1000;
  const nx = document.querySelector('#hud .st.nx'), W = sjvWarn();
  return {H, dev:Math.round(dev), land:n ? isLand(n.p) : false, rng:R ? Math.round(R.rng) : -1, tcpa:R ? +R.tcpa.toFixed(2) : 0, cpa:R ? Math.round(R.cpa) : -1, E:SJV.E.has(id) ? SJV.E.get(id).why + (SJV.E.get(id).slow ? ' slow' : '') : '',
    own:SJV.own ? SJV.own.why + (SJV.own.slow ? ' slow' : '') : '', off:Math.round(SJV.ownOff), xte:Math.round(xte), st:b.status, plan:!!S.plan, warn:W ? [W.id, W.sit, W.give, W.cpa, W.sev] : null,
    l3:nx ? nx.textContent : '', hud:(document.getElementById('hud') || {}).textContent || '', ring:!!document.querySelector('#gDyn g.sjv'), svgw:W ? sjvChartSvg(1 / view.px).length : -1, dyn:(document.getElementById('gDyn') || {}).innerHTML ? document.getElementById('gDyn').innerHTML.length : -1, far:Math.round(far), man, ms:+SJV.ms.toFixed(2), n:SJV.n, lim:R ? Math.round(R.lim) : 0, L:n ? n.L : 0, sw:SJV.warn ? 1 : 0,
    fog:SJV.fog, e19:SJV.e19 ? (SJV.e19.off ? 'off' : 'on') : '', vown:+sjvOwn().v.toFixed(1), cap:+(sjvCapV() < 1e8 ? sjvCapV() / KN_MS : 0).toFixed(1)}; }"""


# the same with nobody asking for the vessels (no npcStates from the test, the chart plotter shut, no 3D): Autonav keeps the look fresh
# from her own steps (sjvFresh); only the NPC's own course (npcStates with an id, which never looks) and Autonav's state are read
QUIET = """([id, L0]) => { const H = (S.t + liveFrac()) / 60, n = npcStates(H, id)[0], b = S.boat, gs = gridScale(b.pos), own = livePose().p;
  const a = L0.st, e = L0.end, ux = e.x - a.x, uy = e.y - a.y, ul = Math.hypot(ux, uy), xte = ((own.x - a.x) * (-uy) + (own.y - a.y) * ux) / ul / gs * 1000;
  return {rng:n ? Math.round(dist(n.p, own) / gs * 1000) : -1, own:SJV.own ? SJV.own.why : '', off:Math.round(SJV.ownOff), xte:Math.round(xte), plan:!!S.plan}; }"""


async def run(pg, id, side, h, m, T=4, vp=8):
    await pg.evaluate(AT, [h, m])
    L0 = await pg.evaluate(SETUP, [id, side, T, vp])
    if not L0 or L0.get('err') or not L0['clear']: return {'setup': L0}
    out = []; t0 = time.time()
    while time.time() - t0 < 240:
        await asyncio.sleep(0.4)
        s = await pg.evaluate(SAMPLE, [id, L0]); out.append(s)
        # done: past and opening, the manoeuvres over
        if s['tcpa'] < 0 and s['rng'] > 700 and not s['E'] and not s['own'] and abs(s['off']) < 2: break
        if not s['plan'] and s['tcpa'] < 0 and not s['E'] and not s['own']: break
    import os
    if os.environ.get('KYST_COLREG_DUMP'):
        with open('colreg-%s-%s.json' % (id, side), 'w') as f: json.dump({'setup': L0, 'S': out}, f)
    return {'setup': L0, 'S': out}


def summary(r):
    S = r['S']
    return {'n': len(S), 'Emax': max(s['dev'] for s in S), 'E': sorted({s['E'] for s in S if s['E']}), 'own': sorted({s['own'] for s in S if s['own']}),
            'offmax': max(abs(s['off']) for s in S), 'xtemax': max(s['xte'] for s in S), 'xteEnd': S[-1]['xte'], 'devEnd': S[-1]['dev'], 'rngMin': min(s['rng'] for s in S),
            'warn': sorted({tuple(s['warn'][1:3]) for s in S if s['warn']}), 'l3': sorted({s['l3'] for s in S if s['warn']})[:3], 'hud': any(('Vikeplikt' in s['hud'] or 'styrbord' in s['l3'] or 'Autonav' in s['l3']) for s in S if s['warn']), 'ring': any(s['ring'] for s in S if s['warn']),
            'land': any(s['land'] for s in S), 'far': max(s['far'] for s in S), 'ms': max(s['ms'] for s in S),
            'warn1': next((s['rng'] for s in S if s['warn']), -1), 'tsig': any('Tåkesignal' in s['l3'] for s in S if s['warn']), 'e19': any(s['e19'] == 'on' for s in S), 'vmin': min((s['vown'] for s in S if s['e19'] == 'on'), default=-1)}


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await (await b.new_context(viewport={'width': 1100, 'height': 760})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        await pg.evaluate("() => { S.settings.autoOn = false; S.boat.fuel = BOAT.fuelCap; }")
        clear1 = 0   # (the first warning's range in clear weather, for the fog's)
        # ---- the ferry, from her port side: she gives way ----
        r = await run(pg, 'ferje', 'npc', 7, 4)
        if not r or 'S' not in r: check(False, 'ferja og spilleren på kryssende kurs (oppsettet)', r)
        else:
            s = summary(r); print('   ferja viker:', json.dumps(s))
            check('15' in s['E'] and s['Emax'] >= 100, 'regel 15 og 16: ferja har spilleren om styrbord og viker til styrbord innen 1 km (avviket %d m)' % s['Emax'], s['E'])
            check(s['devEnd'] <= 2 and not r['S'][-1]['E'], 'ferja er tilbake på den felles banen etterpå (%d m)' % s['devEnd'])
            check(not s['own'] and s['offmax'] < 3, 'spilleren holder kurs og fart (Autonav svinger ikke, regel 17 a i)', (s['own'], s['offmax']))
            check(not s['land'], 'ferja er aldri på land under vikingen')
            check(s['rngMin'] >= 150, 'de passerer klar av hverandre (nærmest %d m)' % s['rngMin'])
            check(s['far'] <= 1, 'alle båtene som ikke viker eller er på vei tilbake, er der klokka sier (største avvik %d m)' % s['far'])
            clear1 = s['warn1']
        # ---- Ø11.2: the same in thick fog, not in sight of each other (rule 19) ----
        await pg.evaluate("() => { window.__vis = visibility; visibility = () => 0.5; SJV.sigLog.length = 0; }")
        r = await run(pg, 'ferje', 'npc', 7, 4)
        sl = await pg.evaluate("() => { visibility = window.__vis; return SJV.sigLog.map(q => [q.id, q.pat]); }")
        if not r or 'S' not in r: check(False, 'ferja og spilleren i tåke (oppsettet)', r)
        else:
            s = summary(r); print('   i tåke:', json.dumps(s), 'signaler:', sl[:12])
            check(('19', 'both') in s['warn'] and any('Tåke' in x or 'sikt' in x or 'Tåkesignal' in x for x in s['l3']), 'regel 19: i tåke uten sikt tar begge forholdsregler, og varselet sier det', (s['warn'], s['l3']))
            check(s['warn1'] > max(1500, clear1), 'varselet kommer tidligere i tåke (%d m mot %s m i klart vær)' % (s['warn1'], clear1))
            check('19' in s['E'] and s['Emax'] >= 100 and not s['land'], 'ferja viker til styrbord (19 d) og er aldri på land (avviket %d m)' % s['Emax'], s['E'])
            print('   (19 e i dette møtet: %s; Autonavs sving åpner CPA før tåkesignalet høres, og da er det ikke fare for sammenstøt)' % s['e19'])
            check(any(q[0] == 'ferje' and q[1] == 'L' for q in sl) and any(q[0] == '_own' and q[1] == 'L' for q in sl), 'regel 35: ferja og båten din gir ett langt støt i tåka', sl[:8])
            check(s['rngMin'] >= 150 and s['devEnd'] <= 2, 'de passerer klar av hverandre (nærmest %d m), og ferja er tilbake på banen' % s['rngMin'], s['devEnd'])
        # ---- 19 e: in fog with neither turning (their reach set to nothing), the ferry's fog signal ahead takes Autonav down to the
        # minimum steerage speed, and she stops when the ferry is as close as the limit, till the danger is over ----
        await pg.evaluate("() => { window.__vis = visibility; visibility = () => 0.5; window.__rn = [SJV.RNPCF, SJV.ROWNF]; SJV.RNPCF = 0; SJV.ROWNF = 0; }")
        r = await run(pg, 'ferje', 'npc', 7, 4)
        await pg.evaluate("() => { visibility = window.__vis; SJV.RNPCF = window.__rn[0]; SJV.ROWNF = window.__rn[1]; }")
        if not r or 'S' not in r: check(False, '19 e (oppsettet)', r)
        else:
            s = summary(r); vm = await pg.evaluate("sjvMinKn()"); print('   19 e:', json.dumps(s), 'minste styrefart', vm)
            check(s['e19'] and 0 <= s['vmin'] <= vm + 0.6 and s['tsig'], '19 e: tåkesignalet forut tar Autonav ned til minste styrefart (%s kn, minste %.1f), og varselet sier det' % (s['vmin'], vm), s['l3'][:2])
            check(s['rngMin'] >= 120, 'de går klar av hverandre (nærmest %d m)' % s['rngMin'])
        # ---- the ferry, from her starboard side: you give way, Autonav does it ----
        await pg.evaluate("() => openPlotter()")   # (the ring and the vectors are the chart plotter's: renderDyn runs while it shows)
        r = await run(pg, 'ferje', 'own', 8, 34)
        if not r or 'S' not in r: check(False, 'ferja og spilleren på kryssende kurs, spilleren viker (oppsettet)', r)
        else:
            s = summary(r); print('   du viker:', json.dumps(s))
            check(s['Emax'] <= 2 or s['E'] == ['17'], 'regel 17 a i: ferja holder kurs og fart når spilleren skal vike (avvik %d m)' % s['Emax'], s['E'])
            check('15' in s['own'] and s['xtemax'] >= 80, 'regel 15 og 16: Autonav viker til styrbord (%d m ut fra ruta)' % s['xtemax'], s['own'])
            check(abs(s['xteEnd']) <= 30 and s['offmax'] >= 80, 'Autonav kommer tilbake til ruta (%d m fra linja til slutt)' % s['xteEnd'])
            check(('15', 'a') in s['warn'] and s['hud'], 'varselet står i statusboksen (stripas tredje linje i stående, raden «Vikeplikt» i liggende)', (s['warn'], s['l3']))
            check(s['ring'], 'ringen og vektoren står i kartplotteren mens varselet gjelder')
            check(s['rngMin'] >= 150, 'de passerer klar av hverandre (nærmest %d m)' % s['rngMin'])
        # ---- a boat of the local fleet on her way out, from your port side: she gives way ----
        await pg.evaluate(AT, [5, 0])
        fid = await pg.evaluate("""(() => { const H = S.t / 60; for (let m = 0; m < 120; m += 5){ const a = npcStates(H + m / 60).filter(n => n.fleet && n.st === 'out' && n.v >= 6 && !inHarbour(n.p)); if (a.length) return [a[0].id, m]; } return null; })()""")
        if not fid: check(False, 'en båt fra Senja-flåten på vei ut finnes', fid)
        else:
            r = await run(pg, fid[0], 'npc', 5, fid[1])
            if not r or 'S' not in r: check(False, 'kystbåten og spilleren på kryssende kurs (oppsettet)', r)
            else:
                s = summary(r); print('   kystbåten viker:', json.dumps(s))
                check(s['E'] and s['Emax'] >= 80, 'kystbåten (%s) viker for spilleren som har den om babord (avviket %d m)' % (fid[0], s['Emax']), s['E'])
                check(s['devEnd'] <= 2, 'og er tilbake på den felles banen etterpå (%d m)' % s['devEnd'])
                check(not s['land'], 'kystbåten er aldri på land under vikingen')
        # ---- no room to turn (8 e): she slackens off instead, falls behind her course, and makes it up after ----
        if fid:
            await pg.evaluate("() => { window.__room = sjvRoom; sjvRoom = () => false; }")
            r = await run(pg, fid[0], 'npc', 5, fid[1])
            await pg.evaluate("() => { sjvRoom = window.__room; }")
            if not r or 'S' not in r: check(False, 'kystbåten uten plass til å svinge (oppsettet)', r)
            else:
                s = summary(r); print('   uten plass:', json.dumps(s))
                check(any('slow' in e for e in s['E']) and s['Emax'] >= 50, 'regel 8 e: uten plass til å svinge slakker kystbåten av (ligger %d m etter)' % s['Emax'], s['E'])
                check(s['rngMin'] >= 100 and s['devEnd'] <= 2, 'de passerer klar (nærmest %d m), og hun tar det igjen og er på den felles banen etterpå' % s['rngMin'], s['devEnd'])
                check(not s['own'], 'Autonav holder kurs og fart (rollene står mens møtet varer)', s['own'])
        # ---- 17 a ii: you give way and do not; the one that should stand on acts when it is clear you will not ----
        await pg.evaluate("() => { window.__rown = SJV.ROWN; SJV.ROWN = 0; }")
        r = await run(pg, 'ferje', 'own', 8, 34)
        await pg.evaluate("() => { SJV.ROWN = window.__rown; }")
        if not r or 'S' not in r: check(False, 'ferja holder kurs, spilleren viker ikke (oppsettet)', r)
        else:
            s = summary(r); print('   17 a ii:', json.dumps(s))
            check(s['E'] == ['17'] and not s['own'], 'regel 17 a ii: når spilleren ikke viker, gjør ferja noe selv til slutt', (s['E'], s['own']))
            check(s['rngMin'] >= 60, 'og de går klar av hverandre (nærmest %d m)' % s['rngMin'])
            check(any(w[1] == 'a' for w in s['warn']), 'varselet sier at du skal vike hele tiden', s['warn'])
        # ---- Autonav gives way also when no view asks for the vessels (the phone over a paused view) ----
        await pg.evaluate("() => { if (!G3.isActive()) G3.show(true); }")   # (back from the chart plotter: renderDyn no longer runs)
        await pg.evaluate(AT, [8, 34])
        L0 = await pg.evaluate(SETUP, ['ferje', 'own', 4, 8])
        if not L0 or L0.get('err'): check(False, 'Autonav uten visning (oppsettet)', L0)
        else:
            Q = []; t0 = time.time()
            while time.time() - t0 < 120:
                await asyncio.sleep(0.5); q = await pg.evaluate(QUIET, ['ferje', L0]); Q.append(q)
                if q['rng'] > 700 and len(Q) > 20 and not q['own'] and abs(q['off']) < 2 and max(abs(x['xte']) for x in Q) > 50: break
            mx = max(x['xte'] for x in Q)
            check(any(x['own'] for x in Q) and mx >= 80 and abs(Q[-1]['xte']) <= 30, 'Autonav viker også når ingen visning spør etter båtene (%d m ut, %d m fra linja til slutt)' % (mx, Q[-1]['xte']))
        # ---- never in harbour, never in the time away ----
        hv = await pg.evaluate("""(() => { const b = S.boat, q = PORTS[0]; b.status = 'port'; b.port = q.id; S.plan = null; return sjvWarn() === null; })()""")
        check(hv, 'ingen varsler i havn')
        ca = await pg.evaluate("""(() => { const was = DYN.on; DYN.on = false; const r = sjvLive(); DYN.on = was; return r === false; })()""")
        check(ca, 'ingen viking mens tiden tas igjen (catchUp: DYN.on er av)')
        check(errs == [], 'ingen sidefeil', errs[:3])
        await b.close()

asyncio.run(main())
