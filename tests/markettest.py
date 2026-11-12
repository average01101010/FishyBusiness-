"""Kystmegleren and the yard after B (docs/planer/etter-tonys-test.md, 07.11.2026): the broker lists only boats players sell (the NPC
listings of M4 are gone), so without other players' boats the page is empty and says the yard sells new ones at full price (B5, B6); the
yard's Båthandel says the same and sells every type new as before; the moment a boat is bought (M5) is unchanged; Rederi puts a boat out
for sale and has her delivered by the yard's skipper; an old save's commission listing (M4) is withdrawn with a line in the log. The sales
between players themselves are megletest's. Pictures in both formats (megler_*.png, kjop_*.png). Prints OK or FEIL.
Steg 28 (12.11.2026): on the boat you are on, the moment paints her name onto the hull letter by letter and hoists her ensign in the 3D
model while the camera turns round her, and the card keeps the type, the year and the quay (G3.buying, BUYM.in3d). That part opens its
own page with 3D (also under KYST_LITE: run.py has markettest in DRAWS3D, so it runs alone), kjop3d_*.png in both formats."""
from _env import boot, GAME_TUT
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:400]) if extra != '' else ''))


FIT = """(() => { const d = document.querySelector('%s'); if (!d) return ['none']; const r = d.getBoundingClientRect();
  return [...d.querySelectorAll('*')].filter(e => { const q = e.getBoundingClientRect(); return q.width && q.right > r.right + 1 && !e.closest('svg'); }).map(e => e.tagName + '.' + e.className).slice(0, 5); })()"""


BM = """(() => { const e = document.getElementById('buyMoment'); if (!e) return null; const n = e.querySelector('.bm-name'), sub = (e.querySelector('.bm-sub') || {}).textContent || '';
  return {name:n ? n.getAttribute('aria-label') : null, letters:e.querySelectorAll('.bm-name span').length, flag:!!e.querySelector('.bm-flag svg'), skip:!!e.querySelector('.bm-skip'),
    drawer:document.getElementById('drawer').hidden, in3d:BUYM.in3d, label:e.getAttribute('aria-label'), sub:/ · \\d{4}/.test(sub) && sub.indexOf(VESSELS[S.boat.type].name.no) === 0 ? sub : ''}; })()"""


async def shot(pg, path):
    try: await pg.screenshot(path=path, timeout=300000)
    except Exception as e: print('skjermbildet %s kom ikke: %s' % (path, str(e)[:80]))


async def until(pg, cond, ms):
    try: await pg.wait_for_function(cond, timeout=ms); return True
    except Exception: return False


async def moment3d(br, errs):
    """the moment on the boat you are on, in 3D: the name on the hull letter by letter, the ensign up its pole, the camera round her"""
    for fmt, vp in (('liggende', {'width': 1280, 'height': 800}), ('staaende', {'width': 800, 'height': 1280})):
        pg = await br.new_page(viewport=vp); pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME_TUT + '#notut')
        await pg.evaluate("(() => { S.boat.status = 'port'; S.unnamed = false; S.boatName = 'Havbris'; WX_FORCE = {w:3, d:250}; S.mult = 0; S.t = Math.round((Date.UTC(2027, 5, 12, 12) - EPOCH) / 6e4); G3.show(true); })()")
        await until(pg, "G3.isActive()", 60000); await pg.wait_for_timeout(3000)
        # (the card's own 15 s are held off here, and the moment's clock is held by G3.buyFix: SwiftShader takes seconds over a frame, and
        # a screenshot longer; the 15 s and «Hopp over» on time are checked without 3D above)
        # lying down a real purchase: a new snekke at the yard in Finnsnes with the old boat traded in (the moment comes from switchVessel);
        # standing up the moment alone (BUYM.show(), as switchVessel calls it)
        await pg.evaluate("(() => { const st = window.setTimeout; window.__st = st; window.setTimeout = (f, ms, ...r) => ms === BUYM.DUR ? 0 : st(f, ms, ...r); })()")
        if fmt == 'liggende':
            await pg.evaluate("""(() => { S.cash = 2e6; S.sales = S.sales.length >= 3 ? S.sales : [{}, {}, {}]; renderActs(); DOCK.open('fartoy'); const dr = document.getElementById('drawerBody'), tap = s => { const e = dr.querySelector(s); if (e) e.click(); };
              tap('[data-pa=mksel]:not([data-k])'); tap('[data-pa=mktab][data-s=open]'); tap('[data-pa=mksel][data-k=snekke]'); tap('[data-pa=buy][data-ti="1"][data-k=snekke]'); })()""")
            await until(pg, "BUYM.on", 30000)
        else:
            await pg.evaluate("BUYM.show()")
        await pg.evaluate("window.setTimeout = window.__st"); await pg.wait_for_timeout(200)
        if fmt == 'liggende':
            bt = await pg.evaluate("({type:S.boat.type, name:S.boatName})")
            check(bt['type'] == 'snekke' and bt['name'] == 'Havbris', '3D: båten er kjøpt ved verftet med den gamle i bytte, og hun heter fortsatt Havbris', bt)
        a = await pg.evaluate("({card:document.getElementById('buyMoment') ? true : false, in3d:BUYM.in3d, painting:G3.painting, b:G3.buying})")
        bm = await pg.evaluate(BM)
        check(a['in3d'] and a['painting'] and a['b'] is not None and bm and not bm['letters'] and not bm['flag'] and bm['sub'] and 'ved kaia i' in bm['sub'],
              '3D, %s: kjøpsøyeblikket på båten du er om bord i tegner i modellen, kameraet går rundt henne, og kortet har typen, året og kaia' % fmt, [a, bm])
        # half-way through the name (its clock held there, and two frames drawn): some letters on, not all; the flag still down the pole
        n = a['b']['len'] if a['b'] else 8
        async def at(s):
            await pg.evaluate("G3.buyFix(%f)" % s); f0 = await pg.evaluate("G3.buying ? G3.buying.frame : 0")
            await until(pg, "G3.buying && G3.buying.frame >= %d" % (f0 + 2), 60000); return await pg.evaluate("G3.buying")
        m = await at(0.6 + 0.22 * n * 0.5)
        await shot(pg, 'kjop3d_navn_%s.png' % fmt)
        check(bool(m) and 0 < m['drawn'] < m['len'] and m['fy'] is not None and m['fy'] < -0.5,
              '3D, %s: navnet males på skroget bokstav for bokstav (%s av %s), flagget nede på stanga' % (fmt, m and round(m['drawn'], 1), m and m['len']), m)
        # the name on, and the flag at the top of its pole
        e = await at(0.6 + 0.22 * n + 0.4 + 3.2)
        await shot(pg, 'kjop3d_flagg_%s.png' % fmt)
        check(bool(e) and e['drawn'] == e['len'] and e['fy'] == 0, '3D, %s: hele navnet står på skroget, og flagget er oppe' % fmt, e)
        await pg.evaluate("(() => { const b = document.querySelector('#buyMoment .bm-skip'); if (b) b.click(); })()"); await pg.wait_for_timeout(200)
        z = await pg.evaluate("({card:!!document.getElementById('buyMoment'), b:G3.buying, painting:G3.painting})")
        check(not z['card'] and z['b'] is None and not z['painting'], '3D, %s: «Hopp over» lukker med en gang og gir kameraet tilbake' % fmt, z)
        await pg.close()


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch()
        pg = await br.new_page(viewport={'width': 1280, 'height': 800}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        await pg.evaluate("(() => { S.cash = 300000; S.mkt = null; S.boat.status = 'port'; renderActs(); })()")
        # the Net app: the broker's tile, then the empty page (no NPC listings)
        await pg.evaluate("PHONE.show(true); PHONE.open('nett')"); await pg.wait_for_timeout(300)
        tile = await pg.evaluate("(document.querySelector('#phone .net-tile[data-s=megler]') || {}).innerText || ''")
        check('Kystmegleren' in tile and 'spillerne' in tile, 'Nettet har Kystmegleren som bokmerke, for båter spillerne selger til hverandre', tile)
        await pg.evaluate("document.querySelector('#phone .net-tile[data-s=megler]').click()"); await pg.wait_for_timeout(300)
        em = await pg.evaluate("(() => { const t = document.querySelector('#phone .ph-c').textContent; return {cards:document.querySelectorAll('#phone .mg-card').length, empty:/Ingen båter til salgs nå\\./.test(t), yard:/Verftet selger nye til full pris\\./.test(t), npc:typeof mktListings + '/' + typeof mktMake}; })()")
        check(em['cards'] == 0 and em['empty'] and em['yard'] and em['npc'] == 'undefined/undefined', 'Kystmegleren har ingen NPC-oppføringer: tom side som sier at verftet selger nye til full pris', em)
        await pg.screenshot(path='megler_liste_liggende.png')
        fit = await pg.evaluate(FIT % '#phone')
        await pg.set_viewport_size({'width': 800, 'height': 1280}); await pg.wait_for_timeout(400)
        await pg.screenshot(path='megler_liste_staaende.png')
        fit2 = await pg.evaluate(FIT % '#phone')
        check(not fit and not fit2, 'ingenting stikker ut av telefonen, liggende og stående', [fit, fit2])
        await pg.set_viewport_size({'width': 1280, 'height': 800})
        await pg.evaluate("PHONE.show(false)")

        # the yard: «Båter til salgs her» empty, and a new boat at full price with the old one traded in
        await pg.evaluate("(() => { S.cash = 2e6; S.sales = S.sales.length >= 3 ? S.sales : [{}, {}, {}]; renderActs(); DOCK.open('fartoy'); })()"); await pg.wait_for_timeout(400)
        hr = await pg.evaluate("(() => { const c = document.querySelector('#drawerBody .mg-here'); return c ? {cards:c.querySelectorAll('.mg-card').length, txt:c.textContent} : null; })()")
        check(hr is not None and hr['cards'] == 0 and 'full pris' in hr['txt'], 'verftets Båthandel: ingen brukte båter ved kaia, og verftet selger nye til full pris', hr)
        await pg.screenshot(path='megler_verft_liggende.png')
        b0 = await pg.evaluate("({type:S.boat.type, cash:S.cash, n:S.fleet.length})")
        await pg.evaluate("""(() => { const dr = document.getElementById('drawerBody'), tap = s => { const e = dr.querySelector(s); if (e) e.click(); }; tap('[data-pa=mksel]:not([data-k])'); tap('[data-pa=mktab][data-s=open]'); tap('[data-pa=mksel][data-k=snekke]'); })()""")
        await pg.wait_for_timeout(300)
        btn = await pg.evaluate("(() => { const b = document.querySelector('#drawerBody [data-pa=buy][data-ti=\"1\"][data-k=snekke]'); return b ? !b.disabled : null; })()")
        await pg.evaluate("document.querySelector('#drawerBody [data-pa=buy][data-ti=\"1\"][data-k=snekke]').click()"); await pg.wait_for_timeout(400)
        af = await pg.evaluate("({type:S.boat.type, paid:%d - S.cash, n:S.fleet.length, price:VESSELS.snekke.price, ti:vesselValue(curVessel())})" % b0['cash'])
        check(btn and af['type'] == 'snekke' and af['n'] == b0['n'] and af['paid'] > 0, 'verftet selger nytt til full pris, med den gamle båten i bytte', [btn, af])
        # the moment (M5): the name painted on, the flag, the camera round her, and «Hopp over»
        await pg.wait_for_timeout(400)
        bm = await pg.evaluate(BM)
        nm0 = await pg.evaluate("S.boatName")
        # (with the 3D view up the name and the flag are in the model, the 3D part below; without it the card has them, as before)
        check(bm and bm['skip'] and bm['drawer'] and bm['sub'] and (bm['name'] == nm0 and bm['letters'] == len(nm0) and bm['flag'] if not bm['in3d'] else not bm['letters'] and nm0 in bm['label']),
              'kjøpsøyeblikket: navnet males bokstav for bokstav, flagget, typen, året og kaia, skuffen lukket', bm)
        await pg.wait_for_timeout(5500); await pg.screenshot(path='kjop_liggende.png')
        await pg.set_viewport_size({'width': 800, 'height': 1280}); await pg.wait_for_timeout(600); await pg.screenshot(path='kjop_staaende.png')
        fitm = await pg.evaluate(FIT % '#buyMoment')
        await pg.set_viewport_size({'width': 1280, 'height': 800})
        await pg.evaluate("document.querySelector('#buyMoment .bm-skip').click()"); await pg.wait_for_timeout(200)
        check(not fitm and await pg.evaluate("!document.getElementById('buyMoment')"), '«Hopp over» lukker det med en gang, og ingenting stikker ut stående', fitm)
        await pg.evaluate("BUYM.show()"); await pg.wait_for_timeout(15600)
        check(await pg.evaluate("!document.getElementById('buyMoment')"), 'kjøpsøyeblikket lukker seg selv etter 15 sekunder')
        # a boat bought for the fleet (not the one you are on): the card as before, the name and the flag on it, nothing in 3D
        fl = await pg.evaluate("""(() => { const v = newVesselObj('skiff', S.boat.port); BUYM.show(v); const e = document.getElementById('buyMoment');
          const r = {in3d:BUYM.in3d, letters:e.querySelectorAll('.bm-name span').length, name:vget(v, 'boatName'), flag:!!e.querySelector('.bm-flag svg'), b:typeof G3 !== 'undefined' ? G3.buying : null};
          BUYM.close(true); return r; })()""")
        check(not fl['in3d'] and fl['letters'] == len(fl['name']) and fl['flag'] and not fl['b'], 'et kjøp til flåten viser kortet som før: navnet bokstav for bokstav og flagget på kortet', fl)

        # your other boat in Rederi: «Legg ut til salgs» and delivery to where you are
        r = await pg.evaluate("""(() => { const yard = PORTS.find(p => portServices(p).verft && p.id !== S.boat.port && dist(p.p, S.boat.pos) / NM < 150 && dist(p.p, S.boat.pos) / NM > 10);
          const v = newVesselObj('skiff', yard.id); vget(v, 'boat').status = 'port'; S.cash = 2e6; window._v = v.id; PHONE.show(true); PHONE.open('rederi'); const q = s => document.querySelector('#phone ' + s);
          const btn = {put:!!q('[data-pa=mbput][data-id=' + v.id + ']'), quick:!!q('[data-pa=vsell][data-id=' + v.id + ']'), del:[...document.querySelectorAll('#phone [data-pa=mgdel][data-id=' + v.id + ']')].map(b => b.dataset.to)};
          const c0 = S.cash; q('[data-pa=mgdel][data-id=' + v.id + '][data-to=' + S.boat.port + ']').click();
          return {btn, del:(mktState().del || []).length, paid:c0 - S.cash, home:S.boat.port}; })()""")
        check(r['btn']['put'] and r['btn']['quick'] and r['home'] in r['btn']['del'] and r['del'] == 1 and r['paid'] > 0,
              'Rederi har «Legg ut til salgs» og «Selg nå» for den andre båten, og leverer henne dit du er', r)
        await pg.screenshot(path='megler_rederi_liggende.png')
        d = await pg.evaluate("(() => { const D = mktState().del[0]; S.t = Math.ceil(D.H1) * 60; mktHour(S.t / 60); return {port:vget(vesselById(window._v), 'boat').port, me:S.boat.port}; })()")
        check(d['port'] == d['me'], 'når seilingstida er gått, ligger hun der du er', d)
        # an old save's commission listing (M4: sold to an NPC within 1–3 weeks) is withdrawn, with a line in the log
        ow = await pg.evaluate("(() => { mktState().own = [{vid:window._v, H0:0, H1:1e9, kr:50000}]; mktHour(S.t / 60); return {own:mktState().own.length, log:S.log[S.log.length - 1].no}; })()")
        check(ow['own'] == 0 and 'trukket fra salg' in ow['log'], 'en gammel kommisjonsoppføring trekkes, og loggen sier det', ow)
        await pg.set_viewport_size({'width': 800, 'height': 1280}); await pg.evaluate("PHONE.open('rederi')"); await pg.wait_for_timeout(300)
        await pg.screenshot(path='megler_rederi_staaende.png')
        fit4 = await pg.evaluate(FIT % '#phone')
        check(not fit4, 'Rederi-appen får plass stående', fit4)
        await br.close()
        b3 = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        await moment3d(b3, errs)
        print('sidefeil', errs)
        await b3.close()

asyncio.run(main())
