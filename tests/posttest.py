"""Kystposten as the coast's shared paper (core/09h-press.js, ui/05g-press.js, supabase/migrations/20261007170000_news.sql; Jonas
07.10.2026): the player's own stories are made where they happen (grounding, the rescue boat, a boat named, a boat bought, salvage, a
lighthouse picture, a big fish, sea time, a badge chapter, a limited company) and read in both languages with a headline, an ingress and a
body; the others' stories and the biggest landings come from the cloud and are read the same way; the front page has the whole coast and
the local tab what is within 150 km of home; the app shows the unread count, a story opens to read and goes back; a story is told in the
game; one's own go to the cloud with only their kind's keys and never from a guest. Prints OK or FEIL per check."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:600]) if extra != '' else ''))


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        ctx = await br.new_context(viewport={'width': 1100, 'height': 800}); pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        # 1. one's own stories, made where they happen, every kind read in both languages with no hole in the words
        own = await pg.evaluate("""(() => { window.__t = []; const t0 = window.toast; window.toast = m => { window.__t.push(m); t0(m); };
          const b = S.boat; S.press = null; const home = pressHome(); b.pos = {x:home.x + 3, y:home.y + 2};
          runAground({...b.pos}); b.status = 'idle'; b.damage = 0;
          boatChristen('Testa');
          pressPut('boat', {type:'sjark', nb:0, price:1150000}); pressPut('boat', {type:'sjarkny', nb:1, price:10500000});
          pressPut('salv', {towed:2, port:S.home || 'finnsnes', pay:9500, val:57000}); pressPut('foto', {fyr:5, lys:'sol'}, {img:999});
          pressPut('fish', {sp:'kveite', kg:112}); pressPut('fs', {y:10}); pressPut('ach', {ch:0}); S.company = 'Testa Fiskeri AS'; pressPut('as', {type:b.type});
          const P = pressState(), kinds = P.own.map(x => x.kind), stories = P.own.map(pressStory);
          const words = stories.filter(Boolean).map(s => [s.h[0], s.h[1], s.ing[0], s.ing[1], ...s.body.flat()].join(' ')).join(' | ');
          return {kinds, n:stories.filter(Boolean).length, all:stories.length, hole:/undefined|NaN|null|\\[object/.test(words), sample:stories.filter(Boolean).map(s => s.h[0]), body:stories.every(s => s && s.body.length > 0)}; })()""")
        need = ['aground', 'name', 'boat', 'boat', 'salv', 'foto', 'fish', 'fs', 'ach', 'as']
        check(own['kinds'] == need and own['n'] == own['all'] and not own['hole'] and own['body'],
              "one's own stories where they happen: grounding, a boat named and bought, salvage, a lighthouse picture, a big fish, sea time, a chapter and a company; each with a headline, an ingress and a body to read, in both languages", own)
        # 2. the others' stories and the biggest landings, the front page and the local tab
        fr = await pg.evaluate("""(() => { const home = pressHome(), far = PORTS.filter(q => q.pier && dist(q.p, home) > 400)[0], near = PORTS.filter(q => q.pier && dist(q.p, home) < 60)[0], gh = S.t / 60;
          PRESS.remote = [{id:101, gh:gh - 1, kind:'aground', x:far.p.x, y:far.p.y, boat:'Langt Unna', company:'', d:{type:'sjark'}, me:false},
                          {id:102, gh:gh - 2, kind:'rescue', x:near.p.x, y:near.p.y, boat:'Naboen', company:'Nabo Fiskeri AS', d:{base:near.id, port:near.id}, me:false},
                          {id:103, gh:gh - 3, kind:'boat', x:near.p.x, y:near.p.y, boat:'Kjøperen', company:'', d:{type:'hurtigsjark', nb:0, price:4900000}, me:false},
                          {id:104, gh:gh - 3, kind:'boat', x:near.p.x, y:near.p.y, boat:'Ukjent', company:'', d:{type:'ingen_slik'}, me:false}];
          PRESS.land = [{gh:gh - 4, port:far.id, acc:'open', kg:5400, sp:'torsk', boat:'Storfangst', company:'', me:false}, {gh:gh - 5, port:near.id, acc:'lukket', kg:2100, sp:'sei', boat:'Lokalen', company:'Lokal AS', me:false}];
          const F = pressList(false), Lc = pressList(true), has = (L, f) => L.some(f);
          return {front:F.length, local:Lc.length,
            farFront:has(F, s => s.key === 'r101'), farLocal:has(Lc, s => s.key === 'r101'), nearLocal:has(Lc, s => s.key === 'r102'), unknown:has(F, s => s.key === 'r104'),
            landFront:(F.find(s => s.kind === 'land') || {}).h, landLocal:(Lc.find(s => s.kind === 'land') || {}).h, rescue:(F.find(s => s.key === 'r102') || {}).ing,
            gen:has(F, s => s.kind === 'gen') || has(Lc, s => s.kind === 'gen'), hole:/undefined|NaN/.test(JSON.stringify(F.concat(Lc).map(s => [s.h, s.ing, s.body])))}; })()""")
        check(fr['farFront'] and not fr['farLocal'] and fr['nearLocal'] and not fr['unknown'] and fr['landFront'] and 'Dagens' in fr['landFront'][0] and fr['landLocal'] and 'distriktet' in fr['landLocal'][0] and fr['gen'] and not fr['hole'] and 'Nabo Fiskeri AS' in fr['rescue'][0],
              "the others' stories and the biggest landings: the front page has the whole coast, the local tab what is within 150 km of home; a story of a kind or key this game does not know is left out", fr)
        # 3. the unread count on the app, the paper on the phone: the tabs, a story opened to read and back
        ph = await pg.evaluate("""(() => { pressSeen(); const n0 = pressUnread(); PRESS.remote.push({id:105, gh:S.t / 60 + 0.5, kind:'fish', x:pressHome().x, y:pressHome().y, boat:'Heldiggrisen', company:'', d:{sp:'torsk', kg:38}, me:false});
          S.t += 60; const n1 = pressUnread(); PHONE.show(true); PHONE.open('home'); PHONE.render(); const v = () => document.getElementById('phView');
          const badge = !!v().querySelector('[data-a="post"] .bd');
          PHONE.open('post'); const front = v().innerText, tabs = /Forsiden/.test(front) && /Lokalt/.test(front);
          const btn = v().querySelector('[data-pa="art"]'); btn.click(); const art = v().querySelector('.pa-art'), h3 = art && art.querySelector('h3').innerText, paras = art ? art.querySelectorAll('p').length : 0;
          v().querySelector('[data-pa="artback"]').click(); const back = !!v().querySelector('[data-pa="art"]');
          const lok = v().querySelector('[data-pa="sub"][data-s="lok"]'); lok.click(); const local = /150 km/.test(v().innerText);
          const n2 = pressUnread(); PHONE.show(false);
          return {n0, n1, badge, tabs, h3, paras, back, local, n2}; })()""")
        check(ph['n0'] == 0 and ph['n1'] >= 1 and ph['badge'] and ph['tabs'] and ph['h3'] and ph['paras'] >= 2 and ph['back'] and ph['local'] and ph['n2'] == 0,
              'the app shows how many stories are unread; the paper has the front page and the local tab, a story opens to read on and goes back, and opening it reads them', ph)
        # 4. told in the game, and to the cloud: only the kind's keys, the boat's name, never from a guest
        await pg.wait_for_timeout(4500)
        cl = await pg.evaluate("""(async () => { const told = window.__t.filter(m => /^Kystposten: /.test(m)).length;
          const calls = []; const rpc0 = window.cloudRpc; window.cloudRpc = async (fn, a) => { calls.push([fn, a]); return null; };
          CLOUD.on = true; CLOUD.user = {id:'user_test'}; CLOUD.guest = false; S.press.q = [];
          pressPut('fish', {sp:'torsk', kg:31}); await new Promise(r => setTimeout(r, 300));
          const put = calls.find(c => c[0] === 'news_put'), keys = put ? Object.keys(put[1]).sort().join(',') : null, dk = put ? Object.keys(put[1].d).sort().join(',') : null;
          calls.length = 0; CLOUD.guest = true; pressPut('fish', {sp:'torsk', kg:33}); await new Promise(r => setTimeout(r, 300));
          const guest = calls.filter(c => c[0] === 'news_put').length, q = S.press.q.length;
          CLOUD.guest = false; window.cloudRpc = async (fn, a) => fn === 'news_get' ? {news:[{id:900, gh:S.t / 60, kind:'aground', x:1, y:1, boat:'X', company:'', d:{}, me:false}], land:[]} : null;
          PRESS.at = 0; await pressFetch(true); const got = PRESS.remote.some(x => x.id === 900);
          window.cloudRpc = rpc0; CLOUD.on = false; CLOUD.user = null;
          return {told, keys, dk, boat:put && put[1].boat, haill:put ? /haill/i.test(JSON.stringify(put[1])) : null, guest, q, got}; })()""")
        check(cl['told'] >= 1 and cl['keys'] == 'boat,company,d,gh,kind,x,y' and cl['dk'] == 'kg,sp' and cl['boat'] and cl['haill'] is False and cl['guest'] == 0 and cl['q'] == 0 and cl['got'],
              "a story is told in the game; one's own goes to the cloud with only its kind's keys and the boat's name, never anything of haill, and not from a guest; the others' come down", cl)
        check(errs == [], 'sidefeil', errs[:3])
        await br.close()


asyncio.run(main())
