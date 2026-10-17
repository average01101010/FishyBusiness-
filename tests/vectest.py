"""Buildings, roads, bridges, piers, breakwaters and quays along the whole coast (part 4 of the coast-wide plan, 03.10.2026: the
'vec' packs of kart-5, core/01c-vec.js, view3d.js). It builds dist-vec/ itself with the packs (KYST_VEC=1; the artifact has no room for
them) and needs the whole coast in tools/map/out/game (tools/map/release.py, then game.py). At Tromsø the tile is decoded in the worker,
has its buildings, roads without the tunnels, Tromsøbrua and Sandnessundbrua and quay faces with depth, and the 3D view builds its
bridges, piers and breakwaters a few at a time; no pack item lies in Senja's square, where the embedded data is alone; a breakwater is a
rubble mound (crest about 2.8 m, foot under the sea); Senja's fleet lies at quay faces that fit it, never two in one place; the chart
draws the roads; Henningsvær and Bergen have their buildings too; a tile far behind is let go with what was built from it. Pictures:
tests/out/vec_<place>.png. Prints OK or FEIL."""
import os, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.environ['KYST_DIST'] = os.path.join(ROOT, 'dist-vec')
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


# the boat on the sea near (lat, lon), and the tile's 3D statics waited for
GO = """async ([la, lo]) => { const c = P(la, lo); let q = null;
  for (let r = 0; r <= 60 && !q; r++) for (let a = 0; a < Math.max(1, r * 6); a++){ const t = a / Math.max(1, r * 6) * 2 * Math.PI, p = {x:c.x + Math.cos(t) * r * 0.05, y:c.y + Math.sin(t) * r * 0.05}; if (!isLandFar(p) && coastDistFar(p) >= 0.1){ q = p; break; } }
  await mapNeed(q, MAPD.simR); const b = S.boat; b.status = 'idle'; b.port = null; b.pos = {x:q.x, y:q.y}; S.plan = null; S.draft = []; b.v = 0; return q; }"""
READY = """(q) => { const v = G3._debug.vec, tx = Math.floor(q.x / 50), ty = Math.floor(q.y / 50); return !vecHas(tx, ty) || (v.statics.some(s => s.k === tx + ':' + ty) && v.chunks > 15); }"""


async def main():
    if not os.path.exists(os.path.join(ROOT, 'tools', 'map', 'out', 'game', 'manifest.json')):
        check(False, 'hele kysten i tools/map/out/game (python3 tools/map/release.py og game.py)'); return
    env = dict(os.environ, KYST_VEC='1', KYST_DIST=os.path.join(ROOT, 'dist-vec'))
    r = subprocess.run(['node', 'build.mjs'], cwd=ROOT, env=env, capture_output=True, text=True)
    nvec = json.load(open(os.path.join(ROOT, 'dist-vec', 'map', 'manifest.json')))['packs'] if r.returncode == 0 else []
    nvec = sum(1 for p in nvec if p['kind'] == 'vec')
    check(r.returncode == 0 and nvec > 100, 'dist-vec/ bygges med vec-pakkene for hele kysten', (nvec, r.stderr[-200:]))
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-compositing'])
        pg = await b.new_page(viewport={'width': 1100, 'height': 700}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        await pg.evaluate("() => { S.cash = 1e6; S.t = Math.round((Date.UTC(2027, 5, 15, 9) - EPOCH) / 6e4); if (!G3.isActive()) G3.show(true); }")
        await pg.wait_for_function("G3.isActive()", timeout=60000)
        # Tromsø
        q = await pg.evaluate(GO, [69.6495, 18.972])
        await pg.wait_for_function(READY, arg=q, timeout=240000)
        t = await pg.evaluate("""(() => { const t = vecTile(18, 6), br = n => t.bridges.find(q => q[2] === n);
          return {bld:t.bld.n, roads:t.roads.length, quays:t.quays.length, deep:t.quays.filter(f => f.depth).length, tb:(br('Tromsøbrua') || [])[1], sb:(br('Sandnessundbrua') || [])[1], molos:t.molos.length, worker:!!VEC.worker, ms:Math.round(VEC.ms)}; })()""")
        check(t['worker'] and t['bld'] > 20000 and t['roads'] > 5000, 'Tromsø-flisen pakkes ut i workeren, med bygg og veier', t)
        check((t['tb'] or 0) > 900 and (t['sb'] or 0) > 1000, 'Tromsøbrua og Sandnessundbrua er med, i hele sin lengde', (t['tb'], t['sb']))
        check(t['quays'] > 100 and t['deep'] > t['quays'] * 0.6, 'kaifrontene er med, de fleste med dybden utenfor', (t['quays'], t['deep']))
        # no road over open water: the tunnels (Tromsøysundtunnelen) and the bridges are not in the road layer
        sea = await pg.evaluate("""(() => { let n = 0, k = 0; for (const r of vecTile(18, 6).roads) for (let j = 1; j < r.xs.length; j++){ const p = {x:(r.xs[j - 1] + r.xs[j]) / 2000, y:(r.zs[j - 1] + r.zs[j]) / 2000}; if (!mapSimAt(p) || !mapReadyAt(p, 0)) continue; k++; if (!isLand(p) && coastDist(p) > 0.15) n++; } return {n, k}; })()""")
        check(sea['k'] > 1000 and sea['n'] == 0, 'ingen veibit går over åpent vann (tunneler og bruer er tatt ut av veilaget)', sea)
        d3 = await pg.evaluate("(() => { const v = G3._debug.vec, s = v.statics.find(s => s.k === '18:6'); return {tris:s && s.tris, ms:s && s.ms, chunks:v.chunks, gl:G3._debug.glErr()}; })()")
        check(d3['tris'] > 20000 and d3['gl'] == 0, 'bruene, bryggene og moloene i Tromsø står i 3D, uten GL-feil', d3)
        await pg.evaluate("() => { const c = G3._debug.cam; c.helm = false; c.yaw = 2.6; c.pitch = 0.3; c.dist = 900; }"); await pg.wait_for_timeout(5000)
        await pg.screenshot(path='vec_tromso.png')
        # nothing of a pack in Senja's square, where the embedded buildings, roads, bridges and piers are alone
        sj = await pg.evaluate("""(() => { let n = 0, k = 0; for (const t of VEC.tiles.values()){ if (t.bld) for (let i = 0; i < t.bld.n; i++){ k++; if (inSenja(t.bld.x[i] / 1000, t.bld.z[i] / 1000)) n++; }
          for (const q of t.bridges){ const m = 4 + 2 * Math.floor((q.length - 4) / 4); if (inSenja(q[m] / 1000, q[m + 1] / 1000)) n++; } } return {n, k, tiles:[...VEC.tiles.keys()]}; })()""")
        check(sj['n'] == 0 and sj['k'] > 0, 'ingen bygg eller bruer fra pakkene inne i Senja-ruta', sj)
        # a breakwater: a rubble mound, 100 by 20 m, out in the sea
        mo = await pg.evaluate("""(c) => { const x = c.x * 1000 + 150, z = c.y * 1000, m = G3._debug.MB(), pts = [[x - 50, z - 10], [x + 50, z - 10], [x + 50, z + 10], [x - 50, z + 10], [x - 50, z - 10]];
          const tris = G3._debug.moundInto(m, pts, 7, false); let lo = 1e9, hi = -1e9; for (let i = 1; i < m.p.length; i += 3){ lo = Math.min(lo, m.p[i]); hi = Math.max(hi, m.p[i]); }
          const mid = G3._debug.moundTop(x, z);   // the crest in the middle, where a road on it lies
          return {tris, lo:+lo.toFixed(1), hi:+hi.toFixed(1), mid:+mid.toFixed(1)}; }""", q)
        check(mo['tris'] > 500 and 2.0 <= mo['mid'] <= 5.5 and mo['lo'] < -2.5, 'en molo er en steinfylling: krona rundt 3 m over sjøen, foten under vann, med steiner på', mo)
        # Senja's fleet at quay faces that fit, never two in one place: the boat at Husøy, and the packs of Senja's tiles in and decoded
        q2 = await pg.evaluate(GO, [69.543, 17.665])
        await pg.wait_for_function(READY, arg=q2, timeout=240000)
        await pg.evaluate("(async () => { const ks = ['16:6', '16:7', '17:6', '17:7']; await Promise.all(ks.map(k => mapLoad(MAPD.byTile.get('vec:' + k)))); for (const k of ks) vecTile(+k.split(':')[0], +k.split(':')[1]); })()")
        await pg.wait_for_function("['16:6', '16:7', '17:6', '17:7'].every(k => VEC.tiles.has(k) || !vecHas(+k.split(':')[0], +k.split(':')[1]))", timeout=120000)
        fl = await pg.evaluate("""(() => { const faces = new Map(); for (const t of VEC.tiles.values()) for (const f of t.quays) faces.set(f.id, f); const out = []; let bad = 0, clash = 0;
          FLEET.forEach((f, i) => { const bp = npcBerths('fleet:' + f.home, {x:f.hp[0], y:f.hp[1]}, f.mates || FLEET.map((g, j) => ({key:'f' + j, L:g.L, B:g.B, T:g.T, home:g.home})).filter(g => g.home === f.home))['f' + i]; if (!bp) return;
            const F = faces.get(bp.face); if (!F || !quayFit(F, f.L, f.T)) bad++; out.push({i, p:bp.p, L:f.L, face:bp.face}); });
          for (let a = 0; a < out.length; a++) for (let c = a + 1; c < out.length; c++) if (dist(out[a].p, out[c].p) * 1000 < (out[a].L + out[c].L) / 2 && out[a].face === out[c].face) clash++;
          const big = npcBerths('test-big', {x:FLEET[0].hp[0], y:FLEET[0].hp[1]}, [{key:'big', L:150, B:22, T:12}]).big, mid = npcBerths('test-mid', {x:FLEET[0].hp[0], y:FLEET[0].hp[1]}, [{key:'mid', L:70, B:13, T:7}]).mid, mf = mid && faces.get(mid.face);
          const port = FLEET.map((f, i) => fleetState(i, S.t / 60)).filter(s => s.st === 'port'); return {placed:out.length, of:FLEET.length, bad, clash, big:!!big, mid:mf ? {kind:mf.kind, len:Math.round(mf.hl * 2), depth:mf.depth} : null, portBerth:port.filter(s => s.berth).length, port:port.length}; })()""")
        check(fl['placed'] >= FLEET_MIN and fl['bad'] == 0 and fl['clash'] == 0, 'Senja-flåten får kaiplasser som er lange og dype nok, og aldri to på samme plass', fl)
        check(not fl['big'], 'en båt på 150 m med 12 m dypgående får ingen plass ved kaiene på Husøy (en på 70 m med 7 m: %s)' % fl['mid'], fl['big'])
        # the chart draws the roads
        await pg.evaluate("(() => { G3.show(false); view.cx = 903.6; view.cy = 318.4; view.z = 8; applyView(); scheduleStatic(); })()")
        await pg.wait_for_timeout(3000)
        ch = await pg.evaluate("(() => { const r = document.querySelector('path.road'); return {road:r ? r.getAttribute('d').length : 0, bridge:document.querySelectorAll('path.bridge').length}; })()")
        check(ch['road'] > 5000 and ch['bridge'] > 2, 'kartplotteren tegner veiene og bruene i Tromsø', ch)
        await pg.evaluate("() => { G3.show(true); }"); await pg.wait_for_function("G3.isActive()", timeout=60000)
        # other places along the coast: a fishing village in Lofoten and a city in the west
        for name, la, lo, nb in [('henningsvaer', 68.153, 14.205, 300), ('bergen', 60.398, 5.315, 5000)]:
            q = await pg.evaluate(GO, [la, lo])
            try: await pg.wait_for_function(READY, arg=q, timeout=240000)
            except Exception as e: print('     (venter fortsatt:', name, str(e)[:80], ')')
            v = await pg.evaluate("(q) => { const t = vecTile(Math.floor(q.x / 50), Math.floor(q.y / 50)); return t ? {bld:t.bld ? t.bld.n : 0, roads:t.roads.length, molos:t.molos.length, quays:t.quays.length, gl:G3._debug.glErr()} : null; }", q)
            await pg.evaluate("() => { const c = G3._debug.cam; c.helm = false; c.yaw = 0.6; c.pitch = 0.32; c.dist = 700; }"); await pg.wait_for_timeout(5000)
            await pg.screenshot(path='vec_' + name + '.png')
            check(v and v['bld'] >= nb and v['gl'] == 0, name + ': byggene og veiene er der, uten GL-feil', v)
        # Tromsø is far behind now: its tile and what was built from it are let go
        gone = await pg.evaluate("(() => ({tile:VEC.tiles.has('18:6'), statics:G3._debug.vec.statics.some(s => s.k === '18:6')}))()")
        check(not gone['tile'] and not gone['statics'], 'en flis langt bak slippes, med det som ble bygd av den', gone)
        print('utpakking i workeren i alt (ms):', t['ms'], ' bilder/s i SwiftShader:', round(await pg.evaluate("G3._debug.fps"), 1))
        check(not errs, 'ingen sidefeil', errs[:3])
        await b.close()

FLEET_MIN = 6
asyncio.run(main())
