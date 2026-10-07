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
        # 5. more kinds: a long trip or the season's move done, a structure quota bought; the week's top boats from the shared leaderboard
        #    (the local fleet's «Ukas toppfisker» gives way); the day's biggest landing told to its lander once
        mo = await pg.evaluate("""(async () => { window.__t = []; const P = pressState(), n0 = P.own.length, port = S.home || 'finnsnes', T = turState();
          const m = {id:++T.seq, k:'sesong', cls:'sesong', to:port, sp:'torsk', kg:4000, got:4200, nm:120, pay:300000, h:20, t0:S.t}; T.act.push(m); turPayOut(m, 'Kystposten', 'x', 'x');
          const b = {id:++T.seq, k:'best', cls:'lang', to:port, sp:'hyse', kg:600, nm:80, pay:9000, h:10, t0:S.t}; T.act.push(b); turPayOut(b, 'x', 'x', 'x');
          const k = {id:++T.seq, k:'frakt', cls:'kort', to:port, kg:60, nm:5, pay:900, h:1, t0:S.t, what:['post', 'mail']}; T.act.push(k); turPayOut(k, 'x', 'x', 'x');
          pressPut('kvote', {kf:1234, type:S.boat.type});
          const own = P.own.slice(n0).map(pressStory), kinds = P.own.slice(n0).map(x => x.kind + (x.d.k ? ':' + x.d.k : ''));
          const wt0 = window.worldTop, wk = weekOf(S.t / 60) - 1;
          S.t = Math.max(S.t, 2 * 168 * 60 + 600);
          window.worldTop = (w, g) => ({data:{rows:g === 'open' ? [{rank:1, boat:'Toppbåten', company:'', port:port, kg:9100, me:false}, {rank:2, boat:'Nummer To', company:'', port:port, kg:7000, me:false}] : []}});
          const F = pressList(false), top = F.find(x => x.kind === 'top'), oldTop = F.some(x => x.kind === 'gen' && /^Ukas toppfisker/.test(x.h[0]));
          window.worldTop = () => null; const noTop = pressList(false).some(x => x.kind === 'top'); window.worldTop = wt0;
          PRESS.land = [{gh:S.t / 60 - 1, port:port, acc:'open', kg:1500, sp:'torsk', boat:'Meg', company:'', me:true}];
          const rpc0 = window.cloudRpc; window.cloudRpc = async fn => fn === 'news_get' ? {news:[], land:PRESS.land} : null; CLOUD.on = true; CLOUD.user = {id:'u'}; CLOUD.guest = false;
          PRESS.toldAt = 0; PRESS.at = 0; await pressFetch(true); PRESS.at = 0; await pressFetch(true); window.cloudRpc = rpc0; CLOUD.on = false; CLOUD.user = null;
          await new Promise(r => setTimeout(r, 4500));
          const told = window.__t.filter(x => /Dagens største landing/.test(x)).length;
          return {kinds, ok:own.every(Boolean), heads:own.filter(Boolean).map(x => x.h[0]), hole:/undefined|NaN/.test(JSON.stringify(own)), top:top && top.h[0], topBody:top && top.body.length, oldTop, noTop, told}; })()""")
        check(mo['kinds'] == ['tur:sesong', 'tur:best', 'kvote'] and mo['ok'] and not mo['hole'] and mo['top'] and 'Toppbåten' in mo['top'] and mo['topBody'] == 2 and not mo['oldTop'] and not mo['noTop'] and mo['told'] == 1,
              "more kinds: the season's move and a long trip done (not a short one), a structure quota; the week's top boats from the shared leaderboard in place of the local fleet's; the day's biggest landing told to its lander once", mo)
        # 6. a record price (the highest in a year, the same day in every game) on the front page, told once; the year's first skrei from
        #    the shared landings, the first north of Stad, told once and not asked for again once it has stood
        rs = await pg.evaluate("""(async () => { window.__t = []; let d = -1; for (let k = 1; k < 900 && d < 0; k++) if (pressRecords(k).length) d = k;
          if (d < 0) return {d}; S.t = d * 1440 + 180; const sp = pressRecords(d)[0];
          const F = pressList(false), rec = F.find(x => x.kind === 'pris'), loc = pressList(true).some(x => x.kind === 'pris');
          PRESS.toldAt = 0; pressDay(d * 24 + 3); await new Promise(r => setTimeout(r, 200)); PRESS.toldAt = 0; pressDay(d * 24 + 4); await new Promise(r => setTimeout(r, 200));
          const toldRec = window.__t.filter(x => /Rekordpris/.test(x)).length;
          const H0 = pressSkreiH(2028); S.t = (H0 + 10) * 60; window.__t = [];
          const south = PORTS.find(q => q.mottak && natLL(q.p).lat < 62), home = S.home || 'finnsnes', calls = [];
          const rpc0 = window.cloudRpc; window.cloudRpc = async (fn, a) => { calls.push(fn); return fn === 'news_first' ? [{gh:H0 + 2, port:south.id, kg:80, boat:'Sorbaten', company:'', me:false}, {gh:H0 + 3, port:home, kg:120, boat:'Nordbaten', company:'', me:true}] : null; };
          CLOUD.on = true; CLOUD.user = {id:'u'}; CLOUD.guest = false; PRESS.toldAt = 0;
          await pressSkreiFetch(); await new Promise(r => setTimeout(r, 4500)); await pressSkreiFetch();
          window.cloudRpc = rpc0; CLOUD.on = false; CLOUD.user = null;
          const sk = pressList(false).find(x => x.kind === 'skrei'), skl = pressList(true).some(x => x.kind === 'skrei');
          return {d, sp, rec:rec && rec.h[0], recBody:rec && rec.body.length, loc, toldRec, hole:/undefined|NaN/.test(JSON.stringify([rec, sk])), first:PRESS.skrei && PRESS.skrei.first && PRESS.skrei.first.boat,
            sk:sk && sk.h[0], skIng:sk && sk.ing[0], skMe:sk && sk.me, skl, toldSk:window.__t.filter(x => /første skrei/.test(x)).length, asked:calls.filter(c => c === 'news_first').length}; })()""")
        check(rs['d'] > 0 and rs['rec'] and rs['rec'].startswith('Rekordpris på') and rs['recBody'] >= 3 and not rs['loc'] and rs['toldRec'] == 1 and not rs['hole']
              and rs['first'] == 'Nordbaten' and rs['sk'] and 'Nordbaten' in rs['skIng'] and rs['skMe'] and rs['skl'] and rs['toldSk'] == 1 and rs['asked'] == 1,
              "a record price on the front page (not the local tab), told once; the year's first skrei is the first landing north of Stad, in the paper and told once, not asked for again", rs)
        check(errs == [], 'sidefeil', errs[:3])
        await br.close()


asyncio.run(main())
