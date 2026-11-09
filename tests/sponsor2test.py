"""M8 in docs/planer/butikker-og-sponsorer.md: the rest of the formats, with the made-up test sponsors (#sptest). An advertisement in
Kystposten (one, marked «Annonse», with its link marked, never counted as unread); a broker's own boats are read but not shown among the
players' at Kystmegleren since B (07.11.2026); a partner's jacket in the wardrobe (free, marked); an extra prize on the event's card; a gift
(a garment sold for game money anyway) once, with the sender. Without an agreement none of it. And the signs' measure after IAB 2.0
(steg 66, SPM): one viewable impression per placement and session, 0.2 s a frame, the three buckets, fog and night, the UI on top. Pictures in both formats. Prints OK or FEIL."""
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
        r = await pg.evaluate("({ad:pressList(false).some(s => s.kind === 'annonse'), br:SPN.list.some(x => x.kind === 'broker'), gift:!!(S.spGift && Object.keys(S.spGift).length)})")
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
        # the broker's boats (F6) are not among the players' at Kystmegleren since B (Jonas 07.11.2026: «utelukkende være båter andre
        # brukere selger»): the placement is read, but the page shows no partner's boat
        await pg.evaluate("PHONE.open('nett'); document.querySelector('#phone .net-tile[data-s=megler]').click()"); await pg.wait_for_timeout(400)
        m = await pg.evaluate("(() => ({placed:SPN.list.some(r => r.kind === 'broker'), cards:document.querySelectorAll('#phone .mg-card').length, tag:document.querySelector('#phone .ph-c').textContent.includes('formidlet av')}))()")
        check(m['placed'] and m['cards'] == 0 and not m['tag'], 'meglerens plassering står i lista, men Kystmegleren viser bare spillernes båter (B5)', m)
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
        await pg.evaluate("WARD.close ? WARD.close() : null")
        # the signs' measure after IAB 2.0 (steg 66, ui/10r-sponsor.js SPM), fed frames as view3d drawSigns feeds them, on placements of
        # its own (9001-9006) so the game's own banners do not mix in. o: what the frame saw
        M = await pg.evaluate("""(() => {
          const ON = {ok:true, vis:true, det:true, sight:true, live:true, area:0.02}, OFF = Object.assign({}, ON, {ok:false});
          const run = (id, o, dt, n) => { for (let i = 0; i < n; i++) SPM.frame(id, o, dt); }, mine = (rows, id) => rows.filter(r => r.pl === id);
          SPM.take();
          // one viewable impression per placement and session: looked at three times for 1.2 s, away between
          run(9001, ON, 0.05, 24); run(9001, OFF, 0.05, 4); run(9001, ON, 0.05, 24); run(9001, OFF, 0.05, 4); run(9001, ON, 0.05, 24);
          const a = mine(SPM.take(), 9001); run(9001, OFF, 0.05, 2); run(9001, ON, 0.05, 24); const b = mine(SPM.take(), 9001);
          // a slow phone (two frames a second): at most 0.2 s a frame, so a second in a row takes five frames, and 2.5 s of frames give 1 s
          run(9002, ON, 0.5, 4); const c4 = SPM.pl[9002].imp; run(9002, ON, 0.5, 1); const c = mine(SPM.take(), 9002);
          // seen too briefly (0.8 s): not viewable, but measured, and its time is in sec all the same (3.2.10.3)
          run(9003, ON, 0.1, 8); run(9003, OFF, 0.1, 2); const d = mine(SPM.take(), 9003), d2 = mine(SPM.take(), 9003);
          // fog thicker than the distance, and night: in reach and measured, never viewable
          run(9004, Object.assign({}, ON, {sight:false}), 0.1, 30); const f = mine(SPM.take(), 9004);
          // WebGL 1 (no occlusion query): undetermined, once; nobody touching the game: nothing at all
          run(9005, Object.assign({}, ON, {det:false}), 0.1, 30); const u = mine(SPM.take(), 9005), u2 = mine(SPM.take(), 9005);
          run(9006, Object.assign({}, ON, {live:false}), 0.1, 30); const idle = mine(SPM.take(), 9006);
          return {a, b, c4, c, d, d2, f, u, u2, idle,
            sight:[SPM.sightOk(0.1, 120, 20), SPM.sightOk(1.2, 120, 20), SPM.sightOk(50, 60, -7), SPM.sightOk(50, 60, -5), SPM.sightOk(null, 60, null)]};
        })()""")
        a, b = (M['a'] or [{}])[0], (M['b'] or [{}])[0]
        check(a.get('imp') == 1 and a.get('re') == 2 and 3.5 <= a.get('sec', 0) <= 3.7 and b.get('imp') == 0 and b.get('re') == 1,
              'én synlig visning per plassering og økt: tre ganger sett gir imp 1 og to gjensyn, og neste gang bare gjensyn (IAB 3.2 merknad 3)', [a, b])
        c = (M['c'] or [{}])[0]
        check(M['c4'] == 0 and c.get('imp') == 1 and abs(c.get('sec', 0) - 1.0) < 0.05, 'høyst 0,2 s per bilde: fem bilder på 0,5 s gir ett sekund, ikke 2,5 (IAB 3.2.6)', M)
        d, d2 = (M['d'] or [{}])[0], M['d2']
        check(d.get('imp') == 0 and d.get('m') == 1 and abs(d.get('sec', 0) - 0.8) < 0.05 and d2 == [], 'sett i 0,8 s: målt og ikke synlig, tiden tas med, og m sendes én gang', [d, d2])
        f = (M['f'] or [{}])[0]
        check(f.get('imp') == 0 and f.get('m') == 1 and f.get('sec', 0) == 0 and M['sight'] == [False, True, False, True, True],
              'skodde tettere enn avstanden og natt (sola under 6°): målt, aldri synlig (IAB 3.2.5)', [f, M['sight']])
        u = (M['u'] or [{}])[0]
        check(u.get('u') == 1 and u.get('imp') == 0 and u.get('m') == 0 and M['u2'] == [] and M['idle'] == [], 'WebGL 1 er ubestemt, én gang; urørt spill teller ingenting', [u, M['u2'], M['idle']])
        # the UI over the 3D picture (IAB 3.2.4): what lies on top where a touch would land; the phone over a point hides it
        await pg.evaluate("PHONE.show(true)"); await pg.wait_for_timeout(400)
        ui = await pg.evaluate("""(() => { const r = document.getElementById('phone').getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, gl = document.getElementById('gl');
          const on = SPM.uiOver(x, y, gl); PHONE.show(false); return {on, out:SPM.uiOver(-5, -5, gl)}; })()""")
        check(ui['on'] is True and ui['out'] is True, 'telefonen over et punkt skjuler det, og utenfor skjermen er skjult (at 3D-bildet uten UI over ikke skjules, ser signtest)', ui)
        # a new session in the same page (the consent taken back and given again): its own viewable impression
        ns = await pg.evaluate("""(() => { const ON = {ok:true, vis:true, det:true, sight:true, live:true, area:0.02}; SPM.take();
          for (let i = 0; i < 24; i++) SPM.frame(9007, ON, 0.05); const a = SPM.take().filter(r => r.pl === 9007); SPM.frame(9007, Object.assign({}, ON, {ok:false}), 0.05);
          SPM.restart(); for (let i = 0; i < 24; i++) SPM.frame(9007, ON, 0.05); const b = SPM.take().filter(r => r.pl === 9007); return {a, b}; })()""")
        check(ns['a'] and ns['a'][0]['imp'] == 1 and ns['b'] and ns['b'][0]['imp'] == 1 and ns['b'][0]['m'] == 1, 'en ny økt i samme side får sin egen synlige visning og sin egen m', ns)
        print('sidefeil', errs)
        await br.close()

asyncio.run(main())
