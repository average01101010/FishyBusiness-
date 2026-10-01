"""The vessels (core/02-species-gear.js VESSELS): every type has the full spec, the numbers hang together, the rules read the fields
and not the type names, and equipment fits by size. Prints OK/FEIL lines."""
import asyncio, json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _env import boot
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def guard():
    """No code may branch on a vessel type name: `=== 'sjark'` and the like. The keys live in VESSELS and the data tables only."""
    src = open(os.path.join(ROOT, 'src/js/core/02-species-gear.js')).read()
    keys = re.findall(r"^  (\w+):\{name:", src[src.index('const VESSELS'):src.index('const BOAT')], re.M)
    hits = []
    for d in ('src/js/core', 'src/js/ui', 'src/js'):
        for f in sorted(os.listdir(os.path.join(ROOT, d))):
            if not f.endswith('.js'): continue
            for i, line in enumerate(open(os.path.join(ROOT, d, f)), 1):
                for k in keys:
                    if re.search(r"[!=]==\s*'" + k + r"'|'" + k + r"'\s*[!=]==", line): hits.append('%s/%s:%d' % (d, f, i))
    return keys, sorted(set(hits))


async def main():
    keys, hits = guard()
    print('types:', keys)
    print(ok(not hits), 'no code branches on a vessel type name', hits[:8])
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await (await br.new_context(viewport={'width':1100, 'height':800})).new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        r = await pg.evaluate("""(()=>{ const R = {bad:[]}, need = ['name', 'len', 'beam', 'draft', 'disp', 'holdCap', 'iceCap', 'fuelCap', 'hp', 'engine', 'vmax', 'vcruise', 'accel', 'turnR',
            'planing', 'outboard', 'diesel', 'fuelK', 'risk', 'sea', 'crewMax', 'berths', 'tubCap', 'land', 'std', 'rigs', 'jukseMax', 'gearMax', 'svcH', 'svcCost', 'svcJobH', 'cls', 'price', 'year', 'desc'];
          for (const [k, V] of Object.entries(VESSELS)){
            for (const f of need) if (V[f] == null) R.bad.push(k + ': mangler ' + f);
            // fullness: displacement over length overall × beam × greatest draft × sea water. With the overall figures (not the waterline
            // ones) small boats come out at 0.1–0.3 and big full hulls up to 0.6
            const cb = V.disp / (V.len * V.beam * V.draft * 1.025);
            if (!(cb > 0.1 && cb < 0.6)) R.bad.push(k + ': blokkoeffisient ' + cb.toFixed(2));
            if (!(V.draft < 0.6 * V.beam)) R.bad.push(k + ': dypgående mot bredde');
            if (!(V.beam < V.len / 1.8)) R.bad.push(k + ': bredde mot lengde');
            if (!(V.vcruise <= V.vmax)) R.bad.push(k + ': marsjfart over toppfart');
            if (!(V.holdCap < V.disp * 1000)) R.bad.push(k + ': last over vekten');
            if (!['box', 'tub'].includes(V.land)) R.bad.push(k + ': land');
            if (V.cls !== 'hav' && BEAM[k] !== V.beam) R.bad.push(k + ': BEAM');
          }
          // equipment fits by size: the small electric hauler on small boats, hydraulic haulers and sonar on bigger ones, the 90 hp outboard on outboard boats
          R.fit = Object.fromEntries(Object.keys(VESSELS).map(k => [k, Object.keys(EQUIP).filter(q => equipFits(q, k)).join(',')]));
          // the 90 hp outboard boosts only a boat with an outboard
          const b = S.boat, t0 = b.type; b.type = 'skiff'; S.equip.motor90 = true; applyVessel(); R.boost = [BOAT.vmax, BOAT.fuelK]; S.equip.motor90 = false; applyVessel(); R.plain = [BOAT.vmax, BOAT.fuelK];
          b.type = t0; applyVessel();
          // the old type table values are kept for the four first types
          R.same = ['skiff', 'snekke', 'sjark', 'sjarkny'].map(k => [k, VESSELS[k].tubCap, VESSELS[k].land, VESSELS[k].svcJobH, VESSELS[k].accel]);
          return R; })()""")
        print(json.dumps(r, ensure_ascii=False))
        print(ok(not r['bad']), 'every vessel type has the full spec and the numbers hang together', r['bad'][:6])
        f = r['fit']
        print(ok('elhaler' in f['skiff'] and 'elhaler' in f['snekke'] and 'elhaler' not in f['sjark'] and 'garnhaler' not in f['skiff'] and 'garnhaler' in f['snekke']
                 and 'sonar' in f['sjark'] and 'sonar' not in f['snekke'] and 'motor90' in f['skiff'] and 'motor90' not in f['snekke']), 'equipment fits by size and engine')
        print(ok(r['boost'] == [30, 1.35] and r['plain'] == [24, 1]), 'the 90 hp outboard gives the skiff 30 kn and a thirstier engine')
        print(ok(r['same'] == [['skiff', 60, 'box', 3, 10], ['snekke', 150, 'box', 5, 3], ['sjark', 300, 'tub', 8, 3], ['sjarkny', 400, 'tub', 10, 10]]), 'the old type tables (tub, landing, yard hours, acceleration) are now fields with the same values')
        # the ladder: prices rise with what you get, the closed-group offers sit on the right boats, the ocean fleet is locked, big boats keep out of the fjords
        r = await pg.evaluate("""(()=>{ const R = {}, b = S.boat;
          R.ladder = Object.entries(VESSELS).map(([k, V]) => [k, V.len, V.cls, !!V.lock]);
          R.offers = LIC_OFFERS.map(O => [O.id, O.ves, VESSELS[O.ves].len, Math.round((VESSELS[O.ves].price + licValue(O)) / 1000)]);
          // the 8.9 m sjark is in the open group's 8–9.99 m quota group: 5.6 t of cod
          const t0 = b.type; b.type = 'jukesjark'; applyVessel(); R.jukGroup = [lenGroup(), codLimits().max]; b.type = 'kyst21'; applyVessel();
          const inside = GROUNDS.find(g => insideFjord(g.p) && depthF(g.p) > 20).p; b.status = 'fishing'; b.port = null; b.pos = {...inside}; b.gop = null; b.rig = 'juksa'; b.gear = true; b.fishUntil = S.t + 120; S.hold = []; S.crew = [];
          for (let i = 0; i < 60; i++) step(); R.fjord = {kg:Math.round(holdTotal()), warn:S.log.slice(-40).some(e => /fjordlinja/.test(e.no))};
          b.type = t0; applyVessel(); b.status = 'idle'; return R; })()""")
        print('ladder:', json.dumps(r, ensure_ascii=False))
        lens = [x[1] for x in r['ladder'] if x[2] != 'hav']
        print(ok(len(r['ladder']) >= 14 and all(x[3] for x in r['ladder'] if x[2] == 'hav') and not any(x[3] for x in r['ladder'] if x[2] != 'hav')), 'the ladder runs from the open boat to the ocean fleet, and only the ocean fleet is locked')
        print(ok([o[0] for o in r['offers']] == ['u7', 'h7', 'h8', 'h9', 'h10'] and r['offers'][0][3] < r['offers'][-1][3]), 'five closed-group offers by quota length, the cheapest the smallest')
        print(ok(r['jukGroup'][0] == 1 and r['jukGroup'][1] == 5600), 'the 8.9 m sjark fishes in the open group 8–9.99 m with 5.6 t of cod')
        print(ok(r['fjord']['kg'] == 0 and r['fjord']['warn']), 'a 21 m vessel may not jig inside the fjord line')
        print('errors:', errs[:5]); await br.close()

asyncio.run(main())
