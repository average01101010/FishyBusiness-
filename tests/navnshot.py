"""The name's lettering and ink, and the home port for the others (TP2, steg 109: vessel3d.js nameStyle, nameInk, livName, livHome;
view3d/13-instruments.js drawNames, nameCanvas, nameTex, drawNPCNames). Stand-in players beside her (PEERS), each on a type of her own
and with her own lettering, ink and home port: a kyst15 in antiqua and gold from Kristiansand, a breisjark in narrow block and white from
Kristiansund, a sjark in block with an ink that does not read on her paint (yellow on yellow, so automatic) from Båtsfjord (the long
names and Å of the spot check), and three more in block without a choice, six in all within 250 m. Checks what the frames lettered
(G3._debug.names), that the own boat letters as she is painted, that the name textures stay within their store of 28 and are not made
again frame after frame (createTexture counted), and the milliseconds of the first name in each lettering (MÅLT). Pictures in
tests/out/: navn_<what>_liggende.jpg and navn_<what>_staaende.jpg. Prints OK or FEIL per check."""
from _env import boot
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:700]) if extra != '' else ''), flush=True)


async def shot(pg, path):
    try: await pg.screenshot(path=path, type='jpeg', quality=60, timeout=300000)
    except Exception as e: print('skjermbildet %s kom ikke: %s' % (path, str(e)[:80]))


HOOK = """(() => { const C = window.__ntx = {made:0};
  for (const P of [WebGLRenderingContext.prototype, window.WebGL2RenderingContext && WebGL2RenderingContext.prototype].filter(Boolean)){
    const ct = P.createTexture; P.createTexture = function (){ C.made++; return ct.call(this); }; } })()"""

# the stand-ins: abreast 45 m out towards the camera, 9 m apart, all heading the same way; ids by what they show
PEERS = """(() => { const b = S.boat, bv = G3._debug.bv, e = G3._debug.eye, dx = e[0] - bv.x, dz = e[2] - bv.z, L = Math.hypot(dx, dz) || 1, u = [dx / L, dz / L], v = [-u[1], u[0]];
  const at = (a, w) => ({x:b.pos.x + (u[0] * a + v[0] * w) / 1000, y:b.pos.y + (u[1] * a + v[1] * w) / 1000}), hd = Math.atan2(v[0], -v[1]);
  const pid = nm => (PORTS.find(p => p.name === nm) || {}).id || '';
  const H = {ksand:pid('Kristiansand'), ksund:pid('Kristiansund'), bfj:pid('Båtsfjord')}; PEERS.length = 0;
  const add = (id, vt, nm, a, w, liv) => PEERS.push(Object.assign({id, boat:nm, vtype:vt, hd, v:0, st:'fishing', user:'Kari', fs:0, at:Date.now() + 36e5, liv}, at(a, w)));
  add('navnantikv', 'kyst15', 'Havbris', 45, 0, 'h:marine;k:' + H.ksand + ';n:a.gull;m:VA.112.K');
  add('navnsmalbl', 'breisjark', 'Nordkapp Senior', 45, 12, 'h:oksblod;k:' + H.ksund + ';n:s.hvit;m:MR.12.K');
  add('navnblokkg', 'sjark', 'Åsheim', 45, -12, 'h:gul;k:' + H.bfj + ';n:b.gul;m:F.7.BD');
  add('navnfire00', 'sjark', 'Fjordbris', 70, 20, 'h:hvit;m:T.21.LK'); add('navnfem000', 'sjark', 'Storegga', 70, -20, 'h:kobolt;m:T.22.LK');
  add('navnseks00', 'sjark', 'Måken', 90, 0, 'h:rod;m:T.23.LK');
  return H; })()"""


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        ctx = await br.new_context(viewport={'width': 1280, 'height': 800}); pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script(HOOK)
        await boot(pg)
        await pg.wait_for_function("G3.isActive()", timeout=90000)
        await pg.evaluate("""(() => { WX_FORCE = {w:4, d:250}; S.t = Math.floor(S.t / 1440) * 1440 + 360; S.mult = 0; const b = S.boat; b.status = 'idle'; b.port = null; b.v = 0; PEERS.length = 0;
          const c = G3._debug.cam; c.helm = false; c.dist = 14; c.pitch = 0.12; c.yaw = 1.5; })()""")
        await pg.wait_for_timeout(4000)
        H = await pg.evaluate(PEERS)
        check(all(H.values()), 'hjemhavnene i stikkprøven finnes i spillet (Kristiansand, Kristiansund, Båtsfjord)', H)
        await pg.evaluate("(() => { const c = G3._debug.cam; c.dist = 60; c.pitch = 0.3; })()")
        seen = []
        for _ in range(30):
            await pg.wait_for_timeout(2000)
            await pg.evaluate("G3._debug.names = []"); await pg.wait_for_timeout(1500)
            seen = await pg.evaluate("G3._debug.names || []")
            if len({s['txt'] for s in seen if s['other'] and s['line'] == 'name'}) >= 6: break
        oth = [s for s in seen if s['other']]
        by = {}
        for s in oth: by.setdefault((s['txt'], s['line'], s['kind']), s)
        names = {k[0] for k in by}
        check({'Havbris', 'Nordkapp Senior', 'Åsheim', 'Fjordbris', 'Storegga', 'Måken'} <= names, 'seks spillerbåter innen 250 m får navnet tegnet', sorted(names))
        def one(txt, line='name'): return [s for s in oth if s['txt'] == txt and s['line'] == line]
        kb, ns, sj = one('Havbris'), one('Nordkapp Senior'), one('Åsheim')
        check(kb and all(s['f'] == 'a' and s['ink'] == '#d4a333' for s in kb), 'kyst15 med marineblått skrog: antikva i gull (fargen leses mot malingen)', kb[:3])
        check(ns and all(s['f'] == 's' for s in ns) and any(s['ink'] == '#f7f7f4' for s in ns), 'breisjarken: smal blokk, hvitt der det leses', ns[:3])
        check(sj and all(s['f'] == 'b' for s in sj) and all(s['ink'] in ('#111214', '#f7f7f4') for s in sj), 'sjarken med gult skrog og gul skrift: fargen leses ikke og faller tilbake til svart eller hvitt', sj[:3])
        ports = {s['txt'] for s in oth if s['line'] == 'port'}
        check({'Kristiansand', 'Kristiansund', 'Båtsfjord'} <= ports and not ({'Fjordbris', 'Storegga', 'Måken'} & ports),
              'de andre ser hjemhavna under navnet på hekken (stikkprøven: Kristiansand, Kristiansund, Båtsfjord); en kode uten k: gir ingen', sorted(ports))
        pk = [s for s in oth if s['line'] == 'port' and s['txt'] == 'Kristiansand']
        check(pk and all(s['f'] == 'a' for s in pk), 'hjemhavna står i samme skrift som navnet', pk[:2])
        # the own boat: as she is painted (bought: the test's shop gives at once)
        await pg.evaluate("(() => { giveCos('navn'); S.boat.liv = Object.assign({}, S.boat.liv, {nf:'s', nc:'gull'}); G3._debug.names = []; })()")
        await pg.wait_for_timeout(4000)
        own = [s for s in (await pg.evaluate("G3._debug.names || []")) if not s['other']]
        check(own and all(s['f'] == 's' for s in own), 'egen båt tegner navnet i sin egen skrift', own[:3])
        # the store: the textures alive within 28, and none made again while nothing changes (6 s)
        n0 = await pg.evaluate("({made:window.__ntx.made, nt:G3._debug.nameTex})"); await pg.wait_for_timeout(6000)
        n1 = await pg.evaluate("({made:window.__ntx.made, nt:G3._debug.nameTex})")
        check(n1['nt']['n'] <= 28 and n1['made'] - n0['made'] <= 2, 'navneteksturene holder seg innenfor lageret på 28 med seks båter nær, og lages ikke på nytt bilde for bilde', {'før': n0, 'etter': n1})
        print('MÅLT', json.dumps({'navneteksturer': n1['nt']['n'], 'første_navn_ms': n1['nt']['ms'], 'nye_teksturer_på_6_s': n1['made'] - n0['made']}, ensure_ascii=False), flush=True)
        check(set(n1['nt']['ms']) >= {'a', 's', 'b'}, 'alle tre skriftene er tegnet minst én gang (tida måles)', n1['nt']['ms'])
        await pg.evaluate("(() => { S.boat.liv = Object.assign({}, S.boat.liv); delete S.boat.liv.nf; delete S.boat.liv.nc; })()")
        close = "() => { for (const b of document.querySelectorAll('button[data-close]')) if (/Til sjøs|To sea/.test(b.textContent)) b.click(); }"
        # the pictures: from astern (the transom: the name and the home port) and from ahead (the wheelhouse front), near
        for (pid, dist, off, nm) in (('pnavnantikv', 13, 0.0, 'antikva_hekk'), ('pnavnsmalbl', 14, 0.25, 'smal_hekk'), ('pnavnblokkg', 11, 0.2, 'blokk_hekk')):
            for w in (2500, 2500, 2000): await pg.evaluate("G3.npcLook(%s, %d, 0.12, %f)" % (json.dumps(pid), dist, off)); await pg.wait_for_timeout(w)
            await pg.evaluate(close); await shot(pg, 'navn_%s_liggende.jpg' % nm)
        await pg.set_viewport_size({'width': 800, 'height': 1280})
        for (pid, dist, off, nm) in (('pnavnantikv', 15, 3.0, 'antikva_styrhus'), ('pnavnsmalbl', 16, 0.2, 'smal_hekk')):
            for w in (2500, 2500, 3000): await pg.evaluate("G3.npcLook(%s, %d, 0.12, %f)" % (json.dumps(pid), dist, off)); await pg.wait_for_timeout(w)
            await pg.evaluate(close); await pg.wait_for_timeout(1500); await shot(pg, 'navn_%s_staaende.jpg' % nm)
        await pg.evaluate("G3.npcLook(null)")
        print('sidefeil', errs)
        check(errs == [], 'sidefeil', errs)
        await br.close()

if __name__ == '__main__':
    asyncio.run(main())
