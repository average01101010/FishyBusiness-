"""Less noise on the chart (docs/planer/kart-etiketter.md, E1 and E2, 02.11.2026): in the build with the vec packs (dist-vec), at Hammerfest
(Jonas' picture: Rypefjord), Bergen and Tromsø, zoomed in as far as the harbour names show, in landscape and portrait: no two names
on the chart overlap (the text's boxes as drawn, over the static and the AIS layer, the players' names left out as they may stand
over), the fishing boats in port carry no name, and a tap on an icon whose name was left out shows the name for a moment.
Screenshots in tests/out/etikett-<place>-<format>.png."""
import os, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('KYST_DIST', os.path.join(ROOT, 'dist-vec'))
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright

def check(ok, what, extra=''):
    print(('OK   ' if ok else 'FEIL ') + what, ('' if extra == '' else ' ' + json.dumps(extra, ensure_ascii=False, default=str)[:500]))

PLACES = [('hammerfest', 70.6235, 23.665), ('bergen', 60.398, 5.318), ('tromso', 69.649, 18.96)]
GO = """async ([la, lo]) => { const c = P(la, lo); let q = null;
  for (let r = 0; r <= 60 && !q; r++) for (let a = 0; a < Math.max(1, r * 6); a++){ const t = a / Math.max(1, r * 6) * 2 * Math.PI, p = {x:c.x + Math.cos(t) * r * 0.05, y:c.y + Math.sin(t) * r * 0.05}; if (!isLandFar(p)){ q = p; break; } }
  await mapNeed(q, MAPD.simR); const b = S.boat; b.status = 'idle'; b.port = null; b.pos = {x:q.x, y:q.y}; S.plan = null; S.draft = []; b.v = 0;
  S.t = Math.round((Date.UTC(2027, 1, 15, 12) - EPOCH) / 6e4); WX_FORCE = {w:5, d:200}; COASTM.k = ''; HAV.k = '';
  if (typeof G3 !== 'undefined' && G3.show) G3.show(false); view.cx = c.x; view.cy = c.y; view.z = MAP_H / 3; applyView(); scheduleStatic(); return q; }"""
# the names drawn: every text of a label class with its box on the screen
BOXES = """(() => { const out = []; for (const e of document.querySelectorAll('#map text')){ const c = e.getAttribute('class') || ''; if (!/lbl-/.test(c) || /lbl-depth/.test(c)) continue;
  const r = e.getBoundingClientRect(); if (r.width < 1 || r.right < 0 || r.bottom < 0 || r.left > innerWidth || r.top > innerHeight) continue; out.push({c, t:e.textContent, b:[r.left, r.top, r.right, r.bottom]}); } return out; })()"""

async def main():
    if not os.path.exists(os.path.join(ROOT, 'tools', 'map', 'out', 'game', 'manifest.json')):
        check(False, 'hele kysten i tools/map/out/game'); return
    if os.environ.get('KYST_VEC_BUILT'): check(True, 'dist-vec/ bygd av run.py før testene')
    else:
        r = subprocess.run(['node', 'build.mjs'], cwd=ROOT, env=dict(os.environ, KYST_VEC='1', KYST_DIST=os.path.join(ROOT, 'dist-vec')), capture_output=True, text=True)
        check(r.returncode == 0, 'dist-vec/ bygges med vec-pakkene', r.stderr[-200:])
    os.makedirs(os.path.join(ROOT, 'tests', 'out'), exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-gpu-compositing']); errs = []
        for fmt, vw in (('liggende', (1280, 800)), ('staaende', (800, 1280))):
            pg = await (await b.new_context(viewport={'width': vw[0], 'height': vw[1]})).new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
            await boot(pg)
            for name, la, lo in PLACES:
                await pg.evaluate(GO, [la, lo])
                try: await pg.wait_for_function("(() => { COASTM.k = ''; npcStates(S.t / 60); const b = S.boat.pos; return mapPacksIn('vec', b.x - 6, b.y - 6, b.x + 6, b.y + 6).every(pk => VEC.tiles.has(pk.tile[0] + ':' + pk.tile[1])); })()", timeout=120000)
                except Exception: pass
                await pg.wait_for_timeout(2500)
                await pg.evaluate("(() => { scheduleStatic(); renderStatic(); renderDyn(); })()")
                await pg.wait_for_timeout(500)
                L = await pg.evaluate(BOXES)
                ov = []
                for i in range(len(L)):
                    for j in range(i + 1, len(L)):
                        a, c = L[i]['b'], L[j]['b']
                        if 'pl' in L[i]['c'].split() or 'pl' in L[j]['c'].split(): continue
                        # (2 px of slack: the boxes are the glyphs' with their outline)
                        if a[0] < c[2] - 2 and a[2] > c[0] + 2 and a[1] < c[3] - 2 and a[3] > c[1] + 2: ov.append((L[i]['t'], L[j]['t']))
                port = await pg.evaluate("(() => { const out = new Set(AISNOW.filter(n => n.st !== 'port' || n.player).map(n => n.name)), names = new Set(AISNOW.filter(n => (n.coast || n.fleet || n.hav) && n.st === 'port' && AISSEL !== n.id && !out.has(n.name)).map(n => n.name)); return {inPort:names.size, named:[...document.querySelectorAll('.lbl-ais')].filter(e => names.has(e.textContent)).length}; })()")
                await pg.screenshot(path=os.path.join(ROOT, 'tests', 'out', f'etikett-{name}-{fmt}.png'))
                check(len(L) >= 5 and not ov, f'{name} ({fmt}): ingen navn i kartet overlapper hverandre', {'navn': len(L), 'overlapp': ov[:4]})
                check(port['named'] == 0, f'{name} ({fmt}): fiskebåtene i havn står uten navn', port)
                if name == 'hammerfest':
                    tp = await pg.evaluate("""(() => { const q = LBLHID[0]; if (!q) return {none:true}; const before = S.draft.length; tapName({x:q.x, y:q.y}, 0.05); renderDyn();
                      const el = document.querySelector('.lbl-tapname'); return {hid:LBLHID.length, n:q.n, shown:el ? el.textContent : null}; })()""")
                    check(tp.get('shown') == tp.get('n') and tp.get('n'), f'hammerfest ({fmt}): et trykk på et ikon uten navn viser navnet', tp)
                    await pg.wait_for_timeout(2800); await pg.evaluate("renderDyn()")
                    gone = await pg.evaluate("!document.querySelector('.lbl-tapname')")
                    check(gone, f'hammerfest ({fmt}): navnet forsvinner igjen etter et par sekunder')
            await pg.close()
        check(not errs, 'ingen sidefeil', errs[:3])
        await b.close()

asyncio.run(main())
