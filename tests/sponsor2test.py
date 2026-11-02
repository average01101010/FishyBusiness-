"""M8 in docs/planer/butikker-og-sponsorer.md: the rest of the formats, with the made-up test sponsors (#sptest). An advertisement in
Kystposten (one, marked «Annonse», with its link marked, never counted as unread); a broker's own boat in the market (marked «formidlet av»,
first as featured, the link to the real boat); a partner's jacket in the wardrobe (free, marked); an extra prize on the event's card; a gift
(a garment sold for game money anyway) once, with the sender. Without an agreement none of it. Pictures in both formats. Prints OK or FEIL."""
from _env import boot, GAME
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:400]) if extra != '' else ''))


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch()
        pg = await br.new_page(viewport={'width': 1280, 'height': 800}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        # without an agreement: nothing of it
        await boot(pg)
        r = await pg.evaluate("({ad:pressList(false).some(s => s.kind === 'annonse'), br:mktListings().some(x => x.broker), gift:!!(S.spGift && Object.keys(S.spGift).length)})")
        check(not r['ad'] and not r['br'] and not r['gift'], 'uten avtale: ingen annonse, ingen meglerbåt, ingen gave', r)
        await pg.close()

        pg = await br.new_page(viewport={'width': 1280, 'height': 800})
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + ',sptest')
        await pg.wait_for_function("SPN.list.some(r => r.kind === 'press')", timeout=15000)
        # the gift: once, a garment, with the sender
        g = await pg.evaluate("(() => { const a = S.clothes.olje || 0; SPUI.gifts(); SPUI.gifts(); return {olje:S.clothes.olje, before:a, got:S.spGift, msg:(S.msgs.slice(-3).find(m => m.from === 'Nordlys Utstyr') || {}).no || ''}; })()")
        check(g['got'] and '-7' in g['got'] and 'Samarbeid' in g['msg'] and g['olje'] == g['before'], 'gaven kommer én gang, med avsenderen og merket', g)
        # Kystposten: one advertisement on the front page, marked, never unread
        await pg.evaluate("PHONE.show(true); PHONE.open('post')"); await pg.wait_for_timeout(400)
        k = await pg.evaluate("""(() => { const ads = pressList(false).filter(s => s.kind === 'annonse'); const kick = [...document.querySelectorAll('#phone .pa-btn .pa-kick')].map(x => x.textContent);
          return {n:ads.length, kick:kick.filter(t => /Annonse/.test(t)).length, unread:pressUnread(), unreadNoAd:pressList(false).filter(s => s.kind !== 'gen' && s.kind !== 'annonse' && s.t > pressState().seen).length, key:ads[0] && ads[0].key}; })()""")
        check(k['n'] == 1 and k['kick'] == 1, 'Kystposten har én annonse, merket «Annonse»', k)
        await pg.evaluate("(k => { const b = [...document.querySelectorAll('#phone .pa-btn')].find(x => x.dataset.k === k); b && b.click(); })('%s')" % k['key']); await pg.wait_for_timeout(300)
        a = await pg.evaluate("(() => { const l = document.querySelector('#phone .pa-art a.ic-sp-link'); return {link:!!l, rel:l && l.rel, target:l && l.target, href:l && l.href, txt:(document.querySelector('#phone .pa-ad') || {}).textContent || ''}; })()")
        check(a['link'] and 'sponsored' in a['rel'] and a['target'] == '_blank' and 'fra=detstorebla' in a['href'] and 'Annonse fra Nordlys Utstyr' in a['txt'], 'annonsen sier hvem den er fra, og lenken er merket', a)
        await pg.screenshot(path='m8_annonse_liggende.png')
        # the broker's boat: first, marked, with the link to the real boat
        await pg.evaluate("PHONE.open('nett'); document.querySelector('#phone .net-tile[data-s=megler]').click()"); await pg.wait_for_timeout(400)
        m = await pg.evaluate("(() => { const c = document.querySelectorAll('#phone .mg-card'); return {first:c[0] && c[0].dataset.id, tag:c[0] && c[0].textContent.includes('formidlet av Nordlys Båtmegling')}; })()")
        check(m['first'] == 'DSB-M-8' and m['tag'], 'meglerens båt står først, merket «formidlet av»', m)
        await pg.evaluate("document.querySelector('#phone .mg-card[data-id=\"DSB-M-8\"]').click()"); await pg.wait_for_timeout(300)
        s = await pg.evaluate("(() => { const b = document.querySelector('#phone .mg-broker'), l = b && b.querySelector('a.ic-sp-link'); return {card:!!b, link:l && l.textContent, rel:l && l.rel, line:b && b.textContent.includes('ny motor 2019')}; })()")
        check(s['card'] and s['line'] and 'ekte båten' in (s['link'] or '') and 'sponsored' in (s['rel'] or ''), 'siden har meglerens kort, teksten og lenken til den ekte båten', s)
        await pg.screenshot(path='m8_megler_liggende.png')
        await pg.set_viewport_size({'width': 800, 'height': 1280}); await pg.wait_for_timeout(300); await pg.screenshot(path='m8_megler_staaende.png')
        await pg.set_viewport_size({'width': 1280, 'height': 800})
        # the event: the extra prize on the Lofoten card (the season app)
        await pg.evaluate("PHONE.open('sesong')"); await pg.wait_for_timeout(400)
        e = await pg.evaluate("(document.querySelector('#phone .sp-ev') || {}).textContent || ''")
        check('Ekstra premie fra Nordlys Utstyr' in e and 'Samarbeid' in e, 'Lofotfisket viser den ekstra premien, merket', e)
        await pg.evaluate("PHONE.show(false)")
        # the wardrobe: the partner's jacket, free and marked
        await pg.evaluate("WARD.open()"); await pg.wait_for_timeout(500)
        await pg.evaluate("document.querySelector('#wardrobe [data-wd=tab][data-v=top]').click()"); await pg.wait_for_timeout(300)
        w = await pg.evaluate("(() => { const b = document.querySelector('#wardrobe [data-wd=sptop]'); if (b) b.click(); const l = WARD.look(); return {btn:!!b, txt:b && b.textContent, note:(document.querySelector('#wardrobe .wd-note') || {}).textContent || '', tp:l.tp, tk:l.tk}; })()")
        check(w['btn'] and 'gratis' in w['txt'] and 'Samarbeid' in w['note'] and w['tp'] == 'oilskin' and w['tk'] == 2, 'Garderoben har partnerens jakke gratis, merket, og den tas på', w)
        await pg.screenshot(path='m8_garderobe_liggende.png')
        await pg.set_viewport_size({'width': 800, 'height': 1280}); await pg.wait_for_timeout(400); await pg.screenshot(path='m8_garderobe_staaende.png')
        print('sidefeil', errs)
        await br.close()

asyncio.run(main())
