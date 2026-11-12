"""The same sea for everyone (Bølgene B4, docs/planer/bolgene.md, 5.20q in docs/systemer/vaer-og-hav.md): two pages, opened some
seconds apart, with their boats lying still at the same place under the same weather, must have the same waves at the same world time.
seaHW(x, z, tw) (G3._debug) is the sea's height at a world time tw in real seconds, with the FFT tiles worked out on the page for that
instant (fftSyncAt), so the two pages are compared at one instant even though their workers answer at their own times.
Checks:
  1. both pages have the FFT tiles and the full sea (else the comparison would be of the Gerstner waves alone);
  2. at five points round the boat (0-60 m) and two world times the heights agree within 2 cm (the sea there is 0.5-1 m);
  3. the same with the second page's boat having sailed and stopped: while she glides back, her sea moves toward the shared one no
     faster than 0.3 m/s (the tiles' own offsets, NF.O, measured over 20 s), and the offsets shrink.
Seen red before B4 (the waves' clock was the seconds since each page opened, and the phases were held where each boat had been).
"""
import asyncio, json, sys
from playwright.async_api import async_playwright
from _env import GAME, boot

ok = lambda c: 'OK  ' if c else 'FEIL'
PLACE = "S.t = Math.round((Date.UTC(2026, 9, 11, 13, 38) - EPOCH) / 6e4); WX_FORCE = {w:11, d:200}; S.mult = 0.00001; const b = S.boat, g = P(68.99, 17.118); b.pos = {x:g.x, y:g.y}; b.heading = 0.4; b.port = null; b.status = 'idle'; b.v = 0;"
SAIL = "(() => { const b = S.boat, g = P(68.99, 17.118); S.mult = 1; S.plan = {wps:[{x:g.x + 0.05, y:g.y - 0.6, port:null, fish:0}], idx:0, speed:6, returning:false}; b.status = 'sailing'; b.v = 6; })()"
STOP = "(() => { const b = S.boat, g = P(68.99, 17.118); S.mult = 0.00001; S.plan = null; b.status = 'idle'; b.v = 0; b.pos = {x:g.x, y:g.y}; })()"
PTS = [[0, 0], [12, -7], [-25, 18], [40, 33], [-55, -48]]
HW = """(tw) => { const D = G3._debug, bx = D.bv.x, bz = D.bv.z; return %s.map(([a, c]) => D.seaHW(Math.round(bx / 10) * 10 + a, Math.round(bz / 10) * 10 + c, tw)); }""" % json.dumps(PTS)
STATE = "JSON.stringify({fft:G3._debug.fft.have, one:G3._debug.seaOne, O:Array.from(G3._debug.nf.O).map(v => +v.toFixed(2)), gl:+G3._debug.nf.gl.toFixed(2), x:Math.round(G3._debug.bv.x), z:Math.round(G3._debug.bv.z)})"

async def page(b, errs):
    ctx = await b.new_context(viewport={'width': 320, 'height': 200}); pg = await ctx.new_page()   # (each page its own storage: two players, not one player's two tabs)
    pg.on('pageerror', lambda e: errs.append(str(e)))
    await boot(pg); await pg.evaluate(PLACE)
    await pg.wait_for_function("G3.isActive() && G3._debug.fft.have", timeout=900000)
    return pg

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        errs = []
        A = await page(b, errs); await A.wait_for_timeout(8000)
        B = await page(b, errs)
        await A.wait_for_timeout(45000)   # (the sea at both answers the weather over some seconds: the same state at the end)
        sa, sb = json.loads(await A.evaluate(STATE)), json.loads(await B.evaluate(STATE))
        print('A', sa, 'B', sb)
        print(ok(sa['fft'] and sb['fft'] and not sa['one'] and not sb['one']), 'both pages have the FFT tiles and the full sea')
        worst = 0; rows = []
        for dt in (20, 33.7):
            tw = await A.evaluate("Date.now() / 1000") + dt
            ha, hb = await A.evaluate(HW, tw), await B.evaluate(HW, tw)
            rows.append([[round(x, 3) for x in ha], [round(x, 3) for x in hb]]); worst = max(worst, max(abs(x - y) for x, y in zip(ha, hb)))
        spread = max(max(r[0]) - min(r[0]) for r in rows)
        print('heights A / B at two world times:', rows)
        print(ok(worst < 0.02 and spread > 0.05), 'lying still at the same place, the two pages have the same waves at the same world time (within 2 cm)', {'worst': round(worst, 4), 'spread of the sea': round(spread, 3)})
        # page B sails a while, then stops where A lies: her own offsets glide back toward the shared sea, slowly
        await B.evaluate(SAIL); await B.wait_for_timeout(30000); await B.evaluate(STOP); await B.wait_for_timeout(4000)
        o0 = json.loads(await B.evaluate(STATE)); t0 = await B.evaluate("performance.now() / 1000")
        await B.wait_for_timeout(20000)
        o1 = json.loads(await B.evaluate(STATE)); t1 = await B.evaluate("performance.now() / 1000")
        n = lambda o, k: (o['O'][k * 2] ** 2 + o['O'][k * 2 + 1] ** 2) ** 0.5
        rates = [(n(o0, k) - n(o1, k)) / (t1 - t0) for k in range(2)]
        print('after sailing: offsets', o0['O'], '->', o1['O'], 'glide', o1['gl'], 'rates m/s', [round(r, 3) for r in rates])
        print(ok(n(o0, 0) + n(o0, 1) > 0.5 and all(r <= 0.31 for r in rates) and (n(o1, 0) + n(o1, 1)) < (n(o0, 0) + n(o0, 1))), 'stopped after sailing, her sea glides back toward the shared one no faster than 0.3 m/s')
        print('sidefeil:', errs[:3]); await b.close()

if __name__ == "__main__": asyncio.run(main())
