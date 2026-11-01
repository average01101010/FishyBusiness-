"""Where the game puts the places on a boat's deck (sulebas-bygging.md kap. 14): the deck map's points (deckPoints: the gutting table,
the bleeding tub, the hauler, the door, the crew spots, the filler) with their heights in the game's frame (y up from the waterline),
and the highest cell the map takes for deck. Every place should lie at the deck's height; one on a roof means the map took the roof for
deck (a roof within 0.6 m and 1.6 m of a part one can step onto, or a deck with less than 1.85 m free over it). Needs a build (dist/).
Never beside a Blender render or another SwiftShader test.
    python3 tools/boats/qa/deckpoints.py plastsjark"""
import asyncio, os, sys, json
TESTS = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), 'tests'); sys.path.insert(0, TESTS)
from _env import boot
from playwright.async_api import async_playwright
T = sys.argv[1]
async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await br.new_page(viewport={'width': 1280, 'height': 800})
        await boot(pg); await pg.wait_for_function("G3.isActive()", timeout=120000)
        r = await pg.evaluate("""((t) => { const G = geoOf(t), D = deckPoints(t), M = deckMap(t); if (!D || !M) return null;
          const pts = {}; for (const k in D) if (D[k] && D[k].k != null) pts[k] = M.at(D[k].k).map(v => Math.round(v * 100) / 100);
          let maxy = -9; for (let k = 0; k < M.nx * M.nz; k++){ if (!M.ok(k)) continue; maxy = Math.max(maxy, M.at(k)[1]); }
          return {deck:G.deck, skipperAt:G.skipperAt, door:G.doors && G.doors[0] ? G.doors[0].at : null, places:pts, highestDeckCell:Math.round(maxy * 100) / 100}; })""", T)
        print(json.dumps(r))
        await br.close()
asyncio.run(main())
