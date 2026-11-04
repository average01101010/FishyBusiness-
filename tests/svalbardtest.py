"""Svalbard and Jan Mayen in detail (H1b R3 of the ocean step, docs/planer/havsteget-h1b-rammen.md): the islands off the old frame
have the coast's tiles with detail (sim, view, chart, vec), so at Longyearbyen, Bjørnøya and Jan Mayen the tile's packs come, the land
and the sea are the 25 m mask's and the fine coast's, the depth is GEBCO's (or Kartverket's) and not the model's 2 m, Longyearbyen has its
buildings, roads and quays from Overture, the 3D view builds the tile without a GL error, the ground is not the mainland's green (the
summer colour and the land cover: tundra, bare ground, glaciers), the sea marks are there once a sjomerker- release has them, and pictures
are taken at Longyearbyen in both formats (tests/out/sval_<place>_<w>x<h>.png). Needs the whole coast with the islands in
tools/map/out/game and dist-vec/ (the vec packs), as vectest. Prints OK or FEIL per check."""
import asyncio, json, os, subprocess
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.environ['KYST_DIST'] = os.path.join(ROOT, 'dist-vec')
from _env import boot
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


# the boat on the sea near (lat, lon), with the packs round it in (as the barrier loads them)
# the boat on the sea near (lat, lon): the tiles' packs round the place first, then the nearest point the fine coast has as sea 250 m or
# more from the land (the 1 km layer that looks far misses Bjørnøya's skerries), and a point 1.5 km or more out for the depth
GO = """async ([la, lo]) => { const c = P(la, lo); await mapNeed(c, MAPD.simR + 2);
  const find = (dmin, rmax) => { for (let r = 0; r <= rmax; r++) for (let a = 0; a < Math.max(1, r * 6); a++){ const t = a / Math.max(1, r * 6) * 2 * Math.PI, p = {x:c.x + Math.cos(t) * r * 0.05, y:c.y + Math.sin(t) * r * 0.05}; if (mapSimAt(p) && mapReadyAt(p, 0) && !isLand(p) && coastDist(p) >= dmin) return p; } return null; };
  const q = find(0.25, 120), w = find(1.5, 160); await mapNeed(q, MAPD.simR); const b = S.boat; b.status = 'idle'; b.port = null; b.pos = {x:q.x, y:q.y}; S.plan = null; S.draft = []; b.v = 0; return [q, w]; }"""
# the ground's mean colour in the near terrain's land points over 5 m (r, g, b), and the share of them that read as green
GROUND = """() => { const M = G3._debug.NEARM; if (!M || !M.col) return null; let r = 0, g = 0, b = 0, n = 0, gr = 0;
  for (let i = 0; i < M.h.length; i++){ if (M.h[i] < 5) continue; const R = M.col[i * 3], G = M.col[i * 3 + 1], B = M.col[i * 3 + 2]; r += R; g += G; b += B; n++; if (G > R * 1.12 && G > B * 1.12) gr++; }
  return n ? {r:+(r / n).toFixed(3), g:+(g / n).toFixed(3), b:+(b / n).toFixed(3), n, green:+(gr / n).toFixed(3)} : null; }"""
# (name, lat, lon of the sea by the place, lat, lon of a point on land)
PLACES = [('longyearbyen', 78.236, 15.56, (78.2232, 15.6267)), ('bjornoya', 74.47, 19.20, (74.43, 19.0)), ('janmayen', 70.93, -8.68, (71.0, -8.4))]


async def main():
    if not os.path.exists(os.path.join(ROOT, 'tools', 'map', 'out', 'game', 'manifest.json')):
        check(False, 'hele kysten i tools/map/out/game (python3 tools/map/release.py og game.py)'); return
    if os.environ.get('KYST_VEC_BUILT'): built = True
    else:
        env = dict(os.environ, KYST_VEC='1', KYST_DIST=os.path.join(ROOT, 'dist-vec'))
        built = subprocess.run(['node', 'build.mjs'], cwd=ROOT, env=env, capture_output=True, text=True).returncode == 0
    man = json.load(open(os.path.join(ROOT, 'dist-vec', 'map', 'manifest.json')))
    isl = [t for t in man['tiles'] if t[1] < 0 or t[0] < 0]
    check(built and len(isl) >= 10, 'bygget har flisene til øyene utenfor den gamle rammen', len(isl))
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-compositing'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 800}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        await pg.evaluate("() => { S.cash = 1e6; S.t = Math.round((Date.UTC(2027, 7, 10, 12) - EPOCH) / 6e4); if (!G3.isActive()) G3.show(true); }")
        await pg.wait_for_function("G3.isActive()", timeout=60000)
        for name, la, lo, land in PLACES:
            q, sea = await pg.evaluate(GO, [la, lo])
            r = await pg.evaluate("""([q, L, w]) => { const l = P(L[0], L[1]); return {sim:mapSimAt(q), ready:mapReadyAt(q, 0), boatLand:isLand(q), land:mapSimAt(l) ? isLand(l) : null,
              sea:w ? isLand(w) : null, dc:+coastDist(q).toFixed(2), depth:w ? +depthF(w).toFixed(1) : null, miss:MAPD.miss}; }""", [q, list(land), sea])
            print('  ', name, json.dumps(r))
            check(r['sim'] and r['ready'] and not r['boatLand'], name + ': flisas sim-pakke er inne, og båten ligger på sjøen', r)
            check(r['land'] is True and r['sea'] is False, name + ': land er land og sjø er sjø i flisa', (r['land'], r['sea']))
            check((r['depth'] or 0) > 20, name + ': dybden ute på sjøen er fra dybdedataene, ikke en grunne', r['depth'])
            if name == 'longyearbyen':
                await pg.wait_for_function("(q) => { const v = G3._debug.vec, tx = Math.floor(q.x / 50), ty = Math.floor(q.y / 50); return v.statics.some(s => s.k === tx + ':' + ty) && v.chunks > 10; }", arg=q, timeout=300000)
                t = await pg.evaluate("(q) => { const t = vecTile(Math.floor(q.x / 50), Math.floor(q.y / 50)); return {bld:t.bld.n, roads:t.roads.length, quays:t.quays.length, gl:G3._debug.glErr()}; }", q)
                check(t['bld'] > 500 and t['roads'] > 100 and t['quays'] > 20 and t['gl'] == 0, 'Longyearbyen har byggene, veiene og kaiene fra Overture i 3D, uten GL-feil', t)
                mk = await pg.evaluate("(q) => ({lights:marksNear('lights', q.x, q.y, 30).length, marks:marksNear('marks', q.x, q.y, 30).length, src:MARKS && MARKS.ver})", q)
                print('   sjømerker innen 30 km:', mk)
            try: await pg.wait_for_function("(q) => { const M = G3._debug.NEARM; return M && Math.abs(M.cx - q.x * 1000) < 3000 && Math.abs(M.cz - q.y * 1000) < 3000; }", arg=q, timeout=240000)
            except Exception as e: print('   (nærterrenget kom ikke:', str(e)[:80], ')')
            await pg.wait_for_timeout(3000)
            g = await pg.evaluate(GROUND)
            check(bool(g) and g['green'] < 0.25, name + ': bakken er ikke fastlandets grønne (tundra, bar mark og bre)', g)
            await pg.evaluate("() => { const c = G3._debug.cam; c.helm = false; c.yaw = 2.3; c.pitch = 0.22; c.dist = 700; }")
            for w, h in ((1280, 800), (800, 1280)):
                await pg.set_viewport_size({'width': w, 'height': h}); await pg.wait_for_timeout(6000)
                await pg.screenshot(path=f'sval_{name}_{w}x{h}.png')
            await pg.set_viewport_size({'width': 1280, 'height': 800})
        check(await pg.evaluate("G3._debug.glErr()") == 0, 'ingen GL-feil')
        check(not errs, 'ingen sidefeil', errs[:3])
        await b.close()

asyncio.run(main())
