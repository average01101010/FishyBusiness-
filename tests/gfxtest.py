"""The picture watched (view3d/24-cinema.js gfxStart, gfxEnd, 02.11.2026) with stand-ins for WorkOS and Supabase, in 3D: a GL error
made between two frames is sent with the step it came after; a camera that is not a number is sent as «3D NaN i kameraet»; the nine
points of the picture are read back every fifteen seconds, and the real picture is neither black nor one colour; black in daylight
twice running is sent, at night not, and one colour only in clear weather. Prints OK or FEIL."""
from _env import GAME_TUT, boot
import asyncio, json, time
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:500]) if extra != '' else ''))


CFG = {'hosts': ['127.0.0.1', 'localhost'], 'supabaseUrl': 'https://sb.test', 'supabaseAnon': 'anon_test', 'workosClientId': 'client_test'}
STUB = """window.DSB_CLOUD = %s;
window.DSB_AUTHKIT = {createClient: async () => ({getUser: () => ({id:'user_test', email:'jonas@test.no'}), getAccessToken: async () => 'tok_test',
  signIn: () => {}, signUp: () => {}, signOut: () => {}})};""" % json.dumps(CFG)


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        ctx = await br.new_context(viewport={'width': 1000, 'height': 700}); pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)) if 'NaN,NaN' not in str(e) else None)   # (the camera made NaN on purpose throws in the map reads until it is put back)
        await pg.add_init_script(STUB)
        calls = []
        replies = {'tm_hello': {'consent': True, 'owned': []}, 'save_get': 'null', 'save_put2': {'ok': True, 'saved_at': '2026-11-02T10:00:00+00:00'}}
        async def handle(route):
            req = route.request; fn = req.url.rsplit('/', 1)[-1]
            try: body = json.loads(req.post_data or '{}')
            except Exception: body = {}
            calls.append((fn, body))
            r = replies.get(fn, 404 if fn in ('save_put3', 'save_head', 'save_put4', 'save_claim', 'save_beat') else '')
            if r == 404: return await route.fulfill(status=404, content_type='application/json', body='{"code":"PGRST202"}')
            await route.fulfill(status=200, content_type='application/json', body=r if isinstance(r, str) else json.dumps(r))
        await pg.route('https://sb.test/**', handle)
        await boot(pg, GAME_TUT + '#notut')
        await pg.evaluate("if (!G3.isActive()) G3.show(true)")
        await pg.wait_for_function("G3.isActive() && ERR.ready && G3._debug.fps > 0", timeout=180000); await pg.wait_for_timeout(4000)
        # (SwiftShader is a GPU drawn by the CPU, where the game does not ask the driver for its errors: the test asks all the same)
        soft = await pg.evaluate("(() => { const g = G3._debug.gfx; const s = g.soft; g.force = true; return s; })()")
        check(soft is True, 'on a GPU drawn by the CPU (SwiftShader) the game does not ask the driver for its errors by itself', soft)
        gfx = lambda: [c[1] for c in calls if c[0] == 'tm_error' and c[1].get('src') == 'view3d gfx']
        # the real picture: read back, and neither black nor one colour
        await pg.evaluate("G3._debug.gfx.pixAt = 0")
        await pg.wait_for_function("G3._debug.gfx.pixAt > 0", timeout=120000, polling=1000)
        g0 = await pg.evaluate("(() => { const g = G3._debug.gfx; return {black:g.black, flat:g.flat}; })()")
        check(g0['black'] == 0 and g0['flat'] == 0 and not any('svart' in e['msg'] or 'én farge' in e['msg'] for e in gfx()), "the game's own picture is read back and is not taken for black or one colour", g0)
        # a GL error between two frames
        await pg.evaluate("""(() => { const c = document.getElementById('gl'), g = c.getContext('webgl2') || c.getContext('webgl'); g.bindTexture(0x1234, null); G3._debug.gfx.probeAt = 0; })()""")
        await pg.wait_for_timeout(4000)
        gl = [e for e in gfx() if e['msg'].startswith('3D GL-feil INVALID_ENUM mellom rammene')]
        gj = json.loads(gl[0]['stack']) if gl else {}
        check(gl and ' · ' in gl[0]['msg'] and gj.get('code') == 1280 and 'lvl' in gj and 'gl2' in gj, 'a GL error is sent with the step it came after, the graphics chip, the quality and the view', gl[:1])
        # the steps of the frame are learnt, and each round asks about the next one (two questions to the driver a round)
        st = await pg.evaluate("(() => { const g = G3._debug.gfx; return {tags:g.tags.length, k:g.k}; })()")
        check(st['tags'] >= 6 and st['k'] >= 1, 'the frame\'s steps are learnt and one is asked about each round', st)
        # a camera that is not a number (with the driver's questions and the reads off again: forced on SwiftShader they make each frame long)
        await pg.evaluate("G3._debug.cam.helm = false; G3._debug.gfx.force = false; window.__yaw = G3._debug.cam.yaw; G3._debug.cam.yaw = NaN")
        for _ in range(60):   # (SwiftShader may take its time over a frame: wait for the report, at most 30 s)
            if any(e['msg'].startswith('3D NaN i kameraet') for e in gfx()): break
            await pg.wait_for_timeout(500)
        await pg.evaluate("G3._debug.cam.yaw = window.__yaw || 0")
        nan = [e for e in gfx() if e['msg'].startswith('3D NaN i kameraet')]
        nj = json.loads(nan[0]['stack']) if nan else {}
        check(len(nan) == 1 and nj.get('cam', {}).get('yaw') == 'NaN' and nj.get('bv', {}).get('x') not in (None, 'NaN'), 'a camera that is not a number is sent once, with the eye, the boat and the camera', nan[:1])
        # the judgement of the nine points: black in daylight twice running is sent, at night it is not; one colour only in clear weather
        j = await pg.evaluate("""(() => { const D = G3._debug, K = [[0, 0, 1]], B = Array(9).fill([1, 2, 3]), F = Array(9).fill([120, 140, 160]);
          return {black:D.gfxJudge(B, true, 40).k, night:D.gfxJudge(B, false, 40).k, flat:D.gfxJudge(F, true, 40).k, fog:D.gfxJudge(F, true, 4).k,
            mixed:D.gfxJudge(F.slice(0, 8).concat([[30, 90, 160]]), true, 40).k}; })()""")
        check(j == {'black': 'black', 'night': '', 'flat': 'flat', 'fog': '', 'mixed': ''}, 'nine points: black in daylight, nothing at night; one colour in clear weather, not in fog; a real picture nothing', j)
        n0 = len(gfx())
        await pg.evaluate("""(() => { const D = G3._debug; D.gfx.black = 0; const k = {k:'black', rgb:[1, 2, 3]}; D.gfxPix(k); D.gfxPix(k); D.gfxPix(k); D.gfx.black = 0; })()""")
        await pg.wait_for_timeout(800)
        bl = [e['msg'] for e in gfx()[n0:]]
        check(len(bl) == 1 and bl[0].startswith('3D svart skjerm på dagtid'), 'black twice running is sent, once', bl)
        print('gfx sent:', sorted({e['msg'][:70] for e in gfx()}))
        print('errors:', errs[:3]); await br.close()

asyncio.run(main())
