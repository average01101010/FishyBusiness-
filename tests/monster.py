"""The sea has no lattice (Bølgene B6, 5.20t in docs/systemer/vaer-og-hav.md; Jonas' video 12.11.2026: «repiterende geometriske
mønstre»). The short FFT tile, laid side by side, made the whitecaps' flecks and the glitter repeat every 24.7 m in the world's axes.
Looking straight down from 160 m on the open sea in a fresh breeze (whitecaps out), a square of the picture away from the boat and her
wake is correlated with itself shifted: a tile repeated shows as side peaks of the autocorrelation where the shift is a tile.
Checks:
  1. the full sea with the FFT tiles is drawn (else this would measure the Gerstner waves);
  2. no side peak of the mean autocorrelation (four pictures 15 s apart, left and right of the boat; a tile is some 120 px here)
     stands 7 standard deviations over the ring of shifts it lies in (a lattice is a sharp spot, chance is not);
  3. the picture is not flat (its spread over 4 grey levels), so a quiet picture cannot pass for one without a lattice;
  4. under way her own short sea (nfShift) moves smoothly: sailing 80 m in steps of 2 cm, no step changes the short tile's height (its two
     reads alone) at five places more than 6 times the usual step, while with the offsets folded in the world, as before the kontroll, it jumps.
Seen red before B6: 9.8 on the code before it, at a shift of (-33, 109) px, the tile at 24.7 m read once; some 5 after, with no
place of its own. (The peak's height alone, 0.05, did not tell them apart: the few big flecks of foam give chance peaks as high.)
Not covered: the long tile's 173 m (wider than the picture here), dusk and night, the phone (NOFFT).
"""
import asyncio, io, json, sys
import numpy as np
from PIL import Image
from playwright.async_api import async_playwright
from _env import GAME, boot

ok = lambda c: 'OK  ' if c else 'FEIL'
SETUP = """(() => { cloudAt = () => 0.05; S.settings.q3d = 'high'; S.t = Math.round((Date.UTC(2026, 9, 15, 10, 51) - EPOCH) / 6e4); WX_FORCE = {w:11, d:315}; S.mult = 0.00001;
  const b = S.boat, g = P(68.9618, 17.091); b.pos = {x:g.x, y:g.y}; b.heading = 0; b.port = null; b.status = 'idle'; b.v = 0; })()"""

def acs(png):
    a = np.asarray(Image.open(io.BytesIO(png)).convert('L'), float); h, w = a.shape; out = []
    for c in (a[h // 2 - 300:h // 2 + 300, w - 600:w - 20], a[h // 2 - 300:h // 2 + 300, 20:600]):   # (left and right of the boat and her wake in the middle)
        c = c - c.mean(); F = np.fft.fft2(c); ac = np.real(np.fft.ifft2(F * np.conj(F))); out.append((np.fft.fftshift(ac / ac[0, 0]), float(c.std())))
    return out

def side_peak(A):
    # (the mean over the pictures: a lattice stands where it stands in every one, the chance peaks of a few big flecks of foam do not.
    # Then, ring by ring of the shift (4 px wide, from 30 px out: within that the picture's own smoothness), how far the ring's highest
    # point stands over the ring, in its standard deviations: a tile repeated is a sharp spot where the shift is a tile, chance is not)
    m = np.mean([x for x, sp in A], 0); cy, cx = np.array(m.shape) // 2; yy, xx = np.ogrid[:m.shape[0], :m.shape[1]]; r = np.hypot(yy - cy, xx - cx); best = (0.0, None)
    for r0 in range(30, 260, 4):
        ring = (r >= r0) & (r < r0 + 4); v = m[ring]; z = float((v.max() - np.median(v)) / (v.std() + 1e-9))
        if z > best[0]: i = int(np.argmax(np.where(ring, m, -9))); best = (z, (i // m.shape[1] - int(cy), i % m.shape[1] - int(cx)))
    return best

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 320, 'height': 200}); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg); await pg.evaluate(SETUP)
        await pg.wait_for_function("G3.isActive() && G3._debug.fft.have", timeout=900000)
        await pg.set_viewport_size({'width': 1280, 'height': 800})
        await pg.evaluate("(() => { const c = G3._debug.cam; c.helm = false; c.dist = 160; c.pitch = 1.5; c.yaw = 0.3; c.zoom = 1; })()")
        await pg.wait_for_timeout(25000)
        # (the panels and buttons hidden, so only the sea is measured)
        await pg.evaluate("(() => { const cv = [...document.querySelectorAll('canvas')].sort((a, b) => b.width * b.height - a.width * a.height)[0]; for (const el of document.querySelectorAll('body *')) if (!el.contains(cv) && el !== cv) el.style.visibility = 'hidden'; })()")
        st = json.loads(await pg.evaluate("JSON.stringify({fsh:G3._debug.fftShape, one:G3._debug.seaOne, lite:G3._debug.seaLite})"))
        print(ok(st['fsh'] and not st['one'] and not st['lite']), 'the full sea with the FFT tiles is drawn', st)
        A = []
        for k in range(4):
            if k: await pg.wait_for_timeout(15000)
            png = await pg.screenshot(timeout=300000); A += acs(png); open('monster-%d.png' % k, 'wb').write(png)
        v, sh = side_peak(A); sps = [round(sp, 1) for x, sp in A]
        print('the sharpest side peak of the mean autocorrelation:', round(v, 2), 'standard deviations over its ring, at a shift of', sh, 'px; spreads', sps)
        print(ok(v < 7), 'no side peak of the mean autocorrelation stands 7 standard deviations over its ring: no tile repeated', round(v, 2))
        print(ok(all(sp > 4 for sp in sps)), 'the pictures are not flat (spread over 4 grey levels)', sps)
        # under way her own short sea moves with her (nfShift): its pattern must move smoothly, with no jump where its offsets are folded.
        # Steps of 2 cm along 30 degrees for 80 m (past four folds), the short tile's height read at five places after each (no time between): a jump is a step whose
        # change is many times the usual one. The same with the offsets folded in the world, as before the kontroll, must jump.
        JUMP = '''(old) => { const D = G3._debug, N = D.nf, a = 0.52, P = [[0, 0], [7, 3], [-12, 9], [21, -15], [-30, -22]].map(([x, z]) => [D.bv.x + x, D.bv.z + z]);
          const sv = [Array.from(N.O), Array.from(N.OA), Array.from(N.OB), Array.from(N.rp)]; N.O2W = [0, 0]; let prev = P.map(p => D.fftTrH(p[0], p[1], true)[1]); const d = [];
          for (let i = 0; i < 4000; i++){ (old ? D.nfShiftOld : D.nfShift)(0.02 * Math.cos(a), 0.02 * Math.sin(a)); const v = P.map(p => D.fftTrH(p[0], p[1], true)[1]); d.push(Math.max(...v.map((x, k) => Math.abs(x - prev[k])))); prev = v; }
          N.O.set(sv[0]); N.OA.set(sv[1]); N.OB.set(sv[2]); N.rp.set(sv[3]); const s = d.slice().sort((x, y) => x - y); return {max:s[s.length - 1], med:s[s.length >> 1]}; }'''
        jn, jo = await pg.evaluate(JUMP, False), await pg.evaluate(JUMP, True)
        rn, ro = jn['max'] / max(jn['med'], 1e-9), jo['max'] / max(jo['med'], 1e-9)
        print('the largest step against the usual one, sailing 80 m:', round(rn, 1), '(with the offsets folded in the world as before:', round(ro, 1), ')')
        print(ok(rn < 6 and ro > 2 * rn), 'under way the short sea moves smoothly, with no jump where its offsets fold (and the old fold does jump)', round(rn, 1), round(ro, 1))
        print('sidefeil:', errs[:3]); await b.close()

if __name__ == "__main__": asyncio.run(main())
