"""Kystkartet (core/09m-kystkart.js, ui/05h-kystkart.js; docs/planer/oppdrag-2.md K2): the Milepæler app's tab shows the small chart
of the whole coast and the four counts, filled from what the game has done (landings at two plants, a lighthouse picture, a fishing
hour in Vestfjorden); «Vis i sjøkartet» lays the marks over the chart plotter from the whole coast, with a bar that closes them again.
Screenshots in both formats (kk-*.png). Prints OK or FEIL per check."""
from _env import GAME, OUT, boot
import asyncio, json, os
from playwright.async_api import async_playwright


def ok(c):
    return 'OK  ' if c else 'FEIL'

SETUP = """(() => {
  const pl = kkPlants(); S.sales = (S.sales || []).concat([{t:S.t, total:9000, port:pl[2].id, det:{ln:[['torsk', 40]]}}, {t:S.t, total:4000, port:pl[40].id, det:{ln:[['sei', 30]]}}]);
  achState(); S.ach.sp.torsk = 1; S.ach.sp.sei = 1; kkFyr(10); kkFyr(60);
  const keep = S.boat.status; S.boat.status = 'fishing'; const p0 = S.boat.pos; S.boat.pos = P(68.0, 14.6); S.t = Math.ceil(S.t / 10) * 10; kkMinute(); S.boat.pos = p0; S.boat.status = keep;
  return kkCount(); })()"""

TAB = """(async () => { PHONE.show(true); PHONE.open('merker'); PHONE.dact('merker', 'sub', {s:'kart'}); PHONE.render(); await new Promise(r => setTimeout(r, 150));
  const v = document.getElementById('phView'), t = v.innerText;
  return {txt:/Kystkartet/.test(t) && /Mottak du har levert til/.test(t) && /Fyr du har fotografert/.test(t), mot:v.querySelectorAll('.kk-map .kk-mot').length,
    motOn:v.querySelectorAll('.kk-map .kk-mot.on').length, fyrOn:v.querySelectorAll('.kk-map .kk-fyr.on').length, omrOn:v.querySelectorAll('.kk-map .kk-omr.on').length,
    omr:v.querySelectorAll('.kk-map .kk-omr').length, btn:!!v.querySelector('[data-pa=kkmap]'), area:/område 00/.test(t), sp:v.querySelectorAll('.kk-chip.on').length}; })()"""

CHART = """(async () => { document.querySelector('#phView [data-pa=kkmap]').click(); await new Promise(r => setTimeout(r, 900));
  const bar = document.getElementById('kkBar'), s = document.getElementById('map');
  const r = {bar:!!bar && !bar.hidden && /Mottak 2\\/\\d+/.test(bar.innerText), plot:document.body.classList.contains('vplot'), z:view.z, wide:MAP_H / view.z > 1000,
    mot:document.querySelectorAll('svg:not(.kk-map) .kk-mot').length, on:document.querySelectorAll('svg:not(.kk-map) .kk-mot.ring').length, omr:document.querySelectorAll('svg:not(.kk-map) .kk-omr.on').length};
  return r; })()"""

OFF = """(async () => { document.querySelector('#kkBar [data-k=x]').click(); await new Promise(r => setTimeout(r, 400));
  return {gone:document.getElementById('kkBar').hidden, marks:document.querySelectorAll('svg:not(.kk-map) .kk-mot').length}; })()"""


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await (await b.new_context(viewport={'width': 800, 'height': 1280})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME)
        c = await pg.evaluate(SETUP)
        print(json.dumps(c))
        print(ok(c['mottak'][0] == 2 and c['mottak'][1] >= 150 and c['fyr'] == [2, 134] and c['omr'][0] == 1 and c['omr'][1] == 60 and c['arter'][0] == 2),
              'the counts: two plants landed at, two lighthouses, one area (Vestfjorden), two species, of 161, 134, 60 and 10')
        t = await pg.evaluate(TAB)
        print(json.dumps(t))
        print(ok(t['txt'] and t['mot'] == c['mottak'][1] and t['motOn'] == 2 and t['fyrOn'] == 2 and t['omrOn'] == 1 and t['omr'] == 60 and t['btn'] and t['area'] and t['sp'] == 2),
              'the Milepæler app\'s tab: the chart with every plant, lighthouse and area, the ones had in colour, the counts, the lists and the button')
        await pg.evaluate("document.querySelector('#phView .kk-card').scrollIntoView()"); await pg.wait_for_timeout(150)
        await pg.screenshot(path=os.path.join(OUT, 'kk-staaende.png'))
        await pg.set_viewport_size({'width': 1280, 'height': 800}); await pg.evaluate("PHONE.render()"); await pg.wait_for_timeout(250)
        await pg.evaluate("document.querySelector('#phView .kk-card').scrollIntoView()"); await pg.wait_for_timeout(150)
        await pg.screenshot(path=os.path.join(OUT, 'kk-liggende.png'))
        m = await pg.evaluate(CHART)
        print(json.dumps(m))
        print(ok(m['bar'] and m['plot'] and m['wide'] and m['on'] == 2 and m['omr'] == 1),
              '«Vis i sjøkartet»: the plotter from the whole coast with a ring round the two plants landed at, the area fished, and the bar with the counts')
        await pg.wait_for_timeout(1500); await pg.screenshot(path=os.path.join(OUT, 'kk-kart-liggende.png'))
        await pg.set_viewport_size({'width': 800, 'height': 1280}); await pg.wait_for_timeout(1500); await pg.screenshot(path=os.path.join(OUT, 'kk-kart-staaende.png'))
        o = await pg.evaluate(OFF)
        print(ok(o['gone'] and o['marks'] == 0), 'the bar\'s × takes the marks off the chart again', o)
        r = await pg.evaluate("""(async () => { kkChart(true); await new Promise(r => setTimeout(r, 400)); const on = KK.on; document.body.classList.add('routing'); renderStatic(); const off = !KK.on && document.getElementById('kkBar').hidden;
          document.body.classList.remove('routing'); kkChart(true); await new Promise(r => setTimeout(r, 300)); setBodyView(true); const off3d = !KK.on; setBodyView(false); return {on, off, off3d}; })()""")
        print(ok(r['on'] and r['off'] and r['off3d']), 'the layer goes by itself when a route is being laid and when the 3D view opens (Jonas: never noise while navigating)', r)
        print('errors:', errs[:3])
        await b.close()

asyncio.run(main())
