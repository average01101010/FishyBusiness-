"""The status box, the strip and the little chart (05.10.2026, ui/04-panels-instruments.js hudFold; Jonas: «Spillere skal kunne trykke
minimer på disse, som gjør slik at bare basisinformasjonen vises på en tynn stripe… Legg også inn muligheten for fjerning av HUD i
innstillingene»; UI 2, U2-1, docs/planer/ui-2-staaende.md 4.1–4.2, 06.11.2026: upright the strip is the normal state). On a phone upright:
the strip has three lines and a fixed height, no fold button, the same height in harbour, idle and under way, and the little chart stands
still above it, as wide as the strip (Jonas 06.11.2026, B); a tap on the strip gives the whole box as a card over the chart, with the whole table, and a tap outside or on the card closes it; the
chart folds to a strip with speed, course and position, and opens again; «Skjul HUD» in the settings takes them all away, and it is kept
after a reload. On a tablet on its side: the whole box with a fixed width and a 44 px fold button, the gauges a 44 px target; «–» folds it
to the three-line strip with «+», and the chart moves up under it; the chart's top is the same in harbour and under way. Prints OK or FEIL."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:400]) if extra != '' else ''))


BOX = """(() => { const r = s => { const e = document.querySelector(s); if (!e) return null; const q = e.getBoundingClientRect(), cs = getComputedStyle(e);
  return cs.display === 'none' || !q.width ? null : {h:Math.round(q.height), w:Math.round(q.width), top:Math.round(q.top)}; };
  return {hud:r('#hud'), plot:r('#miniPlot'), gps:r('#gps3d'), compass:r('#compass3d'), fold:r('#plotMin'), hmin:r('#hud .hmin'), gauges:r('#hud .gauges'), text:document.getElementById('hud').textContent, gtext:document.getElementById('gps3d').textContent,
    lines:['.hs1', '.hs2', '.st.nx', '.hfull', '.hnow'].filter(c => document.querySelector('#hud ' + c)), cls:['hudmin', 'plotmin', 'hudoff', 'hudstrip', 'hudcard'].filter(c => document.body.classList.contains(c))}; })()"""
# the boat in harbour, idle at sea and under way (the next event and the «now» rows change the box's content between them)
STATES = {'havn': "(() => { S.plan = null; S.boat.status = 'port'; S.boat.port = S.boat.port || S.home || HOME0; renderHud(); })()",
          'stille': "(() => { S.plan = null; S.boat.status = 'idle'; S.boat.port = null; renderHud(); })()",
          'underveis': "(() => { const p = portById('botnhamn').p; S.plan = {wps:[{x:p.x, y:p.y, port:'botnhamn'}], idx:0, speed:6}; S.boat.status = 'sailing'; S.boat.v = 6; renderHud(); })()"}


async def tops(pg):
    out = {}
    for k, js in STATES.items():
        await pg.evaluate(js); await pg.wait_for_timeout(300); m = await pg.evaluate(BOX); out[k] = {'hud': m['hud'], 'plot': m['plot'], 'nx': ('.st.nx' in m['lines'])}
    await pg.evaluate(STATES['stille']); await pg.wait_for_timeout(300)
    return out


async def phone(p):
    br = await p.chromium.launch(args=['--disable-gpu-compositing'])
    ctx = await br.new_context(viewport={'width': 412, 'height': 860}, device_scale_factor=2, has_touch=True); pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    await boot(pg, GAME + '#notut'); await pg.wait_for_timeout(800)
    await pg.evaluate("(() => { if (!document.body.classList.contains('v3d') && typeof G3 !== 'undefined') G3.show(true); S.boat.status = 'idle'; S.boat.port = null; renderHud(); })()"); await pg.wait_for_timeout(800)
    a = await pg.evaluate(BOX)
    # 0. on a phone upright the compass line runs along the top (a canvas between left and right had shrunk to 60 px, iPhone 05.10.2026)
    check(a['compass'] and a['compass']['w'] >= 412 - 80 and a['compass']['top'] < 20, 'on a phone upright the compass line spans the top of the screen', a['compass'])
    # 1. upright the strip is the normal state: three lines, a fixed height, no fold button, the time, the state and the money
    check(a['hud'] and 40 <= a['hud']['h'] <= 70 and 'hudstrip' in a['cls'] and not a['hmin'] and all(c in a['lines'] for c in ('.hs1', '.hs2', '.st.nx')) and ':' in a['text'] and 'kr' in a['text'],
          'upright the status box is the strip: three lines, a fixed height, no fold button, with the time, the state and the money', {'hud': a['hud'], 'lines': a['lines'], 'cls': a['cls'], 'text': a['text'][:80]})
    # 1b. the chart on top and the strip under it, as wide as the chart (Jonas 06.11.2026, B: «symmetri og harmoni med kartplotteren»)
    check(a['plot'] and a['plot']['top'] < a['hud']['top'] and a['plot']['w'] == a['hud']['w'] and a['hud']['top'] >= a['plot']['top'] + a['plot']['h'], 'the little chart stands at the top and the strip right under it, both as wide', {'plot': a['plot'], 'hud': a['hud']})
    # 2. the same height in harbour, idle and under way, and the little chart stands still above it
    T = await tops(pg)
    hs = {k: v['hud']['h'] for k, v in T.items()}; ps = {k: v['plot']['top'] for k, v in T.items()}
    check(len(set(hs.values())) == 1 and len(set(ps.values())) == 1 and all(v['nx'] for v in T.values()), 'the strip is as high in harbour, idle and under way, the third line stands in all of them, and the little chart does not move', {'strip': hs, 'chart top': ps})
    # 3. a tap on the strip gives the whole box as a card over the chart, with the whole table; the chart stays where it is; a tap outside closes it
    await pg.tap('#hud'); await pg.wait_for_timeout(500); c = await pg.evaluate(BOX)
    check('hudcard' in c['cls'] and c['hud']['h'] > a['hud']['h'] * 2 and c['hud']['w'] > a['hud']['w'] and '.hfull' in c['lines'] and c['plot']['top'] == a['plot']['top'] and c['gauges'] and c['gauges']['h'] >= 44,
          'a tap on the strip opens the whole box as a card over the chart, with the whole table, and the chart does not move', {'card': c['hud'], 'strip': a['hud'], 'lines': c['lines'], 'plot': c['plot'], 'gauges': c['gauges']})
    await pg.touchscreen.tap(380, 600); await pg.wait_for_timeout(400); d = await pg.evaluate(BOX)
    check('hudstrip' in d['cls'] and 'hudcard' not in d['cls'] and d['hud']['h'] == a['hud']['h'], 'a tap outside closes the card, and the strip is as before', {'hud': d['hud'], 'cls': d['cls']})
    await pg.tap('#hud'); await pg.wait_for_timeout(500); await pg.tap('#hud .hfull'); await pg.wait_for_timeout(400); d2 = await pg.evaluate(BOX)
    check('hudstrip' in d2['cls'] and 'hudcard' not in d2['cls'], 'a tap on the card itself closes it too (the first trip points at the chart under it)', d2['cls'])
    # 4. the little chart folds to a strip with speed, course and position, at the chart's place, and opens again; the fold button is a 44 px target
    check(d['fold'] and d['fold']['w'] >= 44 and d['fold']['h'] >= 44, 'the chart\'s fold button is a 44 px target', d['fold'])
    await pg.click('#plotMin'); await pg.wait_for_timeout(600); e = await pg.evaluate(BOX)
    check(a['plot'] and not e['plot'] and e['gps'] and e['gps']['h'] < 40 and e['gps']['top'] == a['plot']['top'] and 'kn' in e['gtext'] and '°' in e['gtext'] and 'plotmin' in e['cls'],
          'the little chart folds to a strip with speed, course and position, where the chart stood', {'plot': a['plot'], 'gps': e['gps'], 'text': e['gtext'][:80]})
    check(e['hud'] and e['hud']['top'] < a['hud']['top'] and e['hud']['top'] >= e['gps']['top'] + e['gps']['h'], 'and the strip moves up under the GPS strip', {'hud': e['hud'], 'gps': e['gps']})
    await pg.click('#plotMin'); await pg.wait_for_timeout(600); f = await pg.evaluate(BOX)
    check(f['plot'] and f['plot']['top'] == a['plot']['top'] and f['hud']['top'] == a['hud']['top'] and 'plotmin' not in f['cls'], 'and opens again at the same place, the strip back under it', {'plot': f['plot'], 'hud': f['hud']})
    await pg.click('#plotMin'); await pg.wait_for_timeout(300)
    # 5. «Skjul HUD» in the settings takes them all away, and it is kept after a reload
    await pg.evaluate("(() => { PHONE.open('innst'); document.querySelector('#phone [data-pa=hudShow][data-v=\"0\"]').click(); PHONE.show(false); })()"); await pg.wait_for_timeout(500)
    g = await pg.evaluate(BOX)
    check(not g['hud'] and not g['plot'] and not g['gps'] and not g['compass'] and not g['fold'] and 'hudoff' in g['cls'], '«Skjul HUD» takes away the status box, the little chart, the GPS strip and the compass', g['cls'])
    await pg.evaluate("save()"); await pg.reload(); await pg.wait_for_function("typeof S !== 'undefined' && !!S.boat", timeout=90000); await pg.wait_for_timeout(1500)
    h = await pg.evaluate("({off:!!S.settings.hudOff, plotMin:!!S.settings.plotMin, cls:['hudoff', 'plotmin'].filter(c => document.body.classList.contains(c))})")
    check(h['off'] and h['plotMin'] and h['cls'] == ['hudoff', 'plotmin'], 'the choices are kept after a reload', h)
    await pg.evaluate("(() => { PHONE.open('innst'); document.querySelector('#phone [data-pa=hudShow][data-v=\"1\"]').click(); PHONE.show(false); renderHud(); })()"); await pg.wait_for_timeout(500)
    i = await pg.evaluate(BOX)
    check(i['hud'] and 'hudoff' not in i['cls'] and 'hudstrip' in i['cls'], '«Vis HUD» brings them back, the strip as before', i['cls'])
    await pg.screenshot(path='hud_strips.png')
    print('errors (phone):', errs[:3]); await ctx.close(); await br.close()


async def tablet(p):
    br = await p.chromium.launch(args=['--disable-gpu-compositing'])
    ctx = await br.new_context(viewport={'width': 1280, 'height': 800}, device_scale_factor=2, has_touch=True); pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    await boot(pg, GAME + '#notut'); await pg.wait_for_timeout(800)
    await pg.evaluate("(() => { if (!document.body.classList.contains('v3d') && typeof G3 !== 'undefined') G3.show(true); S.settings.hudMin = false; S.settings.plotMin = false; S.boat.status = 'idle'; S.boat.port = null; renderHud(); })()"); await pg.wait_for_timeout(800)
    a = await pg.evaluate(BOX)
    # 1. on its side the whole box stands, with a fixed width, the fold button and the gauges as 44 px targets
    check(a['hud'] and 'hudstrip' not in a['cls'] and '.hnow' in a['lines'] and a['hmin'] and a['hmin']['w'] >= 44 and a['hmin']['h'] >= 44 and a['gauges'] and a['gauges']['h'] >= 44,
          'on its side the whole box stands, with the fold button and the gauges as 44 px targets', {'hud': a['hud'], 'hmin': a['hmin'], 'gauges': a['gauges']})
    # 2. the box is as wide, and the chart stands still, in harbour, idle and under way
    T = await tops(pg)
    ws = {k: v['hud']['w'] for k, v in T.items()}; ps = {k: v['plot']['top'] for k, v in T.items()}
    check(len(set(ws.values())) == 1 and len(set(ps.values())) == 1, 'the box keeps its width and the little chart its place in harbour, idle and under way', {'width': ws, 'chart top': ps, 'height': {k: v['hud']['h'] for k, v in T.items()}})
    # 3. «–» folds it to the three-line strip with «+», and the chart moves up under it; «+» opens it again
    await pg.click('#hud .hmin'); await pg.wait_for_timeout(400); b = await pg.evaluate(BOX)
    check(b['hud'] and 40 <= b['hud']['h'] <= 70 and 'hudstrip' in b['cls'] and 'hudmin' in b['cls'] and b['hmin'] and '+' in b['text'] and all(c in b['lines'] for c in ('.hs1', '.hs2', '.st.nx')) and b['plot']['top'] < a['plot']['top'] and b['plot']['top'] == b['hud']['top'] + b['hud']['h'] + 6,
          'the box folds to the three-line strip with «+», and the chart moves up under it', {'strip': b['hud'], 'plot': b['plot'], 'lines': b['lines'], 'cls': b['cls']})
    await pg.click('#hud .hmin'); await pg.wait_for_timeout(400); c = await pg.evaluate(BOX)
    check(c['hud']['h'] == a['hud']['h'] and 'hudmin' not in c['cls'] and c['plot']['top'] == a['plot']['top'], 'and opens again with «+», the chart back in its place', {'hud': c['hud'], 'plot': c['plot']})
    await pg.screenshot(path='hud_box_landscape.png')
    print('errors (tablet):', errs[:3]); await ctx.close(); await br.close()


async def main():
    async with async_playwright() as p:
        await phone(p)
        await tablet(p)

asyncio.run(main())
