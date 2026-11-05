// The real-time relay of Det Store Blå (Ø16, docs/planer/sanntid-posisjoner.md S2; Jonas «kjør på» 03.11.2026: «like smooth som når
// man spiller call of duty»). The game sends its boat's position here over a WebSocket 5 times a second under way and once a second
// lying still (ui/10h-world.js rtSend), and the relay passes each report on, at once, to the players whose boats are in the same 10 km
// square or one of the eight round it. Nothing is kept: no database, no file, no log of who or where. pos_put every 15 s stays as it
// was for the AIS far away, the leaderboards and the games that cannot reach this.
//
// It runs behind Caddy on the same server (tools/server/Caddyfile: wss://detstorebla.no/rt -> 127.0.0.1:8787), started by systemd
// (tools/server/setup.sh: dsb-rt.service), uploaded by .github/workflows/deploy.yml. The secret is in /etc/dsb-rt.env (RT_SECRET, 64
// hex characters; two may be given, space between, while it is changed) and in the database's Vault (rt_secret), never in the repo.
//
// The way in (supabase/migrations/20261105160000_rt_ticket.sql rt_ticket): the game asks the database for a ticket and opens
// /rt?t=<ticket>. The ticket is «1.<id>.<guest>.<expiry>.<nonce>.<hmac>»: id is the player's public id (left(md5('dsb' || pid), 10),
// the same as pos_world gives, never the account), guest 1 for a guest, the expiry 60 s on, a random nonce, and the HMAC-SHA256 of
// the rest with the secret. The relay checks it without asking the database, takes each ticket once, and lets no one choose another
// id. A guest is let in and sees the others, but a guest's boat goes to no one, as in pos_world (supabase/migrations/20261007130000_seen.sql).
// There is no hiding a boat otherwise (Jonas 07.10.2026). The relay trusts the position no more than pos_put does (Ø6 funn 11): within
// ±5000 km, at most 60 knots, a known state, and no field of the player (no name, never haill or money: CLAUDE.md).
//
// The messages, binary, little-endian:
//   up    1  [1][st u8][kn×100 u16][x km×1e4 i32][y km×1e4 i32][heading rad×1e4 i16][sender's ms u32]       18 bytes
//   down  0  [0][version u8][0 u16][server ms f64]                                                     hello, 12 bytes
//   down  2  [2][n u16][server ms f64] n × [id 5 bytes][ms before u16][st u8][kn×100 u16][x i32][y i32][heading i16]   11 + 20n
//   down  3  [3][n u16] n × [id 5 bytes]                                                               boats gone
// st: 0 other, 1 sailing, 2 fishing, 3 port, 4 idle, 5 adrift, 6 tow, 7 ptow, 8 aground, 9 engine, 10 unmooring (ui/10h-world.js RT_ST).
// The time of a report is the relay's clock: the sender's own steady clock (performance.now) laid onto it by the smallest gap seen,
// so the network's jitter on the way up does not shake the boat; the receivers draw her half a second behind (snapshot interpolation).
//
// GET /stats (only straight on 127.0.0.1, not through Caddy) gives the counts for S3: connections, guests, squares, reports in and out.
import http from 'node:http';
import crypto from 'node:crypto';
import { WebSocketServer } from 'ws';

const ENV = process.env;
const PORT = +ENV.RT_PORT || 8787, HOST = ENV.RT_HOST || '127.0.0.1';
const KEYS = String(ENV.RT_SECRET || '').split(/[\s,]+/).filter(k => /^[0-9a-f]{64,}$/.test(k));
const ORIGINS = String(ENV.RT_ORIGINS || 'https://detstorebla.no,https://www.detstorebla.no').split(',').map(s => s.trim()).filter(Boolean);
const MAX_CONNS = +ENV.RT_MAX || 6000, PER_IP = +ENV.RT_PER_IP || 16;
const CELL = 10;             // km: the squares; a boat hears the boats in her own and the eight round it (10–20 km each way)
const FLUSH_MS = 100;        // the reports to one receiver go together, ten times a second
const PING_MS = 20000, IDLE_MS = 30000, AGE_MS = 12 * 3600e3;   // a quiet connection goes; every connection asks for a new ticket in 12 h
const RATE = 12, BURST = 24; // reports a second one connection may send (it sends 5 under way), and the burst
const QMAX = 512, BUFMAX = 256 * 1024;   // a receiver that cannot keep up misses reports; it never holds up the others
if (!KEYS.length){ console.error('rt: RT_SECRET is missing or not 64 hex characters (/etc/dsb-rt.env)'); process.exit(78); }   // 78: systemd does not restart it

const CONNS = new Set(), BYID = new Map(), CELLS = new Map(), IPS = new Map(), DIRTY = new Set(), USED = new Map();
const ST = {in:0, out:0, bytes:0, drop:0, rej:0, slow:0, t0:Date.now()};
// a connection that breaks the rules is told why and let go within a second, whether it answers or not (ws waits 30 s by itself)
function kick(c, code, why){ try { c.ws.close(code, why); } catch (e){} setTimeout(() => { try { c.ws.terminate(); } catch (e){} }, 1000).unref(); }
const cellKey = (cx, cy) => (cx + 1024) * 4096 + (cy + 1024);
const cellOf = (xr, yr) => cellKey(Math.floor(xr / 1e4 / CELL), Math.floor(yr / 1e4 / CELL));
function near(key, fn){
  const cx = Math.floor(key / 4096), cy = key % 4096;
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++){ const s = CELLS.get((cx + dx) * 4096 + cy + dy); if (s) for (const c of s) fn(c); }
}
function move(c, key){
  if (c.cell != null){ const s = CELLS.get(c.cell); if (s){ s.delete(c); if (!s.size) CELLS.delete(c.cell); } }
  c.cell = key; if (key == null) return;
  let s = CELLS.get(key); if (!s) CELLS.set(key, s = new Set()); s.add(c);
}

// the ticket (rt_ticket in the database): null unless it is well formed, signed with the secret, not run out, and not used before
function ticket(t, nowS){
  if (typeof t !== 'string' || t.length > 160) return null;
  const m = /^(1\.([0-9a-f]{10})\.([01])\.(\d{10})\.([0-9a-f]{16}))\.([0-9a-f]{64})$/.exec(t); if (!m) return null;
  const sig = Buffer.from(m[6], 'hex');
  if (!KEYS.some(k => crypto.timingSafeEqual(crypto.createHmac('sha256', k).update(m[1]).digest(), sig))) return null;
  const exp = +m[4]; if (exp < nowS || exp > nowS + 300) return null;
  if (USED.has(m[5])) return null; USED.set(m[5], exp);
  return {id:m[2], guest:m[3] === '1'};
}
// the player's address for the limit per address: Caddy is the only one that reaches 127.0.0.1, and it sets X-Forwarded-For afresh
function clientIp(req, sock){
  const ra = sock.remoteAddress || '', xf = String(req.headers['x-forwarded-for'] || '');
  return (/^(127\.|::1$|::ffff:127\.)/.test(ra) && xf ? xf.split(',').pop().trim() : ra) || '?';
}

function onMsg(c, d, bin){
  if (!bin || d.length !== 18 || d[0] !== 1){ if (++c.bad > 20) kick(c, 1008, 'bad'); return; }
  const now = Date.now();
  c.tok = Math.min(BURST, c.tok + (now - c.tokAt) * RATE / 1000); c.tokAt = now;
  if (c.tok < 1){ ST.drop++; if (++c.over > 200) kick(c, 1008, 'rate'); return; }
  c.tok -= 1; c.over = 0;
  const xr = d.readInt32LE(4), yr = d.readInt32LE(8);
  if (Math.abs(xr) > 5e7 || Math.abs(yr) > 5e7){ if (++c.bad > 20) kick(c, 1008, 'bad'); return; }   // as pos_put: within 5000 km
  const st = d[1] <= 15 ? d[1] : 0, v = Math.min(d.readUInt16LE(2), 6000), hd = Math.max(-31416, Math.min(31416, d.readInt16LE(12))), ts = d.readUInt32LE(14);
  // her time on this clock: the sender's steady clock plus the smallest gap seen (creeping up 2 ms a second, so a slower network is
  // followed), never in the future, never more than a second back, and always after her last report
  const o = now - ts;
  if (c.o === null || o < c.o || o - c.o > 2000) c.o = o; else c.o = Math.min(o, c.o + (now - c.oAt) * 0.002);
  c.oAt = now;
  let at = Math.max(now - 1000, Math.min(now, ts + c.o)); if (at <= c.at) at = Math.min(now, c.at + 1); c.at = at;
  const key = cellOf(xr, yr); if (key !== c.cell) move(c, key);
  ST.in++;
  if (c.guest) return;   // a guest's boat goes to no one (as pos_world)
  const e = {id:c.idb, at, st, v, xr, yr, hd};
  near(key, r => { if (r !== c && r.id !== c.id && r.q.length < QMAX){ r.q.push(e); DIRTY.add(r); } });
}

function flush(){
  const T = Date.now();
  for (const r of DIRTY){
    const q = r.q, g = r.gone; r.q = []; r.gone = [];
    if (r.ws.readyState !== 1) continue;
    if (r.ws.bufferedAmount > BUFMAX){ ST.slow++; continue; }
    if (q.length){
      const n = q.length, b = Buffer.allocUnsafe(11 + 20 * n); b[0] = 2; b.writeUInt16LE(n, 1); b.writeDoubleLE(T, 3);
      for (let i = 0; i < n; i++){ const e = q[i], o = 11 + 20 * i; e.id.copy(b, o); b.writeUInt16LE(Math.max(0, Math.min(65535, T - e.at)), o + 5); b[o + 7] = e.st;
        b.writeUInt16LE(e.v, o + 8); b.writeInt32LE(e.xr, o + 10); b.writeInt32LE(e.yr, o + 14); b.writeInt16LE(e.hd, o + 18); }
      r.ws.send(b); ST.out += n; ST.bytes += b.length;
    }
    if (g.length){ const b = Buffer.allocUnsafe(3 + 5 * g.length); b[0] = 3; b.writeUInt16LE(g.length, 1); g.forEach((id, i) => id.copy(b, 3 + 5 * i)); r.ws.send(b); }
  }
  DIRTY.clear();
}

function open(ws, who, ip){
  const old = BYID.get(who.id); if (old) kick(old, 4001, 'replaced');   // one page has the game at a time; the newest wins
  const now = Date.now();
  const c = {ws, id:who.id, idb:Buffer.from(who.id, 'hex'), guest:who.guest, ip, cell:null, q:[], gone:[], tok:BURST, tokAt:now, over:0, bad:0, o:null, oAt:now, at:0, seen:now, born:now, alive:true};
  CONNS.add(c); BYID.set(c.id, c); IPS.set(ip, (IPS.get(ip) || 0) + 1);
  ws.on('message', (d, bin) => { c.seen = Date.now(); onMsg(c, d, bin); });
  ws.on('pong', () => { c.alive = true; });
  ws.on('close', () => drop(c));
  ws.on('error', () => {});
  const b = Buffer.alloc(12); b[1] = 1; b.writeDoubleLE(now, 4); ws.send(b);   // hello, with the clock
}
function drop(c){
  if (!CONNS.delete(c)) return;
  const n = (IPS.get(c.ip) || 1) - 1; if (n > 0) IPS.set(c.ip, n); else IPS.delete(c.ip);
  const mine = BYID.get(c.id) === c; if (mine) BYID.delete(c.id);
  // the boats round her are told she is gone, unless the same player goes on from another page
  if (mine && !c.guest && c.cell != null) near(c.cell, r => { if (r !== c && r.id !== c.id){ r.gone.push(c.idb); DIRTY.add(r); } });
  move(c, null); DIRTY.delete(c);
}

const server = http.createServer((req, res) => {
  if (req.url === '/stats' && !req.headers['x-forwarded-for'] && /^(127\.|::1$|::ffff:127\.)/.test(req.socket.remoteAddress || '')){
    let guests = 0; for (const c of CONNS) if (c.guest) guests++;
    res.writeHead(200, {'Content-Type':'application/json', 'Cache-Control':'no-store'});
    return res.end(JSON.stringify({conns:CONNS.size, guests, cells:CELLS.size, in:ST.in, out:ST.out, bytes:ST.bytes, drop:ST.drop, rej:ST.rej, slow:ST.slow, up_s:Math.round((Date.now() - ST.t0) / 1000)}));
  }
  res.writeHead(404, {'Content-Type':'text/plain'}); res.end('');
});
const wss = new WebSocketServer({noServer:true, maxPayload:64, perMessageDeflate:false, clientTracking:false});
server.on('upgrade', (req, sock, head) => {
  sock.on('error', () => {});
  const deny = (code, msg) => { ST.rej++; sock.end('HTTP/1.1 ' + code + ' ' + msg + '\r\nConnection: close\r\nContent-Length: 0\r\n\r\n'); };
  let u; try { u = new URL(req.url, 'http://rt'); } catch (e){ return deny(400, 'Bad Request'); }
  if (u.pathname !== '/rt') return deny(404, 'Not Found');
  if (!ORIGINS.includes('*') && !ORIGINS.includes(String(req.headers.origin || ''))) return deny(403, 'Forbidden');
  if (CONNS.size >= MAX_CONNS) return deny(503, 'Service Unavailable');
  const ip = clientIp(req, sock); if ((IPS.get(ip) || 0) >= PER_IP) return deny(429, 'Too Many Requests');
  const who = ticket(u.searchParams.get('t'), Math.floor(Date.now() / 1000)); if (!who) return deny(401, 'Unauthorized');
  wss.handleUpgrade(req, sock, head, ws => open(ws, who, ip));
});

setInterval(flush, FLUSH_MS);
setInterval(() => {
  const now = Date.now();
  for (const c of CONNS){
    if (!c.alive || now - c.seen > IDLE_MS){ c.ws.terminate(); continue; }
    if (now - c.born > AGE_MS){ kick(c, 4002, 'renew'); continue; }
    c.alive = false; c.ws.ping();
  }
  const s = now / 1000; for (const [n, e] of USED) if (e < s) USED.delete(n);
}, PING_MS);
// a line in the journal every ten minutes: counts only, never who or where
setInterval(() => console.log('rt: ' + CONNS.size + ' connections, ' + CELLS.size + ' squares, ' + ST.in + ' in, ' + ST.out + ' out, ' + ST.drop + ' dropped, ' + ST.rej + ' refused'), 600000);
const stop = () => { for (const c of CONNS) c.ws.close(1012, 'restart'); server.close(); setTimeout(() => process.exit(0), 500); };
process.on('SIGTERM', stop); process.on('SIGINT', stop);
server.listen(PORT, HOST, () => console.log('rt: listening on ' + HOST + ':' + PORT + ', origins ' + ORIGINS.join(' ') + ', ' + KEYS.length + ' key(s)'));
