"""Makes the fixture saves of tests/savestest.py (L1c, 11.11.2026). None of them is a player's: the game writes them here, from a new game.

  ny.json            a new player, as the game saves it right after «Start»
  flate.json         a player with a fleet: the first boat at Senja, a sjark in Bergen (the open one) and a snekke in Båtsfjord, a week played
  paa-land.json      the new player's boat far inland where the map has no pack (as «mask block 105,20 is not loaded», 08.10.2026).
                     It was written to be the broken one, but the game copes with it now (11.11.2026: it starts and plays), so it
                     is kept among the good ones: a build that stops on it again is stopped
  broken/uten-posisjon.json   made broken on purpose: the boat has no position, and the game ends in «Spillet startet ikke».
                     savestest must stop on it; it lies in a folder of its own, and the test's own run of the fixture wants it red

  node build.mjs && python3 tests/saves-fixture/lag.py     (the whole coast's packs must be in the build: tools/map/release.py, game.py)

The fixtures are written once and kept: a save an older build wrote is what the gate is for. Run this again only when a new kind of save is wanted."""
import asyncio, json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from _env import GAME, boot
from playwright.async_api import async_playwright
HERE = os.path.dirname(os.path.abspath(__file__))
RAW = "(() => { save(); return localStorage.getItem(KEY); })()"
FLEET = """(async () => {
  S.cash = 5e6; const near = (lat, lon) => { const p = P(lat, lon); let b = null, bd = 1e9; for (const q of PORTS){ if (!q.coastal || q.sted) continue; const d = Math.hypot(q.p.x - p.x, q.p.y - p.y); if (d < bd){ bd = d; b = q; } } return b; };
  const A = near(60.393, 5.312), B = near(70.633, 29.72);
  const v2 = newVesselObj('sjark', A.id), v3 = newVesselObj('snekke', B.id);
  await Promise.all([mapNeed(A.p, MAPD.simR), mapNeed(B.p, MAPD.simR)]);
  playMinutes(7 * 1440, true);
  storeVessel(curVessel()); bindVessel(v2); S.cur = v2.id;
  return {ports:[A.id, B.id], km:[A.p, B.p], fleet:S.fleet.map(v => vget(v, 'boat').type + '@' + vget(v, 'boat').port), cur:S.cur, t:S.t};
})()"""
LAND = """(() => { const o = JSON.parse(localStorage.getItem(KEY)), v = o.fleet && o.fleet.length ? o.fleet[0] : o, p = P(67.0, 20.0);
  v.boat.pos = {x:p.x, y:p.y}; v.boat.status = 'sea'; v.boat.port = null; return JSON.stringify(o); })()"""
BROKEN = """(() => { const o = JSON.parse(localStorage.getItem(KEY)), v = o.fleet && o.fleet.length ? o.fleet[0] : o;
  v.boat.pos = {x:null, y:null}; v.boat.status = 'sea'; v.boat.port = null; return JSON.stringify(o); })()"""

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await br.new_page(viewport={'width': 1000, 'height': 760}); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg); await pg.wait_for_function("SIMREADY === true", timeout=60000)
        ny = await pg.evaluate(RAW); open(os.path.join(HERE, 'ny.json'), 'w').write(ny)
        open(os.path.join(HERE, 'paa-land.json'), 'w').write(await pg.evaluate(LAND))
        open(os.path.join(HERE, 'broken', 'uten-posisjon.json'), 'w').write(await pg.evaluate(BROKEN))
        print('fleet:', json.dumps(await pg.evaluate(FLEET), ensure_ascii=False))
        open(os.path.join(HERE, 'flate.json'), 'w').write(await pg.evaluate(RAW))
        print('errors:', errs[:4]); await br.close()
    for f in ('ny.json', 'flate.json', 'paa-land.json', 'broken/uten-posisjon.json'): print(f, os.path.getsize(os.path.join(HERE, f)), 'bytes')
asyncio.run(main())
