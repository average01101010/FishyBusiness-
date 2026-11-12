"""The pictures of the formats for the media card (M9, steg 28; docs/planer/butikker-og-sponsorer.md 4.6): taken from the demo build,
with the made-up partner «Nordlys Utstyr» on from the start, and put in docs/sponsor/ as format-*.jpg with their captions in format.json,
which docs/sponsor/mediekort.md and the admin page's media card (build.mjs) show. Before, they were taken by hand.

    KYST_DEMO=1 KYST_DIST=dist-demo node build.mjs
    KYST_DIST=dist-demo python3 tests/mediekortshot.py

The banner and the flag at the shop in Finnsnes, and the design on the boat in the paint shop, are 3D (the cameras of signtest and
sp44shot); the item in the shop, the advertisement in Kystposten and the jacket in Garderoben are the pages of sponsortest and
sponsor2test. Lying down (1280 x 800), as a sponsor sees it on the tablet, made 960 px wide (Pillow). Prints OK or FEIL per picture, and
the page errors."""
from _env import boot, GAME, HERE
import asyncio, json, os
from playwright.async_api import async_playwright

OUTD = os.path.join(os.path.dirname(HERE), 'docs', 'sponsor')
SHOTS = []


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:400]) if extra != '' else ''))


async def take(pg, name, cap, ok, what, extra=''):
    """the picture as it is now, to docs/sponsor/format-<name>.jpg (960 px wide), when the page shows what it should"""
    check(ok, what, extra)
    if not ok: return
    # (no message or tip over the picture: a sponsor sees the format, not the game's news)
    await pg.evaluate("(() => { if (typeof toastClear === 'function') toastClear(); const t = document.getElementById('toast'); if (t) t.style.visibility = 'hidden'; })()")
    raw = os.path.join(os.getcwd(), 'mediekort_%s.png' % name)
    try: await pg.screenshot(path=raw, timeout=150000)
    except Exception as e: print('FEIL skjermbildet %s kom ikke: %s' % (name, str(e)[:80])); return
    from PIL import Image
    im = Image.open(raw).convert('RGB'); w, h = im.size; im = im.resize((960, round(h * 960 / w)), Image.LANCZOS)
    f = 'format-%s.jpg' % name; im.save(os.path.join(OUTD, f), 'JPEG', quality=80, optimize=True, progressive=True)
    SHOTS.append({'file': f, 'cap': cap})


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await br.new_page(viewport={'width': 1280, 'height': 800}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME)
        demo = await pg.evaluate("typeof SPN !== 'undefined' && SPN.list.some(r => r.kind === 'sign') && SPN.list.some(r => r.kind === 'press')")
        check(demo, 'demobygget: testsponsoren er på fra start (KYST_DEMO=1)', demo)
        if not demo: print('sidefeil', errs); await br.close(); return
        # at the shop in Finnsnes on a summer day, a breeze so the flag flies, the sun held up
        await pg.evaluate("""(() => { S.boat.type = 'sjark'; applyVessel(); S.boat.status = 'port'; S.boat.port = 'finnsnes'; S.boat.berth = 'main'; const q = portById('finnsnes'); S.boat.pos = {x:q.p.x, y:q.p.y};
          S.cash = 50000; WX_FORCE = {w:6, d:250}; S.mult = 0; S.t = Math.round((Date.UTC(2027, 5, 12, 12) - EPOCH) / 6e4); renderActs(); G3.show(true); G3.vesselChanged && G3.vesselChanged(); })()""")
        await pg.wait_for_timeout(5000)
        await pg.evaluate("SPM.fix.el = 30; G3.signAt('front', 16)")
        s = None
        for _ in range(30):
            await pg.wait_for_timeout(2000); s = await pg.evaluate("G3.signs")
            if s['flags'] > 0 and s['flag']['wind'] > 4: break
        await take(pg, 'banner', 'Banner og flagg ved butikken i Finnsnes', bool(s and s['flags'] > 0), 'banneret og flagget ved butikken (3D)', s and s.get('flag'))
        await pg.evaluate("G3.signAt(null)")
        # the partner's design on the boat in the paint shop
        await pg.evaluate("DOCK.open('maler')")
        try: await pg.wait_for_selector('#drawerBody .pnt-sp', timeout=20000)
        except Exception: pass
        d = await pg.evaluate("""(async () => { const b = document.querySelector('#drawerBody [data-pa=pntsp]'); if (!b) return null; b.click(); await new Promise(r => setTimeout(r, 300));
          document.querySelector('#drawerBody .pnt-sp').scrollIntoView({block:'center'}); return {sp:PAINTPRE && PAINTPRE.sp}; })()""")
        await pg.wait_for_timeout(10000)
        await take(pg, 'design', 'Partnerens design i Malerverkstedet, med merket på skroget', bool(d and d['sp']), 'designet på båten i Malerverkstedet (3D)', d)
        await pg.evaluate("DOCK.close(); G3.show(false)"); await pg.wait_for_timeout(500)
        # the partner's item in the shop, beside the generic one
        await pg.evaluate("DOCK.open('utstyrb')")
        try: await pg.wait_for_selector('#drawerBody #ic-garnhaler-sp', timeout=15000)
        except Exception: pass
        v = await pg.evaluate("(() => { const s = document.querySelector('#drawerBody #ic-garnhaler-sp'); if (!s) return null; s.scrollIntoView({block:'center'}); return {tag:!!s.querySelector('.ic-sp-tag'), link:!!s.querySelector('a.ic-sp-link')}; })()")
        await pg.wait_for_timeout(300)
        await take(pg, 'vare', 'Partnerens garnhaler i utstyrsbutikken, ved siden av den vanlige', bool(v and v['tag']), 'den sponsede varen i utstyrsbutikken', v)
        await pg.evaluate("DOCK.close()")
        # the advertisement in Kystposten
        await pg.evaluate("PHONE.show(true); PHONE.open('post')"); await pg.wait_for_timeout(400)
        a = await pg.evaluate("""(() => { const ad = pressList(false).find(s => s.kind === 'annonse'); if (!ad) return null; const b = [...document.querySelectorAll('#phone .pa-btn')].find(x => x.dataset.k === ad.key); if (b) b.click();
          return {key:ad.key, btn:!!b}; })()""")
        await pg.wait_for_timeout(400)
        at = await pg.evaluate("(document.querySelector('#phone .pa-ad') || {}).textContent || ''")
        await take(pg, 'annonse', 'Annonsen i Kystposten, spillets avis', bool(a and a['btn'] and 'Annonse' in at), 'annonsen i Kystposten', [a, at[:80]])
        await pg.evaluate("PHONE.show(false)")
        # the partner's jacket in Garderoben
        await pg.evaluate("WARD.open()"); await pg.wait_for_timeout(500)
        await pg.evaluate("(() => { const t = document.querySelector('#wardrobe [data-wd=tab][data-v=top]'); if (t) t.click(); })()"); await pg.wait_for_timeout(300)
        w = await pg.evaluate("(() => { const b = document.querySelector('#wardrobe [data-wd=sptop]'); if (b) b.click(); return {btn:!!b, note:(document.querySelector('#wardrobe .wd-note') || {}).textContent || ''}; })()")
        await pg.wait_for_timeout(800)
        await take(pg, 'jakke', 'Partnerens jakke i Garderoben, gratis for spillerne', w['btn'] and 'Samarbeid' in w['note'], 'jakka i Garderoben', w)
        await pg.evaluate("WARD.close ? WARD.close() : null")
        if len(SHOTS) == 5:
            json.dump(SHOTS, open(os.path.join(OUTD, 'format.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1); open(os.path.join(OUTD, 'format.json'), 'a').write('\n')
        check(len(SHOTS) == 5, 'fem bilder i docs/sponsor/ og format.json skrevet', [x['file'] for x in SHOTS])
        print('sidefeil', errs)
        await br.close()

asyncio.run(main())
