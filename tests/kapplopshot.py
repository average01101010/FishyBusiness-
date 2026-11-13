"""Kappløpet on the screen (KL2, steg 117; docs/planer/kapplop.md KL2, ui/05l-kapplop.js). The build must have the whole coast
(python3 tools/map/release.py && python3 tools/map/game.py). In both formats (800x1280 and 1280x800), with a havsjark in still weather,
everything tapped as CDP touch:
  1. the tab «Kappløp» in the Oppdrag app at the quay in Lindesnes: «Meld på», the course and the rules; nothing points to the shop or
     the Trim app (no button or link to them in the tab)
  2. «Meld på» by touch: registered, the course card has «Påmeldt i Lindesnes» ticked; «Kast loss mot Bergen» by touch: the way found
     and the clock started (lopDepart), leg 1's task and surprise shown in the tab
  3. the race clock in 3D: in the GPS box (the strip with the chart minimised) and the little chart's foot, and the chart plotter's bar
     in 2D (#ecLop); none of them overlap their neighbours
  4. the tasks from the screen (they lie in S.lop.run, not among the missions taken, so the screen finds them with turActs):
     a. the shutter (#fotoBtn) in 3D within 3 km of Obrestad fyr with the camera on it: the picture is taken
     b. the measuring board opened from the tab («Mål fisken») at a station, ten fish read off by touch, «Send til instituttet»: the task
        is done with the reading taken off the clock
     c. the tow made fast: the way to the harbour is found (turGo from turMinute with the task's text id)
  5. the chart with the course while she is registered: Autonav's way for the leg sailed now, the other legs, the checkpoints and the
     finish line, no overlap in the bar
  6. the card at the checkpoint in Bergen with the leg's time, «Se kappløpet» by touch opens the tab
  7. «Begynn på nytt» by touch, twice: the attempt is broken off («avbrutt»)
  8. no page errors
  9. KL3 (steg 118): the week's board from a fake cloud: the class's top 20 and your place, another class by touch, the Sesong card's
     leader and place, a guest's note, and without lop_top (404) the tab as before
Screenshots: tests/out/kapplop-{for,tavle,under,klokke,kart,sjekkpunkt}-{staaende,liggende}.jpg. KYST_KL_ONE=liggende (or staaende): one format.
python3 tests/kapplopshot.py (3D). Prints OK or FEIL lines."""
import asyncio, json, os, time
from _env import boot
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'out'); os.makedirs(OUT, exist_ok=True)
FAIL = []
def check(ok, what, info=None):
    print(('OK ' if ok else 'FEIL ') + what + ('' if info is None else ' ' + json.dumps(info, ensure_ascii=False)[:600]))
    if not ok: FAIL.append(what)

# the boat at the quay in Lindesnes: a havsjark, a full tank, you aboard, still weather, no race
AT = """async () => { const b = S.boat, pt = portById(LOP.start.port);
  await mapNeed(pt.p, 4);
  b.type = 'sjark'; applyVessel();
  S.tut = 0; S.settings.autoOn = false; S.me = S.cur; S.sleep = null; S.energy = 95; S.skip = null; WX_FORCE = {w:3, d:180}; S.crew = [];
  if (S.turer) S.turer.act = []; S.cargo = []; S.sos = null; S.mob = null; S.ptowH = null; S.ptow = null; S.lop = null;
  b.status = 'port'; b.port = pt.id; b.pos = {x:pt.p.x, y:pt.p.y}; b.v = 0; b.anch = null; b.hove = null; b.damage = 0; b.dmg = null; b.sale = null; b.landQ = null;
  delete b.trim; applyVessel(); b.fuel = BOAT.fuelCap; S.hold = []; S.plan = null; S.jobs = []; save();
  return {port:pt.id, name:pt.name}; }"""
# a rect of an element (shown or not), and whether two overlap
RECT = """(sel) => { const e = document.querySelector(sel); if (!e) return null; const q = e.getBoundingClientRect(), cs = getComputedStyle(e);
  return {x:Math.round(q.left), y:Math.round(q.top), w:Math.round(q.width), h:Math.round(q.height), r:Math.round(q.right), b:Math.round(q.bottom), shown:!e.hidden && cs.display !== 'none' && cs.visibility !== 'hidden' && q.width > 0, t:(e.textContent || '').slice(0, 80)}; }"""
def over(a, b):
    return a and b and a['shown'] and b['shown'] and a['x'] < b['r'] - 1 and b['x'] < a['r'] - 1 and a['y'] < b['b'] - 1 and b['y'] < a['b'] - 1
# the tab now: its text, its buttons
TAB = """() => { const c = document.querySelector('#phone .ph-c'); if (!c) return null;
  return {txt:c.innerText.slice(0, 1500), btns:[...c.querySelectorAll('button[data-pa]')].map(x => [x.dataset.pa, x.textContent.trim()]),
    on:(document.querySelector('#phone .ph-sub button.on') || {}).textContent || null}; }"""
RUN = """() => { const L = S.lop || {}, r = L.run; return {st:r ? r.st : null, t0:r ? r.t0 : null, legs:r ? r.legs.length : null, tasks:r ? (r.tasks || []).map(m => [m.id, m.k, m.kind || null, m.role, m.st, m.stage || null, m.adj || 0]) : null,
  hist:(L.hist || []).slice(0, 1).map(e => [e.st, e.how, e.legs]), bst:S.boat.status, plan:S.plan ? {n:S.plan.wps.length, port:S.plan.wps[S.plan.wps.length - 1].port} : null}; }"""
# a task of the race made at its place for the test, the boat put where the screen is to be tried (the core is KL1b's, kapplop.py tests it)
MAKE = """async (o) => { const r = S.lop.run, b = S.boat, Lg = LOP.legs[o.j], spec = o.role === 'fix' ? Lg.fix : Lg.surp[o.i];
  const m = lopMake(r, o.j, o.role + 'x', spec); if (!m) return {err:'no task'}; m.role = o.role; m.id = r.id + ':' + o.j + 't' + o.k; r.tasks.push(m);
  return {id:m.id, k:m.k, kind:m.kind || null, stage:m.stage || null}; }"""

async def one(p, name, vw, vh):
    br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-compositing'])
    ctx = await br.new_context(viewport={'width': vw, 'height': vh}, has_touch=True)
    pg = await ctx.new_page(); cdp = await ctx.new_cdp_session(pg)
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e) + ' @ ' + ' | '.join((getattr(e, 'stack', '') or '').split('\n')[1:4])))
    await boot(pg)
    await pg.wait_for_function("typeof SIMREADY !== 'undefined' && SIMREADY && S.boat.status === 'port'", timeout=120000)
    pg.set_default_timeout(600000)
    J = lambda js, *a: pg.evaluate(js, *a)
    # (the phone slides in with a CSS transition, which does not run without frames in headless Chromium: it stood at translateY(110 %)
    # under the screen and the taps missed it, 13.11.2026. The slide is taken off for the test; nothing it checks depends on it)
    await pg.add_style_tag(content='#phone{transition:none!important}')
    async def tap_xy(x, y):
        await cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x, 'y': y, 'id': 0}]}); await asyncio.sleep(0.05)
        await cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []}); await asyncio.sleep(0.3)
    async def tap(sel):
        r = await J("s => { const e = document.querySelector(s); if (!e) return null; e.scrollIntoView({block:'center'}); const q = e.getBoundingClientRect(); return {x:q.x + q.width / 2, y:q.y + q.height / 2}; }", sel)
        if not r: print('     (finner ikke ' + sel + ')'); return None
        await tap_xy(r['x'], r['y']); return r
    async def shot(k):
        await pg.wait_for_timeout(500); await pg.screenshot(path=os.path.join(OUT, 'kapplop-' + k + '-' + name + '.jpg'), type='jpeg', quality=60)
    async def tab():
        st = await J("() => { try { PHONE.show(true); PHONE.open('ordl'); return null; } catch (e){ return String(e.stack).slice(0, 600); } }"); await pg.wait_for_timeout(500)
        if st: print('     (fanen feilet: ' + st + ')')
        await tap('#phone .ph-sub button[data-s="lop"]'); await pg.wait_for_timeout(400)
        return await J(TAB)

    a = await J(AT); check(a.get('name') == 'Lindesnes' or a.get('port') == await J("() => LOP.start.port"), name + ': båten ved kaia i Lindesnes', a)
    await J("() => { if (!G3.isActive()) G3.show(true); }"); await pg.wait_for_function("G3.isActive()", timeout=120000); await pg.wait_for_timeout(1500)
    # 1. the tab before
    t = await tab()
    pa = [b[0] for b in (t or {}).get('btns', [])]
    check(t and t['on'] == 'Kappløp' and 'lopreg' in pa and 'Reglene' in t['txt'] and 'Etappe 6: Tromsø–Nordkapp' in t['txt'], name + ': 1. fanen «Kappløp» med «Meld på», løypa og reglene', t)
    bad = await J("() => [...document.querySelectorAll('#phone .ph-c [data-pa]')].map(x => x.dataset.pa).filter(k => /shop|trim|haill|buy|nett|sk/.test(k))")
    check(bad == [], name + ': 1. ingen knapp i fanen peker til butikken eller Trim-appen', bad)
    await shot('for')
    # 9. KL3 (steg 118): the week's board from a fake cloud (as eventtest): the class's top 20 with the boat and the player's name, your
    # place under them, another class by touch, the leader and your place in the Sesong card; a guest's note; a server without lop_top
    # (404): no board and no error, your own time as before
    FAKE = """(o) => { window.__rpc0 = window.__rpc0 || window.cloudRpc; window.__c0 = window.__c0 || {on:CLOUD.on, user:CLOUD.user, guest:CLOUD.guest};
      const wk = lopWeek(lopMs(S.t)).id, rows = [];
      for (let i = 1; i <= 20; i++) rows.push({rank:i, boat:['Havbris', 'Nordstjerna', 'Måsøy', 'Sjøblomsten', 'Kvitbjørn'][i % 5] + (i > 5 ? ' ' + i : ''), user:i % 3 ? 'Fisker' + i : '', type:'sjark', min:5400 + i * 37, me:false, id:'x' + i});
      const T = {wk, cls:{middels:{rows, n:23, mine:{rank:23, min:6800}}, sakte:{rows:rows.slice(0, 4).map(r => Object.assign({}, r, {type:'trebat', min:r.min + 2000})), n:4, mine:null}}};
      window.cloudRpc = async (fn, a) => { if (o.e404) throw new Error(fn + ' 404'); return fn === 'lop_top' ? T : null; };
      CLOUD.on = true; CLOUD.user = 'u1'; CLOUD.guest = !!o.guest; for (const k in LTOP) delete LTOP[k]; LOP_CLS = null; return wk; }"""
    UNFAKE = "() => { window.cloudRpc = window.__rpc0; Object.assign(CLOUD, window.__c0); for (const k in LTOP) delete LTOP[k]; LOP_CLS = null; }"
    BOARD = """() => { const b = document.querySelector('#phone .lop-board'); if (!b) return null; const q = b.getBoundingClientRect(), ph = document.querySelector('#phone').getBoundingClientRect();
      return {rows:[...b.querySelectorAll('table tr')].slice(1).map(r => [...r.children].map(c => c.innerText.trim())), me:[...b.querySelectorAll('tr.me')].map(r => r.children[0].innerText.trim()),
        on:(b.querySelector('.ph-sub .on') || {}).innerText, txt:b.innerText, w:q.width, inside:q.left >= ph.left - 1 && q.right <= ph.right + 1,
        wide:[...b.querySelectorAll('td,th')].some(c => c.scrollWidth > c.clientWidth + 2)}; }"""
    await J(FAKE, {}); await tab(); await pg.wait_for_timeout(600); await J("() => PHONE.render()"); await pg.wait_for_timeout(300)
    bd = await J(BOARD)
    check(bd and len(bd['rows']) == 21 and bd['rows'][0][0] == '1' and bd['me'] == ['23'] and bd['on'] == 'Middels' and '23 båter i mål' in bd['txt'] and bd['inside'] and not bd['wide'] and 'trim' not in bd['txt'].lower(),
          name + ': 9. ukas tavle i klassen middels: topp 20 med båt og navn, din plass (23) under, ingen trim', bd and {k: bd[k] for k in ('me', 'on', 'inside', 'wide')})
    await tap('#phone .lop-board .ph-sub button[data-s="sakte"]'); await pg.wait_for_timeout(400); bs = await J(BOARD)
    await tap('#phone .lop-board .ph-sub button[data-s="rask"]'); await pg.wait_for_timeout(400); br_ = await J(BOARD)
    check(bs and len(bs['rows']) == 4 and bs['on'] == 'Sakte' and br_ and br_['rows'] == [] and 'Ingen i klassen rask' in br_['txt'], name + ': 9. en annen klasse med berøring: sakte har fire, rask ingen ennå', {'sakte': bs and bs['rows'][:2], 'rask': br_ and br_['txt'][:120]})
    await tap('#phone .lop-board .ph-sub button[data-s="middels"]'); await pg.wait_for_timeout(300)
    await J("() => document.querySelector('#phone .lop-board').scrollIntoView({block:'start'})"); await shot('tavle')
    # (the Sesong card asks for the board only for one who races: a time this week, put in for the look and taken out after)
    sc = await J("""() => { const L = lopState(), wk = lopWeek(lopMs(S.t)).id; L.best[wk] = 7000; PHONE.open('sesong');
      return new Promise(r => setTimeout(() => { PHONE.render(); setTimeout(() => { const c = document.querySelector('#phone .lop-s'); delete L.best[wk]; r(c ? c.innerText : null); }, 400); }, 500)); }""")
    check(sc and 'Ukas beste, middels' in sc and 'Din plass' in sc and '23 av 23' in sc, name + ': 9. Sesong-kortet: ukas beste i klassen og din plass', sc)
    await J(FAKE, {'guest': True}); await tab(); await pg.wait_for_timeout(600); await J("() => PHONE.render()"); await pg.wait_for_timeout(300); bg = await J(BOARD)
    check(bg and 'Som gjest ser du bare din egen tid' in bg['txt'], name + ': 9. en gjest får vite at tavla bare viser egen tid', bg and bg['txt'][-160:])
    n0 = len(errs); await J(FAKE, {'e404': True}); await tab(); await pg.wait_for_timeout(600); await J("() => PHONE.render()"); await pg.wait_for_timeout(300)
    b404 = await J(BOARD); off = await J("() => !!LTOP.off"); t404 = await J(TAB)
    check(b404 is None and off and t404 and 'Reglene' in t404['txt'] and len(errs) == n0, name + ': 9. uten lop_top (404): ingen tavle, fanen som før, ingen feil', {'off': off, 'errs': errs[n0:]})
    await J(UNFAKE)
    # 2. «Meld på» and «Kast loss mot Bergen» by touch
    await tap('#phone [data-pa="lopreg"]'); r = await J(RUN); t = await J(TAB)
    check(r['st'] == 'reg' and t and 'Påmeldt i Lindesnes' in t['txt'], name + ': 2. påmeldt med berøring, «Påmeldt i Lindesnes» krysset av', {'run': r, 'btns': t and t['btns']})
    ticked = await J("() => !!document.querySelector('#phone .lop-l.ok')")
    check(ticked, name + ': 2. kortet starter med «Påmeldt i Lindesnes» krysset av')
    t_go = time.monotonic(); await tap('#phone [data-pa="lopgo"]')
    try: await pg.wait_for_function("S.lop && S.lop.run && S.lop.run.st === 'run'", timeout=480000)
    except Exception as e:
        print('     (ikke i gang:', await J("() => ({toast:(document.getElementById('toast') || {}).textContent, plan:!!S.plan, st:S.boat.status, run:S.lop && S.lop.run && S.lop.run.st, busy:typeof LEIA_RUN !== 'undefined' ? LEIA_RUN.length : null})"), ')'); raise
    print('     (ruta Lindesnes–Bergen funnet på %.1f s)' % (time.monotonic() - t_go))
    r = await J(RUN)
    check(r['st'] == 'run' and r['t0'] is not None and r['plan'] and r['plan']['port'] == await J("() => LOP.cps[0].port") and len(r['tasks']) == 2, name + ': 2. «Kast loss mot Bergen» med berøring: ruta funnet, klokka går, oppgaven og overraskelsen vist', r)
    # a little way out under the clock, still weather
    await J("() => { for (let i = 0; i < 25; i++){ DYN.on = false; playMinutes(1, true); CATCH_LEFT = 0; } }")
    t = await tab()
    check(t and 'oppgaven' in t['txt'].lower() and 'overraskelsen' in t['txt'].lower() and 'Obrestad' in t['txt'] and 'Klokka' in t['txt'], name + ': 2. fanen under forsøket: klokka, etappe 1 og oppgavene', t and t['txt'][:400])
    await shot('under')
    # 3. the clock in 3D and in the plotter's bar, with a time as long as a real race has (the start put 4 d 18 h back: the whole course
    # is 4 to 7 game days)
    await J("() => { PHONE.show(false); S.lop.run.t0 -= 4 * 1440 + 18 * 60; }"); await pg.wait_for_timeout(900)
    foot = await J("() => GPS3D && GPS3D.lop")
    check(foot and foot.get('t'), name + ': 3. klokka i kartplotterens fot i 3D', foot)
    await J("() => { S.settings.plotMin = true; document.body.classList.add('plotmin'); INSTR.renderGPS(); }"); await pg.wait_for_timeout(600)
    g = await J(RECT, '#gps3d'); gl = await J(RECT, '#gps3d .glop')
    rows = await J("() => new Set([...document.querySelectorAll('#gps3d .gstrip > *')].map(e => Math.round(e.getBoundingClientRect().top))).size")
    check(g and g['shown'] and gl and gl['shown'] and gl['r'] <= g['r'] + 1 and ' d ' in gl['t'] and rows <= 2, name + ': 3. klokka i GPS-stripa i 3D med dager på, uten ny linje', {'gps': g, 'lop': gl, 'rader': rows})
    await J("() => { S.settings.plotMin = false; document.body.classList.remove('plotmin'); INSTR.renderGPS(); }"); await pg.wait_for_timeout(900)
    await shot('klokke')
    await J("() => { S.lop.run.t0 += 4 * 1440 + 18 * 60; }")
    # 4a. the shutter at Obrestad fyr, in 3D, the boat a kilometre off with her bow and the camera on it
    fx = await J("() => S.lop.run.tasks.find(m => m.role === 'fix').id")
    pos = await J("""async (id) => { const m = S.lop.run.tasks.find(x => x.id === id), b = S.boat; await mapNeed(m.p, 2);
      b.pos = {x:m.p.x, y:m.p.y}; b.status = 'idle'; b.v = 0; S.plan = null; b.heading = Math.atan2(m.fyr.x - m.p.x, -(m.fyr.y - m.p.y));
      return {d:+dist(b.pos, m.fyr).toFixed(2), lys:m.lys}; }""", fx)
    await pg.wait_for_timeout(4000)
    # (the camera stands 0.55 rad off her bow, and standing up the view is narrow: the bow turned until the light is in the picture, as a
    # player turns the camera; G3.seen is what the shutter asks)
    # (the camera stands 0.55 rad off her bow and does not follow her heading while she lies still, and standing up the view is only
    # some 36° wide: the camera is turned as a player turns it, by dragging a finger across the 3D view, until G3.seen, which the
    # shutter asks, says the light is in the picture)
    SEEN = "(id) => { const m = S.lop.run.tasks.find(x => x.id === id), q = G3.seen(m.fyr.x, m.fyr.y, m.fyr.h); return q ? {front:!!q.front, clear:!!q.clear, ang:q.ang, half:q.half} : null; }"
    async def drag(dx):
        cx, cy = vw / 2, vh * 0.55
        await cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': cx, 'y': cy, 'id': 1}]}); await asyncio.sleep(0.05)
        for k in range(1, 9):
            await cdp.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{'x': cx + dx * k / 8, 'y': cy, 'id': 1}]}); await asyncio.sleep(0.03)
        await cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []}); await asyncio.sleep(1.2)
    aim = None; tries = []; step = 60
    sn = await J(SEEN, fx); tries.append([0, sn])
    for k in range(14):
        if sn and sn['front'] and sn['clear']: aim = k; break
        await drag(step); s2 = await J(SEEN, fx); tries.append([step, s2])
        if s2 and sn and s2['ang'] > sn['ang']: step = -step // 2 if abs(step) > 15 else -step   # (the wrong way, or past it: back, by less)
        sn = s2
    if aim is None: print('     (kameraet: ' + json.dumps(tries) + ')')
    await J("() => { turFotoUi(); }"); fb = await J(RECT, '#fotoBtn')
    check(fb and fb['shown'], name + ': 4a. utløseren står i 3D innen 3 km av Obrestad fyr', {'pos': pos, 'btn': fb})
    await tap('#fotoBtn'); await pg.wait_for_timeout(2500)
    r = await J(RUN); st = [x for x in r['tasks'] if x[0] == fx]
    toast = await J("() => (document.getElementById('toast') || {}).textContent || ''")
    check(st and st[0][4] == 'done', name + ': 4a. bildet av Obrestad fyr er tatt med utløseren', {'aim': aim, 'task': st, 'toast': toast})
    # 4b. the measuring board at a station (leg 3's fixed task, the station on Frohavet, made here for the screen): fished, then measured by touch
    s = await J(MAKE, {'j': 2, 'role': 'fix', 'k': 'st'})
    check(s.get('k') == 'prove' and s.get('kind') == 'stasjon', name + ': 4b. prøvestasjonen laget', s)
    await J("(id) => { const m = S.lop.run.tasks.find(x => x.id === id); m.leg = S.lop.run.legs.length; m.min = m.need; m.stage = 'measure'; m.got = {torsk:40, hyse:12}; }", s['id'])
    t = await tab()
    check(t and any(b[0] == 'turmeas' for b in t['btns']), name + ': 4b. «Mål fisken» i fanen', t and t['btns'])
    await tap('#phone [data-pa="turmeas"]'); await pg.wait_for_timeout(500)
    for i in range(10):
        f = await J("(id) => { const m = S.lop.run.tasks.find(x => x.id === id), f = m.fish[m.meas.length], sv = document.querySelector('#turMeas svg'); if (!f || !sv) return null; const q = sv.getBoundingClientRect(); return {x:q.left + (Math.round(f.cm) - f.c0 + 0.0) * 15 / 360 * q.width, y:q.top + q.height * 0.7}; }", s['id'])
        if not f: break
        await tap_xy(f['x'], f['y']); await tap('#turMeas [data-x="ok"]'); await pg.wait_for_timeout(1300)
    await tap('#turMeas [data-x="send"]'); await pg.wait_for_timeout(400)
    r = await J(RUN); st = [x for x in r['tasks'] if x[0] == s['id']]
    check(st and st[0][4] == 'done' and st[0][6] < 0, name + ': 4b. målebrettet fylt ut med berøring og sendt: oppgaven gjort, tid trukket fra', st)
    # 4c. the tow: lying still by the boat, the line goes over and the way to the harbour is found (turMinute calls turGo with the text id)
    w = await J(MAKE, {'j': 0, 'role': 'surp', 'i': 2, 'k': 'sl'})
    await J("""async (id) => { const m = S.lop.run.tasks.find(x => x.id === id), b = S.boat; m.leg = S.lop.run.legs.length; await mapNeed(m.p, 2); b.pos = {x:m.p.x + 0.05, y:m.p.y}; b.status = 'idle'; b.v = 0; S.plan = null; turMinute(); }""", w['id'])
    await pg.wait_for_function("S.plan && S.boat.status !== 'idle'", timeout=60000)
    r = await J(RUN); st = [x for x in r['tasks'] if x[0] == w['id']]; to = await J("(id) => S.lop.run.tasks.find(x => x.id === id).to", w['id'])
    check(st and st[0][5] == 'tow' and r['plan'] and r['plan']['port'] == to, name + ': 4c. slepet festet: ruta til havna er funnet', {'task': st, 'plan': r['plan'], 'to': to})
    # 5. the chart with the course: «Kjør til Bergen» from the tab (by touch), so the leg sailed now is her own Autonav route
    await J("() => { S.plan = null; S.boat.status = 'idle'; S.boat.v = 0; }")
    await tab(); await tap('#phone [data-pa="lopgo"]')
    await pg.wait_for_function("S.plan && S.plan.wps.length > 1 && S.plan.wps[S.plan.wps.length - 1].port === LOP.cps[0].port", timeout=300000)
    await J("() => { S.boat.status = 'idle'; S.boat.v = 0; PHONE.show(false); G3.show(false); openPlotter(); }"); await pg.wait_for_timeout(800)
    await J("""() => { const P = [LOP.start.p].concat(LOP.cps.map(c => c.p), [LOP.goal.p]), y0 = Math.min(...P.map(q => q.y)), y1 = Math.max(...P.map(q => q.y)), x0 = Math.min(...P.map(q => q.x)), x1 = Math.max(...P.map(q => q.x)), r = document.getElementById('map').getBoundingClientRect();
      view.cx = (x0 + x1) / 2; view.cy = (y0 + y1) / 2; view.z = MAP_H / Math.max((y1 - y0) * 1.2, (x1 - x0) * 1.25 * r.height / r.width); applyView(); renderStatic(); }""")
    await J("() => { renderStatic(); }"); await pg.wait_for_timeout(1500)
    k = await J("() => ({lines:document.querySelectorAll('#map .lopmk').length, now:[...document.querySelectorAll('#map .lopmk.now')].map(e => e.getAttribute('points').split(' ').length), cps:document.querySelectorAll('#map .lopcp').length, goal:document.querySelectorAll('#map .lopgoal').length, plan:S.plan.wps.length})")
    check(k['lines'] == 6 and k['cps'] == 6 and k['goal'] == 1 and k['now'] and k['now'][0] > 2, name + ': 5. løypa i kartet: Autonav-veien for etappen som seiles, de andre etappene, sjekkpunktene og mållinja', k)
    bar = await J(RECT, '#ecLop'); bars = await J("() => [...document.querySelectorAll('#ecdisTop > .ec-f')].map(e => { const q = e.getBoundingClientRect(), cs = getComputedStyle(e); return cs.display === 'none' ? null : [e.className, Math.round(q.left), Math.round(q.right)]; }).filter(Boolean)")
    ov = [1 for i in range(len(bars) - 1) if bars[i][2] > bars[i + 1][1] + 1]
    vw_ok = all(b[2] <= vw + 1 for b in bars)
    check(bar and bar['shown'] and bar['t'] and not ov and vw_ok, name + ': 3. klokka i kartplotterens linje, uten overlapp og innenfor skjermen', {'lop': bar, 'bar': bars})
    await shot('kart')
    # (the Oppdrag app on another tab first, so «Se kappløpet» below has to open the race's tab itself)
    await J("() => { PHONE.show(true); PHONE.open('ordl'); }"); await pg.wait_for_timeout(400); await tap('#phone .ph-sub button[data-s="turer"]'); await J("() => PHONE.show(false)")
    # 6. the card at the checkpoint in Bergen (the leg's fixed task is done: the dock counts it, as the core does when she moors there)
    await J("() => { G3.show(true); }"); await pg.wait_for_function("G3.isActive()", timeout=120000)
    c = await J("""async () => { const r = S.lop.run, pt = portById(LOP.cps[0].port), b = S.boat; await mapNeed(pt.p, 3);
      r.tasks = r.tasks.filter(m => !/:\dt/.test(m.id));   // (the tasks made for the test above; leg 1's own picture is taken)
      b.status = 'port'; b.port = pt.id; b.pos = {x:pt.p.x, y:pt.p.y}; S.plan = null; lopDock(pt.id); return {legs:r.legs.length}; }""")
    # (the card comes with the next tick of the game; while the 3D view draws Bergen for the first time that can take a while in SwiftShader)
    try: await pg.wait_for_function("(() => { const e = document.querySelector('#lopPop .lp-box'); return !!e && !document.getElementById('lopPop').hidden; })()", timeout=60000)
    except Exception: pass
    await pg.wait_for_timeout(500)
    pop = await J(RECT, '#lopPop .lp-box')
    if not pop: print('     (ingen kort: ' + json.dumps(await J("() => { const r = S.lop.run; try { lopUi(); } catch (e){ return String(e.stack).slice(0, 600); } return {seen:r.seenN, legs:r.legs.length, tut:typeof tutOn === 'function' && tutOn()}; }")) + ' sidefeil: ' + json.dumps(errs[:2])[:600] + ')')
    check(c['legs'] == 1 and pop and pop['shown'] and 'Sjekkpunkt Bergen' in pop['t'], name + ': 6. kortet ved sjekkpunktet i Bergen med etappetida', {'c': c, 'pop': pop})
    await shot('sjekkpunkt')
    await tap('#lopPop [data-x="see"]'); await pg.wait_for_timeout(600)
    t = await J(TAB); hid = await J("() => { const e = document.getElementById('lopPop'); return !e || e.hidden; }")
    check(pop and pop['shown'] and hid and t and t['on'] == 'Kappløp' and 'Etappe 2' in t['txt'], name + ': 6. «Se kappløpet» med berøring åpner fanen', {'on': t and t['on']})
    # 6b. north: the last leg from Tromsø, «Kjør til Nordkapp» by touch: Autonav's way ends past the finish line (the stikkprøve's north;
    # south is Lindesnes, Obrestad and the tow off Egersund, the middle the station on Frohavet)
    n = await J("""async () => { const r = S.lop.run, pt = portById(LOP.cps[4].port), b = S.boat; await mapNeed(pt.p, 3);
      while (r.legs.length < 5) r.legs.push({t:S.t, pid:LOP.cps[r.legs.length].port}); r.seenN = 5; r.tasks = r.tasks.filter(m => m.leg < 5);
      b.status = 'port'; b.port = pt.id; b.pos = {x:pt.p.x, y:pt.p.y}; S.plan = null; return {port:pt.name}; }""")
    t = await tab()
    go = [b for b in (t or {}).get('btns', []) if b[0] == 'lopgo']
    check(go and 'Nordkapp' in go[0][1], name + ': 6b. fra Tromsø: «Kjør til Nordkapp»', {'n': n, 'go': go})
    await tap('#phone [data-pa="lopgo"]')
    await pg.wait_for_function("S.plan && S.plan.wps.length > 1", timeout=300000)
    e = await J("() => { const w = S.plan.wps[S.plan.wps.length - 1]; return {y:w.y, goal:LOP.goal.p.y, x:w.x, gx:LOP.goal.p.x, n:S.plan.wps.length, st:S.boat.status}; }")
    check(e['y'] < e['goal'] and e['x'] > e['gx'], name + ': 6b. ruta fra Tromsø ender øst for mållinja, nord for Nordkapp', e)
    await J("() => { const pt = portById(LOP.cps[4].port), b = S.boat; S.plan = null; b.status = 'port'; b.port = pt.id; b.pos = {x:pt.p.x, y:pt.p.y}; b.v = 0; }")   # (back at the quay: depart emptied b.port)
    t = await tab()
    # 7. «Begynn på nytt», twice
    await tap('#phone [data-pa="lopquit"]'); r1 = await J(RUN)
    await tap('#phone [data-pa="lopquit"]'); r2 = await J(RUN)
    check(r1['st'] == 'run' and r2['st'] is None and r2['hist'] and r2['hist'][0][0] == 'dnf' and r2['hist'][0][1] == 'avbrutt', name + ': 7. «Begynn på nytt» med berøring (to trykk): forsøket er brutt', {'før': r1['st'], 'etter': r2})
    t = await J(TAB)
    check(t and any(b[0] == 'lopgo' for b in t['btns']) and 'Forsøkene dine' in t['txt'], name + ': 7. etterpå: veien til Lindesnes og forsøket i lista', t and t['btns'])
    check(errs == [], name + ': 8. ingen sidefeil', errs[:3])
    await br.close()

async def main():
    one_f = os.environ.get('KYST_KL_ONE')
    async with async_playwright() as p:
        for name, vw, vh in [('staaende', 800, 1280), ('liggende', 1280, 800)]:
            if one_f and one_f != name: continue
            await one(p, name, vw, vh)
    print('FERDIG', 'FEIL: ' + ', '.join(FAIL) if FAIL else 'alt OK')

asyncio.run(main())
