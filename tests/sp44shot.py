"""Steg 44 (M7/M8-resten, docs/planer/butikker-og-sponsorer.md): the partner's flag on its own pole by the banner waves with the wind
(view3d/07-harbour-unit.js signFlag: it hangs in a calm, flies straight out in a breeze and turns downwind), the buildings carry the
banner's place themselves (anchors.sign, read by signF), and a partner's paint design is on the boat in 3D in the paint shop with its
mark on the hull. With the made-up test sponsor (#sptest), at the shop in Finnsnes. Pictures in both formats. Prints OK or FEIL."""
from _env import boot, GAME
import asyncio, json
from playwright.async_api import async_playwright


async def shot(pg, path):
    try: await pg.screenshot(path=path, timeout=150000)
    except Exception as e: print('skjermbildet %s kom ikke: %s' % (path, str(e)[:80]))


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:500]) if extra != '' else ''))


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await br.new_page(viewport={'width': 1280, 'height': 800}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + ',sptest')
        await pg.wait_for_function("SPN.list.some(r => r.kind === 'sign')", timeout=15000)
        # it starts in a calm (the 3D view takes the first wind as it is, and eases to a new one over many frames)
        await pg.evaluate("""(() => { S.boat.type = 'sjark'; applyVessel(); S.boat.status = 'port'; S.boat.port = 'finnsnes'; S.boat.berth = 'main'; const q = portById('finnsnes'); S.boat.pos = {x:q.p.x, y:q.p.y};
          S.cash = 50000; WX_FORCE = {w:0.5, d:250}; S.mult = 0; S.t = Math.round((Date.UTC(2027, 5, 12, 12) - EPOCH) / 6e4); renderActs(); G3.show(true); G3.vesselChanged && G3.vesselChanged(); })()""")
        await pg.wait_for_timeout(5000)
        await pg.evaluate("SPM.fix.el = 30; G3.signAt('front', 14)")
        s1 = None
        for _ in range(15):
            await pg.wait_for_timeout(2000); s1 = await pg.evaluate("G3.signs")
            if s1['flags'] > 0 and s1['flag']['droop'] > 0: break
        check(s1['anchors']['shop'] and s1['anchors']['s'] and s1['anchors']['y'] and s1['anchors']['a'], 'byggene har bannerets plass i modellen (anchors.sign): butikken, butikk-enheten, verftet og mottaket', s1['anchors'])
        c = s1['flag']
        check(s1['flags'] > 0 and c['wind'] < 1.5 and c['droop'] > 1.2 and c['amp'] < 0.07, 'i stille henger flagget langs stanga', c)
        await shot(pg, 'flagg_stille_liggende.png')
        # the wind comes up while the paint shop is looked at
        await pg.evaluate("WX_FORCE = {w:9, d:250}; G3.signAt(null)")
        # the partner's design on the boat in the paint shop
        await pg.evaluate("DOCK.open('maler')"); await pg.wait_for_selector('#drawerBody .pnt-sp'); await pg.wait_for_timeout(4000)
        d = await pg.evaluate("""(async () => { const q = s => document.querySelector('#drawerBody ' + s); q('[data-pa=pntsp]').click(); await new Promise(r => setTimeout(r, 300));
          return {sp:PAINTPRE && PAINTPRE.sp, hull:(hullLiv(S.boat) || {}).hull, logo:!!logoStrips(S.boat.type), fits:['ripe', 'vann'].map(k => designFits(S.boat.type, k))}; })()""")
        check(d['sp'] == -9 and d['hull'] and abs(d['hull'][1] - 0.32) < 0.01, 'designet prøves på båten i 3D', d)
        await pg.wait_for_timeout(8000); await shot(pg, 'design_liggende.png')
        await pg.set_viewport_size({'width': 800, 'height': 1280}); await pg.evaluate("document.querySelector('#drawerBody .pnt-sp').scrollIntoView({block:'center'})"); await pg.wait_for_timeout(8000); await shot(pg, 'design_staaende.png')
        await pg.set_viewport_size({'width': 1280, 'height': 800})
        # the mark from the sponsor's own picture (logo_url): fetched as the game fetches it (with CORS) and put on the hull. The picture
        # here is drawn in the page and given as a data address, which the same path takes
        lg = await pg.evaluate("""(async () => { const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#c8102e'; g.beginPath(); g.arc(64, 64, 46, 0, 7); g.fill();
          g.fillStyle = '#ffffff'; g.font = 'bold 44px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('NU', 64, 66); spPaintOf(-9).sponsor.logo = cv.toDataURL();
          const L = spPaintLogo(spPaintOf(-9)); return {kind:L.kind, url:String(L.url).slice(0, 22)}; })()""")
        logos = []
        for _ in range(20):
            await pg.wait_for_timeout(2000); logos = (await pg.evaluate("G3.signs"))['logos']
            if 'x:' in logos: break
        check(lg['kind'] == 'u' and 'x:' in logos, 'med logo_url er merket på skroget sponsorens bilde (hentet og lagt i en tekstur)', [lg, logos])
        await pg.wait_for_timeout(4000); await shot(pg, 'design_logo_liggende.png')
        # the design is put on, and another player's boat beside her wears it too: read from her paint code against the list
        pe = await pg.evaluate("""(async () => { document.querySelector('#drawerBody [data-pa=pntgo]').click(); await new Promise(r => setTimeout(r, 300)); DOCK.close();
          const b = S.boat; PEERS.length = 0; PEERS.push({id:'cccccccccc', boat:'Fjordbris', vtype:'sjark', x:b.pos.x + 0.025, y:b.pos.y + 0.01, hd:1.2, v:0, st:'fishing', user:'Kari', fs:0, at:Date.now(), liv:'h:rod;x:-9'});
          return {own:b.liv, str:livStr(b)}; })()""")
        mods = []
        for _ in range(25):
            await pg.wait_for_timeout(2000); await pg.evaluate("PEERS.forEach(q => q.at = Date.now())")
            mods = await pg.evaluate("Object.keys(NPCMOD).filter(k => /x:-9/.test(k))")
            if mods: break
        check(pe['own'].get('sp') == -9 and 'x:-9' in pe['str'] and any(k.endswith('|x') for k in mods), 'en annen spillers båt med designet i malingskoden bygges i 3D med designets maling', [pe, mods])
        await pg.evaluate("(() => { const c = G3._debug.cam; c.helm = false; c.dist = 30; c.pitch = 0.2; c.yaw = -1.9; })()")
        await pg.wait_for_timeout(8000); await shot(pg, 'design_andre_liggende.png')
        e1 = (await pg.evaluate("G3.signs"))['ensign']['ph']; await pg.wait_for_timeout(3000); e2 = (await pg.evaluate("G3.signs"))['ensign']['ph']
        check(e2 > e1 >= 0, 'båtens eget flagg: bølgens fase legges sammen bilde for bilde', [e1, e2])
        await pg.evaluate("G3.signAt('front', 14)")
        f = None
        for _ in range(60):
            await pg.wait_for_timeout(3000); f = (await pg.evaluate("G3.signs"))['flag']
            if f['wind'] > 8.5: break   # (it flies straight out from 8 m/s; the 3D view eases to the new wind)
        check(f['wind'] > 8.5 and f['droop'] < 0.02 and f['z'] > 0.05, 'i frisk bris (9 m/s) står flagget ut fra stanga og bølger', f)
        tips = [f['tip']]
        for _ in range(3): await pg.wait_for_timeout(2500); tips.append((await pg.evaluate("G3.signs"))['flag']['tip'])
        check(max(tips) - min(tips) > 0.01, 'duken beveger seg fra bilde til bilde (det ytterste hjørnet)', tips)
        await shot(pg, 'flagg_bris_liggende.png')
        print('sidefeil', errs)   # (before the last picture: SwiftShader can take minutes over it, and the run's time may end there)
        await pg.set_viewport_size({'width': 800, 'height': 1280}); await pg.wait_for_timeout(6000); await shot(pg, 'flagg_bris_staaende.png')
        print('sidefeil', errs)
        await br.close()

asyncio.run(main())
