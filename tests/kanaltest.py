"""The test edition (L1a, 10.11.2026, docs/planer/lansering-plan.md): a build with KYST_CHANNEL=test says so in the page
(<meta name="dsb-channel">), asks not to be indexed, has "ch":"test" in version.json, shows the small label «Testutgave» at the top left
(over no button, upright and on its side) and talks to the test project in Supabase with WorkOS Staging; the build without the channel
has none of it, and lays the test block over the rest only on the test host. The test builds dist-kanal/ itself (KYST_KANAL_DIST names
another build to take as the test edition: pointed at a plain build the test is red, which is how it was seen to fail). Pictures of
the label go to tests/out/kanal_*.png."""
from _env import GAME, BASE, HERE, OUT, boot, _Srv, _Quiet
import asyncio, json, os, subprocess, threading, functools, urllib.request
from playwright.async_api import async_playwright

ROOT = os.path.dirname(HERE)
PROD = json.load(open(os.path.join(ROOT, 'src', 'data', 'cloud.json'), encoding='utf-8'))
STAGING = 'client_01M449YCKA9VJST0W0FY0HP62E'
bad = []
def check(c, msg, d=None):
    print(('OK   ' if c else 'FEIL ') + msg, '' if c else json.dumps(d, ensure_ascii=False)[:400])
    if not c: bad.append(msg)

def test_build():
    d = os.environ.get('KYST_KANAL_DIST')
    if d: return os.path.abspath(os.path.join(ROOT, d))
    d = os.path.join(ROOT, 'dist-kanal')
    r = subprocess.run(['node', 'build.mjs'], cwd=ROOT, env=dict(os.environ, KYST_CHANNEL='test', KYST_DIST=d, KYST_PWA='', KYST_VEC=''), capture_output=True, text=True)
    check(r.returncode == 0 and 'channel test' in r.stdout, 'KYST_CHANNEL=test builds, and the build says its channel', (r.stdout + r.stderr)[-300:])
    return d

# what the page says about itself, the label and every button it could lie over
LOOK = """(() => {
  const m = n => { const e = document.querySelector('meta[name=' + n + ']'); return e ? e.content : null; };
  const t = document.getElementById('chTag'), r = t ? t.getBoundingClientRect() : null, over = [];
  if (r) for (const b of document.querySelectorAll('button, a, [role=button], input, select, [data-a], [data-pa]')){
    const q = b.getBoundingClientRect(), cs = getComputedStyle(b);
    if (q.width < 1 || q.height < 1 || cs.visibility === 'hidden' || cs.display === 'none' || b.closest('[hidden]')) continue;
    if (q.left < r.right && q.right > r.left && q.top < r.bottom && q.bottom > r.top) over.push((b.id || b.className || b.tagName) + ' ' + Math.round(q.left) + ',' + Math.round(q.top));
  }
  const c = CLOUD_CFG || {};
  return {ch:m('dsb-channel'), robots:m('robots'), tag:t ? t.textContent : null, pe:t ? getComputedStyle(t).pointerEvents : null,
    rect:r ? [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)] : null, over,
    url:c.supabaseUrl, anon:c.supabaseAnon, wos:c.workosClientId, hosts:c.hosts, hasTest:'test' in c, on:cloudOn(), pub:pubHost(), mode:shopMode(), tagCh:CHANNEL_TAG.ch};
})()"""

# the Patchnotes app opened: the mark «på test» in both languages, whether it is the first thing in the list, and inside the screen
PATCHLOOK = """(() => {
  S.tut = 0; PHONE.show(true); PHONE.open('patch');
  const q = () => document.getElementById('patchTest'), txt = () => { const e = q(), b = e && e.querySelector('.ptest'); return b ? b.textContent : null; };
  const no = txt(); S.lang = 'en'; PHONE.open('patch'); const en = txt(); S.lang = 'no'; PHONE.open('patch');
  const e = q(), c = e ? e.parentElement : null;
  return {no, en, first:!!(e && c && c.firstElementChild === e), cards:document.querySelectorAll('.patchc').length};
})()"""
# (asked once the phone has slid up)
PATCHIN = """(() => { const e = document.getElementById('patchTest'), r = e ? e.getBoundingClientRect() : null;
  return !!r && r.width > 40 && r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight; })()"""

async def page(br, url, w, h):
    ctx = await br.new_context(viewport={'width': w, 'height': h}, has_touch=True); pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    await boot(pg, url); return ctx, pg, errs

async def main():
    d = test_build()
    srv = _Srv(('127.0.0.1', 0), functools.partial(_Quiet, directory=d)); threading.Thread(target=srv.serve_forever, daemon=True).start()
    tbase = 'http://127.0.0.1:%d/' % srv.server_port; tgame = GAME.replace(BASE, tbase)
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--host-resolver-rules=MAP test.detstorebla.no 127.0.0.1'])
        # ---------- the test edition ----------
        v = json.loads(urllib.request.urlopen(tbase + 'version.json').read())
        check(v.get('ch') == 'test' and len(v.get('v', '')) == 12, 'test build: version.json has "ch":"test"', v)
        for name, w, h in (('stående', 800, 1280), ('liggende', 1280, 800), ('telefon_stående', 390, 844), ('telefon_liggende', 844, 390)):
            ctx, pg, errs = await page(br, tgame, w, h)
            before = await pg.evaluate("(() => { const m = n => { const e = document.querySelector('meta[name=' + n + ']'); return e ? e.content : null; }; return [m('dsb-channel'), m('robots')]; })()")
            await pg.evaluate('CHANNEL_TAG.place()'); r = await pg.evaluate(LOOK)
            check(before == ['test', 'noindex'], 'test build %s: the page has dsb-channel test and robots noindex' % name, before)
            check(r['tag'] == 'Testutgave' and r['pe'] == 'none', 'test build %s: the label «Testutgave» is there and takes no touch' % name, r)
            check(bool(r['rect']) and r['rect'][0] < w * 0.5 and r['rect'][0] + r['rect'][2] <= w and r['rect'][1] < 20 and r['rect'][2] < 90 and r['rect'][3] < 20, 'test build %s: the label is small and at the top, in the left half' % name, r['rect'])
            check(r['over'] == [], 'test build %s: the label lies over no button at sea' % name, r['over'])
            await pg.screenshot(path=os.path.join(OUT, 'kanal_%s.png' % name))
            # with the phone, the drawer of actions and the map open too
            for what, js in (('telefonen', "S.tut = 0; PHONE.show(true)"), ('kartet', "PHONE.show(false); const b = document.getElementById('mapBtn') || document.querySelector('[data-a=map]'); if (b) b.click()")):
                await pg.evaluate('(() => { %s; })()' % js); await pg.wait_for_timeout(600); await pg.evaluate('CHANNEL_TAG.place()')
                o = (await pg.evaluate(LOOK))['over']
                check(o == [], 'test build %s: the label lies over no button with %s open' % (name, what), o)
                if what == 'telefonen': await pg.screenshot(path=os.path.join(OUT, 'kanal_%s_telefon.png' % name))
            # Patchnotes says «på test» on top in the test edition (L1b, 10.11.2026; ui/phone/07-patch.js)
            if name in ('stående', 'liggende'):
                pt = await pg.evaluate(PATCHLOOK)
                check(pt['no'] == 'på test' and pt['en'] == 'on test' and pt['first'] and pt['cards'] > 3, 'test build %s: Patchnotes has the mark «på test» / «on test» on top, above the notes' % name, pt)
                await pg.wait_for_timeout(900)
                check(await pg.evaluate(PATCHIN), 'test build %s: the mark lies inside the screen' % name, pt)
                shots = os.path.join(ROOT, 'docs', 'okter', '2026-11-10-l1b'); os.makedirs(shots, exist_ok=True)
                await pg.screenshot(path=os.path.join(shots, 'patchnotes-paa-test-%s.jpg' % ('800x1280' if w == 800 else '1280x800')), type='jpeg', quality=60)
                await pg.evaluate('PHONE.show(false)')
            if name == 'stående':
                en = await pg.evaluate("(() => { S.lang = 'en'; CHANNEL_TAG.place(); const e = document.getElementById('chTag'), t = e ? e.textContent : null; S.lang = 'no'; CHANNEL_TAG.place(); return t; })()")
                check(en == 'Test build', 'test build: the label is «Test build» in English', en)
                check(r['hosts'] == ['test.detstorebla.no'] and r['wos'] == STAGING and not r['hasTest'], 'test build: the cloud is the test block (the test host, WorkOS Staging)', r)
                check(bool(r['url']) and r['url'].startswith('https://') and r['url'].endswith('.supabase.co') and r['url'] != PROD['supabaseUrl'] and bool(r['anon']) and r['anon'] != PROD['supabaseAnon'],
                      'test build: the test project\'s address and key, not the production\'s', {'url': r['url'], 'anon': r['anon']})
                check(r['on'] is False and r['pub'] is False, 'test build on a local server: the cloud is off', r)
            check(errs == [], 'sidefeil test build %s' % name, errs); await ctx.close()
        # ---------- the build without the channel ----------
        v = json.loads(urllib.request.urlopen(BASE + 'version.json').read())
        check('ch' not in v, 'production build: version.json has no channel', v)
        ctx, pg, errs = await page(br, GAME, 800, 1280)
        r = await pg.evaluate(LOOK)
        check(r['ch'] is None and r['robots'] is None and r['tag'] is None and r['tagCh'] == '', 'production build: no channel, no noindex, no label', r)
        check(r['url'] == PROD['supabaseUrl'] and r['anon'] == PROD['supabaseAnon'] and r['wos'] == PROD['workosClientId'] and r['hosts'] == PROD['hosts'] and not r['hasTest'],
              'production build: the production\'s cloud, and no test block left in it', r)
        pt = await pg.evaluate(PATCHLOOK); await pg.evaluate('PHONE.show(false)')
        check(pt['no'] is None and pt['en'] is None and pt['cards'] > 3, 'production build: Patchnotes has no mark «på test»', pt)
        f = await pg.evaluate("""(() => { const raw = {...CLOUD_CFG, test:{hosts:['test.detstorebla.no'], supabaseUrl:'https://t.supabase.co', workosClientId:'client_t'}};
          const a = cloudCfg(raw, 'detstorebla.no', ''), b = cloudCfg(raw, 'test.detstorebla.no', ''), c = cloudCfg(raw, 'detstorebla.no', 'test'), d = cloudCfg({hosts:['127.0.0.1'], supabaseUrl:'https://sb.test'}, '127.0.0.1', 'test');
          return {a:[a.supabaseUrl, a.hosts, 'test' in a], b:[b.supabaseUrl, b.hosts, b.workosClientId, b.supabaseAnon, 'test' in b], c:[c.supabaseUrl, c.hosts], d:d.supabaseUrl, n:cloudCfg(null, 'x', 'test')}; })()""")
        check(f['a'] == [PROD['supabaseUrl'], PROD['hosts'], False], 'cloudCfg: the production host with the production build keeps the production', f['a'])
        check(f['b'] == ['https://t.supabase.co', ['test.detstorebla.no'], 'client_t', PROD['supabaseAnon'], False], 'cloudCfg: the test host takes the test block whatever the build (what the block lacks, stays)', f['b'])
        check(f['c'] == ['https://t.supabase.co', ['test.detstorebla.no']], 'cloudCfg: a test build takes the test block also on the production host (where the cloud is then off)', f['c'])
        check(f['d'] == 'https://sb.test' and f['n'] is None, 'cloudCfg: a setup without a test block (the tests\' stand-in) is left as it is', f)
        check(errs == [], 'sidefeil production build', errs); await ctx.close()
        # the production build on the test host: the test block by the host, a public host with the shop as on the production
        port = BASE.rsplit(':', 1)[1].strip('/')
        # (the tests' shortcuts in the address hold only on a local server, so the game is not started here: the setup is read as the page stands)
        ctx = await br.new_context(viewport={'width': 800, 'height': 1280}); pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://test.detstorebla.no:%s/index.html#nocloud,no3d' % port); await pg.wait_for_function("typeof shopMode === 'function' && typeof CHANNEL_TAG === 'object'", timeout=90000)
        r = await pg.evaluate(LOOK)
        check(r['hosts'] == ['test.detstorebla.no'] and r['wos'] == STAGING and r['url'] != PROD['supabaseUrl'], 'on test.detstorebla.no also the production build has the test block', r)
        check(r['pub'] is True and r['mode'] == 'off' and r['on'] is False, 'on test.detstorebla.no: a public host (pubHost), and the shop is off without the cloud as on the production', r)
        check(errs == [], 'sidefeil on the test host', errs); await ctx.close(); await br.close()
    print('FEIL: ' + ', '.join(bad) if bad else 'alt OK')
asyncio.run(main())
