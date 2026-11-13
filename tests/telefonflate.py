"""The phone on a tablet is a surface of its own (designombyggingen D5, docs/planer/start/D5-telefonen.md): larger than the phone's
330 x 660, with its frame and status line, never over the dock (the dock is hidden while it is open), the home screen with what matters
now beside the apps lying down and above them standing, the apps' cards in two columns, the pages that are read with a line of at most
about 75 characters, and the paper where it was. A phone (up to 560 px wide, or up to 520 px tall) has the phone as before.
Prints OK or FEIL per check."""
from _env import boot
import asyncio, json
from playwright.async_api import async_playwright

# every app on the home screen with its name (a new game in harbour: Rederi comes with a fleet, Admin with ?admin)
NAMES = {'drift': 'Driftsplan', 'ordl': 'Oppdrag', 'nett': 'Nettet', 'salg': 'Salgslaget', 'kvote': 'Kvote', 'regler': 'Regler', 'kaiboden': 'Kaiboden',
         'merker': 'Milepæler', 'garderobe': 'Garderoben', 'folk': 'Venner', 'sesong': 'Sesong', 'guide': 'Fiskeguide', 'handbok': 'Håndboka',
         'vaer': 'Vær', 'post': 'Kystposten', 'meld': 'Meldinger', 'redning': 'Redning', 'patch': 'Patchnotes', 'tilbake': 'Tilbakemelding', 'innst': 'Innstillinger'}
TWO = ['rederi', 'kvote', 'salg', 'sesong', 'redning', 'innst', 'vaer', 'haill', 'trim', 'regler']
READ = [('handbok', ''), ('patch', ''), ('regler', 'laer')]


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


RECT = "(s => { const e = document.querySelector(s); if (!e) return null; const q = e.getBoundingClientRect(), c = getComputedStyle(e); return {l:q.left, t:q.top, r:q.right, b:q.bottom, w:q.width, h:q.height, vis:c.visibility, disp:c.display}; })"
# the longest line of running text in the open app, in characters: each text node's line boxes, the node's characters shared by width
LINES = """(() => { let max = 0, at = ''; const v = document.getElementById('phView');
  for (const e of v.querySelectorAll('.ph-card p, .ph-card li, p.ph-note, .hb-list p')){ if (!e.offsetParent) continue;
    const t = e.textContent.trim(); if (t.length < 60) continue;
    const r = document.createRange(); r.selectNodeContents(e); const rs = [...r.getClientRects()].filter(q => q.width > 1); if (!rs.length) continue;
    const rows = {}; let tot = 0; for (const q of rs){ const k = Math.round(q.top); rows[k] = (rows[k] || 0) + q.width; tot += q.width; }
    const w = Math.max(...Object.values(rows)), n = Math.round(t.length * w / tot); if (n > max){ max = n; at = t.slice(0, 50); } }
  return [max, at]; })()"""
# cards standing at two or more left edges, and nothing running out of the view to the right
COLS = """(() => { const v = document.getElementById('phView'), q = v.getBoundingClientRect();
  const xs = [...new Set([...v.querySelectorAll('.ph-appv > .ph-c > .ph-card, .ph-appv > .ph-c > .ph-c > .ph-card')].filter(e => e.offsetParent).map(e => Math.round(e.getBoundingClientRect().left)))];
  const out = [...v.querySelectorAll('.ph-appv *')].filter(e => e.offsetParent && e.getBoundingClientRect().width > 0 && e.getBoundingClientRect().right > q.right + 1 && !e.closest('svg, table, .ph-sub, .gd-mon, .ru-tbl')).map(e => e.className || e.tagName).slice(0, 3);
  return {cols:xs.length, out}; })()"""
# tiles of one group whose icons lie on each other
OVER = """(() => { const out = []; for (const g of document.querySelectorAll('#phone .ph-tiles')){ const r = [...g.querySelectorAll('.ph-app .ic')].map(e => e.getBoundingClientRect());
  for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++) if (r[i].left < r[j].right - 1 && r[j].left < r[i].right - 1 && r[i].top < r[j].bottom - 1 && r[j].top < r[i].bottom - 1) out.push([Math.round(r[i].left), Math.round(r[j].left)]); }
  return out.slice(0, 3); })()"""
LUM = "(s => { const e = document.querySelector(s); if (!e) return -1; const m = getComputedStyle(e).backgroundColor.match(/[\\d.]+/g).map(Number); return (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255; })"


async def tablet(b, w, h, tag):
    pg = await b.new_page(viewport={'width': w, 'height': h}); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    await boot(pg); await pg.evaluate("S.cash = 500000; S.boat.status = 'port'; renderActs()"); await pg.wait_for_timeout(400)
    dock0 = await pg.evaluate("[...document.querySelectorAll('#dock button')].filter(e => e.offsetParent && getComputedStyle(e).visibility === 'visible').length")
    await pg.evaluate("PHONE.show(true)"); await pg.wait_for_timeout(700)
    ph = await pg.evaluate(RECT + "('#phone')"); body = await pg.evaluate("(() => { const c = getComputedStyle(document.querySelector('.ph-body')); return [parseFloat(c.paddingTop), parseFloat(c.borderTopLeftRadius)]; })()")
    check(ph['w'] > 330 and ph['h'] > 660 and ph['w'] * ph['h'] > 2 * 330 * 660, tag + ': telefonen er en stor flate, større enn 330 × 660', '%d × %d' % (ph['w'], ph['h']))
    check(ph['l'] >= 0 and ph['t'] >= 0 and ph['r'] <= w and ph['b'] <= h, tag + ': hele flata er på skjermen', [round(ph[k]) for k in 'ltrb'])
    st = await pg.evaluate("(() => { const t = document.getElementById('phTime'), n = document.getElementById('phNet'), nav = document.querySelector('.ph-nav'); return [t.textContent, !!n.querySelector('.bars') && n.getBoundingClientRect().width > 0, !!nav.offsetParent, [...nav.querySelectorAll('button')].length]; })()")
    check(body[0] >= 8 and body[1] >= 20 and bool(st[0]) and st[1] and st[2] and st[3] == 3, tag + ': rammen, statuslinja (klokka, dekningen) og linja nederst er der', [body, st])
    # the dock: hidden while the phone is open, so no button lies half under it; back when it closes
    dock1 = await pg.evaluate("[...document.querySelectorAll('#dock button')].filter(e => e.offsetParent && getComputedStyle(e).visibility === 'visible').map(e => e.textContent.trim())")
    check(dock0 >= 3 and not dock1, tag + ': knappelinja er skjult mens telefonen er åpen', [dock0, dock1])
    hud = await pg.evaluate(RECT + "('#hud')")
    if hud and hud['w'] and h - hud['b'] > 700 or hud and hud['w'] and w - hud['r'] > 700:
        check(hud['r'] <= ph['l'] or hud['b'] <= ph['t'], tag + ': statusboksen står ved siden av eller over telefonen, ikke under den', [round(hud['r']), round(hud['b']), round(ph['l']), round(ph['t'])])
    # the home screen: every app with its name, in groups, and what matters now beside (lying) or above (standing) them
    apps = await pg.evaluate("Object.fromEntries([...document.querySelectorAll('#phone .ph-app')].map(x => [x.dataset.a, x.querySelector('.lb').textContent.replace(/\\u00ad/g, '')]))")
    apps.pop('admin', None)   # (the tests' own build has Admin; a player does not)
    check(apps == NAMES, tag + ': alle appene er på hjemskjermen med navnet sitt', {k: v for k, v in apps.items() if NAMES.get(k) != v} or [k for k in NAMES if k not in apps])
    now = await pg.evaluate(RECT + "('.ph-nowcol')"); grid = await pg.evaluate(RECT + "('.ph-grid')")
    if not now: check(False, tag + ': det viktigste nå er én blokk på hjemskjermen (.ph-nowcol)'); await pg.close(); return
    inside = await pg.evaluate("['.ph-clock', '.ph-date', '.ph-widget', '.ph-goals', '.ph-nowc'].filter(s => { const e = document.querySelector('.ph-nowcol ' + s); return e && e.offsetParent; }).length")
    wide = await pg.evaluate("document.getElementById('phone').classList.contains('ph-wide')")   # (beside from a surface of 880 px, place(); 1280 x 800 has it, 1024 x 768 and standing have not)
    check(wide == (ph['w'] >= 880) and (wide or w < 1200), tag + ': oppsettet følger flatas bredde', [wide, round(ph['w'])])
    if wide: check(now['r'] <= grid['l'] + 1 and abs(now['t'] - grid['t']) < 40 and inside >= 4, tag + ': det viktigste nå står ved siden av appene', [round(now['r']), round(grid['l']), inside])
    else: check(now['b'] <= grid['t'] + 1 and now['w'] > 0.8 * grid['w'] and inside >= 4, tag + ': det viktigste nå står over appene', [round(now['b']), round(grid['t']), inside])
    gr = await pg.evaluate("[...document.querySelectorAll('#phone .ph-grp')].map(g => { const q = g.getBoundingClientRect(); return [g.dataset.g, Math.round(q.left), Math.round(q.top), g.querySelectorAll('.ph-app').length]; })")
    check(len(gr) >= 5 and len({g[1] for g in gr}) == 2 and all(g[3] for g in gr), tag + ': gruppene står to og to', gr)
    fit = await pg.evaluate("(() => { const v = document.getElementById('phView'); return [v.scrollHeight, v.clientHeight, v.scrollWidth, v.clientWidth]; })()")
    check(fit[2] <= fit[3] + 1, tag + ': hjemskjermen ruller ikke sidelengs', fit)
    tp = await pg.evaluate("Math.min(...[...document.querySelectorAll('#phone .ph-app .ic')].map(e => Math.min(e.getBoundingClientRect().width, e.getBoundingClientRect().height)))")
    check(tp >= 48, tag + ': flisene er store nok for en finger', tp)
    ov = await pg.evaluate(OVER); check(not ov, tag + ': ingen fliser ligger på hverandre', ov)
    # the apps with something to compare: two columns, and nothing out of the view
    for a in TWO:
        await pg.evaluate("a => { if (a === 'rederi') S.form = 'AS'; PHONE.open(a); }", a); await pg.wait_for_timeout(250)
        c = await pg.evaluate(COLS); check(c['cols'] >= 2 and not c['out'], tag + ': %s har kortene i to spalter og ingenting utenfor flata' % a, c)
    await pg.evaluate("PHONE.open('nett'); document.querySelector('#phone [data-pa=sub][data-s=shop]').click()"); await pg.wait_for_timeout(300)
    nx = await pg.evaluate("[...new Set([...document.querySelectorAll('#phView .ph-card.ic')].filter(e => e.offsetParent).map(e => Math.round(e.getBoundingClientRect().left)))].length")
    check(nx >= 2, tag + ': varekortene i Nettbutikken står i to spalter', nx)
    # the pages that are read
    for a, sb in READ:
        await pg.evaluate("([a, sb]) => { PHONE.open(a); if (sb){ const t = document.querySelector('#phone [data-pa=sub][data-s=' + sb + ']'); if (t) t.click(); } }", [a, sb]); await pg.wait_for_timeout(300)
        if a == 'handbok': await pg.evaluate("(() => { const d = document.querySelector('#phView .hb-list details, #phView .hb-ch'); if (d && d.tagName === 'DETAILS') d.open = true; })()")
        ln = await pg.evaluate(LINES); check(30 <= ln[0] <= 80, tag + ': %s%s har en linje som kan leses (høyst rundt 75 tegn)' % (a, ' › ' + sb if sb else ''), ln)
    # the paper: the newspaper, and the naust's list
    await pg.evaluate("PHONE.open('post')"); await pg.wait_for_timeout(250); lp = await pg.evaluate(LUM + "('#phView .ph-appv')")
    await pg.evaluate("PHONE.open('naustp')"); await pg.wait_for_timeout(250); ln2 = await pg.evaluate(LUM + "('#phView .ph-appv')"); ttl = await pg.evaluate("document.querySelector('#phView .ph-top').textContent")
    await pg.evaluate("PHONE.open('vaer')"); await pg.wait_for_timeout(250); lv = await pg.evaluate(LUM + "('#phView .ph-appv')")
    check(lp > 0.8 and ln2 > 0.8 and lv < 0.15 and ttl == 'Naustet', tag + ': Kystposten og naustets liste har papiret sitt, appene er mørkt glass', [round(lp, 2), round(ln2, 2), round(lv, 2), ttl])
    # closing it brings the dock back; the bar at the bottom closes it with a tap
    await pg.evaluate("document.querySelector('#phone .ph-nav [data-pa=close]').click()"); await pg.wait_for_timeout(600)
    dock2 = await pg.evaluate("[...document.querySelectorAll('#dock button')].filter(e => e.offsetParent && getComputedStyle(e).visibility === 'visible').length")
    check(dock2 == dock0 and not await pg.evaluate("PHONE.isOpen() || document.body.classList.contains('ph-on')"), tag + ': knappelinja er tilbake når telefonen lukkes', [dock0, dock2])
    # the screen turned while it is open: the phone is measured again and still on the screen
    await pg.evaluate("PHONE.show(true)"); await pg.wait_for_timeout(500); await pg.set_viewport_size({'width': h, 'height': w}); await pg.wait_for_timeout(700)
    p2 = await pg.evaluate(RECT + "('#phone')"); h2 = await pg.evaluate(RECT + "('#hud')")
    check(p2['l'] >= 0 and p2['t'] >= 0 and p2['r'] <= h and p2['b'] <= w and p2['w'] > 330 and (not h2 or not h2['w'] or h2['r'] <= p2['l'] or h2['b'] <= p2['t'] or (w - h2['b'] <= 700 and h - h2['r'] <= 700)), tag + ': snudd skjerm: flata er målt på nytt', [round(p2[k]) for k in 'ltrb'])
    check(not errs, tag + ': ingen sidefeil', errs[:3]); await pg.close()


async def phone(b, w, h, tag):
    pg = await b.new_page(viewport={'width': w, 'height': h}); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    await boot(pg); await pg.evaluate("S.boat.status = 'port'; renderActs(); PHONE.show(true)"); await pg.wait_for_timeout(700)
    ph = await pg.evaluate(RECT + "('#phone')"); nc = await pg.evaluate("getComputedStyle(document.querySelector('.ph-nowcol')).display")
    cam = await pg.evaluate("getComputedStyle(document.querySelector('.ph-cam')).display"); tiles = await pg.evaluate("getComputedStyle(document.querySelector('.ph-grid')).display")
    want = [0, 0, w, h] if w <= 560 else [w - min(380, round(0.62 * w)), 0, w, h]
    check([round(ph[k]) for k in 'ltrb'] == want and nc == 'contents' and cam == 'none' and tiles == 'flex', tag + ': telefonen på en telefon er som før (fyller skjermen uten ramme, én spalte)', [[round(ph[k]) for k in 'ltrb'], nc, cam, tiles])
    await pg.evaluate("PHONE.open('kvote')"); await pg.wait_for_timeout(250); c = await pg.evaluate(COLS)
    check(c['cols'] == 1 and not c['out'], tag + ': appene har én spalte på en telefon', c)
    await pg.evaluate("PHONE.open('regler')"); await pg.wait_for_timeout(250); c = await pg.evaluate(COLS)
    check(not c['out'], tag + ': «Hvor du er» i Regler holder seg i kortet', c)
    check(not errs, tag + ': ingen sidefeil', errs[:3]); await pg.close()


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        await tablet(b, 800, 1280, 'stående nettbrett'); await tablet(b, 1280, 800, 'liggende nettbrett'); await tablet(b, 1024, 768, 'lite nettbrett')
        # (the independent check, D5: the home screen ran sideways in a small window lying down, and the phone lay half over the box on a small tablet standing)
        # (the review of the code: at 1024 px the tiles were pressed onto each other, since the layout followed the screen's width and not the surface's)
        for w, h in ((600, 521), (640, 540), (768, 1024), (600, 960), (1024, 600), (960, 600), (561, 900), (900, 700)):
            pg = await b.new_page(viewport={'width': w, 'height': h}); await boot(pg); await pg.evaluate("S.boat.status = 'port'; renderActs(); PHONE.show(true)"); await pg.wait_for_timeout(700)
            f = await pg.evaluate("(() => { const v = document.getElementById('phView'); return [v.scrollWidth, v.clientWidth]; })()"); ph = await pg.evaluate(RECT + "('#phone')"); hud = await pg.evaluate(RECT + "('#hud')")
            half = bool(hud and hud['w'] and hud['b'] > ph['t'] + 1 and hud['t'] < ph['t'] - 1 and hud['r'] > ph['l'] + 1)
            check(f[0] <= f[1] + 1 and not half, '%d × %d: hjemskjermen ruller ikke sidelengs, og flata ligger ikke halvt over statusboksen' % (w, h), [f, [round(ph[k]) for k in 'ltrb'], hud and [round(hud[k]) for k in 'ltrb']])
            ov = await pg.evaluate(OVER); check(not ov, '%d × %d: ingen fliser ligger på hverandre' % (w, h), ov)
            await pg.close()
        await phone(b, 390, 844, 'stående telefon'); await phone(b, 844, 390, 'liggende telefon')
        await b.close()

asyncio.run(main())
