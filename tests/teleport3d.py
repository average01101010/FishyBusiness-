"""3D for the whole coast (phase K8 of the coast plan, view3d.js): the boat is moved to Kirkenes, Honningsvåg, Reine, Bergen, Hvaler
and Senja, and at each the far terrain's window follows it, the far heights' pack (200 m) comes, the mountains stand where they
should, there is no GL error and no page error, and a picture is taken (tests/out/tp_<place>.png). The frame rate is printed, but
SwiftShader's says nothing about a tablet. Then the quality: 'low' shortens the near terrain and draws fewer pixels, and 'auto'
steps down when the frames are slow and back up when there is room, but not at once to the level it left. Prints OK or FEIL per check."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


# the places: lat, lon near the harbour, and how high the ground within the far terrain's window must reach (m; the far heights are
# 200 m cells, so the tops come out lower than on the map)
PLACES = [('kirkenes', 69.727, 30.06, 200), ('honningsvag', 70.975, 25.985, 250), ('reine', 67.93, 13.095, 600),
          ('bergen', 60.40, 5.29, 450), ('hvaler', 59.03, 11.0, 40), ('senja', 69.36, 17.40, 600)]
# a sea point near (lat, lon): the nearest 100 m cell that the national core has as sea at least 300 m from the land
SEA = """([la, lo]) => { const c = P(la, lo); for (let r = 0; r <= 60; r++) for (let a = 0; a < Math.max(1, r * 6); a++){
  const t = a / Math.max(1, r * 6) * 2 * Math.PI, q = {x:c.x + Math.cos(t) * r * 0.1, y:c.y + Math.sin(t) * r * 0.1};
  if (!isLandFar(q) && coastDistFar(q) >= 0.3) return q; } return null; }"""


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-compositing'])
        pg = await b.new_page(viewport={'width': 1100, 'height': 700})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        # a June forenoon, so the pictures have daylight (the sun is still Senja's until phase K10)
        await pg.evaluate("() => { S.cash = 1e6; S.t = Math.round((Date.UTC(2027, 5, 15, 9) - EPOCH) / 6e4); if (!G3.isActive()) G3.show(true); }")
        await pg.wait_for_function("G3.isActive()", timeout=60000)
        R = {}
        for name, la, lo, hmin in PLACES:
            q = await pg.evaluate(SEA, [la, lo])
            if not q:
                check(False, name + ': fant sjø nær stedet'); continue
            await pg.evaluate("""(q) => { const b = S.boat; b.status = 'idle'; b.port = null; b.pos = {x:q.x, y:q.y}; S.plan = null; S.draft = []; b.v = 0; }""", q)
            # the window moves and the far pack comes: wait for the far terrain round the boat to be built from it
            try:
                await pg.wait_for_function("""(q) => { const T = G3._debug.TERR; return T && !T.stale && Math.abs(T.cx - q.x * 1000) <= 10000 && Math.abs(T.cz - q.y * 1000) <= 10000 && mapFarIn(q); }""", arg=q, timeout=90000)
            except Exception as e:
                print('     (venter fortsatt:', name, str(e)[:80], ')')
            await pg.wait_for_timeout(2500)
            r = await pg.evaluate("""(q) => { const T = G3._debug.TERR, M = G3._debug.MIDM; let hmax = -1e9; for (const v of T.h) hmax = Math.max(hmax, v);
              let mmax = -1e9; if (M) for (const v of M.h) mmax = Math.max(mmax, v);
              return {far:mapFarIn(q), view:mapViewIn(q), hmax:Math.round(hmax), mid:Math.round(mmax), win:[Math.round(T.cx / 1000), Math.round(T.cz / 1000)], boat:[+q.x.toFixed(1), +q.y.toFixed(1)], gl:G3._debug.glErr(), fps:+G3._debug.fps.toFixed(1), mb:+(MAPD.bytes / 1e6).toFixed(1), land:isLand(q)}; }""", q)
            await pg.screenshot(path='tp_' + name + '.png')
            # the picture is not one colour: the spread of the grey levels
            spread = await pg.evaluate("""() => new Promise(res => { const c = document.getElementById('gl'), w = 64, h = 40, o = document.createElement('canvas'); o.width = w; o.height = h; requestAnimationFrame(() => { const x = o.getContext('2d'); x.drawImage(c, 0, 0, w, h); const d = x.getImageData(0, 0, w, h).data; let s = 0, s2 = 0, n = 0; for (let i = 0; i < d.length; i += 4){ const g = (d[i] + d[i + 1] + d[i + 2]) / 3; s += g; s2 += g * g; n++; } res(Math.sqrt(s2 / n - (s / n) ** 2)); }); })""")
            r['spread'] = round(spread, 1); R[name] = r
            print('  ', name.ljust(12), json.dumps(r))
            check(r['far'] and not r['land'] and r['gl'] == 0 and r['hmax'] >= hmin and r['spread'] > 4, name + ': fjernhøydene er inne, fjellene når %d m eller mer, ingen GL-feil, og bildet har innhold' % hmin, r['hmax'])
        check(all(abs(v['win'][0] - v['boat'][0]) <= 10 and abs(v['win'][1] - v['boat'][1]) <= 10 for v in R.values()), 'fjernterrenget følger båten (vinduet innen 10 km)')
        check(max(v['mb'] for v in R.values()) < 96, 'minnet til kartblokkene holder seg under budsjettet (96 MB) etter seks steder', max(v['mb'] for v in R.values()))
        print('bilder/s i SwiftShader (sier lite om et nettbrett):', {k: v['fps'] for k, v in R.items()})
        # quality: low draws fewer pixels and a shorter near terrain
        q0 = await pg.evaluate("(() => ({w:document.getElementById('gl').width, near:G3._debug.NEARM && G3._debug.NEARM.sx}))()")
        await pg.evaluate("() => { G3._debug.QUAL.fix = false; G3.quality('low'); }"); await pg.wait_for_timeout(2500)
        q1 = await pg.evaluate("(() => ({w:document.getElementById('gl').width, near:G3._debug.NEARM && G3._debug.NEARM.sx, lvl:G3.quality().lvl}))()")
        check(q1['lvl'] == 0 and q1['near'] < q0['near'] and q1['w'] <= q0['w'], 'Lav: kortere nærterreng og ikke flere piksler', (q0, q1))
        # auto: 5 s at 20 frames a second steps down twice, 13 s at 60 does not go back up at once, after two minutes it does
        a = await pg.evaluate("""() => { const Q = G3._debug.QUAL, tick = G3._debug.qualTick; G3.quality('auto'); Q.lvl = 2; Q.cap = 2; Q.bad = Q.good = 0; let now = 1e6; const out = [];
          for (let i = 0; i < 50; i++) tick(0.1, 20, now += 100); out.push(Q.lvl); for (let i = 0; i < 50; i++) tick(0.1, 20, now += 100); out.push(Q.lvl);
          for (let i = 0; i < 130; i++) tick(0.1, 60, now += 100); out.push(Q.lvl); now += 120000; for (let i = 0; i < 130; i++) tick(0.1, 60, now += 100); out.push(Q.lvl);
          Q.fix = true; Q.lvl = 2; return out; }""")
        check(a == [1, 0, 0, 1], 'Auto: ned ett nivå etter 4 s under 28 bilder/s, ikke straks opp igjen, opp etter to minutter med god margin', a)
        # the setting on the phone: Auto, Lav, Middels, Høy
        await pg.evaluate("PHONE.open('innst')"); nb = await pg.evaluate("document.querySelectorAll('#phView [data-pa=q3d]').length"); await pg.evaluate("PHONE.show(false)")
        check(nb == 4, 'Innstillinger på telefonen har grafikkvalget (Auto, Lav, Middels, Høy)', nb)
        check(not errs, 'ingen sidefeil', errs[:3])
        await b.close()

asyncio.run(main())
