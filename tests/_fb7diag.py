"""Scratch (steg 125): where the hands miss and what goes into people, a pose at a time. python3 tests/_fb7diag.py [scene]"""
from _env import boot, GAME
from lemmer import SET, BOATS, TASKS, frames
import asyncio, json, sys
from playwright.async_api import async_playwright
DIAG = """(([tasks, n]) => { const R = {}, own = (g, p) => { const F = [Math.sin(g.h), -Math.cos(g.h)], Rv = [Math.cos(g.h), Math.sin(g.h)]; return [(p[0] - g.at[0]) * F[0] + (p[2] - g.at[2]) * F[1], p[1] - g.at[1], (p[0] - g.at[0]) * Rv[0] + (p[2] - g.at[2]) * Rv[1]].map(v => +v.toFixed(2)); };
  const C = {}; LEMMER.log = [];
  for (const task of tasks) for (let k = 0; k < n; k++){ const T = 100 + k * 0.37; SJOBEIN.test = {roll:0, pitch:0, T, task}; LEMMER.log.length = 0; LEMMER.things = []; LEMMER.bodies = []; LEMMER.redraw();
    for (const g of LEMMER.log){ const key = (g.walk ? 'gå' : g.task || 'står') + (g.ev ? '*' : ''); for (const i of [0, 1]){ const k2 = key + (i ? ' V' : ' H'), r = R[k2] || (R[k2] = {n:0, nb:0, ao:0, fo:0}); r.n++; if (g.ao[i] > 0.02) r.nb++; if (g.fo && g.fo[i] > r.fo) r.fo = +g.fo[i].toFixed(3);
        if (g.ao[i] > r.ao){ r.ao = +g.ao[i].toFixed(3); r.ov = g.ov[i] && g.ov[i].map(v => +v.toFixed(2)); r.tg = own(g, g.tg[i]); r.idx = g.idx; r.T = +(g.T % 1000).toFixed(2); r.b = +(g.b * 57.3).toFixed(0); r.t = +(g.t * 57.3).toFixed(0); } } }
    for (const o of G3._debug.thingClip(0.01)){ const k3 = o.task + '|' + (o.own ? 'egen' : 'annens') + '|' + o.name + '|' + o.part, c = C[k3]; if (!c || o.cm > c) C[k3] = o.cm; } }
  SJOBEIN.test = null; LEMMER.log = null; LEMMER.things = null; LEMMER.bodies = null; return {R, C}; })"""
async def main():
    scene = sys.argv[1] if len(sys.argv) > 1 else 'arbeid'
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await br.new_page(viewport={'width': 240, 'height': 150}); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + ',folk2'); await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(3000)
        t = (await pg.evaluate(BOATS))[1]
        await pg.evaluate(SET, [t, scene, 1, -0.75, 0.6, 9]); await frames(pg, t, 2)
        try: await pg.wait_for_function("CREW3D.agents().filter(a => a.mode === 'at').length >= 3", timeout=240000)
        except Exception: pass
        await pg.evaluate("LEMMER.log = []"); await frames(pg, t, 1)
        o = await pg.evaluate(DIAG, [TASKS, 30])
        print('--- hender (ao: m fra målet; ov: [utenfor rekkevidde, for nær, i egen kropp]; tg: målet [fram, opp, høyre]; fo: figurens håndledd mot løserens)')
        for k, r in sorted(o['R'].items(), key=lambda q: -q[1]['ao']):
            if r['ao'] > 0.005 or r['fo'] > 0.005: print('%-12s' % k, json.dumps(r))
        print('--- ting i kropper (cm)')
        for k, c in sorted(o['C'].items(), key=lambda q: -q[1]): print('%5.1f  %s' % (c, k))
        print('feil:', errs[:3], 'gl', await pg.evaluate("G3._debug.glErr()"))
        await br.close()
asyncio.run(main())
