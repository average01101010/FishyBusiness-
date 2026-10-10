"""Push notifications in the game (05.10.2026, ui/10g-push.js) with stand-ins for WorkOS, Supabase, push-send and the browser's push:
without the VAPID key the switch is not shown; with it the account card has it, and turning it on asks the browser, subscribes and
tells the server; going to the background lays out what will happen while away (gear that has soaked long enough, the boat at its
harbour with fish, fish about to drop a grade, the yard done, the open group's stop, the season's news) at the right real times, each
group can be turned off, and coming back clears it; a new player is asked to turn them on. Prints OK or FEIL."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:500]) if extra != '' else ''))


CFG = {'hosts': ['127.0.0.1', 'localhost'], 'supabaseUrl': 'https://sb.test', 'supabaseAnon': 'anon_test', 'workosClientId': 'client_test'}
STUB = """window.DSB_CLOUD = %s;
window.DSB_AUTHKIT = {createClient: async () => ({getUser: () => ({id:'user_test', email:'jonas@test.no'}), getAccessToken: async () => 'tok_test', signIn: () => {}, signUp: () => {}, signOut: () => {}})};
window.PushManager = function(){};
window.__sub = null;
const fakeSub = {endpoint:'https://fcm.googleapis.com/fcm/send/test', toJSON(){ return {endpoint:this.endpoint, keys:{p256dh:'BPtest', auth:'authtest'}}; }, unsubscribe: async () => { window.__sub = null; return true; }};
Object.defineProperty(navigator, 'serviceWorker', {configurable:true, value:{register: async () => ({}), ready: Promise.resolve({pushManager:{getSubscription: async () => window.__sub, subscribe: async (o) => { window.__subOpt = o; return (window.__sub = fakeSub); }}})}});
window.Notification = {permission:'default', requestPermission: async () => { window.__asked = 1; return 'granted'; }};
Object.defineProperty(document, 'visibilityState', {configurable:true, get: () => window.__vis || 'visible'});""" % json.dumps(CFG)


async def page(br, calls, key):
    ctx = await br.new_context(viewport={'width': 1100, 'height': 800}); pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.add_init_script(STUB)
    async def handle(route):
        req = route.request; url = req.url
        if '/functions/v1/push-send' in url:
            await route.fulfill(status=200, content_type='application/json', body=json.dumps({'key': key})); return
        fn = url.rsplit('/', 1)[-1]
        try: body = json.loads(req.post_data or '{}')
        except Exception: body = {}
        calls.append((fn, body))
        r = {'tm_hello': {'consent': False, 'owned': []}, 'save_get': None}.get(fn, '')
        await route.fulfill(status=200, content_type='application/json', body=r if isinstance(r, str) else json.dumps(r))
    await pg.route('https://sb.test/**', handle)
    return ctx, pg, errs


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        # 1. no VAPID key yet: no switch
        calls = []; ctx, pg, errs = await page(br, calls, None)
        await boot(pg, GAME + '#notut'); await pg.wait_for_timeout(1500)
        r = await pg.evaluate("(() => { PHONE.open('innst'); const t = document.querySelector('.ph-appv'); const has = !!document.querySelector('[data-pa=cloudPush]'); PHONE.show(false); return {has, card:!!(t && t.innerText.includes('Konto')), key:PUSH.key}; })()")
        check(r['card'] and not r['has'] and r['key'] is None, 'without the VAPID key on the server the account card has no switch for notifications', r)
        await ctx.close()
        # 2. with the key: the switch, turning it on, and the plan while away
        calls = []; ctx, pg, errs = await page(br, calls, 'BKeytest-abc_d12')
        await boot(pg, GAME + '#notut'); await pg.wait_for_timeout(1500)
        await pg.evaluate("PHONE.open('innst')"); await pg.wait_for_timeout(300)
        has = await pg.evaluate("!!document.querySelector('[data-pa=cloudPush]')")
        await pg.evaluate("document.querySelector('[data-pa=cloudPush]').click()"); await pg.wait_for_timeout(800)
        on = await pg.evaluate("({push:S.settings.push, asked:window.__asked === 1, opt:!!(window.__subOpt && window.__subOpt.userVisibleOnly && window.__subOpt.applicationServerKey.length), checked:!!(document.querySelector('[data-pa=cloudPush]') || {}).checked})")
        sub = [c for c in calls if c[0] == 'push_sub']
        check(has and on['push'] and on['asked'] and on['opt'] and sub and sub[-1][1].get('endpoint', '').startswith('https://fcm.googleapis.com/') and sub[-1][1].get('p256dh') == 'BPtest', 'with the key the switch is there; turning it on asks the browser, subscribes with the key and tells the server', {'on': on, 'sub': sub[-1][1] if sub else None})
        await pg.evaluate("PHONE.show(false)")
        # what will happen while away: nets set 18 game hours ago (the push 2 game hours on = 20 real minutes), a route to Botnhamn
        r = await pg.evaluate("""(() => {
          const b = S.boat, q = portById('finnsnes'), dst = portById('botnhamn');
          S.sets = [{id:'s_t1', kind:'garn', n:6, mesh:180, vid:S.cur, tSet:S.t - 18 * 60, a:{...q.p}, b:{...q.p}, acc:{}}];
          b.status = 'sailing'; b.port = null; b.pos = {x:q.p.x, y:q.p.y}; S.plan = {wps:[{x:dst.p.x, y:dst.p.y, port:'botnhamn'}], idx:0, speed:6};
          S.hold = []; const empty = pushItems(Date.now()).find(x => x.tag.startsWith('port-'));   // nothing to land: still a push that she is in, but not about fish
          S.hold = [{sp:'torsk', kg:120, n:40, fresh:96, bled:true, iced:true, cls:1}];
          const t0 = Date.now(), it = pushItems(t0), g = it.find(x => x.tag === 's_t1' || x.tag === 'gear-s_t1'), pt = it.find(x => x.tag.startsWith('port-'));
          const km = dist(q.p, dst.p), wantPort = km / (6 * NM) * 60 / GAME_RATE;
          return {n:it.length, empty:empty ? /kg/.test(empty.body) || !/venter på deg/.test(empty.body) : true, gear:g && {min:(Date.parse(g.at) - t0) / 60000, body:g.body, title:g.title}, port:pt && {min:(Date.parse(pt.at) - t0) / 60000, want:wantPort, body:pt.body},
            sorted:it.every((x, i) => !i || it[i - 1].at <= x.at), within:it.every(x => Date.parse(x.at) - t0 <= PUSH_AHEAD / GAME_RATE * 60000 + 1), exp:it.every(x => x.exp > x.at)};
        })()""")
        g, pt = r.get('gear') or {}, r.get('port') or {}
        check(g and abs(g['min'] - 20) < 0.1 and 'Garnene' in g['body'], 'nets set 18 game hours ago: the push comes when they have soaked 20 hours, 20 real minutes on', g)
        check(pt and abs(pt['min'] - pt['want']) < 0.5 and 'Botnhamn' in pt['body'] and '120 kg' in pt['body'] and not r['empty'], 'a boat on a route to Botnhamn: the push comes at the route\'s ETA in real time, with the fish when there is some and as «waits for you» when there is none', pt)
        check(r['sorted'] and r['within'] and r['exp'] and r['n'] >= 2, 'the plan is soonest first, within the next 40 real hours, and each item says when it stops mattering', r['n'])
        # fish about to drop a grade, the fitting done, the route's end at sea, the hold full, rested, a gale on the way, and the group that can be turned off
        r = await pg.evaluate("""(() => { const b = S.boat; S.sets = []; S.plan = null; b.status = 'port'; b.port = 'finnsnes';
          S.hold = [{sp:'torsk', kg:120, n:40, fresh:90, bled:true, iced:true, cls:1}]; S.tripBuff = null;
          S.jobs = [{kind:'fit', h:3, until:S.t + 180, no:'Montering av ekkolodd', en:'Fitting the sounder'}];
          const t0 = Date.now(), it = pushItems(t0), f = it.find(x => x.tag.startsWith('fresh-')), yd = it.find(x => x.tag.startsWith('yard-'));
          S.jobs = [];
          // the end of a route out at sea
          const q = portById('finnsnes').p; b.status = 'sailing'; b.port = null; b.pos = {x:q.x, y:q.y}; S.plan = {wps:[{x:q.x + 2, y:q.y + 2, fish:2}], idx:0, speed:6}; S.hold = [];
          const en = pushItems(t0).find(x => x.tag.startsWith('end-'));
          // the hold full while jigging: 60 kg in the last hour, room for the rest
          S.plan = null; b.status = 'fishing'; b.fishUntil = S.t + 24 * 60; S.fsess = {x:q.x, y:q.y, t0:S.t - 60, kg:60}; S.hold = [{sp:'torsk', kg:100, n:30, fresh:96, bled:true, iced:true, cls:1}]; window.rigJig = () => true;
          const full = pushItems(t0).find(x => x.tag.startsWith('full-')), left = capHold() - 100; S.fsess = null; b.status = 'port'; b.port = 'finnsnes'; S.hold = [];
          // rested in the boathouse
          S.rest = {port:'finnsnes', w:'naust', t0:S.t, paid:S.t + 1e5}; S.energy = 40; const rr = restRate(b), rest = pushItems(t0).find(x => x.tag === 'rested'); S.rest = null; S.energy = 100;
          // a gale on the way while the boat is out
          const w0 = window.windAt; window.windAt = () => 30; b.status = 'sailing'; b.pos = {x:q.x, y:q.y}; S.plan = {wps:[{x:q.x + 2, y:q.y + 2}], idx:0, speed:6};
          const wx = pushItems(t0).find(x => x.tag.startsWith('wx-')); window.windAt = w0; S.plan = null; b.status = 'port'; b.port = 'finnsnes';
          // a crew getting tired and one about to break the rest rule, while the boat is out (fatigue 55: 70 is reached in 3.75 game hours = 37.5 real minutes; ten hours at work: the 14th in 4 = 40)
          b.status = 'sailing'; b.pos = {x:q.x, y:q.y}; S.plan = {wps:[{x:q.x + 2, y:q.y + 2}], idx:0, speed:6};
          const crew0 = S.crew; S.crew = [{id:'kz1', name:'Ola', fatigue:55, rest:Array(168).fill(1)}]; const rl = restLog(S.crew[0]); for (let i = 0; i < 10; i++) rl[167 - i] = 0;
          const itc = pushItems(t0), cw = itc.find(x => x.tag.startsWith('crew-')), rt = itc.find(x => x.tag.startsWith('rest-')); S.crew = crew0; S.plan = null; b.status = 'port'; b.port = 'finnsnes';
          S.settings.pushCat = {drift:false, uke:true}; const off = pushItems(t0).length; S.settings.pushCat = null;
          return {fresh:f && {min:(Date.parse(f.at) - t0) / 60000, body:f.body}, want:((90 - 85) / 0.9 * 60 - 120) / GAME_RATE, yard:yd && {min:(Date.parse(yd.at) - t0) / 60000, body:yd.body},
            end:en && en.body, full:full && {min:(Date.parse(full.at) - t0) / 60000, body:full.body}, wantFull:left / 60 * 60 / GAME_RATE, rest:rest && {min:(Date.parse(rest.at) - t0) / 60000, body:rest.body}, wantRest:60 / rr / GAME_RATE,
            wx:wx && {min:(Date.parse(wx.at) - t0) / 60000, body:wx.body}, cw:cw && {min:(Date.parse(cw.at) - t0) / 60000, body:cw.body}, rt:rt && {min:(Date.parse(rt.at) - t0) / 60000, body:rt.body}, off}; })()""")
        fr, yd, en, fu, rs, wx = r.get('fresh') or {}, r.get('yard') or {}, r.get('end'), r.get('full') or {}, r.get('rest') or {}, r.get('wx') or {}
        check(fr and abs(fr['min'] - r['want']) < 0.5 and 'E- til A-kvalitet' in fr['body'], 'fish in the hold: the push comes two game hours before it drops from E to A', fr)
        check(yd and abs(yd['min'] - 30) < 0.5 and 'Monteringen er ferdig' in yd['body'] and 'ekkolodd' in yd['body'], 'the fitting done: the push comes when the work is, 30 real minutes on', yd)
        check(en and 'ferdig med ruta' in en and 'venter på ordre' in en, 'a route that ends at sea: the boat is done and waits for orders', en)
        check(fu and abs(fu['min'] - r['wantFull']) < 0.6 and 'full' in fu['body'], 'the hold full while jigging: the push comes when the session\'s rate fills it', {'f': fu, 'want': r['wantFull']})
        check(rs and abs(rs['min'] - r['wantRest']) < 0.6 and 'uthvilt' in rs['body'], 'rested in the boathouse: the push comes when the energy is full', {'r': rs, 'want': r['wantRest']})
        check(wx and ('Kuling' in wx['body'] or 'Storm' in wx['body']), 'a gale on the way while the boat is out: the push comes two game hours before it, in real time', wx)
        cw, rt = r.get('cw') or {}, r.get('rt') or {}
        check(cw and abs(cw['min'] - 37.5) < 0.6 and 'sliten' in cw['body'], 'a tired crew while the boat is out: the push comes when the fatigue passes 70', cw)
        check(rt and abs(rt['min'] - 40) < 0.6 and 'hviletid' in rt['body'], 'a crew about to break the rest rule: the push comes before the 14th hour in a row', rt)
        check(r['off'] == 0, 'with «Båten og driften» turned off, nothing is planned', r['off'])
        n0 = len(calls)
        await pg.evaluate("window.__vis = 'hidden'; document.dispatchEvent(new Event('visibilitychange'))"); await pg.wait_for_timeout(500)
        await pg.evaluate("window.__vis = 'visible'; document.dispatchEvent(new Event('visibilitychange'))"); await pg.wait_for_timeout(500)
        plans = [c[1].get('items') for c in calls[n0:] if c[0] == 'push_plan']
        check(len(plans) == 2 and len(plans[0]) >= 1 and plans[1] == [], 'to the background the plan goes up; back in the app it is cleared', [len(x) for x in plans])
        # the groups on the account card, and the leaderboard's choice goes to the server
        n0 = len(calls)
        r = await pg.evaluate("""(async () => { PHONE.open('innst'); const n = document.querySelectorAll('#phone [data-pa=cloudPushCat]').length;
          document.querySelector('#phone [data-pa=cloudPushCat][data-k=uke]').click(); await new Promise(r => setTimeout(r, 300)); const st = S.settings.pushCat.uke; PHONE.show(false); return {n, st}; })()""")
        pr = [c[1] for c in calls[n0:] if c[0] == 'push_prefs']
        check(r['n'] == 2 and r['st'] is False and pr and pr[-1].get('top') is False, 'the account card lists the two groups when notifications are on, and turning the week\'s best fisher off tells the server', {'r': r, 'prefs': pr})
        # turning it off unsubscribes
        await pg.evaluate("pushToggle()"); await pg.wait_for_timeout(600)
        off = await pg.evaluate("({push:S.settings.push, sub:window.__sub})")
        check(not off['push'] and off['sub'] is None and any(c[0] == 'push_unsub' for c in calls), 'turning it off unsubscribes and tells the server', off)
        errs0 = errs; await ctx.close()
        # 3. on for new players: asked after the first trip and after a landing, at most three times and a day apart, and turned on by
        # itself where the browser already allows notifications
        calls = []; ctx, pg, errs = await page(br, calls, 'BKeytest-abc_d12')
        await boot(pg, GAME + '#notut'); await pg.wait_for_timeout(1500)
        r = await pg.evaluate("""(async () => { const u = S.settings.push === undefined, m = document.getElementById('modal');
          pushAsk(); const shown = !m.hidden && !!document.getElementById('paYes');
          document.getElementById('paNo').click(); pushAsk(); const again = !m.hidden;
          S.settings.pushAsk.at -= 21 * 36e5; pushAsk(); const later = !m.hidden && !!document.getElementById('paYes');
          document.getElementById('paYes').click(); await new Promise(r => setTimeout(r, 600));
          return {u, shown, again, later, n:S.settings.pushAsk.n, push:S.settings.push, asked:window.__asked === 1, hidden:m.hidden}; })()""")
        sub = [c for c in calls if c[0] == 'push_sub']
        check(r['u'] and r['shown'] and not r['again'] and r['later'] and r['n'] == 2 and r['push'] is True and r['asked'] and r['hidden'] and sub,
              'a new player is asked; «Ikke nå» waits a day, and «Slå på varsler» asks the browser, subscribes and tells the server', r)
        r = await pg.evaluate("""(async () => { const m = document.getElementById('modal');
          S.settings.push = undefined; S.settings.pushAsk = {n:3, at:0}; pushAsk(); const fourth = !m.hidden;
          S.settings.push = false; S.settings.pushAsk = null; pushAsk(); const off = !m.hidden;
          S.settings.push = undefined; window.__sub = null; window.__asked = 0; Notification.permission = 'granted'; pushAuto(); await new Promise(r => setTimeout(r, 600));
          return {fourth, off, push:S.settings.push, asked:window.__asked, sub:!!window.__sub}; })()""")
        check(not r['fourth'] and not r['off'] and r['push'] is True and r['asked'] == 0 and r['sub'],
              'never a fourth time, never when turned off in Settings, and on without a question where the browser already allows it', r)
        print('errors:', (errs0 + errs)[:3]); await ctx.close(); await br.close()

asyncio.run(main())
