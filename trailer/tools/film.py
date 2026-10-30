"""Films one shot of the trailer in the built game (dist/), frame by frame on a frozen clock.

    python3 trailer/tools/film.py trailer/shots/13-snurper-brua.json [--size 540x960] [--fps 30] [--keys 5] [--all] [--out DIR]

The game is served from dist/ over HTTP (as tests/_env.py does), opened in Chromium with Playwright, booted, and set up from the
shot's JSON: date and time (S.t), boat type (applyVessel), place and heading, speed, quality, the HUD hidden. Then Playwright's
clock is paused and advanced 1000/fps ms per frame (Date, performance.now, timers and requestAnimationFrame all follow), so every
frame is exactly one step and two runs give the same pictures. The camera is set per frame from the shot: 'orbit' keys (yaw, pitch,
dist, fov round the boat, interpolated) or 'intro' (the game's own way out of Father's naust). Pictures: the key frames at 0, 25,
50, 75 and 100 % (or every frame with --all), a contact sheet, and a log with the eye's height and the free line to the boat per key.
Nothing in src/ is changed: the game is driven through G3, S and the globals the tests use."""
import os, sys, json, time, argparse, asyncio, functools, threading, http.server, math
from playwright.async_api import async_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def serve(dist):
    class Q(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Q, directory=dist))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return 'http://127.0.0.1:%d/' % srv.server_port

# the nearest sea cell to (lat, lon) that the national core has as sea at least `d` km from land (as tests/teleport3d.py)
SEA = """([la, lo, d]) => { const c = P(la, lo); for (let r = 0; r <= 80; r++) for (let a = 0; a < Math.max(1, r * 6); a++){
  const t = a / Math.max(1, r * 6) * 2 * Math.PI, q = {x:c.x + Math.cos(t) * r * 0.05, y:c.y + Math.sin(t) * r * 0.05};
  if (!isLandFar(q) && coastDistFar(q) >= d) return q; } return null; }"""

SETUP = """(sh) => {
  // the clock: minutes since EPOCH, from the shot's ISO date (UTC)
  S.t = Math.round((Date.parse(sh.when) - EPOCH) / 6e4);
  S.settings.sound = false; S.settings.music = false; S.settings.q3d = sh.quality || 'high'; S.cash = Math.max(S.cash, 1e9);
  if (sh.boat && sh.boat !== S.boat.type){ S.boat.type = sh.boat; if (S.owned.indexOf(sh.boat) < 0) S.owned.push(sh.boat); applyVessel(); }
  const b = S.boat;
  if (sh.pos){ b.pos = {x:sh.pos.x, y:sh.pos.y}; b.port = null; b.prev = null; }
  if (sh.heading != null) b.heading = sh.heading * Math.PI / 180;
  if (sh.speed){ b.status = 'sailing'; b.port = null;
    S.plan = {wps:[{x:b.pos.x + Math.sin(b.heading) * 20, y:b.pos.y - Math.cos(b.heading) * 20, port:null, fish:0}], idx:0, speed:sh.speed, returning:false}; }
  if (typeof mapNeed === 'function' && sh.pos) mapNeed(b.pos, MAPD.simR);
  if (!G3.isActive()) G3.show(true);
  document.body.classList.add('kino-clean');
  const st = document.createElement('style'); st.textContent = '.ov.kino,.ov.kino2,#kinoBtn,#kinoHud,#camBtn,#obGo,#modal,#tip,#toast,.tip{display:none!important}'; document.head.appendChild(st);
  return {t:S.t, type:S.boat.type, pos:b.pos};
}"""

def lerp(a, b, u): return a + (b - a) * u
def key_at(keys, t):
    if t <= keys[0]['t']: return keys[0]
    if t >= keys[-1]['t']: return keys[-1]
    for k0, k1 in zip(keys, keys[1:]):
        if k0['t'] <= t <= k1['t']:
            u = (t - k0['t']) / max(1e-9, k1['t'] - k0['t']); u = u * u * (3 - 2 * u)   # ease in and out between keys
            return {f: lerp(k0[f], k1[f], u) for f in ('yaw', 'pitch', 'dist', 'fov')}
    return keys[-1]

async def main():
    ap = argparse.ArgumentParser(); ap.add_argument('shot'); ap.add_argument('--size', default='540x960'); ap.add_argument('--fps', type=int, default=30)
    ap.add_argument('--keys', type=int, default=5); ap.add_argument('--all', action='store_true'); ap.add_argument('--out', default=None); ap.add_argument('--dist', default=os.path.join(ROOT, 'dist'))
    a = ap.parse_args(); sh = json.load(open(a.shot)); w, h = map(int, a.size.split('x'))
    name = os.path.splitext(os.path.basename(a.shot))[0]; out = a.out or os.path.join(ROOT, 'trailer', 'control-m1', name + '-' + a.size); os.makedirs(out, exist_ok=True)
    base = serve(a.dist); url = base + 'index.html#seed=%d,notut' % sh.get('seed', 1)
    n = int(round(sh['dur'] * a.fps)); step = 1000.0 / a.fps; keys_at = sorted(set(round(i * (n - 1) / max(1, a.keys - 1)) for i in range(a.keys)))
    log = {'shot': sh, 'size': a.size, 'fps': a.fps, 'frames': n, 'keys': [], 'errors': []}
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': w, 'height': h}, device_scale_factor=1)
        pg.on('pageerror', lambda e: log['errors'].append(str(e)))
        pg.set_default_timeout(180000)
        await pg.clock.install()   # runs at real speed until paused below
        t0 = time.time(); await pg.goto(url)
        await pg.wait_for_selector('#obGo', state='visible', timeout=120000); await pg.click('#obGo')
        await pg.wait_for_function("S.intro === true && document.getElementById('modal').hidden", timeout=60000)
        print('boot %.0fs' % (time.time() - t0), flush=True)
        if sh.get('place'):
            q = await pg.evaluate(SEA, [sh['place']['lat'], sh['place']['lon'], sh['place'].get('clear', 0.1)])
            if not q: print('FEIL: fant ikke sjø ved stedet'); return
            sh['pos'] = q
        st = await pg.evaluate(SETUP, sh); print('setup', st, flush=True)
        await pg.wait_for_function("G3.isActive()", timeout=120000)
        # let the terrain, the packs and the models come in real time before the clock is frozen
        await pg.wait_for_timeout(sh.get('load_s', 15) * 1000)
        ready = await pg.evaluate("({fps:G3.fps, vec:G3._debug.vec.tiles.length, trees:G3._debug.trees.n, life:G3._debug.life.M, eye:G3._debug.eye})")
        print('ready', ready, flush=True)
        cam = sh['cam']
        if cam['mode'] == 'intro': await pg.evaluate("(s) => G3.intro(s)", cam.get('sec', 5))
        await pg.clock.pause_at(int(time.time() * 1000))
        tf = time.time(); pre = int(round(sh.get('pre', 0) * a.fps)); clock_ms = 0
        for i in range(-pre, n):
            t = max(0, i) / a.fps
            # run_for takes whole milliseconds: step to the nearest ms of the exact frame time, so 60 fps alternates 16 and 17 ms
            target = int(round((i + pre + 1) * step)); ticks = max(1, target - clock_ms); clock_ms += ticks
            if cam['mode'] == 'orbit':
                k = key_at(cam['keys'], t)
                await pg.evaluate("(k) => { const c = G3._debug.cam; c.yaw = k.yaw * Math.PI / 180; c.pitch = k.pitch * Math.PI / 180; c.dist = k.dist; c.fov = k.fov; c.helm = false; }", k)
            for s in cam.get('spawn', []):
                if s.get('frame') == i: await pg.evaluate("(s) => G3._debug.spawnWild(s.type, s.ahead * Math.PI / 180)", s)
            await pg.clock.run_for(ticks)
            if i < 0: continue
            if a.all or i in keys_at:
                path = os.path.join(out, 'f%04d.png' % i); await pg.screenshot(path=path, timeout=180000)
                k = await pg.evaluate("""() => { const e = G3._debug.eye, bv = G3._debug.bv, t = performance.now() / 1000; if (!e) return null;
                  return {up:+(e[1] - Math.max(G3._debug.terrH(e[0], e[2]), G3._debug.seaH(e[0], e[2], t))).toFixed(1), free:+G3._debug.camFree([bv.x, bv.y + 1.2, bv.z], e).toFixed(2), d:Math.round(Math.hypot(e[0] - bv.x, e[2] - bv.z)), fov:G3._debug.curFov, lvl:G3._debug.QUAL.lvl, fps:G3.fps}; }""")
                log['keys'].append({'frame': i, 't': round(t, 2), 'file': os.path.basename(path), **(k or {})}); print('key', i, k, '%.0fs' % (time.time() - tf), flush=True)
        log['seconds'] = round(time.time() - tf, 1); log['per_frame_s'] = round((time.time() - tf) / (n + pre), 2)
        print('film: %d bilder på %.0fs, %.1fs per bilde' % (n + pre, log['seconds'], log['per_frame_s']), flush=True)
        await b.close()
    json.dump(log, open(os.path.join(out, 'log.json'), 'w'), indent=1, ensure_ascii=False)
    try:
        from PIL import Image
        ims = [Image.open(os.path.join(out, k['file'])) for k in log['keys']]
        if ims:
            tw = 360; th = int(tw * h / w); sheet = Image.new('RGB', (tw * len(ims), th), (20, 24, 30))
            for j, im in enumerate(ims): sheet.paste(im.resize((tw, th)), (j * tw, 0))
            sheet.save(os.path.join(out, 'kontaktark.jpg'), quality=88)
    except Exception as e: print('kontaktark:', e)

asyncio.run(main())
