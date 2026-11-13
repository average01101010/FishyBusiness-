"""The status box, the strip and the little chart (05.10.2026, ui/04-panels-instruments.js hudFold; Jonas: «Spillere skal kunne trykke
minimer på disse, som gjør slik at bare basisinformasjonen vises på en tynn stripe… Legg også inn muligheten for fjerning av HUD i
innstillingene»; UI 2, U2-1, docs/planer/ui-2-staaende.md 4.1–4.2, 06.11.2026: upright the strip is the normal state). On a phone upright:
the strip has three lines and a fixed height, no fold button, the same height in harbour, idle and under way, and the little chart stands
still above it, as wide as the strip (Jonas 06.11.2026, B); a tap on the strip gives the whole box as a card over the chart, with the whole table, and a tap outside or on the card closes it; the
chart folds to a strip with speed, course and position, and opens again; «Skjul HUD» in the settings takes them all away, and it is kept
after a reload. On a tablet on its side: the whole box with a fixed width and no fold button (Jonas 07.11.2026: «Du har ikke fjernet dette
minustegnet»), the gauges a 44 px target; a tap on the box folds it
to the three-line strip under the little chart, which stands at the top as upright (Jonas 07.11.2026: «jeg sa at kartet alltid skulle
være den øverste boksen»), and the chart folded lifts the box up under its GPS strip; the strip has no «+» (Jonas 07.11.2026: «Fjern plusstegnet fra den øverste
statusboksen slik at den fungerer bare ved å trykke på stripa»), and a tap on it opens the whole box again, not the card; the chart's «+»
stands at the far left of its strip; the hold's icon on the strip is a fish, not Om bord's box (Jonas: «gjør ikonet som står for last i
statusboksen om til en fisk»); the chart's top is the same in harbour and under way. UI 2, U2-8 (08.11.2026), in the five sizes of uishots and 412×915: the plotter's
drawer upright starts under the strip, the box on its side has no empty reserve, the map's credit is clear of the deck log's tab, the
tab's word is whole, and the phone button hides behind the open phone. Prints OK or FEIL."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:400]) if extra != '' else ''))


BOX = """(() => { const r = s => { const e = document.querySelector(s); if (!e) return null; const q = e.getBoundingClientRect(), cs = getComputedStyle(e);
  return cs.display === 'none' || !q.width ? null : {h:Math.round(q.height), w:Math.round(q.width), top:Math.round(q.top), left:Math.round(q.left)}; };
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
    # 1. on its side the whole box stands, with a fixed width, no «–» (Jonas 07.11.2026) and the gauges as a 44 px target
    check(a['hud'] and 'hudstrip' not in a['cls'] and '.hnow' in a['lines'] and not a['hmin'] and '–' not in a['text'] and a['gauges'] and a['gauges']['h'] >= 44,
          'on its side the whole box stands, without «–», and the gauges as a 44 px target', {'hud': a['hud'], 'minus': a['hmin'], 'gauges': a['gauges']})
    # 2. the box is as wide, and the chart stands still, in harbour, idle and under way
    T = await tops(pg)
    ws = {k: v['hud']['w'] for k, v in T.items()}; ps = {k: v['plot']['top'] for k, v in T.items()}
    check(a['plot'] and a['plot']['top'] <= 12 and all(v['hud']['top'] == a['plot']['top'] + a['plot']['h'] + 6 for v in T.values()), 'on its side too the little chart stands at the top and the box right under it (Jonas 07.11.2026)', {'chart': a['plot'], 'box top': {k: v['hud']['top'] for k, v in T.items()}})
    check(len(set(ws.values())) == 1 and len(set(ps.values())) == 1, 'the box keeps its width and the little chart its place in harbour, idle and under way', {'width': ws, 'chart top': ps, 'height': {k: v['hud']['h'] for k, v in T.items()}})
    # 3. a tap on the box (its head, the date and the money) folds it to the three-line strip, with no «+» on it (Jonas 07.11.2026); a tap
    # on the strip opens the whole box again (not the card, which is the upright strip's)
    await pg.click('#hud .hd'); await pg.wait_for_timeout(400); b = await pg.evaluate(BOX)
    check(b['hud'] and 40 <= b['hud']['h'] <= 70 and 'hudstrip' in b['cls'] and 'hudmin' in b['cls'] and not b['hmin'] and '+' not in b['text'] and all(c in b['lines'] for c in ('.hs1', '.hs2', '.st.nx')) and b['plot']['top'] == a['plot']['top'] and b['hud']['top'] == a['hud']['top'],
          'a tap on the box folds it to the three-line strip without «+», where it stood under the chart, and the chart stays', {'strip': b['hud'], 'plus': b['hmin'], 'plot': b['plot'], 'lines': b['lines'], 'cls': b['cls']})
    # the hold's icon on the strip is a fish, not the box that is Om bord's button (Jonas 07.11.2026)
    ic = await pg.evaluate("(() => { const h = document.querySelector('#hud .g-hold svg'), o = document.querySelector('#dock [data-dk=beh] svg'); return {hold:h ? h.innerHTML : null, beh:o ? o.innerHTML : null, fish:!!(h && h.querySelector('[data-fish]'))}; })()")
    check(ic['hold'] and ic['beh'] and ic['hold'] != ic['beh'] and ic['fish'], 'the hold on the strip has the fish for its icon, not Om bord\'s box', {'fisk': ic['fish'], 'som Om bord': ic['hold'] == ic['beh']})
    await pg.click('#hud .hs2'); await pg.wait_for_timeout(400); c = await pg.evaluate(BOX)
    check(c['hud']['h'] == a['hud']['h'] and 'hudmin' not in c['cls'] and 'hudcard' not in c['cls'] and c['plot']['top'] == a['plot']['top'], 'and opens again with a tap on the strip (not the card), the chart back in its place', {'hud': c['hud'], 'plot': c['plot'], 'cls': c['cls']})
    # the chart folded: its «+» stands at the far left of its strip, as on the phone
    try: await pg.click('#plotMin', timeout=8000)
    except Exception as e: print('     (#plotMin kunne ikke trykkes: ' + str(e).split('\n')[0][:120] + ')')
    await pg.wait_for_timeout(400); d = await pg.evaluate(BOX)
    check('plotmin' in d['cls'] and d['gps'] and d['hud'] and d['gps']['top'] == a['plot']['top'] and d['hud']['top'] == d['gps']['top'] + d['gps']['h'] + 6, 'the chart folded: its GPS strip at the top, and the box up under it', {'gps': d['gps'], 'hud': d['hud']})
    check('plotmin' in d['cls'] and d['fold'] and d['gps'] and d['fold']['left'] <= d['gps']['left'] + 4 and '+' in (await pg.evaluate("document.getElementById('plotMin').textContent")), 'the chart folds to its strip with «+» at the far left (its 44 px target from the strip\'s left edge)', {'pluss': d['fold'], 'stripe': d['gps']})
    try: await pg.click('#plotMin', timeout=8000)
    except Exception: pass
    await pg.wait_for_timeout(300)
    await pg.screenshot(path='hud_box_landscape.png')
    print('errors (tablet):', errs[:3]); await ctx.close(); await br.close()


# a phone on its side (Jonas 07.11.2026: «Telefon liggende må jo ha minikartet på samme måte som stående, nettbrett og pc … Og det skal være
# likt i alle formater. Kart øverst, statusboksen under uten pluss og minus»): before, no little chart at all there, and the chart's «–»
# stood alone under the box. Now as the phone upright: the chart on top, the strip under it without «+» or «–», a tap gives the card
async def phone_side(p):
    br = await p.chromium.launch(args=['--disable-gpu-compositing'])
    for W, H in ((844, 390), (780, 360)):
        ctx = await br.new_context(viewport={'width': W, 'height': H}, has_touch=True, is_mobile=True); pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + '#notut'); await pg.wait_for_timeout(800)
        await pg.evaluate("(() => { if (!document.body.classList.contains('v3d') && typeof G3 !== 'undefined') G3.show(true); S.settings.hudMin = false; S.settings.plotMin = false; S.boat.status = 'idle'; S.boat.port = null; renderHud(); })()"); await pg.wait_for_timeout(800)
        a = await pg.evaluate(BOX)
        tag = '%dx%d' % (W, H)
        check(a['plot'] and a['plot']['top'] <= 12 and a['plot']['h'] >= 80 and a['hud'] and a['hud']['top'] == a['plot']['top'] + a['plot']['h'] + 6,
              tag + ': on its side the phone has the little chart at the top and the status box right under it', {'chart': a['plot'], 'hud': a['hud']})
        check('hudstrip' in a['cls'] and not a['hmin'] and '+' not in a['text'] and '–' not in a['text'] and a['hud']['top'] + a['hud']['h'] < H - 90,
              tag + ': the box is the strip without «+» or «–», clear of the button row', {'hud': a['hud'], 'cls': a['cls'], 'knapp': a['hmin']})
        # at sea the old GPS box (speed, course, position) is not there besides the chart's foot (it stood over the deck log's tab)
        await pg.evaluate("(() => { S.boat.status = 'idle'; S.boat.port = null; renderHud(); })()"); await pg.wait_for_timeout(1200); g = await pg.evaluate(BOX)
        check(not g['gps'] and g['plot'], tag + ': at sea no GPS box beside the little chart (its foot says the same)', {'gps': g['gps']})
        await pg.click('#hud .hs2'); await pg.wait_for_timeout(400); b = await pg.evaluate(BOX)
        check('hudcard' in b['cls'] and b['plot']['top'] == a['plot']['top'], tag + ': a tap on the strip gives the whole box as a card, and the chart stays', {'cls': b['cls'], 'chart': b['plot']})
        await pg.mouse.click(W - 200, H // 2); await pg.wait_for_timeout(400)
        await pg.click('#plotMin'); await pg.wait_for_timeout(400); c = await pg.evaluate(BOX)
        check('plotmin' in c['cls'] and c['gps'] and c['gps']['top'] <= 12 and c['hud']['top'] == c['gps']['top'] + c['gps']['h'] + 6, tag + ': the chart folded: its GPS strip at the top and the strip under it', {'gps': c['gps'], 'hud': c['hud']})
        await pg.click('#plotMin'); await pg.wait_for_timeout(300)
        await pg.screenshot(path='hud_phone_side_%s.png' % tag)
        print('errors (phone on its side %s):' % tag, errs[:3]); await ctx.close()
    await br.close()


# UI 2, U2-8 (docs/planer/ui-2-staaende.md kap. 5, V1 A: the tablet and the PC inherit the phone upright, decided with pictures in
# uishots' five sizes, 08.11.2026): the drawer in the chart plotter upright starts under the strip (the sheet from 12 % covered its
# lowest 13 px on a phone); the whole box on its side has no empty reserve under its lines (196 px kept the chart still when the box
# stood on top of it, until 07.11.2026); the map's credit line is clear of the deck log's tab; the tab's word is whole on a phone on its
# side; and the phone button hides behind the open phone (its corner showed at the phone's rounded corner on a tablet and a PC)
U28 = """(() => { const r = s => { const e = document.querySelector(s); if (!e || !e.getClientRects().length) return null; const cs = getComputedStyle(e);
  if (cs.display === 'none' || cs.visibility === 'hidden') return null; const q = e.getBoundingClientRect(); return {l:Math.round(q.left), t:Math.round(q.top), r:Math.round(q.right), b:Math.round(q.bottom)}; };
  const h = document.getElementById('hud'); let m = 0; for (const c of h.children){ const q = c.getBoundingClientRect(); if (q.height) m = Math.max(m, q.bottom); }
  const tab = document.querySelector('#logbook .lbk-tab');
  return {hud:r('#hud'), empty:Math.round(h.getBoundingClientRect().bottom - m), attr:r('.attr'), book:r('#logbook'), fab:r('#phoneFab'), drawer:r('#drawer'),
    tabCut:tab ? tab.scrollHeight - tab.clientHeight : 0, cls:['v3d', 'vplot', 'hudstrip', 'dk-open'].filter(c => document.body.classList.contains(c))}; })()"""


async def u28(p):
    br = await p.chromium.launch(args=['--disable-gpu-compositing'])
    for W, H, touch in ((390, 844, True), (412, 915, True), (844, 390, True), (800, 1280, True), (1280, 800, True), (1440, 900, False)):
        ctx = await br.new_context(viewport={'width': W, 'height': H}, has_touch=touch, is_mobile=touch and W < 900); pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + '#notut'); await pg.wait_for_timeout(800)
        await pg.evaluate("(() => { if (!document.body.classList.contains('v3d') && typeof G3 !== 'undefined') G3.show(true); S.settings.hudMin = false; S.settings.plotMin = false; S.boat.status = 'idle'; S.boat.port = null; renderHud(); })()"); await pg.wait_for_timeout(800)
        tag = '%dx%d' % (W, H); a = await pg.evaluate(U28)
        check(a['attr'] and a['book'] and a['attr']['l'] >= a['book']['r'], tag + ': the map\'s credit line begins right of the deck log\'s tab, not under it', {'attr': a['attr'], 'tab': a['book']})
        check(a['tabCut'] <= 1, tag + ': the deck log\'s tab shows its whole word', {'cut px': a['tabCut']})
        if W > H and H > 520:
            check(a['empty'] <= 16, tag + ': the whole box on its side has no empty reserve under its last line', {'empty px': a['empty'], 'hud': a['hud']})
        await pg.evaluate("(() => { setBodyView(true); PHONE.show(true, 'home'); })()"); await pg.wait_for_timeout(900); f = await pg.evaluate(U28)
        check(not f['fab'], tag + ': the phone button is not shown while the phone is open', {'fab': f['fab']})
        await pg.evaluate("PHONE.show(false)"); await pg.wait_for_timeout(500); g = await pg.evaluate(U28)
        check(g['fab'], tag + ': and back when the phone is closed', {'fab': g['fab']})
        if H > W:
            await pg.evaluate("(() => { setBodyView(false); refreshAll(); })()"); await pg.wait_for_timeout(700); s0 = await pg.evaluate(U28)
            await pg.evaluate("DOCK.open('beholdning')"); await pg.wait_for_timeout(700); d = await pg.evaluate(U28)
            check(d['drawer'] and d['hud'] and s0['hud'] and d['hud'] == s0['hud'] and d['drawer']['t'] >= d['hud']['b'], tag + ': in the chart plotter upright the drawer\'s sheet starts under the strip', {'sheet top': d['drawer'] and d['drawer']['t'], 'strip': d['hud']})
            await pg.screenshot(path='hud_u28_plotskuff_%s.png' % tag)
            await pg.evaluate("DOCK.close()")
        print('errors (U2-8 %s):' % tag, errs[:3]); await ctx.close()
    await br.close()


# D6 (designombyggingen, 13.11.2026): the HUD is the same in both formats. A tablet upright has the whole box in 3D, with the gauges and
# «Regler ✓» at sea, as a tablet on its side (they stood only behind a tap on the strip); the strip stands over the drawer's sheet and
# in the plotter as before; a phone upright keeps the strip. «Kart» beside the little chart opens the plotter (the chart itself was the
# only way, and had to be known). The little chart has one palette: at noon its sea is the dark chart's, not the light one
D6 = """(() => { const r = s => { const e = document.querySelector(s); if (!e || !e.getClientRects().length) return null; const cs = getComputedStyle(e);
  if (cs.display === 'none' || cs.visibility === 'hidden') return null; const q = e.getBoundingClientRect(); return {l:Math.round(q.left), t:Math.round(q.top), r:Math.round(q.right), b:Math.round(q.bottom), w:Math.round(q.width), h:Math.round(q.height)}; };
  const h = document.getElementById('hud'), po = document.getElementById('plotOpen');
  return {hud:r('#hud'), plot:r('#miniPlot'), open:r('#plotOpen'), openTx:po ? po.textContent.trim() : null, gauges:!!h.querySelector('.gauges'), g:h.querySelectorAll('.gauges .g').length, rules:(h.querySelector('.rlink') || {}).textContent || '',
    cls:['v3d', 'vplot', 'hudstrip', 'hudcard', 'dk-open'].filter(c => document.body.classList.contains(c))}; })()"""
SEA = "(() => { if (!document.body.classList.contains('v3d') && typeof G3 !== 'undefined') G3.show(true); S.settings.hudMin = false; S.settings.plotMin = false; S.plan = null; S.boat.status = 'idle'; S.boat.port = null; renderHud(); if (typeof renderGPS === 'function') renderGPS(); })()"


async def d6(p):
    br = await p.chromium.launch(args=['--disable-gpu-compositing']); box = {}
    for W, H in ((800, 1280), (1280, 800), (390, 844)):
        ctx = await br.new_context(viewport={'width': W, 'height': H}, has_touch=True, is_mobile=W < 900); pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + '#notut'); await pg.wait_for_timeout(800)
        await pg.evaluate(SEA); await pg.wait_for_timeout(800); tag = 'D6 %dx%d' % (W, H); a = await pg.evaluate(D6); box[tag] = a
        if W >= 800:
            check('hudstrip' not in a['cls'] and a['gauges'] and a['g'] == 4 and ('Regler' in a['rules'] or 'Rules' in a['rules']), tag + ': the whole box at sea, the four gauges and the rules row', {'cls': a['cls'], 'gauges': a['g'], 'rules': a['rules']})
        else:
            check('hudstrip' in a['cls'] and not a['gauges'], tag + ': a phone upright keeps the strip', a['cls'])
        check(a['open'] and a['open']['h'] >= 36 and a['openTx'] in ('Kart', 'Chart') and a['plot'] and a['open']['l'] >= a['plot']['r'] and a['open']['r'] <= W - 56, tag + ': «Kart» stands beside the little chart, clear of the camera buttons', {'open': a['open'], 'tx': a['openTx'], 'plot': a['plot']})
        if H > W and W >= 800:
            await pg.evaluate("DOCK.open('beholdning')"); await pg.wait_for_timeout(600); d = await pg.evaluate(D6)
            check('hudstrip' in d['cls'] and d['hud'] and d['hud']['h'] <= 70 and not d['open'], tag + ': over the drawer\'s sheet the box is the strip, and «Kart» is gone with the chart', {'cls': d['cls'], 'hud': d['hud'], 'open': d['open']})
            await pg.evaluate("DOCK.close()"); await pg.wait_for_timeout(500); e = await pg.evaluate(D6)
            check('hudstrip' not in e['cls'] and e['gauges'], tag + ': and the whole box again when the sheet closes', e['cls'])
        # the little chart when the sun is highest (the day's chart was the light one): its sea is dark (one palette)
        await pg.evaluate("(() => { let best = S.t, el = -99; for (let m = 0; m < 1440; m += 20){ const e = sunAt((S.t + m) / 60, S.boat.pos).el; if (e > el){ el = e; best = S.t + m; } } S.t = best; if (S.settings) S.settings.chartNight = 'auto'; const g = GROUNDS[0].p; S.boat.pos = {x:g.x, y:g.y}; MINIP.key = ''; miniPaint(); })()"); await pg.wait_for_timeout(2500)
        lum = await pg.evaluate("(() => { miniPaint(); const c = document.getElementById('miniPlot'), g = c.getContext('2d'), d = g.getImageData(0, 0, c.width, Math.round(c.height * 0.6)).data; let s = 0, n = 0; for (let i = 0; i < d.length; i += 16){ s += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; n++; } return Math.round(s / n); })()")
        check(lum < 140, tag + ': the little chart is the dark chart at noon too (mean lightness of its upper part with the fish colours on it, 0–255; the light chart is over 200)', lum)
        if a['open']:
            await pg.click('#plotOpen'); await pg.wait_for_timeout(700); f = await pg.evaluate(D6)
            check('vplot' in f['cls'] and not f['open'], tag + ': a tap on «Kart» opens the plotter, and the button is not shown there', f['cls'])
        print('errors (%s):' % tag, errs[:3]); await ctx.close()
    u, l = box.get('D6 800x1280'), box.get('D6 1280x800')
    check(u and l and u['hud'] and l['hud'] and u['g'] == l['g'] == 4 and u['rules'] == l['rules'] and u['rules'], 'D6: the box upright and on its side says the same (the gauges and the rules row; upright it is 250 px wide as the little chart, so the compass line keeps its degrees)', {'upright': u and u['hud'], 'side': l and l['hud']})
    await br.close()


async def main():
    async with async_playwright() as p:
        await phone(p)
        await tablet(p)
        await phone_side(p)
        await u28(p)
        await d6(p)

asyncio.run(main())
