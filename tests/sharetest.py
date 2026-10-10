"""Shared catch marks (09.10.2026; ui/10l-share.js, supabase/migrations/20261009200000_shared_marks.sql): a tap on your own catch mark on
the chart opens a card with what it gave and «Del med venner» / «Del med fiskarlaget»; a share sends only the numbers and the button
says «Delt»; the server's limit and «not in a club» come back as a message. The marks shared with you are drawn with the sharer's name,
a line goes to the messages once, and a tap gives «Rute hit». A database without the functions is left alone. A mock stands in for the
database. Prints OK or FEIL per check."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await br.new_page(viewport={'width': 1000, 'height': 700}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        r = await pg.evaluate("""(async () => { const R = {}, g = S.boat.pos, calls = [], wait = ms => new Promise(f => setTimeout(f, ms));
          const real = cloudRpc, c0 = {on:CLOUD.on, user:CLOUD.user}; let reply = 'ok', miss = false;
          const shared = [{id:7, from:'Ola', scope:'f', x:g.x + 2, y:g.y + 1, kgph:34, g:'', kgu:null, soak:null, q:null, age:600},
                          {id:8, from:'Kari', scope:'l', x:g.x - 2, y:g.y + 1, kgph:0, g:'garn', kgu:12.5, soak:14, q:1.3, age:300},
                          {id:9, from:'Utgått9', scope:'f', x:g.x, y:g.y + 3, kgph:10, g:'', age:5 * 3600}];
          window.cloudRpc = async (fn, a) => { calls.push([fn, a]); if (miss) throw new Error('rpc ' + fn + ' 404'); if (fn === 'marks_get') return shared; if (fn === 'mark_share') return reply; return null; };
          CLOUD.on = true; CLOUD.user = {id:'user_x'};
          PHONE.show(false); openPlotter(); renderBase();
          // your own mark: the card and the share
          const mk = {x:g.x + 1, y:g.y - 1, t:S.t - 60, kgph:28, q:1.1}; S.marks.push(mk);
          R.tapOwn = SHARE.tap({x:mk.x + 0.01, y:mk.y}, 0.2); const c = document.getElementById('shCard');
          R.card = !c.hidden && /Fangstmerke/.test(c.innerText) && /28 kg\\/t/.test(c.innerText) && /Del med venner/.test(c.innerText) && /Del med fiskarlaget/.test(c.innerText);
          c.querySelector('[data-s="f"]').click(); await wait(80); R.sent = (calls.find(x => x[0] === 'mark_share') || [0, null])[1];
          R.done = mk.sh === 'f' && /Delt/.test(c.querySelector('[data-s="f"]').textContent);
          reply = 'nolag'; calls.length = 0; c.querySelector('[data-s="l"]').click(); await wait(80); R.nolag = !mk.sh.includes('l') && !c.querySelector('[data-s="l"]').disabled;
          // the marks shared with you
          const m0 = S.msgs.length; SHARE._M.at = 0; SHARE.fetch(true); await wait(120); view.cx = g.x; view.cy = g.y; view.z = 6; applyView(); renderDyn(); const svg = document.getElementById('map').innerHTML;
          R.drawn = (svg.match(/class="shmark/g) || []).length; R.names = /Ola · 34 kg\\/t/.test(svg) && /Kari · 13 kg\\/garn · 14 t/.test(svg) && !/Utgått9/.test(svg); R.nm3 = [/Ola · 34 kg\\/t/.test(svg), /Kari · 13 kg\\/garn · 14 t/.test(svg), /Utgått9/.test(svg)];
          R.svgLbl = (svg.match(/class="lbl-sh"[^>]*>[^<]*/g) || []).join(' | '); R.msgs = S.msgs.slice(m0).map(m => m.from); SHARE.fetch(true); await wait(80); R.msgsOnce = S.msgs.slice(m0).length;
          R.tapShared = SHARE.tap({x:g.x + 2, y:g.y + 1}, 0.2); R.card2 = /Ola delte/.test(c.innerText) && /Rute hit/.test(c.innerText) && !/Del med/.test(c.innerText);
          const n0 = S.draft.length; c.querySelector('[data-s="go"]').click(); R.route = S.draft.length > n0 || (S.plan && S.plan.wps && S.plan.wps.length > 0); R.closed = c.hidden;
          R.miss = SHARE.tap({x:g.x + 40, y:g.y + 40}, 0.2) === false;
          miss = true; SHARE._M.off = false; SHARE.fetch(true); await wait(80); R.off = SHARE._M.off;
          window.cloudRpc = real; CLOUD.on = c0.on; CLOUD.user = c0.user; S.marks = S.marks.filter(m => m !== mk); return R; })()""")
        print(json.dumps(r, ensure_ascii=False)[:1200])
        print(ok(r['tapOwn'] and r['card']), 'a tap on your own catch mark opens its card with what it gave and the two shares')
        print(ok(r['sent'] == {'scope': 'f', 'x': r['sent']['x'], 'y': r['sent']['y'], 'kgph': 28, 'g': '', 'kgu': None, 'soak': None, 'q': 1.1} and r['done'] and r['nolag']),
              'sharing sends only the numbers and the button says «Delt»; «not in a club» leaves it to try again', r['sent'])
        print(ok(r['drawn'] == 2 and r['names'] and r['msgs'] == ['Venner', 'Fiskarlaget'] and r['msgsOnce'] == 2), 'the marks shared with you are on the chart with the name and the catch, the old one is gone, and a message comes once each', [r['drawn'], r['names'], r['msgs'], r['msgsOnce']])
        print(ok(r['tapShared'] and r['card2'] and r['route'] and r['closed'] and r['miss']), 'a tap on a shared mark gives the sharer and «Rute hit», which puts it in the route', [r['tapShared'], r['card2'], r['route'], r['closed']])
        print(ok(r['off']), 'a database without the functions is left alone')
        print('errors:', errs[:3]); await br.close()

asyncio.run(main())
