"""The error trap (js/errtrap.js and the errors in ui/10f-cloud.js, 02.11.2026) with stand-ins for WorkOS and Supabase: what goes wrong
while the page loads (a throw, a console.error from a catch, a picture that does not load) waits until the game is up and goes then,
after the hello and the save; a page that stopped while it was on the screen is sent as «Krasj» at the next start, one that was in the
background is not; what could not be sent before goes now, with how late; the places in the stack are the source files and lines
(DSB_SRCMAP from build.mjs); an error the network stops waits on the device and goes when the cloud answers again; a hang of seconds is
sent as «Heng»; the same error goes once, and a fetch the network let down not at all. Prints OK or FEIL."""
from _env import GAME, boot
from pathlib import Path
import asyncio, json, os, re, time
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:500]) if extra != '' else ''))


CFG = {'hosts': ['127.0.0.1', 'localhost'], 'supabaseUrl': 'https://sb.test', 'supabaseAnon': 'anon_test', 'workosClientId': 'client_test'}
NOW = int(time.time() * 1000)
STUB = """window.DSB_CLOUD = %s;
window.DSB_AUTHKIT = {createClient: async () => ({getUser: () => ({id:'user_test', email:'jonas@test.no'}), getAccessToken: async () => 'tok_test',
  signIn: () => {}, signUp: () => {}, signOut: () => {}})};
if (!sessionStorage.getItem('errtest_once')){ sessionStorage.setItem('errtest_once', '1');
  // a page that stopped on the screen a minute ago, one that was in the background, and an error that could not be sent two minutes ago
  localStorage.setItem('dsb_alive', JSON.stringify({pold:{t:%d - 60000, vis:true, up:300, view:'3d', lvl:2, mem:400, ready:true, v:'oldver'},
    pbg:{t:%d - 60000, vis:false, up:90, view:'kart', ready:true, v:'oldver'}}));
  localStorage.setItem('dsb_errq', JSON.stringify([{msg:'errtest queued', src:'x', stack:'', meta:{}, at:%d - 120000}]));
  // while the page loads: a throw, a console.error and a picture that is not there
  document.addEventListener('readystatechange', () => { if (document.readyState !== 'interactive') return;
    setTimeout(() => { throw new Error('errtest early'); }, 0);
    console.error('errtest console early', {a:1});
    const i = new Image(); i.src = '/nope-errtest.png?x=1'; document.body.appendChild(i); });
}""" % (json.dumps(CFG), NOW, NOW, NOW)


async def main():
    dist = Path(os.environ.get('KYST_DIST') or Path(__file__).resolve().parent.parent / 'dist') / 'index.html'
    page_lines = dist.read_text(encoding='utf-8').split('\n')
    src_lines = (Path(__file__).resolve().parent.parent / 'src/js/ui/10f-cloud.js').read_text(encoding='utf-8').split('\n')
    pl = next(i + 1 for i, l in enumerate(page_lines) if l.startswith('function cloudErr('))
    sl = next(i + 1 for i, l in enumerate(src_lines) if l.startswith('function cloudErr('))
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        ctx = await br.new_context(viewport={'width': 1100, 'height': 800}); pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)) if 'errtest' not in str(e) else None)
        await pg.add_init_script(STUB)
        calls = []; state = {'down': False}
        replies = {'tm_hello': {'consent': True, 'owned': []}, 'save_get': 'null', 'save_put2': {'ok': True, 'saved_at': '2026-11-02T10:00:00+00:00'}}
        async def handle(route):
            req = route.request; fn = req.url.rsplit('/', 1)[-1]
            try: body = json.loads(req.post_data or '{}')
            except Exception: body = {}
            if fn == 'tm_error' and state['down']: return await route.fulfill(status=503, body='')
            calls.append((fn, body, req.headers.get('authorization', '')))
            r = replies.get(fn, 404 if fn in ('save_put3', 'save_head', 'save_put4', 'save_claim', 'save_beat') else '')
            if r == 404: return await route.fulfill(status=404, content_type='application/json', body='{"code":"PGRST202"}')
            await route.fulfill(status=200, content_type='application/json', body=r if isinstance(r, str) else json.dumps(r))
        await pg.route('https://sb.test/**', handle)
        await boot(pg)
        await pg.wait_for_function("ERR.ready", timeout=30000); await pg.wait_for_timeout(2500)
        names = [c[0] for c in calls]
        errc = [c[1] for c in calls if c[0] == 'tm_error']; msgs = [e['msg'] for e in errc]
        i_err = names.index('tm_error') if 'tm_error' in names else -1
        check(i_err > names.index('save_get') if 'save_get' in names and i_err >= 0 else False,
              'nothing is sent before the game is up: the first error goes after the hello and the save', names[:8])
        early = next((e for e in errc if e['msg'] == 'Error: errtest early' or 'errtest early' in e['msg']), None)
        cons = next((e for e in errc if 'errtest console early' in e['msg']), None)
        res = next((e for e in errc if e['msg'].startswith('resource: img') and 'nope-errtest.png' in e['msg']), None)
        check(early and cons and cons['src'] == 'console' and '{"a":1}' in cons['msg'] and res and '?x' not in res['msg'],
              'what went wrong while the page loaded is sent: the throw, the console.error with what it was given, the picture that did not load (without its query)', msgs)
        check(early and early['meta'].get('browser') and early['meta'].get('version') and 'gpu' in early['meta'], 'each error has the device and the version with it', early and early['meta'])
        crash = [e for e in errc if e['src'] == 'crash']
        cj = json.loads(crash[0]['stack']) if crash else {}
        alive = await pg.evaluate("JSON.parse(localStorage.getItem('dsb_alive') || '{}')")
        check(len(crash) == 1 and crash[0]['msg'] == 'Krasj: siden stoppet mens den var på skjermen · 3d' and cj.get('version') == 'oldver' and cj.get('js_mb') == 400 and cj.get('up_s') == 300
              and 'pold' not in alive and 'pbg' not in alive and len(alive) == 1,
              'a page that stopped on the screen is sent once as a crash, with its version, view, memory and time up; the one in the background is not, and both notes are cleared', {'crash': crash, 'alive': list(alive)})
        q = next((e for e in errc if e['msg'] == 'errtest queued'), None)
        check(q and q['meta'].get('late_min', 0) >= 2 and await pg.evaluate("localStorage.getItem('dsb_errq') === null"), 'an error that could not be sent before goes now, with how late it is', q)
        check(all(c[2] == 'Bearer tok_test' for c in calls if c[0] == 'tm_error'), 'the errors go with the signed-in token (the server keeps who only with the consent)')
        # the places in the stack are the source files and lines
        m = await pg.evaluate("(L) => srcMapStr('    at cloudErr (' + location.origin + location.pathname + ':' + L + ':7)\\nf@' + location.origin + location.pathname + ':' + L + ':3\\nhttps://other.test/x.js:5:1')", pl)
        check(m == '    at cloudErr (ui/10f-cloud.js:%d:7)\nf@ui/10f-cloud.js:%d:3\nhttps://other.test/x.js:5:1' % (sl, sl), "a place in the page's stack becomes the source file and line (Chrome's and Safari's form), another site's is left as it is", m)
        n0 = len(calls)
        await pg.evaluate("setTimeout(() => { throw new Error('errtest real') }, 0); 0"); await pg.wait_for_timeout(600)
        real = next((c[1] for c in calls[n0:] if c[0] == 'tm_error' and 'errtest real' in c[1]['msg']), None)
        check(real and 'index.html:' not in real['stack'] and 'errtest real' in real['msg'], 'an error thrown in the page is sent at once', real)
        # the same error once, and a fetch the network let down not at all
        n0 = len(calls)
        await pg.evaluate("""() => { console.error(new TypeError('Failed to fetch')); console.error('errtest twice'); console.error('errtest twice'); }"""); await pg.wait_for_timeout(600)
        tw = [c[1]['msg'] for c in calls[n0:] if c[0] == 'tm_error']
        check(tw == ['errtest twice'], 'the same error goes once a session, and «Failed to fetch» not at all', tw)
        # the cloud does not answer: the error waits on the device and goes when it answers again
        state['down'] = True
        await pg.evaluate("console.error('errtest offline')"); await pg.wait_for_timeout(800)
        kept = await pg.evaluate("JSON.parse(localStorage.getItem('dsb_errq') || '[]').map(e => e.msg)")
        state['down'] = False; n0 = len(calls)
        await pg.evaluate("errFlush()"); await pg.wait_for_timeout(800)
        sent = [c[1]['msg'] for c in calls[n0:] if c[0] == 'tm_error']
        check(kept == ['errtest offline'] and sent == ['errtest offline'] and await pg.evaluate("localStorage.getItem('dsb_errq') === null"),
              'an error the cloud did not take waits on the device and goes when it answers again', {'kept': kept, 'sent': sent})
        # a hang: the page stands still for six seconds
        n0 = len(calls)
        await pg.evaluate("for (const k of Object.keys(CLOUD.errSeen)) if (k.startsWith('Heng')) delete CLOUD.errSeen[k]")   # (the start itself may have stood still that long in SwiftShader)
        await pg.evaluate("setTimeout(() => { const t = performance.now(); while (performance.now() - t < 6000); }, 0); 0"); await pg.wait_for_timeout(8000)
        hang = [c[1] for c in calls[n0:] if c[0] == 'tm_error' and c[1]['src'] == 'hang']
        hj = json.loads(hang[0]['stack']) if hang else {}
        check(len(hang) == 1 and hang[0]['msg'].startswith('Heng: spillet sto stille i 5–10 s') and 5 <= hj.get('s', 0) < 10, 'a page that stood still for seconds is sent as a hang, with how long', hang)
        # the page closes the right way: its note is gone
        await pg.evaluate("dispatchEvent(new PageTransitionEvent('pagehide'))")
        check(await pg.evaluate("Object.keys(JSON.parse(localStorage.getItem('dsb_alive') || '{}')).length") == 0, 'a page that closes takes its note away, so it is never counted as a crash')
        print('errors:', errs[:3]); await ctx.close()

        # without the cloud (the tests, the artifact): the trap is there, console.error writes as before, and nothing is sent
        ctx = await br.new_context(viewport={'width': 1100, 'height': 800}); pg = await ctx.new_page(); errs = []; sent = []; logged = []
        pg.on('pageerror', lambda e: errs.append(str(e)) if 'errtest' not in str(e) else None)
        pg.on('console', lambda m: logged.append(m.text) if m.type == 'error' else None)
        pg.on('request', lambda r: sent.append(r.url) if 'rpc/tm_error' in r.url else None)
        await boot(pg)
        await pg.evaluate("console.error('errtest local'); setTimeout(() => { throw new Error('errtest local throw') }, 0); 0"); await pg.wait_for_timeout(500)
        t = await pg.evaluate("({trap:!!window.DSB_ERRTRAP, to:typeof DSB_ERRTRAP.to, q:DSB_ERRTRAP.q.length, map:!!(window.DSB_SRCMAP && DSB_SRCMAP.m.length)})")
        check(t['trap'] and t['to'] == 'function' and t['q'] == 0 and t['map'] and 'errtest local' in logged and not sent, 'without the cloud the trap hands on to nothing, console.error still writes, and nothing is sent', {'t': t, 'logged': logged[-3:]})
        print('errors:', errs[:3]); await br.close()

asyncio.run(main())
