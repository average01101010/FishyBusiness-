# 3D far out at large γ and k (H1b R8, docs/planer/havsteget-h1b-rammen.md kap. 3a and R8, 05.11.2026): the boat lies at a ground in
# the Petsjora Sea (γ +31°), off North Iceland (γ −31°, k 1.024) and by Bjørnøya (land in sight), the camera looks straight at the sun
# and then along the wind. Checks, and pictures in both formats (tests/out/hav_<where>_<what>_<w>x<h>.png):
#  - the compass over the 3D view reads the sun's true azimuth (sunAt) when the camera is turned to the sun's grid bearing (az − γ),
#    and the picture has the sun in the middle under it (looked at: the evening sun is low in July)
#  - the compass reads the wind's true direction (windDir) when the camera looks into the wind the waves are drawn from
#  - the scale factor k there, and no GL errors
# Needs the whole coast and dist-vec (Bjørnøya's tiles). 3D, alone. `havshot.py bjornoya` takes one place.
import asyncio, json, math, os, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.environ['KYST_DIST'] = os.path.join(ROOT, 'dist-vec')
from playwright.async_api import async_playwright
from _env import *
ok = lambda c: 'OK  ' if c else 'FEIL'

# where, (lat, lon), the hour (UTC)
SPOTS = [('petsjora', 69.9, 48.0, 18), ('nordisland', 66.8, -18.5, 22), ('bjornoya', 74.45, 18.55, 20)]   # a July evening: the sun low, in the picture

AT = """async ([la, lo, hr]) => { const b = S.boat, p = P(la, lo); S.tut = 0; S.t = Math.round((Date.UTC(2027, 6, 10, hr) - EPOCH) / 6e4); S.mult = 0;
  await mapNeed(p, MAPD.simR); b.type = 'kyst15'; applyVessel(); b.status = 'idle'; b.port = null; b.pos = {...p}; b.v = 0; S.plan = null;
  if (typeof G3 !== 'undefined' && G3.vesselChanged) G3.vesselChanged();
  const s = sunAt(S.t / 60, p);
  return {gamma:+gridGamma(p).toFixed(2), k:+gridScale(p).toFixed(4), sunAz:+(s.az * 180 / Math.PI).toFixed(1), sunEl:+s.el.toFixed(1), wind:+windAt(S.t / 60, p).toFixed(1), windDir:+windDir(S.t / 60, p).toFixed(1)}; }"""

# turn the camera until it looks along the grid bearing g (degrees): the yaw read back from what the camera really does (G3._debug.look)
LOOK = """async ([trueDegWanted]) => { const c = G3._debug.cam; c.helm = false; c.dist = 60; c.pitch = 0.06;
  const p = S.boat.pos, want = ((trueDegWanted - gridGamma(p)) % 360 + 360) % 360;
  const read = () => { const e = G3._debug.look; if (!e || (!e.fx && !e.fz)) return null; return ((Math.atan2(e.fx, -e.fz) * 180 / Math.PI) % 360 + 360) % 360; };
  // (G3._debug.look, not G3.ear: by Bjørnøya a frame under SwiftShader takes more than the 2 s G3.ear allows)
  // after a turn, wait for a frame that shows it (the camera's forward vector changes), up to 40 s
  const fw = () => { const e = G3._debug.look; return e ? e.fx.toFixed(4) + ',' + e.fz.toFixed(4) : ''; };
  const readW = async (prev) => { for (let k = 0; k < 80; k++){ await new Promise(r => setTimeout(r, 500)); if (prev == null || fw() !== prev){ await new Promise(r => setTimeout(r, 500)); return read(); } } return read(); };
  let prev = null;
  for (let i = 0; i < 16; i++){ const g = await readW(prev); if (g == null) break; let d = want - g; d = ((d + 540) % 360) - 180; if (Math.abs(d) < 0.3) break; prev = fw(); c.yaw += d * Math.PI / 180; }
  const g = await readW(null), e = G3._debug.look;
  return {grid:g == null ? null : +g.toFixed(1), want:+want.toFixed(1), shown:g == null || !e ? null : +((trueDeg(g * Math.PI / 180, {x:e.x / 1000, y:e.z / 1000}) % 360 + 360) % 360).toFixed(1)}; }"""

def adiff(a, b): return abs(((a - b + 540) % 360) - 180)

async def main():
    if not os.environ.get('KYST_VEC_BUILT'):
        r = subprocess.run(['node', 'build.mjs'], cwd=ROOT, env=dict(os.environ, KYST_VEC='1'), capture_output=True, text=True)
        print(ok(r.returncode == 0), 'dist-vec/ bygges med vec-pakkene', r.stderr[-200:])
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-compositing'])
        errs = []
        for w, h in ((1280, 800), (800, 1280)):
            pg = await b.new_page(viewport={'width': w, 'height': h}); pg.on('pageerror', lambda e: errs.append(str(e)))
            await boot(pg); pg.set_default_timeout(300000)
            await pg.evaluate("() => { if (!G3.isActive()) G3.show(true); }"); await pg.wait_for_function("G3.isActive()", timeout=60000)
            for tag, la, lo, hr in SPOTS:
                if len(sys.argv) > 1 and tag not in sys.argv[1:]: continue
                r = await pg.evaluate(AT, [la, lo, hr]); print(tag, w, h, json.dumps(r))
                await pg.wait_for_timeout(15000)
                s = await pg.evaluate(LOOK, [r['sunAz']]); print('  sol', s)
                print(ok(s['shown'] is not None and adiff(s['shown'], r['sunAz']) < 1), f'{tag}: kompasset viser sola i sann retning når kameraet ser på den (γ {r["gamma"]}°)', [s['shown'], r['sunAz'], s['grid']])
                await pg.wait_for_timeout(4000); await pg.screenshot(path=f'hav_{tag}_sol_{w}x{h}.png', timeout=120000)
                v = await pg.evaluate(LOOK, [r['windDir']]); print('  vind', v)
                print(ok(v['shown'] is not None and adiff(v['shown'], r['windDir']) < 1), f'{tag}: kompasset viser vinden i sann retning (bølgene kommer derfra)', [v['shown'], r['windDir'], r['wind']])
                await pg.wait_for_timeout(4000); await pg.screenshot(path=f'hav_{tag}_vind_{w}x{h}.png', timeout=120000)
                gl = await pg.evaluate("G3._debug.glErr ? G3._debug.glErr() : 0"); print(ok(not gl), f'{tag}: ingen GL-feil', gl)
            await pg.close()
        print('sidefeil:', errs[:5])
        await b.close()
asyncio.run(main())
