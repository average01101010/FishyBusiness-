"""Player bridge for the blind playtest.

One persistent Chromium (Android-tablet sized, touch) runs the game. A tester agent drives it through the small
client `bro` (see CLIENT below), which only offers what a player can do: look, tap, drag, type, wait, rotate.

The same process is also a hidden observer the tester does not know about. It writes, outside the tester's folder:
  cmd.jsonl     every command with game state before/after and what the tap hit
  idle.jsonl    game state once a minute while the tester thinks
  snap/*.json   the save (localStorage) every 5 minutes and at the end
  frames/*.jpg  a small frame every 15 s for the timelapse
  errors.jsonl  page errors and console errors
  status.json   latest state for the live tribune page

Usage: python3 tests/playtest/harness.py --run r1 --game /tmp/playtest/spill.html
       [--play /tmp/playtest] [--obs /root/playtest-obs] [--port 8765]
"""
import argparse, base64, json, os, socket, sys, time, traceback
from playwright.sync_api import sync_playwright

KEY = 'kystfiske_proto_v1'
ACT = 2.0   # seconds of game clock a person spends on one tap
LAND = (1280, 800)
UA = ('Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) '
      'Chrome/131.0.0.0 Safari/537.36')

# Game state as the observer sees it. Everything is guarded, the game may be mid-boot.
STATE_JS = r"""(() => { try {
  const b = S.boat, fl = S.fleet || [];
  const log = S.log || [], last = log.length ? log[log.length - 1] : null;
  return {t:S.t, day:Math.floor(S.t / 1440), clock:(typeof clockStr === 'function' ? clockStr(S.t / 60) : null),
    cash:Math.round(S.cash), loan:S.loan ? Math.round(S.loan.bal || 0) : 0,
    st:b.status, port:b.port || null, stTxt:(typeof statusText === 'function' ? statusText() : null), x:+(b.pos.x).toFixed(2), y:+(b.pos.y).toFixed(2), fuel:Math.round(b.fuel),
    mult:S.mult, tut:S.tut, lang:S.lang, boat:b.type, fleet:fl.length, owned:(S.owned || []).length,
    crew:(S.crew || []).length, hold:(typeof holdTotal === 'function' ? Math.round(holdTotal()) : null),
    sets:(S.sets || []).length, ops:!!S.ops, lic:S.lic || null,
    phone:(typeof PHONE !== 'undefined' && PHONE.isOpen()) ? 1 : 0, g3:(typeof G3 !== 'undefined' && G3.isActive()) ? 1 : 0,
    nlog:log.length, lastlog:last ? String(last.no).slice(0, 140) : null,
    trips:(S.stats || {}).trips || 0, kg:Math.round((S.stats || {}).kg || 0), rev:Math.round((S.stats || {}).revenue || 0),
    toast:(document.getElementById('toast') || {}).className === 'on' ? document.getElementById('toast').textContent.slice(0, 120) : null};
} catch (e) { return {err:String(e)}; } })()"""

# What sits under a point: the element and its nearest interactive ancestor.
HIT_JS = r"""([x, y]) => { const e = document.elementFromPoint(x, y); if (!e) return null;
  const d = el => el ? {tag:el.tagName.toLowerCase(), id:el.id || null, cls:(typeof el.className === 'string' ? el.className : '').slice(0, 60) || null,
    data:Object.fromEntries(Object.entries(el.dataset || {}).slice(0, 4)), txt:(el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 50)} : null;
  const act = e.closest('button,a,input,select,textarea,label,[data-act],[data-pa],[data-a],[onclick],[role=button],.btn');
  let cur = null; try { cur = getComputedStyle(e).cursor; } catch (_) {}
  return {el:d(e), act:d(act), select:(e.tagName === 'SELECT' || (act && act.tagName === 'SELECT')) ? 1 : 0, pointer:cur === 'pointer' ? 1 : 0}; }"""

# Find a visible element by its text, preferring interactive and exact matches, then the smallest one.
FIND_JS = r"""(q) => { q = q.trim().toLowerCase(); const out = [];
  const vis = el => { const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return null;
    if (r.bottom < 0 || r.right < 0 || r.top > innerHeight || r.left > innerWidth) return null;
    const s = getComputedStyle(el); if (s.visibility === 'hidden' || s.display === 'none' || +s.opacity === 0) return null; return r; };
  for (const el of document.querySelectorAll('body *')){
    if (el.closest('[hidden]')) continue;
    const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join(' ').trim().replace(/\s+/g, ' ').toLowerCase();
    const full = (el.innerText || '').trim().replace(/\s+/g, ' ').toLowerCase();
    const aria = ((el.getAttribute('aria-label') || '') + ' ' + (el.getAttribute('title') || '')).toLowerCase();
    let score = 0;
    if (own === q || full === q) score = 3; else if (own.includes(q)) score = 2; else if (aria.includes(q) || (full.includes(q) && full.length < q.length + 40)) score = 1;
    if (!score) continue; const r = vis(el); if (!r) continue;
    const cx = Math.min(innerWidth - 1, Math.max(0, r.left + r.width / 2)), cy = Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2));
    const top = document.elementFromPoint(cx, cy); if (!top || !(el.contains(top) || top.contains(el))) continue;
    const inter = el.closest('button,a,input,select,label,[data-act],[data-pa],[data-a],[onclick],[role=button]') ? 1 : 0;
    out.push({score, inter, area:r.width * r.height, x:Math.round(cx), y:Math.round(cy), txt:(el.innerText || aria).trim().replace(/\s+/g, ' ').slice(0, 40)});
  }
  out.sort((a, b) => b.score - a.score || b.inter - a.inter || a.area - b.area); return out.slice(0, 6); }"""

NO_TEST_TOOLS_JS = r"""(() => {
  const css = 'label:has(#phPace), label.pace, #pace, #phPace, [data-pa="jobRush"] { display: none !important; }';
  const strip = root => { const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) if (/Tempo for testing|pace for testing/i.test(n.nodeValue))
      n.nodeValue = n.nodeValue.replace(/\s*Tempo for testing finner du under Innstillinger på telefonen\.?/i, '').replace(/\s*A faster pace for testing is under Settings on the phone\.?/i, ''); };
  const boot = () => { const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st); strip(document.body);
    new MutationObserver(ms => { for (const m of ms) for (const x of m.addedNodes) if (x.nodeType === 1 || x.nodeType === 3) strip(x.nodeType === 1 ? x : x.parentNode || document.body); })
      .observe(document.body, {childList:true, subtree:true}); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();"""

# A virtual clock under the page. Playwright's own clock fakes animation frames one by one and falls far behind
# when a 3D frame takes half a second, so this one only shifts Date and performance.now and holds animation
# frames while paused. Timers still run, but the game measures time with Date, so nothing advances.
# The offset survives a reload (sessionStorage), so thinking time never turns into catch-up time.
VCLOCK_JS = r"""(() => {
  const RD = Date, rnow = RD.now.bind(RD), rperf = performance.now.bind(performance), p0 = rnow() - rperf();
  let st = {off:0, at:null};
  try { const v = JSON.parse(sessionStorage.getItem('__vclock') || 'null'); if (v) st = v; } catch (_) {}
  const keep = () => { try { sessionStorage.setItem('__vclock', JSON.stringify(st)); } catch (_) {} };
  const vnow = () => st.at !== null ? st.at : rnow() - st.off;
  class VDate extends RD { constructor(...a){ if (a.length) super(...a); else super(vnow()); } static now(){ return vnow(); } }
  window.Date = VDate;
  performance.now = () => vnow() - p0;
  const RAF = window.requestAnimationFrame.bind(window), CAF = window.cancelAnimationFrame.bind(window);
  let held = [], hid = 0;
  window.requestAnimationFrame = cb => { if (st.at !== null){ const id = --hid; held.push({id, cb}); return id; } return RAF(() => cb(performance.now())); };
  window.cancelAnimationFrame = id => { if (id < 0) held = held.filter(h => h.id !== id); else CAF(id); };
  window.__vclock = {
    pause(){ if (st.at === null){ st.at = rnow() - st.off; keep(); } },
    resume(){ if (st.at !== null){ st.off = rnow() - st.at; st.at = null; keep(); const h = held; held = []; for (const x of h) RAF(() => x.cb(performance.now())); } },
    jump(ms){ if (st.at !== null) st.at += ms; else st.off -= ms; keep(); },
    now: vnow};
})();"""

SELECT_JS = r"""([x, y, pick]) => { let e = document.elementFromPoint(x, y); if (e && e.tagName !== 'SELECT') e = e.closest('select');
  if (!e) { const l = document.elementFromPoint(x, y); const lab = l && l.closest('label'); e = lab ? lab.querySelector('select') : null; }
  if (!e) return null; const opts = [...e.options].map(o => o.textContent.trim());
  if (pick === null) return {opts, cur:e.options[e.selectedIndex] ? e.options[e.selectedIndex].textContent.trim() : null};
  const p = pick.trim().toLowerCase(); let i = opts.findIndex(o => o.toLowerCase() === p); if (i < 0) i = opts.findIndex(o => o.toLowerCase().includes(p));
  if (i < 0) return {opts, miss:1}; e.selectedIndex = i; e.dispatchEvent(new Event('input', {bubbles:true})); e.dispatchEvent(new Event('change', {bubbles:true}));
  return {opts, set:opts[i]}; }"""


class Harness:
    def __init__(self, a):
        self.a = a
        self.play = a.play
        self.shots = os.path.join(a.play, 'bilder')
        self.obs = os.path.join(a.obs, a.run)
        for d in (self.shots, self.obs, os.path.join(self.obs, 'snap'), os.path.join(self.obs, 'frames')):
            os.makedirs(d, exist_ok=True)
        self.n = 0
        self.frame = 0
        self.t0 = time.time()
        self.last_snap = 0
        self.last_frame = 0
        self.last_idle = 0
        self.orient = 'liggende'
        self.diary = []
        self.last_shot = None
        self.land = (a.w, a.h)
        self.port = (a.pw or a.h, a.ph or a.w)
        self.hum = 0.0
        self.away = 0.0
        self.frozen = False
        self.seen = {}
        self.acts = 0          # player actions in the current phase (not diary, not reading the screen)

    # ---- files -------------------------------------------------------------------------------------------------
    def jl(self, name, obj):
        with open(os.path.join(self.obs, name), 'a') as f:
            f.write(json.dumps(obj, ensure_ascii=False) + '\n')

    def state(self):
        try:
            return self.page.evaluate(STATE_JS)
        except Exception as e:
            return {'err': str(e)[:200]}

    def snapshot(self, tag):
        try:
            raw = self.page.evaluate('k => localStorage.getItem(k)', KEY)
            if raw:
                p = os.path.join(self.obs, 'snap', '%s_%05d.json' % (tag, int(time.time() - self.t0)))
                with open(p, 'w') as f:
                    f.write(raw)
        except Exception as e:
            self.jl('errors.jsonl', {'w': self.wall(), 'kind': 'snap', 'msg': str(e)[:300]})
        self.last_snap = time.time()

    def wall(self):
        return round(time.time() - self.t0, 1)

    PACE = {1: '2× (normalt)', 30: '60×', 300: '600×', 1800: '3600×'}

    def cmd_txt(self, r):
        a = r.get('args') or []
        c = r.get('cmd')
        if c == 'trykk' and r.get('find'):
            return 'trykk «%s»' % r['find']['q']
        if c == 'dagbok':
            return 'skrev i dagboka'
        return (c + ' ' + ' '.join(str(x) for x in a)).strip()[:80]

    def thoughts(self):
        # the tester's own words between actions, from its transcript (set by the operator in transcript.txt)
        try:
            path = open(os.path.join(self.obs, 'transcript.txt')).read().strip()
            out = []
            with open(path) as f:
                for line in f:
                    try:
                        o = json.loads(line)
                    except Exception:
                        continue
                    if o.get('type') != 'assistant':
                        continue
                    for c in (o.get('message') or {}).get('content') or []:
                        if c.get('type') == 'text' and c.get('text', '').strip():
                            t = c['text'].strip()[:600]
                            ts = o.get('timestamp') or self.seen.setdefault(t, time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()))
                            out.append({'ts': ts, 'txt': t})
            return out[-6:]
        except Exception:
            return []

    def write_tribune(self, st):
        try:
            phase = open(os.path.join(self.obs, 'phase.txt')).read().strip() or 'spill'
        except Exception:
            phase = 'spill'
        last = []
        try:
            with open(os.path.join(self.obs, 'cmd.jsonl')) as f:
                rows = f.readlines()[-10:]
            for l in rows:
                r = json.loads(l)
                last.append({'n': r['n'], 'txt': self.cmd_txt(r)})
        except Exception:
            pass
        doc = {'run': self.a.run, 'phase': phase, 'ts': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'n': self.n,
               'acts': self.acts, 'wall': int(self.wall()), 'hum': int(self.hum), 'away': int(self.away), 'clock': st.get('clock'), 'cash': st.get('cash'), 'boat': st.get('stTxt'),
               'pace': self.PACE.get(st.get('mult'), str(st.get('mult')) + '×') if st.get('mult') is not None else None,
               'last': last[-8:], 'tanker': self.thoughts(),
               'dagbok': [{'ts': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(self.t0 + d['w'])), 'n': d['n'], 'txt': d['txt']} for d in self.diary[-15:]]}
        tmp = os.path.join(self.obs, 'tribune.json.tmp')
        with open(tmp, 'w') as f:
            json.dump(doc, f, ensure_ascii=False)
        os.replace(tmp, os.path.join(self.obs, 'tribune.json'))
        if self.last_shot:
            try:
                import shutil
                shutil.copyfile(self.last_shot, os.path.join(self.obs, 'tribune.tmp.jpg'))
                os.replace(os.path.join(self.obs, 'tribune.tmp.jpg'), os.path.join(self.obs, 'tribune.jpg'))
            except Exception:
                pass

    def write_status(self, st=None):
        st = st or self.state()
        if 'err' not in st:
            self.write_tribune(st)
        o = {'run': self.a.run, 'n': self.n, 'wall': self.wall(), 'orient': self.orient, 'shot': self.last_shot,
             'state': st, 'diary': self.diary[-12:], 'updated': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}
        tmp = os.path.join(self.obs, 'status.json.tmp')
        with open(tmp, 'w') as f:
            json.dump(o, f, ensure_ascii=False)
        os.replace(tmp, os.path.join(self.obs, 'status.json'))

    # ---- browser -----------------------------------------------------------------------------------------------
    def start(self, pw):
        # software compositing keeps the 2D screens fast; WebGL still runs on SwiftShader
        self.browser = pw.chromium.launch(args=['--disable-gpu-compositing', '--use-angle=swiftshader',
                                                '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        self.ctx = self.browser.new_context(viewport={'width': self.land[0], 'height': self.land[1]}, has_touch=True,
                                            is_mobile=False, device_scale_factor=1, user_agent=self.a.ua, locale='nb-NO',
                                            timezone_id='Europe/Oslo', ignore_https_errors=True)
        # without a GPU the 3D view renders about one frame a second at full size; a lower pixel ratio for the
        # 3D canvas only (the game caps it at 1.5 anyway) roughly doubles that, the page itself stays sharp
        self.ctx.add_init_script('Object.defineProperty(window, "devicePixelRatio", {get: () => %s});' % self.a.dpr3d)
        # a real playtest: the test-only controls (pace, rush job) are not there, as in a release build
        self.ctx.add_init_script(NO_TEST_TOOLS_JS)
        # the game's clock only runs while the tester acts or waits, never while it thinks (see freeze/run)
        self.ctx.add_init_script(VCLOCK_JS)
        self.page = self.ctx.new_page()
        self.page.on('pageerror', lambda e: self.jl('errors.jsonl', {'w': self.wall(), 'n': self.n, 'kind': 'pageerror', 'msg': str(e)[:500]}))
        self.page.on('console', lambda m: m.type == 'error' and self.jl('errors.jsonl', {'w': self.wall(), 'n': self.n, 'kind': 'console', 'msg': m.text[:500]}))
        self.cdp = self.ctx.new_cdp_session(self.page)
        self.page.goto('file://' + os.path.abspath(self.a.game))
        self.page.wait_for_timeout(2500)
        self.thaw_v = self.page.evaluate('window.__vclock.now()') - 2500
        self.freeze()
        self.shoot()
        self.write_status()
        self.snapshot('start')

    def shoot(self):
        self.n_shot = getattr(self, 'n_shot', 0) + 1
        p = os.path.join(self.shots, '%04d.jpg' % self.n_shot)
        # the DevTools capture is about three times faster than page.screenshot while the 3D view renders
        r = self.cdp.send('Page.captureScreenshot', {'format': 'jpeg', 'quality': 72})
        with open(p, 'wb') as f:
            f.write(base64.b64decode(r['data']))
        self.last_shot = p
        return p

    def tframe(self):
        try:
            self.frame += 1
            p = os.path.join(self.obs, 'frames', '%05d.jpg' % self.frame)
            r = self.cdp.send('Page.captureScreenshot', {'format': 'jpeg', 'quality': 50})
            with open(p, 'wb') as f:
                f.write(base64.b64decode(r['data']))
        except Exception:
            pass
        self.last_frame = time.time()

    # ---- the game clock ----------------------------------------------------------------------------------------
    # A person taps every second or two; the tester thinks for 10-30 s between actions. So the page's clock (Date,
    # timers, animation frames) is paused while the tester thinks, and runs for a human-sized slice after each
    # action. `hum` sums those slices: the time a quick human would have spent to get this far.
    def freeze(self):
        v = self.page.evaluate('(window.__vclock.pause(), window.__vclock.now())')
        if getattr(self, 'thaw_v', None) is not None:
            self.hum += max(0.0, (v - self.thaw_v) / 1000.0)
        self.thaw_v = None
        self.frozen = True

    def thaw(self):
        self.thaw_v = self.page.evaluate('(window.__vclock.resume(), window.__vclock.now())')
        self.frozen = False

    def run(self, sec, duties=False):
        self.thaw()
        end = time.time() + sec
        while True:
            left = end - time.time()
            if left <= 0:
                break
            self.page.wait_for_timeout(int(min(5.0, left) * 1000) + 1)
            if duties:
                self.idle_duties()
        self.freeze()

    def touch(self, kind, pts):
        self.cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y} for x, y in pts]})

    def tap(self, x, y):
        self.touch('touchStart', [(x, y)])
        self.page.wait_for_timeout(60)
        self.touch('touchEnd', [])

    def hold(self, x, y, sec):
        self.thaw()
        t = time.time()
        self.touch('touchStart', [(x, y)])
        self.page.wait_for_timeout(int(sec * 1000))
        self.touch('touchEnd', [])
        self.freeze()

    def drag(self, x1, y1, x2, y2, ms):
        steps = max(3, min(8, int(ms / 60)))
        self.thaw()
        t = time.time()
        self.touch('touchStart', [(x1, y1)])
        for i in range(1, steps + 1):
            f = i / steps
            self.page.wait_for_timeout(int(ms / steps))
            self.touch('touchMove', [(x1 + (x2 - x1) * f, y1 + (y2 - y1) * f)])
        self.touch('touchEnd', [])
        self.freeze()

    def pinch(self, x, y, k):
        d0 = 60 if k >= 1 else 180
        d1 = d0 * k
        self.thaw()
        self.touch('touchStart', [(x - d0, y), (x + d0, y)])
        for i in range(1, 11):
            d = d0 + (d1 - d0) * i / 10
            self.page.wait_for_timeout(30)
            self.touch('touchMove', [(x - d, y), (x + d, y)])
        self.touch('touchEnd', [])
        self.freeze()

    # ---- commands ----------------------------------------------------------------------------------------------
    def run_cmd(self, c):
        """c = {'cmd': name, 'args': [...]} -> (text for the tester, extra for the log)"""
        cmd, args = c.get('cmd'), c.get('args') or []
        extra = {}
        settle = ACT
        view = self.page.viewport_size
        W, H = view['width'], view['height']

        def pt(i):
            x, y = int(float(args[i])), int(float(args[i + 1]))
            if not (0 <= x < W and 0 <= y < H):
                raise ValueError('Punktet (%d, %d) er utenfor skjermen, som er %d × %d.' % (x, y, W, H))
            return x, y

        if cmd == 'bilde':
            settle = 0
            msg = 'Skjermen er %d × %d piksler (%s).' % (W, H, self.orient)
        elif cmd == 'trykk':
            if len(args) >= 2 and all(_num(v) for v in args[:2]):
                x, y = pt(0)
            else:
                q = ' '.join(args).strip()
                if not q:
                    raise ValueError('Skriv enten «trykk X Y» eller «trykk "tekst"».')
                found = self.page.evaluate(FIND_JS, q)
                extra['find'] = {'q': q, 'hits': found}
                if not found:
                    shot = self.shoot()
                    return 'Fant ingen synlig tekst som ligner «%s». Ingenting ble trykket.\nBilde: %s' % (q, shot), extra
                x, y = found[0]['x'], found[0]['y']
            hit = self.page.evaluate(HIT_JS, [x, y])
            extra['hit'] = hit
            extra['xy'] = [x, y]
            if hit and hit.get('select'):
                sel = self.page.evaluate(SELECT_JS, [x, y, None])
                extra['select'] = sel
                shot = self.shoot()
                opts = '\n'.join('  - %s' % o for o in sel['opts'])
                return ('Du trykket på en nedtrekksliste (nå valgt: %s). Valgene:\n%s\nVelg med: velg %d %d "valg"\nBilde: %s'
                        % (sel.get('cur'), opts, x, y, shot)), extra
            self.tap(x, y)
            msg = ('Trykket på (%d, %d).' % (x, y)) if 'find' not in extra else ('Trykket på «%s» ved (%d, %d).' % (extra['find']['hits'][0]['txt'], x, y))
        elif cmd == 'hold':
            x, y = pt(0)
            sec = min(10.0, max(0.2, float(args[2]) if len(args) > 2 else 1.0))
            extra['hit'] = self.page.evaluate(HIT_JS, [x, y])
            self.hold(x, y, sec)
            settle = 1.0
            msg = 'Holdt fingeren på (%d, %d) i %.1f s.' % (x, y, sec)
        elif cmd == 'dra':
            x1, y1 = pt(0)
            x2, y2 = pt(2)
            ms = int(float(args[4])) if len(args) > 4 else 400
            extra['hit'] = self.page.evaluate(HIT_JS, [x1, y1])
            self.drag(x1, y1, x2, y2, max(100, min(3000, ms)))
            settle = 1.0
            msg = 'Dro fingeren fra (%d, %d) til (%d, %d).' % (x1, y1, x2, y2)
        elif cmd == 'knip':
            x, y = pt(0)
            k = max(0.25, min(4.0, float(args[2]) if len(args) > 2 else 2.0))
            self.pinch(x, y, k)
            settle = 1.0
            msg = 'To fingre ved (%d, %d), %s.' % (x, y, 'spredt ut (zoom inn)' if k > 1 else 'klemt sammen (zoom ut)')
        elif cmd == 'rull':
            x, y = pt(0)
            dy = int(float(args[2])) if len(args) > 2 else 300
            # a finger swipe the other way scrolls the content by dy
            y2 = max(1, min(H - 1, y - dy))
            self.drag(x, y, x, y2, 350)
            settle = 1.0
            msg = 'Sveipet ved (%d, %d) for å rulle %d px.' % (x, y, dy)
        elif cmd == 'velg':
            x, y = pt(0)
            pick = ' '.join(args[2:]).strip()
            sel = self.page.evaluate(SELECT_JS, [x, y, pick])
            extra['select'] = sel
            if not sel:
                msg = 'Det er ingen nedtrekksliste ved (%d, %d).' % (x, y)
            elif sel.get('miss'):
                msg = 'Fant ikke valget «%s». Valgene er: %s' % (pick, ' | '.join(sel['opts']))
            else:
                msg = 'Valgte «%s».' % sel['set']
        elif cmd == 'skriv':
            txt = ' '.join(args)
            self.page.keyboard.type(txt, delay=20)
            settle = max(ACT, len(txt) / 3.0)
            msg = 'Skrev «%s».' % txt
        elif cmd == 'tast':
            k = (args[0] if args else 'Enter')
            k = {'enter': 'Enter', 'tilbake': 'Backspace', 'backspace': 'Backspace', 'esc': 'Escape', 'escape': 'Escape', 'tab': 'Tab'}.get(k.lower(), k)
            self.page.keyboard.press(k)
            settle = 1.0
            msg = 'Trykket tasten %s.' % k
        elif cmd == 'vent':
            sec = max(1.0, min(600.0, float(args[0]) if args else 5.0))
            self.run(sec, duties=True)
            settle = 0
            msg = 'Ventet %d sekunder.' % sec
        elif cmd == 'borte':
            hrs = max(0.25, min(12.0, float(args[0].replace(',', '.')) if args else 1.0))
            self.page.evaluate('ms => window.__vclock.jump(ms)', int(hrs * 3600 * 1000))
            self.away += hrs * 3600
            self.hum += hrs * 3600
            extra['away_h'] = hrs
            settle = 3.0
            msg = 'Du la fra deg nettbrettet i %s %s og tok det fram igjen.' % (('%g' % hrs).replace('.', ','), 'time' if hrs == 1 else 'timer')
        elif cmd == 'tekst':
            txt = self.page.evaluate("document.body.innerText")
            lines = [l.strip() for l in txt.split('\n') if l.strip()]
            out = '\n'.join(lines)
            if len(out) > 3500:
                out = out[:3500] + '\n[… mer tekst er kuttet]'
            return 'Synlig tekst på skjermen:\n' + out, extra
        elif cmd == 'snu':
            if self.orient == 'liggende':
                self.page.set_viewport_size({'width': self.port[0], 'height': self.port[1]})
                self.orient = 'stående'
            else:
                self.page.set_viewport_size({'width': self.land[0], 'height': self.land[1]})
                self.orient = 'liggende'
            settle = 1.5
            v = self.page.viewport_size
            msg = 'Nettbrettet er snudd til %s format (%d × %d).' % (self.orient, v['width'], v['height'])
        elif cmd == 'lastinn':
            self.snapshot('before_reload')
            self.thaw()
            self.page.reload()
            self.page.wait_for_timeout(2500)
            self.thaw_v = self.page.evaluate('window.__vclock.now()') - 2500
            self.freeze()
            settle = 0
            msg = 'Siden er lastet inn på nytt.'
        elif cmd == 'dagbok':
            txt = ' '.join(args).strip()
            if not txt:
                raise ValueError('Skriv dagbok "tekst".')
            e = {'w': self.wall(), 'n': self.n, 'txt': txt[:1200]}
            self.diary.append(e)
            with open(os.path.join(self.play, 'dagbok.txt'), 'a') as f:
                f.write('[%s] %s\n' % (time.strftime('%H:%M'), txt))
            self.jl('diary.jsonl', e)
            self.write_status()
            return 'Notert i dagboka.', extra
        else:
            raise ValueError('Ukjent kommando «%s». Se «bro hjelp».' % cmd)
        if settle:
            self.run(settle)
        if cmd in ('tekst', 'dagbok'):
            return msg, extra
        shot = self.shoot()
        return (msg + '\n' if msg else '') + 'Bilde: ' + shot, extra

    def ctl(self, name, default):
        try:
            return open(os.path.join(self.obs, name)).read().strip() or default
        except Exception:
            return default

    def handle(self, c):
        before = getattr(self, 'last_state', None) or self.state()
        self.n += 1
        phase = self.ctl('phase.txt', 'spill')
        if phase != getattr(self, 'phase', None):
            self.phase = phase
            self.acts = 0
        if c.get('cmd') not in ('dagbok', 'bilde', 'tekst', 'hjelp'):
            self.acts += 1
        t = time.time()
        try:
            text, extra = self.run_cmd(c)
            ok = True
        except ValueError as e:
            text, extra, ok = str(e), {}, False
        except Exception as e:
            text, extra, ok = 'Noe gikk galt i spillerbroen: %s' % str(e)[:200], {'exc': traceback.format_exc()[-800:]}, False
        after = self.state()
        self.last_state = after
        limit = int(self.ctl('limit.txt', '0') or 0)
        if limit and self.acts >= limit and ok:
            text += ('\n\n[Økta er over. Skriv en siste dagboknotis og avslutt med en kort oppsummering av hva du gjorde.]')
        rec = {'phase': self.phase, 'acts': self.acts, 'n': self.n, 'w': self.wall(), 'hum': round(self.hum, 1), 'away': round(self.away), 'dur': round(time.time() - t, 2), 'cmd': c.get('cmd'), 'args': c.get('args'),
               'ok': ok, 'orient': self.orient, 'before': before, 'after': after, 'shot': self.last_shot}
        rec.update(extra)
        self.jl('cmd.jsonl', rec)
        if before.get('mult') != after.get('mult'):
            self.jl('events.jsonl', {'w': self.wall(), 'n': self.n, 'kind': 'pace', 'from': before.get('mult'), 'to': after.get('mult')})
        self.write_status(after)
        return text

    def idle_duties(self):
        now = time.time()
        if now - self.last_frame >= 15 and not self.frozen:
            self.tframe()
        if now - self.last_idle >= 60:
            st = self.state()
            if 'err' not in st:
                self.last_state = st
            self.jl('idle.jsonl', {'w': self.wall(), 'n': self.n, 's': st})
            self.write_status(st)
            self.last_idle = now
        if now - self.last_snap >= 300:
            self.snapshot('auto')

    def serve(self):
        srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        srv.bind(('127.0.0.1', self.a.port))
        srv.listen(4)
        srv.settimeout(1.0)
        print('ready', flush=True)
        while True:
            try:
                conn, _ = srv.accept()
            except socket.timeout:
                self.idle_duties()
                continue
            with conn:
                conn.settimeout(700)
                buf = b''
                while not buf.endswith(b'\n'):
                    chunk = conn.recv(65536)
                    if not chunk:
                        break
                    buf += chunk
                try:
                    c = json.loads(buf.decode('utf-8'))
                except Exception:
                    conn.sendall(b'{"text":"Kunne ikke lese kommandoen."}\n')
                    continue
                if c.get('cmd') == '__stop':
                    self.snapshot('end')
                    self.write_status()
                    conn.sendall(b'{"text":"stopped"}\n')
                    return
                text = self.handle(c)
                conn.sendall((json.dumps({'text': text}, ensure_ascii=False) + '\n').encode('utf-8'))
            self.idle_duties()


def _num(v):
    try:
        float(v)
        return True
    except ValueError:
        return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--run', required=True)
    ap.add_argument('--game', required=True)
    ap.add_argument('--play', default='/tmp/playtest')
    ap.add_argument('--obs', default='/root/playtest-obs')
    ap.add_argument('--port', type=int, default=8765)
    ap.add_argument('--w', type=int, default=LAND[0])
    ap.add_argument('--h', type=int, default=LAND[1])
    ap.add_argument('--pw', type=int, default=0)
    ap.add_argument('--ph', type=int, default=0)
    ap.add_argument('--dpr3d', type=float, default=0.5)
    ap.add_argument('--ua', default=UA)
    a = ap.parse_args()
    h = Harness(a)
    with sync_playwright() as pw:
        h.start(pw)
        try:
            h.serve()
        finally:
            try:
                h.snapshot('final')
            except Exception:
                pass
            h.browser.close()


if __name__ == '__main__':
    main()
