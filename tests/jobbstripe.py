"""«Arbeid på båten» (steg 127 FN1, docs/planer/ferdig-naa.md F1; Jonas 13.11.2026): after «Kjøp og monter» in the tackle shop, and while a
job runs, a strip stands at the top of every page that makes jobs (the shop's two tabs, Service, Oppgraderinger, Vedlikehold, Båthandel,
Malerverkstedet) and in Om bord: each job with the real time left (mm:ss) and a bar. The clock counts down in place (the page is not drawn
anew, it is read twice 3 s apart), it agrees with the yard's «ferdig» in the status box, «Ferdig nå» stands while a yard job has more than
5 real minutes left and finishes them in the test mode (no payment on a local server), and the strip is gone when the queue is empty.
Both formats; pictures in tests/out/jobbstripe-*.png. Prints OK or FEIL per check."""
from _env import boot
import asyncio, json, os, re
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


PAGES = ['utstyrb', 'fiske', 'service', 'utstyr', 'verksted', 'fartoy', 'maler', 'beholdning']
STRIP = """(() => { const d = document.getElementById('drawerBody'), s = d.querySelector('.jstrip'); if (!s) return null;
  const first = [...d.children].find(e => !e.matches('.pl-head')), r = s.getBoundingClientRect(), dr = d.getBoundingClientRect();
  return {top:first === s, rows:[...s.querySelectorAll('.js-row')].map(x => ({n:x.querySelector('.js-n').textContent, t:(x.querySelector('.js-t') || {}).textContent || '', k:(x.querySelector('.js-k') || {}).textContent || '', w:x.querySelector('.js-b i') ? parseFloat(x.querySelector('.js-b i').style.width) : null})),
    now:!!s.querySelector('[data-pa=yardnow]'), nowTxt:(s.querySelector('[data-pa=yardnow]') || {}).textContent || '', nowH:s.querySelector('[data-pa=yardnow]') ? s.querySelector('[data-pa=yardnow]').getBoundingClientRect().height : 0,
    fits:r.left >= dr.left - 1 && r.right <= dr.right + 1, sw:d.scrollWidth, cw:d.clientWidth}; })()"""


async def fmt(pg):
    w, h = await pg.evaluate("[innerWidth, innerHeight]")
    return 'liggende' if w > h else 'staaende'


async def run(p, vw, vh):
    b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    pg = await b.new_page(viewport={'width': vw, 'height': vh})
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    await boot(pg)
    tag = await fmt(pg)
    print('--- %s %dx%d' % (tag, vw, vh))
    J = lambda js: pg.evaluate("JSON.stringify(" + js + ")")
    await pg.evaluate("S.cash = 900000; S.boat.status = 'port'; S.jobs = []; renderActs()")

    # nothing in the queue: no strip anywhere
    none = []
    for a in PAGES:
        await pg.evaluate("DOCK.open(%r)" % a); await pg.wait_for_timeout(150)
        if await pg.evaluate("!!document.querySelector('#drawerBody .jstrip')"): none.append(a)
    check(not none, tag + ': tom kø, ingen stripe på sidene', none)

    # «Kjøp og monter» in the shop: two taps on the first thing that can be fitted here
    await pg.evaluate("DOCK.open('utstyrb')"); await pg.wait_for_timeout(250)
    k = await pg.evaluate("(() => { const e = [...document.querySelectorAll('#drawerBody [data-pa=equip]:not([disabled])')][0]; return e ? e.dataset.k : null; })()")
    for _ in range(2):
        await pg.evaluate("document.querySelector('#drawerBody [data-pa=equip][data-k=%s]').click()" % k); await pg.wait_for_timeout(250)
    r = json.loads(await J("{jobs:(S.jobs || []).map(j => [j.kind, j.until != null])}"))
    check(r['jobs'] and r['jobs'][0] == ['fit', True], tag + ': «Kjøp og monter» la en monteringsjobb i køen (' + str(k) + ')', r)
    s = json.loads(await J(STRIP))
    check(s and s['top'] and len(s['rows']) == 1 and re.fullmatch(r'\d\d:\d\d', s['rows'][0]['t'] or ''), tag + ': rett etter kjøpet står stripa øverst i butikken med mm:ss', s)
    await pg.screenshot(path='jobbstripe-%s-butikk.png' % tag)

    # a yard job and the crew's own beside it: the strip on every page that makes jobs, and in Om bord
    await pg.evaluate("queueJob({kind:'hull', h:6, no:'Skrogrens på slipp', en:'Hull cleaning on the slip'}); save()")
    miss = []
    for a in PAGES:
        await pg.evaluate("DOCK.open(%r)" % a); await pg.wait_for_timeout(250)
        s = json.loads(await J(STRIP))
        ok = s and s['top'] and len(s['rows']) == 2 and all(re.fullmatch(r'\d\d:\d\d', x['t']) for x in s['rows']) and all(x['w'] is not None for x in s['rows']) and s['fits'] and s['sw'] <= s['cw'] + 1
        if not ok: miss.append([a, s])
        if a in ('verksted', 'beholdning', 'fiske'): await pg.screenshot(path='jobbstripe-%s-%s.png' % (tag, a))
    check(not miss, tag + ': stripa øverst med begge jobbene, mm:ss og stolpe, innenfor skuffen på ' + ', '.join(PAGES), miss)

    # the clock counts down in place: the same element 3 s later, the scroll where it was, and it agrees with the game's clock. On Service
    # nothing else on the page changes with the time, so the strip alone must not draw it anew; Vedlikehold draws itself anew each game
    # minute (the overtime's price follows the time left, as before FN1): there the scroll must stay and the clock go on
    t = lambda: J("{t:document.querySelector('#drawerBody .js-row.run .js-t').textContent, u:S.jobs[+document.querySelector('#drawerBody .js-row.run').dataset.i].until, st:S.t + liveFrac(), r:simRate(), y:document.getElementById('drawerBody').scrollTop, mark:!!(document.querySelector('#drawerBody .jstrip') || {}).__mark}")
    sec = lambda x: int(x['t'].split(':')[0]) * 60 + int(x['t'].split(':')[1])
    want = lambda x: (x['u'] - x['st']) / x['r'] * 60
    for a_, keep in (('service', True), ('verksted', False)):
        await pg.evaluate("DOCK.open(%r)" % a_); await pg.wait_for_timeout(300)
        await pg.evaluate("document.getElementById('drawerBody').scrollTop = 40; document.querySelector('#drawerBody .jstrip').__mark = 1")
        a = json.loads(await t()); await pg.wait_for_timeout(3000); c = json.loads(await t())
        check(1 <= sec(a) - sec(c) <= 5 and (c['mark'] or not keep) and c['y'] == a['y'], tag + ': ' + a_ + ': nedtellingen går ned (' + a['t'] + ' → ' + c['t'] + ')' + (' uten at siden tegnes på nytt' if keep else ', rullingen står'), [a, c])
        check(abs(sec(c) - want(c)) <= 2, tag + ': ' + a_ + ': mm:ss er jobbens egen ferdigtid i ekte tid', [sec(c), round(want(c), 1)])
    # a page opened anew starts at the top (the drawer's scroll is set back), and the strip does not keep the old page's scroll
    await pg.evaluate("document.getElementById('drawerBody').scrollTop = 200; DOCK.open('maler')"); await pg.wait_for_timeout(300)
    y = await pg.evaluate("document.getElementById('drawerBody').scrollTop")
    check(y == 0, tag + ': en ny side åpner øverst', y)
    # the crew's own work beside the yard's: its end and length move every game minute with the hands on it (core/13-work.js jobMinute);
    # moved here as jobMinute moves them, the strip must follow without drawing the page anew
    await pg.evaluate("cargoJob(800, 'Last om bord', 'Freight aboard')"); await pg.evaluate("DOCK.open('service')"); await pg.wait_for_timeout(400)
    await pg.evaluate("document.querySelector('#drawerBody .jstrip').__mark = 1")
    a = json.loads(await J("{n:document.querySelectorAll('#drawerBody .jstrip .js-row').length, crew:(S.jobs || []).some(j => j.kind === 'last' && j.until != null)}"))
    await pg.evaluate("(() => { const j = S.jobs.find(j => j.kind === 'last'); j.until += 7; j.h = j.h * 1.37; })()"); await pg.wait_for_timeout(1500)
    c = json.loads(await J("{mark:!!(document.querySelector('#drawerBody .jstrip') || {}).__mark, k:[...document.querySelectorAll('#drawerBody .js-row.run .js-k')].map(e => e.textContent), want:'ferdig kl. ' + hm(S.jobs.find(j => j.kind === 'last').until / 60)}"))
    check(a['n'] == 3 and a['crew'] and c['mark'] and c['want'] in c['k'], tag + ': mannskapets jobb flytter ferdigtida: stripa følger uten at siden tegnes på nytt', [a, c])
    await pg.evaluate("S.jobs = S.jobs.filter(j => j.kind !== 'last')"); await pg.evaluate("DOCK.open('verksted')"); await pg.wait_for_timeout(400)
    box = json.loads(await J("{hud:document.getElementById('hud').textContent, done:hm(jobsDone() / 60), strip:[...document.querySelectorAll('#drawerBody .js-row.run .js-k')].map(e => e.textContent)}"))
    check(box['done'] in box['hud'] and any(box['done'] in x for x in box['strip']), tag + ': «ferdig kl.» i stripa er den samme som i statusboksen (' + box['done'] + ')', box)

    # «Ferdig nå» while a yard job has more than 5 minutes left, the same purchase as before (test mode here), and the strip goes with the queue
    s = json.loads(await J(STRIP))
    check(s['now'] and 'Ferdig nå' in s['nowTxt'] and s['nowH'] >= 44, tag + ': «Ferdig nå» står i stripa, stor nok for en finger', [s['nowTxt'], s['nowH']])
    await pg.screenshot(path='jobbstripe-%s-ferdignaa.png' % tag)
    await pg.evaluate("document.querySelector('#drawerBody .jstrip [data-pa=yardnow]').click()")
    try: await pg.wait_for_function("!(S.jobs || []).some(j => YARD_KINDS.includes(j.kind))", timeout=30000)
    except Exception: pass
    r = json.loads(await J("{yard:(S.jobs || []).filter(j => YARD_KINDS.includes(j.kind)).length, fit:!!S.equip[%r]}" % k))
    check(r['yard'] == 0 and r['fit'], tag + ': «Ferdig nå» gjorde verftsjobbene ferdige (utstyret er montert)', r)
    await pg.evaluate("S.jobs = []"); await pg.wait_for_timeout(1200)
    gone = []
    for a in PAGES:
        await pg.evaluate("DOCK.open(%r)" % a); await pg.wait_for_timeout(150)
        if await pg.evaluate("!!document.querySelector('#drawerBody .jstrip')"): gone.append(a)
    check(not gone, tag + ': stripa er borte når køen er tom', gone)

    # a short yard job (5 minutes or less left) has no «Ferdig nå»: it would finish during the payment (YARD_NOW_MIN, as before)
    await pg.evaluate("queueJob({kind:'hull', h:6, no:'Skrogrens på slipp', en:'Hull cleaning on the slip'}); S.jobs[0].until = S.t + 20; DOCK.open('service')")
    await pg.wait_for_timeout(900)
    s = json.loads(await J(STRIP))
    check(s and not s['now'], tag + ': under 5 minutter igjen: ingen «Ferdig nå»', s and s['nowTxt'])
    check(not errs, tag + ': sidefeil', errs)
    await b.close()


async def main():
    async with async_playwright() as p:
        if os.environ.get('KYST_TUT_ONE') != 'staaende': await run(p, 1280, int(os.environ.get('KYST_JS_H', '800')))
        if os.environ.get('KYST_TUT_ONE') != 'liggende': await run(p, 800, 1280)

asyncio.run(main())
