"""M3 in docs/planer/butikker-og-sponsorer.md: gear tried on your own boat in 3D before it is bought, and lifted aboard when it is.
In the tackle shop a card for gear with a model (the haulers, the jigging reel, the crab tank, the radars) has «Prøv på båten»: the
item is drawn on the boat (G3._debug.kitStat), the camera turns round her as in the paint shop, nothing is paid and S.equip is
untouched; «Ta av igjen» or leaving the page takes it off. Bought, it is lifted aboard for 10 s and stands on deck while it is fitted;
a bought hauler stands at its place when she is not working her gear. Pictures in both formats. Prints OK or FEIL per check."""
from _env import boot
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:400]) if extra != '' else ''))


ST = "(() => { const k = G3._debug.kitStat; return {trying:G3.trying, hoist:G3.hoisting, painting:G3.painting, haul:k.haul || null, tank:!!k.tank, radar:k.radar, n:k.n, eq:JSON.parse(JSON.stringify(S.equip)), cash:S.cash}; })()"


async def frames(pg, n=3):
    k0 = await pg.evaluate("G3._debug.kitStat.n")
    for _ in range(120):
        await pg.wait_for_timeout(250)
        if await pg.evaluate("G3._debug.kitStat.n") >= k0 + n:
            return


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await br.new_page(viewport={'width': 1280, 'height': 800}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        # a snekke at the quay in Finnsnes, where the tackle shop is; rigged for jigging, no hauler aboard
        await pg.evaluate("""(() => { S.cash = 400000; S.boat.type = 'snekke'; applyVessel(); S.boat.status = 'port'; const q = portById('finnsnes'); S.boat.port = 'finnsnes'; S.boat.pos = {x:q.p.x, y:q.p.y}; S.boat.berth = 'main';
          for (const k in EQUIP) if (/haler$|krabbekar/.test(k)) S.equip[k] = EQUIP[k].multi ? 0 : false; S.jobs = []; S.boat.rig = 'juksa'; renderActs(); })()""")
        check(await pg.evaluate("!!portServices(portById(S.boat.port), berthKind(S.boat)).butikk"), 'båten ligger ved utstyrsbutikken i Finnsnes')
        await pg.evaluate("G3.show(true)"); await frames(pg)
        s0 = json.loads(json.dumps(await pg.evaluate(ST)))
        check(s0['haul'] is None and not s0['tank'], 'uten haler og krabbekar står ingen av dem på dekk', s0)
        await pg.evaluate("DOCK.open('utstyrb')"); await pg.wait_for_selector('#drawerBody #ic-garnhaler')
        btns = await pg.evaluate("[...document.querySelectorAll('#drawerBody [data-pa=eqtry]')].map(b => b.dataset.k)")
        check({'garnhaler', 'linehaler', 'teinehaler', 'jukse', 'krabbekar'} <= set(btns), 'kortene for halerne, juksamaskinen og krabbekaret har «Prøv på båten»', btns)

        # trying the net hauler: drawn on the boat, the camera round her, nothing paid, the equipment untouched
        await pg.evaluate("document.querySelector('#drawerBody [data-pa=eqtry][data-k=garnhaler]').click()"); await frames(pg)
        t = await pg.evaluate(ST)
        note = await pg.evaluate("document.querySelector('#drawerBody #ic-garnhaler').innerText")
        check(t['trying'] == 'garnhaler' and t['painting'] and t['haul'] == 'garnhaler' and not t['eq'].get('garnhaler') and t['cash'] == s0['cash'] and 'Vises på' in note and 'Ta av igjen' in note,
              'garnhaleren prøves: den står på båten, kameraet går rundt henne, ingenting er betalt og utstyret er som før', t)
        await pg.wait_for_timeout(1500)
        await pg.screenshot(path='try_garnhaler_liggende.png')
        await pg.set_viewport_size({'width': 800, 'height': 1280}); await frames(pg); await pg.wait_for_timeout(1500)
        await pg.screenshot(path='try_garnhaler_staaende.png')
        fit = await pg.evaluate("""(() => { const d = document.getElementById('drawerBody'), r = d.getBoundingClientRect();
          return [...d.querySelectorAll('#ic-garnhaler *')].filter(e => { const q = e.getBoundingClientRect(); return q.width && q.right > r.right + 1; }).map(e => e.tagName + '.' + e.className).slice(0, 5); })()""")
        check(not fit, 'kortet med to knapper får plass stående', fit)
        await pg.set_viewport_size({'width': 1280, 'height': 800})
        # the crab tank shows while tried even when she is not rigged for pots, and the save does not get it
        await pg.evaluate("document.querySelector('#drawerBody [data-pa=eqtry][data-k=krabbekar]').click()"); await frames(pg)
        k = await pg.evaluate(ST)
        saved = await pg.evaluate("(() => { save(); return /\"krabbekar\":(true|[1-9])/.test(localStorage.getItem(KEY) || ''); })()")
        check(k['trying'] == 'krabbekar' and k['tank'] and k['haul'] is None and not k['eq'].get('krabbekar') and not saved, 'krabbekaret prøves (ett om gangen), står på dekk selv om hun er rigget for juksa, og kommer ikke med i lagringen', [k, saved])
        # taking it off
        await pg.evaluate("document.querySelector('#drawerBody [data-pa=eqtry][data-k=krabbekar]').click()"); await frames(pg)
        o = await pg.evaluate(ST)
        check(o['trying'] is None and not o['painting'] and not o['tank'], '«Ta av igjen» tar det av og kameraet tilbake', o)
        # leaving the page takes it off too
        await pg.evaluate("document.querySelector('#drawerBody [data-pa=eqtry][data-k=linehaler]').click()"); await frames(pg)
        a = await pg.evaluate("G3.trying")
        await pg.evaluate("DOCK.close()"); await frames(pg)
        c = await pg.evaluate(ST)
        check(a == 'linehaler' and c['trying'] is None and not c['painting'] and c['haul'] is None, 'å lukke butikken tar av det som prøves', [a, c])

        # buying the net hauler: two taps (over 10 000 kr), then lifted aboard for 10 s, standing on deck while it is fitted
        await pg.evaluate("DOCK.open('utstyrb')"); await pg.wait_for_selector('#drawerBody #ic-garnhaler')
        await pg.evaluate("document.querySelector('#drawerBody [data-pa=eqtry][data-k=garnhaler]').click()"); await pg.wait_for_timeout(200)
        await pg.evaluate("document.querySelector('#drawerBody [data-pa=equip][data-k=garnhaler]').click()"); await pg.wait_for_timeout(200)
        h0 = await pg.evaluate("(() => { document.querySelector('#drawerBody [data-pa=equip][data-k=garnhaler]').click(); return {hoist:G3.hoisting, trying:G3.trying, painting:G3.painting}; })()")
        await frames(pg, 1)
        h = dict(await pg.evaluate(ST), **h0)
        check(h['hoist'] == 'garnhaler' and h['trying'] is None and h['painting'] and h['haul'] == 'garnhaler' and h['cash'] == s0['cash'] - await pg.evaluate("EQUIP.garnhaler.price") and not h['eq'].get('garnhaler'),
              'kjøpt: haleren heises om bord og står på dekk mens den monteres, og prisen er betalt', h)
        await pg.screenshot(path='try_heis_liggende.png')
        for _ in range(60):
            await pg.wait_for_timeout(500)
            if await pg.evaluate("G3.hoisting") is None:
                break
        e = await pg.evaluate(ST)
        check(e['hoist'] is None and not e['painting'] and e['haul'] == 'garnhaler', 'etter ti sekunder er heisingen ferdig og kameraet tilbake, og haleren står der til den er montert', e)
        # fitted: hers, and standing at its place when she is not working her gear
        await pg.evaluate("(() => { for (const j of (S.jobs || []).filter(j => j.kind === 'fit')) finishJob(j); S.jobs = []; })()"); await frames(pg)
        f = await pg.evaluate(ST)
        check(f['eq'].get('garnhaler') is True and f['haul'] == 'garnhaler', 'montert: haleren er hennes og står på plassen sin i havn', f)
        print('sidefeil', errs)
        await br.close()

asyncio.run(main())
