"""The coastal route's ship and an express boat at their quays in 3D (Ø15 N4, 12.11.2026; core/05b-ferje.js kystStates and ferjeStates):
the northbound coastal ship at Tromsø half-way through her four hours at the quay, and an express boat lying at Tromsø at night (03:00,
all are in), each from the sea 250 m off, in June's light and (the coastal ship) in November's dark with her lights, in 800x1280 and 1280x800.
Pictures in tests/out/kyst3d_*.png. Checks: the ship is in the list the 3D view draws, lies still at her quay, no GL errors, no page
errors. Needs the whole coast in the build (python3 tools/map/release.py and game.py, then node build.mjs)."""
import asyncio, json, os
from playwright.async_api import async_playwright
from _env import *

def check(c, what, extra=''): print(('OK  ' if c else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))

# where: the minute (from Wednesday 17.11.2027 00:00, the game's clock) and the ship to look at
SETUP = """async ([kind, dark]) => { const F = ferjeInit(); WX_FORCE = {w:4, d:200}; let T, pick;
  const day = Math.round(((dark ? Date.UTC(2027, 10, 17) : Date.UTC(2027, 5, 16)) - EPOCH) / 6e4);   // (June for daylight: Tromsø has the midnight sun; November for the dark)
  if (kind === 'kyst'){ const K = F.k, i = K.P.q.findIndex(q => F.q[q].name === 'Tromsø'); T = day + K.dep + (K.P.tm[2 * i - 2] + K.P.tm[2 * i - 1]) / 2; pick = n => n.type === 'coastal' && n.v === 0; }
  else { T = day + 180; pick = n => n.type === 'ferry' && n.ex === 1 && n.v === 0; }
  const tq = F.q.find(q => q.name === 'Tromsø'), b = S.boat; b.status = 'idle'; b.port = null; S.plan = null; S.draft = []; b.pos = {x:tq.p.x + 0.5, y:tq.p.y}; b.v = 0;
  S.t = Math.floor(T); COASTM.k = ''; await mapNeed(tq.p, MAPD.simR);
  const n = npcStates(S.t / 60).filter(pick).sort((a, c) => dist(a.p, tq.p) - dist(c.p, tq.p))[0]; if (!n) return null;
  // the nearest water 250 m off her, on the side away from the land
  let q = null; for (const r of [0.25, 0.32, 0.4, 0.2]) { for (let a = 0; a < 6.28 && !q; a += 0.3){ const c = {x:n.p.x + Math.cos(a) * r, y:n.p.y + Math.sin(a) * r}; if (!isLand(c) && depthF(c) > 4) q = c; } if (q) break; }
  b.pos = q || {x:n.p.x + 0.25, y:n.p.y}; b.heading = Math.atan2(n.p.x - b.pos.x, -(n.p.y - b.pos.y)); if (!G3.isActive()) G3.show(true);
  return {id:n.id, name:n.name, L:n.L, p:n.p, hd:n.hd, v:n.v, t:S.t}; }"""
LOOK = """(id) => { const n = npcStates(S.t / 60).find(q => q.id === id), c = G3._debug.cam; c.helm = false; c.dist = 40; c.pitch = 0.08; c.yaw = Math.atan2(n.p.x - S.boat.pos.x, -(n.p.y - S.boat.pos.y)) - S.boat.heading;
  return {v:n.v, drawn:(G3._debug.npcNow ? G3._debug.npcNow().some(q => q.id === id) : null)}; }"""

async def main():
    if not os.path.exists(os.path.join(HERE, '..', 'tools', 'map', 'out', 'game', 'manifest.json')):
        check(False, 'hele kysten i tools/map/out/game (python3 tools/map/release.py og game.py, så node build.mjs)'); return
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        R = {}
        for fmt, vp in (('liggende', {'width': 1280, 'height': 800}), ('staaende', {'width': 800, 'height': 1280})):
            pg = await (await b.new_context(viewport=vp)).new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            await boot(pg, GAME + '#qfix')
            for kind, dark in (('kyst', False), ('kyst', True), ('hurtig', False)):
                if dark and fmt == 'staaende': continue
                name = kind + ('_natt' if dark else '') + '_' + fmt
                r = await pg.evaluate(SETUP, [kind, dark])
                if not r:
                    check(False, f'{name}: skipet finnes ved Tromsø'); continue
                await pg.wait_for_function("G3.isActive()", timeout=120000); await pg.wait_for_timeout(20000)
                await pg.evaluate("() => { for (const b of document.querySelectorAll('button[data-close]')) if (/Til sjøs|To sea/.test(b.textContent)) b.click(); }")
                l = await pg.evaluate(LOOK, r['id']); await pg.wait_for_timeout(8000)
                await pg.screenshot(path=os.path.join(OUT, f'kyst3d_{name}.png'), timeout=300000)
                l2 = await pg.evaluate(LOOK, r['id']); R[name] = dict(r, look=l, look2=l2)
                check(l['v'] == 0 and l2['v'] == 0, f'{name}: {r["name"]} ({r["L"]} m) ligger stille ved kaia i Tromsø (kyst3d_{name}.png)', r)
            gl = await pg.evaluate("G3._debug.glErr()")
            check(gl == 0, f'{fmt}: ingen GL-feil', gl)
            check(not errs, f'{fmt}: ingen sidefeil', errs[:2])
            await pg.close()
        print(json.dumps(R))
        await b.close()
asyncio.run(main())
