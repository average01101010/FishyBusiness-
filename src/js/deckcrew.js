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
    if (ST.type !== t){ ST.type = t; ST.M0 = ST.M = deckMap(t); ST.PT = ST.M ? deckPoints(t) : null; ST.G = typeof geoOf === 'function' ? geoOf(t) : null; doorFace(); ST.PL = null; ST.kitSig = ''; A.length = 0; ST.lastSim = null; ST.ctx = null; ST.ctxT = 0; ST.crates = -1; }
    return !!(ST.M && ST.PT && ST.G && !ST.G.hand && ST.PT.sloy);
  }
  const on = () => ready();
  // the jigging places the view found on the rail (view3d.js jigRail): the hands stand inboard of the machines
  // the way to face at the door to go in: towards the point inside it (the model's anchors.doors[0].in), else forward as before
  function doorFace(){ const D = ST.PT && ST.PT.door, A0 = ST.G && ST.G.doors && ST.G.doors[0]; if (!D || !A0 || !A0.in || !ST.M.ok(D.k)) return; const p = ST.M.at(D.k);
    if (Math.hypot(A0.in[0] - p[0], A0.in[2] - p[2]) > 0.2) D.h = Math.atan2(A0.in[0] - p[0], -(A0.in[2] - p[2])); }
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
    const M = Object.assign({}, M0, {h:H, kit:n, comp:null, live:null}), at = k => { const i = k % M0.nx; return [M0.x0 + (i + 0.5) * M0.c, H[k], M0.z0 + ((k - i) / M0.nx + 0.5) * M0.c]; };
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
    if (st === 'ror'){ if (PT.ror) return {k:PT.ror.k, h:PT.ror.h || 0, task:'helm', inside:'helm'}; return PT.door ? {k:PT.door.k, h:PT.door.h || 0, task:'helm', inside:'helm'} : null; }
    // a break as the game chose it (core/13-work.js idleAssign): inside, asleep in the bunk and up at the shop are not on deck
    if (st === 'pause' && p.idle){ if (p.idle === 'inside' || p.idle === 'sleep' || p.idle === 'shop') return PT.door ? {k:PT.door.k, h:PT.door.h || 0, task:null, inside:'in'} : null; return idleGoal(p, ctx); }
    if (ctx.underway && !ctx.open && st === 'pause') return PT.door ? {k:PT.door.k, h:PT.door.h || 0, task:null, inside:'in'} : null;   // under way the crew are inside (03.10.2026)
    if (ctx.port && ctx.hasBunks && !ctx.open && p.c && p.c.fatigue >= 1 && st === 'pause') return PT.door ? {k:PT.door.k, h:PT.door.h || 0, task:null, inside:'in'} : null;   // asleep in the bunks (tilbakemelding #65)
    // the deck work under a shelter deck or below the weather deck (the 15 m coastal boat's table, the longliner's factory deck): the
    // place on the deck map is the deck over it, so they work inside, out of sight, and nobody reaches down through the deck
    const below = y => y != null && ST.M.ok((PT.sloy || {}).k) && Math.abs(ST.M.at(PT.sloy.k)[1] - y) > 0.5, IN = PT.door ? {k:PT.door.k, h:PT.door.h || 0, task:null, inside:'in'} : null;
    const Wk = ST.G.work, Dk = ST.G.deck || {}, workY = Wk ? Wk.table[1] : Dk.y;
    if ((st === 'sloy' || st === 'is') && below(workY)) return IN;
    if ((st === 'haling' || st === 'blogg') && ST.G.hauler && PT.haling && Math.abs(ST.M.at(PT.haling.k)[1] - ST.G.hauler[1]) > 1.2) return IN;
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
    if (st === 'kokk') return PT.door ? {k:PT.door.k, h:PT.door.h || 0, task:null, inside:'in'} : null;
    return idleGoal(p, ctx);
  }
  // the station and its part (at the hauler: the hauler, the picker, the pot hand): a person keeps the place while it stays the same
  const kindOf = p => p.st === 'haling' ? 'haling:' + (p.role === 'haler' ? 'h' : p.role) : p.st === 'pause' && p.idle ? 'pause:' + p.idle + (p.with ? '>' + p.with : '') : p.st;
  // ---- a free person: something to do for a while, by the weather, the hour and their nature ----
  const IDLE = ['lean', 'lean', 'look', 'coffee', 'coil', 'sweep', 'sit'];
  // (p.idle: the break the game chose, kept as long as it lasts there; each its own place and pose, view3d.js drawWorker: facing out over
  // the rail (lean, look, coffee, smoke, snus, the phone, the binoculars, the northern lights, seasick), back to the rail (back, chat, the
  // knife, the lunch), over the deck (scrub, hose, coil), sitting on a tub (sit), by the gear (gear))
  const IDLE_IN = {back:1, chat:1, knife:1, lunch:1, sweep:1, coil:1, hose:1, sit:1, worry:0};
  // ---- no limb through a wall, the rail or anything else (Jonas 23.10.2026: «Sørg også for at mannskapet aldri "clipper" gjennom vegger,
  // rekka eller andre ting»). The rail at a place: how far ahead of it its top is and how high (rays down in front of the place, the
  // model's own surface, vessel3d.js deckMap M.hit); the hands that rest on the rail rest on its top there (view3d.js drawWorker st.rail).
  const RAIL = new Map();
  // (the top is the highest thing within 0.7 m ahead under shoulder height, so a pipe rail over a low ledge is the rail, not the ledge; the
  // distance is where that top begins)
  function railAt(k, h){ const key = ST.type + ':' + k + ':' + h.toFixed(2); if (RAIL.has(key)) return RAIL.get(key); const M = ST.M, p = M.at(k), F = [Math.sin(h), -Math.cos(h)], tops = [];
    for (let d = 0.12; d <= 0.7; d += 0.04){ const x = p[0] + F[0] * d, z = p[2] + F[1] * d, t = M.hit([x, p[1] + 1.4, z], [x, p[1] + 0.3, z]); if (t >= 0){ const y = 1.4 - t * 1.1; if (y > 0.45) tops.push([d, y]); } }
    let out = null; if (tops.length){ const mx = Math.max(...tops.map(q => q[1])), q = tops.find(q => q[1] >= mx - 0.03); out = [Math.round(q[0] * 100) / 100, Math.round(mx * 100) / 100]; }
    RAIL.set(key, out); return out; }
  // each pose as its limbs and what it holds, segments in the person's own frame [forward, up, right] from the feet, as drawWorker draws
  // it (at the furthest reach of its movement): rail is [ahead, height] of the rail's top (facing it), the hands on it 4 cm over
  function poseSegs(k, rail){
    const R = rail || [0.42, 1.0], d = R[0] + 0.02, top = R[1] + 0.04;
    const legs = [[[0, 0.92, 0.11], [0, 0.1, 0.12]], [[0, 0.92, -0.11], [0, 0.1, -0.12]]], torso = [[[0, 0.95, 0], [0, 1.45, 0]], [[0.12, 1.0, 0], [0.12, 1.38, 0]], [[-0.12, 1.0, 0], [-0.12, 1.38, 0]], [[0, 1.42, 0.21], [0, 1.42, -0.21]]];
    const head = [[[0, 1.5, 0], [0, 1.8, 0]], [[0.13, 1.64, 0], [-0.13, 1.64, 0]]], arms = (r, l) => [[[0.02, 1.42, 0.21], r], [[0.02, 1.42, -0.21], l]], std = (r, l, ...more) => legs.concat(torso, head, arms(r, l), more);
    switch (k){
      case 'lean': return std([d, top, 0.2], [d, top, -0.2]);
      case 'coffee': return std([0.18, 1.5, 0.04], [0.05, 0.85, -0.25], [[0.12, 0.0, -0.32], [0.12, 0.32, -0.32]]);
      case 'back': return [[[0.05, 0.92, 0.11], [0.3, 0.08, -0.05]], [[0.05, 0.92, -0.11], [0.2, 0.08, -0.13]], [[0.05, 0.95, 0], [-0.07, 1.45, 0]], [[-0.17, 1.0, 0], [-0.19, 1.38, 0]], [[-0.07, 1.5, 0], [-0.1, 1.8, 0]],
        [[0.02, 1.42, 0.21], [0.17, 1.18, -0.07]], [[0.02, 1.42, -0.21], [0.17, 1.16, 0.07]]];
      case 'sit': return [[[-0.04, 0.5, 0.12], [0.38, 0.52, 0.15]], [[0.38, 0.52, 0.15], [0.44, 0.08, 0.17]], [[-0.04, 0.5, -0.12], [0.38, 0.52, -0.15]], [[0.38, 0.52, -0.15], [0.44, 0.08, -0.17]], [[0, 0.55, 0], [0.1, 1.05, 0]],
        [[0.15, 1.08, 0], [0.22, 1.36, 0]], [[0.06, 1.0, 0.2], [0.36, 0.7, 0.05]], [[0.06, 1.0, -0.2], [0.36, 0.7, -0.05]], [[-0.31, 0.2, 0], [0.19, 0.2, 0]], [[-0.06, 0.2, 0.25], [-0.06, 0.2, -0.25]], [[-0.06, 0.02, 0], [-0.06, 0.45, 0]]];
      case 'chat': return std([0.34, 1.3, 0.2], [0.04, 0.92, -0.22]);
      case 'knife': return std([0.45, 1.2, 0.13], [0.3, 1.02, -0.06], [[0.3, 1.02, -0.06], [0.42, 1.3, 0.03]]);
      case 'lunch': return std([0.13, 1.5, 0.03], [0.3, 1.03, -0.1], [[0.3, 1.03, -0.2], [0.3, 1.03, 0.0]]);
      case 'phone': return std([0.26, 1.13, 0.035], [0.26, 1.12, -0.035]);
      case 'binoc': return std([0.15, 1.56, 0.07], [0.15, 1.56, -0.07], [[0.15, 1.57, 0], [0.3, 1.57, 0]]);
      case 'seasick': return legs.concat([[[0.03, 0.95, 0], [0.44, 1.42, 0]], [[0.5, 1.5, 0], [0.62, 1.66, 0]], [[0.44, 1.42, 0.21], [d, top, 0.24]], [[0.44, 1.42, -0.21], [d, top, -0.24]]]);
      case 'gear': return legs.concat([[[0.03, 0.92, 0], [0.26, 1.4, 0]], [[0.3, 1.48, 0], [0.34, 1.74, 0]], [[0.26, 1.4, 0.21], [0.45, 0.72, 0.15]], [[0.26, 1.4, -0.21], [0.45, 0.72, -0.15]]]);
      case 'smoke': return std([0.24, 1.52, 0.17], [d, top, -0.2]);
      case 'snus': return std([0.26, 1.47, 0.02], [0.26, 1.1, -0.04], [[0.02, 1.42, 0.21], [d, top, 0.2]], [[0.02, 1.42, -0.21], [d, top, -0.2]]);
      case 'sweep': return std([0.25, 1.0, 0.1], [0.35, 0.8, -0.05], [[0.25, 1.0, 0.1], [0.8, 0.12, 0]], [[0.8, 0.06, 0.42], [0.8, 0.06, -0.42]]);
      case 'hose': return std([0.45, 1.15, 0.12], [0.3, 1.1, -0.1], [[0.12, 0.02, 0.62], [0.12, 0.46, 0.62]], [[0.12, 0.3, 0.5], [0.45, 1.15, 0.12]]);
      case 'coil': return std([0.47, 1.2, 0.12], [0.3, 1.0, -0.15]);
      // the work at its places (the stations' own places from the models; tested, not chosen)
      // (at the rail, rail is its top as at a break: the jig hauled up over it, the hauler's lever and the line just over it; at the gutting
      // table rail[1] is the table's top, the hands working on it)
      case 'jig': return rail ? std([d, top + 0.4, 0.16], [d - 0.04, top + 0.01, -0.16]) : std([0.34, 1.3, 0.16], [0.3, 0.9, -0.16]);
      case 'haul': return rail ? std([d + 0.06, top + 0.1, 0.2], [d + 0.1, top + 0.24, -0.06]) : std([0.42, 1.08, 0.2], [0.52, 1.22, -0.06]);
      case 'bleedst': return std([0.3, 0.92, 0.2], [0.28, 0.95, -0.18]);
      case 'pick': return rail ? std([d + 0.04, top + 0.03, 0.14], [d + 0.04, top + 0.03, -0.14]) : std([0.48, 0.92, 0.16], [0.48, 0.92, -0.16]);
      case 'tend': return std([0.48, 0.92, 0.16], [0.48, 0.92, -0.16]);
      case 'mend': return std([0.42, 1.0, 0.12], [0.42, 1.02, -0.1]);
      case 'helm': return std([0.3, 1.1, 0.17], [0.3, 1.1, -0.17]);
      case 'gut': { const tt = rail ? rail[1] : 0.9; return std([0.42, tt + 0.28, 0.2], [0.36, tt + 0.06, -0.12]); }
      case 'pack': return std([0.4, 0.95, 0.15], [0.08, 1.02, -0.2]);
      case 'aurora': case 'look': default: return std([0, 0.93, 0.19], [0, 0.93, -0.19]);
    }
  }
  // how many of a pose's limbs pass through the model at a place and heading, standing off it by off ([x, z] in the boat's frame)
  function poseHits(k, cell, h, rail, off){ const M = ST.M, p = M.at(cell), F = [Math.sin(h), -Math.cos(h)], Rv = [Math.cos(h), Math.sin(h)], o = off || [0, 0];
    const W = q => [p[0] + o[0] + F[0] * q[0] + Rv[0] * q[2], p[1] + q[1], p[2] + o[1] + F[1] * q[0] + Rv[1] * q[2]];
    let n = 0; for (const [a, b] of poseSegs(k, rail)) if (M.hit(W(a), W(b)) >= 0) n++; return n; }
  // a break at a rail place, its pose clear of everything: the heading (facing out, or inboard with the back to the rail), the rail's top
  // where the hands rest, and leaning back the place moved back until the back is at the rail
  // how a pose stands at a rail place: facing out, a step back when the rail is closer than 0.2 m (a thick bulwark); facing inboard, the
  // back that far off the rail as the pose needs (leaning back: at it; sitting on a tub: the tub clear of it)
  // (facing out, the hands that work in front of the chest need the rail that far off: the phone, the cup, the snus, the binoculars)
  const NEED_IN = {back:0.24, sit:0.46}, REACH = {phone:0.34, coffee:0.3, binoc:0.36, snus:0.34, smoke:0.3, seasick:0.2, lean:0.2}, fitPlace = (k, q, way) => { const rl = railAt(q.k, q.h), inb = way == null ? !!IDLE_IN[k] : way, F = [Math.sin(q.h), -Math.cos(q.h)];
    if (!inb){ const need = REACH[k] || 0.2; if (rl && rl[0] < need){ const s = need - rl[0]; return {h:q.h, rail:[need, rl[1]], off:[-F[0] * s, -F[1] * s]}; } return {h:q.h, rail:rl, off:null}; }
    const need = NEED_IN[k] || 0.26, s = rl ? rl[0] - need : 0, sh = k === 'back' ? s : Math.min(0, s); return {h:q.h + Math.PI, rail:null, off:sh ? [F[0] * sh, F[1] * sh] : null}; };
  // (most breaks can be had either way, facing out or with the back to the rail: the other way is tried where the first is not clear)
  const BOTH = {coffee:1, phone:1, smoke:1, snus:1, lunch:1, look:1, chat:1, knife:1, sit:1};
  function idlePlace(k, L, id){
    const n0 = hashStr(id + k + Math.floor(S.t / 12)), ways = BOTH[k] ? [!!IDLE_IN[k], !IDLE_IN[k]] : [!!IDLE_IN[k]];
    for (const way of ways) for (let i = 0; i < L.length; i++){ const q = L[(n0 + i) % L.length], f = fitPlace(k, q, way);
      if (!poseHits(k, q.k, f.h, f.rail, f.off)) return {k:q.k, h:f.h, rail:f.rail, off:f.off}; }
    return null; }
  // the parts of the deck the crew live on: those with a station, the door or the wheel; a place on the rail of a part only a wall away
  // (behind the house, the stern behind a bulkhead) is no place for a break
  function livePart(k){ const M = ST.M, C = deckComp(M);
    if (!M.live){ M.live = new Set(); for (const [nm, v] of Object.entries(ST.PT)) if (nm !== 'lean') for (const q of [].concat(v)) if (q && q.k != null && M.ok(q.k)) M.live.add(C[q.k]); }
    return M.live.has(C[k]); }
  function idleGoal(p, ctx, force){
    const PT = ST.PT, T = p.c && p.c.traits || [], id = p.c ? 'c' + p.c.id : 'me', leans = (PT.lean || []).filter(l => ST.M.ok(l.k) && livePart(l.k) && free(l.k, id)); if (!leans.length) return PT.sloy ? {k:PT.sloy.k, h:0, task:'look'} : null;
    if (!force && p.idle){ const k0 = p.idle, PL = places(), k = k0 === 'quay' ? 'chat' : k0 === 'worry' ? 'look' : k0;
      if (k === 'gear'){ const q = PL.tubAt ? at(PL.tubAt(0), 1.2) : null; if (q && !poseHits('gear', q.k, q.h || 0)){ q.task = 'gear'; q.idle = true; q.until = 1e12; return q; } }
      // under way a smoker stands aft (the aftmost places on the rail), out of the wind of her own speed
      const L = k === 'smoke' && ctx.underway ? leans.slice().sort((a, b) => ST.M.at(b.k)[2] - ST.M.at(a.k)[2]).slice(0, 3) : leans;
      // the first place where the pose is clear; none, then standing and looking out where that is clear
      const g1 = idlePlace(k === 'gear' ? 'look' : k, L, id), g = g1 || idlePlace('look', leans, id); if (!g) return null;
      return {k:g.k, h:g.h, rail:g.rail, off:g.off, task:g1 && k !== 'gear' ? k : 'look', until:1e12, idle:true, with:p.with || null}; }
    let act = force || IDLE[Math.floor(rnd() * IDLE.length)];
    if (!force){ if (T.includes('makelig') && rnd() < 0.5) act = rnd() < 0.5 ? 'lean' : 'coffee'; if ((T.includes('arbeidsjern') || T.includes('perfeksjonist')) && rnd() < 0.5) act = rnd() < 0.5 ? 'sweep' : 'coil';
      if ((ctx.night || ctx.wind > 12) && rnd() < 0.5 && PT.door && !ctx.open) return {k:PT.door.k, h:PT.door.h || 0, task:null, inside:'in', until:nowS() + 40 + rnd() * 80}; }
    if (act === 'sit') act = 'lean';
    // sweeping and coiling are done with the back to the rail, over the deck: facing out the broom went over the side and the coiling arm
    // worked up and down over the rail like a jig (Jonas 21.10.2026, #81 and #84); a place where the pose is clear of everything
    const g1 = idlePlace(act, leans.slice(Math.floor(rnd() * leans.length)).concat(leans), id), g = g1 || idlePlace('look', leans, id); if (!g) return null;
    return {k:g.k, h:g.h, rail:g.rail, off:g.off, task:g1 ? act : 'look', until:nowS() + 30 + rnd() * 60, idle:true};
  }
  // ---- the work at its place, clear of everything: at the rail the hands go to the rail's own top (a step back when it is close), at the
  // table to the table's top; where a limb still goes through something, the nearest place within half a metre where none does, then a
  // little turn (the place from the anchors is the station's; this only moves the person within it)
  const RAILWORK = {jig:1, haul:1, pick:1};
  function fitWork(g, id){
    if (!g || g.inside || g.idle || !ST.M.ok(g.k)) return g; const M = ST.M, h0 = g.h || 0;
    const fit = (k, h) => { if (RAILWORK[g.task]){ const rl = railAt(k, h); if (!rl) return {rail:null, off:null}; const F = [Math.sin(h), -Math.cos(h)];
        if (rl[0] < 0.22){ const s = 0.22 - rl[0]; return {rail:[0.22, rl[1]], off:[-F[0] * s, -F[1] * s]}; } return {rail:rl, off:null}; }
      if (g.task === 'gut'){ const W0 = ST.G.work, d0 = ST.G.deck || {y:ST.G.gw || 0}, top = W0 && W0.own && W0.top != null ? W0.top : (d0.y || 0) + 0.885; return {rail:[0.4, top - M.at(k)[1]], off:null}; }
      return {rail:null, off:null}; };
    let f = fit(g.k, h0); if (!poseHits(g.task, g.k, h0, f.rail, f.off)){ g.rail = f.rail; g.off = f.off; return g; }
    const p0 = M.at(g.k), C = []; for (let k = 0; k < M.nx * M.nz; k++){ if (!M.ok(k) || !free(k, id)) continue; const q = M.at(k), d = Math.hypot(q[0] - p0[0], q[2] - p0[2]); if (d <= 0.5 && Math.abs(q[1] - p0[1]) < 0.2) C.push([d, k]); }
    C.sort((a, b) => a[0] - b[0]);
    for (const dh of [0, 0.25, -0.25]) for (const [, k] of C){ const h = h0 + dh; f = fit(k, h); if (!poseHits(g.task, k, h, f.rail, f.off)){ TAKEN.delete(g.k); g.k = k; g.h = h; g.rail = f.rail; g.off = f.off; TAKEN.set(k, id); return g; } }
    f = fit(g.k, h0); g.rail = f.rail; g.off = f.off; return g; }
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
  // the break's things that are put away before the walk to work (the mug back on the flask, the phone in the pocket ...), and the
  // places held until the one taking over is there (the hauler hauls on, the helm is not left)
  const PROP = {coffee:1, phone:1, binoc:1, smoke:1, snus:1, lunch:1}, PUT_S = 1.4;
  const relieves = g => !!g && (g.task === 'haul' || g.inside === 'helm');
  function sync(ctx){
    const seen = new Set(), used = {}, pend = [], t = nowS(); TAKEN.clear();
    // how hard each one works now (04-crew.js crewEffort): the tired walk slower, work at a slower beat and stoop (the view's a.tk, a.ef)
    const H = S.t / 60, hs = !src && typeof hsWork === 'function' ? hsWork(S.boat.pos, H) : 0;
    for (const p of ctx.WA){ const id = p.c ? 'c' + p.c.id : 'me'; seen.add(id); let a = A.find(q => q.id === id);
      if (!a){ a = {id, me:!p.c, c:p.c, x:0, y:0, z:0, h:0, cell:-1, goal:null, path:null, pi:0, mode:'in', task:null, st:null, blend:0, kind:null, slot:-1}; A.push(a); }
      a.c = p.c; a.st = p.st; a.role = p.role || null; a.jw = p.jw || null; const g = a.goal, kind = kindOf(p);
      a.ef = !src && p.c && typeof crewEffort === 'function' ? crewEffort(p.c, H, hs).f : 1;
      // the same station as before, and not an idle spell that is over: the place is kept (nobody swaps the table for the tub each minute);
      // an idle spell on deck ends as she gets under way on a boat with a house, so the crew go in (Jonas 21.10.2026: they stood leaning
      // over the rail at 23 knots for a minute and a half, as if jigging)
      const keep = g && a.kind === kind && !(g.idle && g.until < t) && !(g.idle && ctx.underway && !ctx.open) &&!(g.inside === 'in' && g.until && g.until < t && p.st === 'pause' && !ctx.underway) && !(ctx.away && g) && (g.inside || ST.M.ok(g.k));
      if (keep){ if (a.slot >= 0) (used[kind] || (used[kind] = new Set())).add(a.slot); if (!g.inside) TAKEN.set(g.k, id); } else pend.push([p, a, kind]); }
    for (const [p, a, kind] of pend){ let n = 0; const U = used[kind] || (used[kind] = new Set()); while (U.has(n)) n++; U.add(n);
      const was = a.goal, there = was && a.mode !== 'walk' && !a.sub && a.cell === was.k;
      a.goal = fitWork(claim(goalOf(p, ctx, n), a.id), a.id); a.kind = kind; a.slot = n; a.path = null; a.sub = null; a.door = 0;
      if (there && PROP[was.task] && a.mode === 'at' && a.blend > 0.6 && !(a.goal && a.goal.task === was.task)) a.put = {task:was.task, t0:t, g:was};
      if (there && relieves(was) && (a.mode === 'at' || a.mode === 'helm')) a.was = was; else a.was = null; }
    // the old one stays at the hauler or the helm until the one taking over is there (or for 25 s at most)
    for (const [, a] of pend){ const w = a.was; a.was = null; if (!w) continue;
      const W = ST.M.at(w.k), b = A.find(q => q !== a && q.goal && (w.inside ? q.goal.inside === 'helm' : q.goal.task === 'haul' && !q.goal.inside && (() => { const Q = ST.M.at(q.goal.k); return Math.hypot(Q[0] - W[0], Q[2] - W[2]) < 0.6; })()));
      if (b && !(b.cell === b.goal.k && b.mode !== 'walk')) a.relief = {g:w, by:b.id, until:t + 25}; }
    for (let i = A.length - 1; i >= 0; i--) if (!seen.has(A[i].id)) A.splice(i, 1);
    // two chatting stand together: the later of the two moves next to the other (0.7-1.1 m), and they face each other
    for (const [p, a] of pend){ const g = a.goal; if (!g || g.task !== 'chat' || !g.with) continue; const o = A.find(q => q.id === (g.with === 'me' ? 'me' : 'c' + g.with)); if (!o || !o.goal || o.goal.task !== 'chat' || o.goal.inside) continue;
      const M = ST.M, q0 = M.at(o.goal.k); let p0 = M.at(g.k);
      const face = (P, Q) => Math.atan2(Q[0] - P[0], -(Q[2] - P[2]));
      if (Math.hypot(p0[0] - q0[0], p0[2] - q0[2]) > 1.2){ let best = -1, bd = 9; for (let k = 0; k < M.nx * M.nz; k++){ if (!M.ok(k)) continue; const c = M.at(k), d = Math.hypot(c[0] - q0[0], c[2] - q0[2]); if (d < 0.7 || d > 1.1) continue; if (!free(k, a.id)) continue;
          if (Math.abs(d - 0.85) < bd && !poseHits('chat', k, face(c, q0))){ bd = Math.abs(d - 0.85); best = k; } }
        if (best >= 0){ TAKEN.delete(g.k); g.k = best; TAKEN.set(best, a.id); p0 = M.at(best); g.off = null; } }
      // facing each other where the turn leaves the pose clear of everything (else as they stand)
      if (!poseHits('chat', g.k, face(p0, q0), null, g.off)) g.h = face(p0, q0); if (!poseHits('chat', o.goal.k, face(q0, p0), null, o.goal.off)) o.goal.h = face(q0, p0); }
    // a box of fish is full: the packer (else the gutter) carries it to the hatch and lowers it into the hold, and comes back (1.5 of the plan)
    if (ctx.crates >= 0){ if (ST.crates >= 0 && ctx.crates > ST.crates){ const pk = A.find(a => a.st === 'is'), w = pk ? (pk.mode === 'at' && !pk.sub ? pk : null) : A.find(a => a.st === 'sloy' && a.mode === 'at' && !a.sub);
        const PL = places(), k = w ? near(PL.hatch[0], PL.hatch[1], 2.5) : -1; if (w && k >= 0 && k !== w.goal.k){ w.sub = {k, h:w.h, task:'stow', carry:'crate', hold:2.2}; w.path = null; } }
      ST.crates = ctx.crates; }
    ST.crateFill = ctx.crateFill || 0;
  }
  // everyone straight to their place (the first frame, a change of boat, the clock run on)
  function snap(){ for (const a of A){ a.sub = null; a.put = a.relief = null; a.door = a.out = 0; if (!a.goal){ a.mode = 'in'; continue; } const p = ST.M.at(a.goal.k); a.x = p[0]; a.y = p[1]; a.z = p[2]; a.cell = a.goal.k; a.h = a.goal.h; a.task = a.goal.task; a.mode = a.goal.inside ? a.goal.inside : 'at'; a.path = null; } }
  function tick(dt){
    if (!ready()) return; dt = Math.min(0.1, Math.max(0, dt || 0)); ST.clk += dt; const t = nowS();
    const jump = ST.lastSim == null || Math.abs(S.t - ST.lastSim) > 30 || (src && src.jump && src.jump()); ST.lastSim = S.t;
    if (!ST.ctx || t - ST.ctxT > 1){ walkMap(); ST.ctx = context(); ST.ctxT = t; if (jump) ST.crates = -1; sync(ST.ctx); }
    if (jump){ snap(); return; }
    const M = ST.M, roll = Math.abs(ST.roll || 0), spd = WALK * (roll > 0.21 ? 0 : roll > 0.14 ? 0.65 : 1);
    for (const a of A){
      const ef = a.ef == null ? 1 : a.ef; a.tk = (a.tk || 0) + dt * clamp(0.55 + 0.45 * ef, 0.72, 1.05);
      // the moments between (M7c): the break's thing put away first, the station held until relieved, a breath at the door
      if (a.put){ a.putU = (t - a.put.t0) / PUT_S; if (a.putU < 1){ a.task = a.put.task; continue; } a.put = null; }
      if (a.relief){ const r = a.relief, b = A.find(q => q.id === r.by), P = ST.M.at(r.g.k);
        const done = !b || !b.goal || t > r.until || (r.g.inside ? b.goal.inside !== 'helm' || b.mode === 'helm' : b.goal.task !== 'haul' || Math.hypot(b.x - P[0], b.z - P[2]) < 0.9);
        if (!done){ a.task = r.g.task; continue; } a.relief = null; a.path = null; }
      if (a.out && t < a.out){ a.task = null; continue; } a.out = 0;
      if (a.sub && a.sub.done && t > a.sub.done){ if (a.sub.thru != null) a.thru = a.sub.thru; a.sub = null; a.path = null; }
      const g = a.sub || a.goal;
      if (!g){ a.mode = 'in'; continue; }
      // inside, and now wanted on deck: out through the door
      // (or out on the other side of the house, after the way through it: a.thru)
      if (a.mode === 'in' || a.mode === 'helm'){ if (g.inside && (a.cell === g.k || a.thru === -1)){ a.thru = null; a.cell = g.k; a.task = g.task; a.mode = g.inside; continue; }
        const th = a.thru != null && a.thru >= 0 && M.ok(a.thru) && deckComp(M)[a.thru] === deckComp(M)[g.k] ? a.thru : -1; a.thru = null;
        const d = th >= 0 ? th : ST.PT.door ? ST.PT.door.k : g.k, p = M.ok(d) ? M.at(d) : ST.M0.at(d); a.x = p[0]; a.y = p[1]; a.z = p[2]; a.cell = d; a.mode = 'at'; a.path = null;
        if (ST.PT.door && d === ST.PT.door.k && d !== g.k){ const q = M.ok(g.k) ? M.at(g.k) : p; a.h = Math.atan2(q[0] - p[0], -(q[2] - p[2])); a.out = t + 0.45; a.task = null; a.blend = 1; continue; } }
      if (a.cell !== g.k || a.mode === 'walk'){
        if (!a.path){ let from = M.cellOf(a.x, a.z); if (!M.ok(from)) from = M.near(a.x, a.z, 2); if (from < 0){ snap(); return; }
          const P = deckPath(M, from, g.k);
          if (!P){ const hv = hopVia(from, g.k);
            if (hv && !(a.sub && a.sub.thru != null)){ a.sub = {k:hv[0], h:a.h, task:null, inside:'in', hold:hv[2], thru:g.inside ? -1 : hv[1]}; continue; }
            // no way at all: there at once, rather than through anything
            const p = M.at(g.k); a.x = p[0]; a.y = p[1]; a.z = p[2]; a.cell = g.k; a.h = g.h || 0; a.mode = g.inside || 'at'; a.task = g.task; a.blend = 0; a.path = null; if (a.sub && !a.sub.done) a.sub.done = t + (a.sub.hold || 2); continue; }
          a.path = P; a.pi = 1; a.mode = 'walk'; a.blend = 0; }
        // along the way: towards the next cell's centre, turning as it goes, and slowly or not at all when she rolls hard
        const q = M.at(a.path[Math.min(a.pi, a.path.length - 1)]), dx = q[0] - a.x, dz = q[2] - a.z, dist = Math.hypot(dx, dz);
        const want = Math.atan2(dx, -dz); let dh = dist > 1e-3 ? want - a.h : 0; while (dh > Math.PI) dh -= 2 * Math.PI; while (dh < -Math.PI) dh += 2 * Math.PI;
        a.h += Math.max(-TURN * dt, Math.min(TURN * dt, dh)); const climb = Math.abs(q[1] - a.y) > 0.4 ? 0.45 : 1, step = spd * clamp(0.7 + 0.3 * ef, 0.76, 1.04) * climb * dt * (Math.abs(dh) > 1.2 ? 0.3 : 1);
        a.mode = 'walk'; a.task = a.sub && a.sub.carry ? 'carry' : null; a.near = dist;
        if (dist <= step + 1e-6){ a.x = q[0]; a.z = q[2]; a.y = q[1]; a.cell = a.path[Math.min(a.pi, a.path.length - 1)]; a.pi++;   // the point is reached this very step: no jump, ever
          // (at the door, 'at' first: in after a hand to it, below)
          if (a.pi >= a.path.length){ a.mode = g.inside && !(g.inside === 'in' && ST.PT.door && g.k === ST.PT.door.k) ? g.inside : 'at'; a.task = g.task; a.path = null; a.cell = g.k; a.blend = 0; if (a.sub && !a.sub.done) a.sub.done = t + (a.sub.hold || 2); continue; } }
        else { a.x += dx / dist * step; a.z += dz / dist * step; const fy = M.floorAt(a.x, a.z); a.y = fy === fy ? fy : a.y + (q[1] - a.y) * Math.min(1, step / Math.max(dist, 1e-3)); }
        sideways(a, t, dt); unclip(a, t);
      } else {
        // at the place: turn to face the work, and the blend into its pose
        let dh = g.h - a.h; while (dh > Math.PI) dh -= 2 * Math.PI; while (dh < -Math.PI) dh += 2 * Math.PI; a.h += Math.max(-TURN * dt, Math.min(TURN * dt, dh));
        a.blend = Math.min(1, a.blend + dt / 0.4); a.task = g.task; a.sqW = 0; a.sqA = Math.max(0, (a.sqA || 0) - dt * 6);
        // (in through the door: a hand to it for a moment first)
        if (g.inside && Math.abs(dh) < 0.3){ if (g.inside !== 'in' || !ST.PT.door || g.k !== ST.PT.door.k){ a.mode = g.inside; continue; }
          if (!a.door) a.door = t + 0.6; if (t < a.door) a.task = 'door'; else { a.mode = g.inside; a.door = 0; } } }
    }
    // nobody walks through anybody: two within 0.45 m push apart a little, sideways; the one walking gives way (the places are 0.4 m apart at least)
    for (let i = 0; i < A.length; i++) for (let j = i + 1; j < A.length; j++){ const a = A[i], b = A[j]; if (a.mode === 'in' || b.mode === 'in' || a.mode === 'helm' || b.mode === 'helm') continue;
      const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz); if (d > 0.45 || d < 1e-4) continue; const push = Math.min(0.03, (0.45 - d) * 0.3), nx = -dz / d, nz = dx / d;
      // (not when the walker is about to arrive next to the other: the places by the table and the tub are that close)
      for (const [o, s] of [[a, -1], [b, 1]]){ if (o.mode !== 'walk' || o.near < 0.6) continue; const x = o.x + nx * push * s, z = o.z + nz * push * s, f = walkOff(o);
        if (ST.M.ok(ST.M.cellOf(x, z)) && !bodyLines(o, o.sqA).some(([v, w]) => lineHit(x + f[0] + v[0] * w, o.y, z + f[1] + v[1] * w))){ o.x = x; o.z = z; } } }
  }
  // for the view: the agents to draw (not those inside), and where a crew member stands for the line over his head
  function agents(){ return A; }
  function visible(){ return A.filter(a => a.mode !== 'in' && a.goal); }
  function anchorOf(cid){ const a = A.find(q => q.c && q.c.id === cid); return a && a.mode !== 'in' ? a : null; }
  // the tests: how many limbs pass through the model, for the goals now given (clipNow) and for every break at every rail place (clipScan)
  function clipNow(){ if (!ready()) return null; const out = []; for (const a of A){ const g = a.goal; if (!g || g.inside || !ST.M.ok(g.k)) continue; out.push({id:a.id, task:g.task, n:poseHits(g.task || 'look', g.k, g.h || 0, g.rail, g.off), rail:g.rail || railAt(g.k, g.h || 0), segs:(() => { const M = ST.M, p = M.at(g.k), h = g.h || 0, F = [Math.sin(h), -Math.cos(h)], Rv = [Math.cos(h), Math.sin(h)], o = g.off || [0, 0];
      const W = v => [p[0] + o[0] + F[0] * v[0] + Rv[0] * v[2], p[1] + v[1], p[2] + o[1] + F[1] * v[0] + Rv[1] * v[2]]; return poseSegs(g.task || 'look', g.rail).map(([u, v], i) => M.hit(W(u), W(v)) >= 0 ? i : -1).filter(i => i >= 0); })()}); } return out; }
  function clipScan(){ if (!ready()) return null; const PT = ST.PT, R = {}; for (const k of Object.keys(IDLE_IN).concat(['lean', 'look', 'coffee', 'phone', 'binoc', 'seasick', 'smoke', 'snus', 'aurora'])){
      const L = (PT.lean || []).filter(l => ST.M.ok(l.k) && livePart(l.k)); let clear = 0; for (const q of L){ const ways = BOTH[k] ? [!!IDLE_IN[k], !IDLE_IN[k]] : [!!IDLE_IN[k]];
        if (ways.some(w => { const f = fitPlace(k, q, w); return !poseHits(k, q.k, f.h, f.rail, f.off); })) clear++; } R[k] = [clear, L.length]; } return R; }
  // the body where it is now (walking or at its place): the shoulders and the chest and back as upright lines, through anything?
  function bodyHits(){ if (!ready()) return null; const M = ST.M, out = []; for (const a of A){ if (a.mode !== 'walk') continue;
      const o = walkOff(a), x = a.x + o[0], z = a.z + o[1], y = a.y, which = bodyLines(a, a.sqA).map((q, i) => q.concat(['rlfb'[i]])).filter(([v, s]) => M.hit([x + v[0] * s, y + 0.35, z + v[1] * s], [x + v[0] * s, y + 1.55, z + v[1] * s]) >= 0).map(q => q[2]);
      if (which.length) out.push({id:a.id, mode:a.mode, task:a.task, n:which.length, which:which.join(''), near:Math.round((a.near || 0) * 100) / 100}); } return out; }
  // ---- the body on its way, clear of everything: the shoulders and the chest and back as upright lines; one that would go through a wall
  // or the rail pushes the body off it a little (where the deck is), and where the way is narrower than the shoulders the person turns
  // and goes through sideways: a.sqA turns the body from 0 (facing the way) to 1 (side on), a.sqW is the turn wanted, held half a
  // second so the body does not flicker between the two. The narrow place is seen a step ahead, so the turn is made before it.
  const bodyLines = (a, sq) => { const hd = a.h + (sq || 0) * Math.PI / 2, F = [Math.sin(hd), -Math.cos(hd)], R = [Math.cos(hd), Math.sin(hd)]; return [[R, 0.2], [R, -0.2], [F, 0.12], [F, -0.12]]; };
  const lineHit = (x, y, z) => ST.M.hit([x, y + 0.35, z], [x, y + 1.55, z]) >= 0;
  const narrow = (x, y, z, h) => { const R = [Math.cos(h), Math.sin(h)], F = [Math.sin(h), -Math.cos(h)];
    return lineHit(x + R[0] * 0.2, y, z + R[1] * 0.2) && lineHit(x - R[0] * 0.2, y, z - R[1] * 0.2) && !lineHit(x + F[0] * 0.12, y, z + F[1] * 0.12) && !lineHit(x - F[0] * 0.12, y, z - F[1] * 0.12); };
  function sideways(a, t, dt){
    const o = walkOff(a), x = a.x + o[0], z = a.z + o[1];
    if (narrow(x, a.y, z, a.h) || narrow(x + Math.sin(a.h) * 0.35, a.y, z - Math.cos(a.h) * 0.35, a.h)){ a.sqW = 1; a.sqT = t; } else if (a.sqW && t - a.sqT > 0.5) a.sqW = 0;
    const d = (a.sqW || 0) - (a.sqA || 0); a.sqA = (a.sqA || 0) + Math.max(-dt * 6, Math.min(dt * 6, d)); }
  function unclip(a, t){
    const M = ST.M;
    for (let it = 0; it < 3; it++){ let px = 0, pz = 0, n = 0; const o = walkOff(a);
      for (const [v, s] of bodyLines(a, a.sqA)) if (lineHit(a.x + o[0] + v[0] * s, a.y, a.z + o[1] + v[1] * s)){ px -= v[0] * Math.sign(s); pz -= v[1] * Math.sign(s); n++; }
      if (!n) return true;
      if (Math.hypot(px, pz) < 0.5){ if (a.sqA < 1){ a.sqW = a.sqA = 1; a.sqT = t; continue; } return false; }   // both sides, not seen coming: side on at once
      const l = Math.hypot(px, pz), nx2 = a.x + px / l * 0.04, nz2 = a.z + pz / l * 0.04; if (!M.ok(M.cellOf(nx2, nz2))) return false; a.x = nx2; a.z = nz2; }
    return false; }
  // ---- no way over the deck between two parts of it (fore and aft of the house on the big boats): through the house, out of sight for
  // as long as the walk inside takes, from the cell of this part nearest the other (or the door) to the cell of that part nearest it ----
  function hopVia(from, to){
    const M = ST.M, C = deckComp(M), ca = C[from], cb = C[to]; if (ca < 0 || cb < 0 || ca === cb) return null;
    const N = M.nx * M.nz, door = ST.PT.door && M.ok(ST.PT.door.k) ? ST.PT.door.k : -1;
    const nearest = (c, P) => { let best = -1, bd = Infinity; for (let k = 0; k < N; k++){ if (C[k] !== c) continue; const q = M.at(k), d = Math.hypot(q[0] - P[0], (q[1] - P[1]) * 2, q[2] - P[2]); if (d < bd){ bd = d; best = k; } } return best; };
    const ex = door >= 0 && C[door] === ca ? door : nearest(ca, M.at(to)), en = door >= 0 && C[door] === cb ? door : nearest(cb, M.at(ex)), E = M.at(ex), F = M.at(en);
    return [ex, en, 1 + (Math.hypot(F[0] - E[0], F[2] - E[2]) + Math.abs(F[1] - E[1]) * 2) / WALK]; }
  // the nearest rail from where someone stands, ahead or to either side within 3 m (a fish that slips over the side goes over it):
  // the way [forward, right] in the boat's frame, how far, and its top over the deck; null with none (a wall is not a rail)
  function railNear(a){ const M = ST.M; let best = null;
    for (const dh of [0, Math.PI / 2, -Math.PI / 2]){ const h = a.h + dh, F = [Math.sin(h), -Math.cos(h)];
      for (let d = 0.12; d <= 3; d += 0.06){ const x = a.x + F[0] * d, z = a.z + F[1] * d, u = M.hit([x, a.y + 1.4, z], [x, a.y + 0.3, z]); if (u < 0) continue;
        const y = 1.4 - u * 1.1; if (y > 1.25) break; if (y < 0.45) continue; const ox = x + F[0] * 0.5, oz = z + F[1] * 0.5;
        // (the open sea beyond it: a rail; else something on deck before the rail, the gutting table or a tub: on past it)
        if (M.hit([ox, a.y + 1.4, oz], [ox, a.y - 1.5, oz]) < 0){ if (!best || d < best.d) best = {F, d, y}; break; } } }
    return best; }
  // the last steps to a place stood off its cell (a step back from a close rail, the back at the rail) go to where the person will stand
  // (the place still held: the break's, while its thing is put away, the station, until relieved)
  const holds = a => a.relief ? a.relief.g : a.put ? a.put.g : a.goal;
  function walkOff(a){ const g = holds(a), o = g && g.off; if (!o) return [0, 0]; if (a.mode === 'at') return [o[0] * (a.blend == null ? 1 : a.blend), o[1] * (a.blend == null ? 1 : a.blend)];
    if (a.mode !== 'walk' || !a.path || a.pi < a.path.length - 1) return [0, 0]; const u = clamp(1 - (a.near || 0) / 0.6, 0, 1); return [o[0] * u, o[1] * u]; }
  function clipWhy(k){ if (!ready()) return null; const M = ST.M; return (ST.PT.lean || []).filter(l => M.ok(l.k)).map(q => { const f = fitPlace(k, q), p = M.at(q.k), F = [Math.sin(f.h), -Math.cos(f.h)], Rv = [Math.cos(f.h), Math.sin(f.h)], o = f.off || [0, 0];
    const W = v => [p[0] + o[0] + F[0] * v[0] + Rv[0] * v[2], p[1] + v[1], p[2] + o[1] + F[1] * v[0] + Rv[1] * v[2]]; return {rail:railAt(q.k, q.h), fit:f.rail, off:f.off, hits:poseSegs(k, f.rail).map(([a, b], i) => M.hit(W(a), W(b)) >= 0 ? i : -1).filter(i => i >= 0)}; }); }
  return {tick, agents, visible, anchorOf, on, setJig, setRoll, setHelm, places:() => ready() ? places() : null, reset, clipNow, clipScan, clipWhy, bodyHits, walkOff, holds, railAt:(k, h) => ready() ? railAt(k, h) : null, railNear:a => ready() ? railNear(a) : null, _st:ST};
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
