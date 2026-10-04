"""The NPC traffic along the coast (part 5 of the coast-wide plan, 03.10.2026: tools/map/npc.py in the vec packs, core/05-vessels.js
coastState and coastNear): it builds dist-vec/ itself with the vec packs (KYST_VEC=1) and needs the whole coast in tools/map/out/game
(tools/map/release.py, then game.py) from kart-6 on. Off Tromsø the coast's boats show only within AIS range of the boat you follow,
lie at their berths at night, are out and fishing in the day and home in the evening, are where the clock says (the same twice),
lie at faces that take them, keep their routes off the land (a few corners of the 25 m mask aside), have no harbour in Senja's square
(FLEET is its fleet), take no fish from the stock, and have an AIS card and a track. Prints OK or FEIL."""
import os, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.environ['KYST_DIST'] = os.path.join(ROOT, 'dist-vec')
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


AT = "(h) => { S.t = Math.round((Date.UTC(2027, 5, 15, h) - EPOCH) / 6e4); WX_FORCE = {w:5, d:200}; COASTM.k = ''; }"
STATES = """(() => { const H = S.t / 60, a = npcStates(H).filter(n => n.coast), st = {};
  for (const n of a) st[n.st] = (st[n.st] || 0) + 1; return {n:a.length, st, far:+Math.max(0, ...a.map(n => dist(n.p, S.boat.pos))).toFixed(2)}; })()"""


async def main():
    if not os.path.exists(os.path.join(ROOT, 'tools', 'map', 'out', 'game', 'manifest.json')):
        check(False, 'hele kysten i tools/map/out/game (python3 tools/map/release.py og game.py)'); return
    env = dict(os.environ, KYST_VEC='1', KYST_DIST=os.path.join(ROOT, 'dist-vec'))
    r = subprocess.run(['node', 'build.mjs'], cwd=ROOT, env=env, capture_output=True, text=True)
    check(r.returncode == 0, 'dist-vec/ bygges med vec-pakkene', r.stderr[-200:])
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await (await b.new_context(viewport={'width': 1100, 'height': 760})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        await pg.evaluate("""async () => { const c = P(69.6495, 18.972); await mapNeed(c, MAPD.simR); const b = S.boat; b.status = 'idle'; b.port = null; b.pos = {x:c.x, y:c.y}; S.plan = null; b.v = 0; }""")
        await pg.evaluate(AT, 3)
        # the vec packs within reach of the AIS range come and are decoded one after the other: wait for them all
        await pg.wait_for_function("(() => { COASTM.k = ''; npcStates(S.t / 60); const b = S.boat.pos, F = AIS_KM + 25, T = MAPD.man.tile; return VEC.wait.size === 0 && mapPacksIn('vec', b.x - F, b.y - F, b.x + F, b.y + F).every(pk => VEC.tiles.has(pk.tile[0] + ':' + pk.tile[1])); })()", timeout=120000)
        R = {}
        for h in (3, 9, 13, 21):
            await pg.evaluate(AT, h); R[h] = await pg.evaluate(STATES)
        ais = await pg.evaluate("AIS_KM")
        check(all(v['far'] <= ais for v in R.values()) and R[3]['n'] > 20, 'båtene langs kysten vises bare innenfor AIS-rekkevidden (%d km), mange ved Tromsø' % ais, R[3])
        check(R[3]['st'] == {'port': R[3]['n']} and R[21]['st'] == {'port': R[21]['n']}, 'om natta og om kvelden ligger alle ved kai', (R[3]['st'], R[21]['st']))
        day = {k: R[9]['st'].get(k, 0) + R[13]['st'].get(k, 0) for k in ('out', 'fishing', 'in')}
        check(day['fishing'] + day['out'] > 0 and day['in'] + R[13]['st'].get('fishing', 0) > 0, 'om dagen er de ute, fisker og går hjem', (R[9]['st'], R[13]['st']))
        await pg.evaluate(AT, 11)
        same = await pg.evaluate("(() => { const H = S.t / 60, f = () => JSON.stringify(npcStates(H).filter(n => n.coast).map(n => [n.id, n.p.x.toFixed(5), n.p.y.toFixed(5), n.st])); const a = f(); COASTM.k = ''; return a === f(); })()")
        check(same, 'samme tid gir samme båter på samme steder')
        # the berths fit, nothing in Senja's square, no fish taken, the routes off the land
        q = await pg.evaluate("""(() => { let n = 0, bad = 0, senja = 0, legs = 0, land = 0, k = 0;
          for (const t of VEC.tiles.values()) for (const h of t.npc || []){ if (inSenja(h.x, h.y)) senja++;
            for (const bt of h.boats){ n++; const x = bt.p.x * 1000, z = bt.p.y * 1000;
              if (!t.quays.some(f => { const a = (x - f.x) * f.ux + (z - f.z) * f.uz, o = (x - f.x) * f.nx + (z - f.z) * f.nz; return Math.abs(a) <= f.hl && o > 0 && o < bt.B / 2 + 1.5 && quayFit(f, bt.L, bt.T); })) bad++; }
            for (const g of h.grounds) for (let i = 1; i < g.pts.length; i++){ const a = g.pts[i - 1], c = g.pts[i], m = Math.max(1, Math.ceil(dist(a, c) / 0.02)); let hit = false, seen = false;
              for (let s = 1; s < m; s++){ const p = {x:a.x + (c.x - a.x) * s / m, y:a.y + (c.y - a.y) * s / m}; if (!mapSimAt(p) || !mapReadyAt(p, 0)) continue; seen = true; if (isLand(p)) hit = true; }
              if (seen){ legs++; if (hit) land++; } } }
          const both = npcStates(S.t / 60).filter(n => n.coast && n.fleet).length; return {n, bad, senja, legs, land, both}; })()""")
        check(q['n'] > 50 and q['bad'] == 0, 'hver båt ligger langs en kaifront som er lang og dyp nok for henne', q)
        check(q['senja'] == 0 and q['both'] == 0, 'ingen havn i Senja-ruta (FLEET er flåten der), og båtene langs kysten tar ikke fisk fra bestanden', q)
        check(q['legs'] > 20 and q['land'] <= q['legs'] * 0.08, 'leiene til feltene holder seg unna land (noen hjørner av 25 m-masken unntatt)', (q['land'], q['legs']))
        card = await pg.evaluate("(() => { const n = npcStates(S.t / 60).find(n => n.coast); AISSEL = n.id; const tr = aisTrack(n.id, (S.t + 0.5) / 60); return {info:aisInfo(n).includes('Fiskefartøy') || aisInfo(n).includes('Fishing'), size:/×/.test(aisInfo(n)), track:tr.length}; })()")
        check(card['info'] and card['size'] and card['track'] > 100, 'AIS-kortet og sporet virker for en båt langs kysten', card)
        ms = await pg.evaluate("(() => { const t0 = performance.now(); for (let i = 0; i < 20; i++){ COASTM.k = ''; npcStates(S.t / 60 + i / 3600); } return (performance.now() - t0) / 20; })()")
        print('npcStates med båtene langs kysten (ms per kall):', round(ms, 2))
        check(not errs, 'ingen sidefeil', errs[:3])
        await b.close()


asyncio.run(main())
