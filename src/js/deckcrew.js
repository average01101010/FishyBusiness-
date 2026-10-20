'use strict';
// ===== CREW3D: the people aboard as agents who walk the deck (docs/mannskap-plan.md, del 1; Jonas 17.10.2026: no teleporting) =====
// The simulation says what each person does (core/13-work.js workAssign, every game minute); this says where they are on the way to
// it, in the boat's own frame, over the deck map read off the model (vessel3d.js deckMap). The 3D view (view3d.js) draws the agents
// where they stand and walk; nothing here touches WebGL, and nothing here is saved: the agents are the view of the game, not the game.
// Opening the game, or coming back after the clock has run on (catchUp), puts everyone at their place at once; from then on they walk.
// One sim per boat (crewSim): the own boat's reads the game (CREW3D); another player's or an NPC boat's gets its type, state and
// people from the view (view3d.js drawNPC), so the same walking, places and idle life show on every boat near enough to see them.
function crewSim(src){
  const A = [];                          // the agents, one per person aboard who is up: {id, me, c, x, y, z, h, cell, goal, path, pi, mode, task, idle, blend}
  const ST = {type:null, M:null, PT:null, jig:null, lastSim:null, ctxT:0, ctx:null, seed:(src && src.seed) || 1, clk:0};
  const WALK = 1.2, TURN = 4.5;          // m/s on a flat deck, rad/s turning on the spot
  const rnd = () => { ST.seed = (ST.seed * 1664525 + 1013904223) >>> 0; return ST.seed / 4294967296; };
  const nowS = () => ST.clk;             // the agents' own clock, in seconds of ticks (real time in the game, the test's ticks in the test)
  function reset(){ A.length = 0; ST.type = null; ST.lastSim = null; }
  // the boat's type, its deck map and places; false while the boat has none (the hand-worked boats keep their seated figures)
  function ready(){
    const t = src ? src.type() : S && S.boat && S.boat.type; if (!t || typeof deckMap !== 'function') return false;
    if (ST.type !== t){ ST.type = t; ST.M = deckMap(t); ST.PT = ST.M ? deckPoints(t) : null; ST.G = typeof geoOf === 'function' ? geoOf(t) : null; A.length = 0; ST.lastSim = null; ST.ctx = null; ST.ctxT = 0; }
    return !!(ST.M && ST.PT && ST.G && !ST.G.hand && ST.PT.sloy);
  }
  const on = () => ready();
  // the jigging places the view found on the rail (view3d.js jigRail): the hands stand inboard of the machines
  function setJig(spots){ ST.jig = spots || null; }
  function setRoll(r){ ST.roll = r || 0; }
  // ---- where a station is on the deck: a cell and the way to face there ----
  const near = (x, z, r) => ST.M.near(x, z, r || 1.5);
  function hauler(k){ const G = ST.G, HP = G.hauler || [1, 1, 0], d = G.deck || {z:0}, sx = (G.beam || 3) / 2, sg = HP[0] >= 0 ? 1 : -1;
    // a third and fourth hand stand side by side across the deck, 0.75 m apart (tilbakemelding #75: they stood inside each other)
    const L = [[HP[0] - sg * 0.55, HP[2] + 0.2, 'coil', sg * Math.PI / 2], [HP[0] - sg * 1.25, HP[2] + 0.75, 'stack', sg * Math.PI * 0.6], [sx * 0.3 + 0.5 - (k - 2) * 0.75, d.z - 0.4, 'stack', Math.PI]][Math.min(2, k)];
    const taken = new Set(A.filter(a => a.goal && a.kind === 'haling' && a.slot !== k).map(a => a.goal.k));
    let c = near(L[0], L[1], 2.5); for (const dx of [-0.6, 0.6, -1.2, 1.2]){ if (c < 0 || !taken.has(c)) break; const q = near(L[0] + dx, L[1], 0.5); if (q >= 0 && !taken.has(q)) c = q; }
    return c >= 0 ? {k:c, h:L[3], task:L[2]} : null; }
  function jigSpot(k){ const J = ST.jig; if (J && J.length){ const P = J[k % J.length], sg = P[0] >= 0 ? 1 : -1, c = near(P[0] - sg * 0.45, P[2], 1.2); if (c >= 0) return {k:c, h:sg * Math.PI / 2, task:'jig'}; }
    const sp = ST.PT['spot' + k] || ST.PT.spot0; return sp ? {k:sp.k, h:sp.h || 0, task:'jig'} : null; }
  // ---- what the game says: everyone's station this minute, and the boat's state ----
  function context(){
    if (src) return src.ctx(ST.G);
    const b = S.boat, G = ST.G, H = S.t / 60, hr = typeof gDate === 'function' ? gDate(H).getUTCHours() : 12;
    const away = typeof meAboard === 'function' && meAboard() && typeof restAshore === 'function' && restAshore();   // the skipper rests ashore: the crew sleep there too (Jonas 06.10.2026)
    const underway = b.status === 'sailing' && !b.gop, port = b.status === 'port', hasBunks = typeof bunks === 'function' && !!bunks(b);
    const DK = typeof deckPending === 'function' && S.hold && S.hold.length && deckPending() > 0.5, gutting = DK && typeof catchGut === 'function' && catchGut() && S.hold.some(x => !x.gut && !x.iced);
    const wind = typeof windAt === 'function' ? windAt(H, b.pos) : 0, night = hr >= 22 || hr < 6;
    const WA = typeof workAssign === 'function' ? workAssign() : [];
    return {away, underway, port, hasBunks, open:!!G.open, deckTask:gutting ? 'gut' : 'ice', wind, night, WA, aground:b.status === 'aground', fishing:b.status === 'fishing'};
  }
  // the agent's goal from the context, for the n-th person of its kind (the first at the table, the second at the tub ...): null means
  // inside (the house, the bunks, ashore), not drawn
  function goalOf(p, ctx, n){
    const PT = ST.PT, st = p.st;
    if (ctx.away) return null;
    if (st === 'ror'){ if (PT.ror) return {k:PT.ror.k, h:PT.ror.h || 0, task:'helm'}; return PT.door ? {k:PT.door.k, h:0, task:'helm', inside:'helm'} : null; }
    if (ctx.underway && !ctx.open && st === 'pause') return PT.door ? {k:PT.door.k, h:0, task:null, inside:'in'} : null;   // under way the crew are inside (03.10.2026)
    if (ctx.port && ctx.hasBunks && !ctx.open && p.c && p.c.fatigue >= 1 && st === 'pause') return PT.door ? {k:PT.door.k, h:0, task:null, inside:'in'} : null;   // asleep in the bunks (tilbakemelding #65)
    if (st === 'sloy' || st === 'is' || st === 'sort'){ const q = n === 0 ? PT.sloy : n === 1 ? PT.is : null; if (q) return {k:q.k, h:q.h || 0, task:n === 0 ? ctx.deckTask : 'ice'}; return idleGoal(p, ctx, 'look'); }
    if (st === 'haling'){ const q = hauler(n); return q || idleGoal(p, ctx, 'look'); }
    if (st === 'fiske'){ const q = jigSpot(n); return q || idleGoal(p, ctx, 'lean'); }
    if (st === 'kokk') return PT.door ? {k:PT.door.k, h:0, task:null, inside:'in'} : null;
    return idleGoal(p, ctx);
  }
  // the kinds of work that share places (gutting and icing are one deck crew): a person keeps the place while the kind stays the same
  const kindOf = st => st === 'sloy' || st === 'is' || st === 'sort' ? 'deck' : st;
  // ---- a free person: something to do for a while, by the weather, the hour and their nature ----
  const IDLE = ['lean', 'lean', 'look', 'coffee', 'coil', 'sweep', 'sit'];
  function idleGoal(p, ctx, force){
    const PT = ST.PT, T = p.c && p.c.traits || [], taken = new Set(A.filter(a => a.goal && a.id !== p.id).map(a => a.goal.k));
    const leans = (PT.lean || []).filter(l => !taken.has(l.k)); if (!leans.length) return PT.sloy ? {k:PT.sloy.k, h:0, task:'look'} : null;
    let act = force || IDLE[Math.floor(rnd() * IDLE.length)];
    if (!force){ if (T.includes('makelig') && rnd() < 0.5) act = rnd() < 0.5 ? 'lean' : 'coffee'; if ((T.includes('arbeidsjern') || T.includes('perfeksjonist')) && rnd() < 0.5) act = rnd() < 0.5 ? 'sweep' : 'coil';
      if ((ctx.night || ctx.wind > 12) && rnd() < 0.5 && PT.door && !ctx.open) return {k:PT.door.k, h:0, task:null, inside:'in', until:nowS() + 40 + rnd() * 80}; }
    if (act === 'sit') act = 'lean';
    // the lee side when it blows: the rail places whose way out is away from the wind are preferred (the wind's side is a guess by heading)
    const pick = leans[Math.floor(rnd() * leans.length)];
    return {k:pick.k, h:pick.h, task:act === 'lean' ? 'lean' : act, until:nowS() + 30 + rnd() * 60, idle:true};
  }
  // ---- the agents follow the people aboard ----
  function sync(ctx){
    const seen = new Set(), used = {}, pend = [], t = nowS();
    for (const p of ctx.WA){ const id = p.c ? 'c' + p.c.id : 'me'; seen.add(id); let a = A.find(q => q.id === id);
      if (!a){ a = {id, me:!p.c, c:p.c, x:0, y:0, z:0, h:0, cell:-1, goal:null, path:null, pi:0, mode:'in', task:null, st:null, blend:0, kind:null, slot:-1}; A.push(a); }
      a.c = p.c; a.st = p.st; const g = a.goal, kind = kindOf(p.st);
      // the same kind of work as before, and not an idle spell that is over: the place is kept (nobody swaps the table for the tub each minute)
      const keep = g && a.kind === kind && !(g.idle && g.until < t) && !(g.inside === 'in' && g.until && g.until < t && p.st === 'pause' && !ctx.underway) && !(ctx.away && g);
      if (keep){ if (a.slot >= 0) (used[kind] || (used[kind] = new Set())).add(a.slot); } else pend.push([p, a, kind]); }
    for (const [p, a, kind] of pend){ let n = 0; const U = used[kind] || (used[kind] = new Set()); while (U.has(n)) n++; U.add(n);
      a.goal = goalOf(p, ctx, n); a.kind = kind; a.slot = n; a.path = null; a.sub = null; a.nextCarry = t + 25 + rnd() * 40; }
    for (let i = A.length - 1; i >= 0; i--) if (!seen.has(A[i].id)) A.splice(i, 1);
  }
  // everyone straight to their place (the first frame, a change of boat, the clock run on)
  function snap(){ for (const a of A){ a.sub = null; if (!a.goal){ a.mode = 'in'; continue; } const p = ST.M.at(a.goal.k); a.x = p[0]; a.y = p[1]; a.z = p[2]; a.cell = a.goal.k; a.h = a.goal.h; a.task = a.goal.task; a.mode = a.goal.inside ? a.goal.inside : 'at'; a.path = null; } }
  function tick(dt){
    if (!ready()) return; dt = Math.min(0.1, Math.max(0, dt || 0)); ST.clk += dt; const t = nowS();
    const jump = ST.lastSim == null || Math.abs(S.t - ST.lastSim) > 30 || (src && src.jump && src.jump()); ST.lastSim = S.t;
    if (!ST.ctx || t - ST.ctxT > 1){ ST.ctx = context(); ST.ctxT = t; sync(ST.ctx); }
    if (jump){ snap(); return; }
    const M = ST.M, ctx = ST.ctx, roll = Math.abs(ST.roll || 0), spd = WALK * (roll > 0.21 ? 0 : roll > 0.14 ? 0.65 : 1);
    for (const a of A){
      // the errand: the one gutting carries a box of fish from the table to the hold hatch now and then, and walks back (1.5 of the plan)
      if (a.sub){ if (a.sub.done && t > a.sub.done){ a.sub = null; a.path = null; } }
      else if (a.goal && a.mode === 'at' && a.goal.task === 'gut' && (a.nextCarry || 0) < t){ const d = ST.G.deck || {z:0}, k = M.near(0, d.z, 2.5);
        if (k >= 0 && k !== a.goal.k && !a.goal.idle){ a.sub = {k, h:Math.PI, task:'stack', carry:true, hold:2.5}; a.path = null; } a.nextCarry = t + 35 + rnd() * 40; }
      const g = a.sub || a.goal;
      if (!g){ a.mode = 'in'; continue; }
      // inside, and now wanted on deck: out through the door
      if (a.mode === 'in' || a.mode === 'helm'){ if (g.inside && a.cell === g.k){ a.task = g.task; a.mode = g.inside; continue; }
        const d = ST.PT.door ? ST.PT.door.k : g.k, p = M.at(d); a.x = p[0]; a.y = p[1]; a.z = p[2]; a.cell = d; a.mode = 'at'; a.path = null; }
      if (a.cell !== g.k || a.mode === 'walk'){
        if (!a.path){ let from = M.cellOf(a.x, a.z); if (!M.ok(from)) from = M.near(a.x, a.z, 2); if (from < 0){ snap(); return; }
          a.path = deckPath(M, from, g.k) || [g.k]; a.pi = 1; a.mode = 'walk'; a.blend = 0; }
        // along the way: towards the next cell's centre, turning as it goes, and slowly or not at all when she rolls hard
        const q = M.at(a.path[Math.min(a.pi, a.path.length - 1)]), dx = q[0] - a.x, dz = q[2] - a.z, dist = Math.hypot(dx, dz);
        const want = Math.atan2(dx, -dz); let dh = dist > 1e-3 ? want - a.h : 0; while (dh > Math.PI) dh -= 2 * Math.PI; while (dh < -Math.PI) dh += 2 * Math.PI;
        a.h += Math.max(-TURN * dt, Math.min(TURN * dt, dh)); const climb = Math.abs(q[1] - a.y) > 0.4 ? 0.45 : 1, step = spd * climb * dt * (Math.abs(dh) > 1.2 ? 0.3 : 1);
        a.mode = 'walk'; a.task = a.sub && a.sub.carry ? 'carry' : null; a.near = dist;
        if (dist <= step + 1e-6){ a.x = q[0]; a.z = q[2]; a.y = q[1]; a.cell = a.path[Math.min(a.pi, a.path.length - 1)]; a.pi++;   // the point is reached this very step: no jump, ever
          if (a.pi >= a.path.length){ a.mode = g.inside ? g.inside : 'at'; a.task = g.task; a.path = null; a.cell = g.k; a.blend = 0; if (a.sub && !a.sub.done) a.sub.done = t + (a.sub.hold || 2); continue; } }
        else { a.x += dx / dist * step; a.z += dz / dist * step; const fy = M.floorAt(a.x, a.z); a.y = fy === fy ? fy : a.y + (q[1] - a.y) * Math.min(1, step / Math.max(dist, 1e-3)); }
      } else {
        // at the place: turn to face the work, and the blend into its pose
        let dh = g.h - a.h; while (dh > Math.PI) dh -= 2 * Math.PI; while (dh < -Math.PI) dh += 2 * Math.PI; a.h += Math.max(-TURN * dt, Math.min(TURN * dt, dh));
        a.blend = Math.min(1, a.blend + dt / 0.4); a.task = g.task; if (g.inside && Math.abs(dh) < 0.3) a.mode = g.inside; }
    }
    // nobody walks through anybody: two within 0.45 m push apart a little, sideways
    for (let i = 0; i < A.length; i++) for (let j = i + 1; j < A.length; j++){ const a = A[i], b = A[j]; if (a.mode === 'in' || b.mode === 'in' || a.mode === 'helm' || b.mode === 'helm') continue;
      const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz); if (d > 0.45 || d < 1e-4) continue; const push = Math.min(0.03, (0.45 - d) * 0.3), nx = -dz / d, nz = dx / d;
      // (not when the walker is about to arrive next to the other: the places by the table and the tub are that close)
      for (const [o, s] of [[a, -1], [b, 1]]){ if (o.mode !== 'walk' || o.near < 0.6) continue; const x = o.x + nx * push * s, z = o.z + nz * push * s; if (ST.M.ok(ST.M.cellOf(x, z))){ o.x = x; o.z = z; } } }
  }
  // for the view: the agents to draw (not those inside), and where a crew member stands for the line over his head
  function agents(){ return A; }
  function visible(){ return A.filter(a => a.mode !== 'in' && a.goal); }
  function anchorOf(cid){ const a = A.find(q => q.c && q.c.id === cid); return a && a.mode !== 'in' ? a : null; }
  return {tick, agents, visible, anchorOf, on, setJig, setRoll, reset, _st:ST};
}
const CREW3D = crewSim(null);
// the context of another boat as the view knows her (core/05-vessels.js npcStates: st fishing, in, out or port; a player's boat
// sends her state the same way): the skipper and two hands when fishing, the skipper at the wheel and the hands inside under way,
// nobody on deck in port. The people are stand-ins with an id, so the places are kept from minute to minute.
function npcCrewCtx(n, G){
  const H = S.t / 60, hr = typeof gDate === 'function' ? gDate(H).getUTCHours() : 12, wind = typeof windAt === 'function' ? windAt(H, n.p) : 0;
  const hands = [{id:String(n.id) + '0', traits:[]}, {id:String(n.id) + '1', traits:[]}], fishing = n.st === 'fishing', port = n.st === 'port';
  const WA = port ? [] : fishing ? [{c:null, st:'fiske'}, {c:hands[0], st:'sloy'}, {c:hands[1], st:'fiske'}] : [{c:null, st:'ror'}, {c:hands[0], st:'pause'}, {c:hands[1], st:'pause'}];
  return {away:false, underway:!fishing && !port, port, hasBunks:false, open:!!(G && G.open), deckTask:'gut', wind, night:hr >= 22 || hr < 6, WA, aground:false, fishing};
}
