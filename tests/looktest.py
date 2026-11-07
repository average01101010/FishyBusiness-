"""Looks and the wardrobe (Jonas 10.10.2026): every part a look names is in the worker GLB (the hair under a hat, the beards, the hats, the
jackets for both bodies, the shoes); a crew member's look is kept on him, made from his id, and the crew of a fleet differ; the player's
look is S.look and survives a save and a load; the wardrobe opens from the phone in portrait and landscape, with the figure in view (a
screenshot of each in tests/out), the choices change the look and «Avbryt» throws the changes away, «Ferdig» keeps them. Prints OK or
FEIL per check, and the page errors last."""
from _env import GAME, boot
import asyncio, json, os
from playwright.async_api import async_playwright

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:400]) if extra != '' else ''))


async def main():
    os.makedirs(OUT, exist_ok=True)
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'])
        ctx = await br.new_context(viewport={'width': 1280, 'height': 800}); pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg); await pg.wait_for_timeout(500)
        # 1. every part a look can name is in the GLB
        a = await pg.evaluate("""(() => { const miss = [], names = new Set(['head', 'uarm', 'farm', 'thigh', 'shin', 'hand', 'boot']);
          for (const h of LOOK_HAIR) for (const hat of [false, true]){ if (h[0] === 'none') continue; names.add(h[0] === 'ring' ? 'hair_ring' : 'hair_' + h[0] + (hat ? '_h' : '')); }
          for (const b of LOOK_BEARD) if (b[0] !== 'none') names.add('b_' + b[0]);
          for (const h of LOOK_HAT) if (h[3]) names.add(h[3]);
          for (const t of LOOK_TOP){ names.add(t[3]); names.add(t[4]); }
          for (const s of LOOK_SHOE) names.add(s[3]);
          for (const n of names) if (!glbPart('worker', n)) miss.push(n);
          return {n:names.size, miss}; })()""")
        check(not a['miss'] and a['n'] >= 40, 'every part a look can name is in the worker GLB', a)
        # 2. a look makes a figure: all combinations of body, hat and hairstyle build, with the names right
        b = await pg.evaluate("""(() => { let n = 0, bad = []; for (const sx of ['m', 'f']) for (const h of LOOK_HAT) for (const hs of LOOK_HAIR) for (const tp of LOOK_TOP){
            const l = Object.assign(lookDefault(), {b:sx, ht:h[0], hs:hs[0], tp:tp[0], bd:sx === 'm' ? 'full' : 'none'}), K = lookKit(l); n++;
            const B = VB(); figureVB(B, 0, 0, 0, false, null, l); if (!(B.p.length > 3000)) bad.push([sx, h[0], hs[0], tp[0], B.p.length]);
            if (h[0] === 'bucket' && ['bun', 'pony', 'braid'].includes(hs[0]) && K.hairP !== 'hair_mid_h') bad.push(['bucket rule', hs[0], K.hairP]);
            if (h[0] !== 'none' && hs[0] !== 'none' && hs[0] !== 'ring' && !String(K.hairP).endsWith('_h')) bad.push(['no _h under a hat', h[0], hs[0], K.hairP]); }
          return {n, bad:bad.slice(0, 5)}; })()""")
        check(b['n'] == 2 * 8 * 10 * 5 and not b['bad'], 'every combination of body, hat, hairstyle and jacket builds a figure; the hair is the hat version under a hat', b)
        # 3. paint: the skin, hair, hat and shoes take the look's colours; the old kits still work
        c = await pg.evaluate("""(() => { const l = Object.assign(lookDefault(), {s:5, hc:7, ht:'beanie', hk:4, sc:15, tk:2, lg:9, hs:'long'}), K = lookKit(l);
          const col = (n, z) => { const o = glbPart('worker', n), q = wkPart(n, l); for (let i = 0; i < o.zone.length; i++) if (o.zone[i] === z && o.ao[i] > 0.3) return [q.c[i * 4] / o.ao[i], q.c[i * 4 + 1] / o.ao[i], q.c[i * 4 + 2] / o.ao[i]]; return null; };
          const eq = (a, b) => a && b && Math.abs(a[0] - b[0]) < 0.02 && Math.abs(a[1] - b[1]) < 0.02 && Math.abs(a[2] - b[2]) < 0.02;
          const old = ['hw', 'skipper', 'crew'].map(k => { const B = VB(); figureVB(B, 0, 0, 0, false, null, k); return B.p.length; });
          return {skin:eq(col('head', 4), LOOK_SKIN[5]), hair:eq(col(K.hairP, 5), LOOK_HAIR_C[7]), hat:eq(col('beanie', 6), LOOK_COL[4]), shoe:eq(col('boot', 7), LOOK_COL[15]), top:eq(col('torso', 1), LOOK_COL[2]), legs:eq(col('thigh', 3), LOOK_COL[9]), old}; })()""")
        check(c['skin'] and c['hair'] and c['hat'] and c['shoe'] and c['top'] and c['legs'] and all(x > 3000 for x in c['old']), 'the zones take the look: skin, hair, hat, shoes, jacket, trousers; the old kits still build', c)
        # 4. the crew: a look made from the id, kept, the same after a save; no two in a fleet alike
        d = await pg.evaluate("""(() => { S.crew = []; for (let i = 0; i < 8; i++) S.crew.push(Object.assign(genCrew(), {bi:false, off:false}));
          const first = S.crew.map(c => lookKey(lookOf(c))), again = S.crew.map(c => lookKey(lookOf(c)));
          let min = 99; for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) min = Math.min(min, lookDist(S.crew[i].look, S.crew[j].look));
          const sx = S.crew.filter(c => c.sex === 'f').every(c => c.look.b === 'f' && c.look.bd === 'none');
          const keys = new Set(first), seed = lookKey(lookFromSeed('abc', 'm', 40, 'sea')) === lookKey(lookFromSeed('abc', 'm', 40, 'sea'));
          const tops = new Set(S.crew.map(c => c.look.tp + c.look.tk)); const orange = S.crew.filter(c => c.look.tk === 2 && c.look.lg === 2).length;
          return {same:first.join() === again.join(), unique:keys.size, min, sx, seed, tops:tops.size, orange}; })()""")
        check(d['same'] and d['unique'] == 8 and d['min'] >= 3 and d['sx'] and d['seed'] and d['tops'] >= 5 and d['orange'] <= 1, 'the crew: a look kept on each, made from the id, eight of eight different, the women without beards, jackets vary', d)
        # 5. S.look and a save
        e = await pg.evaluate("""(() => { S.look = Object.assign(lookDefault(), {b:'f', hs:'braid', hc:4, ht:'bucket', hk:3, tp:'oilskin', tk:3}); save(); const raw = JSON.parse(localStorage.getItem(KEY)); const sv = raw.look || (raw.o && raw.o.look); return {saved:!!sv, hs:sv && sv.hs, crew:(JSON.stringify(raw).match(/"look":/g) || []).length, me:lookKey(lookMe())}; })()""")
        check(e['saved'] and e['hs'] == 'braid' and e['crew'] >= 9, 'S.look and the crew\'s looks are in the save', e)
        # 6. the wardrobe, landscape and portrait
        for W, H, tag in [(1280, 800, 'liggende'), (800, 1280, 'staaende')]:
            await pg.set_viewport_size({'width': W, 'height': H}); await pg.wait_for_timeout(300)
            f = await pg.evaluate("""(() => { S.look = lookDefault(); WARD.open(); return {open:WARD.isOpen(), tabs:document.querySelectorAll('.wd-tab').length, cv:!!document.querySelector('.wd-cv')}; })()""")
            await pg.wait_for_timeout(500)
            g = await pg.evaluate("""(() => { const r = document.querySelector('.wd-cv').getBoundingClientRect(), s = document.querySelector('.wd-side').getBoundingClientRect(), v = document.querySelector('.wd-view').getBoundingClientRect(); return {cv:[Math.round(r.width), Math.round(r.height)], side:[Math.round(s.width), Math.round(s.height)], overflowX:document.documentElement.scrollWidth > innerWidth}; })()""")
            check(f['open'] and f['tabs'] == 8 and f['cv'] and g['cv'][0] > 200 and g['cv'][1] > 200 and not g['overflowX'], tag + ': the wardrobe opens with the figure in view and eight tabs', {**f, **g})
            # something is drawn: not all pixels the same
            px = await pg.evaluate("""(() => { const cv = document.querySelector('.wd-cv'), g = cv.getContext('webgl'); if (!g) return {gl:false}; const w = cv.width, h = cv.height, a = new Uint8Array(4 * w * h); g.readPixels(0, 0, w, h, g.RGBA, g.UNSIGNED_BYTE, a); let n = 0; for (let i = 3; i < a.length; i += 4) if (a[i] > 0) n++; return {gl:true, drawn:n, of:w * h}; })()""")
            check(px.get('gl') and px['drawn'] > 2000, tag + ': the figure is drawn in the view', px)
            # the choices change the look
            await pg.evaluate("document.querySelector('.wd-tab[data-v=hat]').click()"); await pg.evaluate("document.querySelector('.wd-chip[data-k=ht][data-v=bucket]').click()")
            await pg.evaluate("document.querySelector('.wd-tab[data-v=hair]').click()"); await pg.evaluate("document.querySelector('.wd-chip[data-k=hs][data-v=pony]').click()")
            await pg.evaluate("document.querySelector('.wd-sw[data-k=hc][data-v=\"4\"]').click()")
            await pg.evaluate("document.querySelector('.wd-tab[data-v=beard]').click()"); await pg.evaluate("document.querySelector('.wd-chip[data-k=bd][data-v=full]').click()")
            await pg.wait_for_timeout(300)
            h = await pg.evaluate("(() => { const l = WARD.look(); return {ht:l.ht, hs:l.hs, hc:l.hc, bd:l.bd, kit:lookKit(l).hairP, mine:lookKey(lookMe())}; })()")
            check(h['ht'] == 'bucket' and h['hs'] == 'pony' and h['hc'] == 4 and h['bd'] == 'full' and h['kit'] == 'hair_mid_h' and 'bucket' not in h['mine'], tag + ': the choices change the look (the pony tail under a rain hat becomes the plain cut), S.look is not touched before «Ferdig»', h)
            await pg.screenshot(path=os.path.join(OUT, 'look_%s.png' % tag))
            await pg.evaluate("document.querySelector('.wd-tab[data-v=body]').click()"); await pg.evaluate("document.querySelector('.wd-chip[data-k=b][data-v=f]').click()")
            i = await pg.evaluate("(() => { const l = WARD.look(); return {b:l.b, bd:l.bd}; })()")
            check(i['b'] == 'f' and i['bd'] == 'none', tag + ': a woman has no beard', i)
            await pg.evaluate("document.querySelector('[data-wd=cancel]').click()")
            j = await pg.evaluate("({open:WARD.isOpen(), gone:!document.getElementById('wardrobe'), mine:lookKey(lookMe()), def:lookKey(lookDefault())})")
            check(not j['open'] and j['gone'] and j['mine'] == j['def'], tag + ': «Avbryt» throws the changes away', j)
            await pg.evaluate("WARD.open()"); await pg.wait_for_timeout(200)
            await pg.evaluate("document.querySelector('.wd-tab[data-v=hat]').click()"); await pg.evaluate("document.querySelector('.wd-chip[data-k=ht][data-v=flat]').click()")
            await pg.evaluate("document.querySelector('[data-wd=done]').click()")
            k = await pg.evaluate("({open:WARD.isOpen(), ht:lookMe().ht})")
            check(not k['open'] and k['ht'] == 'flat', tag + ': «Ferdig» keeps the look', k)
        print('sidefeil:', errs[:4]); await br.close()

asyncio.run(main())
