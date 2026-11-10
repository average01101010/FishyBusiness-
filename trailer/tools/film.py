"""Films one shot of the trailer in the built game (dist/), frame by frame on a frozen clock.

    python trailer/tools/film.py trailer/shots/13-snurper-brua.json [--size 1080x1920] [--fps 30] [--gpu [gl|vulkan|d3d11]] [--stills]

The game is served from dist/ over HTTP (as tests/_env.py does), opened in Chromium with Playwright, booted, and set up from the
shot's JSON: date and time (S.t), boat type (applyVessel), place and heading, speed, quality, the HUD hidden. The pace is real time
(S.mult = 1/GAME_RATE) unless the shot says "pace": "game": the game sails six times faster than life, and a 38 m seiner at 8 knots
then crosses the picture like a speedboat. The terrain, the packs and the models load in real time until they stop changing; then
Playwright's clock is paused and advanced 1000/fps ms per frame (Date, performance.now, timers and requestAnimationFrame follow), so
every frame is exactly one step and two runs give the same pictures.

The camera per frame: 'orbit' keys (yaw, pitch, dist, fov round the boat, interpolated), 'fixed' keys (an eye in the world, lat/lon
and height, looking at the boat or at a point; through G3.film), or 'intro' (the game's own way out of Father's naust).

Checks, every frame including the pre-roll: the hull's outline against the fine terrain (land, shoal), the hull at the waterline and
the mast up its height against the solids the game keeps for its camera (bridge piers and decks, quays, buildings), the eye against
the sea, the terrain and the solids, and the free line from the eye to the boat. After filming, every frame against the one before
(a jump in the picture). Out: every frame (with --gpu) and clip.mp4 in trailer/out/<shot>-<size>/ (not in git), and a contact sheet
of the key frames and log.json in trailer/control-m1/<shot>-<size>/."""
import os, sys, json, time, argparse, asyncio, functools, threading, http.server, math, shutil, subprocess, datetime
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
  S.settings.sound = false; S.settings.music = false; S.settings.q3d = sh.quality || 'ultra'; S.cash = Math.max(S.cash, 1e9);
  if ((sh.pace || 'real') === 'real') S.mult = 1 / GAME_RATE;
  if (sh.boat && sh.boat !== S.boat.type){ S.boat.type = sh.boat; if (S.owned.indexOf(sh.boat) < 0) S.owned.push(sh.boat); applyVessel(); }
  // Father's naust where a new game has it (Vangshamn, HOME0); #notut keeps the tests' Finnsnes otherwise
  if (sh.home){ S.home = sh.home; S.naust = null; }
  const b = S.boat;
  if (sh.moor){ const pt = portById(sh.moor.port); b.pos = {x:pt.p.x, y:pt.p.y}; b.port = sh.moor.port; b.status = 'port'; S.plan = null; b.v = 0; }
  if (sh.pos){ b.pos = {x:sh.pos.x, y:sh.pos.y}; b.port = null; b.prev = null; b.status = 'idle'; S.plan = null; b.v = 0; }
  if (sh.heading != null) b.heading = sh.heading * Math.PI / 180;
  if (typeof mapNeed === 'function') mapNeed(b.pos, MAPD.simR);
  if (!G3.isActive()) G3.show(true);
  // no interface in any picture (Jonas 10.11.2026: «Ingen UI, UX eller GUI»): everything on the page but the 3D canvas #gl and the
  // elements that hold it is made invisible, the place-name layer #labels too; run again every frame for what turns up meanwhile
  document.body.classList.add('kino-clean');
  const st = document.createElement('style'); st.textContent = '.film-hide{opacity:0!important;visibility:hidden!important;pointer-events:none!important}'; document.head.appendChild(st);
  window.__filmHide = () => { const cv = document.getElementById('gl'), keep = new Set(); let n = 0;
    for (let e = cv; e && e !== document.documentElement; e = e.parentElement) keep.add(e);
    for (const a of keep) for (const c of a.children) if (!keep.has(c) && !c.classList.contains('film-hide')){ c.classList.add('film-hide'); n++; }
    return n; };
  window.__filmHide();
  const V = VESSELS[S.boat.type], m = G3._debug.mastTop(S.boat.type);
  return {t:S.t, type:S.boat.type, pos:b.pos, L:V.len, B:V.beam, D:V.draft, mast:m ? +m[1].toFixed(1) : V.len * 0.5};
}"""

# what is still loading: changes while the terrain, the packs, the trees and the models come in
LOADSTATE = """() => { const D = G3._debug; let v = D.vec; return [v.tiles.length, v.tiles.reduce((a, t) => a + t.bld + t.roads + t.quays, 0), v.chunks,
  D.trees.n, D.trees.chunks, D.near.n, D.shore.meshes, D.life.M ? 1 : 0, D.life.smk, D.seaWait ? 1 : 0, D.marina.n]; }"""

# the boat started (after the clock is frozen): from where she is pre seconds before frame 0, at the shot's speed
START = """([x, y, h, v, wp]) => { const b = S.boat; b.pos = {x, y}; b.heading = h; b.port = null; b.prev = null;
  if (v > 0){ b.status = 'sailing'; b.v = v; S.plan = {wps:wp || [{x:x + Math.sin(h) * 20, y:y - Math.cos(h) * 20, port:null, fish:0}], idx:0, speed:v, returning:false}; }
  else { b.status = 'idle'; b.v = 0; S.plan = null; }
  G3._debug.bv.init = false; return b.pos; }"""

# the boat alongside a quay face of a harbour ('main', 'naust', ...), where berthPose puts her (null until that harbour's map is in)
MOOR = """(m) => { const bp = berthPose(m.port, S.boat.type, m.kind || 'main'); if (!bp) return null; const b = S.boat;
  b.port = m.port; if (m.kind && m.kind !== 'main') b.berth = m.kind; else delete b.berth; b.status = 'port'; S.plan = null; b.v = 0;
  b.pos = {x:bp.x, y:bp.y}; b.heading = bp.hd; G3._debug.bv.init = false; return {x:bp.x, y:bp.y, hd:+(bp.hd * 180 / Math.PI).toFixed(1), face:bp.face}; }"""
# another boat at the quay (the closing shot's two boats): drawn as another player's boat (PEERS, core/05-vessels.js peerStates),
# lying `along` metres along the face from the main boat's middle (positive towards her bow), at `off` metres from her side
PEER = """(q) => { const v = G3._debug.bv, h = v.head, f = {x:Math.sin(h), z:-Math.cos(h)}, r = {x:Math.cos(h), z:Math.sin(h)};
  // from where the 3D view has the boat lying (bv), not the core's berth point: the view lays her along the quay its own way
  const x = (v.x + f.x * (q.along || 0) + r.x * (q.off || 0)) / 1000, y = (v.z + f.z * (q.along || 0) + r.z * (q.off || 0)) / 1000;
  const e = {id:'film' + PEERS.length, boat:q.name || '', vtype:q.vtype, x, y, hd:h + (q.turn || 0) * Math.PI / 180, v:0, st:'port', liv:q.liv || 0, user:'', fs:0, at:Date.now()};
  // (the game empties PEERS every 10 s when the server has not been heard for a minute, ui/10h-world.js: CHECK puts them back each frame)
  PEERS.push(e); (window.__filmPeers = window.__filmPeers || []).push(e);
  return {x, y}; }"""
# an animal put out (G3._debug.spawnWild: porpoise, orca, humpback) `ahead` degrees from where the camera looks, and with `dist` (m from
# the boat) and `age` (s into its surfacings: a humpback comes up four times 14 s apart, and only the last time shows the fluke, so
# "age": 41.7 gives the blow, the back and the tail within the next six seconds) where and when the shot wants it; the swimming
# along its way since the spawn (1.4 m/s for a humpback) is taken off, so it surfaces at that distance
SPAWN = """(s) => { const D = G3._debug, a = D.bv.head + D.cam.yaw + (s.ahead || 0) * Math.PI / 180; D.spawnWild(s.type, (s.ahead || 0) * Math.PI / 180);
  const e = D.WILD.ev[D.WILD.ev.length - 1], v = {porpoise:2.4, orca:3, humpback:1.4}[s.type] || 0;
  if (s.n) e.n = s.n; if (s.age) e.t0 -= s.age; if (s.swim === 'left') e.hd = a - 1.6;
  if (s.dist){ const along = v * (s.age || 0); e.x = D.bv.x + Math.sin(a) * s.dist - Math.sin(e.hd) * along; e.z = D.bv.z - Math.cos(a) * s.dist + Math.cos(e.hd) * along; }
  return {x:Math.round(e.x), z:Math.round(e.z), n:e.n}; }"""
# the whole track (the pre-roll and the shot, the hull's length and beam and 2 m beside) against the fine terrain before filming: clear
# when it is deeper than the draft everywhere; else the start is moved to the nearest place (rings of 15 m out to R) where it is
TRACK = """([x, y, hd, len, L, B, D, R]) => { const TH = G3._debug.terrH, s = Math.sin(hd), c = Math.cos(hd);
  const worst = (x0, z0) => { let m = -1e9; for (let d = -L / 2 - 5; d <= len + L / 2 + 5; d += 4) for (const w of [-B / 2 - 2, 0, B / 2 + 2]) m = Math.max(m, TH(x0 + s * d + c * w, z0 - c * d + s * w)); return m; };
  const x0 = x * 1000, z0 = y * 1000, w0 = worst(x0, z0); if (w0 < -D) return {ok:true, worst:+w0.toFixed(1)};
  for (let r = 15; r <= R; r += 15) for (let a = 0; a < 24; a++){ const t = a / 24 * 2 * Math.PI, xx = x0 + Math.cos(t) * r, zz = z0 + Math.sin(t) * r, w = worst(xx, zz);
    if (w < -D) return {ok:false, moved:r, dx:(xx - x0) / 1000, dy:(zz - z0) / 1000, worst:+w.toFixed(1), was:+w0.toFixed(1)}; }
  return {ok:false, none:true, was:+w0.toFixed(1)}; }"""
# the work with the gear (Jonas 10.11.2026: «at man kan fiske med redskaper som garn, liner, teiner»), with the game's own startHaul and
# startSet as tests/ombord.py does it (OB0): a clean deck, the crew she is built for (no traits: a seasick hand stands over the rail), a set
# of the kind lying where she is (soaked 12 hours, with a catch in it) and the haul started; or the gear aboard and the setting started
OP = """(o) => { const b = S.boat, V = VESSELS[b.type], type = b.type, fish = o.fish, kind = fish === 'teiner' ? 'teine' : fish;
  S.jobs = []; S.sets = []; b.gop = null; b.land = null; b.deckStop = false; b.deckEnd = null; b.dmg = null; b.damage = 0; S.incidents = [];
  S.settings.gut = true; S.settings.ice = true; S.settings.careAuto = false; S.settings.autoOn = false;
  S.pgear = newPGear(); S.pgear.kits.n = 4; S.hold = []; b.rig = fish; S.target = o.target || 'torsk'; b.status = 'idle'; S.plan = null; b.v = 0;
  const nn = Math.min(o.crew || 4, V.crewMax || 0);
  S.crew = Array.from({length:nn}, () => Object.assign(genCrew(), {bi:false, off:false, fatigue:5, morale:70, job:null, traits:[]}));
  if (kind === 'line') S.equip.linehaler = true;
  if (kind === 'garn' && equipFits('garnhaler', type)) S.equip.garnhaler = true;
  if (kind === 'teine') S.equip.teinehaler = true;
  const p = {...b.pos}, h = b.heading, pot = typeof potK === 'function' ? potK() : 'big', sp = typeof potSp === 'function' ? potSp(pot) : 'krabbe';
  if (o.do === 'sett'){ const pg = S.pgear;
    if (kind === 'line'){ pg.lines.hyse.n = 4; pg.lines.hyse.baited = 4; }
    if (kind === 'garn') pg.nets = [{id:'n1', mesh:180, ty:'bunn', n:6, cond:1}];
    if (kind === 'teine'){ pg.pots[pot] = o.n || 40; baitOf(pg).makrell = 200; if (pot === 'sno') baitOf(pg).akkar = 200; }
    const ch = setChoices().find(c => !c.off); if (!ch) return 'SKIP: ingen valg i setChoices';
    const why = startSet(ch.kind, ch.spec, 0); if (why) return 'SKIP: ' + JSON.stringify(why); }
  else {
    const acc = kind === 'teine' ? {[sp]:{kg:o.kg || 300, n:o.cn || 500}} : {torsk:{kg:220, n:70}, hyse:{kg:60, n:40}};
    S.sets = [{id:'s0', vid:S.cur, kind, n:o.n || 6, a:p, b:{x:p.x + Math.sin(h) * 0.6, y:p.y - Math.cos(h) * 0.6}, tSet:S.t - 12 * 60, acc, dead:0, cond:1, heavy:false, depth:Math.round(depthF(p)), warn:0,
      ...(kind === 'line' ? {lk:'hyse', hooks:(o.n || 6) * 600, miss:0, bent:0} : kind === 'garn' ? {mesh:180, ty:'bunn', lid:'n1'} : {pot, bait:pot === 'sno' ? 'akkar' : 'makrell'})}];
    const why = startHaul('s0', false, 0); if (why) return 'SKIP: ' + JSON.stringify(why); }
  if (S.crew.length && typeof CREW3D !== 'undefined') CREW3D.reset();
  return {crew:S.crew.length, gop:b.gop ? (b.gop.kind || b.gop.op || 'ja') : null, sets:S.sets.length, pot}; }"""
# the per-frame checks: hull outline (stern full beam, the bow narrowing to the stem) against the fine terrain and the camera's
# solids, the mast's height along the centre line against the solids, and the eye
CHECK = """([L, B, D, MH, moored]) => { window.__filmHide(); for (const q of window.__filmPeers || []) if (!PEERS.includes(q)) PEERS.push(q); const G = G3._debug, bv = G.bv, TH = G.terrH, CI = G.camInside, h = bv.head, s = Math.sin(h), c = Math.cos(h);
  const r = {x:+bv.x.toFixed(1), z:+bv.z.toFixed(1), hd:+(h * 180 / Math.PI).toFixed(1), land:[], shoal:0, solid:[], mast:[]};
  const half = [1, 1, 0.95, 0.7, 0.1];
  for (let i = 0; i <= 4; i++) for (const j of [-1, 0, 1]){ const u = (i / 4 - 0.5) * L, w = j * half[i] * B / 2, x = bv.x + s * u + c * w, z = bv.z - c * u + s * w;
    const g = TH(x, z); if (g > 0) r.land.push([i, j, +g.toFixed(1)]); else if (g > -D * 0.8) r.shoal++;
    if (!moored && CI(x, bv.y + 0.6, z)) r.solid.push([i, j]); }
  for (let i = 0; i <= 8; i++){ const u = (i / 8 - 0.5) * L * 0.9, x = bv.x + s * u, z = bv.z - c * u;
    for (const f of [0.35, 0.6, 0.8, 1.0]) if (CI(x, bv.y + MH * f, z)){ r.mast.push([i, f]); break; } }
  const e = G.eye, t = performance.now() / 1000;
  if (e){ r.up = +(e[1] - Math.max(TH(e[0], e[2]), G.seaH(e[0], e[2], t))).toFixed(1); r.ein = !!CI(e[0], e[1], e[2]);
    r.free = +G.camFree([bv.x, bv.y + 1.2, bv.z], e).toFixed(2); r.d = Math.round(Math.hypot(e[0] - bv.x, e[2] - bv.z)); }
  r.fov = +(G.curFov * 180 / Math.PI).toFixed(1); return r; }"""

# (aim: metres above the boat's middle the camera looks at, through the chase camera's cam.at, so a bridge or a mountain above her
# comes into the tall picture; with a negative pitch the eye stands lower than that point and looks up)
ORBIT = "(k) => { const c = G3._debug.cam; c.yaw = k.yaw * Math.PI / 180; c.pitch = k.pitch * Math.PI / 180; c.dist = k.dist; c.helm = false; c.at = k.aim ? [0, k.aim, 0] : null; G3.film(k.fov ? {fov:k.fov} : null); }"
FIXED = "(k) => G3.film({eye:[k.x * 1000, k.h, k.y * 1000], tgt:k.tx != null ? [k.tx * 1000, k.th, k.ty * 1000] : 'boat', fov:k.fov || 40})"
# the boat's heading in the grid (degrees; x east, y south, forward = (sin, -cos)): 'coast' is the land's bearing (the core's 200 m
# land weighted by nearness out to 3 km) turned 90 degrees to starboard, so the land lies to port; 'upwind' is where the wind comes from
HEADING = """([k, x, y, when]) => { if (k === 'upwind'){ const H = (Date.parse(when) - EPOCH) / 3.6e6, p = {x, y}; return (windDir(H, p) - gridGamma(p) + 360) % 360; }
  let sx = 0, sy = 0; for (let a = 0; a < 48; a++){ const t = a / 48 * 2 * Math.PI; for (const r of [0.3, 0.6, 1.2, 2, 3]){ if (isLandFar({x:x + Math.sin(t) * r, y:y - Math.cos(t) * r})){ sx += Math.sin(t) / r; sy += Math.cos(t) / r; } } }
  return (Math.atan2(sx, sy) * 180 / Math.PI + 90 + 360) % 360; }"""
# a point given as lat/lon (or x/y in the game's km frame) and a height, into km
WHERE = "(q) => q.lat != null ? Object.assign(P(q.lat, q.lon), {h:q.h || 0}) : {x:q.x, y:q.y, h:q.h || 0}"

def lerp(a, b, u): return a + (b - a) * u
def key_at(keys, t, fields):
    if t <= keys[0]['t']: return dict(keys[0])
    if t >= keys[-1]['t']: return dict(keys[-1])
    for k0, k1 in zip(keys, keys[1:]):
        if k0['t'] <= t <= k1['t']:
            u = (t - k0['t']) / max(1e-9, k1['t'] - k0['t']); u = u * u * (3 - 2 * u)   # ease in and out between keys
            out = dict(k0)
            for f in fields:
                if f in k0 and f in k1: out[f] = lerp(k0[f], k1[f], u)
            return out
    return dict(keys[-1])

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from enc import ffmpeg, video_args

def jumps(out, files, log):
    """every saved frame against the one before, small and grey: a jump stands out against the frames round it"""
    try:
        import numpy as np
        from PIL import Image
    except Exception as e: print('hoppsjekk:', e); return
    prev, d = None, []
    for f in files:
        a = np.asarray(Image.open(os.path.join(out, f)).convert('L').resize((108, 192)), dtype=np.float32)
        d.append(0.0 if prev is None else float(np.abs(a - prev).mean())); prev = a
    log['diff'] = [round(x, 2) for x in d]
    for i in range(2, len(d)):
        w = sorted(d[max(1, i - 8):i] + d[i + 1:i + 9]); med = w[len(w) // 2] if w else 0
        if d[i] > max(4.0, med * 3.5):
            msg = 'hopp i bildet ved bilde %d (%.1f mot %.1f rundt)' % (i, d[i], med); log['errors'].append(msg); print('FEIL:', msg, flush=True)

async def main():
    ap = argparse.ArgumentParser(); ap.add_argument('shot'); ap.add_argument('--size', default='1080x1920'); ap.add_argument('--fps', type=int, default=30)
    ap.add_argument('--keys', type=int, default=5); ap.add_argument('--stills', action='store_true', help='only the key frames: the boat is moved along her track to each key, one frame is drawn, one picture taken (for a machine without a GPU)')
    ap.add_argument('--out', default=None); ap.add_argument('--dist', default=os.path.join(ROOT, 'dist'))
    ap.add_argument('--gpu', nargs='?', const='gl', default=None, help='draw on the real graphics card instead of SwiftShader, through ANGLE on this backend: gl (default), vulkan or d3d11')
    ap.add_argument('--no-video', action='store_true')
    ap.add_argument('--scale', type=int, default=1, help='device scale factor: --size 1080x1920 --scale 2 draws the same picture at 2160x3840 (the folder is named after the pixels)')
    ap.add_argument('--jpeg', type=int, default=0, help='save the frames as JPEG at this quality (97 for 4K: a tenth of the PNG) instead of PNG')
    a = ap.parse_args(); sh = json.load(open(a.shot, encoding='utf-8')); w, h = map(int, a.size.split('x'))
    ext = 'jpg' if a.jpeg else 'png'; shot_kw = {'type': 'jpeg', 'quality': a.jpeg} if a.jpeg else {}
    name = os.path.splitext(os.path.basename(a.shot))[0]; tag = name + '-%dx%d' % (w * a.scale, h * a.scale)
    ctl = os.path.join(ROOT, 'trailer', 'control-m1', tag); out = a.out or os.path.join(ROOT, 'trailer', 'out', tag)
    os.makedirs(ctl, exist_ok=True); os.makedirs(out, exist_ok=True)
    for f in os.listdir(out):
        if f.endswith(('.png', '.jpg')): os.remove(os.path.join(out, f))
    every = bool(a.gpu) and not a.stills
    # ("hash": more of the game's own switches in the address, e.g. "shoal0")
    base = serve(a.dist); url = base + 'index.html#seed=%d,notut' % sh.get('seed', 1) + (',' + sh['hash'] if sh.get('hash') else '')
    n = int(round(sh['dur'] * a.fps)); step = 1000.0 / a.fps; keys_at = sorted(set(round(i * (n - 1) / max(1, a.keys - 1)) for i in range(a.keys)))
    log = {'shot': sh, 'size': '%dx%d' % (w * a.scale, h * a.scale), 'fps': a.fps, 'frames': n, 'keys': [], 'errors': [], 'warnings': []}
    async with async_playwright() as p:
        # headless Chromium falls back to SwiftShader unless told to use the GPU. On the rented Windows machine (RTX PRO 6000, 10.11.2026)
        # ANGLE's gl and vulkan backends reach the card; d3d11 reaches it too, but the 3D view loses its context compiling the sea shader
        args = ['--use-angle=' + a.gpu, '--enable-gpu', '--ignore-gpu-blocklist'] if a.gpu else ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
        b = await p.chromium.launch(args=args)
        pg = await b.new_page(viewport={'width': w, 'height': h}, device_scale_factor=a.scale)
        pg.on('pageerror', lambda e: log['errors'].append('sidefeil: ' + str(e)[:300]))
        pg.set_default_timeout(180000)
        await pg.clock.install()   # runs at real speed until paused below
        t0 = time.time(); await pg.goto(url)
        await pg.wait_for_selector('#obGo', state='visible', timeout=120000); await pg.click('#obGo')
        await pg.wait_for_function("S.intro === true && document.getElementById('modal').hidden", timeout=60000)
        print('boot %.0fs' % (time.time() - t0), flush=True)
        log['renderer'] = await pg.evaluate("""() => { const g = document.createElement('canvas').getContext('webgl2'), e = g && g.getExtension('WEBGL_debug_renderer_info');
          return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : '?'; }"""); print('renderer', log['renderer'], flush=True)
        if sh.get('place'):
            q = await pg.evaluate(SEA, [sh['place']['lat'], sh['place']['lon'], sh['place'].get('clear', 0.1)])
            if not q: print('FEIL: fant ikke sjø ved stedet'); return 1
            sh['pos'] = q
        elif sh.get('pos') and sh['pos'].get('lat') is not None:
            sh['pos'] = await pg.evaluate(WHERE, sh['pos'])
        # "heading": "coast" (along the shore with the land to port, so an eye to starboard, yaw 250-290, has the boat before the land),
        # "upwind" (into the wind, for the sea over the bow), or a number; {"coast": 20} turns 20 degrees from it
        hv = sh.get('heading'); hk = hv if isinstance(hv, str) else (next(iter(hv)) if isinstance(hv, dict) else None)
        if hk and sh.get('pos'):
            off = hv[hk] if isinstance(hv, dict) else 0
            g = await pg.evaluate(HEADING, [hk, sh['pos']['x'], sh['pos']['y'], sh['when']])
            sh['heading'] = round((g + off) % 360, 1); log['heading_from'] = {hk: g, 'off': off}; print('kurs', hk, round(g, 1), '->', sh['heading'], flush=True)
        st = await pg.evaluate(SETUP, sh); print('setup', st, flush=True); log['setup'] = st
        await pg.wait_for_function("G3.isActive()", timeout=120000)
        cam = sh['cam']
        if cam['mode'] == 'fixed':
            for k in cam['keys']:
                e = await pg.evaluate(WHERE, k['eye']); k['x'], k['y'], k['h'] = e['x'], e['y'], e['h']
                if isinstance(k.get('tgt'), dict): g = await pg.evaluate(WHERE, k['tgt']); k['tx'], k['ty'], k['th'] = g['x'], g['y'], g['h']
        if cam['mode'] == 'orbit': await pg.evaluate(ORBIT, key_at(cam['keys'], 0, ('yaw', 'pitch', 'dist', 'fov', 'aim')))
        if cam['mode'] == 'fixed': await pg.evaluate(FIXED, key_at(cam['keys'], 0, ('x', 'y', 'h', 'fov', 'tx', 'ty', 'th')))
        # load in real time until nothing changes for four seconds (at least load_min, at most load_s)
        t1 = time.time(); last = None; same = 0
        while time.time() - t1 < sh.get('load_s', 90):
            await pg.wait_for_timeout(1000); s = await pg.evaluate(LOADSTATE)
            same = same + 1 if s == last else 0; last = s
            if same >= 4 and time.time() - t1 >= sh.get('load_min', 10): break
        log['loaded'] = {'s': round(time.time() - t1), 'state': last}; print('lastet %.0fs' % (time.time() - t1), last, flush=True)
        if sh.get('moor'):
            # the berth is found once the harbour's map is in (the naust's site a few seconds after); then the boat lies there, the other
            # boats are laid alongside, and the camera's first key is set again round her new place
            for _ in range(90):
                m = await pg.evaluate(MOOR, sh['moor'])
                if m: break
                await pg.wait_for_timeout(1000)
            if not m: print('FEIL: fant ikke kaiplassen', sh['moor']); return 1
            log['moor'] = m; print('fortøyd', m, flush=True)
            if cam['mode'] == 'orbit': await pg.evaluate(ORBIT, key_at(cam['keys'], 0, ('yaw', 'pitch', 'dist', 'fov', 'aim')))
            # the 3D view does not put her at the berth: it sails her in along its own track, over a minute at the real pace, so the
            # game's pace is used meanwhile and she is let lie still (under 3 cm in a second, four seconds running) before anything
            # is laid alongside her and the clock frozen
            await pg.evaluate("() => { S.mult = 1; }"); still = 0; prev = None; t2 = time.time()
            while time.time() - t2 < 120 and still < 4:
                await pg.wait_for_timeout(1000); q = await pg.evaluate("() => [G3._debug.bv.x, G3._debug.bv.z, G3._debug.bv.head]")
                still = still + 1 if prev and math.hypot(q[0] - prev[0], q[1] - prev[1]) < 0.03 else 0; prev = q
            await pg.evaluate("(r) => { if (r) S.mult = 1 / GAME_RATE; }", (sh.get('pace') or 'real') == 'real')
            log['berthed'] = {'s': round(time.time() - t2), 'bv': [round(prev[0], 1), round(prev[1], 1), round(math.degrees(prev[2]), 1)]}; print('ligger', log['berthed'], flush=True)
            for q in sh.get('peers', []): print('fortøyd ved siden', q.get('vtype'), await pg.evaluate(PEER, q), flush=True)
            for _ in range(sh.get('moor_s', 12)):
                await pg.evaluate("() => { for (const q of window.__filmPeers || []) if (!PEERS.includes(q)) PEERS.push(q); }"); await pg.wait_for_timeout(1000)
        if sh.get('op'):
            r = await pg.evaluate(OP, sh['op']); print('arbeid', r, flush=True); log['op'] = r
            if isinstance(r, str) and r.startswith('SKIP'): print('FEIL:', r); return 1
            await pg.wait_for_timeout(sh['op'].get('wait', 8) * 1000)   # the crew to their places, the hauler going
        # the clock frozen. pause_at takes a datetime (a bare number is seconds in Python; milliseconds threw the clock a thousand times
        # ahead, to the year 58 000, and performance.now() so large that the waves, the sky and the sea lost their precision)
        nowms = await pg.evaluate('Date.now()')
        await pg.clock.pause_at(datetime.datetime.fromtimestamp((nowms + 1000) / 1000, tz=datetime.timezone.utc))
        pace = 1 if (sh.get('pace') or 'real') == 'real' else 6
        pre = 0 if a.stills else int(round(sh.get('pre', 0) * a.fps))
        spd = sh.get('speed', 0); vms = spd * 0.5144 * pace; hd = math.radians(sh.get('heading', 0))
        p0 = sh.get('pos') or (await pg.evaluate("S.boat.pos"))
        back = vms * pre / a.fps / 1000   # km back along the heading for the pre-roll
        if not sh.get('moor') and sh.get('pos') and cam['mode'] != 'intro' and not a.stills:
            tr = await pg.evaluate(TRACK, [p0['x'] - math.sin(hd) * back, p0['y'] + math.cos(hd) * back, hd, vms * (pre / a.fps + sh['dur']), st['L'], st['B'], st['D'], sh.get('move_max', 400)])
            log['track'] = tr; print('løpet', tr, flush=True)
            if tr.get('none'): print('FEIL: fant ikke et fritt løp innen %d m' % sh.get('move_max', 400)); return 1
            if not tr['ok']:
                p0 = {'x': p0['x'] + tr['dx'], 'y': p0['y'] + tr['dy']}; log['moved_m'] = tr['moved']
                await pg.evaluate("([x, y]) => { S.boat.pos = {x, y}; G3._debug.bv.init = false; mapNeed(S.boat.pos, MAPD.simR); }", [p0['x'], p0['y']])
                await pg.clock.run_for(4000)   # the terrain and the packs round the new place, on the frozen clock
        if not sh.get('moor') and (cam['mode'] != 'intro' or sh.get('pos')):
            print('start', await pg.evaluate(START, [p0['x'] - math.sin(hd) * back, p0['y'] + math.cos(hd) * back, hd, spd, None]), flush=True)
        # the intro is started only now, on the frozen clock: started before the pause, it had run out by the first frame
        if cam['mode'] == 'intro': print('intro', await pg.evaluate("(s) => G3.intro(s)", cam.get('sec', 5)), flush=True)
        L, B, D, MH = st['L'], st['B'], st['D'], st['mast']; moored = bool(sh.get('moored') or sh.get('moor'))
        tf = time.time(); clock_ms = 0; saved = []; worst = {}
        frames = keys_at if a.stills else range(-pre, n)
        for i in frames:
            t = max(0, i) / a.fps
            if cam['mode'] == 'orbit': await pg.evaluate(ORBIT, key_at(cam['keys'], t, ('yaw', 'pitch', 'dist', 'fov', 'aim')))
            if cam['mode'] == 'fixed': await pg.evaluate(FIXED, key_at(cam['keys'], t, ('x', 'y', 'h', 'fov', 'tx', 'ty', 'th')))
            for s in sh.get('spawn', []) + cam.get('spawn', []):
                if s.get('frame') == i: print('dyr', s['type'], await pg.evaluate(SPAWN, s), flush=True)
            if a.stills:
                d = vms * t / 1000
                if cam['mode'] == 'intro':
                    await pg.clock.fast_forward(int(round(t * 1000)) - clock_ms); clock_ms = int(round(t * 1000))
                else: await pg.evaluate(START, [p0['x'] + math.sin(hd) * d, p0['y'] - math.cos(hd) * d, hd, 0, None])
                await pg.clock.run_for(int(round(step))); await pg.clock.run_for(int(round(step)))
            else:
                # run_for takes whole milliseconds: step to the nearest ms of the exact frame time, so 30 fps alternates 33 and 34 ms
                target = int(round((i + pre + 1) * step)); ticks = max(1, target - clock_ms); clock_ms += ticks
                await pg.clock.run_for(ticks)
            c = await pg.evaluate(CHECK, [L, B, D, MH, moored])
            bad = []
            if c['land']: bad.append('skroget på land %s' % c['land'])
            if c['solid']: bad.append('skroget i bru, kai eller bygg %s' % c['solid'])
            if c['mast']: bad.append('masten i brua %s' % c['mast'])
            if c.get('up') is not None and c['up'] < 0.3: bad.append('kameraet i sjøen eller terrenget (%.1f m)' % c['up'])
            if c.get('ein'): bad.append('kameraet inne i noe')
            for m in bad: log['errors'].append('bilde %d: %s' % (i, m)); print('FEIL bilde %d: %s' % (i, m), flush=True)
            if c.get('free') is not None and c['free'] < 0.9: log['warnings'].append('bilde %d: sikten til båten %.2f' % (i, c['free']))
            if c['shoal'] and not moored: worst['shoal'] = max(worst.get('shoal', 0), c['shoal'])
            if i < 0: continue
            if every or i in keys_at:
                f = 'f%04d.%s' % (i, ext); await pg.screenshot(path=os.path.join(out, f), **shot_kw); saved.append(f)
            if i in keys_at:
                log['keys'].append({'frame': i, 't': round(t, 2), 'file': 'f%04d.%s' % (i, ext), **c}); print('key', i, c, '%.0fs' % (time.time() - tf), flush=True)
        nf = len(list(frames)); log['seconds'] = round(time.time() - tf, 1); log['per_frame_s'] = round((time.time() - tf) / max(1, nf), 3)
        if worst.get('shoal'): log['warnings'].append('grunt under skroget i noen bilder (opptil %d av 15 punkter grunnere enn 80 %% av dypgangen)' % worst['shoal'])
        print('film: %d bilder på %.0fs, %.2fs per bilde' % (nf, log['seconds'], log['per_frame_s']), flush=True)
        await b.close()
    if every: jumps(out, saved, log)
    try:
        from PIL import Image
        ims = [Image.open(os.path.join(out, k['file'])) for k in log['keys']]
        if ims:
            tw = 360; th = int(tw * h / w); sheet = Image.new('RGB', (tw * len(ims), th), (20, 24, 30))
            for j, im in enumerate(ims): sheet.paste(im.convert('RGB').resize((tw, th), Image.LANCZOS), (j * tw, 0))
            sheet.save(os.path.join(ctl, 'kontaktark.jpg'), quality=88)
    except Exception as e: print('kontaktark:', e)
    if every and not a.no_video and saved:
        mp4 = os.path.join(out, 'clip.mp4')
        r = subprocess.run([ffmpeg(), '-y', '-loglevel', 'error', '-framerate', str(a.fps), '-i', os.path.join(out, 'f%04d.' + ext)] + video_args() + ['-movflags', '+faststart', mp4])
        print('video', mp4 if r.returncode == 0 else 'FEIL', flush=True); log['video'] = os.path.relpath(mp4, ROOT).replace('\\', '/')
    json.dump(log, open(os.path.join(ctl, 'log.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    print('feil: %d, advarsler: %d' % (len(log['errors']), len(log['warnings'])), flush=True)
    for e in log['errors'][:12]: print('  ', e)
    return 1 if log['errors'] else 0

sys.exit(asyncio.run(main()))
