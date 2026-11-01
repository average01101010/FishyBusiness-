"""The game's deck map of a type cell by cell (vessel3d.js deckMap; sulebas-bygging.md kap. 15, 16): its parts (cells, mean height, the
main deck, joined or not), its links, and a stretch of the grid with each cell's candidate floors (b = barred: something stands in the
body over it), the height the map took for deck (x = none) and the part labels. The way to find why a part is not deck (the havsjark's
forecastle, 01.11.2026: a shroud across the walkway, steps over the whole walkway, three cells between the parts) when deckpoints.py
only says the highest cell. Needs a build (dist/). Never beside a Blender render or another SwiftShader test.
    python3 tools/boats/qa/deckgrid.py sjark                       the parts and the links
    python3 tools/boats/qa/deckgrid.py sjark 0.7 2.1 -1.4 1.0      and the grid for game x 0.7-2.1, z -1.4-1.0 (game frame: x starboard,
                                                                   z aft, metres from the model's middle; a model's (x, y) = (-x, -(z) + XM))"""
import asyncio, os, sys, json
TESTS = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), 'tests'); sys.path.insert(0, TESTS)
from _env import boot
from playwright.async_api import async_playwright
T = sys.argv[1]; BOX = [float(v) for v in sys.argv[2:6]] if len(sys.argv) >= 6 else None
JS = """(([t, box]) => { delete DECKMAP[t]; const M = deckMap(t), F = M._floors, out = {parts:M.parts.filter(p => p.n >= 8),
    links:M.links.map(([a, b, dy]) => [M.at(a).map(v => +v.toFixed(2)), M.at(b).map(v => +v.toFixed(2)), dy]), rows:{}};
  if (box) for (let k = 0; k < M.nx * M.nz; k++){ const a = M.at(k); if (a[0] < box[0] || a[0] > box[1] || a[2] < box[2] || a[2] > box[3]) continue;
    (out.rows[a[2].toFixed(1)] = out.rows[a[2].toFixed(1)] || []).push(a[0].toFixed(1) + ':' + (F[k] ? F[k].map(f => f[0].toFixed(2) + (f[1] ? 'b' : '')).join('/') : '-')
      + '=' + (M.h[k] === M.h[k] ? M.h[k].toFixed(2) : 'x') + '#' + (M._lab[k] ? M._lab[k].join('/') : '')); }
  return out; })"""
async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await br.new_page(viewport={'width': 1280, 'height': 800})
        await boot(pg); await pg.wait_for_function("G3.isActive()", timeout=180000)
        r = await pg.evaluate(JS, [T, BOX])
        print('deler (celler, snitthøyde, hoveddekket, med):'); [print('  ', json.dumps(q)) for q in r['parts']]
        print('lenker (fra, til, dy):'); [print('  ', json.dumps(q)) for q in r['links']]
        if BOX:
            print('ruta: z  x:gulv(b=sperret)=dekkshøyde#del'); [print(z, '  '.join(r['rows'][z])) for z in sorted(r['rows'], key=float)]
        await br.close()
asyncio.run(main())
