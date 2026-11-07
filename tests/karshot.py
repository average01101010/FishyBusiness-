"""screenshots of the fish tubs on the open boats (docs/planer/fiskekar-dekk.md; for Jonas, not in run.py): for each boat without a
hold (skiff, trebat, snekke) the deck from above and from the quarter with the tubs at a set fill, in both formats.
    TAG=for python3 tests/karshot.py [liggende|staaende] [types=skiff,trebat] [fill=0.1,0.5,1]"""
import asyncio, os, sys, json
sys.path.insert(0, os.path.dirname(__file__))
from _env import boot, HERE
ROOT = os.path.dirname(HERE)
from playwright.async_api import async_playwright
SET = """((a) => { const [t, fill, hour] = a, b = S.boat; S.tut = 0; S.mult = 0; S.t = Math.round((Date.UTC(2027, 2, 12, hour) - EPOCH) / 6e4);
  b.type = t; b.holdLv = a[3] || 0; applyVessel(); G3.vesselChanged(); S.boatName = 'Havbris'; S.equip = {}; S.jobs = []; S.cargo = []; b.gop = null; S.pgear = newPGear(); b.rig = 'juksa';
  S.crew = []; const g = GROUNDS[0].p, kg = BOAT.holdCap * fill;
  S.hold = kg > 0 ? [{sp:'torsk', kg:kg * 0.7, gut:true, iced:true}, {sp:'sei', kg:kg * 0.2, gut:true, iced:true}, {sp:'hyse', kg:kg * 0.1, gut:true, iced:true}] : [];
  // the work on deck (arbeid): bled fish waiting in the bleeding tub, someone gutting and icing, a hand aboard on the bigger boats
  if (a[4]){ S.hold.push({sp:'torsk', kg:BOAT.tubCap * 0.7, gut:false, iced:false}, {sp:'sei', kg:8, gut:true, iced:false}); b.deckStop = true; if (VESSELS[t].crewMax > 1) S.crew = [Object.assign(genCrew(), {bi:false, off:false})]; }
  window.__KH = a[4] ? JSON.stringify(S.hold) : null;
  b.status = 'fishing'; b.port = null; b.pos = {x:g.x, y:g.y}; b.heading = 0.4; b.v = 0; b.fishUntil = S.t + 600; S.plan = null; })"""
OUT = os.path.join(ROOT, 'tests', 'out')
async def main():
    args = [a for a in sys.argv[1:] if '=' not in a]; kw = dict(a.split('=', 1) for a in sys.argv[1:] if '=' in a)
    types = kw.get('types', 'skiff,trebat,snekke').split(','); fills = [float(x) for x in kw.get('fill', '0.5').split(',')]; lv = int(kw.get('lv', '0')); work = kw.get('work', '0') == '1'
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        FMT = {'liggende': (1280, 800), 'staaende': (800, 1280)}; tag = os.environ.get('TAG', '')
        for f in (args or list(FMT)):
            w, h = FMT[f]; print(f, 'start', flush=True)
            pg = await br.new_page(viewport={'width': w, 'height': h}); errs = []; pg.on('pageerror', lambda e: errs.append((e.stack or str(e))[:700]))
            await boot(pg); await pg.wait_for_function("G3.isActive()", timeout=120000); await pg.wait_for_timeout(3000)
            for t in types:
                for fl in fills:
                    await pg.evaluate(SET, [t, fl, 11, lv, work]); await pg.wait_for_timeout(6000)
                    print(t, fl, json.dumps(await pg.evaluate("({cap:BOAT.holdCap, kit:G3._debug.kitStat.tubs, ice:G3._debug.kitStat.icebox, agents:CREW3D.on() ? CREW3D.agents().map(a => [a.st, a.mode, +a.x.toFixed(2), +a.z.toFixed(2)]) : null})")), flush=True)
                    for nm, cam in (("topp", "c.dist = 9; c.pitch = 1.42; c.yaw = 0.0;"), ("kvart", "c.dist = 6.5; c.pitch = 0.62; c.yaw = -0.7;")):
                        await pg.evaluate("(() => { const c = G3._debug.cam; c.helm = false; " + cam + " })()")
                        for _ in range(4): await pg.evaluate("(() => { if (window.__KH) S.hold = JSON.parse(window.__KH); })()"); await pg.wait_for_timeout(900)
                        await pg.screenshot(path=os.path.join(OUT, 'kar_' + tag + ('a' if work else '') + '_' + t + '_' + str(int(fl * 100)) + '_' + nm + '_' + f + '.png'), timeout=400000)
            print(f, 'errors', len(errs), sorted(set(errs))[:3], flush=True)
            await pg.close()
        await br.close()
asyncio.run(main())
