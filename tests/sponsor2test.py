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
        # a partner's paint design (steg 44): without an agreement no card in the paint shop, and a design left on a boat shows nothing
        n = await pg.evaluate("""(() => { S.boat.status = 'port'; S.boat.liv = {hull:'rod', sp:-9}; DOCK.open('maler');
          const r = {fn:typeof spPaints, n:typeof spPaints === 'function' ? spPaints().length : -1, card:document.querySelectorAll('#drawerBody .pnt-sp').length, hull:(hullLiv(S.boat) || {}).hull, str:livStr(S.boat)};
          delete S.boat.liv; DOCK.close(); return r; })()""")
        check(n['fn'] == 'function' and n['n'] == 0 and n['card'] == 0 and n['hull'] and abs(n['hull'][0] - 0.7) < 0.01 and 'x:' not in n['str'] and 'h:rod' in n['str'],
              'uten avtale: ingen sponset design i Malerverkstedet, og et design som sto på båten, vises ikke (hennes egen maling)', n)
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
        # the partner's paint design in the paint shop (steg 44): beside the shop's own designs, free, marked, looks only, shown to the
        # others by its id, and gone when the agreement is
        await pg.set_viewport_size({'width': 1280, 'height': 800})
        d = await pg.evaluate("""(async () => { const q = s => document.querySelector('#drawerBody ' + s), wait = () => new Promise(r => setTimeout(r, 120));
          S.boat.status = 'port'; S.cash = 50000; S.boat.liv = {hull:'rod'}; DOCK.open('maler'); await wait();
          const card = q('.pnt-sp'), base = () => JSON.stringify(Object.assign({}, S.boat, {liv:0})), b0 = base(), cos0 = JSON.stringify(S.cos || {}), cash0 = S.cash;
          const r = {card:!!card, txt:card ? card.textContent : '', buy:card ? card.querySelectorAll('[data-pa=pntbuy]').length : -1, link:card && card.querySelector('a.ic-sp-link') ? card.querySelector('a.ic-sp-link').rel : '',
            before:!!card && !!card.nextElementSibling && [...document.querySelectorAll('#drawerBody .pnt-h')].some(h => card.compareDocumentPosition(h) & 4)};
          q('[data-pa=pntsp]').click(); await wait(); r.tried = {sp:PAINTPRE && PAINTPRE.sp, hull:(hullLiv(S.boat) || {}).hull, ripe:(hullLiv(S.boat) || {}).ripe, go:q('[data-pa=pntgo]').textContent, dis:q('[data-pa=pntgo]').disabled, own:S.boat.liv};
          q('.pnt-sw[data-pa=pntsel][data-k=kobolt]').click(); await wait(); r.own = {sp:PAINTPRE.sp, hull:PAINTPRE.hull};   // choosing the own paint takes the design off the try
          q('.pnt-sw[data-pa=pntsel][data-k=rod]').click(); await wait(); q('[data-pa=pntsp]').click(); await wait(); q('[data-pa=pntgo]').click(); await wait();
          r.on = {liv:S.boat.liv, paid:cash0 - S.cash, same:base() === b0, cos:JSON.stringify(S.cos || {}) === cos0, str:livStr(S.boat), hull:(hullLiv(S.boat) || {}).hull, now:q('.pnt-sp .pnt-own').textContent};
          r.peer = {x:livParse('h:rod;x:-9'), none:livParse('h:rod;x:-99'), logo:spPaintLogo(spPaintIn('x:-9'))};
          return r; })()""")
        check(d['card'] and 'Samarbeid' in d['txt'] and 'Nordlys Utstyr' in d['txt'] and 'gratis' in d['txt'] and 'Bare utseende' in d['txt'] and d['buy'] == 0 and '💎' not in d['txt'] and 'sponsored' in d['link'] and d['before'],
              'Malerverkstedet har partnerens design ved siden av de vanlige: gratis, merket «Samarbeid», uten kjøpsknapp', {k: d[k] for k in ('card', 'buy', 'link', 'before', 'txt')})
        t = d['tried']
        check(t['sp'] == -9 and t['hull'] and abs(t['hull'][1] - 0.32) < 0.01 and t['ripe'] and 'Bruk designet' in t['go'] and not t['dis'] and t['own'] == {'hull': 'rod'} and d['own'].get('sp') is None and d['own']['hull'] == 'kobolt',
              'designet prøves på båten før det tas på, og et eget fargevalg tar det av prøven', [t, d['own']])
        o = d['on']
        check(o['liv'] == {'hull': 'rod', 'sp': -9} and o['paid'] == 0 and o['same'] and o['cos'] and abs(o['hull'][1] - 0.32) < 0.01 and 'På båten' in o['now'],
              'tatt på: gratis, bare utseende (båten ellers uendret, ingen design gitt), og hennes egen maling ligger under', o)
        pr = d['peer']
        check('x:-9' in o['str'] and 'h:petrol' in o['str'] and pr['x'] and abs(pr['x']['hull'][1] - 0.32) < 0.01 and pr['x'].get('ripe') and abs(pr['none']['hull'][0] - 0.7) < 0.01 and pr['logo'] and pr['logo']['kind'] == 'g',
              'de andre ser designet fra koden (x:-9) mot lista over aktive avtaler, med merket; et ukjent nummer gir bare hennes egen farge', [o['str'], pr])
        await pg.screenshot(path='m8_design_liggende.png')
        await pg.set_viewport_size({'width': 800, 'height': 1280}); await pg.wait_for_timeout(400)
        await pg.evaluate("document.querySelector('#drawerBody .pnt-sp').scrollIntoView({block:'center'})"); await pg.wait_for_timeout(200); await pg.screenshot(path='m8_design_staaende.png')
        await pg.set_viewport_size({'width': 1280, 'height': 800}); await pg.wait_for_timeout(300)
        g2 = await pg.evaluate("""(async () => { const wait = () => new Promise(r => setTimeout(r, 120)), keep = SPN.list.slice();
          spSet(keep.filter(r => !(r.kind === 'look' && r.target === 'paint'))); DOCK.open('maler'); DOCK.redraw(); await wait();
          const r = {card:document.querySelectorAll('#drawerBody .pnt-sp').length, hull:(hullLiv(S.boat) || {}).hull, str:livStr(S.boat), peer:livParse('h:rod;x:-9').hull};
          spSet(keep); DOCK.redraw(); await wait(); const q = s => document.querySelector('#drawerBody ' + s);
          q('[data-pa=pntsp]').click(); await wait(); q('[data-pa=pntgo]').click(); await wait(); r.off = {liv:S.boat.liv, hull:(hullLiv(S.boat) || {}).hull, str:livStr(S.boat)};
          DOCK.close(); return r; })()""")
        check(g2['card'] == 0 and abs(g2['hull'][0] - 0.7) < 0.01 and 'x:' not in g2['str'] and abs(g2['peer'][0] - 0.7) < 0.01,
              'avtalen slutter: kortet er borte, og båten er i sin egen maling hos spilleren og hos de andre', g2)
        check(g2['off']['liv'] == {'hull': 'rod'} and abs(g2['off']['hull'][0] - 0.7) < 0.01 and 'x:' not in g2['off']['str'], 'designet tas av igjen, og den egne malingen er der', g2['off'])
        pal = await pg.evaluate("""(() => { const keep = SPN.list.slice(); spSet([{id:5, kind:'look', target:'paint', data:{hull:'#ff00ff', house:'kystfisker', ripe:'gul', lakk:1}, sponsor:{name:'X', logo:'https://x.example/l.png'}}]);
          const M = spPaintLiv(spPaintOf(5)), r = {hull:M.hull || null, house:M.house || null, ripe:M.d.ripe, lakk:M.d.lakk, logo:spPaintLogo(spPaintOf(5))}; spSet(keep); return r; })()""")
        check(pal['hull'] is None and pal['house'] is None and pal['ripe'] == 'gul' and pal['lakk'] == 1 and pal['logo'] == {'kind': 'u', 'url': 'https://x.example/l.png'},
              'bare Malerverkstedets egne farger kan males (ikke en fri farge, ikke den som må fortjenes), og med logo_url er merket sponsorens bilde', pal)
        # (from the review of steg 44) a choice that is refused does not take the tried design off; a design that paints nothing is not
        # one; the zones as the boat's model has them; the others' model is kept apart by whether the design was found
        rv = await pg.evaluate("""(() => { const keep = SPN.list.slice(), t = S.boat.type, r9 = spPaintOf(-9), R = {};
          DOCK.open('maler'); PAINT.act('pntsp', {k:'-9'}); R.refused = [PAINT.act('pntz', {d:'finnesikke', k:'hvit'}), PAINT.act('pntsel', {k:'finnesikke'}), PAINTPRE.sp];
          R.taken = [PAINT.act('pntsel', {k:'rod'}), PAINTPRE.sp === undefined]; DOCK.close();
          R.zone = [!!spPaintLiv(r9, t).house, !!glbZones(t)[3], !!spPaintLiv(r9).house];
          R.k1 = npcModel('sjark', 0.3, 'h:rod;x:-9') === npcModel('sjark', 0.3, 'h:rod;x:-9');
          const m1 = npcModel('sjark', 0.3, 'h:rod;x:-9'); spSet(keep.filter(r => r.id !== -9)); R.k2 = npcModel('sjark', 0.3, 'h:rod;x:-9') !== m1;
          spSet([{id:6, kind:'look', target:'paint', data:{hull:'#ff00ff', name:'X'}, sponsor:{name:'X'}}]); R.none = [spPaints().length, spPaintOf(6), spWorn({sp:6})];
          spSet(keep); return R; })()""")
        check(rv['refused'] == [False, False, -9] and rv['taken'] == [True, True], 'et valg som avvises, tar ikke designet av prøven; et eget fargevalg gjør det', rv)
        check(rv['zone'][0] == rv['zone'][1] and rv['zone'][2] and rv['k1'] and rv['k2'] and rv['none'] == [0, None, None],
              'overbygget males bare der modellen har sonen; de andres modell bygges på nytt når avtalen slutter; et design uten en farge fra paletten er ikke et design', rv)
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
