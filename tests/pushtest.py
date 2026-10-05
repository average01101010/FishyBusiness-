"""Push notifications in the game (05.10.2026, ui/10g-push.js) with stand-ins for WorkOS, Supabase, push-send and the browser's push:
without the VAPID key the switch is not shown; with it the account card has it, and turning it on asks the browser, subscribes and
tells the server; going to the background lays out what will happen while away (gear that has soaked long enough, the boat at its
harbour with fish, fish about to drop a grade, the yard done, the open group's stop, the season's news) at the right real times, each
group can be turned off, and coming back clears it. Prints OK or FEIL."""
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
          S.hold = []; const empty = pushItems(Date.now()).some(x => x.tag.startsWith('port-'));   // nothing to land: no push for the harbour
          S.hold = [{sp:'torsk', kg:120, n:40, fresh:96, bled:true, iced:true, cls:1}];
          const t0 = Date.now(), it = pushItems(t0), g = it.find(x => x.tag === 's_t1' || x.tag === 'gear-s_t1'), pt = it.find(x => x.tag.startsWith('port-'));
          const km = dist(q.p, dst.p), wantPort = km / (6 * NM) * 60 / GAME_RATE;
          return {n:it.length, empty, gear:g && {min:(Date.parse(g.at) - t0) / 60000, body:g.body, title:g.title}, port:pt && {min:(Date.parse(pt.at) - t0) / 60000, want:wantPort, body:pt.body},
            sorted:it.every((x, i) => !i || it[i - 1].at <= x.at), within:it.every(x => Date.parse(x.at) - t0 <= PUSH_AHEAD / GAME_RATE * 60000 + 1), exp:it.every(x => x.exp > x.at)};
        })()""")
        g, pt = r.get('gear') or {}, r.get('port') or {}
        check(g and abs(g['min'] - 20) < 0.1 and 'Garnene' in g['body'], 'nets set 18 game hours ago: the push comes when they have soaked 20 hours, 20 real minutes on', g)
        check(pt and abs(pt['min'] - pt['want']) < 0.5 and 'Botnhamn' in pt['body'] and '120 kg' in pt['body'] and not r['empty'], 'a boat on a route to Botnhamn with fish: the push comes at the route\'s ETA in real time, and not when there is nothing to land', pt)
        check(r['sorted'] and r['within'] and r['exp'] and r['n'] >= 2, 'the plan is soonest first, within the next 40 real hours, and each item says when it stops mattering', r['n'])
        # fish about to drop a grade, the yard done, the open group's stop announced, and the groups that can be turned off
        r = await pg.evaluate("""(() => { const b = S.boat; S.sets = []; S.plan = null; b.status = 'port'; b.port = 'finnsnes';
          S.hold = [{sp:'torsk', kg:120, n:40, fresh:90, bled:true, iced:true, cls:1}]; S.tripBuff = null;
          S.jobs = [{kind:'svc', h:3, until:S.t + 180, no:'Service på motoren', en:'Engine service'}];
          const H = S.t / 60, y = yearH(H), Y = qyAt(H), O = yearQuota(y).open; Y.c = O.Q - O.ff; Y.stop = null; Y.ann = null;
          const t0 = Date.now(), it = pushItems(t0), f = it.find(x => x.tag.startsWith('fresh-')), yd = it.find(x => x.tag.startsWith('yard-')), qs = it.find(x => x.tag === 'quota-stop');
          S.settings.pushCat = {fangst:false, verft:true, kvote:true, topp:true, sesong:true}; const off = pushItems(t0).filter(x => /^(fresh|port|gear)-/.test(x.tag)).length; S.settings.pushCat = null;
          return {fresh:f && {min:(Date.parse(f.at) - t0) / 60000, body:f.body}, want:((90 - 85) / 0.9 * 60 - 120) / GAME_RATE, yard:yd && {min:(Date.parse(yd.at) - t0) / 60000, body:yd.body},
            quota:qs && {title:qs.title, body:qs.body, min:(Date.parse(qs.at) - t0) / 60000}, off, access:access()}; })()""")
        fr, yd, qs = r.get('fresh') or {}, r.get('yard') or {}, r.get('quota') or {}
        check(fr and abs(fr['min'] - r['want']) < 0.5 and 'E- til A-kvalitet' in fr['body'], 'fish in the hold: the push comes two game hours before it drops from E to A', fr)
        check(yd and abs(yd['min'] - 30) < 0.5 and 'service på motoren' in yd['body'], 'the yard done: the push comes when the work is, 30 real minutes on', yd)
        check(r['access'] != 'open' or (qs and qs['title'] == 'Fiskeridirektoratet' and 'stoppes' in qs['body']), 'the open group\'s stop: the push comes when the Directorate announces it, with what is left of the quota', {'q': qs, 'access': r['access']})
        check(r['off'] == 0, 'with «Fangst og båter» turned off, no gear, fish or harbour push is planned', r['off'])
        n0 = len(calls)
        await pg.evaluate("window.__vis = 'hidden'; document.dispatchEvent(new Event('visibilitychange'))"); await pg.wait_for_timeout(500)
        await pg.evaluate("window.__vis = 'visible'; document.dispatchEvent(new Event('visibilitychange'))"); await pg.wait_for_timeout(500)
        plans = [c[1].get('items') for c in calls[n0:] if c[0] == 'push_plan']
        check(len(plans) == 2 and len(plans[0]) >= 2 and plans[1] == [], 'to the background the plan goes up; back in the app it is cleared', [len(x) for x in plans])
        # the season's news on its morning (the skrei in late January)
        r = await pg.evaluate("""(() => { S.sets = []; S.plan = null; S.boat.status = 'port'; S.boat.port = 'finnsnes';
          const e = seasonNext(S.t / 60, 14).find(x => x.ev === 'skrei'); S.t = (e.H - 24) * 60;
          const it = pushItems(Date.now()), s = it.find(x => x.tag === 'season-' + e.ev); return {ev:e.ev, at:s && (Date.parse(s.at) - Date.now()) / 60000, want:(24 + 7) * 60 / GAME_RATE, title:s && s.title}; })()""")
        check(r['at'] is not None and abs(r['at'] - r['want']) < 1 and r['title'] == 'Kystradio', 'the season\'s news comes from Kystradio on the morning it begins', r)
        # the groups on the account card, and the leaderboard's choice goes to the server
        n0 = len(calls)
        r = await pg.evaluate("""(async () => { PHONE.open('innst'); const n = document.querySelectorAll('#phone [data-pa=cloudPushCat]').length;
          document.querySelector('#phone [data-pa=cloudPushCat][data-k=topp]').click(); await new Promise(r => setTimeout(r, 300)); const st = S.settings.pushCat.topp; PHONE.show(false); return {n, st}; })()""")
        pr = [c[1] for c in calls[n0:] if c[0] == 'push_prefs']
        check(r['n'] == 5 and r['st'] is False and pr and pr[-1].get('top') is False, 'the account card lists the five groups when notifications are on, and turning the leaderboard off tells the server', {'r': r, 'prefs': pr})
        # turning it off unsubscribes
        await pg.evaluate("pushToggle()"); await pg.wait_for_timeout(600)
        off = await pg.evaluate("({push:S.settings.push, sub:window.__sub})")
        check(not off['push'] and off['sub'] is None and any(c[0] == 'push_unsub' for c in calls), 'turning it off unsubscribes and tells the server', off)
        print('errors:', errs[:3]); await ctx.close(); await br.close()

asyncio.run(main())
