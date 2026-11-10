"""The sea bed and the sky behind the sea are not drawn (Ø3b, 10.11.2026; view3d/17-draw.js dryIdx, dryThr, skyMask): the terrain's grids
leave out the triangles that lie wholly under the sea, and the sky is not shaded behind the sea's plane. The picture must be the same,
pixel for pixel: the same frame is drawn with both on, both off and both on again with the clocks frozen, by the naust and out at sea
in a fresh breeze. Also: how much is left out, that all of it is drawn again when the eye is not over the tide, and that the fleet's
states are worked out once a frame. Pictures seabed_<place>.png. Prints OK or FEIL."""
from _env import boot, GAME, OUT
import asyncio, io, os, json
from playwright.async_api import async_playwright
from PIL import Image, ImageChops


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


NEXT = "() => new Promise(res => { let k = 0; const f = () => { if (++k < 4) requestAnimationFrame(f); else res(1); }; requestAnimationFrame(f); })"
IDLE = "(() => { const t = G3._debug.tjobs; return t.jobs.length + (t.g ? 1 : 0) + (t.sh ? 1 : 0) + (t.w ? 1 : 0) + t.rcq; })()"


def diff(a, c):
    d = ImageChops.difference(a, c).convert('L'); hist = d.histogram()
    return {'ulike': a.size[0] * a.size[1] - hist[0], 'over8': sum(hist[9:]), 'bbox': d.getbbox()}


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        errs = []
        for place in ('naust', 'sjo'):
            ctx = await b.new_context(viewport={'width': 160, 'height': 256}); pg = await ctx.new_page()
            pg.on('pageerror', lambda e: errs.append(str(e)))
            await boot(pg, GAME + '#glchk')
            await pg.evaluate("""(place) => { S.t = Math.round((Date.UTC(2027, 5, 15, 11) - EPOCH) / 6e4); WX_FORCE = {w:place === 'sjo' ? 10 : 4, d:200};
              if (place === 'sjo'){ const b = S.boat, q = P(69.62, 17.45); b.status = 'idle'; b.port = null; S.plan = null; S.draft = []; b.pos = {x:q.x, y:q.y}; b.heading = 0.6; b.v = 0; }
              if (!G3.isActive()) G3.show(true); }""", place)
            await pg.wait_for_function("G3.isActive()", timeout=120000)
            for i in range(60):
                await pg.wait_for_timeout(3000)
                if i > 4 and await pg.evaluate(IDLE) == 0: break
            await pg.evaluate("() => { for (const b of document.querySelectorAll('button[data-close]')) if (/Til sjøs|To sea/.test(b.textContent)) b.click(); const c = G3._debug.cam; c.helm = false; c.dist = 26; c.pitch = 0.26; }")
            await pg.wait_for_timeout(3000)
            calls = await pg.evaluate("""() => new Promise(res => { const f0 = npcStates; let n = 0, k = 0; npcStates = function(H, only){ if (!only) n++; return f0(H, only); };
              const f = () => { if (k === 0) n = 0; if (++k <= 6) requestAnimationFrame(f); else { npcStates = f0; res(n / 6); } }; requestAnimationFrame(f); })""")
            await pg.set_viewport_size({'width': 400, 'height': 640}); await pg.evaluate(NEXT)
            await pg.evaluate("() => { const t = performance.now(), d = Date.now(); performance.now = () => t; Date.now = () => d; }")
            shots = {}
            for tag, off in [('paa', False), ('av', True), ('paa2', False)]:
                await pg.evaluate("(o) => G3._debug.dryOff(o, o)", off); await pg.evaluate(NEXT)
                if tag == 'paa': st = await pg.evaluate("G3._debug.dry")
                shots[tag] = Image.open(io.BytesIO(await pg.screenshot(timeout=300000))).convert('RGB')
            shots['paa'].save(os.path.join(OUT, f'seabed_{place}.png'))
            noise, d = diff(shots['paa'], shots['paa2']), diff(shots['av'], shots['paa'])
            print(place, 'dry', json.dumps(st), 'støy', noise, 'av mot på', d, 'npcStates per bilde', calls)
            check(d['ulike'] <= max(4, noise['ulike'] * 2) and d['over8'] <= noise['over8'], f'{place}: the picture is the same with the sea bed and the sky behind the sea left out', d)
            grids = [st[k] for k in ('TERR', 'MIDM', 'NEARM', 'FINEM') if st.get(k)]
            cut = 1 - sum(g['tri'] for g in grids) / max(1, sum(g['all'] for g in grids))
            check(len(grids) >= 3 and cut > (0.5 if place == 'sjo' else 0.15), f'{place}: the grids leave out the triangles under the sea', (round(cut, 3), [(g['thr'], g['tri'], g['all']) for g in grids]))
            check(st['mask'] and st['mask'] > 0 and not st['off'], f'{place}: the sky is drawn behind the sea\'s plane', st['mask'])
            near, far = st.get('NEARM'), st.get('TERR')
            check(near and far and near['thr'] <= far['thr'] - 2.5 and near['thr'] == int(near['thr']) and -0.5 <= far['thr'] - await pg.evaluate("G3._debug.env.tide") <= -0.25 + 1e-6, f'{place}: the far grids are cut just under the tide, the near ones under the waves\' troughs too', (far and far['thr'], near and near['thr']))
            check(calls < 1.7, f'{place}: the other boats are worked out once a frame (the 200 ms tick asks too, now and then; it was two a frame and the tick\'s)', calls)
            if place == 'sjo':
                # an eye not well over the tide (a camera in a trough): all of it is drawn, and the sky with no mask
                TRIS = """() => new Promise(res => { const D = G3._debug, WP = WebGL2RenderingContext.prototype, de = WP.drawElements; let k = -1, tris = 0, m0 = 0;
                  WP.drawElements = function(m, n, t, o){ if (k >= 0) tris += n / 3; return de.call(this, m, n, t, o); };
                  const f = () => { if (k < 0) m0 = D.dry.mask; if (++k < 3){ requestAnimationFrame(f); return; } WP.drawElements = de; res({tris:Math.round(tris / 3), mask:(D.dry.mask - m0) / 3}); }; requestAnimationFrame(f); })"""
                r = await pg.evaluate(TRIS)
                await pg.evaluate("() => { const D = G3._debug; G3.film({eye:[D.bv.x + 30, (D.env.tide || 0) + 0.6, D.bv.z + 30], tgt:'boat', fov:55}); }"); await pg.evaluate(NEXT)
                lo = await pg.evaluate(TRIS); await pg.evaluate("G3.film(null)")
                print('over tidevannet', r, 'ikke over', lo)
                check(r['mask'] >= 0.99 and lo['mask'] == 0 and lo['tris'] > r['tris'] + 50000, 'sjo: with the eye not well over the tide all of it is drawn, and the sky with no mask', (r, lo))
            await ctx.close()
        print('errors:', errs[:5])
        await b.close()


asyncio.run(main())
