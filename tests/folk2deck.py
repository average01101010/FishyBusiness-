"""The new people on deck (Folk 2, FB7, steg 125): with #folk2 in the address drawWorker draws the look's skinned figure, posed from
the joints the solver finds (figpose.js figFromJoints), in one draw call (two with the small palette, #folk2pal=37). Checked on the
middle one of the coast's boats hauling line and nets: the figures and their draw calls counted, the hands against what they hold in
haul, gutw, pick and pack (told, not a gate, from the sixth session: the moments are chance, and the gate is tests/folk2maal.py), the limbs' lengths against the skeleton's for the body drawn, and the time of a figure drawn for real
(the driver made to finish) with and without the mark, on the same place, clock and seed. Without the mark nothing skinned is drawn.

  python3 tests/folk2deck.py            the checks (prints OK or FEIL)
  python3 tests/folk2deck.py bilder     the pictures to docs/okter/2026-11-13-125/: the deck at work close in, without and with the
                                        mark, both formats (linetrekk, garntrekk, pause)
"""
from _env import boot, GAME
from lemmer import SET, BOATS, AGG, frames, check
import asyncio, json, os, sys
from playwright.async_api import async_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = os.path.join(ROOT, 'docs', 'okter', '2026-11-13-125')
ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
HOLD = ('haul', 'gutw', 'pick', 'pack')


async def page(br, url, w=240, h=150):
    pg = await br.new_page(viewport={'width': w, 'height': h}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    await boot(pg, url); await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(3000)
    return pg, errs


async def at_work(pg, t, scene, n=3):
    await pg.evaluate(SET, [t, scene, 1, -0.75, 0.6, 9]); await frames(pg, t, n)
    try: await pg.wait_for_function("CREW3D.agents().filter(a => a.mode === 'at').length >= 3", timeout=240000)
    except Exception: pass


async def measure(pg, t, mark):
    """One page: the count and the time on the line haul, and (with the mark) the hands and the lengths as the game runs."""
    out = {}
    await at_work(pg, t, 'arbeid')
    await pg.evaluate("SJOBEIN.test = {T:103.1}; G3._debug.figStat(true); LEMMER.log = []"); n0 = await pg.evaluate("LEMMER.fr"); await frames(pg, t, 3)
    out['stat'] = await pg.evaluate("G3._debug.figStat()"); out['frames'] = await pg.evaluate("LEMMER.fr") - n0; out['crew'] = await pg.evaluate("CREW3D.visible().length")
    out['ms'] = await pg.evaluate("(() => { let best = 9e9; for (let k = 0; k < 3; k++) best = Math.min(best, LEMMER.bench(4)); return best; })()")
    await pg.evaluate("LEMMER.log = null; SJOBEIN.test = null")
    if not mark: return out
    R = {}; C = {}
    for scene in ('arbeid', 'garn', 'pause'):
        await at_work(pg, t, scene, 2)
        for _ in range(3):
            await pg.evaluate("LEMMER.log = []"); await frames(pg, t, 3)
            R = await pg.evaluate("(R) => { const L = LEMMER.log; LEMMER.log = null; return (%s)(L, R); }" % AGG, R)
            # nothing through a person (Jonas 13.11.2026): the things of one frame against the bodies of the same frame, as the game runs
            await pg.evaluate("LEMMER.things = []; LEMMER.bodies = []; LEMMER.redraw()")
            for o in await pg.evaluate("(() => { const o = G3._debug.thingClip(0.01); LEMMER.things = null; LEMMER.bodies = null; return o; })()"):
                k = '%s|%s|%s|%s' % (o['task'], 'egen' if o['own'] else 'annens', o['name'], o['part']); C[k] = max(C.get(k, 0), o['cm'])
    out['C'] = C
    out['R'] = R; out['len'] = await pg.evaluate("({m:limbLen('m'), f:limbLen('f'), sh:LEMMER.SH})")
    return out


async def checks(br):
    pg, e0 = await page(br, GAME); boats = await pg.evaluate(BOATS); t = boats[1]
    A = await measure(pg, t, False); await pg.close()
    check(not A['stat']['prog'] and A['stat']['figs'] == 0, 'uten #folk2 finnes ikke skinnprogrammet, og ingen skinnet figur tegnes', A['stat'])
    pg, e1 = await page(br, GAME + ',folk2'); B = await measure(pg, t, True)
    s = B['stat']; per = s['calls'] / max(1, s['figs'])
    check(s['prog'] and s['figs'] >= B['crew'] and per == (1 if s['nb'] >= 58 else per) and 1 <= per <= 3, 'med #folk2: %d figurer tegnet i %d tegnekall (%.2f per figur, %d bein per kall, enheten har %d vektorer; %d om bord, %d bilder)' % (s['figs'], s['calls'], per, s['nb'], s['maxV'], B['crew'], B['frames']))
    check(s['tris'] / max(1, s['figs']) < 7200, 'trekanter per figur: %d' % round(s['tris'] / max(1, s['figs'])))
    print('tid per figur i drawDeckCrew, tegnet for alvor (beste av tre, programvare-GPU, %d×%d): uten merket %.2f ms, med %.2f ms' % (240, 150, A['ms'], B['ms']), flush=True)
    check(B['ms'] < A['ms'] * 1.5 + 0.5, 'en figur koster ikke mer enn før (innenfor halvannen gang på programvare-GPU-en, der skinningen går på prosessoren)', [round(A['ms'], 2), round(B['ms'], 2)])
    R = B['R']; L = B['len']; print('lengdene (m):', json.dumps(L), flush=True)
    seen = [k for k in HOLD if k in R]; check(len(seen) == len(HOLD), 'haul, gutw, pick og pack er sett i spillet slik det går', sorted(R.keys()))
    for k in seen:
        # (Jonas 14.11.2026, «Valg A»: the moments a running game happens to show are told, not held against a limit: the gutter gave 1.5 to 33.9 cm in six runs.
        # The gate is the fixed sweep, tests/folk2maal.py: 5 cm for a hand at a real place, 3 cm for a man's own thing inside him)
        r = R[k]; w = max(r['miss'], r['over']); print('tall %s: hendene fra det de holder i øyeblikkene denne kjøringen fanget: verst %.1f cm (%d figurer; opplysning, porten er folk2maal)' % (k, w * 100, r['n']), flush=True)
    # (punkt 12: nothing he holds himself is in him; held to the face up to 3 cm. Another's thing in him is printed, a place's matter)
    own = {k: v for k, v in B['C'].items() if '|egen|' in k and not (k.endswith('|hodet') and v <= 3.0)}
    print('tall egne ting i kroppen i øyeblikkene denne kjøringen fanget (cm, over 1; opplysning, porten er folk2maal):', json.dumps(dict(sorted(own.items(), key=lambda q: -q[1])[:12]), ensure_ascii=False), flush=True)
    oth = {k: v for k, v in B['C'].items() if '|annens|' in k and v >= 3}
    print('andres ting i en kropp (cm, 3 og over):', json.dumps(dict(sorted(oth.items(), key=lambda q: -q[1])[:15]), ensure_ascii=False), flush=True)
    std = L['m']
    for nm, no in (('ua', 'overarm'), ('fa', 'underarm'), ('th', 'lår'), ('sn', 'legg')):
        lo = min(r[nm][0] for r in R.values()); hi = max(r[nm][1] for r in R.values())
        check(max(abs(lo - std[nm]), abs(hi - std[nm])) <= 0.001, '%s er skjelettets egen lengde innen 1 mm (%.3f m for mannen, %.3f for kvinnen): %.4f–%.4f' % (no, std[nm], L['f'][nm], lo, hi))
    gerr = await pg.evaluate("G3._debug.glErr()"); check(gerr == 0, 'ingen GL-feil', gerr)
    await pg.close()
    # the small palette: two draw calls a figure
    pg, e2 = await page(br, GAME + ',folk2,folk2pal=37'); await at_work(pg, t, 'arbeid'); await pg.evaluate("G3._debug.figStat(true)"); await frames(pg, t, 2)
    s = await pg.evaluate("G3._debug.figStat()"); per = s['calls'] / max(1, s['figs'])
    check(s['nb'] == 37 and s['figs'] > 0 and 1 < per <= 3, 'med liten palett (#folk2pal=37): %.2f tegnekall per figur' % per, s)
    gerr = await pg.evaluate("G3._debug.glErr()"); check(gerr == 0, 'ingen GL-feil med liten palett', gerr)
    await pg.close()
    check(not (e0 + e1 + e2), 'ingen sidefeil', (e0 + e1 + e2)[:3])


async def shots(br):
    os.makedirs(SHOTS, exist_ok=True)
    for tag, url in (('uten', GAME), ('med', GAME + ',folk2')):
        pg, errs = await page(br, url, 1280, 800); boats = await pg.evaluate(BOATS); t = boats[1]
        for vw, vh, fmt in [(1280, 800, 'liggende'), (800, 1280, 'staaende')]:
            await pg.set_viewport_size({'width': vw, 'height': vh})
            for name, scene, wind in (('linetrekk', 'arbeid', 15), ('garntrekk', 'garn', 15), ('pause', 'pause', 15)):
                await pg.evaluate(SET, [t, scene, wind, -0.9, 0.32, 5.6 * (1.35 if fmt == 'staaende' else 1)]); await frames(pg, t, 3)
                try: await pg.wait_for_function("CREW3D.agents().filter(a => a.mode === 'at').length >= 3", timeout=240000)
                except Exception: pass
                await pg.evaluate("SJOBEIN.test = {T:103.1}"); await frames(pg, t, 2)
                await pg.screenshot(path=os.path.join(SHOTS, f'dekk_{name}_{tag}_{fmt}.jpg'), type='jpeg', quality=72)
                print(name, tag, fmt, json.dumps(await pg.evaluate("CREW3D.agents().map(a => a.mode + ':' + a.task)")), flush=True)
                await pg.evaluate("SJOBEIN.test = null")
        check(not errs, 'ingen sidefeil (%s)' % tag, errs[:3]); await pg.close()


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=ARGS)
        if sys.argv[1:] and sys.argv[1] == 'bilder': await shots(br)
        else: await checks(br)
        await br.close()

if __name__ == '__main__':
    asyncio.run(main())
