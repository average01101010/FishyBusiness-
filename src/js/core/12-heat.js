// ---------- the echo-sounder heat map: how much fish there is around the boat ----------
// What the echo sounder (or the sonar) of the vessel you follow sees in a disk around it. Cells sit on a fixed world grid, so the
// picture does not shimmer as the disk slides along, and they are worked out a few at a time between frames (ui/03c-heat.js draws
// them). A cell holds kg an hour for one person with a hand jig, split in cod, haddock, saithe and the rest, from the same density()
// the catch and the echo use, so the heat falls where the fish are taken and moves when they move. The signals are fresh goods: a
// cell the boat has passed fades out over half an hour of game time and is then forgotten.
const HEAT = {
  tiers:{
    basic:{r:0.5 * NM, cs:0.1, every:10, pick:false},    // the simple sounder every boat has: 1 nm across, coarse
    chirp:{r:0.75 * NM, cs:0.06, every:5, pick:true},    // CHIRP: 1.5 nm across, sharper, and it tells the species apart
    sonar:{r:1.5 * NM, cs:0.08, every:2, pick:true}},    // sonar: 3 nm across, and quick enough to see the schools move
  glow:30, slice:5, sp:['torsk', 'hyse', 'sei'], maxCells:40000};

// which instrument draws the heat now, if any: the sonar when it is fitted and on, else the echo sounder unless it is off
function heatTier(){
  const e = S.equip || {}, st = S.settings || {};
  if (e.sonar && st.sonar !== false) return 'sonar';
  if (st.echo === false) return null;
  return e.chirp ? 'chirp' : 'basic';
}
// the species shown: only CHIRP and sonar tell them apart
function heatSpecies(){ const t = heatTier(), v = S.settings && S.settings.heatSp; return t && HEAT.tiers[t].pick && HEAT.sp.includes(v) ? v : 'all'; }
// kg an hour for one person with a hand jig at a point: cod, haddock, saithe, and the other fish together
function heatSample(p, H){
  const out = new Float64Array(4), q = denPlace(p); if (!q) return out;
  const T = denTime(H);
  for (const sp of SP){ const i = sp === 'torsk' ? 0 : sp === 'hyse' ? 1 : sp === 'sei' ? 2 : 3; out[i] += 30 * denSp(sp, q, H, T); }
  return out;
}
function heatValue(v, sp){ return sp === 'torsk' ? v[0] : sp === 'hyse' ? v[1] : sp === 'sei' ? v[2] : v[0] + v[1] + v[2] + v[3]; }

// the cells: key → {x, y (centre), v, t (game minute worked out), h (stock hour), seen (game minute last inside the disk)}
const HEATC = {key:'', tier:null, cs:0, cells:new Map(), queue:[], qi:0, busy:false, t:-1, rev:0, lastTick:0, stats:{slices:0, maxSlice:0, n:0, ms:0}};
const heatKey = gridKey;
function heatReset(){ HEATC.key = ''; HEATC.cells.clear(); HEATC.queue = []; HEATC.qi = 0; HEATC.rev++; }
// called from the UI's tick: mark what the disk covers, queue what is missing or stale (nearest first, and a little ahead of a
// boat under way), forget what has faded, and start the work
function heatTick(){
  const tier = heatTier(), b = S.boat;
  if (!tier){ if (HEATC.cells.size) heatReset(); return; }
  if (!DEPTH || b.status === 'port' || (typeof document !== 'undefined' && document.hidden) || !mapReadyAt(b.pos, MAPD.simR)) return;
  // at the fastest test paces the picture is worked out at most once a second
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  if (S.mult >= 300 && now - HEATC.lastTick < 1000) return; HEATC.lastTick = now;
  const T = HEAT.tiers[tier], key = S.cur + '|' + tier;
  if (key !== HEATC.key){ heatReset(); HEATC.key = key; HEATC.tier = tier; HEATC.cs = T.cs; }
  // a jump in time (catch-up after being away) makes every cell old news
  if (HEATC.t >= 0 && Math.abs(S.t - HEATC.t) > HEAT.glow){ HEATC.cells.clear(); HEATC.rev++; }
  HEATC.t = S.t;
  const cs = T.cs, p = b.pos, hr = Math.floor(S.t / 60), ahead = b.status === 'sailing' ? (b.v || 0) * NM / 60 * 2 : 0;
  const hx = Math.sin(b.heading || 0) * ahead, hy = -Math.cos(b.heading || 0) * ahead, R = T.r + cs, R2 = R * R, r2 = T.r * T.r, want = [];
  for (let ix = Math.floor((p.x - R - Math.abs(hx)) / cs); ix <= Math.ceil((p.x + R + Math.abs(hx)) / cs); ix++)
    for (let iy = Math.floor((p.y - R - Math.abs(hy)) / cs); iy <= Math.ceil((p.y + R + Math.abs(hy)) / cs); iy++){
      const x = (ix + 0.5) * cs, y = (iy + 0.5) * cs, d2 = (x - p.x) ** 2 + (y - p.y) ** 2, d2a = (x - p.x - hx) ** 2 + (y - p.y - hy) ** 2;
      if (d2 > R2 && d2a > R2) continue;
      const k = heatKey(ix, iy); let c = HEATC.cells.get(k);
      if (!c){ c = {x, y, v:null, t:-1e9, h:-1, seen:-1e9}; HEATC.cells.set(k, c); }
      if (d2 <= r2) c.seen = S.t;
      if (!c.v || S.t - c.t >= T.every || c.h !== hr) want.push([Math.min(d2, d2a), c]);
    }
  // the afterglow fades, and old cells are let go
  for (const [k, c] of HEATC.cells) if (S.t - c.seen > HEAT.glow && (c.x - p.x) ** 2 + (c.y - p.y) ** 2 > R2) HEATC.cells.delete(k);
  if (HEATC.cells.size > HEAT.maxCells){ const old = [...HEATC.cells.entries()].sort((a, c) => a[1].seen - c[1].seen); for (let i = 0; i < old.length - HEAT.maxCells; i++) HEATC.cells.delete(old[i][0]); }
  want.sort((a, c) => a[0] - c[0]);
  HEATC.queue = want.map(w => w[1]); HEATC.qi = 0;
  if (HEATC.queue.length) heatWork();
}
// work through the queue in slices of a few milliseconds, the way «Følg leia» searches, so frames stay smooth on a tablet
let heatLastHook = 0;
function heatWork(){
  if (HEATC.busy) return; HEATC.busy = true;
  const run = () => {
    const t0 = performance.now(), H = S.t / 60, hr = Math.floor(S.t / 60); let n = 0;
    while (HEATC.qi < HEATC.queue.length && performance.now() - t0 < HEAT.slice){ const c = HEATC.queue[HEATC.qi++]; c.v = heatSample(c, H); c.t = S.t; c.h = hr; n++; }
    const ms = performance.now() - t0, st = HEATC.stats; st.slices++; st.maxSlice = Math.max(st.maxSlice, ms); st.n += n; st.ms += ms; if (ms > 16) st.over = (st.over || 0) + 1;
    if (n) HEATC.rev++;
    const done = HEATC.qi >= HEATC.queue.length;
    if (typeof hooks !== 'undefined' && hooks.onHeat && (done || performance.now() - heatLastHook > 150)){ heatLastHook = performance.now(); hooks.onHeat(); }
    if (done) HEATC.busy = false; else setTimeout(run, 0);
  };
  setTimeout(run, 0);
}
// the heat at a point from the cells, as drawn: nearest cell (for the tests and the readout)
function heatAt(p){ const cs = HEATC.cs; if (!cs) return null; const c = HEATC.cells.get(heatKey(Math.floor(p.x / cs), Math.floor(p.y / cs))); return c && c.v ? c.v : null; }

// where a species' schools are swimming, and how fast (km an hour), for the sonar
function schoolDrift(sp){ const si = ALLSP.indexOf(sp); return {a:schoolHeading(sp), v:0.5 + 0.5 * h2(si, 741)}; }
