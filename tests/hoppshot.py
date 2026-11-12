"""Hopp over resten av ruta in 3D (HO2, steg 105; docs/planer/hopp.md). Jonas 12.11.2026: the fast-forward button «her på skjermen»,
under the camera and the cinema on the right, «kontekstuell og kun komme opp når en rute er i gang». In both formats (800x1280 and
1280x800), on Senja, from the start harbour to a harbour 8-30 km away on an Autonav route, with the Admin app's test switch on:
  1. in port, no button; under way on the route, the button, under the cinema button (same left edge and size, below it)
  2. the card: where to, the time saved and the price with 💎, the test mode said
  3. «Hopp»: the screen dims, the hop is made, she is at the quay at the stop with no land under her, and the screen comes back;
     the time it took (the map at the stop loaded) printed
  4. at the quay, no button; with the switch off, no button on a route either
  5. no page errors
Screenshots: tests/out/hopp-{knapp,nei,kort,etter,kjop}-{staaende,liggende}.png. The spot check along the coast: KYST_HOPP_FRA and
KYST_HOPP_TIL name the harbours, in one format, with nothing loaded along the way (the hop loads the map and the 3D packs at the stop). python3 tests/hoppshot.py (3D). Prints OK or FEIL lines."""
import asyncio, json, os
from _env import boot
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'out'); os.makedirs(OUT, exist_ok=True)
FAIL = []
def check(ok, what, info=None):
    print(('OK ' if ok else 'FEIL ') + what + ('' if info is None else ' ' + json.dumps(info, ensure_ascii=False)[:500]))
    if not ok: FAIL.append(what)

SETUP = """async ([fra, til]) => {
  const b = S.boat, F = n => PORTS.find(p => p.name === n) || PORTS.find(p => p.name.startsWith(n));
  // the spot check along the coast: KYST_HOPP_FRA and KYST_HOPP_TIL name the harbours (no map loaded along the way: the hop loads its own)
  if (fra){ const P0 = F(fra); if (!P0) return {err:'no harbour ' + fra}; await mapNeed(P0.p, 4); b.status = 'port'; b.port = P0.id; b.pos = {x:P0.p.x, y:P0.p.y}; S.plan = null; }
  const A = portById(b.port) || PORTS.find(p => dist(p.p, b.pos) < 1);
  const B = til ? F(til) : PORTS.filter(p => p.id !== A.id && !p.naust && dist(p.p, A.p) > 8 && dist(p.p, A.p) < 30).sort((p, q) => dist(p.p, A.p) - dist(q.p, A.p))[0];
  if (!B) return {err:'no harbour 8-30 km from ' + A.name};
  const r = await leiaRoute({x:A.p.x, y:A.p.y}, {x:B.p.x, y:B.p.y}, A.id, B.id); if (r.why) return {err:r.why[0]};
  window.__H = {A:A.id, B:B.id, wps:r.wps.map(w => Object.assign({}, w))};
  return {A:A.name, B:B.name, nm:+r.nm.toFixed(1)};
}"""
# under way on the route, a few hundred metres out (the button is for a route under way, not a departure waiting)
GO = """(adm) => {
  const b = S.boat, H = window.__H, w0 = H.wps[0];
  S.tut = 0; S.settings.autoOn = false; S.me = S.cur; S.sleep = null; S.energy = 90; WX_FORCE = {w:3, d:180}; if (S.turer) S.turer.act = [];
  S.adm = Object.assign(S.adm || {}, {hopp:!!adm});
  b.status = 'sailing'; b.port = null; b.pos = {x:w0.x, y:w0.y}; b.v = 6; b.anch = null; b.hove = null; b.dmg = null; b.fuel = BOAT.fuelCap;
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
    s = await J(SETUP, [os.environ.get('KYST_HOPP_FRA') or None, os.environ.get('KYST_HOPP_TIL') or None])
    check(not s.get('err'), name + ': en Autonav-rute mellom to havner', s)
    if s.get('err'): await br.close(); return
    await J("() => { S.adm = Object.assign(S.adm || {}, {hopp:true}); if (!G3.isActive()) G3.show(true); }")
    await pg.wait_for_function("G3.isActive()", timeout=120000); await pg.wait_for_timeout(1500)
    r = await J(RECT)
    check(not r['hop']['shown'], name + ': 1a. i havn står ingen spoleknapp', r['hop'])
    await J(GO, True)
    # (the button comes with the next frame's tick; SwiftShader draws a few frames a second)
    try: await pg.wait_for_function("(() => { const e = document.getElementById('hopBtn'); return e && !e.hidden && getComputedStyle(e).display !== 'none'; })()", timeout=60000)
    except Exception as e: print('venter på knappen: ' + str(e)[:120])
    r = await J(RECT); h, k = r['hop'], r['kino']
    check(h['shown'] and h['x'] == k['x'] and h['w'] == k['w'] and h['h'] == k['h'] and h['y'] >= k['y'] + k['h'], name + ': 1b. på ruta står spoleknappen rett under kino-knappen, like stor', r)
    await pg.screenshot(path=os.path.join(OUT, 'hopp-knapp-' + name + '.png'))
    # 1c. the calm (U2-4): after a while untouched the button fades with the camera and the cinema
    # (the fade is 0.6 s; SwiftShader may draw a frame a second, so it waits until the cinema button has come down, at most 8 s)
    cm = await J("() => { document.body.classList.add('calm'); const o = id => +getComputedStyle(document.getElementById(id)).opacity, t0 = performance.now(); return new Promise(r => { const f = () => { if (o('kinoBtn') > 0.25 && performance.now() - t0 < 8000) return setTimeout(f, 200); const out = {hop:o('hopBtn'), kino:o('kinoBtn'), ms:Math.round(performance.now() - t0)}; document.body.classList.remove('calm'); r(out); }; setTimeout(f, 700); }); }")
    check(abs(cm['hop'] - cm['kino']) < 0.05 and cm['hop'] < 0.3, name + ': 1c. i roen dempes spoleknappen som kino-knappen', cm)
    # 2a. a hop that cannot be had: the card says why (the only no on a route under way: the game held by another page, TAB; a leak, the
    # weather or the diesel never refuse it, Jonas 12.11.2026: «Ingenting skal være en hindring for å kjøpe "hopp"»)
    await J("() => { TAB.held = true; }"); await pg.click('#hopBtn')
    await pg.wait_for_function("(() => { const m = document.getElementById('modal'); return !m.hidden && /annet sted/.test(m.innerText); })()", timeout=60000)
    c0 = await J("() => document.getElementById('modal').innerText")
    check('annet sted' in c0 and 'Hopp' not in c0.split('\n')[-1], name + ': 2a. kortet sier hvorfor når hoppet ikke kan gjøres', {'text': c0[:200]})
    await pg.screenshot(path=os.path.join(OUT, 'hopp-nei-' + name + '.png'))
    await J("() => { document.getElementById('modal').hidden = true; TAB.held = false; }")
    await pg.click('#hopBtn')
    await pg.wait_for_function("!!document.getElementById('hopGo')", timeout=60000)
    c = await J("() => { const m = document.getElementById('modal'); return {shown:!m.hidden, text:m.innerText, go:!!document.getElementById('hopGo')}; }")
    check(c['shown'] and c['go'] and '\U0001F48E' in c['text'] and 'Du sparer' in c['text'] and 'Admin' in c['text'], name + ': 2. kortet: målet, tida spart, prisen med 💎 og at admin-hoppet er gratis', {'text': c['text'][:300]})
    await pg.screenshot(path=os.path.join(OUT, 'hopp-kort-' + name + '.png'))
    await pg.click('#hopGo')
    await pg.wait_for_function("!HOPUI.busy", timeout=240000)
    st = await J("() => { const b = S.boat; let land = null; try { land = isLand(b.pos); } catch (e){ land = String(e).slice(0, 80); } return {st:b.status, port:b.port, land, ms:HOPUI.ms, fade:document.getElementById('hopFade').classList.contains('on')}; }")
    check(st['st'] == 'port' and st['port'] == (await J("() => window.__H.B")) and st['land'] is False and not st['fade'], name + ': 3. hoppet: ved kaia i ' + s['B'] + ' uten land under båten, og skjermen er tilbake (' + str(st['ms']) + ' ms med kartet ved målet)', st)
    await pg.wait_for_timeout(3000)
    # (the first frames after a hop draw every pack round the stop; SwiftShader takes minutes over them where a tablet takes seconds)
    await pg.screenshot(path=os.path.join(OUT, 'hopp-etter-' + name + '.png'), timeout=600000)
    r = await J(RECT)
    check(not r['hop']['shown'], name + ': 4a. ved kaia er spoleknappen borte', r['hop'])
    # 4b. the shop closed (shopMode off: no cloud on a public site, or closed for the account, P5): no button, not on a route either
    await J(GO, False); await J("() => { window.__sm = shopMode; shopMode = () => 'off'; }"); await pg.wait_for_timeout(1500)
    r = await J(RECT)
    check(not r['hop']['shown'], name + ': 4b. når butikken er stengt, står ingen spoleknapp, heller ikke på ruta', r['hop'])
    # 4c. the shop selling (here in test mode, as on the test machine): the button, and the card's button is the purchase
    await J("() => { shopMode = window.__sm; }")
    try: await pg.wait_for_function("(() => { const e = document.getElementById('hopBtn'); return e && !e.hidden && getComputedStyle(e).display !== 'none'; })()", timeout=60000)
    except Exception: pass
    await pg.click('#hopBtn'); await pg.wait_for_function("!!document.getElementById('hopGo')", timeout=60000)
    c4 = await J("() => ({lab:document.getElementById('hopGo').textContent, mode:shopMode()})")
    await J("() => { document.getElementById('modal').hidden = true; }")
    check(c4['mode'] == 'test' and c4['lab'] == 'Kjøp (test, ingen betaling)', name + ': 4c. der butikken selger, står knappen uten testbryteren, og kortets knapp er kjøpet', c4)
    # 4d. (HO3) the card as the players see it where the shop is live: «Kjøp · 💎 N kr» and the line under it
    # (shopMode stubbed to live: no payment is started, «Kjøp» is not pressed)
    await J("() => { window.__sm = shopMode; shopMode = () => 'live'; }")
    await pg.click('#hopBtn'); await pg.wait_for_function("!!document.getElementById('hopGo')", timeout=60000)
    c5 = await J("() => { const m = document.getElementById('modal'); return {lab:document.getElementById('hopGo').textContent, fine:!!m.querySelector('.shop-fine'), text:m.innerText, kr:hopQuote().kr}; }")
    await pg.screenshot(path=os.path.join(OUT, 'hopp-kjop-' + name + '.png'))
    await J("() => { document.getElementById('modal').hidden = true; }")
    check(c5['lab'] == 'Kjøp · 💎 %d kr' % c5['kr'] and c5['fine'] and 'angreretten' in c5['text'], name + ': 4d. der butikken er åpen: «Kjøp · 💎 %d kr» og linja om levering og angrerett' % c5['kr'], {'lab': c5['lab'], 'fine': c5['fine']})
    # 4e. (Jonas 12.11.2026: «Når brukeren trykker på hopp-knappen stopper båten momentant som om den var fryst i tiden») the button stops
    # the boat at once and she lies still while the card is open; «Avbryt» lets her go and she sails on
    await pg.click('#hopBtn'); p0 = await J("() => JSON.stringify([S.boat.pos, S.plan.idx])")
    await pg.wait_for_function("!!document.getElementById('hopGo')", timeout=60000); await pg.wait_for_timeout(2500)
    e1 = await J("(p0) => ({hold:!!S.boat.hopHold, v:S.boat.v, still:JSON.stringify([S.boat.pos, S.plan.idx]) === p0, text:document.getElementById('modal').innerText})", p0)
    await pg.click('#modal [data-close]'); await pg.wait_for_timeout(2500)
    e2 = await J("(p0) => ({hold:!!S.boat.hopHold, moved:JSON.stringify([S.boat.pos, S.plan.idx]) !== p0})", p0)
    await J("() => { shopMode = window.__sm; }")
    check(e1['hold'] and e1['v'] == 0 and e1['still'] and 'ligger stille' in e1['text'] and not e2['hold'] and e2['moved'],
          name + ': 4e. spoleknappen stopper båten med en gang, og hun ligger stille mens kortet er åpent; «Avbryt» slipper henne, og hun seiler videre', {'open': {k: e1[k] for k in ('hold', 'v', 'still')}, 'after': e2})
    check(not errs, name + ': 5. ingen sidefeil', errs[:3])
    await br.close()

async def main():
    async with async_playwright() as p:
        # (the spot check along the coast: one format is enough, the button and the card are the same)
        if not os.environ.get('KYST_HOPP_FRA'): await one(p, 'staaende', 800, 1280)
        await one(p, 'liggende' + ('-' + os.environ['KYST_HOPP_FRA'] if os.environ.get('KYST_HOPP_FRA') else ''), 1280, 800)
    print('FEIL: ' + str(len(FAIL)) if FAIL else 'Alle OK')

asyncio.run(main())
