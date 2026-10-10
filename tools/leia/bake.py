# The fairway network checked against the game's own map, once (Jonas 08.10.2026: «Kan mye av leinettet kodes inn på en slik måte at
# det tar mye kortere tid å lage lange ruter?»). The game is run headless (the built dist/, with the whole coast's packs) and every
# leg of src/data/leinett.json is checked as the boat sails it (core/11-route.js leiaLegFail: land every 2 m, the depth, breakwaters,
# rocks): by the strict rule (the safe depth of a 23-foot boat and 25 m from rocks) where it holds, else mended round the failing
# spot (leiaMend), else by the boat's own minimum, else the leg is left out. Each way is then straightened where a straight leg
# passes the same check. The baked net replaces the plain one (baked: true, each leg's rule in `soft`), and the game takes its legs as
# they are, checking only the ways onto and off it (core/11c-leinett.js).
#   node build.mjs && python3 tools/leia/leinett.py && python3 tools/leia/bake.py      (about half an hour; prints the counts)
import os, sys, json, asyncio, time
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tests'))
os.environ['KYST_LITE'] = '1'
from _env import GAME, boot
from playwright.async_api import async_playwright
SRC = os.path.join(ROOT, 'src', 'data', 'leinett.json')

BAKE = """async (D) => {
  // a 23-foot boat's draught and safe depth (the first boats; bigger ones keep their own check on the ways onto and off the net)
  const sd = safeDepth(), st = {slices:0, maxSlice:0, expanded:0}, X = i => ({x:D.nodes[2 * i] / 1000, y:D.nodes[2 * i + 1] / 1000});
  const nodes = D.nodes.slice(), add = p => { nodes.push(Math.round(p.x * 1000), Math.round(p.y * 1000)); return nodes.length / 2 - 1; };
  const P = i => ({x:nodes[2 * i] / 1000, y:nodes[2 * i + 1] / 1000});
  const ways = [], soft = [], out = {ok:0, mended:0, soft:0, cut:0, legs:0};
  const load = async (a, b) => { await lnetLoad([a, b]); await obsLoad([a, b]); };   // (the bridges and piers too: obsClear)
  for (let wi = 0; wi < D.ways.length; wi++){
    const w = D.ways[wi]; let cur = [w[0]], curSoft = [];
    const flush = () => { if (cur.length > 1){ ways.push(cur); soft.push(curSoft); } };
    for (let k = 1; k < w.length; k++){
      const a = P(cur[cur.length - 1]), b = P(w[k]); out.legs++; await load(a, b);
      if (!(await leiaLegFail(a, b, null, false, false, true))){ cur.push(w[k]); curSoft.push(0); out.ok++; continue; }
      let m = await leiaMend([a, b], sd, st, true);
      if (m && !st.soft){ for (const q of m.slice(1, -1)){ cur.push(add(q)); curSoft.push(0); } cur.push(w[k]); curSoft.push(0); out.mended++; continue; }
      st.soft = 0;
      if (!(await leiaLegFail(a, b))){ cur.push(w[k]); curSoft.push(1); out.soft++; continue; }
      m = await leiaMend([a, b], sd, st, false);
      if (m){ for (const q of m.slice(1, -1)){ cur.push(add(q)); curSoft.push(1); } cur.push(w[k]); curSoft.push(1); out.mended++; continue; }
      // no way along this leg: the way is cut here
      flush(); cur = [w[k]]; curSoft = []; out.cut++;
    }
    flush();
  }
  // each way straightened: from each kept point the furthest one a straight leg reaches by the same rule as the legs it replaces
  // (never past a junction: a node more than one way has, or one way twice, stays, or the net falls apart into pieces)
  const uses = new Map(); for (const w of ways) for (const i of w) uses.set(i, (uses.get(i) || 0) + 1);
  for (const w of ways){ uses.set(w[0], uses.get(w[0]) + 1); uses.set(w[w.length - 1], uses.get(w[w.length - 1]) + 1); }
  const sw = [], ss = []; let before = 0, after = 0;
  for (let wi = 0; wi < ways.length; wi++){
    const w = ways[wi], s = soft[wi], o = [w[0]], os = []; let i = 0; before += w.length;
    while (i < w.length - 1){
      let stop = i + 1; while (stop < w.length - 1 && uses.get(w[stop]) < 2) stop++;
      let j = Math.min(stop, i + 60);
      for (; j > i + 1; j--){ const strict = !s.slice(i, j).some(Boolean); await load(P(w[i]), P(w[j])); if (!(await leiaLegFail(P(w[i]), P(w[j]), null, false, false, strict)) && obsClear(P(w[i]), P(w[j]))) break; }
      o.push(w[j]); os.push(s.slice(i, j).some(Boolean) ? 1 : 0); i = j;
    }
    sw.push(o); ss.push(os); after += o.length;
  }
  // only the nodes still used, renumbered
  const used = new Map(), N = [];
  const ren = i => { if (!used.has(i)){ used.set(i, N.length / 2); N.push(nodes[2 * i], nodes[2 * i + 1]); } return used.get(i); };
  const W = sw.map(w => w.map(ren));
  out.points = [before, after]; out.nodes = N.length / 2;
  return {nodes:N, ways:W, soft:ss, sd:+sd.toFixed(2), draft:+(BOAT.draft + LEIA.minOver).toFixed(2), out};
}"""

async def main():
    D = json.load(open(SRC))
    if D.get('baked'): sys.exit('leinett.json is baked already: make it again with tools/leia/leinett.py first')
    t0 = time.time()
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await br.new_page(viewport={'width': 1000, 'height': 700}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg); pg.set_default_timeout(0)
        await pg.wait_for_function("typeof SIMREADY !== 'undefined' && SIMREADY", timeout=120000)
        r = await pg.evaluate(BAKE, D)
        await br.close()
    o = r.pop('out')
    D.update({'baked': True, 'bakedAt': time.strftime('%Y-%m-%d'), 'n': len(r['nodes']) // 2, 'nodes': r['nodes'], 'ways': r['ways'], 'soft': r['soft'], 'sd': r['sd'], 'draft': r['draft']})
    json.dump(D, open(SRC, 'w'), separators=(',', ':'))
    print('legs %d: %d strict, %d mended, %d soft, %d cut; points %d -> %d; %d nodes; %.0f s; %d kB; page errors %s' % (o['legs'], o['ok'], o['mended'], o['soft'], o['cut'], o['points'][0], o['points'][1], o['nodes'], time.time() - t0, os.path.getsize(SRC) // 1024, errs[:3]))

asyncio.run(main())
