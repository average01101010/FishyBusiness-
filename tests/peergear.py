"""The other players' gear in the sea (tilbakemelding #35, 07.10.2026; ui/10h-world.js gearSync, supabase/migrations/20261007200000_gear.sql):
this company's sets go up when they change and every five minutes, the others' near the boat come down once a minute, nothing of the
owner comes with them, the chart draws them in grey and does not let a tap hit them, and a database without the functions is left alone.
A mock stands in for the database. Prints OK or FEIL per check."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await br.new_page(viewport={'width': 1000, 'height': 700}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        r = await pg.evaluate("""(async () => { const R = {}, b = S.boat, g = b.pos, calls = []; const real = cloudRpc;
          let miss = false; window.cloudRpc = async (fn, a) => { calls.push([fn, a]); if (miss) throw new Error('rpc ' + fn + ' 404');
            if (fn === 'gear_near') return [['garn', g.x + 0.5, g.y, g.x + 0.7, g.y + 0.1], ['line', g.x - 0.4, g.y - 0.2, g.x - 0.9, g.y - 0.3], ['bad']]; return null; };
          S.sets = [{id:'s1', kind:'garn', vid:S.cur, a:{x:g.x + 0.1, y:g.y + 0.1}, b:{x:g.x + 0.2, y:g.y + 0.1}}, {id:'s2', kind:'line', vid:S.cur, lost:5, a:{x:g.x, y:g.y}, b:{x:g.x, y:g.y}}];
          PEERGEAR.length = 0; Object.assign(GEARP, {sig:'', put:0, got:0, at:null, off:false});
          let now = 1e6; await gearSync(now); R.first = calls.map(c => c[0]); R.sent = calls[0][1].sets; R.n = PEERGEAR.length; R.keys = Object.keys(PEERGEAR[0]).join(',');
          calls.length = 0; await gearSync(now + 20000); R.quiet = calls.length;                                   // nothing changed, a minute not gone
          S.sets.push({id:'s3', kind:'teine', vid:S.cur, a:{x:g.x + 0.3, y:g.y}, b:{x:g.x + 0.31, y:g.y}}); calls.length = 0; await gearSync(now + 40000); R.changed = calls.map(c => c[0]);
          calls.length = 0; await gearSync(now + 100000); R.minute = calls.map(c => c[0]);
          const svg = gearSvg(1); R.peerLines = (svg.match(/class="gline peer"/g) || []).length; R.peerBuoys = (svg.match(/class="buoy peer"/g) || []).length;
          R.hit = !!gearHit({x:g.x + 0.5, y:g.y}, 0.05);                                                         // a tap on another's buoy is not a hit
          miss = true; GEARP.sig = ''; await gearSync(now + 500000); R.off = GEARP.off; R.cleared = PEERGEAR.length; window.cloudRpc = real; return R; })()""")
        print(json.dumps(r))
        print(ok(r['first'] == ['gear_put', 'gear_near'] and len(r['sent']) == 1 and r['sent'][0][:2] == ['s1', 'garn'] and r['n'] == 2 and r['keys'] == 'k,a,b'), 'the sets up and the others\' down: only what stands (not what is lost), a bad row dropped, and nothing of the owner', r['keys'])
        print(ok(r['quiet'] == 0 and r['changed'] == ['gear_put'] and r['minute'] == ['gear_near']), 'nothing is sent again until a set changes or five minutes have gone, and the others are fetched once a minute', (r['quiet'], r['changed'], r['minute']))
        print(ok(r['peerLines'] == 2 and r['peerBuoys'] == 4 and not r['hit']), 'the chart draws the others\' sets in grey, and a tap does not hit them', (r['peerLines'], r['peerBuoys'], r['hit']))
        print(ok(r['off'] and r['cleared'] == 0), 'a database without the functions (404) is left alone and the others\' sets are gone', (r['off'], r['cleared']))
        print('errors:', errs[:3]); await br.close()

asyncio.run(main())
