"""The real-time relay (Ø16, S2 in docs/planer/sanntid-posisjoner.md; tools/server/rt/server.mjs and the client in ui/10h-world.js)
on this machine, with the game against stand-ins for WorkOS and Supabase (as cloudtest.py) and small WebSocket clients in Python.

- The way in: a good ticket opens the connection, the same ticket again, a wrong signature, one run out, a wrong origin and a wrong
  path do not. The squares: a boat hears her own 10 km square and the eight round it, not beyond.
- The game (one page) sees a boat that sails a circle at 8 knots, sent 5 times a second: drawn half a second behind, how far from
  where she really was, and how even her speed is from frame to frame (the smoothness Jonas asked for).
- The game's own reports: once a second lying still, 5 times a second under way, the place right, and nothing but place, heading,
  speed, state and time.
- A guest's boat goes to no one, but the guest sees the others; the same player twice: the newest page wins; a flood and bad frames
  are dropped and closed.
- Without the relay: when a boat leaves, when the page is hidden, when the relay restarts, and without rt_ticket (404), the game goes
  back to the 15 s reports with no jump and comes back when it can.
Needs Node and the relay's ws (npm ci in tools/server/rt; run here if it is missing). Prints OK or FEIL."""
from _env import GAME, BASE, boot
import asyncio, base64, hashlib, hmac, json, math, os, secrets, select, socket, struct, subprocess, sys, threading, time, urllib.request
from playwright.async_api import async_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RTDIR = os.path.join(ROOT, 'tools', 'server', 'rt')
KEY = secrets.token_hex(32)
ORIGIN = BASE.rstrip('/')
NM, RATE = 1.852, 6


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:600]) if extra != '' else ''))


def ticket(pid, g=0, exp=None, nonce=None, key=KEY):
    pay = '1.%s.%d.%d.%s' % (pid, g, exp or int(time.time()) + 60, nonce or secrets.token_hex(8))
    return pay + '.' + hmac.new(key.encode(), pay.encode(), hashlib.sha256).hexdigest()


def free_port():
    s = socket.socket(); s.bind(('127.0.0.1', 0)); p = s.getsockname()[1]; s.close(); return p


PORT = free_port()
RTURL = 'ws://127.0.0.1:%d/rt' % PORT


def relay_start():
    env = dict(os.environ, RT_SECRET=KEY, RT_PORT=str(PORT), RT_HOST='127.0.0.1', RT_ORIGINS=ORIGIN)
    p = subprocess.Popen(['node', os.path.join(RTDIR, 'server.mjs')], env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    for _ in range(100):
        try: urllib.request.urlopen('http://127.0.0.1:%d/stats' % PORT, timeout=1).read(); return p
        except Exception: time.sleep(0.1)
    p.kill(); print('FEIL the relay did not start', p.stdout.read()[-500:]); sys.exit(0)


def stats():
    return json.loads(urllib.request.urlopen('http://127.0.0.1:%d/stats' % PORT, timeout=2).read())


class WS:
    """A small WebSocket client: the handshake, binary frames up (masked), frames down; a thread reads, answers pings and keeps what came."""
    def __init__(self, tk, origin=ORIGIN, path='/rt'):
        self.sock = socket.create_connection(('127.0.0.1', PORT), timeout=5); self.buf = b''; self.got = []; self.close_code = None; self.lock = threading.Lock()
        req = ('GET %s?t=%s HTTP/1.1\r\nHost: 127.0.0.1:%d\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: %s\r\n'
               'Sec-WebSocket-Version: 13\r\nOrigin: %s\r\n\r\n') % (path, tk, PORT, base64.b64encode(os.urandom(16)).decode(), origin)
        self.sock.sendall(req.encode())
        while b'\r\n\r\n' not in self.buf:
            c = self.sock.recv(4096)
            if not c: break
            self.buf += c
        head, _, self.buf = self.buf.partition(b'\r\n\r\n')
        self.status = int(head.split()[1]) if head.startswith(b'HTTP/') else 0
        if self.status == 101: threading.Thread(target=self._read, daemon=True).start()
        else: self.sock.close()

    def send(self, data, op=2):
        n = len(data); mask = os.urandom(4)
        hdr = bytes([0x80 | op]) + (bytes([0x80 | n]) if n < 126 else bytes([0x80 | 126]) + struct.pack('>H', n))
        try:
            with self.lock: self.sock.sendall(hdr + mask + bytes(b ^ mask[i % 4] for i, b in enumerate(data)))
        except OSError: pass

    def _read(self):
        while self.close_code is None:
            try:
                r, _, _ = select.select([self.sock], [], [], 0.2)
                if r:
                    c = self.sock.recv(65536)
                    if not c: self.close_code = self.close_code or 1006; break
                    self.buf += c
            except OSError: self.close_code = self.close_code or 1006; break
            while len(self.buf) >= 2:
                op, n, o = self.buf[0] & 15, self.buf[1] & 127, 2
                if n == 126:
                    if len(self.buf) < 4: break
                    n = struct.unpack('>H', self.buf[2:4])[0]; o = 4
                if len(self.buf) < o + n: break
                pl, self.buf = self.buf[o:o + n], self.buf[o + n:]
                if op == 9: self.send(pl, 10)
                elif op == 8:   # answered, as a browser does
                    self.close_code = struct.unpack('>H', pl[:2])[0] if len(pl) >= 2 else 1005; self.send(pl[:2], 8)
                    try: self.sock.close()
                    except OSError: pass
                    break
                elif op == 2: self.got.append((time.time(), pl))

    def close(self):
        self.send(struct.pack('>H', 1000), 8); time.sleep(0.05)
        try: self.sock.close()
        except OSError: pass
        self.close_code = self.close_code or 1000

    def entries(self):
        """The boats' reports that came: (id, st, kn, x, y, heading, ms before, server ms)."""
        out = []
        for _, pl in self.got:
            if pl[0] != 2: continue
            n, T = struct.unpack('<Hd', pl[1:11])
            for i in range(n):
                e = pl[11 + 20 * i: 31 + 20 * i]; st, = struct.unpack('<B', e[7:8]); v, x, y, hd = struct.unpack('<Hiih', e[8:20]); dt, = struct.unpack('<H', e[5:7])
                out.append((e[:5].hex(), st, v / 100, x / 1e4, y / 1e4, hd / 1e4, dt, T))
        return out


def frame(st, kn, x, y, hd):
    return struct.pack('<BBHiihI', 1, st, int(round(kn * 100)), int(round(x * 1e4)), int(round(y * 1e4)), int(round(math.atan2(math.sin(hd), math.cos(hd)) * 1e4)), int(time.monotonic() * 1000) & 0xffffffff)


class Sender(threading.Thread):
    """A boat in Python: pose(t) gives (st, kn, x, y, heading) at wall time t; sent hz times a second until stop."""
    def __init__(self, ws, pose, hz=5):
        super().__init__(daemon=True); self.ws, self.pose, self.hz, self.run_ = ws, pose, hz, True
    def run(self):
        while self.run_ and self.ws.close_code is None:
            self.ws.send(frame(*self.pose(time.time()))); time.sleep(1 / self.hz)


CFG = {'hosts': ['127.0.0.1', 'localhost'], 'supabaseUrl': 'https://sb.test', 'supabaseAnon': 'anon_test', 'workosClientId': 'client_test'}
STUB = """window.DSB_CLOUD = %s; window.DSB_RT = %s;
window.DSB_AUTHKIT = {createClient: async () => ({getUser: () => ({id:'user_rt', email:'rt@test.no'}), getAccessToken: async () => 'tok_test', signIn: () => {}, signUp: () => {}, signOut: () => {}})};""" % (json.dumps(CFG), json.dumps(RTURL))


async def main():
    if not os.path.exists(os.path.join(RTDIR, 'node_modules', 'ws')):
        r = subprocess.run(['npm', 'ci', '--omit=dev', '--no-audit', '--no-fund'], cwd=RTDIR, capture_output=True, text=True)
        if r.returncode: print('FEIL npm ci in tools/server/rt', r.stderr[-400:]); return
    relay = relay_start()
    try:
        # ---- the way in ----
        good = ticket('eeeeeeeeee'); a = WS(good); b = WS(good)
        t1 = ticket('eeeeeeeeef'); bad = t1[:-1] + ('0' if t1[-1] != '0' else '1')
        wrong = ticket('eeeeeeeeef', key=secrets.token_hex(32))
        codes = {'good': a.status, 'again': b.status, 'wrongkey': WS(wrong).status, 'badsig': WS(bad).status, 'old': WS(ticket('eeeeeeeeef', exp=int(time.time()) - 5)).status,
                 'far': WS(ticket('eeeeeeeeef', exp=int(time.time()) + 3600)).status, 'origin': WS(ticket('eeeeeeeeef'), origin='https://evil.test').status,
                 'path': WS(ticket('eeeeeeeeef'), path='/other').status, 'none': WS('').status}
        time.sleep(0.2); hello = [pl for _, pl in a.got if pl[0] == 0]; a.close()
        T0 = struct.unpack('<d', hello[0][4:12])[0] if hello else 0
        check(codes == {'good': 101, 'again': 401, 'wrongkey': 401, 'badsig': 401, 'old': 401, 'far': 401, 'origin': 403, 'path': 404, 'none': 401} and hello and abs(T0 - time.time() * 1000) < 2000,
              'the way in: a good ticket opens and is greeted with the clock; the same ticket again, another key, a wrong signature, one run out, one too far ahead, a wrong origin, a wrong path and none are refused', codes)

        # ---- the squares: a boat hears her own 10 km square and the eight round it, not beyond; the same up north (Svalbard: y below 0) ----
        A1, A2, A3 = WS(ticket('a1a1a1a1a1')), WS(ticket('a2a2a2a2a2')), WS(ticket('a3a3a3a3a3'))
        at = {A1: (505.0, -655.0), A2: (512.0, -648.0), A3: (531.0, -655.0)}   # A2 in the square next to A1's, A3 two squares on from A2's
        for _ in range(8):   # 1.6 s: A1 and A2 are 9.9 km apart, so they hear each other once a second (valg 28), not five times
            for w, (x, y) in at.items(): w.send(frame(1, 5, x, y, 0))
            time.sleep(0.2)
        time.sleep(0.3); heard = {n: sorted({e[0] for e in w.entries()}) for n, w in (('a1', A1), ('a2', A2), ('a3', A3))}
        for w in at: w.close()
        check(heard == {'a1': ['a2a2a2a2a2'], 'a2': ['a1a1a1a1a1'], 'a3': []}, 'a boat hears the boats in her own 10 km square and the eight round it, not two squares on; also north of the frame (y below 0)', heard)

        # ---- the far ones thinned (valg 28 A, 10.11.2026): a boat under way more than 5 km off is passed on once a second, not five
        # times; within 5 km every report; a boat lying still (once a second) reaches the far ones every time ----
        S5, S1, RN, RF = WS(ticket('b5b5b5b5b5')), WS(ticket('b1b1b1b1b1')), WS(ticket('bcbcbcbcbc')), WS(ticket('bfbfbfbfbf'))
        pos = {RN: (604.6, 700.0), RF: (605.4, 700.0)}   # S5 and S1 at (600, 700): RN 4.6 km off, RF 5.4 km off, both in the same 10 km square
        for w, (x, y) in pos.items(): w.send(frame(4, 0, x, y, 0))
        time.sleep(0.3)
        t9 = time.time() + 3.0; k = 0
        while time.time() < t9:
            S5.send(frame(1, 8, 600.0 + k * 0.001, 700.0, 0))
            if k % 5 == 0:
                S1.send(frame(4, 0, 600.0, 700.0, 0))
                for w, (x, y) in pos.items(): w.send(frame(4, 0, x, y, 0))
            k += 1; time.sleep(0.2)
        time.sleep(0.4)
        cnt = {n: {s: sum(1 for e in w.entries() if e[0] == s) for s in ('b5b5b5b5b5', 'b1b1b1b1b1')} for n, w in (('near', RN), ('far', RF))}
        for w in (S5, S1, RN, RF): w.close()
        sent5, sent1 = k, (k + 4) // 5
        check(cnt['near']['b5b5b5b5b5'] >= sent5 - 2 and 2 <= cnt['far']['b5b5b5b5b5'] <= 4 and cnt['far']['b1b1b1b1b1'] >= sent1 - 1 and cnt['near']['b1b1b1b1b1'] >= sent1 - 1,
              'the far ones thinned: a boat under way at 5 a second reaches a boat 4.6 km off every time and one 5.4 km off once a second; a boat lying still reaches both every time',
              {'sent': {'under way': sent5, 'still': sent1}, 'heard': cnt})

        async with async_playwright() as p:
            br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
            ctx = await br.new_context(viewport={'width': 1100, 'height': 800}); pg = await ctx.new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.add_init_script(STUB)
            W = {'P': None, 'n_ticket': 0}; replies = {'tm_hello': {'consent': True, 'owned': []}, 'save_get': 'null', 'save_put2': {'ok': True, 'saved_at': '2026-11-05T10:00:00+00:00'}}

            def peer_list():
                f = W['P']
                if not f: return []
                st, kn, x, y, hd = f(time.time())
                return [{'id': 'aaaaaaaaaa', 'boat': 'Testbris', 'vtype': 'skiff', 'x': x, 'y': y, 'hd': hd % (2 * math.pi), 'v': kn, 'st': 'sailing', 'age': 0, 'user': '', 'fs': 0}]

            async def handle(route):
                req = route.request; fn = req.url.rsplit('/', 1)[-1]
                if fn == 'rt_ticket':
                    W['n_ticket'] += 1
                    if replies.get('rt_ticket') == 404: return await route.fulfill(status=404, content_type='application/json', body='{"code":"PGRST202"}')
                    return await route.fulfill(status=200, content_type='application/json', body=json.dumps(ticket('bbbbbbbbbb')))
                if fn in ('pos_world', 'pos_near'): return await route.fulfill(status=200, content_type='application/json', body=json.dumps(peer_list()))
                r = replies.get(fn, 404 if fn in ('save_put3', 'save_head', 'save_put4', 'save_claim', 'save_beat') else '')
                if r == 404: return await route.fulfill(status=404, content_type='application/json', body='{"code":"PGRST202"}')
                await route.fulfill(status=200, content_type='application/json', body=r if isinstance(r, str) else json.dumps(r))
            await pg.route('https://sb.test/**', handle)
            await boot(pg)
            await pg.wait_for_function("typeof RT !== 'undefined' && RT.st === 'open'", timeout=30000)
            me = await pg.evaluate("(() => { const L = livePose(); return {x:L.p.x, y:L.p.y, st:S.boat.status}; })()")

            # ---- a boat sailing a circle at 8 knots, 5 reports a second; the game draws her half a second behind ----
            R0, SPD = 0.3, 8 * NM * RATE / 3600   # km, km per real second
            W0, C, TH0, T_0 = SPD / R0, (me['x'] + 0.6, me['y'] + 0.4), 0.0, time.time()
            def circ(t):
                th = TH0 + W0 * (t - T_0); x, y = C[0] + R0 * math.cos(th), C[1] + R0 * math.sin(th)
                return (1, 8.0, x, y, math.atan2(-math.sin(th), -math.cos(th)))   # heading: atan2(dx, -dy) along the circle
            W['P'] = circ
            P = WS(ticket('aaaaaaaaaa')); ps = Sender(P, circ); ps.start()
            Rr = WS(ticket('dddddddddd')); rs = Sender(Rr, lambda t: (3, 0, me['x'] + 0.2, me['y'], 0), hz=1); rs.start()
            G = WS(ticket('9999999999', g=1)); gs = Sender(G, lambda t: (1, 6, me['x'] + 0.3, me['y'] + 0.1, 1.0), hz=5); gs.start()
            await pg.wait_for_function("RT.peers.has('aaaaaaaaaa') && PEERS.some(q => q.id === 'aaaaaaaaaa') && rtPose('aaaaaaaaaa')", timeout=30000)
            SAMPLE = """ms => new Promise(res => { const out = [], t1 = performance.now() + ms;
              (function f(){ const n = peerStates().find(q => q.id === 'paaaaaaaaaa'); if (n) out.push([Date.now(), performance.now(), n.p.x, n.p.y]);
                if (performance.now() < t1) requestAnimationFrame(f); else res(out); })(); })"""
            # (her track glides onto the relay's over RT_GLIDE from the first frame that shows her: that is looked at when she leaves, below)
            wu = await pg.evaluate(SAMPLE, 2500); sm = await pg.evaluate(SAMPLE, 8000)
            def err_at(lag):
                return sorted(math.hypot(x - circ(d / 1000 - lag)[2], y - circ(d / 1000 - lag)[3]) * 1000 for d, _, x, y in sm)
            e5 = err_at(0.5); best = min((sum(err_at(l / 1000)) / len(sm), l) for l in range(400, 701, 5))
            sp = [math.hypot(sm[i][2] - sm[i - 1][2], sm[i][3] - sm[i - 1][3]) / ((sm[i][1] - sm[i - 1][1]) / 1000) for i in range(1, len(sm)) if sm[i][1] - sm[i - 1][1] > 4]
            dev = sorted(abs(v - SPD) / SPD for v in sp)
            q = lambda L, f: L[min(len(L) - 1, int(len(L) * f))] if L else None
            M = {'frames': len(sm), 'err_med_m': round(q(e5, 0.5), 2), 'err_p99_m': round(q(e5, 0.99), 2), 'err_max_m': round(e5[-1], 2), 'lag_s': best[1] / 1000,
                 'speed_dev_med': round(q(dev, 0.5), 3), 'speed_dev_p95': round(q(dev, 0.95), 3), 'speed_dev_max': round(dev[-1], 3), 'true_m_s': round(SPD * 1000, 1)}
            # onto the relay from the 15 s track: half a second back, glided over RT_GLIDE (2 s), so she slows for a moment and never jumps
            wst = [math.hypot(wu[i][2] - wu[i - 1][2], wu[i][3] - wu[i - 1][3]) / ((wu[i][1] - wu[i - 1][1]) / 1000) for i in range(1, len(wu)) if wu[i][1] - wu[i - 1][1] > 4]
            M['glide_speed_min_max'] = [round(min(wst) / SPD, 2), round(max(wst) / SPD, 2)] if wst else None
            check(wst and 0.5 < min(wst) / SPD and max(wst) / SPD < 1.2, 'she glides onto the relay from the 15 s track over 2 s, slowing for a moment, with no jump', M['glide_speed_min_max'])
            check(len(sm) > 100 and M['err_med_m'] < 1.5 and M['err_p99_m'] < 4 and 0.45 <= M['lag_s'] <= 0.6 and M['speed_dev_p95'] < 0.08,
                  'a boat sailing a circle at 8 knots with 5 reports a second is drawn half a second behind, within a metre or two of where she was, at an even speed from frame to frame', M)

            # ---- the game's own reports, as another player sees them: 1 a second in port, 5 a second under way, right place, nothing more ----
            n0 = len(Rr.entries()); await pg.wait_for_timeout(3000); still = [e for e in Rr.entries()[n0:] if e[0] == 'bbbbbbbbbb']
            await pg.evaluate("""(() => { window.__lp = livePose; const p0 = livePose().p, t0 = performance.now();
              window.livePose = () => ({p:{x:p0.x + (performance.now() - t0) / 1000 * 0.0247, y:p0.y}, hd:Math.PI / 2, frac:0, idx:0}); })()""")
            await pg.wait_for_timeout(500); n1 = len(Rr.entries()); await pg.wait_for_timeout(3000)
            moving = [e for e in Rr.entries()[n1:] if e[0] == 'bbbbbbbbbb']; now_p = await pg.evaluate("(() => { const L = livePose(); return [L.p.x, L.p.y]; })()")
            await pg.evaluate("window.livePose = window.__lp")
            sizes = await pg.evaluate("RT.up")
            ok_still = still and all(abs(e[3] - me['x']) < 2e-4 and abs(e[4] - me['y']) < 2e-4 and e[1] == 3 and e[2] == 0 for e in still)
            last = moving[-1] if moving else None
            check(2 <= len(still) <= 4 and ok_still and 13 <= len(moving) <= 17 and last and abs(last[3] - now_p[0]) < 0.01 and abs(last[5] - math.pi / 2) < 1e-3,
                  "the game's own boat goes to the others once a second lying still (in port, the berth's place to 0.1 m) and 5 times a second under way, each report the place, heading, speed, state and time only (20 bytes a boat)",
                  {'still': len(still), 'moving': len(moving), 'up': sizes, 'last': last[:6] if last else None, 'now': now_p})

            # ---- a guest's boat goes to no one, but the guest sees the others ----
            gid = [e for e in Rr.entries() if e[0] == '9999999999']; g_sees = sum(1 for e in G.entries() if e[0] == 'aaaaaaaaaa')
            b_sees_g = await pg.evaluate("RT.peers.has('9999999999')")
            check(not gid and g_sees > 10 and not b_sees_g, "a guest's boat goes to no one (as pos_world), but the guest sees the others", {'rGotGuest': len(gid), 'guestSaw': g_sees, 'pageSawGuest': b_sees_g})

            # ---- the boat leaves: the game goes back to the 15 s track at once, with no jump ----
            LEAVE = """async () => { const out = []; const step = () => { const n = peerStates().find(q => q.id === 'paaaaaaaaaa'); if (n) out.push([performance.now(), n.p.x, n.p.y, !!(PTRK.get('aaaaaaaaaa') || {}).rt]); };
              for (let i = 0; i < 90; i++){ step(); await new Promise(r => requestAnimationFrame(r)); } return out; }"""
            fut = asyncio.ensure_future(pg.evaluate(LEAVE)); await asyncio.sleep(0.5); ps.run_ = False; P.close()
            lv = await fut
            steps = [math.hypot(lv[i][1] - lv[i - 1][1], lv[i][2] - lv[i - 1][2]) * 1000 for i in range(1, len(lv))]
            norm = sorted(math.hypot(sm[i][2] - sm[i - 1][2], sm[i][3] - sm[i - 1][3]) * 1000 for i in range(1, len(sm)))
            flip = next((i for i in range(1, len(lv)) if lv[i - 1][3] and not lv[i][3]), None)
            check(flip is not None and max(steps) < max(2.0, 3 * norm[int(len(norm) * 0.95)]), 'when the boat leaves the relay, the game goes back to the 15 s track at once and she glides on, with no jump',
                  {'back_at_frame': flip, 'max_step_m': round(max(steps), 2), 'p95_step_relay_m': round(norm[int(len(norm) * 0.95)], 2)})

            # ---- the same player twice: the newest wins ----
            R2 = WS(ticket('dddddddddd')); time.sleep(0.5)
            check(R2.status == 101 and Rr.close_code == 4001, 'the same player on a second page: the newest has the relay, the older is told (4001)', {'new': R2.status, 'old': Rr.close_code})
            rs.run_ = False; R2.close(); gs.run_ = False; G.close()

            # ---- a flood and bad frames are dropped and closed ----
            d0 = stats()['drop']; F = WS(ticket('ffffffffff'))
            for _ in range(300): F.send(frame(1, 5, me['x'], me['y'], 0))
            time.sleep(0.5); s1 = stats(); B = WS(ticket('fffffffff0'))
            for _ in range(25): B.send(b'\x01' * 10)
            time.sleep(0.5); H = WS(ticket('fffffffff1')); H.send(b'\x01' * 100); time.sleep(0.5)
            check(F.close_code == 1008 and s1['drop'] - d0 >= 200 and B.close_code == 1008 and H.close_code == 1009,
                  'a flood is dropped above 12 a second and closed; bad frames and a frame too big are closed', {'flood': F.close_code, 'dropped': s1['drop'] - d0, 'bad': B.close_code, 'big': H.close_code})

            # ---- the page hidden lets go; seen again it comes back ----
            await pg.evaluate("(() => { Object.defineProperty(document, 'hidden', {configurable:true, get:() => true}); document.dispatchEvent(new Event('visibilitychange')); })()")
            await pg.wait_for_timeout(600); hid = await pg.evaluate("({ws:!!RT.ws, st:RT.st})"); c_hid = stats()['conns']
            await pg.evaluate("(() => { Object.defineProperty(document, 'hidden', {configurable:true, get:() => false}); document.dispatchEvent(new Event('visibilitychange')); })()")
            await pg.wait_for_function("RT.st === 'open'", timeout=15000)
            check(not hid['ws'] and c_hid == 0, 'a hidden page lets go of the relay at once, and takes it again when it is seen', {'hidden': hid, 'conns': c_hid})

            # ---- the relay restarts: the game waits and comes back by itself; meanwhile the 15 s reports go on ----
            relay.terminate(); relay.wait(5)
            await pg.wait_for_function("RT.st !== 'open'", timeout=10000)
            calls0 = await pg.evaluate("WORLDP.last"); await pg.evaluate("worldTick()"); await pg.wait_for_timeout(500); calls1 = await pg.evaluate("WORLDP.last")
            relay = relay_start(); t0 = time.time()
            await pg.wait_for_function("RT.st === 'open'", timeout=30000)
            check(calls1 > calls0, 'the relay restarts: the game keeps the 15 s reports meanwhile and is back on the relay by itself', {'back_s': round(time.time() - t0, 1)})

            # ---- a database without rt_ticket (404): the game stops asking and plays on ----
            replies['rt_ticket'] = 404; n_t = W['n_ticket']
            await pg.evaluate("rtClose(1000, 1)")
            await pg.wait_for_function("RT.noFn === true", timeout=10000); await pg.wait_for_timeout(2500)
            nf = await pg.evaluate("({ws:!!RT.ws, st:RT.st, ready:SIMREADY})")
            check(not nf['ws'] and W['n_ticket'] == n_t + 1 and nf['ready'], 'a database without rt_ticket (404) is asked once and not again; the game plays on with the 15 s reports', {'state': nf, 'asked': W['n_ticket'] - n_t})
            print('sidefeil:', errs)
            await br.close()
    finally:
        relay.terminate()
        try: relay.wait(5)
        except Exception: relay.kill()


asyncio.run(main())
