"""What a route must not sail through (05.10.2026, core/11b-obstacles.js; Jonas: the boat sailed through a pier of Gisundbrua): the
bridge's piers as the 3D view sets them, Autonav from Finnsnes to Botnhamn under Gisundbrua between its piers, a leg through a pier
and one through a sea mark taken round, the low deck of a short bridge as a wall, and a drawn route through a pier changed under
way. Along the coast (when the build has the vec packs) a long bridge in the Tromsø tile the same. Prints OK or FEIL per check."""
from _env import GAME, ROUTES, boot
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:400]) if extra != '' else ''))


# the nearest a list of km points comes to a bridge's piers (m), and whether it crosses its deck where that is too low
LEGS = """(pts, br) => { const B = obsBridge(br), air = obsAir(); let dp = 1e9, low = 0;
  for (let i = 1; i < pts.length; i++){ const a = pts[i - 1], b = pts[i], ax = a.x * 1000, az = a.y * 1000, bx = b.x * 1000, bz = b.y * 1000;
    for (const q of B.piers) if (!isLand({x:q.x / 1000, y:q.z / 1000})) dp = Math.min(dp, obsDist(q, ax, az, bx, bz));
    for (const d of B.deck) if (d.under < air && !isLand({x:(d.ax + d.bx) / 2000, y:(d.az + d.bz) / 2000}) && obsDist(d, ax, az, bx, bz) === 0) low++; }
  return {dp:Math.round(dp * 10) / 10, low, clr:obsClr()}; }"""


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        ctx = await br.new_context(viewport={'width': 1100, 'height': 800}); pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + '#notut'); await pg.wait_for_timeout(800)
        # 1. Gisundbrua's piers in the water, where the 3D view sets them
        r = await pg.evaluate("""(() => { const br = BRIDGES.find(q => q[2] === 'Gisundbrua'), B = obsBridge(br), wet = B.piers.filter(q => !isLand({x:q.x / 1000, y:q.z / 1000}));
          const idx = obsIndex(); return {n:B.piers.length, wet:wet.length, tot:Math.round(B.tot), mid:Math.round(B.under(B.tot / 2) * 10) / 10, air:obsAir(), cells:idx.size, things:HIND.list.length}; })()""")
        check(r['wet'] >= 8 and r['mid'] > r['air'], 'Gisundbrua has its piers in the sound as the 3D view sets them, and the deck is high enough in the middle', r)
        # 2. Autonav from Finnsnes to Botnhamn: under the bridge, clear of its piers
        r = await pg.evaluate("""(async () => { const br = BRIDGES.find(q => q[2] === 'Gisundbrua'), a = portById('finnsnes'), b = portById('botnhamn');
          await mapNeed(a.p, MAPD.simR); const res = await leiaRoute({x:a.p.x, y:a.p.y}, b.p, 'finnsnes', 'botnhamn'); if (res.why) return {why:res.why};
          const pts = [a.p].concat(res.wps); return Object.assign((%s)(pts, br), {wp:res.wps.length, det:res.wps.filter(w => w.obs).length, land:pts.some((q, i) => i && !legClear(pts[i - 1], q))}); })()""" % LEGS)
        check(not r.get('why') and r['dp'] >= r['clr'] - 0.5 and r['low'] == 0 and not r['land'], 'Autonav from Finnsnes to Botnhamn goes under Gisundbrua between its piers, clear of land', r)
        # 3. a leg straight through a pier is taken round it: under the deck in a gap, with no land on the way
        r = await pg.evaluate("""(() => { const br = BRIDGES.find(q => q[2] === 'Gisundbrua'), B = obsBridge(br), q = B.piers.filter(q => !isLand({x:q.x / 1000, y:q.z / 1000}))[3];
          const nx = -q.uz, nz = q.ux, a = {x:(q.x + nx * 300) / 1000, y:(q.z + nz * 300) / 1000}, b = {x:(q.x - nx * 300) / 1000, y:(q.z - nz * 300) / 1000};
          const hit = obsSegHit(a, b), d = obsDetour(a, b), pts = d ? [a].concat(d, [b]) : [];
          return Object.assign(d ? (%s)(pts, br) : {}, {hit:!!hit && hit.B === B, n:d && d.length, land:!d || pts.some((p, i) => i && !legClear(pts[i - 1], p)), extra:d ? Math.round((pts.reduce((s, p, i) => s + (i ? dist(pts[i - 1], p) : 0), 0) - dist(a, b)) * 1000) : null}); })()""" % LEGS)
        check(r['hit'] and r.get('n') and r['dp'] >= r['clr'] - 0.5 and r['low'] == 0 and not r['land'], 'a leg straight through a pier is taken under the deck in a gap between the piers', r)
        # 4. a leg through a sea mark (a buoy or a beacon in the water) goes round it
        r = await pg.evaluate("""(() => { const mk = SEAMARKS.marks.find(m => 'BCDLS'.includes(m[2]) && !isLand({x:m[0], y:m[1]}) && [0, 1, 2, 3].every(k => { const a = k * Math.PI / 2; return !isLand({x:m[0] + Math.cos(a) * 0.15, y:m[1] + Math.sin(a) * 0.15}); }));
          if (!mk) return {none:true}; const a = {x:mk[0] - 0.15, y:mk[1]}, b = {x:mk[0] + 0.15, y:mk[1]}, d = obsDetour(a, b), pts = d ? [a].concat(d, [b]) : [];
          let near = 1e9; for (let i = 1; i < pts.length; i++) near = Math.min(near, obsDist({t:0, x:mk[0] * 1000, z:mk[1] * 1000, r:0}, pts[i - 1].x * 1000, pts[i - 1].y * 1000, pts[i].x * 1000, pts[i].y * 1000));
          return {type:mk[2], hit:!!obsSegHit(a, b), n:d && d.length, near:Math.round(near), clr:obsClr()}; })()""")
        check(r.get('hit') and r.get('n') and r['near'] >= r['clr'], 'a leg through a sea mark goes round it', r)
        # 5. a short bridge lies low: its deck is a wall where there is water under it
        r = await pg.evaluate("""(() => { const out = []; for (const br of BRIDGES){ if (br[1] >= 60) continue; const B = obsBridge(br); out.push({name:br[2], low:B.deck.every(d => d.under < obsAir())}); } return {n:out.length, all:out.every(o => o.low)}; })()""")
        check(r['n'] > 0 and r['all'], 'a bridge under 60 m is a wall all along (its deck lies low over the water)', r)
        # 6. a drawn route straight through a pier: under way the boat is taken round it, and never comes near a pier
        r = await pg.evaluate("""(() => { const br = BRIDGES.find(q => q[2] === 'Gisundbrua'), B = obsBridge(br), q = B.piers.filter(q => !isLand({x:q.x / 1000, y:q.z / 1000}))[3];
          const nx = -q.uz, nz = q.ux, a = {x:(q.x + nx * 400) / 1000, y:(q.z + nz * 400) / 1000}, b = {x:(q.x - nx * 400) / 1000, y:(q.z - nz * 400) / 1000}, bt = S.boat;
          bt.status = 'sailing'; bt.port = null; bt.pos = {...a}; bt.fuel = 200; S.plan = {wps:[{x:b.x, y:b.y, port:null, fish:0}], idx:0, speed:6};
          const track = [{...bt.pos}]; for (let k = 0; k < 40 && S.plan; k++){ playMinutes(1); track.push({...bt.pos}); }
          let dp = 1e9; for (let i = 1; i < track.length; i++) for (const p of B.piers) if (!isLand({x:p.x / 1000, y:p.z / 1000})) dp = Math.min(dp, obsDist(p, track[i - 1].x * 1000, track[i - 1].y * 1000, track[i].x * 1000, track[i].y * 1000));
          return {dp:Math.round(dp), clr:obsClr(), end:Math.round(dist(bt.pos, b) * 1000), st:bt.status}; })()""")
        check(r['dp'] >= r['clr'] - 0.5 and r['end'] < 30, 'a drawn route through a pier: under way the boat goes round it under the deck and on to the end', r)
        # 7. a drawn route out under Gisundbrua and back (routes.json 4, as trip2 sails it): it passes a pier, and goes round it under the deck
        # without coming nearer the skerries by the way than the route itself (it ran aground on one, 05.10.2026), and is back in Finnsnes
        R = json.load(open(ROUTES))['4']
        r = await pg.evaluate("""(w => { const bt = S.boat, q = portById('finnsnes'), br = BRIDGES.find(x => x[2] === 'Gisundbrua'), B = obsBridge(br); S.settings.autoOn = false; S.plan = null;
          bt.status = 'port'; bt.port = 'finnsnes'; bt.pos = {...q.p}; bt.fuel = 200; bt.damage = 0;
          S.draft = w.map((p, i) => ({x:p.x, y:p.y, port:null, fish:i === w.length - 1 ? 1 : 0})); w.slice(0, -1).reverse().forEach(p => S.draft.push({x:p.x, y:p.y, port:null, fish:0})); S.draft.push({x:q.p.x, y:q.p.y, port:'finnsnes', fish:0});
          doAct({dataset:{act:'start'}}); const track = [{...bt.pos}]; let det = 0;
          for (let k = 0; k < 600 && bt.status !== 'port' && bt.status !== 'aground'; k++){ playMinutes(1); track.push({...bt.pos}); if (S.plan) det = Math.max(det, S.plan.wps.filter(x => x.obs).length); }
          let dp = 1e9; for (let i = 1; i < track.length; i++) for (const p of B.piers) if (!isLand({x:p.x / 1000, y:p.z / 1000})) dp = Math.min(dp, obsDist(p, track[i - 1].x * 1000, track[i - 1].y * 1000, track[i].x * 1000, track[i].y * 1000));
          return {st:bt.status, det, dp:Math.round(dp), clr:obsClr()}; })""", R)
        check(r['st'] == 'port' and r['det'] > 0 and r['dp'] >= r['clr'] - 0.5, 'a drawn route under Gisundbrua and back (trip2\'s): round the pier under the deck, no nearer the skerries, and back in Finnsnes', r)
        # 8. along the coast: a bridge from the vec packs, with Autonav under it
        has = await pg.evaluate("!!(MAPD.man && [...MAPD.byTile.keys()].some(k => k.startsWith('vec:')))")
        if not has:
            print('OK   along the coast: this build has no vec packs (the artifact\'s), so only Senja\'s bridges count here')
        else:
            r = await pg.evaluate("""(async () => { const P0 = P(69.6489, 18.9561); await mapNeed(P0, 3); await obsLoad([P0]); const T = MAPD.man.tile; const t = vecTile(Math.floor(P0.x / T), Math.floor(P0.y / T));
              const brs = (t ? t.bridges : []).filter(q => q[1] > 800); if (!brs.length) return {none:true};
              const br = brs[0], B = obsBridge(br), wet = B.piers.filter(q => !isLand({x:q.x / 1000, y:q.z / 1000})); if (!wet.length) return {name:br[2], wet:0};
              const q = wet[Math.floor(wet.length / 2)], nx = -q.uz, nz = q.ux, a = {x:(q.x + nx * 400) / 1000, y:(q.z + nz * 400) / 1000}, b = {x:(q.x - nx * 400) / 1000, y:(q.z - nz * 400) / 1000};
              const res = await leiaRoute(a, b, null, null); if (res.why) return {name:br[2], why:res.why}; const pts = [a].concat(res.wps);
              return Object.assign((%s)(pts, br), {name:br[2], wet:wet.length}); })()""" % LEGS)
            check(r.get('wet') and not r.get('why') and r['dp'] >= r['clr'] - 0.5 and r['low'] == 0, 'along the coast (%s, from the vec packs) Autonav goes under the bridge between its piers' % r.get('name'), r)
        print('errors:', errs[:3]); await ctx.close(); await br.close()

asyncio.run(main())
