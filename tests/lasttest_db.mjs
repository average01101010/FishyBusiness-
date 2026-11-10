// The load test of Supabase (Ø16 S3, docs/planer/sanntid-posisjoner.md; steg 47, Jonas 07.11.2026: 500 brukere først, «Dette løser du
// på beste mulig måte»). Run by hand, at night Norwegian time, never from run.py. It talks to the production project in
// src/data/cloud.json through the anon key exactly as the game does (ui/10f-cloud.js guestAuth, cloudRpc; ui/10h-world.js worldTick):
//
//   node tests/lasttest_db.mjs setup --n 500   # 500 anonymous sign-ins (guests, as a new player), each marked lasttest=<tag> in its
//                                              # user metadata, and tm_hello, which makes the player; kept in tests/out/lasttest/
//   node tests/lasttest_db.mjs run --secs 600  # the load, in steps (below), with the stop rule
//   node tests/lasttest_db.mjs clean           # every synthetic player deletes herself (delete_me2, as «Slett kontoen» does), and
//                                              # pos_put afterwards must answer «no player»; the sign-ins themselves (auth.users) go
//                                              # with the SQL the script prints, run in SQL Editor or through the Supabase tools
//
// The synthetic players are guests (anonymous sign-ins), so no one sees them: pos_world and the relay show no guest's boat, world_get
// leaves guests out of the market and the cells (supabase/migrations/20261007130000_seen.sql, 20261105130000_guest_world.sql).
// Half lie in one cluster on the Lofoten field, the rest along the coast, as in lasttest_rt.mjs.
//
// The steps of «run» (the shares of --secs): first the game's own pace (pos_put and pos_world every 15 s, as worldTick), then
// pos_put once a second, then 5 times a second (the relay's pace, which the startmelding asked for against the database), with
// pos_world every 15 s and world_get once in ten minutes for each throughout (world_get from since=0, the heaviest: a new game).
// The stop rule, so no real player notices: over the last 10 s, more than 1 % failed calls, or the 95th percentile over 1 s, and it
// stops at once. It measures each call's time from here (the network from this machine to Supabase is in it; a baseline with 5
// players first shows how much) and the failures by status.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.dirname(HERE);
const CFG = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', 'cloud.json'), 'utf8'));
const URL0 = CFG.supabaseUrl.replace(/\/$/, ''), ANON = CFG.supabaseAnon, DIR = path.join(ROOT, 'tests', 'out', 'lasttest');
const cmd = process.argv[2] || '', A = process.argv.slice(3);
const opt = (k, d) => { const i = A.indexOf('--' + k); return i >= 0 ? (typeof d === 'number' ? +A[i + 1] : A[i + 1]) : d; };
fs.mkdirSync(DIR, {recursive:true});
const TAG = opt('tag', 'lt47');
const FILE = path.join(DIR, 'db-players-' + TAG + '.json');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const now = () => performance.timeOrigin + performance.now();

async function auth(p, body){
  const r = await fetch(URL0 + '/auth/v1/' + p, {method:'POST', headers:{'Content-Type':'application/json', apikey:ANON}, body:JSON.stringify(body)});
  const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e){}
  if (!r.ok){ const e = new Error('auth ' + r.status + ' ' + t.slice(0, 160)); e.status = r.status; throw e; }
  return {at:j.access_token, rt:j.refresh_token, exp:j.expires_at || Math.round(Date.now() / 1000 + (j.expires_in || 3600)), id:(j.user || {}).id};
}
async function rpc(g, fn, args){
  const t = now();
  let r, status = 0, body = '';
  try { r = await fetch(URL0 + '/rest/v1/rpc/' + fn, {method:'POST', headers:{'Content-Type':'application/json', apikey:ANON, Authorization:'Bearer ' + g.at}, body:JSON.stringify(args || {})});
    status = r.status; body = await r.text(); }
  catch (e){ status = 0; body = String(e.cause && e.cause.code || e.message); }
  return {ms:now() - t, status, body};
}
const save = P => fs.writeFileSync(FILE, JSON.stringify(P));
const load = () => { if (!fs.existsSync(FILE)){ console.error('no players: run «setup» first (' + path.relative(ROOT, FILE) + ')'); process.exit(2); } return JSON.parse(fs.readFileSync(FILE, 'utf8')); };
async function fresh(g){ if (g.exp - Date.now() / 1000 < 120){ const n = await auth('token?grant_type=refresh_token', {refresh_token:g.rt}); g.at = n.at; g.rt = n.rt; g.exp = n.exp; } return g; }

// the places, as lasttest_rt.mjs (a spherical transverse Mercator into the game's frame is near enough)
function natP(lat, lon){
  const R = 6371000, k0 = 0.9996, f = lat * Math.PI / 180, l = (lon - 15) * Math.PI / 180;
  const E = 500000 + k0 * R * Math.atanh(Math.cos(f) * Math.sin(l)), N = k0 * R * Math.atan2(Math.tan(f), Math.cos(l));
  return {x:(E + 250000) / 1000, y:(8050000 - N) / 1000};
}
const COAST = [[58.14, 8.00], [59.41, 5.27], [60.39, 5.32], [62.47, 6.15], [63.43, 10.39], [65.47, 12.21], [67.28, 14.40], [68.43, 17.43], [69.65, 18.96], [70.66, 23.68], [70.37, 31.11]];
function place(i, n){
  const r = () => Math.random();
  if (i < n / 2){ const L = natP(68.13, 14.35), a = r() * 2 * Math.PI, d = Math.sqrt(r()); return {x:L.x + Math.cos(a) * d * 15, y:L.y + Math.sin(a) * d * 8}; }
  const h = natP(...COAST[i % COAST.length]), a = r() * 2 * Math.PI, d = Math.sqrt(r()) * 12; return {x:h.x + Math.cos(a) * d, y:h.y + Math.sin(a) * d};
}

async function setup(){
  const n = opt('n', 500), gap = opt('gap', 150), P = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : [];
  console.log('lasttest_db setup: target ' + URL0 + ' (production), ' + n + ' anonymous sign-ins marked lasttest=' + TAG + ', ' + P.length + ' there already');
  let wait = 0;
  while (P.length < n){
    try {
      const g = await auth('signup', {data:{lasttest:TAG}});
      const h = await rpc(g, 'tm_hello', {meta:{lang:'nb', tz:'Europe/Oslo', platform:'lasttest', browser:'node', pwa:false}});
      if (h.status !== 200) throw new Error('tm_hello ' + h.status + ' ' + h.body.slice(0, 120));
      P.push({...g, i:P.length}); save(P); wait = 0;
      if (P.length % 25 === 0) console.log('  ' + P.length + '/' + n);
      await sleep(gap);
    } catch (e){
      if (e.status === 429){ wait = Math.min(600000, (wait || 30000) * 2); console.log('  429 after ' + P.length + ' (the sign-in limit); waiting ' + Math.round(wait / 1000) + ' s'); await sleep(wait); continue; }
      console.error('  ' + e.message); await sleep(5000);
    }
  }
  console.log('lasttest_db setup: ' + P.length + ' players in ' + path.relative(ROOT, FILE));
}

function stat(a){ const s = [...a].sort((p, q) => p - q), q = f => s.length ? +s[Math.min(s.length - 1, Math.floor(s.length * f))].toFixed(1) : null; return {n:s.length, p50:q(0.5), p95:q(0.95), p99:q(0.99), max:q(1)}; }

async function run(){
  const P = load(), secs = opt('secs', 600), y = opt('year', 2027), gh0 = opt('gh', 5000), only = opt('n', P.length);
  const G = P.slice(0, only);
  console.log('lasttest_db run: target ' + URL0 + ' (production), ' + G.length + ' synthetic guests (lasttest=' + TAG + '), ' + secs + ' s');
  for (const g of G){ try { await fresh(g); } catch (e){ console.error('refresh ' + g.i + ': ' + e.message); g.dead = true; } }
  save(P);
  const L = G.filter(g => !g.dead); L.forEach((g, k) => { g.p = place(k, L.length); g.hd = Math.random() * 6.283; g.mov = Math.random() < 0.6; });
  // the baseline: 5 players, one call at a time, before the load
  const base = {pos_put:[], pos_world:[]};
  for (let k = 0; k < 20; k++){ const g = L[k % Math.min(5, L.length)];
    base.pos_put.push((await rpc(g, 'pos_put', {x:g.p.x, y:g.p.y, hd:g.hd, v:0, st:'port', boat:'', vtype:'sjark', fs:0})).ms);
    base.pos_world.push((await rpc(g, 'pos_world', {x:g.p.x, y:g.p.y, r:25})).ms); }
  console.log('  baseline: pos_put ' + JSON.stringify(stat(base.pos_put)) + ', pos_world ' + JSON.stringify(stat(base.pos_world)));
  const steps = [{name:'game pace (15 s)', put:15, share:0.2}, {name:'pos_put 1 Hz', put:1, share:0.2}, {name:'pos_put 5 Hz', put:0.2, share:0.6}];
  const T0 = now(), T1 = T0 + secs * 1000;
  let at = T0; for (const s of steps){ s.from = at; at += s.share * secs * 1000; s.to = at; s.calls = {}; }
  const win = [], R = {}, codes = {};
  let stopWhy = '', inflight = 0, skipped = 0;
  const step = t => steps.find(s => t >= s.from && t < s.to) || steps[steps.length - 1];
  const note = (fn, s, r) => {
    const t = now(), ok = r.status >= 200 && r.status < 300;
    (R[fn] = R[fn] || {ms:[], fail:0}).ms.push(r.ms); if (!ok){ R[fn].fail++; const c = fn + ' ' + r.status + ' ' + r.body.slice(0, 60); codes[c] = (codes[c] || 0) + 1; }
    const c = s.calls[fn] = s.calls[fn] || {ms:[], fail:0}; c.ms.push(r.ms); if (!ok) c.fail++;
    win.push({t, ms:r.ms, ok});
  };
  const call = async (g, fn, args) => { if (g.busy && fn === 'pos_put'){ skipped++; return; } inflight++; if (fn === 'pos_put') g.busy = true;
    const s = step(now()), r = await rpc(g, fn, args); inflight--; if (fn === 'pos_put') g.busy = false; note(fn, s, r); };
  // the guard: every second over the last 10 s
  const guard = setInterval(() => {
    const t = now(); while (win.length && win[0].t < t - 10000) win.shift();
    if (win.length < 50) return;
    const fail = win.filter(w => !w.ok).length / win.length, p95 = stat(win.map(w => w.ms)).p95;
    if (fail > 0.01) stopWhy = 'failures ' + (fail * 100).toFixed(1) + ' % over 10 s';
    else if (p95 > 1000) stopWhy = 'p95 ' + Math.round(p95) + ' ms over 10 s';
  }, 1000);
  const prog = setInterval(() => { const t = now(), s = step(t), c = s.calls.pos_put; const w = win.map(x => x.ms);
    console.log('  ' + Math.round((t - T0) / 1000) + ' s, ' + s.name + ': ' + Math.round(win.length / 10) + ' calls/s, p95 ' + stat(w).p95 + ' ms, in flight ' + inflight + ', failed ' + win.filter(x => !x.ok).length); }, 30000);
  const loops = L.map(async (g, k) => {
    let nextPut = T0 + Math.random() * 15000, nextWorld = T0 + Math.random() * 15000, nextGet = T0 + Math.random() * Math.min(secs, 600) * 1000, nextRef = 0;
    while (!stopWhy && now() < T1){
      const t = now(), s = step(t);
      if (t > nextRef){ nextRef = t + 30000; try { await fresh(g); } catch (e){ note('refresh', s, {ms:0, status:e.status || 0, body:e.message}); } }
      if (g.mov){ g.hd += (Math.random() - 0.5) * 0.05; g.p.x += Math.cos(g.hd) * 0.005; g.p.y += Math.sin(g.hd) * 0.005; }
      if (t >= nextPut){ nextPut = Math.max(nextPut + s.put * 1000, t - 1000); if (nextPut > s.to && s !== steps[steps.length - 1]) nextPut = Math.min(nextPut, s.to + Math.random() * 1000);
        call(g, 'pos_put', {x:+g.p.x.toFixed(4), y:+g.p.y.toFixed(4), hd:+g.hd.toFixed(3), v:g.mov ? 8 : 0, st:g.mov ? 'sailing' : 'fishing', boat:'', vtype:'sjark', fs:0}); }
      if (t >= nextWorld){ nextWorld += 15000; call(g, 'pos_world', {x:g.p.x, y:g.p.y, r:25}); }
      if (t >= nextGet){ nextGet = Infinity; call(g, 'world_get', {since:0, y, gh:+(gh0 + (t - T0) / 600000).toFixed(2)}); }
      await sleep(Math.max(5, Math.min(nextPut, nextWorld, nextGet) - now()));
    }
  });
  await Promise.all(loops); clearInterval(guard); clearInterval(prog);
  const t9 = now() + 15000; while (inflight > 0 && now() < t9) await sleep(100);
  save(P);
  const out = {when:new Date(T0 - performance.now() + performance.timeOrigin - performance.timeOrigin).toISOString(), target:URL0, players:L.length, tag:TAG, secs,
    ranS:+((now() - T0) / 1000).toFixed(1), stopped:stopWhy || null, skippedPutsBusy:skipped, baseline:{pos_put:stat(base.pos_put), pos_world:stat(base.pos_world)},
    total:Object.fromEntries(Object.entries(R).map(([k, v]) => [k, {...stat(v.ms), fail:v.fail, failShare:+(v.fail / Math.max(1, v.ms.length)).toFixed(4)}])),
    steps:steps.map(s => ({name:s.name, secs:+((s.to - s.from) / 1000).toFixed(0), calls:Object.fromEntries(Object.entries(s.calls).map(([k, v]) => [k, {...stat(v.ms), perS:+(v.ms.length / ((s.to - s.from) / 1000)).toFixed(1), fail:v.fail}]))})),
    failures:codes};
  out.when = new Date(Date.now() - (now() - T0)).toISOString();
  const f = path.join(DIR, 'db-' + out.when.replace(/[:.]/g, '-') + '-' + L.length + '.json'); fs.writeFileSync(f, JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out, null, 1)); console.log('lasttest_db: written ' + path.relative(ROOT, f) + (stopWhy ? '  STOPPED: ' + stopWhy : ''));
}

async function clean(){
  const P = load(); let gone = 0, left = 0;
  console.log('lasttest_db clean: target ' + URL0 + ', ' + P.length + ' synthetic players (lasttest=' + TAG + ')');
  for (const g of P){
    try { await fresh(g); } catch (e){ console.error('  refresh ' + g.i + ': ' + e.message + ' (the SQL below takes her)'); left++; continue; }
    const d = await rpc(g, 'delete_me2', {});
    const c = await rpc(g, 'pos_put', {x:700, y:700, hd:0, v:0, st:'port', boat:'', vtype:'sjark'});   // must fail now: the player is gone
    if (d.status === 200 && c.status >= 400 && /no player/.test(c.body)) gone++; else { left++; console.error('  ' + g.i + ': delete ' + d.status + ', pos_put after ' + c.status + ' ' + c.body.slice(0, 80)); }
  }
  console.log('lasttest_db clean: ' + gone + ' deleted and checked, ' + left + ' not. The sign-ins themselves (auth.users), as admin:');
  console.log("  delete from public.players where id in (select id::text from auth.users where raw_user_meta_data ->> 'lasttest' = '" + TAG + "');");
  console.log("  delete from auth.users where raw_user_meta_data ->> 'lasttest' = '" + TAG + "';");
  console.log("  select (select count(*) from auth.users where raw_user_meta_data ->> 'lasttest' = '" + TAG + "') users, (select count(*) from public.players p join auth.users u on u.id::text = p.id where u.raw_user_meta_data ->> 'lasttest' = '" + TAG + "') players;   -- both 0");
  if (!left) fs.renameSync(FILE, FILE.replace(/\.json$/, '-deleted.json'));
}

if (cmd === 'setup') await setup(); else if (cmd === 'run') await run(); else if (cmd === 'clean') await clean();
else { console.error('node tests/lasttest_db.mjs setup|run|clean [--n 500] [--secs 600] [--tag lt47]'); process.exit(2); }
