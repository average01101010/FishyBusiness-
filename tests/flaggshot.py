"""The other players' flags and the shared models (TP1, steg 108: view3d/13-instruments.js drawPeerFlags, vessel3d.js livPaint and
livFlag, view3d/20-trawl-seine.js npcKB and its cap). Stand-in players beside her (PEERS): a Swedish pennant, one painted as the first
with nothing bought (Norway in a rectangle) and another mark, and one with her house flag from a made logo. At noon in June their flags
are up and drawn, at 23 down (the same game day: S.t 0 is 06:00, and a clock moved months on makes the game live them all first). Then the measurement for docs/systemer/baater.md 4.23: 20 stand-ins round her, first each in her own paint
and mark ('ulik'), then all in one paint with their own marks ('lik'), and what was sent to the GPU (counted at WebGL's bufferData, so
the same numbers come from a build before the step: KYST_DIST=<that build>), the buffers alive and the frame time; SwiftShader's
milliseconds are only a check. Pictures flagg_liggende.jpg and flagg_staaende.jpg in tests/out/. Prints OK or FEIL per check, and MÅLT
lines with the numbers."""
from _env import boot
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:600]) if extra != '' else ''), flush=True)


async def shot(pg, path):
    try: await pg.screenshot(path=path, type='jpeg', quality=60, timeout=300000)
    except Exception as e: print('skjermbildet %s kom ikke: %s' % (path, str(e)[:80]))


# what WebGL is given: the bytes in static buffers, and the buffers made and deleted
HOOK = """(() => { const C = window.__glc = {bytes:0, made:0, del:0};
  for (const P of [WebGLRenderingContext.prototype, window.WebGL2RenderingContext && WebGL2RenderingContext.prototype].filter(Boolean)){
    const bd = P.bufferData, cb = P.createBuffer, db = P.deleteBuffer;
    P.bufferData = function (t, d, u, ...r){ if (u === 0x88E4 && d && d.byteLength) C.bytes += d.byteLength; return bd.call(this, t, d, u, ...r); };
    P.createBuffer = function (){ C.made++; return cb.call(this); }; P.deleteBuffer = function (b){ if (b) C.del++; return db.call(this, b); }; } })()"""

STAND = """(([mode, n, near]) => { const b = S.boat, pal = HULLPAL.map(e => e[0]).filter(k => k !== 'orig' && palRGB(k)), fl = Object.keys(FLAGS); PEERS.length = 0;
  for (let i = 0; i < n; i++){ const a = i / n * Math.PI * 2, r = near ? 0.02 + 0.012 * i : 0.04 + 0.09 * ((i * 7) % n) / n,
      paint = mode === 'ulik' ? 'h:' + pal[i % pal.length] + (i >= pal.length ? ';r:hvit' : '') : 'h:kobolt;r:hvit';
    PEERS.push({id:'bench' + String(i).padStart(5, '0'), boat:'Måling ' + (i + 1), vtype:'sjark', x:b.pos.x + Math.cos(a) * r, y:b.pos.y + Math.sin(a) * r, hd:a, v:0, st:'fishing', at:Date.now() + 36e5,
      liv:paint + ';f:' + fl[i % fl.length] + '.rekt;m:T.' + (100 + i) + '.LK'}); } })"""

FRAMES = """(() => new Promise(res => { const ts = []; const f = t => { ts.push(t); if (ts.length < 120 && t - ts[0] < 4000) requestAnimationFrame(f); else res(ts); }; requestAnimationFrame(f); })
  .then(ts => { const d = ts.slice(1).map((t, i) => t - ts[i]); return d.length ? Math.round(d.reduce((a, b) => a + b, 0) / d.length * 10) / 10 : 0; }))()"""


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        ctx = await br.new_context(viewport={'width': 1280, 'height': 800}); pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script(HOOK)
        await boot(pg)
        await pg.wait_for_function("G3.isActive()", timeout=90000)
        await pg.evaluate("""(() => { WX_FORCE = {w:7, d:250}; S.t = Math.floor(S.t / 1440) * 1440 + 360; S.mult = 0; const b = S.boat; b.status = 'idle'; b.port = null; b.v = 0; PEERS.length = 0;
          const h = b.heading, add = (id, ax, r, liv) => PEERS.push({id, boat:'Fjordbris', vtype:'sjark', x:b.pos.x + Math.cos(h + ax) * r, y:b.pos.y + Math.sin(h + ax) * r, hd:h + 1.4, v:0, st:'fishing', user:'Kari', fs:0, at:Date.now() + 36e5, liv});
          add('tp1aaaaaaa', 1.25, 0.022, 'h:kobolt;r:hvit;f:SE.vimpel;m:T.112.LK'); add('tp1bbbbbbb', 1.75, 0.03, 'h:kobolt;r:hvit;m:N.12.B'); add('tp1ccccccc', -1.6, 0.03, 'h:oksblod;f:LOGO.rekt;l:g.anker.JH.marine.hvit'); add('tp1ddddddd', 3.0, 0.2, 'h:hvit;f:DK.splitt;m:F.7.H');
          const c = G3._debug.cam; c.helm = false; c.dist = 14; c.pitch = 0.12; c.yaw = 1.5; })()""")
        pf = {}
        for _ in range(30):
            await pg.wait_for_timeout(2000); pf = await pg.evaluate("(G3._debug.peerFlags || null)")
            if not pf or (pf.get('drawn') == 3 and pf.get('near') == 4): break   # (a build without the counters, from before the step, has nothing to wait for)
        pf = pf or {}
        codes = sorted(pf.get('codes') or [])
        check(pf.get('drawn') == 3 and codes == ['LOGO|rekt|g.anker.JH.marine.hvit', 'NO|rekt|', 'SE|vimpel|'],
              'de andre spillernes flagg tegnes: det kjøpte (svensk vimpel), rederiflagget med logoen, og Norge i rektangel uten kjøp', pf)
        # the fourth 200 m off (past the near level's 150 m, where her glass and name are not drawn): her flag is still one of those
        # within 250 m, drawn or left out only because it is out of the picture
        check(pf.get('near') == 4 and pf.get('drawn', 0) + pf.get('out', 0) == 4, 'en båt 200 m unna er også med (innen 250 m, ikke bare der glasset er lastet)', pf)
        mk = await pg.evaluate("""(() => ({keys:Object.keys(NPCMOD).filter(k => /^sjark\\|/.test(k)), bufs:G3._debug.npcBufs || null}))()""")
        kob = [k for k in mk['keys'] if 'h:kobolt' in k]
        check(mk['bufs'] and kob and not any(x in k for k in mk['keys'] for x in ('m:', 'f:', 'l:')) and len(kob) == len(set(k.split('|')[1] for k in kob)),
              'to båter med lik maling og ulikt merke deler modell (nøkkelen er bare malingen), og de malte modellene telles', mk)
        if mk['bufs']:   # (the pictures only of a build with the step: SwiftShader takes minutes over each)
            await pg.wait_for_timeout(3000); await shot(pg, 'flagg_liggende.jpg')
            await pg.set_viewport_size({'width': 800, 'height': 1280}); await pg.wait_for_timeout(5000); await shot(pg, 'flagg_staaende.jpg')
            await pg.set_viewport_size({'width': 1280, 'height': 800})
        await pg.evaluate("S.t = Math.floor(S.t / 1440) * 1440 + 1020"); await pg.wait_for_timeout(3000)
        nd = await pg.evaluate("(G3._debug.peerFlags || {}).drawn")
        check(nd == 0, 'klokka 23 er flaggene til de andre nede (flaggtidene der hun er)', nd)
        # the measurement, the same on a build from before the step: 20 stand-ins round her in view
        await pg.evaluate("(() => { S.t = Math.floor(S.t / 1440) * 1440 + 360; PEERS.length = 0; const c = G3._debug.cam; c.dist = 170; c.pitch = 0.5; c.yaw = 0.7; })()")
        await pg.wait_for_timeout(6000)
        rows = []
        for mode in ('ulik', 'lik'):
            g0 = await pg.evaluate("Object.assign({}, window.__glc)"); nb0 = await pg.evaluate("G3._debug.npcBufs || null")
            await pg.evaluate(STAND + "(%s)" % json.dumps([mode, 20, False]))
            await pg.wait_for_timeout(10000)
            ms = await pg.evaluate(FRAMES)
            g1 = await pg.evaluate("Object.assign({}, window.__glc)")
            nb = await pg.evaluate("G3._debug.npcBufs || null")
            r = {'maling': mode, 'MB_til_GPU': round((g1['bytes'] - g0['bytes']) / 1048576, 2), 'buffere_laget': g1['made'] - g0['made'], 'buffere_slettet': g1['del'] - g0['del'], 'ms': ms,
                 'malte_modeller_laget': nb and nb['made'] - nb0['made'], 'malte_i_live': nb and nb.get('models'), 'malte_MB_sendt': nb and round((nb['up'] - nb0['up']) / 1048576, 2)}
            rows.append(r); print('MÅLT', json.dumps(r, ensure_ascii=False), flush=True)
            await pg.evaluate("PEERS.length = 0"); await pg.wait_for_timeout(2000)
        if mk['bufs']:
            check(rows[1]['MB_til_GPU'] < rows[0]['MB_til_GPU'] / 4 and rows[1]['malte_modeller_laget'] <= 2 and rows[0]['malte_modeller_laget'] >= 20,
                  '20 båter med lik maling og ulikt merke deler modell (høyst én ny per nivå i tellerne) og sender mindre enn en firedel til GPU-en av det 20 ulikt malte gjør', rows)
            # the cap: past it, a painted model not in use is let go with its buffers (the stand-ins gone 20 s, then 13 new paints)
            cp = await pg.evaluate("""(async () => { const B = G3._debug.npcBufs, n0 = B.models, d0 = B.dropped; await new Promise(r => setTimeout(r, 21000));
              const pal = HULLPAL.map(e => e[0]).filter(k => k !== 'orig' && palRGB(k)), b = S.boat; PEERS.length = 0;
              for (let i = 0; i < 13; i++) PEERS.push({id:'cap' + String(i).padStart(7, '0'), boat:'Tak', vtype:'sjark', x:b.pos.x + 0.03 * Math.cos(i), y:b.pos.y + 0.03 * Math.sin(i), hd:0, v:0, st:'fishing', at:Date.now() + 36e5, liv:'h:' + pal[i % pal.length] + ';v:gul'});
              await new Promise(r => setTimeout(r, 12000)); const A = G3._debug.npcBufs; PEERS.length = 0; return {n0, d0, models:A.models, dropped:A.dropped, cap:A.cap}; })()""")
            check(cp['dropped'] > cp['d0'] and cp['models'] <= max(cp['cap'], 13 * 2), 'over taket slippes de malte modellene som ikke er i bruk (bufferne slettes)', cp)
            bp = await pg.evaluate("G3.benchPeers(6)")
            check(bp and len(bp['rows']) == 2 and all(r['ms'] > 0 for r in bp['rows']), '#benchpeer-målingen går og skriver tabellen', bp)
        print('sidefeil', errs)
        check(errs == [], 'sidefeil', errs)
        await br.close()

if __name__ == '__main__':
    asyncio.run(main())
