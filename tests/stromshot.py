"""The sea on a stream in 3D (Ø9 F8b, view3d/14-sea.js, steg 42): on the Husøy ground in a fresh breeze the stream is held (WV.cur.fix)
at none, a metre a second against the wind sea and a metre a second with it, and the waves are read as the shaders and seaH have them
(the same list): against the stream every wind wave is shorter and higher by what curWave gives (worked out here from
(om - k U)^2 = g k, not by the game), the sea's height (4 x the standard deviation of seaH) and the share of breaking crests (capAt)
are up; with it they are down; with none the list is the one it was. Pictures: stromshot_sheet.png (none, against, with) and the sea
against the stream in both formats (stromshot_liggende.png, stromshot_staaende.png). python3 tests/stromshot.py. Prints OK or FEIL."""
from _env import GAME, boot
import asyncio, json, math, os, sys, time
sys.stdout.reconfigure(line_buffering=True)
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw, ImageFont

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out'); os.makedirs(OUT, exist_ok=True)
FONT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
T0 = time.time()
stage = lambda s: print('· %4.0f s  %s' % (time.time() - T0, s), flush=True)


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False)) if extra != '' else ''))


SETUP = "S.t = Math.round((Date.UTC(2027, 3, 10, 13) - EPOCH) / 6e4); WX_FORCE = {w:10, d:315}; S.mult = 0.00001; const b = S.boat, g = GROUNDS[0].p; b.status = 'idle'; b.port = null; b.pos = {x:g.x, y:g.y}; b.v = 0; b.heading = 2.2;"
# the stream held at U m/s along the way the wind sea runs (negative: against it), then the waves, the height and the breaking
READ = """async (U) => { const D = G3._debug, WV = D.WV, wd = D.env.windDir; WV.cur.fix = U == null ? [0, 0] : [wd[0] * U, wd[1] * U]; WV.cur.t = -9;
  await new Promise(r => setTimeout(r, 2500));
  const bx = D.bv.x, bz = D.bv.z, U10 = D.env.wind; let vs = 0;
  for (let p = 0; p < 8; p++){ const px = bx + (p - 3.5) * 26.2, pz = bz + (p - 3.5) * 26.2; let m = 0, q = 0, n = 0; for (let t = 0; t < 60; t += 0.2){ const y = D.seaH(px, pz, t); m += y; q += y * y; n++; } m /= n; vs += Math.max(q / n - m * m, 0); }
  let hit = 0, n = 0; for (let j = 0; j < 120; j++) for (let i = 0; i < 120; i++){ const F = D.foam.capAt(bx + (i - 60) * 1.9 + 0.37 * j, bz + (j - 60) * 1.9, 37.3); if (F.fv > F.th) hit++; n++; }
  return {U, hs:4 * Math.sqrt(vs / 8), cap:hit / n * 100, steep:WV.steep, r:WV.cur.r, wind:U10, list:WV.list.map(c => ({k:c.k, om:c.om, wo:c.wo, sw:c.swell, al:c.Dx * wd[0] + c.Dz * wd[1]}))}; }"""
FPS = "() => new Promise(res => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 > 6000) res(n / 6); else requestAnimationFrame(f); }; requestAnimationFrame(f); })"


def want(om, U):
    c0 = 9.81 / om; x = 1 + 4 * U / c0
    if x <= 0: return 4.0, 2.5
    c = c0 * 0.5 * (1 + math.sqrt(x)); return (c0 / c) ** 2, min(2.5, c0 / math.sqrt(c * (c + 2 * U)))


def drawn(om, U):
    # as the sea is drawn (14-sea.js): the wavenumber held at twice, the height of a wave near blocking faded to 0.3 from k / k0 2 to 4
    kf, af = want(om, U); t = max(0, min(1, (kf - 2) / 2)); return min(kf, 2), af * (1 - 0.7 * t * t * (3 - 2 * t))


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 800, 'height': 500})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + '#notut'); await pg.evaluate(SETUP)
        await pg.set_viewport_size({'width': 320, 'height': 200})
        await pg.wait_for_function("G3.isActive() && G3._debug.SSL.w.on && G3._debug.SSL.n.on", timeout=900000)
        await pg.set_viewport_size({'width': 800, 'height': 500}); await pg.wait_for_timeout(4000)
        stage('the sea is up')
        check(await pg.evaluate("!!(G3._debug.WV.cur && G3._debug.WV.cur.on)"), 'the stream on the waves is on (WV.cur)')
        R = {}; tiles = []
        for key, U, lab in (('none', None, 'ingen strøm'), ('against', -1.0, '1 m/s (1,9 kn) motstrøm'), ('with', 1.0, '1 m/s medstrøm')):
            R[key] = await pg.evaluate(READ, U); f = os.path.join(OUT, 'stromshot_%s.png' % key); await pg.screenshot(path=f); tiles.append((f, lab + ' · Hs %.2f m' % R[key]['hs'])); stage(key)
        n0, ag, wi = R['none'], R['against'], R['with']
        print('  ingen: Hs %.2f m, brytning %.2f %%, skarphet %.2f | mot: Hs %.2f m, brytning %.2f %%, skarphet %.2f (r %.2f) | med: Hs %.2f m, brytning %.2f %%, skarphet %.2f (r %.2f)' % (n0['hs'], n0['cap'], n0['steep'], ag['hs'], ag['cap'], ag['steep'], ag['r'], wi['hs'], wi['cap'], wi['steep'], wi['r']))
        for key, U in (('against', -1.0), ('with', 1.0)):
            bad = []
            for a, c in zip(n0['list'], R[key]['list']):
                kf, af = drawn(a['om'], U * a['al'])
                if abs(c['k'] / a['k'] - kf) > 0.02 * kf or abs(c['wo'] / a['wo'] - af) > 0.02 * af or abs(c['om'] - a['om']) > 1e-6: bad.append([round(2 * math.pi / a['k'], 1), round(c['k'] / a['k'], 3), round(kf, 3), round(c['wo'] / a['wo'], 3), round(af, 3)])
            check(not bad, key + ': every wave has the wavenumber of (om - k U)^2 = g k and the height the wave action gives, at its own frequency', bad)
        check(n0['r'] == 1 and abs(n0['steep'] - (0.3 + 0.55 * max(0, min(1, (n0['wind'] - 4) / 10)) ** 2 * (3 - 2 * max(0, min(1, (n0['wind'] - 4) / 10))))) < 0.02, 'with no stream the sea is as before', {'steep': round(n0['steep'], 3)})
        check(ag['hs'] > 1.1 * n0['hs'] and wi['hs'] < 0.97 * n0['hs'], 'the sea stands higher against the stream and lower with it (seaH)', {'against': round(ag['hs'] / n0['hs'], 2), 'with': round(wi['hs'] / n0['hs'], 2)})
        check(ag['cap'] > 1.3 * n0['cap'] and wi['cap'] < n0['cap'], 'more crests break against the stream, no more with it (the share over the whitecap threshold)', {'none': round(n0['cap'], 2), 'against': round(ag['cap'], 2), 'with': round(wi['cap'], 2)})
        check(ag['steep'] > n0['steep'] and ag['steep'] <= 0.95 and wi['steep'] < n0['steep'], 'the sharpness goes with the compression the stream adds, under 0.95', {'none': round(n0['steep'], 2), 'against': round(ag['steep'], 2), 'with': round(wi['steep'], 2)})
        ims = [Image.open(f).convert('RGB') for f, _ in tiles]; sh = Image.new('RGB', (800 * 3, 500), 'white')
        for i, (im, (_, lab)) in enumerate(zip(ims, tiles)):
            d = ImageDraw.Draw(im); d.rectangle([0, 0, 800, 24], fill=(0, 0, 0)); d.text((8, 3), lab, font=FONT, fill='white'); sh.paste(im, (i * 800, 0))
        sh.save(os.path.join(OUT, 'stromshot_sheet.png'))
        # the frame rate with the stream on the waves and without (the same shaders, so the same work: SwiftShader's numbers only compare)
        await pg.evaluate("G3._debug.WV.cur.fix = [0, 0]; G3._debug.WV.cur.t = -9"); await pg.wait_for_timeout(1500); f0 = await pg.evaluate(FPS)
        await pg.evaluate("(() => { const D = G3._debug, wd = D.env.windDir; D.WV.cur.fix = [-wd[0], -wd[1]]; D.WV.cur.t = -9; })()"); await pg.wait_for_timeout(1500); f1 = await pg.evaluate(FPS)
        print('  bilder i sekundet under SwiftShader (bare til sammenligning; skyggerne er de samme): uten %.2f, motstrøm %.2f' % (f0, f1))
        # the sea against the stream in both formats
        for tag, w, h in (('liggende', 1280, 800), ('staaende', 800, 1280)):
            await pg.set_viewport_size({'width': w, 'height': h}); await pg.wait_for_timeout(5000); await pg.screenshot(path=os.path.join(OUT, 'stromshot_%s.png' % tag)); stage(tag)
        print('sidefeil', errs)
        await b.close()

asyncio.run(main())
