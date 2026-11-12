"""Hopp over resten av ruta in 3D (HO2, steg 105; docs/planer/hopp.md). Jonas 12.11.2026: the fast-forward button «her på skjermen»,
under the camera and the cinema on the right, «kontekstuell og kun komme opp når en rute er i gang». In both formats (800x1280 and
1280x800), on Senja, from the start harbour to a harbour 8-30 km away on an Autonav route, with the Admin app's test switch on:
  1. in port, no button; under way on the route, the button, under the cinema button (same left edge and size, below it)
  2. the card: where to, the time saved and the price with 💎, the test mode said
  3. «Hopp»: the screen dims, the hop is made, she is at the quay at the stop with no land under her, and the screen comes back;
     the time it took (the map at the stop loaded) printed
  4. at the quay, no button; with the switch off, no button on a route either
  5. no page errors
Screenshots: tests/out/hopp-{knapp,kort,etter}-{staaende,liggende}.png. python3 tests/hoppshot.py (3D). Prints OK or FEIL lines."""
import asyncio, json, os
from _env import boot
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'out'); os.makedirs(OUT, exist_ok=True)
FAIL = []
def check(ok, what, info=None):
    print(('OK ' if ok else 'FEIL ') + what + ('' if info is None else ' ' + json.dumps(info, ensure_ascii=False)[:500]))
    if not ok: FAIL.append(what)

SETUP = """async () => {
  const b = S.boat, A = portById(b.port) || PORTS.find(p => dist(p.p, b.pos) < 1);
  const B = PORTS.filter(p => p.id !== A.id && !p.naust && dist(p.p, A.p) > 8 && dist(p.p, A.p) < 30).sort((p, q) => dist(p.p, A.p) - dist(q.p, A.p))[0];
  if (!B) return {err:'no harbour 8-30 km from ' + A.name};
  const r = await leiaRoute({x:A.p.x, y:A.p.y}, {x:B.p.x, y:B.p.y}, A.id, B.id); if (r.why) return {err:r.why[0]};
  window.__H = {A:A.id, B:B.id, wps:r.wps.map(w => Object.assign({}, w))};
  return {A:A.name, B:B.name, nm:+r.nm.toFixed(1)};
}"""
# under way on the route, a few hundred metres out (the button is for a route under way, not a departure waiting)
GO = """(adm) => {
  const b = S.boat, H = window.__H, w0 = H.wps[0];
  S.tut = 0; S.settings.autoOn = false; S.me = S.cur; S.sleep = null; S.energy = 90; WX_FORCE = null; if (S.turer) S.turer.act = [];
  S.adm = Object.assign(S.adm || {}, {hopp:!!adm});
  b.status = 'sailing'; b.port = null; b.pos = {x:w0.x, y:w0.y}; b.v = 6; b.anch = null; b.hove = null; b.fuel = BOAT.tank || 200;
  S.plan = {wps:H.wps.slice(1).map(w => Object.assign({}, w)), idx:0, speed:BOAT.vcruise || BOAT.vmax * 0.8, returning:false, depAt:null, unsafe:H.wps.slice(1).map(() => false)};
  S.plan.wps[S.plan.wps.length - 1].port = H.B;
  return {st:b.status};
}"""
RECT = """() => { const r = id => { const e = document.getElementById(id); if (!e) return null; const q = e.getBoundingClientRect(), cs = getComputedStyle(e);
  return {x:Math.round(q.left), y:Math.round(q.top), w:Math.round(q.width), h:Math.round(q.height), shown:!e.hidden && cs.display !== 'none' && cs.visibility !== 'hidden' && q.width > 0}; };
  return {cam:r('camBtn'), kino:r('kinoBtn'), hop:r('hopBtn')}; }"""

async def one(p, name, vw, vh):
    br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    pg = await br.new_page(viewport={'width': vw, 'height': vh})
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    await boot(pg)
    await pg.wait_for_function("typeof SIMREADY !== 'undefined' && SIMREADY && S.boat.status === 'port'", timeout=120000)
    J = lambda js, *a: pg.evaluate(js, *a)
    s = await J(SETUP)
    check(not s.get('err'), name + ': en Autonav-rute mellom to havner på Senja', s)
    if s.get('err'): await br.close(); return
    await J("() => { S.adm = Object.assign(S.adm || {}, {hopp:true}); if (!G3.isActive()) G3.show(true); }")
    await pg.wait_for_function("G3.isActive()", timeout=120000); await pg.wait_for_timeout(1500)
    r = await J(RECT)
    check(not r['hop']['shown'], name + ': 1a. i havn står ingen spoleknapp', r['hop'])
    await J(GO, True); await pg.wait_for_timeout(2500)
    r = await J(RECT); h, k = r['hop'], r['kino']
    check(h['shown'] and h['x'] == k['x'] and h['w'] == k['w'] and h['h'] == k['h'] and h['y'] >= k['y'] + k['h'], name + ': 1b. på ruta står spoleknappen rett under kino-knappen, like stor', r)
    await pg.screenshot(path=os.path.join(OUT, 'hopp-knapp-' + name + '.png'))
    await pg.click('#hopBtn'); await pg.wait_for_timeout(600)
    c = await J("() => { const m = document.getElementById('modal'); return {shown:!m.hidden, text:m.innerText, go:!!document.getElementById('hopGo')}; }")
    check(c['shown'] and c['go'] and '\U0001F48E' in c['text'] and 'Du sparer' in c['text'] and 'Testmodus' in c['text'], name + ': 2. kortet: målet, tida spart, prisen med 💎 og testmodus', {'text': c['text'][:300]})
    await pg.screenshot(path=os.path.join(OUT, 'hopp-kort-' + name + '.png'))
    await pg.click('#hopGo')
    await pg.wait_for_function("!HOPUI.busy", timeout=120000)
    st = await J("() => { const b = S.boat; let land = null; try { land = isLand(b.pos); } catch (e){ land = String(e).slice(0, 80); } return {st:b.status, port:b.port, land, ms:HOPUI.ms, fade:document.getElementById('hopFade').classList.contains('on')}; }")
    check(st['st'] == 'port' and st['port'] == (await J("() => window.__H.B")) and st['land'] is False and not st['fade'], name + ': 3. hoppet: ved kaia i ' + s['B'] + ' uten land under båten, og skjermen er tilbake (' + str(st['ms']) + ' ms med kartet ved målet)', st)
    await pg.wait_for_timeout(3000)
    await pg.screenshot(path=os.path.join(OUT, 'hopp-etter-' + name + '.png'))
    r = await J(RECT)
    check(not r['hop']['shown'], name + ': 4a. ved kaia er spoleknappen borte', r['hop'])
    await J(GO, False); await pg.wait_for_timeout(1500)
    r = await J(RECT)
    check(not r['hop']['shown'], name + ': 4b. med testbryteren av står ingen spoleknapp, heller ikke på ruta', r['hop'])
    check(not errs, name + ': 5. ingen sidefeil', errs[:3])
    await br.close()

async def main():
    async with async_playwright() as p:
        await one(p, 'staaende', 800, 1280)
        await one(p, 'liggende', 1280, 800)
    print('FEIL: ' + str(len(FAIL)) if FAIL else 'Alle OK')

asyncio.run(main())
