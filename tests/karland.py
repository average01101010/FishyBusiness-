"""the landing of an open boat's fish tubs (docs/planer/fiskekar-dekk.md; for Jonas, not in run.py): the snekke at the plant in Torsken
with her two tubs, the crane's sling put on, the tub lifted, swung and set on the quay, the forklift with the full tubs and with the
washed ones, and the empty tub set back on its place; the crane and the sling at each step, in both formats (or one: liggende).
    TAG=x python3 tests/karland.py [liggende|staaende] [type=snekke]"""
import asyncio, os, sys, json
sys.path.insert(0, os.path.dirname(__file__))
from _env import boot, HERE
ROOT = os.path.dirname(HERE)
from playwright.async_api import async_playwright
OUT = os.path.join(ROOT, 'tests', 'out')
async def main():
    args = [a for a in sys.argv[1:] if '=' not in a]; kw = dict(a.split('=', 1) for a in sys.argv[1:] if '=' in a); vt = kw.get('type', 'snekke')
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        FMT = {'liggende': (1280, 800), 'staaende': (800, 1280)}; tag = os.environ.get('TAG', '')
        for f in (args or list(FMT)):
            w, h = FMT[f]; pg = await br.new_page(viewport={'width': w, 'height': h}); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await boot(pg); await pg.wait_for_function("G3.isActive()", timeout=120000); await pg.wait_for_timeout(2000)
            info = await pg.evaluate("""((vt) => { S.tut = 0; S.mult = 0.00001; S.t = Math.round((Date.UTC(2027, 2, 9, 11) - EPOCH) / 6e4); const q = portById('torsken'), b = S.boat; b.type = vt; b.holdLv = 0; applyVessel();
              b.status = 'port'; b.port = 'torsken'; b.pos = {...q.p}; b.land = null; S.plan = null; S.crew = []; G3.vesselChanged();
              S.hold = [{sp:'torsk', cls:1, kg:Math.min(BOAT.holdCap, 820), n:200, bled:true, iced:true, hr:0, fresh:95, gut:true, hook:true}]; startLanding(false);
              const t0 = performance.now() / 1000; for (let i = 0; i < 60; i++) G3._debug.stepBoat(0.05, t0 + i * 0.05, 0); return JSON.stringify(b.land); })""", vt)
            print(f, 'land', info, flush=True)
            await pg.wait_for_function("!!G3._debug.PLANTS.find(q => q.id === 'torsken').scene", timeout=180000)
            L = json.loads(info); pr = await pg.evaluate('LANDING.prep'); lf = 2.5; wash = await pg.evaluate('LANDING.wash'); n = L['n']
            T = lambda j: pr + j * lf + (wash if j >= n else 0)
            steps = [('1_krok_ned', T(0) + 0.27 * lf, 6.5, 0.55, 1.9), ('2_hektet', T(0) + 0.40 * lf, 6.5, 0.55, 1.9), ('3_loftet', T(0) + 0.52 * lf, 9, 0.35, 1.5), ('4_svinger', T(0) + 0.66 * lf, 13, 0.4, 1.2),
                     ('5_kaia', T(0) + 0.84 * lf, 11, 0.45, 0.7), ('6_truck', T(n - 1) + 0.86 * lf + 1.2, 16, 0.5, 0.9), ('7_tomme', T(n) - 0.6, 14, 0.5, 0.9), ('8_tilbake', T(n) + 0.62 * lf, 10, 0.45, 1.4), ('9_satt_ned', T(n) + 0.88 * lf, 6.5, 0.6, 1.9)]
            for nm, e, dist, pitch, yaw in steps:
                await pg.evaluate(f"(() => {{ S.boat.land.t0 = S.t + liveFrac() - {e}; const c = G3._debug.cam; c.helm = false; c.dist = {dist}; c.pitch = {pitch}; c.yaw = {yaw}; }})()")
                hnd = await pg.wait_for_function("""(e) => { const P = G3._debug.PLANTS.find(q => q.id === 'torsken'), s = P.scene; if (!s || Math.abs(s.e - e) >= 0.3) return null;
                  return {e:+s.e.toFixed(2), i:s.i, u:+s.u.toFixed(2), hang:!!s.hang, att:!!s.att, quay:s.quay.length, fk:s.fk.loads.length, tubs:G3._debug.kitStat.tubs}; }""", arg=e, timeout=240000)
                print(f, nm, json.dumps(await hnd.json_value()), flush=True)
                await pg.wait_for_timeout(1500)
                await pg.screenshot(path=os.path.join(OUT, 'karland_' + tag + '_' + vt + '_' + nm + '_' + f + '.png'), timeout=400000)
            print(f, 'errors', errs, flush=True); await pg.close()
        await br.close()
asyncio.run(main())
