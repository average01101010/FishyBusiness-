"""The watchdog (ui/11b-watchdog.js, L1d 10.11.2026) with stand-ins for WorkOS and Supabase: a Web Worker gets a sign of life from the
page every second and tells of a hang itself. The page locked in a loop for 20 s while on the screen: «Spillet hang i N s · where» lies
in the stand-in for tm_error (sent by the worker while the page still stood still: the request is seen before the loop ends), with the
version and the source 'watchdog', once, and «Spillet hang i N s, kom tilbake» when the page answers again. Nothing when the page is
only hidden for 20 s, nothing when the browser's own confirm holds the page for 20 s, nothing when another device has the game, and
the errors carry the channel only on a test build. Prints OK or FEIL."""
from _env import GAME, boot
import asyncio, json, time
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:500]) if extra != '' else ''))


CFG = {'hosts': ['127.0.0.1', 'localhost'], 'supabaseUrl': 'https://sb.test', 'supabaseAnon': 'anon_test', 'workosClientId': 'client_test'}
STUB = """window.DSB_CLOUD = %s;
window.DSB_AUTHKIT = {createClient: async () => ({getUser: () => ({id:'user_test', email:'jonas@test.no'}), getAccessToken: async () => 'tok_test',
  signIn: () => {}, signUp: () => {}, signOut: () => {}})};""" % json.dumps(CFG)
# the page says it is hidden (and shown again) the way the browser does: the property and the event
HIDE = """h => { Object.defineProperty(document, 'hidden', {configurable:true, get:() => h});
  Object.defineProperty(document, 'visibilityState', {configurable:true, get:() => h ? 'hidden' : 'visible'});
  document.dispatchEvent(new Event('visibilitychange')); }"""
LOCK = "s => { const t = Date.now() + s * 1000; while (Date.now() < t){} }"


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        ctx = await br.new_context(viewport={'width': 1100, 'height': 800}); pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script(STUB)
        calls = []
        replies = {'tm_hello': {'consent': True, 'owned': []}, 'save_get': 'null', 'save_put2': {'ok': True, 'saved_at': '2026-11-02T10:00:00+00:00'}}
        async def handle(route):
            req = route.request; fn = req.url.rsplit('/', 1)[-1]
            try: body = json.loads(req.post_data or '{}')
            except Exception: body = {}
            calls.append((fn, body, req.headers.get('authorization', ''), time.time()))
            r = replies.get(fn, 404 if fn in ('save_put3', 'save_head', 'save_put4', 'save_claim', 'save_beat') else '')
            if r == 404: return await route.fulfill(status=404, content_type='application/json', body='{"code":"PGRST202"}')
            await route.fulfill(status=200, content_type='application/json', body=r if isinstance(r, str) else json.dumps(r))
        await ctx.route('https://sb.test/**', handle)   # (the context: the worker's requests too)
        await boot(pg)
        await pg.wait_for_function("ERR.ready", timeout=30000); await pg.wait_for_timeout(3000)
        hangs = lambda: [c for c in calls if c[0] == 'tm_error' and str(c[1].get('msg', '')).startswith('Spillet hang i')]
        check(await pg.evaluate("typeof WD !== 'undefined' && !!WD.w"), 'the watchdog runs where the cloud is')
        check(len(hangs()) == 0, 'no hang is told while the game runs', [h[1]['msg'] for h in hangs()])

        # only hidden for 20 s (the signs of life stop meaning anything): nothing
        await pg.evaluate(HIDE, True)
        await pg.evaluate(LOCK, 20); await pg.wait_for_timeout(1500)
        await pg.evaluate(HIDE, False); await pg.wait_for_timeout(2500)
        check(len(hangs()) == 0, 'the page hidden for 20 s (and standing still there) tells of no hang', [h[1]['msg'] for h in hangs()])

        # the browser's own confirm holds the main thread for 20 s: nothing
        async def late(d):
            await asyncio.sleep(20); await d.accept()
        pg.once('dialog', lambda d: asyncio.ensure_future(late(d)))
        await pg.evaluate("confirm('hengtest')"); await pg.wait_for_timeout(2500)
        check(len(hangs()) == 0, 'the browser\'s confirm open for 20 s tells of no hang', [h[1]['msg'] for h in hangs()])

        # another device has the game: nothing
        await pg.evaluate("TAB.held = true"); await pg.wait_for_timeout(1500)
        await pg.evaluate(LOCK, 20); await pg.evaluate("TAB.held = false"); await pg.wait_for_timeout(2500)
        check(len(hangs()) == 0, 'a page that does not have the game (another device has it) tells of no hang', [h[1]['msg'] for h in hangs()])

        # on the screen and locked for 20 s: the worker tells of it while the page still stands still, once, and again when it is back
        t0 = time.time(); await pg.evaluate(LOCK, 20); t1 = time.time(); await pg.wait_for_timeout(3000)
        h = hangs(); first = [x for x in h if 'kom tilbake' not in x[1]['msg']]; back = [x for x in h if 'kom tilbake' in x[1]['msg']]
        check(len(first) == 1 and first[0][1].get('src') == 'watchdog', '«Spillet hang i N s» lies in tm_error, once, from the watchdog', [x[1]['msg'] for x in h])
        if first:
            e = first[0][1]; st = json.loads(e.get('stack') or '{}')
            check(14 <= st.get('s', 0) <= 18 and t0 + 13 < first[0][3] < t1 - 1, 'it was sent by the worker after 15 s, while the page still stood still',
                  {'s': st.get('s'), 'after_s': round(first[0][3] - t0, 1), 'locked_s': round(t1 - t0, 1)})
            check(e['meta'].get('version') and st.get('version') == e['meta'].get('version') and st.get('where') and st['where'] in e['msg'] and 'ch' not in e['meta'] and st.get('ch') == '',
                  'with the version and where in the game it was; no channel on a build that is not the test edition', {'msg': e['msg'], 'stack': st, 'ch': e['meta'].get('ch')})
            check(first[0][2] == 'Bearer tok_test', 'as the player signed in (the server keeps who only with consent)', first[0][2])
        check(len(back) == 1 and 19 <= json.loads(back[0][1].get('stack') or '{}').get('s', 0) <= 24, '«Spillet hang i N s, kom tilbake» when the page answers again, with the whole time',
              [x[1]['msg'] for x in back])
        other = next((c[1] for c in calls if c[0] == 'tm_hello'), {})
        check('ch' not in (other.get('meta') or {}), 'the production says no channel in what it sends (cloudMeta)', sorted((other.get('meta') or {}).keys())[:6])
        print('pageerrors', errs)
        await br.close()


asyncio.run(main())
