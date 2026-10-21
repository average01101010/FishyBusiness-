'use strict';
// ===== CREW3D: the people aboard as agents who walk the deck (docs/mannskap-plan.md, del 1; Jonas 17.10.2026: no teleporting) =====
// The simulation says what each person does (core/13-work.js workAssign, every game minute); this says where they are on the way to
// it, in the boat's own frame, over the deck map read off the model (vessel3d.js deckMap). The 3D view (view3d.js) draws the agents
// where they stand and walk; nothing here touches WebGL, and nothing here is saved: the agents are the view of the game, not the game.
// Opening the game, or coming back after the clock has run on (catchUp), puts everyone at their place at once; from then on they walk.
// One sim per boat (crewSim): the own boat's reads the game (CREW3D); another player's or an NPC boat's gets its type, state and
// people from the view (view3d.js drawNPC), so the same walking, places and idle life show on every boat near enough to see them.
// Each station has its own place on the deck (Jonas 20.10.2026, tilbakemelding #75: «To av mannskapet står også inni hverandre»): the
// hauler, the one picking the net beside him, the bleeder where the fish are shaken off the hook, the gutting table, the packing and
// icing by the bleeding tub, the line tubs for baiting and stripping, the rail by the nets for mending. Every agent has a cell of its own
// (no two closer than 0.4 m), and the kit the game draws on the deck (the tubs, the table, the line tubs, the nets, the freight) is
// taken out of the walking map, so nobody stands in a tub or walks through the table.
function crewSim(src){
  const A = [];                          // the agents, one per person aboard who is up: {id, me, c, x, y, z, h, cell, goal, path, pi, mode, task, idle, blend}
  const ST = {type:null, M:null, M0:null, PT:null, PL:null, kitSig:'', jig:null, lastSim:null, ctxT:0, ctx:null, seed:(src && src.seed) || 1, clk:0, helmView:false, crates:-1, crateFill:0};
  const WALK = 1.2, TURN = 4.5, SEP = 0.4, CRATE_KG = 40;   // m/s on a flat deck, rad/s turning on the spot, m between two people standing, kg of fish in a packed box
  const rnd = () => { ST.seed = (ST.seed * 1664525 + 1013904223) >>> 0; return ST.seed / 4294967296; };
  const nowS = () => ST.clk;             // the agents' own clock, in seconds of ticks (real time in the game, the test's ticks in the test)
  function reset(){ A.length = 0; ST.type = null; ST.lastSim = null; }
  // the boat's type, its deck map and places; false while the boat has none (the hand-worked boats keep their seated figures)
  function ready(){
    const t = src ? src.type() : S && S.boat && S.boat.type; if (!t || typeof deckMap !== 'function') return false;
    if (ST.type !== t){ ST.type = t; ST.M0 = ST.M = deckMap(t); ST.PT = ST.M ? deckPoints(t) : null; ST.G = typeof geoOf === 'function' ? geoOf(t) : null; ST.PL = null; ST.kitSig = ''; A.length = 0; ST.lastSim = null; ST.ctx = null; ST.ctxT = 0; ST.crates = -1; }
    return !!(ST.M && ST.PT && ST.G && !ST.G.hand && ST.PT.sloy);
  }
  const on = () => ready();
  // the jigging places the view found on the rail (view3d.js jigRail): the hands stand inboard of the machines
  function setJig(spots){ ST.jig = spots || null; }
  function setRoll(r){ ST.roll = r || 0; }
  // the skipper sits at the wheel in the bridge view: someone else takes his place on deck (the view does not draw him from his own eyes)
  function setHelm(v){ ST.helmView = !!v; }

  // ---- the kit on the deck, out of the walking map ----
  // what the game draws on the model's places (view3d.js drawDeck, rigAt, drawLineTubs, drawNetTub, drawCargo, drawCrane), as boxes in the
  // boat's frame: [x, z, half width, half length, turn]; the line tubs and the nets only while they are aboard and rigged or worked
  function kitBoxes(){
    const G = ST.G, d = G.deck || {y:G.gw, z:0}, W = G.work, K = G.kit || {}, Bm = G.beam || 3, V = VESSELS[ST.type] || {}, out = [];
    const box = (x, z, w, l, ry) => out.push([x, z, w / 2 + 0.06, l / 2 + 0.06, ry || 0]);
    const tu = W ? W.tub : [Bm / 2 - 0.62, d.y, d.z + 0.35], s = (W && W.s) || 1; box(tu[0], tu[2], 0.72 * s, 1.08 * s);
    if (!(W && W.own)){ const tb = W ? W.table : [-(Bm / 2 - 0.42), d.y, d.z]; box(tb[0], tb[2], 0.62, V.len >= 10 ? 1.6 : 1.15); }
    if (G.hauler) box(Bm / 2 - 0.2, G.hauler[2], 0.35, 0.4);
    for (const q of K.tubs || []){ const big = (q[4] || 460) > 300; box(q[0], q[2], big ? 1.0 : 0.72, big ? 1.2 : 1.08, q[3]); }
    if (K.crane && K.crane.at) box(K.crane.at[0], K.crane.at[2], 0.9, 0.9);
    if (!src && S.pgear){ const g = rigGear();
      if (g.tubs > 0 && K.stamps){ const rows = Math.ceil(Math.min(V.len < 8 ? 4 : 8, g.tubs) / 2), ry = K.stamps.ry || 0, c = Math.cos(ry), sn = Math.sin(ry), lx = 0.26, lz = (rows - 1) * 0.25;
        box(K.stamps.at[0] + lx * c + lz * sn, K.stamps.at[2] - lx * sn + lz * c, 0.78, rows * 0.5 + 0.02, ry); }
      if (g.nets && K.garn) box(K.garn.at[0], K.garn.at[2], 1.0, 1.2, K.garn.ry);
      const kg = typeof cargoKg === 'function' ? Math.min(cargoKg(), BOAT.deckCargo || 0) : 0, nc = kg > 0 && K.cargo ? Math.min(K.cargo.length, Math.ceil(kg / 250)) : 0;
      for (let i = 0; i < nc; i++){ const q = K.cargo[i]; box(q[0], q[2], 0.8, 1.2, q[3]); } }
    return out;
  }
  // the gear on deck now: the line tubs (aboard, being baited or stripped) and the nets (aboard or being mended), as view3d.js draws them
  function rigGear(){
    const pg = S.pgear, b = S.boat, rig = typeof rigOf === 'function' ? rigOf() : b.rig, L = pg.lines || {}, J = S.jobs || [];
    const worked = J.filter(j => (j.kind === 'egn' || j.kind === 'strip') && !j.shop).reduce((a, j) => a + (j.n || 0), 0);
    const tubs = (rig === 'line' ? (L.hyse ? L.hyse.n : 0) + (L.bank ? L.bank.n : 0) : 0) + worked;
    const nets = (rig === 'garn' && (pg.nets || []).length > 0) || J.some(j => j.kind === 'mend' && !j.shop);
    return {tubs, nets};
  }
  function overlay(M0, boxes){
    const N = M0.nx * M0.nz, H = Float32Array.from(M0.h); let n = 0;
    for (let k = 0; k < N; k++){ if (H[k] !== H[k]) continue; const i = k % M0.nx, x = M0.x0 + (i + 0.5) * M0.c, z = M0.z0 + ((k - i) / M0.nx + 0.5) * M0.c;
      for (const [cx, cz, hx, hz, ry] of boxes){ const dx = x - cx, dz = z - cz, c = Math.cos(ry), s = Math.sin(ry); if (Math.abs(dx * c - dz * s) <= hx && Math.abs(dx * s + dz * c) <= hz){ H[k] = NaN; n++; break; } } }
    if (!n) return M0;
    const M = Object.assign({}, M0, {h:H, kit:n}), at = k => { const i = k % M0.nx; return [M0.x0 + (i + 0.5) * M0.c, H[k], M0.z0 + ((k - i) / M0.nx + 0.5) * M0.c]; };
    M.at = at; M.ok = k => k >= 0 && H[k] === H[k]; M.floorAt = (x, z) => { const k = M0.cellOf(x, z); return k >= 0 && H[k] === H[k] ? H[k] : NaN; };
    M.near = (x, z, r = 1.5) => { let best = -1, bd = r * r; for (let k = 0; k < N; k++){ if (H[k] !== H[k]) continue; const p = at(k), d = (p[0] - x) ** 2 + (p[2] - z) ** 2; if (d < bd){ bd = d; best = k; } } return best; };
    return M;
  }
  // the walking map with the kit out (built again when the gear on deck changes: rigged for something else, tubs baited, freight)
  function walkMap(){
    if (src){ ST.M = ST.M || ST.M0; return; }
    const g = S.pgear ? rigGear() : {tubs:0, nets:false}, kg = typeof cargoKg === 'function' ? Math.ceil(Math.min(cargoKg(), BOAT.deckCargo || 0) / 250) : 0, sig = g.tubs + '|' + g.nets + '|' + kg;
    if (sig === ST.kitSig) return; ST.kitSig = sig; ST.M = overlay(ST.M0, kitBoxes()); ST.PL = null;
    for (const a of A) a.path = null;   // (the ways are found again over the new map)
  }

  // ---- where the work is on this deck: [x, z, heading, task] in the boat's frame (the heading as the view draws it: 0 forward, +pi/2 to starboard) ----
  const face = (x, z, tx, tz) => Math.atan2(tx - x, -(tz - z));
  function places(){
    if (ST.PL) return ST.PL; const G = ST.G, d = G.deck || {y:G.gw, z:0}, Bm = G.beam || 3, HP = G.hauler || [Bm / 2 * 0.92, d.y + 1, d.z - 1.3], sg = HP[0] >= 0 ? 1 : -1, W = G.work, K = G.kit || {};
    const tub = W ? [W.tub[0], W.tub[2]] : [Bm / 2 - 0.62, d.z + 0.35];
    // the hauler shakes the fish off the hook onto the deck just inboard of him (drop); the bleeder stands aft of that, facing it
    const drop = [HP[0] - sg * 0.95, HP[2] + 0.4], bl = [drop[0] - sg * 0.3, drop[1] + 0.62];
    const PL = {sg, tub, drop, hatch:[0, d.z],
      haul:[[HP[0] - sg * 0.55, HP[2] + 0.2, sg * Math.PI / 2, 'haul'], [HP[0] - sg * 0.55, HP[2] - 0.55, sg * Math.PI / 2, 'haul']],
      pick:[HP[0] - sg * 0.62, HP[2] + 0.95, sg * Math.PI * 0.62, 'pick'], pot:[HP[0] - sg * 1.0, HP[2] + 0.9, sg * Math.PI * 0.5, 'tend'],
      bleed:[bl[0], bl[1], face(bl[0], bl[1], drop[0], drop[1]), 'bleedst']};
    // the line tubs (rigAt: two across from the model's place, turned with it): one baiter or stripper to a tub, inboard of it, facing it
    const sp = K.stamps ? K.stamps : {at:[Bm / 2 * 0.25, d.y, d.z - 0.6], ry:0}, c = Math.cos(sp.ry || 0), s = Math.sin(sp.ry || 0);
    PL.tubY = sp.at[1]; PL.tubs = []; for (let i = 0; i < 8; i++){ const lx = (i % 2) * 0.52, lz = Math.floor(i / 2) * 0.5, x = sp.at[0] + lx * c + lz * s, z = sp.at[2] - lx * s + lz * c; PL.tubs.push([x, z]); }
    // (each sits at his tub on the side clear of the other tubs and of those already sitting, on the deck: the tubs stand two by two)
    const sides = [[-1, 0], [1, 0], [0, -1], [0, 1]], seats = [];
    PL.tubAt = i => { if (seats[i % 8]) return seats[i % 8]; const T = PL.tubs[i % 8]; let best = null, bv = -1;
      for (const [sx, sz] of sides){ const lx = sx * 0.68, lz = sz * 0.68, x = T[0] + lx * c + lz * s, z = T[1] - lx * s + lz * c, k = ST.M0.near(x, z, 0.25); if (k < 0) continue;
        let m = 9; for (let j = 0; j < 8; j++) if (j !== i % 8) m = Math.min(m, Math.hypot(PL.tubs[j][0] - x, PL.tubs[j][1] - z) * 1.4); for (const q of seats) if (q) m = Math.min(m, Math.hypot(q[0] - x, q[1] - z));
        if (m > bv){ bv = m; best = [x, z, face(x, z, T[0], T[1]), 'egn']; } }
      if (!best){ const L = Math.hypot(T[0], T[1] - d.z) || 1, x = T[0] - T[0] / L * 0.62, z = T[1] - (T[1] - d.z) / L * 0.62; best = [x, z, face(x, z, T[0], T[1]), 'egn']; }
      return (seats[i % 8] = best); };
    // the nets are mended over the rail by their tub: along the ship's side nearest it, fore and aft of it, 0.9 m apart, facing out
    const gn = K.garn ? K.garn.at : [Bm / 2 * 0.3, d.y, d.z - 0.6], gs = gn[0] < -0.2 ? -1 : 1, M = ST.M, rail = [];
    for (let k = 0; k < M.nx * M.nz; k++){ if (!M.ok(k)) continue; const p = M.at(k); if (Math.sign(p[0]) !== gs || Math.abs(p[1] - gn[1]) > 0.5 || Math.abs(p[2] - gn[2]) > 3.5) continue;
      if (M.ok(M.cellOf(p[0] + gs * M.c, p[2])) || Math.abs(p[0]) < Bm / 2 - 0.8) continue; rail.push([p[0], p[2], gs * Math.PI / 2, Math.abs(p[2] - gn[2]) + Math.abs(p[0] - gn[0]) * 0.3]); }
    rail.sort((a, b) => a[3] - b[3]);
    PL.mend = []; for (const r of rail){ if (PL.mend.length >= 4) break; if (PL.mend.some(q => Math.hypot(q[0] - r[0], q[1] - r[1]) < 0.9)) continue; PL.mend.push([r[0] - gs * 0.12, r[1], r[2], 'mend']); }
    PL.cargo = K.cargo && K.cargo[0] ? [K.cargo[0][0] + 0.9, K.cargo[0][2], -Math.PI / 2, 'guide'] : null;
    return (ST.PL = PL);
  }
  const near = (x, z, r) => ST.M.near(x, z, r || 1.5);
  const at = (q, r) => { if (!q) return null; const c = near(q[0], q[1], r || 1.2); return c >= 0 ? {k:c, h:q[2], task:q[3]} : null; };
  function jigSpot(k){ const J = ST.jig; if (J && J.length){ const P = J[k % J.length], sg = P[0] >= 0 ? 1 : -1, c = near(P[0] - sg * 0.45, P[2], 1.2); if (c >= 0) return {k:c, h:sg * Math.PI / 2, task:'jig', jig:k % J.length}; }
    const sp = ST.PT['spot' + k] || ST.PT.spot0; return sp ? {k:sp.k, h:sp.h || 0, task:'jig'} : null; }
  // the n-th at the gutting table or the tub: the place from the anchors, the next along the table's side
  // (the side of the first that is a short walk from it: a place across a bar or a step would be a detour round the deck)
  function deckAt(q, n, task){ if (!q) return null; if (!n) return {k:q.k, h:q.h || 0, task}; const p = ST.M0.at(q.k), d = 0.7 * Math.ceil(n / 2); let best = null, bl = 1e9;
    for (const s of [1, -1]){ const c = near(p[0], p[2] + s * d, 0.5); if (c < 0) continue; const P = deckPath(ST.M, ST.M.ok(q.k) ? q.k : near(p[0], p[2], 1), c); if (!P) continue;
      let L = 0; for (let i = 1; i < P.length; i++){ const A0 = ST.M.at(P[i - 1]), B0 = ST.M.at(P[i]); L += Math.hypot(B0[0] - A0[0], B0[2] - A0[2]) + (ST.M.LINK[P[i - 1]] && ST.M.LINK[P[i - 1]].includes(P[i]) ? 3 : 0); }
      if (L < bl){ bl = L; best = c; } }
    return {k:best != null && bl < d * 2.5 + 0.6 ? best : q.k, h:q.h || 0, task}; }

  // ---- what the game says: everyone's station this minute, and the boat's state ----
  function context(){
    if (src) return src.ctx(ST.G);
    const b = S.boat, G = ST.G, H = S.t / 60, hr = typeof gDate === 'function' ? gDate(H).getUTCHours() : 12;
    const away = typeof meAboard === 'function' && meAboard() && typeof restAshore === 'function' && restAshore();   // the skipper rests ashore: the crew sleep there too (Jonas 06.10.2026)
    const underway = b.status === 'sailing' && !b.gop, port = b.status === 'port', hasBunks = typeof bunks === 'function' && !!bunks(b);
    const DK = typeof deckPending === 'function' && S.hold && S.hold.length && deckPending() > 0.5, gutting = DK && typeof catchGut === 'function' && catchGut() && S.hold.some(x => !x.gut && !x.iced);
    const wind = typeof windAt === 'function' ? windAt(H, b.pos) : 0, night = hr >= 22 || hr < 6;
    let WA = typeof workAssign === 'function' ? workAssign() : [];
    // in the bridge view the skipper is at the wheel: the one with the least to do takes his station on deck
    const me = WA.find(p => !p.c);
    if (ST.helmView && me && ['haling', 'blogg', 'sloy', 'is', 'sort'].includes(me.st)){
      const sub = ['pause', 'is', 'sloy', 'blogg'].map(k => WA.find(p => p.c && p.st === k && p !== me)).find(Boolean);
      if (sub){ WA = WA.map(p => Object.assign({}, p)); const m2 = WA.find(p => !p.c), s2 = WA.find(p => p.c === sub.c); [s2.st, s2.role, s2.bl, s2.jw] = [m2.st, m2.role, m2.bl, m2.jw]; m2.st = 'ror'; m2.role = null; } }
    // the packed boxes of fish (40 kg each, the iced catch): a hold boat's go down the hatch as they fill (the errand), an open boat's catch lies in her tubs
    const iced = (S.hold || []).reduce((a, x) => a + (x.iced && !(SPECIES[x.sp] || {}).live ? x.kg : 0), 0), holdBoat = ((VESSELS[ST.type] || {}).hold || {}).kind !== 'dekk';
    return {away, underway, port, hasBunks, open:!!G.open, deckTask:gutting ? 'gut' : 'pack', wind, night, WA, aground:b.status === 'aground', fishing:b.status === 'fishing', crates:holdBoat ? Math.floor(iced / CRATE_KG) : -1, crateFill:holdBoat ? (iced % CRATE_KG) / CRATE_KG : 0};
  }
  // the agent's goal from the context, for the n-th person on its station (the first at the table, the second beside him ...): null means
  // inside (the house, the bunks, ashore), not drawn
  function goalOf(p, ctx, n){
    const PT = ST.PT, PL = places(), st = p.st;
    if (ctx.away) return null;
    if (st === 'ror'){ if (PT.ror) return {k:PT.ror.k, h:PT.ror.h || 0, task:'helm', inside:'helm'}; return PT.door ? {k:PT.door.k, h:0, task:'helm', inside:'helm'} : null; }
    if (ctx.underway && !ctx.open && st === 'pause') return PT.door ? {k:PT.door.k, h:0, task:null, inside:'in'} : null;   // under way the crew are inside (03.10.2026)
    if (ctx.port && ctx.hasBunks && !ctx.open && p.c && p.c.fatigue >= 1 && st === 'pause') return PT.door ? {k:PT.door.k, h:0, task:null, inside:'in'} : null;   // asleep in the bunks (tilbakemelding #65)
    if (st === 'sloy') return deckAt(PT.sloy, n, 'gut') || idleGoal(p, ctx, 'look');
    // (on a boat with a hold the packer turns his back to the bleeding tub: the box he packs stands on the deck before him, by the hatch)
    if (st === 'is'){ const g = deckAt(PT.is, n, 'pack'); if (g && ((VESSELS[ST.type] || {}).hold || {}).kind !== 'dekk') g.h = (g.h || 0) + Math.PI; return g || idleGoal(p, ctx, 'look'); }
    if (st === 'sort') return at(PL.pot, 1.4) || idleGoal(p, ctx, 'look');
    if (st === 'blogg') return at(PL.bleed, 1.4) || idleGoal(p, ctx, 'look');
    if (st === 'haling'){ const q = p.role === 'plukk' ? at(PL.pick, 1.4) : p.role === 'teine' ? at(PL.pot, 1.4) : at(PL.haul[Math.min(1, n)], 1.4); return q || idleGoal(p, ctx, 'look'); }
    if (st === 'fiske'){ const q = jigSpot(n); return q || idleGoal(p, ctx, 'lean'); }
    if (st === 'stell' && p.jw && (p.jw.kind === 'pr' || p.jw.kind === 'jg')){ const q = at(PL.pot, 1.4); return q || idleGoal(p, ctx, 'coil'); }   // (the pots and the jig sets are seen to by the hauler's side)
    if (st === 'egn' || st === 'strip' || st === 'stell'){ const q = at(PL.tubAt(n), 1.2); if (q){ q.task = st === 'stell' ? 'egn' : st; q.tub = n; } return q || idleGoal(p, ctx, 'coil'); }
    if (st === 'mend'){ const q = PL.mend[n % Math.max(1, PL.mend.length)], g = q ? at(q, 1.0) : null; if (g) g.task = 'mend'; return g || idleGoal(p, ctx, 'coil'); }
    if (st === 'last') return at(PL.cargo, 1.6) || idleGoal(p, ctx, 'look');
    if (st === 'kokk') return PT.door ? {k:PT.door.k, h:0, task:null, inside:'in'} : null;
    return idleGoal(p, ctx);
  }
  // the station and its part (at the hauler: the hauler, the picker, the pot hand): a person keeps the place while it stays the same
  const kindOf = p => p.st === 'haling' ? 'haling:' + (p.role === 'haler' ? 'h' : p.role) : p.st;
  // ---- a free person: something to do for a while, by the weather, the hour and their nature ----
  const IDLE = ['lean', 'lean', 'look', 'coffee', 'coil', 'sweep', 'sit'];
  function idleGoal(p, ctx, force){
    const PT = ST.PT, T = p.c && p.c.traits || [], id = p.c ? 'c' + p.c.id : 'me', leans = (PT.lean || []).filter(l => ST.M.ok(l.k) && free(l.k, id)); if (!leans.length) return PT.sloy ? {k:PT.sloy.k, h:0, task:'look'} : null;
    let act = force || IDLE[Math.floor(rnd() * IDLE.length)];
    if (!force){ if (T.includes('makelig') && rnd() < 0.5) act = rnd() < 0.5 ? 'lean' : 'coffee'; if ((T.includes('arbeidsjern') || T.includes('perfeksjonist')) && rnd() < 0.5) act = rnd() < 0.5 ? 'sweep' : 'coil';
      if ((ctx.night || ctx.wind > 12) && rnd() < 0.5 && PT.door && !ctx.open) return {k:PT.door.k, h:0, task:null, inside:'in', until:nowS() + 40 + rnd() * 80}; }
    if (act === 'sit') act = 'lean';
    // the lee side when it blows: the rail places whose way out is away from the wind are preferred (the wind's side is a guess by heading)
    const pick = leans[Math.floor(rnd() * leans.length)];
    return {k:pick.k, h:pick.h, task:act === 'lean' ? 'lean' : act, until:nowS() + 30 + rnd() * 60, idle:true};
  }
  // ---- a cell of one's own: the goals already given are taken, and a new one at least SEP from them (the nearest free cell within a metre) ----
  const TAKEN = new Map();
  function free(k, id){ const p = ST.M.at(k); for (const [c, who] of TAKEN){ if (who === id) continue; const q = ST.M.at(c); if (Math.hypot(p[0] - q[0], p[2] - q[2]) < SEP) return false; } return true; }
  function claim(g, id){
    if (!g || g.inside) return g; const M = ST.M;
    if (!M.ok(g.k) || !free(g.k, id)){ const p = ST.M0.at(g.k); let best = -1, bd = 1.0;
      const i0 = g.k % M.nx, j0 = (g.k - i0) / M.nx, R = Math.ceil(1.0 / M.c);
      for (let dj = -R; dj <= R; dj++) for (let di = -R; di <= R; di++){ const i = i0 + di, j = j0 + dj; if (i < 0 || j < 0 || i >= M.nx || j >= M.nz) continue; const k = j * M.nx + i; if (!M.ok(k)) continue;
        const q = M.at(k), d = Math.hypot(q[0] - p[0], q[2] - p[2]); if (d < bd && free(k, id)){ bd = d; best = k; } }
      if (best >= 0) g.k = best; }
    TAKEN.set(g.k, id); return g;
  }
  // ---- the agents follow the people aboard ----
  function sync(ctx){
    const seen = new Set(), used = {}, pend = [], t = nowS(); TAKEN.clear();
    for (const p of ctx.WA){ const id = p.c ? 'c' + p.c.id : 'me'; seen.add(id); let a = A.find(q => q.id === id);
      if (!a){ a = {id, me:!p.c, c:p.c, x:0, y:0, z:0, h:0, cell:-1, goal:null, path:null, pi:0, mode:'in', task:null, st:null, blend:0, kind:null, slot:-1}; A.push(a); }
      a.c = p.c; a.st = p.st; a.role = p.role || null; a.jw = p.jw || null; const g = a.goal, kind = kindOf(p);
      // the same station as before, and not an idle spell that is over: the place is kept (nobody swaps the table for the tub each minute);
      // an idle spell on deck ends as she gets under way on a boat with a house, so the crew go in (Jonas 21.10.2026: they stood leaning
      // over the rail at 23 knots for a minute and a half, as if jigging)
      const keep = g && a.kind === kind && !(g.idle && g.until < t) && !(g.idle && ctx.underway && !ctx.open) &&!(g.inside === 'in' && g.until && g.until < t && p.st === 'pause' && !ctx.underway) && !(ctx.away && g) && (g.inside || ST.M.ok(g.k));
      if (keep){ if (a.slot >= 0) (used[kind] || (used[kind] = new Set())).add(a.slot); if (!g.inside) TAKEN.set(g.k, id); } else pend.push([p, a, kind]); }
    for (const [p, a, kind] of pend){ let n = 0; const U = used[kind] || (used[kind] = new Set()); while (U.has(n)) n++; U.add(n);
      a.goal = claim(goalOf(p, ctx, n), a.id); a.kind = kind; a.slot = n; a.path = null; a.sub = null; }
    for (let i = A.length - 1; i >= 0; i--) if (!seen.has(A[i].id)) A.splice(i, 1);
    // a box of fish is full: the packer (else the gutter) carries it to the hatch and lowers it into the hold, and comes back (1.5 of the plan)
    if (ctx.crates >= 0){ if (ST.crates >= 0 && ctx.crates > ST.crates){ const pk = A.find(a => a.st === 'is'), w = pk ? (pk.mode === 'at' && !pk.sub ? pk : null) : A.find(a => a.st === 'sloy' && a.mode === 'at' && !a.sub);
        const PL = places(), k = w ? near(PL.hatch[0], PL.hatch[1], 2.5) : -1; if (w && k >= 0 && k !== w.goal.k){ w.sub = {k, h:w.h, task:'stow', carry:'crate', hold:2.2}; w.path = null; } }
      ST.crates = ctx.crates; }
    ST.crateFill = ctx.crateFill || 0;
  }
  // everyone straight to their place (the first frame, a change of boat, the clock run on)
  function snap(){ for (const a of A){ a.sub = null; if (!a.goal){ a.mode = 'in'; continue; } const p = ST.M.at(a.goal.k); a.x = p[0]; a.y = p[1]; a.z = p[2]; a.cell = a.goal.k; a.h = a.goal.h; a.task = a.goal.task; a.mode = a.goal.inside ? a.goal.inside : 'at'; a.path = null; } }
  function tick(dt){
    if (!ready()) return; dt = Math.min(0.1, Math.max(0, dt || 0)); ST.clk += dt; const t = nowS();
    const jump = ST.lastSim == null || Math.abs(S.t - ST.lastSim) > 30 || (src && src.jump && src.jump()); ST.lastSim = S.t;
    if (!ST.ctx || t - ST.ctxT > 1){ walkMap(); ST.ctx = context(); ST.ctxT = t; if (jump) ST.crates = -1; sync(ST.ctx); }
    if (jump){ snap(); return; }
    const M = ST.M, roll = Math.abs(ST.roll || 0), spd = WALK * (roll > 0.21 ? 0 : roll > 0.14 ? 0.65 : 1);
    for (const a of A){
      if (a.sub && a.sub.done && t > a.sub.done){ a.sub = null; a.path = null; }
      const g = a.sub || a.goal;
      if (!g){ a.mode = 'in'; continue; }
      // inside, and now wanted on deck: out through the door
      if (a.mode === 'in' || a.mode === 'helm'){ if (g.inside && a.cell === g.k){ a.task = g.task; a.mode = g.inside; continue; }
        const d = ST.PT.door ? ST.PT.door.k : g.k, p = M.ok(d) ? M.at(d) : ST.M0.at(d); a.x = p[0]; a.y = p[1]; a.z = p[2]; a.cell = d; a.mode = 'at'; a.path = null; }
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
    // nobody walks through anybody: two within 0.45 m push apart a little, sideways; the one walking gives way (the places are 0.4 m apart at least)
    for (let i = 0; i < A.length; i++) for (let j = i + 1; j < A.length; j++){ const a = A[i], b = A[j]; if (a.mode === 'in' || b.mode === 'in' || a.mode === 'helm' || b.mode === 'helm') continue;
      const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz); if (d > 0.45 || d < 1e-4) continue; const push = Math.min(0.03, (0.45 - d) * 0.3), nx = -dz / d, nz = dx / d;
      // (not when the walker is about to arrive next to the other: the places by the table and the tub are that close)
      for (const [o, s] of [[a, -1], [b, 1]]){ if (o.mode !== 'walk' || o.near < 0.6) continue; const x = o.x + nx * push * s, z = o.z + nz * push * s; if (ST.M.ok(ST.M.cellOf(x, z))){ o.x = x; o.z = z; } } }
  }
  // for the view: the agents to draw (not those inside), and where a crew member stands for the line over his head
  function agents(){ return A; }
  function visible(){ return A.filter(a => a.mode !== 'in' && a.goal); }
  function anchorOf(cid){ const a = A.find(q => q.c && q.c.id === cid); return a && a.mode !== 'in' ? a : null; }
  return {tick, agents, visible, anchorOf, on, setJig, setRoll, setHelm, places:() => ready() ? places() : null, reset, _st:ST};
}
const CREW3D = crewSim(null);
// the context of another boat as the view knows her (core/05-vessels.js npcStates: st fishing, in, out or port; a player's boat
// sends her state the same way): the skipper and two hands when fishing, the skipper at the wheel and the hands inside under way,
// nobody on deck in port. The people are stand-ins with an id, so the places are kept from minute to minute.
function npcCrewCtx(n, G){
  const H = S.t / 60, hr = typeof gDate === 'function' ? gDate(H).getUTCHours() : 12, wind = typeof windAt === 'function' ? windAt(H, n.p) : 0;
  const hands = [{id:String(n.id) + '0', traits:[]}, {id:String(n.id) + '1', traits:[]}], fishing = n.st === 'fishing', port = n.st === 'port';
  const WA = port ? [] : fishing ? [{c:null, st:'fiske'}, {c:hands[0], st:'sloy'}, {c:hands[1], st:'fiske'}] : [{c:null, st:'ror'}, {c:hands[0], st:'pause'}, {c:hands[1], st:'pause'}];
  return {away:false, underway:!fishing && !port, port, hasBunks:false, open:!!(G && G.open), deckTask:'gut', wind, night:hr >= 22 || hr < 6, WA, aground:false, fishing, crates:-1, crateFill:0};
}
