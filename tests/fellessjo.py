"""The same sea for everyone (Bølgene B4, docs/planer/bolgene.md, 5.20q in docs/systemer/vaer-og-hav.md): two pages, opened some
seconds apart, with their boats lying still at the same place under the same weather, must have the same waves at the same world time.
seaHW(x, z, tw) (G3._debug) is the sea's height at a world time tw in real seconds, with the FFT tiles worked out on the page for that
instant (fftSyncAt), so the two pages are compared at one instant even though their workers answer at their own times.
Checks:
  1. both pages have the FFT tiles and the full sea (else the comparison would be of the Gerstner waves alone);
  2. at five points round the boat (0-60 m) and two world times the heights agree within 2 cm (the sea there is 0.5-1 m);
  3. the second page's boat sails eastward for a few seconds, staying in the same 2 km cell, and stops: her own sea (the waves' held
     phases against the shared rule, in metres along each wave, and the FFT tiles' offsets) glides back no faster than the limits
     (0.3 m/s; 0.15 m/s for the short tile), each part faster than 0.05 m/s, and
  4. after it has glided back, the two pages agree again (within 3 cm, the boats being 300 m apart with each one's sea state) at five
     points midway between the boats (inside both wave patches).
Seen red before B4 (the waves' clock was the seconds since each page opened: 39 cm apart with the view's clock in place of the world's).
Not covered: two devices whose clocks differ (here both pages read the same Date.now), a boat crossing into another cell, the GPU.
"""
import asyncio, json, sys
from playwright.async_api import async_playwright
from _env import GAME, boot

ok = lambda c: 'OK  ' if c else 'FEIL'
PLACE = "S.t = Math.round((Date.UTC(2026, 9, 11, 13, 38) - EPOCH) / 6e4); WX_FORCE = {w:11, d:200}; S.mult = 0.00001; const b = S.boat, g = P(68.99, 17.118); b.pos = {x:g.x, y:g.y}; b.heading = 0.4; b.port = null; b.status = 'idle'; b.v = 0;"
SAIL = "(() => { const b = S.boat, g = P(68.99, 17.118); S.mult = 1; S.plan = {wps:[{x:g.x, y:g.y + 0.9, port:null, fish:0}], idx:0, speed:6, returning:false}; b.status = 'sailing'; b.v = 6; })()"
STOP = "(() => { const b = S.boat; S.mult = 0.00001; S.plan = null; b.status = 'idle'; b.v = 0; })()"   # (the game's clock all but stopped again, so she lies where she stopped and does not drift off at six times the speed)
# her own sea against the shared one, in metres: each wave's held phase G against the rule ph0 - k.A (the largest of the 13), and the tiles' offsets
# (the short tile's: each of its two reads' own, NF.OA and NF.OB, B6)
OWN = """() => { const W = G3._debug.wv, N = G3._debug.nf, A = W.A; let g = 0; W.list.forEach((c, i) => { let d = (W.G[i] - (c.ph0 - c.k * (c.Dx * A[0] + c.Dz * A[1]))) % (2 * Math.PI); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; g = Math.max(g, Math.abs(d) / c.k); });
  return JSON.stringify({g, t1:Math.hypot(N.O[0], N.O[1]), t2:Math.max(Math.hypot(N.OA[0], N.OA[1]), Math.hypot(N.OB[0], N.OB[1])), gl:N.gl, A, t:performance.now() / 1000, x:G3._debug.bv.x, z:G3._debug.bv.z}); }"""
PTS = [[0, 0], [12, -7], [-25, 18], [40, 33], [-55, -48]]
HW = """(tw) => { const D = G3._debug, bx = D.bv.x, bz = D.bv.z; return %s.map(([a, c]) => D.seaHW(Math.round(bx / 10) * 10 + a, Math.round(bz / 10) * 10 + c, tw)); }""" % json.dumps(PTS)
STATE = "JSON.stringify({fft:G3._debug.fft.have, one:G3._debug.seaOne, O:Array.from(G3._debug.nf.O).map(v => +v.toFixed(2)), gl:+G3._debug.nf.gl.toFixed(2), x:Math.round(G3._debug.bv.x), z:Math.round(G3._debug.bv.z)})"

async def page(b, errs):
    ctx = await b.new_context(viewport={'width': 320, 'height': 200}); pg = await ctx.new_page()   # (each page its own storage: two players, not one player's two tabs)
    pg.on('pageerror', lambda e: errs.append(str(e)))
    # (the second page starts while the first draws 3D in software: the start screen can take longer than boot's 90 s, so once more)
    for k in range(3):
        try: await boot(pg); break
        except Exception as e:
            if k == 2: raise
            print('boot again:', str(e)[:80])
    await pg.evaluate(PLACE)
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
        # page B sails southward a few seconds and stops in the same cell: her own sea glides back to the shared one, slowly
        await B.evaluate(SAIL); await B.wait_for_timeout(30000); await B.evaluate(STOP); await B.wait_for_timeout(8000)
        # (the software GPU draws a frame every few seconds and the boat gathers way slowly, so her own sea under way is small here: a known
        # offset is laid on her sea lying still instead, 1.2 rad on every wave's held phase and 40 m and 10 m on the tiles, and its glide measured)
        await B.evaluate("(() => { const W = G3._debug.wv, N = G3._debug.nf; for (let i = 0; i < W.list.length; i++) W.G[i] = (W.G[i] + 1.2) % (2 * Math.PI); N.O[0] = 40; N.OA[0] = 10; N.OB[1] = 10; })()")
        o0 = json.loads(await B.evaluate(OWN)); await B.wait_for_timeout(10000); o1 = json.loads(await B.evaluate(OWN))
        dt = o1['t'] - o0['t']; rate = {k: (o0[k] - o1[k]) / dt for k in ('g', 't1', 't2')}
        print('a known offset on her sea (m):', {k: round(o0[k], 2) for k in ('g', 't1', 't2')}, '->', {k: round(o1[k], 2) for k in ('g', 't1', 't2')}, 'over', round(dt, 1), 's, glide', round(o1['gl'], 2), 'cell', o0['A'], o1['A'], 'at', round(o1['x']), round(o1['z']))
        moved = (o0['g'] - o1['g']) + (o0['t1'] - o1['t1']) + (o0['t2'] - o1['t2'])
        print(ok(o0['A'] == o1['A'] and all(0.05 < rate[k] for k in ('g', 't1', 't2')) and rate['g'] <= 0.32 and rate['t1'] <= 0.32 and rate['t2'] <= 0.16), 'stopped after sailing, each part of her own sea (the waves, the long tile, the short tile) glides back to the shared one, no faster than 0.3 m/s (0.15 for the short tile)', {k: round(v, 3) for k, v in rate.items()})
        for _ in range(24):
            if json.loads(await B.evaluate(OWN))['g'] < 0.05 and json.loads(await B.evaluate(OWN))['t2'] < 0.05 and json.loads(await B.evaluate(OWN))['t1'] < 0.05: break
            await B.wait_for_timeout(15000)
        o2 = json.loads(await B.evaluate(OWN)); print('her own sea at the end', {k: round(o2[k], 3) for k in ('g', 't1', 't2')})
        HW2 = """(a) => { const D = G3._debug; return %s.map(([p, q]) => D.seaHW(a[0] + p * 0.35, a[1] + q * 0.35, a[2])); }""" % json.dumps(PTS)
        sa2 = json.loads(await A.evaluate(STATE))   # (midway between the two boats, within 20 m: inside both pages' wave patch, where neither fades it out)
        tw = await A.evaluate("Date.now() / 1000") + 20; at = [round((o2['x'] + sa2['x']) / 20) * 10, round((o2['z'] + sa2['z']) / 20) * 10, tw]
        ha, hb = await A.evaluate(HW2, at), await B.evaluate(HW2, at); w2 = max(abs(x - y) for x, y in zip(ha, hb))
        print('A', await A.evaluate(STATE), 'B', await B.evaluate(STATE))
        print('heights A / B where B stopped:', [round(x, 3) for x in ha], [round(x, 3) for x in hb])
        # (3 cm: the boats now lie 300 m apart, and each one's sea state, the waves' direction and period, is the one where she is)
        print(ok(w2 < 0.03), 'after she has glided back, the two pages have the same waves again between the boats (within 3 cm)', {'worst': round(w2, 4)})
        print('sidefeil:', errs[:3]); await b.close()

if __name__ == "__main__": asyncio.run(main())
