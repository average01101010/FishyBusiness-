# Driftsplan 2, fase 0: the plan's page and the chart pick with real taps (CDP touch), in three viewports. Screenshots in ui/.
import asyncio, json, sys, os
sys.path.insert(0, '/home/user/FishyBusiness-/tests')
from playwright.async_api import async_playwright
from _env import boot, GAME
OUTD = os.environ.get('REV_OUT') or os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ui')

SETUP = """(async () => { S.tut = 0; S.settings.lang = 'no'; S.lang = 'no';
  const b = S.boat, HP = portById('finnsnes'); b.type = 'sjark'; applyVessel(); b.status = 'port'; b.port = 'finnsnes'; b.pos = {...HP.p}; S.plan = null; S.ops = null; S.draft = []; S.me = S.cur; S.cash = 500000;
  S.crew = [Object.assign(genCrew(), {bi:false, off:false, traits:[], known:[true, true], name:'Ole Mikalsen'}), Object.assign(genCrew(), {bi:false, off:false, traits:[], known:[true, true], name:'Per Hansen'})]; setSkipper(S.crew[0].id); setMate(S.crew[1].id);
  S.equip.linehaler = true; S.pgear = newPGear(); S.pgear.kits.n = 4; S.pgear.lines.hyse.n = 4; S.pgear.lines.hyse.baited = 4; S.pgear.lines.hyse.bt = {makrell:4};
  await mapNeed(HP.p, 14);
  const sea = []; for (let r = 2.5; r < 12 && sea.length < 3; r += 0.5) for (let a = 0; a < 24 && sea.length < 3; a++){ const q = {x:HP.p.x + r * Math.sin(a * 0.26), y:HP.p.y - r * Math.cos(a * 0.26)}; try { if (!isLand(q) && depthF(q) > 20 && coastDist(q) > 0.4 && sea.every(z => dist(z, q) > 1) && !ruBlockMsg({p:q, len:BOAT.len, gear:'juksa', sp:null, hand:true})) sea.push(q); } catch (e){} }
  S.marks.push({x:sea[0].x, y:sea[0].y, t:S.t - 300, kgph:52, q:1});
  window.SEA = sea; if (typeof refreshAll === 'function') refreshAll(); return {sea:sea.length, body:document.body.className}; })()"""

FIND = """(re) => { const R = new RegExp(re); const inView = e => { const q = e.getBoundingClientRect(); return q.width > 4 && q.height > 4 && q.bottom > 0 && q.right > 0 && q.top < innerHeight && q.left < innerWidth; }; const sized = e => { const q = e.getBoundingClientRect(); return q.width > 4 && q.height > 4; };
  const all = [...document.querySelectorAll('button, [data-pa], [data-act], [data-dk], [data-a], a, .dr-rh, .ph-app, canvas[role=button]')].filter(e => sized(e) && R.test(((e.getAttribute('aria-label') || '') + ' ' + e.textContent.replace(/\\s+/g, ' ')).trim()));
  let e = all.find(inView); let scrolled = false; if (!e && all[0]){ e = all[0]; e.scrollIntoView({block:'center'}); scrolled = true; } if (!e) return null;
  const q = e.getBoundingClientRect(); return {x:q.x + q.width / 2, y:q.y + q.height / 2, w:Math.round(q.width), h:Math.round(q.height), txt:e.textContent.replace(/\\s+/g, ' ').trim().slice(0, 60), n:all.length, scrolled}; }"""

async def run(p, w, h, tag):
    ctx = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-compositing'])
    c = await ctx.new_context(viewport={'width': w, 'height': h}, has_touch=True, is_mobile=(w < 500)); pg = await c.new_page(); cdp = await c.new_cdp_session(pg); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    taps = [0]
    async def tap(x, y, what=''):
        taps[0] += 1
        await cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x, 'y': y, 'id': 0}]}); await asyncio.sleep(0.05)
        await cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []}); await asyncio.sleep(0.4)
        print('   tap %2d %-28s (%d,%d)' % (taps[0], what, x, y))
    async def tap_text(re_, what=None):
        r = await pg.evaluate(FIND, re_)
        if not r: print('   (fant ikke «%s»)' % re_); return None
        await tap(r['x'], r['y'], what or r['txt'][:28]); return r
    async def tap_sel(sel, what=None):
        r = await pg.evaluate("s => { const e = document.querySelector(s); if (!e) return null; const q = e.getBoundingClientRect(); if (!q.width) return null; return {x:q.x + q.width / 2, y:q.y + q.height / 2, w:Math.round(q.width), h:Math.round(q.height)}; }", sel)
        if not r: print('   (fant ikke %s)' % sel); return None
        await tap(r['x'], r['y'], what or sel); return r
    n = [0]
    async def shot(name):
        n[0] += 1; f = os.path.join(OUTD, '%s-%02d-%s.png' % (tag, n[0], name)); await pg.screenshot(path=f); return f
    J = lambda js: pg.evaluate(js)
    print('==', tag, w, 'x', h)
    await boot(pg)
    r = await J(SETUP); print('   setup', r)
    await pg.wait_for_timeout(800); await shot('start')
    # 1. to the Drift app: the phone button, then the app
    await tap_sel('#phoneFab', 'telefonknappen'); await pg.wait_for_timeout(500); await shot('phone')
    r = await tap_text('^Driftsplan$|Driftsplan', 'appen Driftsplan'); await pg.wait_for_timeout(600); await shot('drift-intro')
    print('   body:', await J("document.body.className"), 'drift page open:', await J("!!document.querySelector('[data-pa=\"dr-new\"]')"))
    # 2. a new plan
    await tap_sel('[data-pa="dr-new"]', 'Lag driftsplan'); await pg.wait_for_timeout(500); await shot('drift-fresh')
    o = await J("S.ops && {home:S.ops.home, rig:S.ops.rig, fields:S.ops.fields.length, jigs:S.ops.jigs.length, dep:S.ops.dep, wx:S.ops.wx, rhythm:S.ops.rhythm}"); print('   fresh plan:', o)
    print('   page text (first 700):', (await J("(document.querySelector('.dr-rows') || document.body).parentNode.innerText")).replace('\n', ' | ')[:700])
    async def row(k):
        on = await J("!!document.querySelector('.dr-row.on .dr-rh[data-k=\"%s\"]')" % k)
        if not on: await tap_sel('.dr-rh[data-k="%s"]' % k, 'raden ' + k); await pg.wait_for_timeout(400)
    # 3. the rig: Fiske -> Line
    await row('fish'); await shot('fiske')
    await tap_sel('[data-pa="dr-rig"][data-g="line"]', 'Line'); await pg.wait_for_timeout(400)
    print('   rig:', await J("S.ops.rig + ' jig=' + S.ops.jig"))
    # 4. the places: + Felt -> Velg i kartet -> (open the plotter) -> tap the chart -> Bruk plassen, twice; the soak to 6 h
    for i in (1, 2):
        await row('places')
        if i == 1: await shot('plasser')
        await tap_sel('[data-pa="dr-add"][data-k="F"]', '+ Felt for line'); await pg.wait_for_timeout(400)
        if i == 1: await shot('plasser-add')
        await tap_sel('[data-pa="dr-addp"][data-i="map"]', 'Velg i kartet …'); await pg.wait_for_timeout(900)
        st = await J("({body:document.body.className, plot:document.body.classList.contains('vplot'), ctx:!!DRIFTCTX, toast:[...document.querySelectorAll('.toast, #toast, .tst')].map(e => e.textContent).join(' / ')})")
        print('   after «Velg i kartet»:', st)
        if i == 1: await shot('pick-wait')
        if not st['plot']:
            r = await tap_sel('#miniPlot', 'den lille plotteren'); await pg.wait_for_timeout(1200)
            print('   plot now:', await J("document.body.classList.contains('vplot')"))
            if i == 1: await shot('pick-plot')
        c = await J("(() => { const p = SEA[%d]; view.cx = p.x; view.cy = p.y; if (typeof renderBase === 'function') renderBase(); renderDyn(); const q = mapToClient(p); return {x:q.x, y:q.y}; })()" % i)
        await tap(c['x'], c['y'], 'i kartet (plass %d)' % i); await pg.wait_for_timeout(900)
        print('   draft:', await J("S.draft.length"), 'ctx:', await J("JSON.stringify(DRIFTCTX)"), 'body:', await J("document.body.className"))
        if i == 1: await shot('picked')
        r = await tap_sel('[data-act="driftsave"]', 'Bruk plassen'); await pg.wait_for_timeout(900)
        print('   fields now:', await J("S.ops.fields.map(f => [f.n, f.soak])"), 'body:', await J("document.body.className"))
        if i == 1: await shot('back-after-pick')
        fid = await J("S.ops.fields[%d] && S.ops.fields[%d].id" % (i - 1, i - 1))
        for k in range(2): await tap_sel('[data-pa="dr-fs"][data-d="-1"][data-id="%s"]' % fid, 'ståtid −')
        print('   fields now:', await J("S.ops.fields.map(f => [f.n, f.soak])"))
    # 5. a jig place from the own marks
    await row('places'); await tap_sel('[data-pa="dr-add"][data-k="J"]', '+ Juksplass'); await pg.wait_for_timeout(400); await shot('jig-add')
    await tap_sel('[data-pa="dr-addp"][data-i="0"]', 'Fangstplass (forslag)'); await pg.wait_for_timeout(400)
    print('   jigs:', await J("S.ops.jigs.length"))
    await shot('places-done')
    # 6. rhythm and weather rows
    await row('rhythm'); await shot('rytme')
    await row('wx'); await shot('vaer')
    # 7. start
    r = await tap_sel('[data-pa="dr-start"]', 'Start planen'); await pg.wait_for_timeout(500)
    for k in range(80):
        if await J("S.ops && S.ops.on"): break
        await pg.wait_for_timeout(250)
    print('   on:', await J("S.ops.on"), 'M:', await J("S.ops.M"), 'err:', await J("S.ops.err"))
    await pg.wait_for_timeout(600); await shot('started')
    await J("(() => { const h = [...document.querySelectorAll('h4')].find(e => /Neste tur|Turen nå/.test(e.textContent)); if (h) h.scrollIntoView(); })()"); await pg.wait_for_timeout(400); await shot('next-trip')
    await J("(() => { const h = [...document.querySelectorAll('h4')].find(e => /Siste sju/.test(e.textContent)); if (h) h.scrollIntoView(); })()"); await pg.wait_for_timeout(400); await shot('week')
    print('   taps to a running plan:', taps[0])
    print('   sketch:', await J("(driftSketch(S.ops) || []).map(x => driftClock(driftHod(x.t)) + ' ' + x.no).join(' | ')"))
    print('   check:', await J("JSON.stringify(driftCheck(S.ops))")[:600])
    # 8. Rederi and Mannskap
    await J("PHONE.open('rederi')"); await pg.wait_for_timeout(600); await shot('rederi')
    await J("if (typeof DOCK !== 'undefined') DOCK.open('arbeid'); else PHONE.open('arbeid')"); await pg.wait_for_timeout(600); await shot('mannskap')
    # 9. the stopped state as the player sees it
    await J("(() => { const o = S.ops; o.on = false; o.stop = {t:S.t, k:'fail', no:'Går ikke ut: lina er ikke egnet.', en:'Not going out: the line is not baited.', fix:null}; })()")
    await J("PHONE.open('drift')"); await pg.wait_for_timeout(600); await shot('stopped')
    print('   sidefeil:', errs[:5])
    await ctx.close()

async def main():
    async with async_playwright() as p:
        for (w, h, tag) in [(800, 1280, 'tab-staaende'), (1280, 800, 'tab-liggende'), (384, 853, 'telefon')]:
            if len(sys.argv) > 1 and tag not in sys.argv[1:]: continue
            try: await run(p, w, h, tag)
            except Exception as e: print('   FEIL', tag, repr(e)[:400])
asyncio.run(main())
