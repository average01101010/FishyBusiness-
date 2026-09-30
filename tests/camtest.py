"""The chase camera stays out of quays, the plant's crane and silo, bridge piers and buildings (A11). The camera is swung round the
boat at a low angle, at the plant's quay in Botnhamn and under the Gisund bridge by Finnsnes. For each position: would the eye
without the fix have been inside something, is the eye now outside everything, and is the line from the boat to the eye clear.
Prints OK or FEIL per check."""
from _env import GAME
import asyncio, json, math
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


SWEEP = """async ([dist, pitch]) => {
  const D = G3._debug, c = D.cam, out = []; c.helm = false; c.dist = dist; c.pitch = pitch;
  for (let k = 0; k < 24; k++){
    c.yaw = k / 24 * Math.PI * 2; await new Promise(r => setTimeout(r, 700));
    const bv = D.bv, yw = bv.head + c.yaw, raw = [bv.x - Math.sin(yw) * dist * Math.cos(pitch), bv.y + 1.3 + dist * Math.sin(pitch), bv.z + Math.cos(yw) * dist * Math.cos(pitch)], e = D.eye, tgt = [bv.x, bv.y + 1.3, bv.z];
    out.push({rawIn:D.camInside(raw[0], raw[1], raw[2]), rawFree:+D.camFree(tgt, raw).toFixed(3), in:D.camInside(e[0], e[1], e[2]), free:+D.camFree(tgt, e).toFixed(3), d:+Math.hypot(e[0] - tgt[0], e[1] - tgt[1], e[2] - tgt[2]).toFixed(1)});
  }
  return JSON.stringify(out);
}"""


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 900, 'height': 640})
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(GAME); await pg.wait_for_timeout(1200); await pg.click('#obGo'); await pg.wait_for_timeout(400)
        await pg.evaluate("S.t = Math.round((Date.UTC(2027, 3, 10, 12) - EPOCH) / 6e4); const b = S.boat, q = portById('botnhamn'); b.status = 'port'; b.port = 'botnhamn'; b.pos = {x:q.p.x, y:q.p.y}; b.berth = 'main'; b.moorT = S.t - 60")
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(3000)

        for name, dist, pitch, setup in [
            ('kaia i Botnhamn', 26, 0.08, None),
            ('under Gisundbrua', 45, 0.02, "const b = S.boat; b.status = 'idle'; b.port = null; b.pos = {x:55.515, y:53.125}; b.v = 0; b.heading = 0.6"),
        ]:
            if setup:
                await pg.evaluate(setup); await pg.wait_for_timeout(3000)
            r = json.loads(await pg.evaluate(SWEEP, [dist, pitch]))
            raw_in = sum(1 for x in r if x['rawIn'] or x['rawFree'] < 0.999); now_in = [x for x in r if x['in']]; blocked = [x for x in r if x['free'] < 0.999]
            check(raw_in > 0, name + ': uten rettingen hadde kameraet gått inn i noe eller hatt noe mellom seg og båten', str(raw_in) + ' av 24')
            check(not now_in and not blocked, name + ': øyet er utenfor alt og sikten til båten er fri', {'inne': len(now_in), 'blokkert': [(x['free'], x['d']) for x in blocked]})
            await pg.evaluate("G3._debug.cam.yaw = 2.2"); await pg.wait_for_timeout(1500)
            await pg.screenshot(path='cam_' + ('botn' if 'Botn' in name else 'bru') + '.png')

        ms = await pg.evaluate("(() => { const D = G3._debug, bv = D.bv, t0 = performance.now(); for (let i = 0; i < 2000; i++){ const a = i * 0.01; D.camFree([bv.x, bv.y + 1.3, bv.z], [bv.x + Math.sin(a) * 40, bv.y + 3, bv.z + Math.cos(a) * 40]); } return (performance.now() - t0) / 2000; })()")
        check(ms < 0.2, 'en siktsjekk tar under 0,2 ms', str(round(ms * 1000)) + ' µs')
        print('sidefeil', errs)
        await b.close()

asyncio.run(main())
