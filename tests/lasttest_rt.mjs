// The load test of the real-time relay (Ø16 S3, docs/planer/sanntid-posisjoner.md; steg 47, Jonas 07.11.2026: «vi skalerer ned testen
// til 500 brukere til å starte med, det vil sannsynligvis gi oss en pekepinn på status»). Run by hand, never from run.py:
//
//   node tests/lasttest_rt.mjs                      # the relay on this machine (tools/server/rt/server.mjs with a test secret)
//   node tests/lasttest_rt.mjs --n 2000 --secs 120  # more boats, shorter
//   RT_SECRET=<hex> node tests/lasttest_rt.mjs --url ws://127.0.0.1:8787/rt   # a relay that is already running, with its secret
//                                                     (on the server itself: RT_PER_IP must then be raised for the run, see below)
//
// N clients (default 500) open a WebSocket each with a ticket of the relay's own form (1.<id>.0.<expiry>.<nonce>.<hmac>, as rt_ticket
// makes it), half of them in one tight cluster on the Lofoten field in Vestfjorden and the rest spread along the coast from Kristiansand
// to Vardø. A share of them sail (8 knots, as fast as the game shows it, 6×) and send 5 times a second; the rest lie still and send once
// a second, as the game does (ui/10h-world.js rtSend). For --secs seconds (default 600) it measures:
//   - the delay from the moment a report is sent to the moment each boat round her has it (a sequence number in the lowest bits of x and
//     y, 3 m at most, and the send time in shared memory, so it needs no clock on the relay);
//   - reports up and down a second, bytes down, and the reports lost on the way (gaps in each sender's sequence at each receiver;
//     beyond 5 km a boat under way is expected once a second, since the relay thins them on purpose: valg 28),
//     which is where the cap shows (512 reports a receiver each tenth of a second, QMAX in server.mjs) and a receiver that is too slow;
//   - for a relay it started itself: its CPU (one core = 100 %) and memory every second, and GET /stats.
// The clients run in worker threads (--workers, default 3 of the machine's cores), so they are not what holds the relay back; the
// relay is one Node process, as on the server. The result goes to tests/out/lasttest/rt-<time>.json and a summary to the terminal.
//
// The relay on this machine gets RT_PER_IP raised, because every client comes from 127.0.0.1; on the server, through Caddy, every
// player has an address of her own and the limit of 16 does not bite. The test from the cloud session cannot reach the server's relay:
// the network proxy there does not carry WebSocket upgrades (/root/.ccr/README.md), and all clients would have come from one address.
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { spawn, execSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.dirname(HERE), RTDIR = path.join(ROOT, 'tools', 'server', 'rt');
const SEQ = 1024;   // send times kept per boat (10 bits: 5 in x, 5 in y)


function args(){
  const a = process.argv.slice(2), o = {n:500, secs:600, cluster:0.5, moving:0.6, workers:3, url:'', ramp:20, warm:10, seed:47};
  for (let i = 0; i < a.length; i++){ const k = a[i].replace(/^--/, ''); if (k in o) o[k] = typeof o[k] === 'number' ? +a[++i] : a[++i]; }
  return o;
}
// a small steady random, so two runs place the boats the same
function rng(seed){ let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
// the game's frame (core/00-proj.js natP): km, x = (E + 250 km), y = 8050 km − N, UTM zone 33; a spherical transverse Mercator is near
// enough here (a few hundred metres), since only the squares of 10 km count
function natP(lat, lon){
  const R = 6371000, k0 = 0.9996, f = lat * Math.PI / 180, l = (lon - 15) * Math.PI / 180;
  const E = 500000 + k0 * R * Math.atanh(Math.cos(f) * Math.sin(l)), N = k0 * R * Math.atan2(Math.tan(f), Math.cos(l));
  return {x:(E + 250000) / 1000, y:(8050000 - N) / 1000};
}
// the coast the spread half lies along: harbours from south to north (lat, lon), each boat within 12 km of one
const COAST = [[58.14, 8.00], [58.85, 5.73], [59.41, 5.27], [60.39, 5.32], [61.60, 5.03], [62.47, 6.15], [62.74, 7.16], [63.11, 7.73],
  [63.43, 10.39], [64.86, 11.24], [65.47, 12.21], [66.31, 12.97], [67.28, 14.40], [68.43, 17.43], [68.79, 16.54], [69.23, 17.98],
  [69.65, 18.96], [70.03, 20.97], [70.66, 23.68], [70.98, 25.97], [70.86, 29.10], [70.37, 31.11]];
const LOFOTEN = [68.13, 14.35];   // Vestfjorden off Henningsvær and Stamsund, where Lofotfisket gathers the fleet

function boats(o){
  const r = rng(o.seed), L = natP(...LOFOTEN), B = [];
  for (let i = 0; i < o.n; i++){
    const inC = i < Math.round(o.n * o.cluster);
    let c, rad;
    if (inC){ const a = r() * 2 * Math.PI, d = Math.sqrt(r()); c = {x:L.x + Math.cos(a) * d * 15, y:L.y + Math.sin(a) * d * 8}; rad = 15; }   // 30 × 16 km
    else { const h = natP(...COAST[Math.floor(r() * COAST.length)]), a = r() * 2 * Math.PI, d = Math.sqrt(r()) * 12; c = {x:h.x + Math.cos(a) * d, y:h.y + Math.sin(a) * d}; rad = 6; }
    B.push({i, id:'f0' + i.toString(16).padStart(8, '0'), cluster:inC, moving:r() < o.moving, x:c.x, y:c.y, cx:c.x, cy:c.y, rad, hd:r() * 2 * Math.PI, turn:(r() - 0.5) * 0.02});
  }
  return B;
}
const ticket = (key, id) => {
  const pay = '1.' + id + '.0.' + (Math.floor(Date.now() / 1000) + 240) + '.' + crypto.randomBytes(8).toString('hex');
  return pay + '.' + crypto.createHmac('sha256', key).update(pay).digest('hex');
};
const freePort = () => new Promise(res => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
const pct = (h, q) => { let tot = 0; for (const v of h) tot += v; if (!tot) return null; let k = 0; const want = tot * q; for (let i = 0; i < h.length; i++){ k += h[i]; if (k >= want) return i; } return h.length - 1; };

async function main(){
  const o = args(), t0 = Date.now();
  if (!fs.existsSync(path.join(RTDIR, 'node_modules', 'ws'))) execSync('npm ci --no-audit --no-fund', {cwd:RTDIR, stdio:'inherit'});
  let url = o.url, key = process.env.RT_SECRET || '', relay = null, statsUrl = '';
  if (!url){
    key = crypto.randomBytes(32).toString('hex');
    const port = await freePort();
    relay = spawn(process.execPath, [path.join(RTDIR, 'server.mjs')], {cwd:RTDIR, stdio:['ignore', 'pipe', 'pipe'],
      env:{...process.env, RT_SECRET:key, RT_PORT:String(port), RT_HOST:'127.0.0.1', RT_ORIGINS:'https://detstorebla.no', RT_PER_IP:String(o.n + 100), RT_MAX:String(Math.max(6000, o.n + 100))}});
    relay.stderr.on('data', d => process.stderr.write('relay: ' + d));
    await new Promise((res, rej) => { relay.stdout.on('data', d => { if (/listening/.test(String(d))) res(); }); relay.on('exit', c => rej(new Error('relay exited ' + c))); });
    url = 'ws://127.0.0.1:' + port + '/rt'; statsUrl = 'http://127.0.0.1:' + port + '/stats';
  } else if (!/^[0-9a-f]{64,}$/.test(key)) { console.error('RT_SECRET (the relay\'s secret, 64 hex) is needed with --url'); process.exit(2); }
  else if (/127\.0\.0\.1|localhost/.test(url)) statsUrl = url.replace(/^ws/, 'http').replace(/\/rt.*$/, '/stats');
  console.log('lasttest_rt: target ' + url + (relay ? ' (the relay on this machine, pid ' + relay.pid + ')' : '') + ', ' + o.n + ' boats, ' +
    Math.round(o.n * o.cluster) + ' in the Lofoten cluster, ' + Math.round(o.moving * 100) + ' % under way, ' + o.secs + ' s');

  const B = boats(o), tickets = B.map(b => ticket(key, b.id));
  const sendT = new SharedArrayBuffer(8 * o.n * SEQ);
  const W = [], per = Math.ceil(o.n / o.workers), agg = [];
  const startAt = Date.now() + 500, measureAt = startAt + (o.ramp + o.warm) * 1000, endAt = measureAt + o.secs * 1000;
  for (let w = 0; w < o.workers; w++){
    const mine = B.slice(w * per, (w + 1) * per).map(b => ({...b, t:tickets[b.i]}));
    if (!mine.length) continue;
    const wk = new Worker(fileURLToPath(import.meta.url), {workerData:{url, boats:mine, n:o.n, sendT, startAt, measureAt, endAt, ramp:o.ramp}});
    wk.on('message', m => { agg[w] = m; }); wk.on('error', e => console.error('worker', e)); W.push(wk);
  }
  // the relay's CPU and memory, once a second, from /proc (a relay this test started; the server's own: systemctl status dsb-rt, htop)
  const cpu = [], rss = [], stats = []; let last = null;
  const tick = (process.env.CLK_TCK && +process.env.CLK_TCK) || 100;
  const sample = setInterval(async () => {
    const now = Date.now();
    if (relay && fs.existsSync('/proc/' + relay.pid + '/stat')){
      const f = fs.readFileSync('/proc/' + relay.pid + '/stat', 'utf8').split(') ')[1].split(' '), j = (+f[11] + +f[12]) / tick;
      if (last && now >= measureAt && now <= endAt) cpu.push(100 * (j - last.j) / ((now - last.t) / 1000));
      last = {j, t:now};
      const m = /VmRSS:\s+(\d+)/.exec(fs.readFileSync('/proc/' + relay.pid + '/status', 'utf8')); if (m && now >= measureAt) rss.push(+m[1] / 1024);
    }
    if (statsUrl && (now - t0) % 5000 < 1000){ try { const s = await (await fetch(statsUrl)).json(); stats.push({t:now, ...s}); } catch (e){} }
  }, 1000);
  const prog = setInterval(() => {
    const s = sum(agg), el = Math.max(1, (Date.now() - measureAt) / 1000);
    if (Date.now() < measureAt) return console.log('  … connected ' + s.open + '/' + o.n + (s.fail ? ', refused ' + s.fail : ''));
    console.log('  ' + Math.round(el) + ' s: ' + s.open + ' open, up ' + Math.round(s.sent / el) + '/s, down ' + Math.round(s.recv / el) + '/s, delay p50 ' +
      pct(s.hist, 0.5) + ' ms p99 ' + pct(s.hist, 0.99) + ' ms, lost ' + s.lost + (cpu.length ? ', relay CPU ' + Math.round(cpu[cpu.length - 1]) + ' %' : ''));
  }, 30000);
  await new Promise(res => setTimeout(res, endAt - Date.now() + 2500));
  clearInterval(sample); clearInterval(prog);
  for (const w of W) w.postMessage('stop');
  await new Promise(res => setTimeout(res, 1500));
  const s = sum(agg), secs = o.secs, cl = sum(agg, 'c'), sp = sum(agg, 's');
  const st0 = stats.find(x => x.t >= measureAt), st1 = [...stats].reverse().find(x => x.t <= endAt);
  const sorted = a => [...a].sort((p, q) => p - q), q = (a, f) => a.length ? +sorted(a)[Math.min(a.length - 1, Math.floor(a.length * f))].toFixed(1) : null;
  const R = {when:new Date(t0).toISOString(), target:url, local:!!relay, boats:o.n, cluster:Math.round(o.n * o.cluster), moving:o.moving, secs, workers:W.length,
    open:s.open, refused:s.fail, closed:s.closed, closeCodes:s.codes,
    upPerS:+(s.sent / secs).toFixed(1), downPerS:+(s.recv / secs).toFixed(1), framesPerS:+(s.frames / secs).toFixed(1), bytesDownPerS:Math.round(s.bytes / secs),
    delayMs:{p50:pct(s.hist, 0.5), p90:pct(s.hist, 0.9), p99:pct(s.hist, 0.99), p999:pct(s.hist, 0.999), max:s.max},
    lost:s.lost, lostFar:s.lostFar, lostShare:s.recv ? +(s.lost / (s.lost + s.recv)).toFixed(5) : 0,
    cluster_:{receivers:cl.n, downPerReceiverPerS:cl.n ? +(cl.recv / cl.n / secs).toFixed(1) : 0, maxPerFrame:cl.maxFrame, delayP99:pct(cl.hist, 0.99)},
    spread:{receivers:sp.n, downPerReceiverPerS:sp.n ? +(sp.recv / sp.n / secs).toFixed(1) : 0, maxPerFrame:sp.maxFrame, delayP99:pct(sp.hist, 0.99)},
    relayCpuPct:relay ? {mean:cpu.length ? +(cpu.reduce((a, b) => a + b, 0) / cpu.length).toFixed(1) : null, p95:q(cpu, 0.95), max:q(cpu, 1)} : null,
    relayRssMb:relay ? {max:rss.length ? +Math.max(...rss).toFixed(1) : null, end:rss.length ? +rss[rss.length - 1].toFixed(1) : null} : null,
    stats:st0 && st1 ? {inPerS:+((st1.in - st0.in) / ((st1.t - st0.t) / 1000)).toFixed(1), outPerS:+((st1.out - st0.out) / ((st1.t - st0.t) / 1000)).toFixed(1),
      bytesPerS:Math.round((st1.bytes - st0.bytes) / ((st1.t - st0.t) / 1000)), drop:st1.drop - st0.drop, slow:st1.slow - st0.slow, rej:st1.rej, conns:st1.conns, cells:st1.cells} : null,
    machine:{cpus:(await import('node:os')).cpus().length, model:(await import('node:os')).cpus()[0].model, node:process.version}};
  const dir = path.join(ROOT, 'tests', 'out', 'lasttest'); fs.mkdirSync(dir, {recursive:true});
  const file = path.join(dir, 'rt-' + R.when.replace(/[:.]/g, '-') + '-' + o.n + '.json'); fs.writeFileSync(file, JSON.stringify(R, null, 1));
  console.log(JSON.stringify(R, null, 1)); console.log('lasttest_rt: written ' + path.relative(ROOT, file));
  for (const w of W) w.terminate();
  if (relay){ relay.kill('SIGTERM'); }
  setTimeout(() => process.exit(0), 800);
}
function sum(agg, part){
  const s = {open:0, fail:0, closed:0, codes:{}, sent:0, recv:0, frames:0, bytes:0, lost:0, lostFar:0, max:0, maxFrame:0, n:0, hist:new Array(5001).fill(0)};
  for (const a0 of agg){ if (!a0) continue; const a = part ? a0[part] : a0.all;
    for (const k of ['open', 'fail', 'closed', 'sent', 'recv', 'frames', 'bytes', 'lost', 'lostFar', 'n']) s[k] += a[k] || 0;
    s.max = Math.max(s.max, a.max || 0); s.maxFrame = Math.max(s.maxFrame, a.maxFrame || 0);
    for (const [c, k] of Object.entries(a.codes || {})) s.codes[c] = (s.codes[c] || 0) + k;
    for (let i = 0; i < a.hist.length; i++) s.hist[i] += a.hist[i]; }
  return s;
}

async function worker(){
  const require = createRequire(path.join(RTDIR, 'package.json')), WebSocket = require('ws');
  const {url, boats:B, sendT:SB, startAt, measureAt, endAt, ramp} = workerData, sendT = new Float64Array(SB);
  const now = () => performance.timeOrigin + performance.now();
  const mk = () => ({open:0, fail:0, closed:0, codes:{}, sent:0, recv:0, frames:0, bytes:0, lost:0, lostFar:0, max:0, maxFrame:0, n:0, hist:new Array(5001).fill(0)});
  const A = {all:mk(), c:mk(), s:mk()};
  let stop = false;
  parentPort.on('message', m => { if (m === 'stop') stop = true; });
  const rep = () => parentPort.postMessage(A);
  setInterval(rep, 2000);
  const BYI = new Map(); for (const b of B) BYI.set(b.i, b);
  for (const b of B){ A[b.cluster ? 'c' : 's'].n++; A.all.n++; }
  const up = Buffer.alloc(18);
  function open(b){
    const ws = new WebSocket(url + '?t=' + b.t, {headers:{Origin:'https://detstorebla.no'}, perMessageDeflate:false});
    b.ws = ws; b.seq = 0; b.last = new Map(); b.next = 0;
    ws.on('open', () => { A.all.open++; b.up = true; });
    ws.on('unexpected-response', (req, res) => { A.all.fail++; A.all.codes['http' + res.statusCode] = (A.all.codes['http' + res.statusCode] || 0) + 1; });
    ws.on('error', () => {});
    ws.on('close', code => { if (b.up){ A.all.open--; A.all.closed++; A.all.codes[code] = (A.all.codes[code] || 0) + 1; } b.up = false; });
    ws.on('message', d => {
      if (d[0] !== 2) return;
      const t = now(), meas = t >= measureAt && t <= endAt, n = d.readUInt16LE(1), P = A[b.cluster ? 'c' : 's'];
      if (!meas) return;
      A.all.frames++; A.all.bytes += d.length; P.bytes += d.length; A.all.maxFrame = Math.max(A.all.maxFrame, n); P.maxFrame = Math.max(P.maxFrame, n);
      for (let k = 0; k < n; k++){
        const o = 11 + 20 * k, si = d.readUInt32BE(o + 1), xr = d.readInt32LE(o + 10), yr = d.readInt32LE(o + 14), sq = ((xr & 31) << 5) | (yr & 31);
        const st = sendT[si * SEQ + sq], ms = st ? Math.round(t - st) : -1;
        A.all.recv++; P.recv++;
        if (ms >= 0){ const h = Math.min(5000, ms); A.all.hist[h]++; P.hist[h]++; if (ms > A.all.max) A.all.max = ms; if (ms > P.max) P.max = ms; }
        // the gaps: within 4.8 km every report should come, beyond 5.2 km one a second of a boat under way (the relay thins them on
        // purpose, valg 28) and every one of a boat lying still; the ring between, and a boat that crossed it since the last, count not
        const dx = xr / 1e4 - b.x, dy = yr / 1e4 - b.y, d2 = dx * dx + dy * dy, band = d2 < 4.8 * 4.8 ? 1 : d2 > 5.2 * 5.2 ? 2 : 0, l = b.last.get(si);
        if (l != null && band && l.band === band){ const g = (sq - l.sq + SEQ) % SEQ, step = band === 2 && d[o + 7] === 1 ? 5 : 1;
          if (g > 1 && g < 64){ const k = Math.max(0, Math.round(g / step) - 1); A.all.lost += k; P.lost += k; if (band === 2){ A.all.lostFar += k; P.lostFar += k; } } }
        b.last.set(si, {sq, band});
      }
    });
  }
  // the connections come in over the ramp, spread, as players do; then each sends on its own beat
  B.forEach((b, k) => setTimeout(() => open(b), Math.max(0, startAt - Date.now()) + (ramp * 1000 * (k + Math.random()) / B.length)));
  const step = () => {
    if (stop) return;
    const t = now();
    for (const b of B){
      if (!b.up || t < b.next) continue;
      const dt = b.moving ? 0.2 : 1; b.next = (b.next || t) + dt * 1000; if (b.next < t - 1000) b.next = t;
      if (b.moving){
        // 8 knots as the game shows it (6 times as fast): about 25 m a second; she turns slowly and back home when she strays
        const dx = b.x - b.cx, dy = b.y - b.cy;
        if (dx * dx + dy * dy > b.rad * b.rad) b.hd += 0.08 * Math.sign(Math.sin(Math.atan2(-dy, -dx) - b.hd) || 1); else b.hd += b.turn;
        const d = 0.0247 * dt; b.x += Math.cos(b.hd) * d; b.y += Math.sin(b.hd) * d;
      }
      const sq = b.seq++ % SEQ, xr = (Math.round(b.x * 1e4) & ~31) | (sq >> 5), yr = (Math.round(b.y * 1e4) & ~31) | (sq & 31);
      up[0] = 1; up[1] = b.moving ? 1 : 2; up.writeUInt16LE(b.moving ? 800 : 0, 2); up.writeInt32LE(xr, 4); up.writeInt32LE(yr, 8);
      const h = ((b.hd % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI; up.writeInt16LE(Math.round(h * 1e4), 12); up.writeUInt32LE(Math.floor(performance.now()) >>> 0, 14);
      sendT[b.i * SEQ + sq] = now();
      try { b.ws.send(Buffer.from(up)); } catch (e){ continue; }
      if (t >= measureAt && t <= endAt){ A.all.sent++; A[b.cluster ? 'c' : 's'].sent++; }
    }
  };
  setInterval(step, 20);
}

if (isMainThread) await main(); else await worker();
