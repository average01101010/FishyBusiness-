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
    if (ST.type !== t){ ST.type = t; ST.M0 = ST.M = deckMap(t); ST.PT = ST.M ? deckPoints(t) : null; ST.G = typeof geoOf === 'function' ? geoOf(t) : null; doorFace(); ST.PL = null; ST.kitSig = ''; ST.KB = null; A.length = 0; ST.lastSim = null; ST.ctx = null; ST.ctxT = 0; ST.crates = -1; }
    return !!(ST.M && ST.PT && ST.G && !ST.G.hand && ST.PT.sloy);
  }
  const on = () => ready();
  // the jigging places the view found on the rail (view3d.js jigRail): the hands stand inboard of the machines
  // the way to face at the door to go in: towards the point inside it (the model's anchors.doors[0].in), else forward as before
  function doorFace(){ const D = ST.PT && ST.PT.door, A0 = ST.G && ST.G.doors && ST.G.doors[0]; if (!D || !A0 || !A0.in || !ST.M.ok(D.k)) return; const p = ST.M.at(D.k);
    if (Math.hypot(A0.in[0] - p[0], A0.in[2] - p[2]) > 0.2) D.h = Math.atan2(A0.in[0] - p[0], -(A0.in[2] - p[2])); }
  function setJig(spots){ ST.jig = spots || null; }
  function setRoll(r){ ST.roll = r || 0; }
  // what the deck does (FB4; view3d/24-cinema.js each frame): her roll and pitch (rad), her height (m, the heave) and the sea's
  // significant wave height (m). The roll slows the walk as before; the drawing reads the rest for the sea legs (ST.sea)
  function setSea(roll, pitch, y, hs){ ST.roll = roll || 0; const q = ST.sea || (ST.sea = {}); q.roll = roll || 0; q.pitch = pitch || 0; q.y = y || 0; q.hs = hs || 0; }
  // the skipper sits at the wheel in the bridge view: someone else takes his place on deck (the view does not draw him from his own eyes)
  function setHelm(v){ ST.helmView = !!v; }
  // the lines and the fenders round a quay as the view has them (view3d/15-env-mooring.js moorTick, every frame): the spell, the side to
  // the quay and what is left to do in order ('f0'..'f2' a fender, 'c:mid' 'c:bow' 'c:stern' the line at that cleat); kept 1.5 s
  function setMoor(m){ ST.moor = m ? Object.assign({at:ST.clk}, m) : null; }
  const moorNow = () => ST.moor && ST.moor.phase && ST.clk - ST.moor.at < 1.5 ? ST.moor : null;

  // ---- the kit on the deck, out of the walking map ----
  // what the game draws on the model's places (view3d.js drawDeck, rigAt, drawLineTubs, drawNetTub, drawCargo, drawCrane), as boxes in the
  // boat's frame: [x, z, half width, half length, turn]; the line tubs and the nets only while they are aboard and rigged or worked
  function kitBoxes(){ const out = fixedBoxes(); gearBoxes(out); return out; }
  // (what stands on deck whatever she is rigged for: the bleeding tub, the table, the hauler, the fish tubs, the ice box, the crane)
  function fixedBoxes(){
    const G = ST.G, d = G.deck || {y:G.gw, z:0}, W = G.work, K = G.kit || {}, Bm = G.beam || 3, V = VESSELS[ST.type] || {}, out = [];
    const box = (x, z, w, l, ry) => out.push([x, z, w / 2 + 0.06, l / 2 + 0.06, ry || 0, 0.06]);
    const tu = W ? W.tub : [Bm / 2 - 0.62, d.y, d.z + 0.35], s = (W && W.s) || 1; box(tu[0], tu[2], 0.72 * s, 1.08 * s, W && W.ry || 0);
    if (!(W && W.own)){ const tb = W ? W.table : [-(Bm / 2 - 0.42), d.y, d.z]; box(tb[0], tb[2], 0.62, V.len >= 10 ? 1.6 : 1.15); }
    if (G.hauler) box(G.haulerFoot ? G.haulerFoot[0] : Bm / 2 - 0.2, G.hauler[2], 0.35, 0.4);   // (anchors.haulerFoot: where the model sets the post, 10-gear.js, OB12)
    // (the autoline hauler and its hook cleaner across the hauling station, from the port in to the cleaner; the line's guide arm over
    // the way along the back wall is high enough to pass under, H2d2)
    if (G.aline && G.aline.foot){ const F = G.aline.foot; box(F[0] + 0.05, F[2], 1.9, 0.62); }
    // (the fish tubs an open boat has now, core/07f-kar.js, and her ice box, view3d.js iceBoxAt)
    const nK = V.kar ? (ST.type === S.boat.type && BOAT.karN ? BOAT.karN : karN(ST.type, 0)) : (K.tubs || []).length;
    for (const q of (K.tubs || []).slice(0, nK)){ if (q[5] >= 0) continue; const big = (q[4] || 460) > 300; box(q[0], q[2], big ? 1.0 : 0.72, big ? 1.2 : 1.08, q[3]); }
    if (K.iskasse){ const k = K.iskasse[4] || 1; box(K.iskasse[0], K.iskasse[2], 0.72 * k, 1.08 * k, K.iskasse[3]); }
    if (K.crane && K.crane.at) box(K.crane.at[0], K.crane.at[2], 0.9, 0.9);
    return out;
  }
  // the deck with only that out of it: where the gear's own places are looked for (the tub the line is set from, the place to set from)
  function fixedMap(){ const V = VESSELS[ST.type] || {}, key = ST.type + '|' + (V.kar ? (ST.type === S.boat.type && BOAT.karN ? BOAT.karN : karN(ST.type, 0)) : 0); if (ST.MFk !== key){ ST.MFk = key; ST.MF = overlay(ST.M0, fixedBoxes()); } return ST.MF; }
  function gearBoxes(out, noLand, tight){
    // (OB10 runde 4, 12.11.2026: the gear out of the map as the model's own things are, vessel3d.js deckMap: a cell is barred where
    // anything stands in it, not only where its middle is. With 6 cm about the box and cells of DM_C, 0.2 m, the crew walked and stood
    // with their middles 6 cm off the tubs and half the body in them, in every boat (crewclip, kitHits). The last number is the padding,
    // so kitHits and kitAt measure against the gear itself. Under 9 m the tight padding (by her length, VESSELS.len; today the snekke): on the snekke the gutting
    // station is the only place left for the one setting, and the tubs fill her deck; the breaks keep out of the gear there, kitAt)
    const GP = tight || (VESSELS[ST.type] || {}).len < 9 ? 0.06 : 0.06 + DM_C / 2, G = ST.G, K = G.kit || {}, V = VESSELS[ST.type] || {}, box = (x, z, w, l, ry) => out.push([x, z, w / 2 + GP, l / 2 + GP, ry || 0, GP, 1]);
    // (OB4: the plant's tubs set out on her deck while she lands, landSlots)
    if (!noLand && landPlant()) for (const q of landSlots()) out.push([q[0], q[2], 0.56, 0.66, q[3] || 0, 0.06, 1]);   // (the hands work at them, close, by design: their padding as before)
    if (!src && S.pgear){ const g = rigGear();
      // (OB10 runde 4, 12.11.2026: the block's width is the two tubs' footprint, 0.52 between their middles and 0.5 across each, 1.02 m;
      // it was 0.78, so the crew stood 12 cm inside the outer tubs on either side, «folk gjennom stampene» in line_settfull and riggfull)
      if (g.tubs > 0 && K.stamps){ const rows = Math.ceil(Math.min(stampPer(), g.tubs) / 2), ry = K.stamps.ry || 0, c = Math.cos(ry), sn = Math.sin(ry), lx = 0.26, lz = (rows - 1) * 0.25;
        box(K.stamps.at[0] + lx * c + lz * sn, K.stamps.at[2] - lx * sn + lz * c, 1.02, rows * 0.5 + 0.02, ry); }
      // (OB3: every net tub that stands there, the tub the line is set from at the stern, the setter's magazine and the pot stacks)
      if (g.nets && K.garn){ const sc = K.garn.s || 1; for (const q of netTubs(g.netN)) box(q[0], q[2], 1.0 * sc, 1.2 * sc, q[3]); }
      // (the tub the line is set from: the one setting stands at it, close, by design; its padding as before)
      if (g.set === 'line'){ const T = setTub(); if (T) out.push([T[0], T[2], 0.31, 0.31, 0, 0.06, 1]); }
      if (K.setter && magOn()){ const P = K.setter, a = P[3] || 0; box(P[0] - Math.sin(a) * 0.99, P[2] - Math.cos(a) * 0.99, 0.6, 1.06, a); }
      if (K.pots && K.pots.at) for (const q of K.pots.at.slice(0, g.pots)) box(q[0], q[2], 1.3, 1.3, q[3] || 0);
      const kg = typeof cargoKg === 'function' ? Math.min(cargoKg(), BOAT.deckCargo || 0) : 0, nc = kg > 0 && K.cargo ? Math.min(K.cargo.length, Math.ceil(kg / 250)) : 0;
      for (let i = 0; i < nc; i++){ const q = K.cargo[i]; box(q[0], q[2], 0.8, 1.2, q[3]); } }
    return out;
  }
  // the gear on deck now: the line tubs (aboard, being baited or stripped) and the nets (aboard or being mended), as view3d.js draws them
  function rigGear(){
    const pg = S.pgear, b = S.boat, rig = typeof rigOf === 'function' ? rigOf() : b.rig, L = pg.lines || {}, J = S.jobs || [];
    const worked = J.filter(j => (j.kind === 'egn' || j.kind === 'strip') && !j.shop).reduce((a, j) => a + (j.n || 0), 0);
    // (OB3: what is being set or hauled is aboard too, and the tubs emptied into the sea stay on deck)
    const g = b.status === 'fishing' && b.gop && !b.gop.auto && !b.gop.sno ? b.gop : null, out = typeof mySets === 'function' ? mySets() : [];
    const tubs = (rig === 'line' ? (L.hyse ? L.hyse.n : 0) + (L.bank ? L.bank.n : 0) + out.filter(x => x.kind === 'line' && !(typeof isAuto === 'function' && isAuto(x.lk))).reduce((a, x) => a + (x.n || 0), 0) : 0) + worked + (g && g.kind === 'line' && g.op === 'set' ? g.n : 0);
    const mend = J.find(j => j.kind === 'mend' && !j.shop), ms = mend ? (pg.shore || []).find(x => x.kind === 'mendself' && x.lenke && x.lenke.id === mend.nid) : null;
    const netN = (pg.nets || []).reduce((a, l) => a + (l.n || 1), 0) + (ms ? ms.lenke.n || 1 : 0) + (g && g.kind === 'garn' ? (g.op === 'set' ? g.n - g.done : g.done) : 0);
    const nets = (rig === 'garn' && ((pg.nets || []).length > 0 || out.some(x => x.kind === 'garn'))) || !!mend || !!(g && g.kind === 'garn');
    // (the coastal boats' pot stacks that hold pots now, F7: as the view fills them, view3d/10-gear.js drawPotStacks, a stack at a time
    // by its own height; every stack while the pots are worked, as they come and go. The snow crab vessel's deck is her own, H3d2)
    const V = VESSELS[ST.type] || {}, KP = (ST.G.kit || {}).pots; let pots = 0;
    if (KP && KP.at && (rig === 'teiner' || (g && g.kind === 'teine')) && !(typeof POTS !== 'undefined' && (POTS[V.pot] || {}).sno)){
      if (g && g.kind === 'teine') pots = KP.at.length; else { let left = (pg.pots || {})[V.pot || 'big'] || 0; for (const a of KP.at){ if (left <= 0) break; pots++; left -= Math.max(1, Math.min(10, a[4] || KP.h || 10)); } } }
    return {tubs, nets, netN, pots, set:g && g.op === 'set' ? g.kind : null};
  }
  // how many line tubs stand in a layer at the rig's place (the model's own count, kit.stamps.n; four between the thwarts of the small
  // open boats, else eight), and the layers they are stacked in (F8: every tub aboard is on deck, stacked as tubs are, four high at most)
  const stampPer = () => { const KS = ((ST.G || {}).kit || {}).stamps; return KS && KS.n ? KS.n : ((VESSELS[ST.type] || {}).len || 10) < 8 ? 4 : 8; };
  // ---- the nets aboard in their tubs (F8, OB3): NET_TUB nets to a 460 l tub (assumed; a 27.5 m net is some 35-40 l in a heap), the
  // first at the model's place (kit.garn) and the rest beside it wherever the deck is clear: the tub's whole footprint on the floor at
  // the same height, nothing of the boat standing in it, clear of the rest of the kit, and the stations still joined by a way over the
  // deck. What finds no room is heaped on the last tub (the view mounds it). [x, y, z, ry] each; worked out once per boat and count
  const NET_TUB = 12, NETPL = new Map();
  function netTubs(n){
    const K = (ST.G.kit || {}).garn; if (!K) return []; const want = Math.max(1, Math.min(6, Math.ceil((n || 1) / NET_TUB))), id = ST.type + '|' + want; if (NETPL.has(id)) return NETPL.get(id);
    const M0 = ST.M0, sc = K.s || 1, ry = K.ry || 0, c = Math.cos(ry), sn = Math.sin(ry), hx = 0.5 * sc, hz = 0.6 * sc, out = [[K.at[0], K.at[1], K.at[2], ry]];
    if (want > 1){
      // (clear of the kit that stands whatever she is rigged for, fixedBoxes, of the line tubs' place and the hauler's hand, and of the stations)
      const G = ST.G, KK = G.kit || {}, FB = fixedBoxes(), obs = [], rr = Math.max(hx, hz);
      if (KK.stamps) obs.push([KK.stamps.at[0] + 0.26 * Math.cos(KK.stamps.ry || 0), KK.stamps.at[2] - 0.26 * Math.sin(KK.stamps.ry || 0), 0.75]);
      if (G.hauler) obs.push([G.hauler[0] - Math.sign(G.hauler[0]) * 0.6, G.hauler[2], 0.8]);
      for (const nm of ['sloy', 'is', 'haling', 'door', 'ror']){ const q = ST.PT[nm]; if (q && q.k != null && M0.ok(q.k)){ const p = M0.at(q.k); obs.push([p[0], p[2], 0.45]); } }
      const fits = (x, z) => { for (const [ox, oz, r] of obs) if (Math.hypot(ox - x, oz - z) < r + rr) return false;
        for (const [cx, cz, bx, bz, by] of FB){ const dx = x - cx, dz = z - cz, cb = Math.cos(by), sb = Math.sin(by); if (Math.abs(dx * cb - dz * sb) < bx + rr && Math.abs(dx * sb + dz * cb) < bz + rr) return false; }
        for (const q of out) if (Math.abs((x - q[0]) * c - (z - q[2]) * sn) < 2 * hx - 0.02 && Math.abs((x - q[0]) * sn + (z - q[2]) * c) < 2 * hz - 0.02) return false;
        for (const ux of [-1, 0, 1]) for (const uz of [-1, 0, 1]){ const px = x + ux * hx * 0.92 * c + uz * hz * 0.92 * sn, pz = z - ux * hx * 0.92 * sn + uz * hz * 0.92 * c, f = M0.floorAt(px, pz);
          if (!(f === f) || Math.abs(f - K.at[1]) > 0.12 || M0.hit([px, K.at[1] + 1.1, pz], [px, K.at[1] + 0.2, pz]) >= 0) return false; }
        return true; };
      // (the stations joined as before with the tubs out of the map)
      const st = ['sloy', 'is', 'haling', 'door'].map(nm => ST.PT[nm]).filter(q => q && q.k != null && M0.ok(q.k)).map(q => q.k), C0 = deckComp(M0), joined = st.filter(k => C0[k] === C0[st[0]]);
      const keeps = L => { const Mx = overlay(M0, L.map(q => [q[0], q[2], hx + 0.06, hz + 0.06, q[3]])), C = deckComp(Mx); return joined.every(k => Mx.ok(k) && C[k] === C[joined[0]]); };
      const steps = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1], [0, 2], [0, -2], [2, 0], [-2, 0]];
      for (const [ux, uz] of steps){ if (out.length >= want) break; const lx = ux * (2 * hx + 0.06), lz = uz * (2 * hz + 0.06), x = K.at[0] + lx * c + lz * sn, z = K.at[2] - lx * sn + lz * c;
        if (fits(x, z) && keeps(out.concat([[x, K.at[1], z, ry]]))) out.push([x, K.at[1], z, ry]); } }
    NETPL.set(id, out); return out;
  }
  // the setter's tub magazine stands (view3d/10-gear.js drawStern): the line setter on its second tier, on a boat with room for it, rigged for line
  function magOn(){ const P = ST.G && ST.G.kit && ST.G.kit.setter; if (src || !P || P[4] === 0 || typeof equipLv !== 'function' || typeof sternKit !== 'function') return false;
    const rig = typeof rigOf === 'function' ? rigOf() : S.boat.rig; return sternKit(ST.type) === 'linesetter' && equipLv('linesetterLv') >= 2 && !/^(garn|teiner)$/.test(rig || ''); }
  // ---- setting the line and the nets (F4, F20, OB3; Jonas 09.11.2026: «at arbeidet ombord utføres på en så ekte måte som mulig»): the
  // gear goes over the stern at one place, and one hand stands there paying it out, by the tub the line runs from or where the net comes
  // from its tub. Where: through the line setter or the net chute when she has the one for the gear (the model's place kit.setter,
  // OPP5); else over the stern where the boats' models were made for it (0.45 m to starboard of the middle, 0.1 m over the rail's
  // height: the havsjark's setting port is there), and where the model stands in the way there (a rail higher than that), over the
  // rail at the place kit.setter. ov: the point the gear passes over, dir: the way out from it (0 dead aft, + to starboard)
  const SETPL = new Map();
  function setOver(kind){
    const G = ST.G, M0 = ST.M0, d = G.deck || {y:G.gw, z:0}, gw = G.gw || 1, st = G.stern || 4, P = G.kit && G.kit.setter;
    const sk = !src && P && typeof sternKit === 'function' ? sternKit(ST.type) : null, thru = (kind === 'line' && sk === 'linesetter') || (kind === 'garn' && sk === 'garnrenne') ? sk : null;
    if (thru) return {ov:[P[0], P[1], P[2]], dir:P[3] || 0, thru, mag:thru === 'linesetter' && magOn()};
    const MF = fixedMap(), id = ST.type + '|ov|' + kind + '|' + ST.MFk; if (SETPL.has(id)) return SETPL.get(id);
    // (the models' own place: a rail under it there, and nothing of the boat over it)
    const top = (x, z) => { const y0 = gw + 1.3, y1 = d.y + 0.25, u = M0.hit([x, y0, z], [x, y1, z]); return u < 0 ? -1e9 : y0 - u * (y0 - y1); };
    let hi = -1e9; for (const dx of [-0.12, 0, 0.12]) for (const dz of [-0.3, -0.15, -0.02]) hi = Math.max(hi, top(0.45 + dx, st + dz));
    const own = hi > d.y + 0.4 && hi <= gw + 0.1;
    let out = !own && P ? {ov:[P[0], P[1] + 0.06, P[2] - 0.08], dir:P[3] || 0, thru:null, mag:false} : {ov:[0.45, gw + 0.1, st - 0.15], dir:0, thru:null, mag:false};
    // (nobody can stand there: the fish tubs fill the snekke's stern. Then over the ship's side, as far aft as the crew can stand at the
    // rail with the sea beyond it, on the side the gear lies; the gear streams aft from there as she runs on)
    const reach = O => { const bx = O.ov[0] - Math.sin(O.dir) * 0.6, bz = O.ov[2] - Math.cos(O.dir) * 0.6; for (let k = 0; k < MF.nx * MF.nz; k++){ if (!MF.ok(k)) continue; const q = MF.at(k);
        if (q[1] < O.ov[1] - 0.35 && q[1] > O.ov[1] - 1.7 && Math.hypot(q[0] - bx, q[2] - bz) < 0.75 && Math.hypot(q[0] - O.ov[0], q[2] - O.ov[2]) < 1.0) return true; } return false; };
    if (!reach(out)){ const gp = ((G.kit || {})[kind === 'garn' ? 'garn' : 'stamps'] || {at:[0, d.y, d.z]}).at; let best = null, bv = 1e9;
      for (let k = 0; k < MF.nx * MF.nz; k++){ if (!MF.ok(k)) continue; const q = MF.at(k); if (Math.abs(q[1] - gp[1]) > 0.5 || Math.hypot(q[0] - gp[0], q[2] - gp[2]) > 4) continue;
        for (const sd of [1, -1]){ if (MF.ok(MF.cellOf(q[0] + sd * MF.c, q[2]))) continue; const rl = railAt(k, sd * Math.PI / 2); if (!rl || rl[1] > 1.3) continue;
          const ox = q[0] + sd * (rl[0] + 0.45); if (M0.hit([ox, q[1] + 1.4, q[2]], [ox, q[1] - 2.5, q[2]]) >= 0) continue;
          // (he stands there facing the rail, the gear over it between his hands: the pose clear of everything, and clear of the hauler)
          const h = sd * Math.PI / 2, rail = [clamp(rl[0] - 0.1, 0.28, 0.6), clamp(rl[1] + 0.07, 0.7, 1.35)]; if (poseHits('sett', k, h, rail)) continue;
          if (G.hauler && Math.hypot(q[0] - G.hauler[0], q[2] - G.hauler[2]) < 1.3) continue;
          const v = Math.hypot(q[0] - gp[0], q[2] - gp[2]) - 0.6 * q[2]; if (v < bv){ bv = v; best = {ov:[q[0] + sd * (rl[0] + 0.04), q[1] + rl[1] + 0.05, q[2]], dir:h, thru:null, mag:false, man:{k, h, rail}}; } } }
      if (best) out = best; }
    SETPL.set(id, out); return out;
  }
  // the tub the line is set from (no magazine: it is carried aft and stands on the deck just inside the stern, under where the line goes
  // over): the nearest floor there, the deck the crew stand on. [x, y, z], or null (then the line runs from the tubs' own place)
  function setTub(){
    const O = setOver('line'); if (O.mag) return null; const M0 = fixedMap(), id = ST.type + '|tub|' + (O.thru || '') + '|' + ST.MFk; if (SETPL.has(id)) return SETPL.get(id);
    // (at the rail he stands where the gear goes over, and the tub aft of him)
    const din = [-Math.sin(O.dir), -Math.cos(O.dir)], mp = O.man ? M0.at(O.man.k) : null, tx = mp ? mp[0] : O.ov[0] + din[0] * (O.thru ? 0.85 : 0.55), tz = mp ? mp[2] + 0.62 : O.ov[2] + din[1] * (O.thru ? 0.85 : 0.55); let best = null, bd = 1.0;
    for (let k = 0; k < M0.nx * M0.nz; k++){ if (!M0.ok(k)) continue; const q = M0.at(k); if (q[1] > O.ov[1] - 0.35 || q[1] < O.ov[1] - 1.7) continue; const dd = Math.hypot(q[0] - tx, q[2] - tz);
      if (mp && Math.hypot(q[0] - mp[0], q[2] - mp[2]) < 0.5) continue;
      // (its whole foot on the floor, and nothing of the boat standing in it)
      if (dd >= bd) continue; let ok = true; for (const [ux, uz] of [[0.2, 0], [-0.2, 0], [0, 0.2], [0, -0.2]]){ const f = M0.floorAt(q[0] + ux, q[2] + uz); if (!(f === f) || Math.abs(f - q[1]) > 0.1 || M0.hit([q[0] + ux, q[1] + 0.5, q[2] + uz], [q[0] + ux, q[1] + 0.12, q[2] + uz]) >= 0) ok = false; }
      if (ok){ bd = dd; best = [q[0], q[1], q[2]]; } }
    // (the tubs' own place is right there: the line runs from it, and no tub is carried)
    const KS = (ST.G.kit || {}).stamps; if (best && KS && Math.hypot(best[0] - KS.at[0], best[2] - KS.at[2]) < 1.3) best = null;
    SETPL.set(id, best); return best;
  }
  // the one who sets: beside the tub (line) or beside the net's run at the stern, turned to where the gear goes over, the hands on it
  // just inside the rail (rail: [how far ahead, how high over the feet]); the nearest cell there with the pose clear of everything
  function setPlace(kind, id0){
    const O = setOver(kind), M = ST.M; if (O.man && M.ok(O.man.k) && free(O.man.k, id0)) return {k:O.man.k, h:O.man.h, task:'sett', rail:O.man.rail, off:null};
    const T = kind === 'line' ? setTub() : null, din = [-Math.sin(O.dir), -Math.cos(O.dir)], rt = [Math.cos(O.dir), -Math.sin(O.dir)];
    const base = T ? [T[0], T[2]] : [O.ov[0] + din[0] * (O.mag ? 0.5 : 0.6), O.ov[2] + din[1] * (O.mag ? 0.5 : 0.6)], off = T ? 0.66 : O.thru === 'garnrenne' ? 0.85 : 0.6;
    const gp = (ST.G.kit || {})[kind === 'garn' ? 'garn' : 'stamps'], pref = O.ov[0] > 0.2 ? -1 : O.ov[0] < -0.2 ? 1 : gp && gp.at[0] > O.ov[0] ? -1 : 1; let best = null, bv = 1e9;
    for (let k = 0; k < M.nx * M.nz; k++){ if (!M.ok(k) || !free(k, id0)) continue; const q = M.at(k); if (q[1] > O.ov[1] - 0.35 || q[1] < O.ov[1] - 1.7) continue;
      for (const sd of [1, -1]){ const dd = Math.hypot(q[0] - (base[0] + rt[0] * sd * off), q[2] - (base[1] + rt[1] * sd * off)); if (dd > 0.6) continue;
        const h = face(q[0], q[2], O.ov[0] + din[0] * 0.12, O.ov[2] + din[1] * 0.12), reach = Math.hypot(O.ov[0] - q[0], O.ov[2] - q[2]), rail = [clamp(reach - 0.14, 0.28, 0.6), clamp(O.ov[1] - q[1] + 0.02, 0.7, 1.35)];
        if (reach > 1.05) continue; const v = dd + (sd === pref ? 0 : 0.2) + poseHits('sett', k, h, rail) * 2; if (v < bv){ bv = v; best = {k, h, task:'sett', rail, off:null}; } } }
    return best;
  }
  // the one handing the gear to him: by the line tubs (the next tub to carry aft), or by the net tub the net runs from, seeing that it runs clear
  function langPlace(kind, id0){
    const PL = places(); if (kind === 'line'){ const q = at(PL.tubAt(0), 1.2); if (q) q.task = 'gear'; return q; }
    const K = (ST.G.kit || {}).garn; if (!K) return null; const M = ST.M, O = setOver('garn'); let best = null, bv = 1e9;
    for (let k = 0; k < M.nx * M.nz; k++){ if (!M.ok(k) || !free(k, id0)) continue; const q = M.at(k), dd = Math.hypot(q[0] - K.at[0], q[2] - K.at[2]); if (dd < 0.75 || dd > 1.25 || Math.abs(q[1] - K.at[1]) > 0.3) continue;
      // (not in the net's way from the tub to the stern)
      const along = ((q[0] - K.at[0]) * (O.ov[0] - K.at[0]) + (q[2] - K.at[2]) * (O.ov[2] - K.at[2])) / (Math.hypot(O.ov[0] - K.at[0], O.ov[2] - K.at[2]) || 1), h = face(q[0], q[2], K.at[0], K.at[2]);
      const v = dd + Math.max(0, along) * 1.5 + poseHits('gear', k, h) * 2; if (v < bv){ bv = v; best = {k, h, task:'gear'}; } }
    return best;
  }
  // for the view (view3d/10-gear.js drawSetting, 09-landing-deck.js): where the gear goes over, the tub it runs from, where the one
  // setting stands now, and the net tubs
  function setPlan(kind){ if (!ready()) return null; const O = setOver(kind), a = A.find(q => q.role === 'sett' && q.goal && q.goal.task === 'sett' && q.mode === 'at');
    return {ov:O.ov, dir:O.dir, thru:O.thru, mag:O.mag, tub:kind === 'line' ? setTub() : null, man:a ? [a.x, a.y, a.z, a.h] : null}; }
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
    const g = S.pgear ? rigGear() : {tubs:0, nets:false}, kg = typeof cargoKg === 'function' ? Math.ceil(Math.min(cargoKg(), BOAT.deckCargo || 0) / 250) : 0, sig0 = g.tubs + '|' + g.nets + '|' + kg + '|' + (g.nets ? netTubs(g.netN).length : 0) + '|' + (g.pots || 0) + '|' + (g.set || '') + '|' + (magOn() ? 1 : 0);
    ST.kitSig0 = sig0; const sig = sig0 + '|' + (landPlant() ? 1 : 0);
    if (sig === ST.kitSig) return; ST.kitSig = sig; ST.KB = kitBoxes(); ST.M = overlay(ST.M0, ST.KB); ST.PL = null;
    // (the gear's wider padding, gearBoxes, may not take a work place: where the place the gear is set from, or a station, was clear
    // with the tight padding and is not with the wide, the tight one stands for this boat and gear: the snekke's tubs fill her deck)
    // (and the stations and the place over the rail stay joined by a way over the deck as they were: the wider padding may not close a
    // gangway, the way aft beside the tubs, found in the review)
    if (ST.M !== ST.M0 && !src){ const KT = fixedBoxes().concat(gearBoxes([], false, true)), MT = overlay(ST.M0, KT), PT = ST.PT || {};
      const stk = ['sloy', 'is', 'haling', 'door'].map(nm => PT[nm]).filter(q => q && q.k != null).map(q => q.k), need = stk.slice();
      for (const kind of ['line', 'garn']){ const O = setOver(kind); if (O && O.man) need.push(O.man.k); }
      const CT = deckComp(MT), CW = deckComp(ST.M), jt = need.filter(k => MT.ok(k)), apart = jt.some(k => !ST.M.ok(k) || (CT[k] === CT[jt[0]]) !== (CW[k] === CW[jt[0]]));
      if (apart){ ST.KB = KT; ST.M = MT; }
      // (and while she sets: the one setting has a place with the wide padding, or the tight one stands)
      // (a place of his own: on the snekke the only one the wide padding left was the gutting station, and he stood looking on while
      // someone gutted there)
      // (the stations only, not the place over the rail itself: setPlace gives that first where there is one; and without the crew's
      // present places, TAKEN, so the choice is the deck's and not where they happened to stand)
      else { const gs = S.pgear ? rigGear().set : null, stn = stk.map(k => ST.M0.at(k)), own = q => !!q && !stn.some(w => { const u = ST.M0.at(q.k); return Math.hypot(w[0] - u[0], w[2] - u[2]) < SEP; });
        if (gs){ const T0 = new Map(TAKEN); TAKEN.clear();
          if (!own(setPlace(gs, '-'))){ const MW = ST.M, KW = ST.KB; ST.M = MT; ST.KB = KT; if (!own(setPlace(gs, '-'))){ ST.M = MW; ST.KB = KW; } }
          for (const [k, v] of T0) TAKEN.set(k, v); } } }
    ST.KC = null;   // (the cells with gear in a body there, kitAt, worked out again for this map)
    for (const a of A) a.path = null;   // (the ways are found again over the new map)
  }

  // ---- the landing, the ice and the freight at the quay (OB4, 11.11.2026; docs/planer/om-bord.md F10, F11, F22, F23; Jonas 09.11.2026:
  // «at arbeidet ombord utføres på en så ekte måte som mulig ... at ingenting clipper inn i andre ting»). The core gives the roles
  // (13-work.js quayRoles) and keeps the time; here are the places. The plant's tubs stand on clear deck open to the sky, where the
  // crane's hook can come down to them (before: four on a fixed square round the middle of the deck, through the hatch coaming and under
  // the shelter deck); the one who hooks the sling on stands beside the tub that goes next, on the side away from the quay; the one
  // who gives the signs stands at the rail to the quay, clear of the load's way; the ice from the silo goes into the ice box, and one
  // stands by it with the shovel; her own crane is driven from beside its foot, and the other hand hooks on at the freight.
  const quaySide = () => { const m = moorNow(); return m && m.side ? m.side : typeof berthSide === 'function' ? berthSide(ST.type) : 1; };
  // (a landing of the plant's tubs from her hold now)
  // (until the last of them is on the hook: after that the view draws none on deck, and the deck is clear again)
  function landPlant(){ if (src || !S.boat) return false; const b = S.boat, L = b.land; if (!L || b.status !== 'port' || L.kind !== 'tub' || L.own || L.lv > 0) return false;
    return typeof landLiftT !== 'function' || S.t - L.t0 < landLiftT(L, L.lifts - 1) + 0.42 * liftMin(L); }
  // where the landing is now: the lift i (-1 before the first), how far into it (u, 0-1), an own tub's place, and whether it comes back washed
  function landNow(){ if (src || !S.boat) return null; const b = S.boat, L = b.land; if (!L || b.status !== 'port' || L.kind !== 'tub' || L.lv > 0 || typeof landLiftT !== 'function') return null;
    const e = S.t + (typeof currentFrac === 'function' ? currentFrac() : 0) - L.t0, lf = liftMin(L); let i = -1; for (let j = 0; j < L.lifts; j++) if (e >= landLiftT(L, j)) i = j;
    const u = i >= 0 ? (e - landLiftT(L, i)) / lf : 0, back = !!L.own && i >= L.n; return {L, e, i, u, back, place:L.own ? Math.max(0, back ? i - L.n : i) : 0, done:i >= 0 && u >= 1}; }
  const LANDPL = new Map(), TUBX = 0.5, TUBZ = 0.6;
  function landSlots(){
    const V = VESSELS[ST.type] || {}; if (V.kar || !ST.M0) return []; const id = ST.type + '|ls|' + (ST.kitSig0 || ''); if (LANDPL.has(id)) return LANDPL.get(id);
    const M0 = ST.M0, Mk = overlay(M0, fixedBoxes().concat(gearBoxes([], true, true))), G = ST.G, d = G.deck || {y:G.gw, z:0}, N = M0.nx * M0.nz, out = [];
    const st = ['sloy', 'is', 'haling', 'door'].map(nm => ST.PT[nm]).filter(q => q && q.k != null && M0.ok(q.k)).map(q => q.k), C0 = deckComp(Mk), st1 = st.filter(k => Mk.ok(k)), joined = st1.filter(k => C0[k] === C0[st1[0]]);   // (the stations that are joined now, from the first that is on the map)
    const keeps = L => { const Mx = overlay(Mk, L.map(q => [q[0], q[2], TUBX + 0.06, TUBZ + 0.06, q[3]])), C = deckComp(Mx); return joined.every(k => Mx.ok(k) && C[k] === C[joined[0]]); };
    const fits = (x, y, z, ry) => { const c = Math.cos(ry), sn = Math.sin(ry);
      for (const q of out) if (Math.hypot(x - q[0], z - q[2]) < 1.25) return false;
      for (const k of st){ const p = M0.at(k), dx = p[0] - x, dz = p[2] - z; if (Math.abs(dx * c - dz * sn) < TUBX + 0.35 && Math.abs(dx * sn + dz * c) < TUBZ + 0.35) return false; }
      for (const ux of [0, -1, 1]) for (const uz of [0, -1, 1]){ const px = x + ux * TUBX * 0.94 * c + uz * TUBZ * 0.94 * sn, pz = z - ux * TUBX * 0.94 * sn + uz * TUBZ * 0.94 * c, f = Mk.floorAt(px, pz);
        if (!(f === f) || Math.abs(f - y) > 0.08) return false; }
      // (nothing of the boat standing in it, and nothing over it: the hook comes straight down)
      for (const ux of [0, -1, 1]) for (const uz of [0, -1, 1]){ const px = x + ux * TUBX * 0.94 * c + uz * TUBZ * 0.94 * sn, pz = z - ux * TUBX * 0.94 * sn + uz * TUBZ * 0.94 * c;
        if (M0.hit([px, y + 9, pz], [px, y + 0.14, pz]) >= 0) return false; }
      return true; };
    const C = []; for (let k = 0; k < N; k++){ if (!Mk.ok(k)) continue; const q = Mk.at(k); C.push([Math.hypot(q[0], q[2] - d.z) + Math.abs(q[1] - d.y) * 1.5, k]); } C.sort((a, b) => a[0] - b[0]);
    for (const [, k] of C){ if (out.length >= 2) break; const q = Mk.at(k); if (out.length && (Math.hypot(q[0] - out[0][0], q[2] - out[0][2]) > 2.6 || Math.abs(q[1] - out[0][1]) > 0.1)) continue;
      for (const ry of [0, Math.PI / 2]){ if (!fits(q[0], q[1], q[2], ry)) continue; const T = [q[0], q[1], q[2], ry]; if (!keeps(out.concat([T])) || !besideBox(Mk, T, TUBX, TUBZ, 'unhook', null, quaySide())) continue; out.push(T); break; } }
    LANDPL.set(id, out); return out;
  }
  // a place to stand beside a box [x, y, z, ry] of half measures hx, hz: 0.25 to 0.55 m clear of it on its own deck, turned to it, the
  // poses of the work there clear of everything; not on the side sd (the quay's: the load swings out that way), and one's own cell
  function besideBox(M, B, hx, hz, task, id, sd){
    const c = Math.cos(B[3] || 0), sn = Math.sin(B[3] || 0), N = M.nx * M.nz, tasks = task === 'unhook' ? ['unhook', 'guide', 'tend'] : [task]; let best = null, bv = 1e9;
    for (let k = 0; k < N; k++){ if (!M.ok(k)) continue; const q = M.at(k); if (Math.abs(q[1] - B[1]) > 0.2) continue; const dx = q[0] - B[0], dz = q[2] - B[2]; if (Math.abs(dx) > 1.7 || Math.abs(dz) > 1.7) continue;
      const lx = Math.abs(dx * c - dz * sn) - hx, lz = Math.abs(dx * sn + dz * c) - hz, gap = Math.max(lx, lz); if (gap < 0.25 || gap > 0.55 || Math.min(lx, lz) > 0.1) continue;
      if (id && M === ST.M && !free(k, id)) continue; const h = face(q[0], q[2], B[0], B[2]);
      let v = Math.abs(gap - 0.3) + (sd && dx * sd > 0.2 ? 0.6 : 0); if (M === ST.M) for (const tk of tasks) v += poseHits(tk, k, h) * 2;
      if (v < bv){ bv = v; best = {k, h}; } }
    return best; }
  // the tub that goes next (the plant's first slot, or her own tub of this lift), as a box
  function landTub(){ const n = landNow(); if (!n) return null;
    if (n.L.own){ const q = ((ST.G.kit || {}).tubs || [])[n.place]; if (!q) return null; const big = (q[4] || 460) > 300; return {B:[q[0], q[1], q[2], q[3] || 0], hx:big ? 0.5 : 0.36, hz:big ? 0.6 : 0.54}; }
    const T = landSlots()[0]; return T ? {B:T, hx:TUBX, hz:TUBZ} : null; }
  function hektPlace(id){ const T = landTub(); if (!T) return null; const g = besideBox(ST.M, T.B, T.hx, T.hz, 'unhook', id, quaySide()); return g ? {k:g.k, h:g.h, task:'unhook', dyn:'hekt'} : null; }
  // the one who gives the signs: at the rail to the quay (a lean place facing out that way), some two metres from the tub,
  // on the deck the tub stands on where there is such a place (1.5 m or more from the tub: the load goes up and out over the rail there)
  function lukePlace(id){ const T = landTub(), sd = quaySide(), M = ST.M, hq = sd * Math.PI / 2; let best = null, bv = 1e9;
    for (const l of ST.PT.lean || []){ if (!M.ok(l.k) || !free(l.k, id)) continue; const p = M.at(l.k); if (Math.cos((l.h || 0) - hq) < 0.7 || p[0] * sd < 0) continue;
      const dz = T ? Math.hypot(p[0] - T.B[0], p[2] - T.B[2]) : 2.2, dy = T ? Math.abs(p[1] - T.B[1]) : 0; if (dz < 1.5) continue;
      // (a step back from a close rail, so the hand at his side is inside it)
      // (FB2: and a little further back where the raised arm's elbow would be in a high bulwark or what stands on it)
      const h = l.h || hq, rl = railAt(l.k, h); let off = null, hits = 99;
      for (const need of LEMMER.on ? [0.4, 0.5, 0.6] : [0.4]){ const st = rl && rl[0] < need ? need - rl[0] : 0, o2 = st ? [-Math.sin(h) * st, Math.cos(h) * st] : null, n = poseHits('signal', l.k, h, null, o2) + poseHits('look', l.k, h, null, o2); if (n < hits){ hits = n; off = o2; } if (!n) break; }
      const v = Math.abs(dz - 2.2) + dy * 3 + (livePart(l.k) ? 0 : 4) + hits * 2; if (v < bv){ bv = v; best = {k:l.k, h, off, task:'signal', dyn:'luke'}; } }
    return best; }
  // the ice box on deck (the model's place, else by the packer's place as the view stands it: view3d/09-landing-deck.js iceBoxAt)
  function iceBox(){ const K = (ST.G.kit || {}).iskasse; if (K) return [K[0], K[1], K[2], K[3] || 0, K[4] || 1]; const q = ST.PT.is; if (!q || !ST.M0.ok(q.k)) return null;
    const p = ST.M0.at(q.k), h = q.h || 0, F = [Math.sin(h), -Math.cos(h)], R = [Math.cos(h), Math.sin(h)]; return [p[0] - R[0] * 0.62 + F[0] * 0.1, p[1], p[2] - R[1] * 0.62 + F[1] * 0.1, -h, 0.75]; }
  // (the ice comes through the silo's hose, and he holds its end over the box, view3d/09-landing-deck.js drawPlant; where the hose
  // pose is not clear of everything by the box, under the gutting board of an open boat, he has his hands on its rim, or stands by it)
  function isPlace(id){ const B = iceBox(); if (!B) return null; let g = null;
    for (const tk of ['nozzle', 'tend', 'look']){ g = besideBox(ST.M, B, 0.36 * B[4], 0.54 * B[4], tk, id, quaySide()); if (g && !poseHits(tk, g.k, g.h)) return {k:g.k, h:g.h, task:tk, ice:true, dyn:tk === 'nozzle' ? 'is' : null}; }
    return g ? {k:g.k, h:g.h, task:'look', ice:true} : null; }
  // the view says whether the hose reaches him clear of the boat (every frame while ice runs; kept 1.5 s): without it he stands by
  function setIce(on){ ST.iceHose = {at:ST.clk, on:!!on}; }
  // her own crane on the freight (F23): the driver beside the crane's foot with the remote, on the deck the crane stands on or the
  // nearest under it, turned to the freight; the other hand at the freight (PL.cargo), turned to it
  function kranPlace(id){ const K = (ST.G.kit || {}).crane; if (!K || !K.at) return null; const M = ST.M, N = M.nx * M.nz, cg = ((ST.G.kit || {}).cargo || [])[0] || [K.at[0], 0, K.at[2] - 2]; let best = null, bv = 1e9;
    for (let k = 0; k < N; k++){ if (!M.ok(k) || !free(k, id)) continue; const q = M.at(k), dd = Math.hypot(q[0] - K.at[0], q[2] - K.at[2]); if (dd < 0.85 || dd > 2.4 || q[1] > K.at[1] + 0.3) continue;
      const h = face(q[0], q[2], cg[0], cg[2]), v = dd + Math.abs(K.at[1] - q[1]) * 0.5 + Math.hypot(q[0] - cg[0], q[2] - cg[2]) * 0.15 + poseHits('remote', k, h) * 2; if (v < bv){ bv = v; best = {k, h, task:'remote'}; } }
    return best; }
  // the crane's round as the view runs it (view3d/09-landing-deck.js drawCrane, every frame): u 0-1, loading or landing; kept 1.5 s
  function setCrane(c){ ST.crane = c ? Object.assign({at:ST.clk}, c) : null; }
  // ---- the deck washed down, the packed lunch and the cold (OB14, 11.11.2026, docs/planer/om-bord.md F12-F14; the roles 'spyl',
  // 'kost', 'mat' and 'frys' on those on a break, core/13-work.js deckRoles). The one with the hose stands a jet's length from where the
  // fish were gutted (the table, else the packer's place, else the hauler's), on that deck, turned to it, among the cells the crew use,
  // his pose clear of everything as he swings the jet from side to side (WASH_SW each way); the one with the brush nearer in. Under a
  // shelter deck the gutting is out of sight, and so is the washing of it.
  const WASH_SW = 0.4, WASHC = new Map();
  function washAt(){ const PT = ST.PT, q = [PT.sloy, PT.is, PT.haling].find(q => q && q.k != null && ST.M0.ok(q.k)); return q ? ST.M0.at(q.k) : null; }
  function washPlace(id, role){
    const T = washAt(); if (!T) return null; const M = ST.M, tk = role === 'kost' ? 'sweep' : 'hose', key = ST.type + '|' + tk + '|' + (ST.kitSig || ''); let C = WASHC.get(key);
    if (!C){ C = []; const N = M.nx * M.nz, lo = tk === 'hose' ? 1.2 : 0.8, hi = tk === 'hose' ? 2.6 : 2.2, want = tk === 'hose' ? 1.6 : 1.1;
      for (let k = 0; k < N; k++){ if (!M.ok(k) || !livePart(k)) continue; const q = M.at(k); if (Math.abs(q[1] - T[1]) > 0.2) continue; const d = Math.hypot(q[0] - T[0], q[2] - T[2]); if (d < lo || d > hi) continue;
        const h = face(q[0], q[2], T[0], T[2]); if (poseHits(tk, k, h) || (tk === 'hose' && (poseHits(tk, k, h + WASH_SW) || poseHits(tk, k, h - WASH_SW)))) continue;
        C.push([Math.abs(d - want), k, h]); }
      C.sort((a, b) => a[0] - b[0]); WASHC.set(key, C); }
    // (the brush is not worked in the jet, nor a step from the one who holds the hose)
    // (nor is the other in the jet as it swings: within 2.2 m ahead of the hose and WASH_SW and a body's width to either side of its heading)
    const o = A.find(a => a.id !== id && a.goal && a.goal.wash && !a.goal.inside), op = o ? M.at(o.goal.k) : null;
    const inJet = (hp, hh, q) => { const dx = q[0] - hp[0], dz = q[2] - hp[2], d = Math.hypot(dx, dz); if (d > 2.2) return false; let da = Math.atan2(dx, -dz) - hh; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI; return Math.abs(da) < WASH_SW + 0.4; };
    for (const [, k, h] of C){ if (!M.ok(k) || !free(k, id)) continue;
      if (op){ const q = M.at(k); if (Math.hypot(q[0] - op[0], q[2] - op[2]) < 1.1 || (tk === 'hose' ? inJet(q, h, op) : inJet(op, o.goal.h || 0, q))) continue; }
      return {k, h, task:tk, wash:true}; }
    return null; }
  // the packed lunch (a boat with no galley): seated on an upturned tub with the back to the rail where that is clear of everything,
  // else standing, at the rail places nearest the helm (the door on a boat with a house), so they eat together; the lunch first and
  // the coffee after, as the core says (lunchNow), on the same place
  function matPlace(id){
    const PT = ST.PT, M = ST.M, L = (PT.lean || []).filter(l => M.ok(l.k) && livePart(l.k) && free(l.k, id)); if (!L.length) return null;
    const a0 = [PT.ror, PT.door].find(q => q && q.k != null && ST.M0.ok(q.k)), an = a0 ? ST.M0.at(a0.k) : [0, 0, 0], dd = l => { const q = M.at(l.k); return Math.hypot(q[0] - an[0], q[2] - an[2]); };
    L.sort((a, b) => dd(a) - dd(b));
    for (const q of L){ const f = fitPlace('sit', q, true); if (!poseHits('sitmat', q.k, f.h, f.rail, f.off) && !poseHits('sitkaffe', q.k, f.h, f.rail, f.off)) return {k:q.k, h:f.h, rail:f.rail, off:f.off, task:'sitmat', dyn:'mat', mat:2}; }
    for (const way of [true, false]) for (const q of L){ const f = fitPlace('lunch', q, way); if (!poseHits('lunch', q.k, f.h, f.rail, f.off) && !poseHits('coffee', q.k, f.h, f.rail, f.off)) return {k:q.k, h:f.h, rail:f.rail, off:f.off, task:'lunch', dyn:'mat', mat:1}; }
    return null; }
  // the cold: where his break has him standing, beating his arms and rubbing his hands, when that is clear of everything there
  // (else at the nearest rail place where it is: he does not stand still and freeze because a stay is in the way of his arm)
  function frysPlace(p, ctx){ const g = idleGoal(p, ctx); if (!g || g.inside || !STILL3[g.task]) return g; if (!poseHits('cold', g.k, g.h, g.rail, g.off) && !kitAt(g.k, g.off)){ g.task = 'cold'; return g; }
    const id = p.c ? 'c' + p.c.id : 'me', M = ST.M, p0 = M.at(g.k), L = (ST.PT.lean || []).filter(l => M.ok(l.k) && livePart(l.k) && free(l.k, id)).sort((a, b) => { const A1 = M.at(a.k), B1 = M.at(b.k); return Math.hypot(A1[0] - p0[0], A1[2] - p0[2]) - Math.hypot(B1[0] - p0[0], B1[2] - p0[2]); });
    for (const q of L) for (const way of [false, true]){ const f = fitPlace('cold', q, way); if (!poseHits('cold', q.k, f.h, f.rail, f.off) && !kitAt(q.k, f.off)) return {k:q.k, h:f.h, rail:f.rail, off:f.off, task:'cold', until:1e12, idle:true}; }
    return g; }
  const STILL3 = {look:1, lean:1, back:1};
  // what a hand at the quay work does this moment (the place is the same through the lifts; the pose follows the hook)
  function dynTask(g){
    if (g.dyn === 'mat'){ const c = typeof lunchNow === 'function' && (lunchNow() || {}).coffee; return g.mat === 2 ? (c ? 'sitkaffe' : 'sitmat') : c ? 'coffee' : 'lunch'; }
    if (g.dyn === 'is') return ST.iceHose && ST.clk - ST.iceHose.at < 1.5 && !ST.iceHose.on ? 'look' : 'nozzle';
    if (g.dyn === 'kai'){ const c = ST.crane && ST.clk - ST.crane.at < 1.5 ? ST.crane : null; if (!c) return 'look'; const u = c.u;
      return c.loading ? (u >= 0.12 && u < 0.2 ? 'guide' : u >= 0.2 && u < 0.32 ? 'unhook' : 'look') : (u >= 0.2 && u < 0.3 ? 'unhook' : u >= 0.3 && u < 0.42 ? 'guide' : 'look'); }
    const n = landNow(); if (!n || n.done) return 'look'; const u = n.u, hk = typeof LANDING !== 'undefined' ? LANDING.hooked : 0.86;
    if (g.dyn === 'hekt'){ if (n.i < 0) return 'tend'; if (n.back) return u >= 0.74 && u < hk ? 'guide' : u >= hk && u < 0.95 ? 'unhook' : 'look';
      return u >= 0.18 && u < 0.3 ? 'guide' : u >= 0.3 && u < 0.44 ? 'unhook' : u >= 0.44 && u < 0.56 ? 'guide' : u >= 0.56 && u < 0.66 ? 'look' : 'tend'; }
    if (n.i < 0) return n.e > 0.5 ? 'signal' : 'look';
    return n.back ? (u >= 0.56 && u < hk ? 'signal' : 'look') : ((u >= 0.08 && u < 0.32) || (u >= 0.42 && u < 0.62) ? 'signal' : 'look'); }

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
    // the autoliner's hauling station inside the port (anchors.aline, H2d2 06.11.2026): the line comes in over the sill roller across the
    // boat to the hauler, the hook cleaner and on to the magazine (tools/gear/autoline.py); both hands stand aft of it. The gaffer by the
    // plating facing the sill, where each fish is taken in; the one minding the hook cleaner and the line inboard of him, facing the
    // cleaner; the fish let fall at the drop slide on into the chute's mouth in the back wall (al45.py), to the bleeding tanks inside
    const AL = G.aline; if (AL && AL.foot){ const F = AL.foot, sl = AL.sill || [F[0] + 1, F[1] + 0.75, F[2]], fz = AL.fish ? AL.fish[2] : F[2] + 0.4;
      const gx = F[0] + 0.55, gz = F[2] + 0.88, tx = F[0] - 0.9, tz = F[2] + 0.82;
      PL.port = {gaff:[gx, gz, face(gx, gz, sl[0], sl[2]), 'haul'], tend:[tx, tz, face(tx, tz, F[0] - 0.42, F[2]), 'coil'],
        drop:[F[0] - 0.3, F[1] + 0.05, fz], chute:AL.fish ? [AL.fish[0] + 0.05, F[1] + 0.08, fz] : [F[0] - 2.2, F[1] + 0.08, fz]}; }
    return (ST.PL = PL);
  }
  const near = (x, z, r) => ST.M.near(x, z, r || 1.5);
  const at = (q, r) => { if (!q) return null; const c = near(q[0], q[1], r || 1.2); return c >= 0 ? {k:c, h:q[2], task:q[3]} : null; };
  // (more jigging than there are places, OB6 09.11.2026: the one over stands by rather than inside the other, F19)
  function jigSpot(k){ const J = ST.jig; if (J && J.length){ if (k >= J.length) return null; const P = J[k], sg = P[0] >= 0 ? 1 : -1, c = near(P[0] - sg * 0.45, P[2], 1.2); if (c >= 0) return {k:c, h:sg * Math.PI / 2, task:'jig', jig:k % J.length}; }
    const sp = ST.PT['spot' + k] || ST.PT.spot0; return sp ? {k:sp.k, h:sp.h || 0, task:'jig'} : null; }
  // the n-th at the gutting table or the tub: the place from the anchors, the next along the table's side
  // (the side of the first that is a short walk from it: a place across a bar or a step would be a detour round the deck)
  function deckAt(q, n, task){ if (!q) return null; if (!n) return {k:q.k, h:q.h || 0, task}; const p = ST.M0.at(q.k), d = 0.7 * Math.ceil(n / 2); let best = null, bl = 1e9;
    // (a place someone has already is no place: the third at a table took the same side as the second, and stood 0.4 m from him)
    const clearOf = c => { const u = ST.M.at(c); for (const [t0] of TAKEN){ const w = ST.M.at(t0); if (Math.hypot(u[0] - w[0], u[2] - w[2]) < 0.55) return false; } return true; };
    for (const s of [1, -1]){ const c = near(p[0], p[2] + s * d, 0.5); if (c < 0 || !clearOf(c)) continue; const P = deckPath(ST.M, ST.M.ok(q.k) ? q.k : near(p[0], p[2], 1), c); if (!P) continue;
      let L = 0; for (let i = 1; i < P.length; i++){ const A0 = ST.M.at(P[i - 1]), B0 = ST.M.at(P[i]); L += Math.hypot(B0[0] - A0[0], B0[2] - A0[2]) + (ST.M.LINK[P[i - 1]] && ST.M.LINK[P[i - 1]].includes(P[i]) ? 3 : 0); }
      if (L < bl){ bl = L; best = c; } }
    if (best != null && bl < d * 2.5 + 0.6) return {k:best, h:q.h || 0, task};
    // (F19, OB3: no place fore or aft of the first, a table across the boat or a narrow station: the nearest cell 0.6 to 0.95 m from
    // him on his own deck, a short walk away, rather than on the same point)
    const b2 = beside(q.k, Math.ceil(n / 2), task, q.h || 0); return {k:b2 >= 0 ? b2 : q.k, h:q.h || 0, task}; }
  // the nearest cell 0.6 to 0.95 m (times w) from a place, on its own deck and a short walk from it, 0.55 m clear of everyone's place
  function beside(k1, w, task, h){ let b2 = -1, bv = 1e9; const M = ST.M, p = ST.M0.at(k1), k0 = M.ok(k1) ? k1 : near(p[0], p[2], 1);
    for (let k = 0; k < M.nx * M.nz; k++){ if (!M.ok(k)) continue; const c = M.at(k), dd = Math.hypot(c[0] - p[0], c[2] - p[2]); if (dd < 0.6 || dd > 0.95 * w || Math.abs(c[1] - p[1]) > 0.2) continue;
      let cl = 9; for (const [t0] of TAKEN){ const u = M.at(t0); cl = Math.min(cl, Math.hypot(u[0] - c[0], u[2] - c[2])); } if (cl < 0.55) continue;
      const v = Math.abs(dd - 0.7) + poseHits(task, k, h) * 2; if (v < bv){ const P = k0 >= 0 ? deckPath(M, k0, k) : null; if (P && P.length <= 8){ bv = v; b2 = k; } } }
    return b2; }

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
    WA = moorCrew(WA);
    if (ST.helmView && me && ['haling', 'blogg', 'sloy', 'is', 'sort'].includes(me.st)){
      const sub = ['pause', 'is', 'sloy', 'blogg'].map(k => WA.find(p => p.c && p.st === k && p !== me)).find(Boolean);
      if (sub){ WA = WA.map(p => Object.assign({}, p)); const m2 = WA.find(p => !p.c), s2 = WA.find(p => p.c === sub.c); [s2.st, s2.role, s2.bl, s2.jw] = [m2.st, m2.role, m2.bl, m2.jw]; m2.st = 'ror'; m2.role = null; } }
    // man overboard (Ø11.6, ui/10s-mob.js): one hand on a break, else the one with the least to do, keeps the person in sight and points
    // (the drill: never lose sight of her); the bearing is in the boat's own frame, 0 ahead and + to starboard, as the agents' heading
    const sp = !src && typeof MOBUI !== 'undefined' && MOBUI.spot ? MOBUI.spot() : null;
    if (sp != null){ const q = ['pause', 'is', 'sloy', 'blogg', 'fiske', 'sort'].map(k => WA.find(p => p.c && p.st === k)).find(Boolean); if (q) WA = WA.map(p => p === q ? Object.assign({}, p, {spot:sp}) : p); }
    // the packed boxes of fish (40 kg each, the iced catch): a hold boat's go down the hatch as they fill (the errand), an open boat's catch lies in her tubs
    const iced = (S.hold || []).reduce((a, x) => a + (x.iced && !(SPECIES[x.sp] || {}).live ? x.kg : 0), 0), holdBoat = ((VESSELS[ST.type] || {}).hold || {}).kind !== 'dekk';
    return {away, underway, port, hasBunks, open:!!G.open, deckTask:gutting ? 'gut' : 'pack', wind, night, WA, aground:b.status === 'aground', fishing:b.status === 'fishing', crates:holdBoat ? Math.floor(iced / CRATE_KG) : -1, crateFill:holdBoat ? (iced % CRATE_KG) / CRATE_KG : 0};
  }
  // ---- the lines and the fenders round a quay (OB2, Jonas 09.11.2026; docs/planer/om-bord.md F1-F3) ----
  // The core gives the hands for them (13-work.js, the station 'fort', on the game's clock: 05-vessels.js moorPhase). The view may be
  // slower than that spell (she is still on her way in to the berth, a hand still walking to the next line): the same hands stay on them
  // and the helm is held until the view says she lies made fast (the core never waits for the view). Each hand goes to the next thing
  // left: with two, the one forward takes the bow line and the forward fender, the one aft the springs, the stern line and the others.
  function moorCrew(WA){
    const m = moorNow(); if (!m){ ST.fortIds = null; return WA; }
    const idOf = p => p.c ? 'c' + p.c.id : 'me';
    let F = WA.filter(p => p.st === 'fort');
    if (F.length) ST.fortIds = F.map(idOf);
    else if (ST.fortIds && ST.fortIds.length){   // (never the cook from the stove nor the one at the helm)
      for (const p of WA) if (ST.fortIds.includes(idOf(p)) && p.st !== 'kokk' && p.st !== 'ror'){ p.st = 'fort'; p.idle = null; p.role = null; p.why = 'moor'; }
      F = WA.filter(p => p.st === 'fort'); }
    // (the helm is held until she lies made fast, by you when you are aboard and not on the lines yourself)
    if (m.phase === 'in' || m.phase === 'prep' || (m.phase === 'lines' && F.some(p => p.c))){ const me = WA.find(p => !p.c); if (me && me.st !== 'fort' && me.st !== 'ror'){ me.st = 'ror'; me.idle = null; me.why = 'skipper'; } }
    const need = m.need || [], two = F.length >= 2, fwd = k => k === 'c:bow' || k === 'f0';
    F.forEach((p, n) => { const mine = need.filter(k => !two || fwd(k) === (n > 0)); p.mo = mine[0] || (m.phase === 'stow' ? 'coil' : two && n > 0 ? 'c:bow' : 'c:mid'); });
    return WA;
  }
  // the place for a part of it: inboard of the fender or the cleat, facing the quay's side (the hands over the rail: tending the fender,
  // throwing and taking in the line), or coiling the line by the middle cleat
  // (the nearest cell to the part on the deck the crew live on, on the quay's side, with the rail within reach before it: the cleat
  // from the model's measures may be where nobody stands, the bow of a boat whose foredeck is not walked on; kept per boat and kit)
  const MOORPL = new Map();
  function moorPlace(key, sd0){
    const m = moorNow(), sd = sd0 || (m && m.side) || 1, id = ST.type + '|' + (key || '') + '|' + sd + '|' + ST.kitSig;
    if (MOORPL.has(id)){ const g = MOORPL.get(id); return g && Object.assign({}, g); }
    const Sp = moorSpots(ST.G, sd), M = ST.M, h = sd * Math.PI / 2; let P, task;
    if (key && key[0] === 'f'){ P = Sp.fend[+key[1]] || Sp.fend[1]; task = 'pick'; }
    else { P = Sp.cleat[key === 'coil' || !key ? 'mid' : key.slice(2)] || Sp.cleat.mid; task = key === 'coil' ? 'coil' : 'haul'; }
    const tx = P[0] - sd * 0.5, tz = P[2], C = [];
    for (let k = 0; k < M.nx * M.nz; k++){ if (!M.ok(k) || !livePart(k)) continue; const q = M.at(k); if (q[0] * sd < -0.2) continue; C.push([Math.hypot(q[0] - tx, (q[2] - tz) * 1.2), k]); }
    C.sort((a, b) => a[0] - b[0]); let k0 = -1;
    if (key === 'coil') k0 = C.length ? C[0][1] : -1;
    else for (const [, k] of C.slice(0, 60)){ const q = M.at(k), rl = railAt(k, h); if (!rl) continue;
      // (at the ship's side: no deck outboard of it, and the open sea beyond the rail, not a house or a wall)
      const ox = q[0] + sd * (rl[0] + 0.45); if (M.ok(M.cellOf(q[0] + sd * 0.5, q[2])) || M.hit([ox, q[1] + 1.4, q[2]], [ox, q[1] - 2.5, q[2]]) >= 0) continue; k0 = k; break; }
    if (k0 < 0 && C.length) k0 = C[0][1];
    const g = k0 < 0 ? null : {k:k0, h, task, mo:key || 'c:mid'}; MOORPL.set(id, g); return g && Object.assign({}, g);
  }
  // where a line is made fast and a fender hangs: at the rail before the place of its hand (the cleat from the model's measures may be
  // where nobody can stand, the bow of a boat whose foredeck is not walked on: the line is then led from where the hand is), in the
  // boat's frame [x, the rail's top, z]; null without a place
  const MOORAT = new Map();
  function moorAt(key, sd){ if (!ready()) return null; sd = sd || 1; const id = ST.type + '|' + key + '|' + sd + '|' + ST.kitSig; if (MOORAT.has(id)) return MOORAT.get(id);
    const g = moorPlace(key, sd); let out = null;
    if (g){ const p = ST.M.at(g.k), rl = railAt(g.k, g.h); out = [p[0] + sd * (rl ? rl[0] : 0.4), p[1] + (rl ? rl[1] : 1.0), p[2]]; }
    MOORAT.set(id, out); return out; }
  // for the view: which of the parts have their hand there now, and how many are on them
  function moorMan(){ const out = new Set(); for (const a of A) if (a.st === 'fort' && a.goal && a.goal.mo && a.mode === 'at' && a.cell === a.goal.k && a.blend > 0.5) out.add(a.goal.mo); return out; }
  const moorHands = () => A.filter(a => a.st === 'fort').length;
  // the place on the rail that faces the person most nearly (lean places face out over the rail), turned to her, the arms out (drawWorker 'guide')
  function spotGoal(p){
    const id = p.c ? 'c' + p.c.id : 'me', h = p.spot, L0 = (ST.PT.lean || []).filter(l => ST.M.ok(l.k) && livePart(l.k) && free(l.k, id)); if (!L0.length) return null;
    const dh = a => { let d = a - h; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return Math.abs(d); };
    const l = L0.slice().sort((a, b) => dh(a.h || 0) - dh(b.h || 0))[0]; return {k:l.k, h, task:'guide', spot:true};
  }
  // the agent's goal from the context, for the n-th person on its station (the first at the table, the second beside him ...): null means
  // inside (the house, the bunks, ashore), not drawn
  function goalOf(p, ctx, n){
    const PT = ST.PT, PL = places(), st = p.st;
    if (ctx.away) return null;
    if (p.spot != null){ const g = spotGoal(p); if (g) return g; }
    if (st === 'fort') return moorPlace(p.mo) || idleGoal(p, ctx, 'look');
    if (st === 'ror'){ if (PT.ror) return {k:PT.ror.k, h:PT.ror.h || 0, task:'helm', inside:'helm'}; return PT.door ? {k:PT.door.k, h:PT.door.h || 0, task:'helm', inside:'helm'} : null; }
    // the autoliner (H2d2, places port): the deck map is her hauling station inside the port, the rest of her is inside. At the line the
    // hauler gaffs the fish in at the port, and the deck hand on the bleeding minds the hook cleaner and sees the fish into the chute (the
    // bleeding itself is inside, at the tanks the chute leads to); everyone else of the watch (more at the line, the gutting, the
    // freezing) and those on a break are in the factory and the mess, through the doorway in the station's back wall
    if (ST.G.aline && PL.port){ if (st === 'haling' && n === 0 && p.role === 'haler'){ const q = at(PL.port.gaff, 0.6); if (q) return q; }
      if (st === 'blogg' && n === 0){ const q = at(PL.port.tend, 0.6); if (q) return q; }
      return PT.door ? {k:PT.door.k, h:PT.door.h || 0, task:null, inside:'in'} : null; }
    // (OB4: the hands at the landing, the ice and her own crane, 13-work.js quayRoles; without a place for it, the break as before)
    if (p.role && (st === 'pause' || st === 'last')){ const id = p.c ? 'c' + p.c.id : 'me';
      const q = st === 'last' ? (p.role === 'kran' ? kranPlace(id) : null) : p.role === 'hekt' ? hektPlace(id) : p.role === 'luke' ? lukePlace(id) : p.role === 'isrom' ? isPlace(id) : null; if (q) return q; }
    // (OB14: the deck washed down, the packed lunch, the cold, 13-work.js deckRoles; without a place for it, the break as before)
    if (DROLE[p.role] && st === 'pause'){ const id = p.c ? 'c' + p.c.id : 'me', r = p.role;
      if (r === 'spyl' || r === 'kost'){ const Wk = ST.G.work, Dk = ST.G.deck || {}, wy = Wk ? Wk.table[1] : Dk.y;
        if (wy != null && PT.sloy && ST.M.ok(PT.sloy.k) && Math.abs(ST.M.at(PT.sloy.k)[1] - wy) > 0.5) return PT.door ? {k:PT.door.k, h:PT.door.h || 0, task:null, inside:'in'} : null;
        const q = washPlace(id, r); if (q) return q; }
      else { const q = r === 'mat' ? matPlace(id) : frysPlace(p, ctx); if (q) return q; } }
    // a break as the game chose it (core/13-work.js idleAssign): inside, asleep in the bunk and up at the shop are not on deck
    if (st === 'pause' && p.idle){ if (p.idle === 'inside' || p.idle === 'sleep' || p.idle === 'shop') return PT.door ? {k:PT.door.k, h:PT.door.h || 0, task:null, inside:'in'} : null; return idleGoal(p, ctx); }
    if (ctx.underway && !ctx.open && st === 'pause') return PT.door ? {k:PT.door.k, h:PT.door.h || 0, task:null, inside:'in'} : null;   // under way the crew are inside (03.10.2026)
    if (ctx.port && ctx.hasBunks && !ctx.open && p.c && p.c.fatigue >= 1 && st === 'pause') return PT.door ? {k:PT.door.k, h:PT.door.h || 0, task:null, inside:'in'} : null;   // asleep in the bunks (tilbakemelding #65)
    // the deck work under a shelter deck or below the weather deck (the 15 m coastal boat's table, the longliner's factory deck): the
    // place on the deck map is the deck over it, so they work inside, out of sight, and nobody reaches down through the deck
    const below = y => y != null && ST.M.ok((PT.sloy || {}).k) && Math.abs(ST.M.at(PT.sloy.k)[1] - y) > 0.5, IN = PT.door ? {k:PT.door.k, h:PT.door.h || 0, task:null, inside:'in'} : null;
    const Wk = ST.G.work, Dk = ST.G.deck || {}, workY = Wk ? Wk.table[1] : Dk.y;
    if ((st === 'sloy' || st === 'is') && below(workY)) return IN;
    // (the hauling place on another deck than the hauler: the deck over it, or far under it. A hauler on a high rail is still worked from
    // the deck: F24, OB3; before, 1.2 m either way, and the 15 m and the 21 m boats hauled with nobody at the hauler, 1.25 and 1.30 m)
    // (setting, OB3: one at the stern paying the gear out, the next handing it to him; nobody at the hauler, wherever it stands)
    if (st === 'haling' && (p.role === 'sett' || p.role === 'lang')){ const kind = !src && S.boat.gop ? S.boat.gop.kind : 'line', id = p.c ? 'c' + p.c.id : 'me';
      const q = p.role === 'sett' ? setPlace(kind, id) : langPlace(kind, id); return q || idleGoal(p, ctx, 'look'); }
    if ((st === 'haling' || st === 'blogg') && ST.G.hauler && PT.haling){ const dy = ST.G.hauler[1] - ST.M0.at(PT.haling.k)[1]; if (dy < -0.3 || dy > 1.7) return IN; }
    if (st === 'sloy') return deckAt(PT.sloy, n, 'gut') || idleGoal(p, ctx, 'look');
    // (on a boat with a hold the packer turns his back to the bleeding tub: the box he packs stands on the deck before him, by the hatch)
    if (st === 'is'){ const g = deckAt(PT.is, n, 'pack'); if (g && ((VESSELS[ST.type] || {}).hold || {}).kind !== 'dekk') g.h = (g.h || 0) + Math.PI; return g || idleGoal(p, ctx, 'look'); }
    // (the second sorting the crab stands beside the first, not 0.4 m from him in a clump by the hauler: OB3, F19)
    if (st === 'sort'){ const q = at(PL.pot, 1.4); if (q && n){ const k2 = beside(q.k, Math.ceil(n / 2), 'tend', q.h || 0); if (k2 >= 0) q.k = k2; } return q || idleGoal(p, ctx, 'look'); }
    if (st === 'blogg') return at(PL.bleed, 1.4) || idleGoal(p, ctx, 'look');
    if (st === 'haling'){ const q = p.role === 'plukk' ? at(PL.pick, 1.4) : p.role === 'teine' ? at(PL.pot, 1.4) : at(PL.haul[Math.min(1, n)], 1.4); return q || idleGoal(p, ctx, 'look'); }
    if (st === 'fiske'){ const q = jigSpot(n); return q || idleGoal(p, ctx, 'lean'); }
    if (st === 'stell' && p.jw && (p.jw.kind === 'pr' || p.jw.kind === 'jg')){ const q = at(PL.pot, 1.4); return q || idleGoal(p, ctx, 'look'); }   // (the pots and the jig sets are seen to by the hauler's side)
    if (st === 'egn' || st === 'strip' || st === 'stell'){ const q = at(PL.tubAt(n), 1.2); if (q){ q.task = st === 'stell' ? 'egn' : st; q.tub = n; } return q || idleGoal(p, ctx, 'look'); }
    if (st === 'mend'){ const q = PL.mend[n % Math.max(1, PL.mend.length)], g = q ? at(q, 1.0) : null; if (g) g.task = 'mend'; return g || idleGoal(p, ctx, 'look'); }
    if (st === 'last'){ const q = at(PL.cargo, 1.6); if (q && p.role === 'hekt'){ q.task = 'unhook'; q.dyn = 'kai'; } return q || idleGoal(p, ctx, 'look'); }
    if (st === 'kokk') return PT.door ? {k:PT.door.k, h:PT.door.h || 0, task:null, inside:'in'} : null;
    return idleGoal(p, ctx);
  }
  // the station and its part (at the hauler: the hauler, the picker, the pot hand): a person keeps the place while it stays the same
  const QROLE = {hekt:1, luke:1, isrom:1, kran:1}, DROLE = {spyl:1, kost:1, mat:1, frys:1};
  const kindOf = p => p.spot != null ? 'spot' : p.st === 'fort' ? 'fort:' + (p.mo || '') : DROLE[p.role] && p.st === 'pause' ? 'dekk:' + p.role + (p.role === 'frys' ? ':' + p.idle : '') : QROLE[p.role] && (p.st === 'pause' || p.st === 'last') ? 'kai:' + p.st + ':' + p.role + (p.role === 'hekt' && p.st === 'pause' ? ':' + ((landNow() || {}).place || 0) : '') : p.st === 'haling' ? 'haling:' + (p.role === 'haler' ? 'h' : p.role) : p.st === 'pause' && p.idle ? 'pause:' + p.idle + (p.with ? '>' + p.with : '') : p.st;
  // ---- a free person: something to do for a while, by the weather, the hour and their nature ----
  const IDLE = ['lean', 'lean', 'look', 'coffee', 'sweep', 'sit'];
  // (p.idle: the break the game chose, kept as long as it lasts there; each its own place and pose, view3d.js drawWorker: facing out over
  // the rail (lean, look, coffee, smoke, snus, the phone, the binoculars, the northern lights, seasick), back to the rail (back, chat, the
  // knife, the lunch), over the deck (scrub, hose), sitting on a tub (sit), by the gear (gear))
  const IDLE_IN = {back:1, chat:1, knife:1, lunch:1, sweep:1, hose:1, sit:1, worry:0};
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
  function poseSegs(k, rail){ return LEMMER.on ? poseSegsIk(k, rail) : poseSegs0(k, rail); }
  // (as before FB2: each limb one line from the root to the hand or the foot; used while the solver is off, LEMMER.on)
  function poseSegs0(k, rail){
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
      // the work at its places (the stations' own places from the models; tested, not chosen)
      // (at the rail, rail is its top as at a break: the jig hauled up over it, the hauler's lever and the line just over it; at the gutting
      // table rail[1] is the table's top, the hands working on it)
      case 'jig': return rail ? std([d, top + 0.4, 0.16], [d - 0.04, top + 0.01, -0.16]) : std([0.34, 1.3, 0.16], [0.3, 0.9, -0.16]);
      case 'haul': return rail ? std([d + 0.06, top + 0.1, 0.2], [d + 0.1, top + 0.24, -0.06]) : std([0.42, 1.08, 0.2], [0.52, 1.22, -0.06]);
      case 'bleedst': return std([0.3, 0.92, 0.2], [0.28, 0.95, -0.18]);
      case 'pick': return rail ? std([d + 0.04, top + 0.03, 0.14], [d + 0.04, top + 0.03, -0.14]) : std([0.48, 0.92, 0.16], [0.48, 0.92, -0.16]);
      case 'tend': return std([0.48, 0.92, 0.16], [0.48, 0.92, -0.16]);
      // (setting: the hands on the gear just inside the rail, paying it out over it; rail is [ahead, height] of where it goes over)
      case 'sett': return rail ? std([R[0] + 0.1, R[1] + 0.08, 0.13], [R[0] + 0.1, R[1] + 0.08, -0.13]) : std([0.5, 1.1, 0.13], [0.5, 1.1, -0.13]);
      case 'mend': return std([0.42, 1.0, 0.12], [0.42, 1.02, -0.1]);
      // (OB4, the landing and the ice: the signs to the crane driver, the arms up to the load, a hand at the ring of the sling, the
      // crane's remote, the end of the ice hose held over the box before him; view3d/08-plants.js drawWorker)
      case 'signal': return std([0.26, 1.72, 0.44], [0.25, 0.95, -0.22]);
      case 'guide': return std([0.42, 1.62, 0.22], [0.42, 1.62, -0.22]);
      case 'unhook': return std([0.38, 1.9, 0.08], [0.35, 1.3, -0.18]);
      case 'remote': return std([0.3, 1.05, 0.11], [0.3, 1.05, -0.11]);
      case 'nozzle': return std([0.42, 0.85, 0.06], [0.36, 0.98, -0.12]);
      // (OB14: the packed lunch and the coffee seated on an upturned tub, the lunch box on the knee and the flask on the deck beside him;
      // the cold: the arms beaten round the chest and swung out again, the hands rubbed before it; view3d/08-plants.js drawWorker)
      case 'sitmat': case 'sitkaffe': return [[[-0.04, 0.5, 0.12], [0.38, 0.52, 0.15]], [[0.38, 0.52, 0.15], [0.44, 0.08, 0.17]], [[-0.04, 0.5, -0.12], [0.38, 0.52, -0.15]], [[0.38, 0.52, -0.15], [0.44, 0.08, -0.17]], [[0, 0.55, 0], [0.1, 1.05, 0]],
        [[0.15, 1.08, 0], [0.22, 1.36, 0]], [[0.06, 1.0, 0.2], [0.2, 1.1, 0.04]], [[0.06, 1.0, -0.2], [0.34, 0.68, -0.1]], [[-0.31, 0.2, 0], [0.19, 0.2, 0]], [[-0.06, 0.2, 0.25], [-0.06, 0.2, -0.25]], [[-0.06, 0.02, 0], [-0.06, 0.45, 0]]]
        .concat(k === 'sitkaffe' ? [[[0.1, 0.0, -0.36], [0.1, 0.32, -0.36]]] : []);
      case 'cold': return std([0.2, 1.36, -0.14], [0.2, 1.36, 0.14], [[0.02, 1.42, 0.21], [0.14, 1.22, 0.56]], [[0.02, 1.42, -0.21], [0.14, 1.22, -0.56]], [[0.02, 1.42, 0.21], [0.28, 1.46, 0.03]]);
      case 'helm': return std([0.3, 1.1, 0.17], [0.3, 1.1, -0.17]);
      case 'gut': { const tt = rail ? rail[1] : 0.9; return std([0.42, tt + 0.28, 0.2], [0.36, tt + 0.06, -0.12]); }
      case 'pack': return std([0.4, 0.95, 0.15], [0.08, 1.02, -0.2]);
      case 'aurora': case 'look': default: return std([0, 0.93, 0.19], [0, 0.93, -0.19]);
    }
  }
  function poseSegsIk(k, rail){
    const R = rail || [0.42, 1.0], d = R[0] + 0.02, top = R[1] + 0.04;
    // (FB2, steg 123: the limbs as they are drawn, with the solver that draws them: the knee and the elbow where ik2 and armIk put
    // them, each limb two lines, and the torso, the shoulders and the head gone after a hand out of reach, reachBody. The back's own
    // bend at the work (view3d/08-plants.js workLow) is not in these lines, as before: b0 is 0 until the pose is read from the drawing, FB1)
    const C = LEMMER, L0 = limbLen(null), HY = 0.92, b0 = 0, HX = 0, SHL = [[0, C.SH[0], C.SH[1]], [0, C.SH[0], -C.SH[1]]];
    // (the lines of one limb are one limb to poseHits, which counts limbs through something as before: tagged g)
    let gid = 0; const limb = segs => { gid++; for (const q of segs) q.g = gid; return segs; };
    const leg = (hip, foot, pole) => { const o = ik2(hip, foot, L0.th, L0.sn, pole || [C.KNEE[0], C.KNEE[1], 0]); return limb([[hip, o.j], [o.j, o.e]]); };
    // (an arm from a shoulder at sh to a hand at hd, the torso standing straight under the shoulder: the wrist a hand's length back)
    const tip = (el, wr) => { const f = [wr[0] - el[0], wr[1] - el[1], wr[2] - el[2]], fl = Math.hypot(f[0], f[1], f[2]) || 1; return [wr[0] + f[0] / fl * C.HAND, wr[1] + f[1] / fl * C.HAND, wr[2] + f[2] / fl * C.HAND]; };
    const arm = (sh, hd, sd) => { const s0 = SHL[sd > 0 ? 0 : 1], o = armHand(s0, [hd[0] - sh[0] + s0[0], hd[1] - sh[1] + s0[1], hd[2] - sh[2] + s0[2]], sd, L0);
      const w = q => [q[0] - s0[0] + sh[0], q[1] - s0[1] + sh[1], q[2] - s0[2] + sh[2]], el = w(o.j), wr = w(o.e); return limb([[sh, el], [el, wr], [wr, o.over > 0 || o.near > 0 || o.push > 0 ? tip(el, wr) : hd]]); };
    // (standing: the knee as the drawn leg has it, to the ankle 8 cm up; the shin's line ends 10 cm over the deck, as the leg's line did)
    const stand = (hip, r) => { const o = ik2(hip, [0, 0.08, r], L0.th, L0.sn, [C.KNEE[0], C.KNEE[1], 0]), k = o.j, t = (k[1] - 0.1) / (k[1] - o.e[1]); return limb([[hip, k], [k, [k[0] + (o.e[0] - k[0]) * t, 0.1, k[2] + (o.e[2] - k[2]) * t]]]); };
    const legs = stand([0, HY, 0.11], 0.12).concat(stand([0, HY, -0.11], -0.12));
    const std = (r, l, ...more) => { const hips = q => [q[0] - HX, q[1] - HY, q[2]], wrist = (hd, i) => { const s = torsoPt(SHL[i], b0, 0), q = hips(hd), v = [q[0] - s[0], q[1] - s[1], q[2] - s[2]], n = Math.hypot(v[0], v[1], v[2]) || 1; return [q[0] - v[0] / n * C.HAND, q[1] - v[1] / n * C.HAND, q[2] - v[2] / n * C.HAND]; };
      const rb = reachBody(SHL, [wrist(r, 0), wrist(l, 1)], (L0.ua + L0.fa) * C.REACH, b0), bT = b0 + rb.b, tw = rb.t, at = (q, t) => { const p = torsoPt([q[0], q[1] - HY, q[2]], bT, t == null ? tw : t); return [p[0] + HX, p[1] + HY, p[2]]; }, seg = (A, B, t) => [at(A, t), at(B, t)];
      const out = stand([0, HY, 0.11], 0.12).concat(stand([0, HY, -0.11], -0.12), [seg([0, 0.95, 0], [0, 1.45, 0]), seg([0.12, 1.0, 0], [0.12, 1.38, 0]), seg([-0.12, 1.0, 0], [-0.12, 1.38, 0]), seg([0, 1.42, 0.21], [0, 1.42, -0.21]), seg([0, 1.5, 0], [0, 1.8, 0], 0), seg([0.13, 1.64, 0], [-0.13, 1.64, 0], 0)]);
      for (const i of [0, 1]){ const sd = i ? -1 : 1, hd = i ? l : r, o = armHand(SHL[i], torsoInv(hips(hd), bT, tw), sd, L0), sh = at([0, 1.42, sd * C.SH[1]]), el = at([o.j[0], o.j[1] + HY, o.j[2]]), wr = at([o.e[0], o.e[1] + HY, o.e[2]]);
        for (const q of limb([[sh, el], [el, wr], [wr, o.over > 0 || o.near > 0 || o.push > 0 ? tip(el, wr) : hd]])) out.push(q); }
      return out.concat(more); };
    // (seated: the knees up and ahead)
    const SITP = [0.3, 1, 0];
    switch (k){
      case 'lean': return std([d, top, 0.2], [d, top, -0.2]);
      case 'coffee': return std([0.18, 1.5, 0.04], [0.05, 0.85, -0.25], [[0.12, 0.0, -0.32], [0.12, 0.32, -0.32]]);
      // (the feet out before him: the hips come down until the legs reach them, legDrop, and the body with them)
      case 'back': { const ft = [[0.3, 0.08, -0.05], [0.2, 0.08, -0.13]], dr = legDrop([[0.05, HY, 0.11], [0.05, HY, -0.11]], ft, L0), y = v => v - dr;
        return leg([0.05, y(0.92), 0.11], ft[0]).concat(leg([0.05, y(0.92), -0.11], ft[1]), [[[0.05, y(0.95), 0], [-0.07, y(1.45), 0]], [[-0.17, y(1.0), 0], [-0.19, y(1.38), 0]], [[-0.07, y(1.5), 0], [-0.1, y(1.8), 0]]],
          arm([0.02, y(1.42), 0.21], [0.17, 1.18, -0.07], 1), arm([0.02, y(1.42), -0.21], [0.17, 1.16, 0.07], -1)); }
      case 'sit': return leg([-0.04, 0.5, 0.12], [0.44, 0.08, 0.17], SITP).concat(leg([-0.04, 0.5, -0.12], [0.44, 0.08, -0.17], SITP), [[[0, 0.55, 0], [0.1, 1.05, 0]],
        [[0.15, 1.08, 0], [0.22, 1.36, 0]]], arm([0.06, 1.0, 0.2], [0.36, 0.7, 0.05], 1), arm([0.06, 1.0, -0.2], [0.36, 0.7, -0.05], -1), [[[-0.31, 0.2, 0], [0.19, 0.2, 0]], [[-0.06, 0.2, 0.25], [-0.06, 0.2, -0.25]], [[-0.06, 0.02, 0], [-0.06, 0.45, 0]]]);
      case 'chat': return std([0.34, 1.3, 0.2], [0.04, 0.92, -0.22]);
      case 'knife': return std([0.45, 1.2, 0.13], [0.3, 1.02, -0.06], [[0.3, 1.02, -0.06], [0.42, 1.3, 0.03]]);
      case 'lunch': return std([0.13, 1.5, 0.03], [0.3, 1.03, -0.1], [[0.3, 1.03, -0.2], [0.3, 1.03, 0.0]]);
      case 'phone': return std([0.26, 1.13, 0.035], [0.26, 1.12, -0.035]);
      case 'binoc': return std([0.15, 1.56, 0.07], [0.15, 1.56, -0.07], [[0.15, 1.57, 0], [0.3, 1.57, 0]]);
      case 'seasick': return legs.concat([[[0.03, 0.95, 0], [0.44, 1.42, 0]], [[0.5, 1.5, 0], [0.62, 1.66, 0]]], arm([0.44, 1.42, 0.21], [d, top, 0.24], 1), arm([0.44, 1.42, -0.21], [d, top, -0.24], -1));
      case 'gear': return legs.concat([[[0.03, 0.92, 0], [0.26, 1.4, 0]], [[0.3, 1.48, 0], [0.34, 1.74, 0]]], arm([0.26, 1.4, 0.21], [0.45, 0.72, 0.15], 1), arm([0.26, 1.4, -0.21], [0.45, 0.72, -0.15], -1));
      case 'smoke': return std([0.24, 1.52, 0.17], [d, top, -0.2]);
      case 'snus': return std([0.26, 1.47, 0.02], [0.26, 1.1, -0.04]).concat(std([d, top, 0.2], [d, top, -0.2]));   // (the can and the portion, then the hands on the rail)
      case 'sweep': return std([0.25, 1.0, 0.1], [0.35, 0.8, -0.05], [[0.25, 1.0, 0.1], [0.8, 0.12, 0]], [[0.8, 0.06, 0.42], [0.8, 0.06, -0.42]]);
      case 'hose': return std([0.45, 1.15, 0.12], [0.3, 1.1, -0.1], [[0.12, 0.02, 0.62], [0.12, 0.46, 0.62]], [[0.12, 0.3, 0.5], [0.45, 1.15, 0.12]]);
      // the work at its places (the stations' own places from the models; tested, not chosen)
      // (at the rail, rail is its top as at a break: the jig hauled up over it, the hauler's lever and the line just over it; at the gutting
      // table rail[1] is the table's top, the hands working on it)
      case 'jig': return rail ? std([d, top + 0.4, 0.16], [d - 0.04, top + 0.01, -0.16]) : std([0.34, 1.3, 0.16], [0.3, 0.9, -0.16]);
      case 'haul': return rail ? std([d + 0.06, top + 0.1, 0.2], [d + 0.1, top + 0.24, -0.06]) : std([0.42, 1.08, 0.2], [0.52, 1.22, -0.06]);
      case 'bleedst': return std([0.3, 0.92, 0.2], [0.28, 0.95, -0.18]);
      case 'pick': return rail ? std([d + 0.04, top + 0.03, 0.14], [d + 0.04, top + 0.03, -0.14]) : std([0.48, 0.92, 0.16], [0.48, 0.92, -0.16]);
      case 'tend': return std([0.48, 0.92, 0.16], [0.48, 0.92, -0.16]);
      // (setting: the hands on the gear just inside the rail, paying it out over it; rail is [ahead, height] of where it goes over)
      case 'sett': return rail ? std([R[0] + 0.1, R[1] + 0.08, 0.13], [R[0] + 0.1, R[1] + 0.08, -0.13]) : std([0.5, 1.1, 0.13], [0.5, 1.1, -0.13]);
      case 'mend': return std([0.42, 1.0, 0.12], [0.42, 1.02, -0.1]);
      // (OB4, the landing and the ice: the signs to the crane driver, the arms up to the load, a hand at the ring of the sling, the
      // crane's remote, the end of the ice hose held over the box before him; view3d/08-plants.js drawWorker)
      case 'signal': return std([0.26, 1.72, 0.4], [0.25, 0.95, -0.22]);
      case 'guide': return std([0.42, 1.62, 0.22], [0.42, 1.62, -0.22]);
      case 'unhook': return std([0.36, 1.87, 0.1], [0.35, 1.3, -0.18]);
      case 'remote': return std([0.3, 1.05, 0.11], [0.3, 1.05, -0.11]);
      case 'nozzle': return std([0.42, 0.85, 0.06], [0.36, 0.98, -0.12]);
      // (OB14: the packed lunch and the coffee seated on an upturned tub, the lunch box on the knee and the flask on the deck beside him;
      // the cold: the arms beaten round the chest and swung out again, the hands rubbed before it; view3d/08-plants.js drawWorker)
      case 'sitmat': case 'sitkaffe': return leg([-0.04, 0.5, 0.12], [0.44, 0.08, 0.17], SITP).concat(leg([-0.04, 0.5, -0.12], [0.44, 0.08, -0.17], SITP), [[[0, 0.55, 0], [0.1, 1.05, 0]],
        [[0.15, 1.08, 0], [0.22, 1.36, 0]]], arm([0.06, 1.0, 0.2], [0.2, 1.1, 0.04], 1), arm([0.06, 1.0, -0.2], [0.34, 0.68, -0.1], -1), [[[-0.31, 0.2, 0], [0.19, 0.2, 0]], [[-0.06, 0.2, 0.25], [-0.06, 0.2, -0.25]], [[-0.06, 0.02, 0], [-0.06, 0.45, 0]]],
        k === 'sitkaffe' ? [[[0.1, 0.0, -0.36], [0.1, 0.32, -0.36]]] : []);
      case 'cold': return std([0.2, 1.36, -0.14], [0.2, 1.36, 0.14]).concat(std([0.14, 1.22, 0.56], [0.14, 1.22, -0.56]), arm([0, 1.42, 0.21], [0.28, 1.46, 0.03], 1));   // (round the chest, flung out, and up to the mouth)
      case 'helm': return std([0.3, 1.1, 0.17], [0.3, 1.1, -0.17]);
      case 'gut': { const tt = rail ? rail[1] : 0.9; return std([0.42, tt + 0.28, 0.2], [0.36, tt + 0.06, -0.12]); }
      case 'pack': return std([0.4, 0.95, 0.15], [0.2, 1.02, -0.2]);
      case 'aurora': case 'look': default: return std([0, 0.93, 0.19], [0, 0.93, -0.19]);
    }
  }
  // how many of a pose's limbs pass through the model at a place and heading, standing off it by off ([x, z] in the boat's frame)
  function poseHits(k, cell, h, rail, off){ const M = ST.M, p = M.at(cell), F = [Math.sin(h), -Math.cos(h)], Rv = [Math.cos(h), Math.sin(h)], o = off || [0, 0];
    const W = q => [p[0] + o[0] + F[0] * q[0] + Rv[0] * q[2], p[1] + q[1], p[2] + o[1] + F[1] * q[0] + Rv[1] * q[2]];
    let n = 0, last = 0; for (const q of poseSegs(k, rail)) if (!(q.g && q.g === last) && M.hit(W(q[0]), W(q[1])) >= 0){ n++; last = q.g || 0; } return n; }
  // a break at a rail place, its pose clear of everything: the heading (facing out, or inboard with the back to the rail), the rail's top
  // where the hands rest, and leaning back the place moved back until the back is at the rail
  // how a pose stands at a rail place: facing out, a step back when the rail is closer than 0.2 m (a thick bulwark); facing inboard, the
  // back that far off the rail as the pose needs (leaning back: at it; sitting on a tub: the tub clear of it)
  // (facing out, the hands that work in front of the chest need the rail that far off: the phone, the cup, the snus, the binoculars)
  const NEED_IN = {back:0.24, sit:0.46}, REACH = {cold:0.38, phone:0.34, coffee:0.3, binoc:0.36, snus:0.34, smoke:0.3, seasick:0.2, lean:0.2}, fitPlace = (k, q, way) => { const rl = railAt(q.k, q.h), inb = way == null ? !!IDLE_IN[k] : way, F = [Math.sin(q.h), -Math.cos(q.h)];
    if (!inb){ const need = REACH[k] || 0.2; if (rl && rl[0] < need){ const s = need - rl[0]; return {h:q.h, rail:[need, rl[1]], off:[-F[0] * s, -F[1] * s]}; } return {h:q.h, rail:rl, off:null}; }
    const need = NEED_IN[k] || 0.26, s = rl ? rl[0] - need : 0, sh = k === 'back' ? s : Math.min(0, s); return {h:q.h + Math.PI, rail:null, off:sh ? [F[0] * sh, F[1] * sh] : null}; };
  // (most breaks can be had either way, facing out or with the back to the rail: the other way is tried where the first is not clear)
  const BOTH = {coffee:1, phone:1, smoke:1, snus:1, lunch:1, look:1, chat:1, knife:1, sit:1};
  function idlePlace(k, L, id){
    const n0 = hashStr(id + k + Math.floor(S.t / 12)), ways = BOTH[k] ? [!!IDLE_IN[k], !IDLE_IN[k]] : [!!IDLE_IN[k]];
    for (const way of ways) for (let i = 0; i < L.length; i++){ const q = L[(n0 + i) % L.length], f = fitPlace(k, q, way);
      if (!poseHits(k, q.k, f.h, f.rail, f.off) && !kitAt(q.k, f.off)) return {k:q.k, h:f.h, rail:f.rail, off:f.off}; }
    return null; }
  // the parts of the deck the crew live on: those with a station, the door or the wheel; a place on the rail of a part only a wall away
  // (behind the house, the stern behind a bulkhead) is no place for a break
  function livePart(k){ const M = ST.M, C = deckComp(M);
    if (!M.live){ M.live = new Set(); for (const [nm, v] of Object.entries(ST.PT)) if (nm !== 'lean') for (const q of [].concat(v)) if (q && q.k != null && M.ok(q.k)) M.live.add(C[q.k]); }
    return M.live.has(C[k]); }
  function idleGoal(p, ctx, force){
    const PT = ST.PT, T = p.c && p.c.traits || [], id = p.c ? 'c' + p.c.id : 'me', leans = (PT.lean || []).filter(l => ST.M.ok(l.k) && livePart(l.k) && free(l.k, id)); if (!leans.length) return lookClear(id);
    if (!force && p.idle){ const k0 = p.idle, PL = places(), k = k0 === 'quay' ? 'chat' : k0 === 'worry' ? 'look' : k0;
      if (k === 'gear'){ const q = PL.tubAt ? at(PL.tubAt(0), 1.2) : null; if (q && !poseHits('gear', q.k, q.h || 0)){ q.task = 'gear'; q.idle = true; q.until = 1e12; return q; } }
      // under way a smoker stands aft (the aftmost places on the rail), out of the wind of her own speed
      const L = k === 'smoke' && ctx.underway ? leans.slice().sort((a, b) => ST.M.at(b.k)[2] - ST.M.at(a.k)[2]).slice(0, 3) : leans;
      // the first place where the pose is clear; none, then standing and looking out where that is clear
      const g1 = idlePlace(k === 'gear' ? 'look' : k, L, id), g = g1 || idlePlace('look', leans, id); if (!g) return lookClear(id);
      return {k:g.k, h:g.h, rail:g.rail, off:g.off, task:g1 && k !== 'gear' ? k : 'look', until:1e12, idle:true, with:p.with || null}; }
    let act = force || IDLE[Math.floor(rnd() * IDLE.length)];
    if (!force){ if (T.includes('makelig') && rnd() < 0.5) act = rnd() < 0.5 ? 'lean' : 'coffee'; if ((T.includes('arbeidsjern') || T.includes('perfeksjonist')) && rnd() < 0.5) act = 'sweep';
      if ((ctx.night || ctx.wind > 12) && rnd() < 0.5 && PT.door && !ctx.open) return {k:PT.door.k, h:PT.door.h || 0, task:null, inside:'in', until:nowS() + 40 + rnd() * 80}; }
    if (act === 'sit') act = 'lean';
    // sweeping is done with the back to the rail, over the deck: facing out the broom went over the side (Jonas 21.10.2026, #81 and
    // #84; the coiling went 02.11.2026: no rope to coil, and it looked like jigging); a place where the pose is clear of everything
    const g1 = idlePlace(act, leans.slice(Math.floor(rnd() * leans.length)).concat(leans), id), g = g1 || idlePlace('look', leans, id); if (!g) return lookClear(id);
    return {k:g.k, h:g.h, rail:g.rail, off:g.off, task:g1 ? act : 'look', until:nowS() + 30 + rnd() * 60, idle:true};
  }
  // ---- the work at its place, clear of everything: at the rail the hands go to the rail's own top (a step back when it is close), at the
  // table to the table's top; where a limb still goes through something, the nearest place within half a metre where none does, then a
  // little turn (the place from the anchors is the station's; this only moves the person within it)
  const RAILWORK = {jig:1, haul:1, pick:1};
  function fitWork(g, id){
    if (!g || g.inside || g.idle || !ST.M.ok(g.k)) return g; if (g.task === 'sett' || (g.dyn && g.dyn !== 'kai') || g.ice || g.task === 'remote' || g.wash) return g; const M = ST.M, h0 = g.h || 0;   // (the places of the setting and of the quay work are found with their poses tried, OB3 and OB4)
    const fit = (k, h) => { if (RAILWORK[g.task]){ const rl = railAt(k, h); if (!rl) return {rail:null, off:null}; const F = [Math.sin(h), -Math.cos(h)];
        if (rl[0] < 0.22){ const s = 0.22 - rl[0]; return {rail:[0.22, rl[1]], off:[-F[0] * s, -F[1] * s]}; } return {rail:rl, off:null}; }
      if (g.task === 'gut'){ const W0 = ST.G.work, d0 = ST.G.deck || {y:ST.G.gw || 0}, top = W0 && W0.own && W0.top != null ? W0.top : (d0.y || 0) + 0.885; return {rail:[0.4, top - M.at(k)[1]], off:null}; }
      return {rail:null, off:null}; };
    let f = fit(g.k, h0); if (!poseHits(g.task, g.k, h0, f.rail, f.off)){ g.rail = f.rail; g.off = f.off; return g; }
    // (FB2, F19: never to within 0.55 m of someone else's place: the second at a table was moved 0.4 m from the first when the guard got the elbows)
    const p0 = M.at(g.k), C = [], apart = q => { for (const [t0, who] of TAKEN){ if (who === id) continue; const u = M.at(t0); if (Math.hypot(u[0] - q[0], u[2] - q[2]) < 0.55) return false; } return true; };
    for (let k = 0; k < M.nx * M.nz; k++){ if (!M.ok(k) || !free(k, id)) continue; const q = M.at(k), d = Math.hypot(q[0] - p0[0], q[2] - p0[2]); if (d <= 0.5 && Math.abs(q[1] - p0[1]) < 0.2 && (!LEMMER.on || apart(q))) C.push([d, k]); }
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
        const q = M.at(k), d = Math.hypot(q[0] - p[0], q[2] - p[2]) + (kitAt(k) ? 0.5 : 0); if (d < bd && free(k, id)){ bd = d; best = k; } }   // (a cell with gear in the body last, OB10 runde 4)
      if (best >= 0) g.k = best; }
    TAKEN.set(g.k, id); return g;
  }
  // ---- the agents follow the people aboard ----
  // the break's things that are put away before the walk to work (the mug back on the flask, the phone in the pocket ...), and the
  // places held until the one taking over is there (the hauler hauls on, the helm is not left)
  const PROP = {coffee:1, phone:1, binoc:1, smoke:1, snus:1, lunch:1}, PUT_S = 1.4;
  const relieves = g => !!g && ((g.task === 'haul' && !g.mo) || g.inside === 'helm');
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
    // (OB10 runde 4: the one setting chooses first, and the gutter yields where the two places are one: on the snekke the only place
    // for the one setting line, with the tubs' true width, is the gutting station, and he stood looking on while someone gutted there)
    const si = pend.findIndex(([p]) => p.role === 'sett'), yieldA = si >= 0 ? A.filter(a => seen.has(a.id) && a.st === 'sloy' && a.goal && !a.goal.inside && !pend.some(q => q[1] === a)) : [];
    if (si > 0) pend.unshift(pend.splice(si, 1)[0]);
    for (const a of yieldA) if (TAKEN.get(a.goal.k) === a.id) TAKEN.delete(a.goal.k);
    for (const [p, a, kind] of pend){ let n = 0; const U = used[kind] || (used[kind] = new Set()); while (U.has(n)) n++; U.add(n);
      const was = a.goal, there = was && a.mode !== 'walk' && !a.sub && a.cell === was.k;
      a.goal = fitWork(claim(goalOf(p, ctx, n), a.id), a.id); a.kind = kind; a.slot = n; a.path = null; a.sub = null; a.door = 0;
      if (p.role === 'sett' && yieldA.length){ const G0 = a.goal && !a.goal.inside ? ST.M.at(a.goal.k) : null;
        for (const b of yieldA.splice(0)){ const B = ST.M.at(b.goal.k), bp = ctx.WA.find(q => (q.c ? 'c' + q.c.id : 'me') === b.id);
          if (G0 && bp && Math.hypot(B[0] - G0[0], B[2] - G0[2]) < SEP){ b.goal = fitWork(claim(goalOf(bp, ctx, b.slot >= 0 ? b.slot : 0), b.id), b.id); b.path = null; b.sub = null; }
          else TAKEN.set(b.goal.k, b.id); } }
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
  const dropY = p => { if (!ready()) return null; const u = ST.M0.hit(p, [p[0], p[1] - 12, p[2]]); return u < 0 ? null : p[1] - u * 12; };
  function tick(dt){
    if (!ready()) return; dt = Math.min(0.1, Math.max(0, dt || 0)); ST.clk += dt; const t = nowS();
    const jump = ST.lastSim == null || Math.abs(S.t - ST.lastSim) > 30 || (src && src.jump && src.jump()); ST.lastSim = S.t;
    if (!ST.ctx || t - ST.ctxT > 1){ walkMap(); ST.ctx = context(); ST.ctxT = t; if (jump) ST.crates = -1; sync(ST.ctx); }
    if (jump){ snap(); return; }
    const M = ST.M, roll = Math.abs(ST.roll || 0), spd = WALK * (roll > 0.21 ? 0 : roll > 0.14 ? 0.65 : 1);
    const spH = !src && typeof MOBUI !== 'undefined' && MOBUI.spot ? MOBUI.spot() : null;   // (the spotter turns with her as the boat turns, Ø11.6)
    for (const a of A){
      if (spH != null && a.goal && a.goal.spot) a.goal.h = spH;
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
        a.blend = Math.min(1, a.blend + dt / 0.4); a.task = g.dyn ? dynTask(g) : g.task; a.sqW = 0; a.sqA = Math.max(0, (a.sqA || 0) - dt * 6);
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
  // ---- the sea legs' room where someone stands (FB4; seaLegs' room, rail and stepOk). Someone upright in the world on a deck that
  // heels is, seen from the boat, leaning to her high side: at 15° the hips are 0.3 m and the head 0.45 m off the line square to the
  // deck through the feet. With a wall, the rail or a table on that side there is no room for it, and he stands square to the deck
  // there instead, as one braced against it does. The room to each side is found against the model once at the place (kept by the
  // place and the heading): the largest share (0, 0.25, 0.5, 0.75 or 1; every smaller one clear too) of standing upright at CLIP (15°) that puts none of the
  // body's lines through anything; and each foot at its widest (0 or 1). Walking, the body is in the middle of the way and unclip
  // keeps it off things: all the room.
  const SEAWALK = {r:[1, 1], f:[1, 1], w:[1, 1]};
  // (where he stands at his place: the cell and how far off it the place has him, not the way there as it blends in; so the room is found once a place)
  const SEAR = new Map(), seaAt = a => { const g = a.fake ? null : holds(a), o = (g && g.off) || [0, 0], x = a.x + o[0], z = a.z + o[1], h = g && g.h != null ? g.h : a.h,   // (the heading the place has him at, not the turn to it: one key a place)
    F = [Math.sin(h), -Math.cos(h)], Rv = [Math.cos(h), Math.sin(h)];
    return {key:Math.round(x * 50) + ':' + Math.round(z * 50) + ':' + h.toFixed(2), W:(f, up, r) => [x + F[0] * f + Rv[0] * r, a.y + up, z + F[1] * f + Rv[1] * r]}; };
  // (the body's lines with the sea legs as seaLegs gave them (o) on a deck sloping sr to his right and sf ahead, in the boat's frame,
  // where a point up over the deck is that much to her high side: the legs, the spine, the sides, the chest and the back, the
  // shoulders and the head; which of them pass through the model)
  const seaLines = (P, o, sr, sf) => { const M = ST.M, th = Math.hypot(o.leanR, o.leanF), dR = th > 1e-9 ? o.leanR / th : 0, dF = th > 1e-9 ? o.leanF / th : 0, ct = Math.cos(th), sn = Math.sin(th), hH = 0.92 + o.hipY;
    // (his level frame [ahead, up, right] to the deck's: along the deck ahead and to the right, and along its normal)
    const eF = 1 / Math.hypot(1, sf), eR = 1 / Math.hypot(1, sr), nl = Math.hypot(sf, 1, sr), n = [-sf / nl, 1 / nl, -sr / nl];
    const B = q => P.W((q[0] + q[1] * sf) * eF, q[0] * n[0] + q[1] * n[1] + q[2] * n[2], (q[2] + q[1] * sr) * eR);
    // (a point of the upper body, [ahead, up from the deck, right] standing straight: turned about the hips with the torso's lean)
    const at = (hh, r, f) => { const u = hh - 0.92, a = (f || 0) * dF + (r || 0) * dR, p = -(f || 0) * dR + (r || 0) * dF, a2 = a * ct + u * sn, u2 = -a * sn + u * ct;
      return [o.hipF + hH * o.sqF + a2 * dF - p * dR, hH * o.sqU + u2, o.hipR + hH * o.sqR + a2 * dR + p * dF]; };
    const hipJ = i => [o.hipF + hH * o.sqF, hH * o.sqU + (i ? 0.11 : -0.11) * o.pelv, o.hipR + hH * o.sqR + (i ? 0.11 : -0.11)];
    const foot = i => [o.fa[i] + 0.1 * n[0], o.fy[i] + 0.1 * n[1], o.fr[i] + 0.1 * n[2]];   // (the ankle, 10 cm over where the foot stands on the deck)
    // (FB2: each leg as it is drawn, the knee from the solver; a foot the leg does not reach is moved in, as drawWorker moves it)
    const L0 = limbLen(null), kn = LEMMER.on ? [0, 1].map(i => ik2(hipJ(i), foot(i), L0.th, L0.sn, [LEMMER.KNEE[0], LEMMER.KNEE[1], 0])) : null;
    const segs = (kn ? [[hipJ(0), kn[0].j], [kn[0].j, kn[0].e], [hipJ(1), kn[1].j], [kn[1].j, kn[1].e]] : [[hipJ(0), foot(0)], [hipJ(1), foot(1)]]).concat([[at(0.95), at(1.45)], [at(0.95, -0.17), at(1.42, -0.21)], [at(0.95, 0.17), at(1.42, 0.21)],
      [at(1.0, 0, 0.12), at(1.38, 0, 0.12)], [at(1.0, 0, -0.12), at(1.38, 0, -0.12)], [at(1.42, -0.21), at(1.42, 0.21)], [at(1.5), at(1.8)], [at(1.64, 0, 0.13), at(1.64, 0, -0.13)], [at(1.66, -0.1), at(1.66, 0.1)]]);
    let bits = 0; for (let i = 0; i < segs.length; i++) if (M.hit(B(segs[i][0]), B(segs[i][1])) >= 0) bits |= 1 << i; return bits; };
  const SEATMP = seaState();
  // (those lines at the deck's furthest one way, with the room given; a full sea, so the feet are at their widest)
  // (and a foot put out to brace where one can be, as he would: seaStepOk)
  const seaTry = (a, P, sr, sf, room) => { SEATMP.y = null; SEATMP.gOn = SEATMP.stOn = false; SEATMP.st = SEATMP.g = 0; return seaLines(P, seaLegs(SEATMP, {sr, sf, y:0, hs:9, room, stepOk:(dr, da) => seaStepOk(a, dr, da)}), sr, sf); };
  const SEAWAYS = t => [[t, 0], [-t, 0], [0, t], [0, -t], [t * 0.7, t * 0.7], [-t * 0.7, t * 0.7], [t * 0.7, -t * 0.7], [-t * 0.7, -t * 0.7]];
  function seaRoom(a){
    if (a.mode !== 'at') return SEAWALK; const P = seaAt(a), ck = ST.type + '|' + (ST.kitSig || '') + '|' + P.key; if (a.srK === ck) return a.srV;
    const hit = SEAR.get(ck); if (hit){ a.srK = ck; a.srV = hit; return hit; }
    const M = ST.M, C = SJOBEIN, W = P.W, t = Math.tan(C.CLIP); let out;
    // (first with the bracing step where seaStepOk lets a foot out; if that still puts something through, without it at this place)
    // (FB2: and if a knee still goes into what he stands at, with less of the crouch, k: the knees bend further ahead the lower he stands)
    for (const [nostep, kq] of LEMMER.on ? [[false, 1], [true, 1], [true, 0.5], [true, 0]] : [[false, 1], [true, 1]]){ out = {r:[0, 0], f:[0, 0], w:[0, 0], nostep, k:kq};
      for (const i of [0, 1]){ const s = i ? 1 : -1; out.w[i] = M.hit(W(0, 0.92, s * 0.11), W(0, 0.1, s * (0.12 + C.WIDE + 0.02))) < 0 ? 1 : 0; }
      // (what goes through something on a level deck already is not the sea legs' doing; the most room that adds nothing to it)
      const base = seaTry(a, P, 0, 0, out), trial = {r:[0, 0], f:[0, 0], w:out.w, nostep, k:kq};
      for (const i of [0, 1]){ const s = i ? 1 : -1;
        // (from none upwards, as far as every step is clear: what is clear at CLIP with a share of the room is clear with all of it at that share of CLIP)
        for (const u of [0.25, 0.5, 0.75, 1]){ trial.r[0] = trial.r[1] = u; trial.f[0] = trial.f[1] = 0; if (seaTry(a, P, s * t, 0, trial) & ~base) break; out.r[i] = u; }
        for (const u of [0.25, 0.5, 0.75, 1]){ trial.f[0] = trial.f[1] = u; trial.r[0] = trial.r[1] = 0; if (seaTry(a, P, 0, s * t, trial) & ~base) break; out.f[i] = u; } }
      // (and with her down by a corner, both ways at once: the larger of the two gives way until that is clear too)
      for (const i of [0, 1]) for (const j of [0, 1]) while ((out.r[i] > 0 || out.f[j] > 0) && (seaTry(a, P, (i ? 1 : -1) * t * 0.7, (j ? 1 : -1) * t * 0.7, out) & ~base)){ if (out.r[i] >= out.f[j]) out.r[i] -= 0.25; else out.f[j] -= 0.25; }
      if (!SEAWAYS(t).some(([sr, sf]) => seaTry(a, P, sr, sf, out) & ~base)) break; }
    if (SEAR.size > 400) SEAR.clear(); SEAR.set(ck, out); a.srK = ck; a.srV = out; return out; }
  // the tests: how many of the body's lines pass through the model with the sea legs at their furthest (the deck at CLIP to either
  // side and fore and aft, and to the four corners between; a full sea), that do not standing on a level deck
  function seaHits(a){
    const P = seaAt(a), room = seaRoom(a), t = Math.tan(SJOBEIN.CLIP), base = seaTry(a, P, 0, 0, room); let n = 0;
    for (const [sr, sf] of SEAWAYS(t)){ let b = seaTry(a, P, sr, sf, room) & ~base, c = 0; while (b){ c += b & 1; b >>= 1; } n = Math.max(n, c); }
    return n; }
  // the tests: where each foot of those at their places stands, in the boat's own frame, and the model's own deck under it (the deck
  // is flat in her frame, so the deck under the foot is the model's surface there: this is the measure against the model, not against
  // the plane the sea legs reckoned with). dy: the foot's height over the deck under it, null where the model has nothing there
  function seaFeet(){ if (!ready()) return null; const out = [];
    for (const a of A){ const o = a.sl && a.sl.y !== null ? a.sl.o : null; if (a.mode !== 'at' || !o) continue; const w = walkOff(a), x = a.x + w[0], z = a.z + w[1], F = [Math.sin(a.h), -Math.cos(a.h)], Rv = [Math.cos(a.h), Math.sin(a.h)];
      for (let i = 0; i < 2; i++){ const cf = 1 / Math.hypot(1, o.sf), cr = 1 / Math.hypot(1, o.sr), fx = x + (F[0] * o.fa[i] * cf + Rv[0] * o.fr[i] * cr), fz = z + (F[1] * o.fa[i] * cf + Rv[1] * o.fr[i] * cr);
        const d = dropY([fx, a.y + 0.6, fz]); out.push({id:a.id, task:a.task, i, lift:+o.lift[i].toFixed(3), dy:d == null ? null : +(a.y - d).toFixed(4)}); } }
    return out; }
  // (the people at their places now; and every break at every rail place it fits, as clipScan: [places clear, places])
  function seaClip(){ if (!ready()) return null; return A.filter(a => a.mode === 'at' && a.goal && !a.goal.inside).map(a => ({id:a.id, task:a.task, n:seaHits(a), room:seaRoom(a)})); }
  function seaScan(){ if (!ready()) return null; const R = {}; for (const k of ['lean', 'look', 'coffee', 'phone', 'binoc', 'smoke', 'snus', 'aurora', 'back', 'chat', 'knife', 'lunch']){
      const L = (ST.PT.lean || []).filter(l => ST.M.ok(l.k) && livePart(l.k)); let clear = 0, fits = 0; for (const q of L){ const f = fitPlace(k, q); if (poseHits(k, q.k, f.h, f.rail, f.off)) continue; fits++;
        const p = ST.M.at(q.k), o = f.off || [0, 0]; if (!seaHits({fake:true, mode:'at', x:p[0] + o[0], y:p[1], z:p[2] + o[1], h:f.h})) clear++; } R[k] = [clear, fits]; } return R; }
  // something firm for a hand within reach of where someone stands (the rail's top, or the edge of a table or a bin: its top 0.6 to
  // 1.3 m over the deck), ahead of him or to either side: [ahead, right, top] in his own frame (right 0: straight ahead, the hand at
  // its own side); null with none. Kept by the place and the heading
  function seaRail(a){
    if (a.mode !== 'at') return null; const P = seaAt(a), ck = (ST.kitSig || '') + '|' + P.key; if (a.sgK === ck) return a.sgV;
    const M = ST.M; let best = null, bd = 9;
    for (const sd of [0, 1, -1]) for (let d = 0.2; d <= 0.72; d += 0.04){ const p = sd ? P.W(0.04, 0, sd * d) : P.W(d, 0, 0), u = M.hit([p[0], a.y + 1.4, p[2]], [p[0], a.y + 0.3, p[2]]); if (u < 0) continue;
      const top = 1.4 - u * 1.1; if (top >= 0.6 && top <= 1.3 && d < bd){ bd = d; best = sd ? [0.04, sd * (d + 0.02), Math.round(top * 100) / 100] : [d + 0.02, 0, Math.round(top * 100) / 100]; } break; }
    a.sgK = ck; a.sgV = best; return best; }
  // can a foot be put out that way ([right, ahead], a unit) from where he stands: deck under it and nothing between
  function seaStepOk(a, dr, da){
    const M = ST.M, P = seaAt(a), C = SJOBEIN, s = Math.abs(dr) > 0.35 ? (dr > 0 ? 1 : -1) : 1, r = s * (0.12 + C.WIDE) + dr * C.STEPLEN, f = da * C.STEPLEN, q = P.W(f, 0, r), q2 = P.W(f + da * 0.12, 0.45, r + dr * 0.12);
    return M.ok(M.cellOf(q[0], q[2])) && M.hit(P.W(0, 0.92, s * 0.11), P.W(f, 0.1, r)) < 0 && M.hit(P.W(f, 0.45, r), q2) < 0; }
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
  // (OB10 runde 4) the bodies standing in the kit: the kit is out of the walking map (kitBoxes), but the map holds only where a body's
  // middle may be, so one at the edge of the tubs stood with half his body in them, and nothing caught it (poseHits and bodyHits see
  // the model only). A body here is eight points 0.12 m round its middle (its chest and back, the shoulders a little in), tested
  // against the gear itself: the boxes less their padding (ST.KB, walkMap). Only the gear that comes and goes (the tubs, the nets,
  // the pots, the freight, the plant's tubs): at the bench, the bleeding tub and the hauler they stand close by design
  function inKit(x, z){ const B = ST.KB; if (!B || !B.length) return 0; let n = 0;
    for (let i = 0; i < 8; i++){ const u = i * Math.PI / 4, px = x + Math.cos(u) * 0.12, pz = z + Math.sin(u) * 0.12;
      for (const [cx, cz, hx, hz, ry, pd, gear] of B){ if (!gear) continue; const dx = px - cx, dz = pz - cz, c = Math.cos(ry), sn = Math.sin(ry); if (Math.abs(dx * c - dz * sn) < hx - (pd || 0) && Math.abs(dx * sn + dz * c) < hz - (pd || 0)){ n++; break; } } }
    return n; }
  // (and one place: the body there, moved off by off, in the kit; for the breaks, idlePlace)
  // (without off it is looked up per cell, worked out once per map: clearOfKit and claim scan the whole deck, found in the review)
  function kitAt(k, off){ if (src || !ST.M0.ok(k)) return false; const p = ST.M0.at(k);
    if (off && (off[0] || off[1])) return inKit(p[0] + off[0], p[2] + off[1]) > 0;
    const N = ST.M0.nx * ST.M0.nz; if (!ST.KC || ST.KC.length !== N){ ST.KC = new Int8Array(N).fill(-1); }
    if (ST.KC[k] < 0) ST.KC[k] = inKit(p[0], p[2]) > 0 ? 1 : 0; return ST.KC[k] === 1; }
  // (the nearest free cell to k, a short walk from it, with no gear in the body: the place to stand when the rail has none, OB10 runde 4;
  // on the snekke with her nets aboard the gutting station stood 8 cm from the net tub)
  // (and clear of the work: 0.7 m from the stations, and while she sets 1.3 m from where the gear goes over, so it never takes the work's place)
  // (standing and looking on, clear of the gear, by the gutting station: where no place at the rail is clear of everything, so nobody
  // goes out of sight, found in the check of OB10 runde 4 once the breaks kept out of the gear)
  function lookClear(id){ const PT = ST.PT; return PT && PT.sloy ? {k:clearOfKit(PT.sloy.k, id), h:0, task:'look'} : null; }
  function clearOfKit(k, id){ if (!kitAt(k)) return k; const M = ST.M, p = ST.M0.at(k), PT = ST.PT || {}; let best = k, bd = 1.6;
    const work = ['haling', 'is', 'door'].map(nm => PT[nm]).filter(q => q && q.k != null && ST.M0.ok(q.k)).map(q => ST.M0.at(q.k)), gs = S.pgear && !src ? rigGear().set : null;
    const O = gs ? setOver(gs) : null;   // (while she sets, the whole place he works in: 1.3 m round where the gear goes over)
    for (let c = 0; c < M.nx * M.nz; c++){ if (!M.ok(c) || kitAt(c) || !free(c, id)) continue; const q = M.at(c); if (work.some(w => Math.hypot(w[0] - q[0], w[2] - q[2]) < 0.7)) continue;
      if (O && Math.hypot(O.ov[0] - q[0], O.ov[2] - q[2]) < 1.3) continue;
      const d = Math.hypot(q[0] - p[0], q[2] - p[2]) + Math.abs(q[1] - p[1]) * 2; if (d < bd){ bd = d; best = c; } }
    return best; }
  function kitHits(){ if (!ready() || src) return null; const out = [];
    for (const a of visible()){ const o = walkOff(a), n = inKit(a.x + o[0], a.z + o[1]); if (n) out.push({id:a.id, mode:a.mode, task:a.task || (a.goal && a.goal.task) || null, n}); }
    return out; }
  function walkOff(a){ const g = holds(a), o = g && g.off; if (!o) return [0, 0]; if (a.mode === 'at') return [o[0] * (a.blend == null ? 1 : a.blend), o[1] * (a.blend == null ? 1 : a.blend)];
    if (a.mode !== 'walk' || !a.path || a.pi < a.path.length - 1) return [0, 0]; const u = clamp(1 - (a.near || 0) / 0.6, 0, 1); return [o[0] * u, o[1] * u]; }
  function clipWhy(k){ if (!ready()) return null; const M = ST.M; return (ST.PT.lean || []).filter(l => M.ok(l.k)).map(q => { const f = fitPlace(k, q), p = M.at(q.k), F = [Math.sin(f.h), -Math.cos(f.h)], Rv = [Math.cos(f.h), Math.sin(f.h)], o = f.off || [0, 0];
    const W = v => [p[0] + o[0] + F[0] * v[0] + Rv[0] * v[2], p[1] + v[1], p[2] + o[1] + F[1] * v[0] + Rv[1] * v[2]]; return {rail:railAt(q.k, q.h), fit:f.rail, off:f.off, hits:poseSegs(k, f.rail).map(([a, b], i) => M.hit(W(a), W(b)) >= 0 ? i : -1).filter(i => i >= 0)}; }); }
  return {tick, agents, visible, anchorOf, on, setPlan, poseLines:(k, rail) => poseSegs(k, rail), hitsAt:(k, cell, h, rail, off) => { const M = ST.M, p = M.at(cell), F = [Math.sin(h), -Math.cos(h)], Rv = [Math.cos(h), Math.sin(h)], o = off || [0, 0]; return poseSegs(k, rail).map((q, i) => M.hit([p[0] + o[0] + F[0] * q[0][0] + Rv[0] * q[0][2], p[1] + q[0][1], p[2] + o[1] + F[1] * q[0][0] + Rv[1] * q[0][2]], [p[0] + o[0] + F[0] * q[1][0] + Rv[0] * q[1][2], p[1] + q[1][1], p[2] + o[1] + F[1] * q[1][0] + Rv[1] * q[1][2]]) >= 0 ? i : -1).filter(i => i >= 0); }, landSlots:() => ready() ? landSlots() : [], landNow, iceBox:() => ready() ? iceBox() : null, setCrane, setIce,
    // (for the view: nothing of the boat between two points in her frame, and the first thing of her under a point, its height)
    clearLine:(a, b) => !ready() || ST.M0.hit(a, b) < 0, dropY, quaySide:() => ready() ? quaySide() : 1, netTubs:n => ready() ? netTubs(n) : [], gear:() => ready() && !src && S.pgear ? rigGear() : null, magOn:() => ready() && magOn(), NET_TUB, setJig, setRoll, setSea, seaRoom:a => ready() ? seaRoom(a) : null, seaRail:a => ready() ? seaRail(a) : null, seaStepOk:(a, dr, da) => ready() && seaStepOk(a, dr, da), seaClip, seaScan, seaFeet, setHelm, setMoor, moorMan, moorHands, moorAt, places:() => ready() ? places() : null, reset, clipNow, clipScan, clipWhy, bodyHits, kitHits, kitAt:(k, off) => ready() && kitAt(k, off), walkOff, holds, railAt:(k, h) => ready() ? railAt(k, h) : null, railNear:a => ready() ? railNear(a) : null, _st:ST};
}
const CREW3D = crewSim(null);
// where the lines and the fenders are, in the boat's frame (x to starboard, z aft) from the model's measures (vessel3d.js geoOf), with the
// quay on side sd (+1 starboard, -1 port): the cleats for the bow line, the springs and the stern line, and three fenders along the side
// over the water. The view draws the lines and the fenders there (view3d/15-env-mooring.js) and the hands stand inboard of them (moorPlace)
// the kit over the stern she has for her rig (OPP5; view3d/10-gear.js sternPick draws it, and the gear is set through it): the net chute
// rigged for nets, the line setter rigged for line, else the one she has
function sternKit(vt){ const eq = S.equip || {}, own = k => !!eq[k] && typeof equipFits === 'function' && equipFits(k, vt), rig = typeof rigOf === 'function' ? rigOf() : S.boat.rig;
  return rig === 'garn' && own('garnrenne') ? 'garnrenne' : rig === 'line' && own('linesetter') ? 'linesetter' : own('linesetter') ? 'linesetter' : own('garnrenne') ? 'garnrenne' : null; }
function moorSpots(G, sd){
  const gw = G.gw || 1, sx = (G.beam || 3) / 2, bw = G.bow || -2, st = G.stern || 2, mid = (bw + st) / 2; sd = sd || 1;
  return {cleat:{bow:[sd * sx * 0.55, gw + 0.05, bw + 0.4], mid:[sd * sx * 0.95, gw + 0.05, mid], stern:[sd * sx * 0.8, gw + 0.05, st - 0.35]},
    fend:[bw * 0.45, mid, st * 0.55].map(z => [sd * (sx * 0.95 + 0.12), gw - 0.45, z])};
}
// the context of another boat as the view knows her (core/05-vessels.js npcStates: st fishing, in, out or port; a player's boat
// sends her state the same way): the skipper and two hands when fishing, the skipper at the wheel and the hands inside under way,
// nobody on deck in port. The people are stand-ins with an id, so the places are kept from minute to minute.
function npcCrewCtx(n, G){
  const H = S.t / 60, hr = typeof gDate === 'function' ? gDate(H).getUTCHours() : 12, wind = typeof windAt === 'function' ? windAt(H, n.p) : 0;
  const hands = [{id:String(n.id) + '0', traits:[]}, {id:String(n.id) + '1', traits:[]}], fishing = n.st === 'fishing', port = n.st === 'port';
  const WA = port ? [] : fishing ? [{c:null, st:'fiske'}, {c:hands[0], st:'sloy'}, {c:hands[1], st:'fiske'}] : [{c:null, st:'ror'}, {c:hands[0], st:'pause'}, {c:hands[1], st:'pause'}];
  return {away:false, underway:!fishing && !port, port, hasBunks:false, open:!!(G && G.open), deckTask:'gut', wind, night:hr >= 22 || hr < 6, WA, aground:false, fishing, crates:-1, crateFill:0};
}
// ---- the sea legs (FB4, steg 120, 13.11.2026; docs/planer/folk-2.md; Jonas: «at mannskapet oppfører seg som ekte mennesker»): someone
// standing on a deck at sea stands on the deck as it heels. Each foot is on the deck where the deck is under it, the hips go to the
// high side and the knee there bends, the torso lies between plumb and the deck's normal and lags (a spring), the knees take up the
// heave, the feet stand wider the more sea there is, a free hand takes the rail when she rolls past GRAB, and past STEP a foot is put
// out down the slope to brace. The numbers are here and nowhere else, for the playtests (start values: the lean's share and its most
// are docs/mannskap-plan.md 1.3's 30 % and 12°; the rest are set by eye and by the measures in tests/sjobein.py).
// «#sjobein0» in the address turns it all off (the figure upright on one height, as before).
const SJOBEIN = {
  on:!(typeof location !== 'undefined' && /sjobein0/.test(String(location.hash || ''))),
  LEAN:0.3,       // the share of the deck's tilt the torso takes (0: plumb, 1: square to the deck)
  LEANMAX:0.21,   // rad (12°): the most the torso leans
  HIP:0.2,        // m the hips go to the high side per unit of slope (the tangent of the tilt)
  HIPMAX:0.06,    // m, the most
  HIPF:0.5,       // the share of that fore and aft (the feet are side by side, so less room that way)
  WIDE:0.07,      // m each foot further out in a full sea
  HSFULL:2.5,     // m of significant wave height that is a full sea for the stance
  ROLLFULL:0.26,  // rad (15°) of roll lately that is a full sea for the stance (a boat rolling in a small sea)
  CROUCH:0.03,    // m the hips come down in a full sea (the knees ready)
  CROUCHMAX:0.04, // m, the most: in a full sea, or as far as the knees have had to take up of the heave lately
  FZ:0.9, ZT:0.6,     // the torso's spring: its own frequency (Hz) and its damping (of critical)
  HEAVE:0.5,      // the share of the deck's way up and down the knees take up, while the legs reach (less in a big sea: as much as they reach)
  HMEAN:8,        // s: the deck's height is taken about its mean over this long
  HSHEAVE:0.3,    // the heave each way that is expected of a sea, as a share of its significant wave height (measured in tests/sjobein.py: ±1.6–2.4 m at Hs 5.9 m)
  HIPUP:0.03, HIPDN:0.11,   // m the hips can rise over and sink under their height standing (the legs straight, the knees deep)
  GRAB:0.14, FREE:0.09, HOLD:1.5, GRABT:0.35, REACH:0.78,   // rad of tilt a free hand takes the rail at and lets go under, s it holds on after, s the hand takes, m it reaches from the shoulder
  CLIP:0.262,     // rad (15°): the roll the room for the body is measured for (deckcrew seaRoom; past it a shoulder may touch what he stands by)
  STEP:0.21, STEPBACK:0.15, STEPHOLD:0.8, STEPT:0.4, STEPLEN:0.16,   // rad of tilt a foot is put out at and taken back under, s it stays after, s the step takes, m it goes
  SEG:0.426,      // m of thigh and of shin (the figure's leg standing: 0.84 m from hip to ankle, the knee 0.07 forward)
  test:null,      // the tests: {roll, pitch} (rad) the crew's deck is turned more than the boat's (view3d/20-trawl-seine.js drawDeckCrew)
  log:null        // the tests: an array drawWorker writes what it drew to
};
const SEAROOM = {r:[1, 1], f:[1, 1], w:[1, 1], nostep:false};   // the room to either side ([left, right]) and fore and aft ([aft, ahead]), for each foot out ([left, right]), and no room for the bracing step
// one person's sea legs from frame to frame (the springs, the hand on the rail, the foot put out), and what seaLegs last gave (o)
function seaState(){ return {qr:0, vr:0, qf:0, vf:0, hy:0, y:null, k:0, env:0, envH:0, envP:0, cr:0, rm:[1, 1, 1, 1, 1, 1], g:0, gOn:false, gT:0, gh:0, st:0, stOn:false, stT:0, stR:0, stF:0, stFoot:1,
  o:{sr:0, sf:0, ang:0, k:0, fr:[-0.12, 0.12], fa:[0, 0], fy:[0, 0], lift:[0, 0], kf:[0.07, 0.07], kneeDeg:[0, 0], hipR:0, hipF:0, hipY:0, pelv:0, sqR:0, sqF:0, sqU:1, leanR:0, leanF:0, grab:0, gh:0, step:0, stFoot:1}}; }
// how much further forward a knee goes when its leg, dref long from hip to ankle before, is dnow long (the thigh and the shin keep
// their length, so a shorter leg is a knee more bent)
function seaKnee(dref, dnow){ const L2 = SJOBEIN.SEG * SJOBEIN.SEG, a = dref / 2, b = dnow / 2; return Math.sqrt(Math.max(0, L2 - b * b)) - Math.sqrt(Math.max(0, L2 - a * a)); }
// ---- the limbs (FB2, steg 123, 13.11.2026; docs/planer/folk-2.md; Jonas: «Kjør på med FB2 i en ny økt»): the upper arm, the forearm,
// the thigh and the shin keep their length. A hand or a foot is where the work has it, and the elbow or the knee is found from it
// (ik2, the reckoning armTo had for the skiff's skipper); a hand further off than the arm reaches takes the body with it (reachBody:
// the back bends, the torso turns), a foot further off lowers the hips (legDrop), and only what is left moves the hand or the foot in.
// The numbers are here and nowhere else. The lengths are one person's (limbLen), so a build can have its own (FB5b); the start
// values are the figure's as drawWorker drew it standing before (tests/lemmer.py measured them: 0.575 m from the shoulder to the
// wrist with the arm hanging, drawn as 0.39 + 0.21 with the elbow low; here the same arm, 0.585 m, shared as a body shares it, 55 to
// 45; 0.84 m from the hip to the ankle with the knee 7 cm ahead, 0.426 + 0.426).
// It is on only behind «#folk2» in the address, with the new people (Jonas 13.11.2026: «det er disse kroppene som skal brukes i det
// ferdige resultatet»: the hands' points are tuned on the new body, FB7); without it the limbs are drawn, and the clip guard reckons,
// as before the step. «#ik0» turns it off there too.
const LEMMER = {
  on:typeof location !== 'undefined' && /folk2/.test(String(location.hash || '')) && !/ik0/.test(String(location.hash || '')),
  STD:{ua:0.32, fa:0.265, th:0.426, sn:0.426},   // m: upper arm, forearm (to the wrist), thigh, shin (to the ankle)
  LEN:{},         // the new people's lengths by body ('m', 'f'), read from the skeleton the first time (limbLen)
  HAND:0.085,     // m from the wrist to where a hand holds, for the one-piece glove far off (near, each grip has its own point)
  get REACH(){ return this.on ? FIG_REACH : this.REACH0; },   // the share of its full length a limb is straightened to at most: figpose.js FIG_REACH (0.98) with the new people
  REACH0:0.995,   // the same without «#folk2», as before step 125 (goes out with the old figure)
  get BEND(){ return this.on ? 0.72 : 0.6; },   // rad (34°; 41° with the new people, whose arms are shorter and never quite straight): the most the back bends further over to let a hand reach
  BACK:0.12,      // rad (7°): the most it leans back for one
  TWIST:0.6,      // rad (34°): the most the torso turns either way for one
  TWISTW:2,       // how much dearer a turn is than a bend (the back bends before the torso turns)
  CROSS:[0.1, 1.4],  // a hand that reaches across him turns the torso after it first: from this far past his middle (m), this many rad a metre further (with the new people)
  DROP:0.06,      // m: the most the hips come down to let a foot reach the deck (the stride walking, a foot put out)
  SH:[0.5, 0.21], // m: the shoulder joint over the hips along the spine, and out from it
  ELBOW:[-0.5, -1, 0.1],   // the way an elbow points in the torso's frame [ahead, up, out]: down, back and a very little out (more, and it went into what he stands beside: tests/crewclip.py)
  ELBOWHI:0,      // straight down instead of back and out, with the hand up by the shoulder (from 25 cm under it to 5 cm over): the elbow under a raised hand
  CLEAR:0.22,     // m out from the spine an elbow keeps when it is beside the torso (the torso's half width and the arm's, the sleeve against the jacket)
  FOLD:0.2,       // m from the shoulder a wrist keeps at the least (an elbow does not fold further than some 40°)
  CHEST:0.13,     // m ahead of the spine a wrist keeps before the chest and the belly (never in his own body)
  FRONT:0.2,      // and when it is well across him, beyond his middle (it goes round before the belly, not through it)
  BELLY:0.13,     // m ahead of the spine an elbow keeps when it is before the torso (a hand reaching across him)
  WRIST:0.035,    // m a wrist keeps clear of the trunk's own profile with the new people (its half thickness with the sleeve; figpose.js figProfile)
  prof:null,      // the trunk's profile of the figure being solved (drawWorker sets it for its arms and takes it away after); none: CHEST and FRONT as before
  KNEE:[1, 0.15], // the way a knee points: ahead and a little up
  fr:0,           // the tests: how many times the people on deck have been drawn (view3d/20-trawl-seine.js drawDeckCrew)
  dry:false,      // the tests: inside LEMMER.redraw, where nothing is drawn
  log:null        // the tests: an array drawWorker writes the joints it drew to (tests/lemmer.py)
};
// What a hand holds close to the body, by its own measures (FB7, steg 125; Jonas 13.11.2026: «Sørg for at objekter ikke kan clippe
// inn i menneskene»; rules 7 and 10 of «Arkitekturen for bevegelsen», docs/planer/folk-2.md): the thing has its grips in its own
// frame, it is put clear of the trunk's profile first (figpose.js figProfile, the mesh that is drawn), and the hands are solved to
// its grips after. drawWorker (view3d/08-plants.js holdClear) reads this (HOLD is the cinema's in the 3D view); the things' measures are their models' own
// (G3._debug.thingBox, python3 tests/folk2diag.py).
const HOLDT = {
  GAP:0.02,      // m between a thing and the body's clothes at the least
  FIST:0.045,    // m: half a fist round a handle (a hand's own point is its fist's middle)
  HAND:0.03,     // m a bare hand's point keeps ahead of the trunk (a hand laid on the chest, the arms crossed)
  FACE:0.03,     // m a thing held to the face may press into it at the most (the cup's rim at the lips, the binoculars' eyecups)
  LEG:[0.075, 0.055],   // m: half a thigh and half a shin with the trousers (what he holds keeps clear of his legs too)
  fish:{r:0.11, at:[0.25, 0.5, 0.8]},   // a fish hanging from the hand at the gutting: its half thickness and the points down it that are tried (shares of its size and its length)
  // the fish box carried across him (Jonas 14.11.2026, with two pictures of boxes carried: «Tror også du må jobbe med grepet på
  // kasse-bæringen»): the hands are under its bottom, the palms up, and it rests against his belly. Half its depth and its length,
  // its bottom and its ice from the hands' height, a hand's point from its middle [to either side, ahead, under its bottom], and
  // what is left between it and his clothes
  // squat: how far down the hips come for a box at the deck (the share of workLow's dip; 1.1: the hips half a metre down, the back
  // straight: with 0.55 the back went 41 degrees over the box and the box 7 cm into him), lean: rad he leans back carrying it,
  // stow: where the hands are when it is let down into the hatch [m ahead, over the deck], from where he carried it,
  // most: m it is moved out ahead of him at the most
  box:{depth:0.19, half:0.39, lo:0, hi:0.3, grip:[0.3, 0.02, 0.015], gap:0.005, squat:1.1, lean:0.07, most:0.14, stow:[0.66, 0.5]},
  // a shovel's shaft: its half thickness, and the points down it from the upper hand that are tried (m). The shovel is stiff: len from
  // the D grip in the upper hand to the blade's socket (the model's metre drawn at this), low the lower hand's place down it; hip where
  // the upper hand would be, from his hips [ahead, up, to his right] (the shaft goes from the blade towards it), and turn the share of
  // the way round to the blade his body turns on its feet and the angle (rad) the blade is kept to the right of where he then faces
  // (the upper hand is his left: the shovel is before him and to his right, never across him or behind his own hand)
  shaft:{r:0.02, at:[0.12, 0.24, 0.36], len:0.72, low:0.38, hip:[0.1, -0.05, -0.3], turn:[0.85, 0.3]},
  // the gaff (fish:hott, 90 cm): m from its tip to the fore hand, the back hand, its butt and its model's own middle. home: where
  // the back hand would be, from his hips [ahead, up, to his right]; chest and reach: how far from his chest [ahead, up from the
  // deck, right] the tip gets over the rail; lift: the tip over the rail on its way in [ahead, over where the fish comes aboard,
  // right]; turn: rad he turns on his feet towards where the fish is let go, at the most; out: m from where he stands the tip is
  // at the least there; dip: how far down on the knees the reach over the rail takes him (workLow)
  gaff:{r:0.022, grip:[0.6, 0.86], butt:0.91, org:0.66, home:[0.385, 0.2, 0.06], chest:[0.2, 1.3, 0.1], reach:1.25, lift:[1.25, 0.45, 0.08], turn:1.9, out:0.5, dip:0.25},
  cup:{r:0.05, sip:[0.066, -0.015, 0.03], tip:0.7, from:0.45},   // … tip: rad it is tipped at the sip, from this share of the lift up (the rim is then 6 cm nearer him and 1 cm over the hand's point)
  broom:{low:0.25},                           // the lower hand's place down the broom's line from the upper hand to its head (the share of it)
  // the work he keeps his eyes on: he does not look up at the camera from it
  eyes:{sweep:1, gutw:1, gut:1, knife:1, cut:1, pack:1, ice:1, haul:1, pick:1, bleed:1, bleedst:1, egn:1, strip:1, mend:1, phone:1, stack:1, stow:1, carry:1, jig:1, jigup:1, gaff:1, sett:1, tend:1, unhook:1, coil:1, binoc:1},    // the mug: its half width with the handle; the hand's point from the mouth at a sip [ahead, up, to its side]
  food:{r:0.04, bite:[0.035, -0.015, 0.025], tip:0.7, from:0.4}, // the food in the hand that takes the bite, its point from the mouth at a bite, and the rad it is turned to the mouth, from this share of the lift up
  smoke:{r:0.015, at:[0.045, 0, 0.015]},      // the cigarette between the fingers, from the mouth at a draw
  snus:{at:[0.025, 0.015, 0.02]},             // the fingers at the upper lip
  blow:{at:[0.085, -0.05, 0.035]},            // the hands blown into, from the mouth
  phone:{r:0.04},
  blade:{r:0.15, legs:[0.3, 0.36]},           // the shovel's blade: its half width, and the room his legs have of it under the hips (m ahead of them and to either side: its socket keeps outside that)
  kikk:{r:0.04, eye:0.072, wide:0.07, low:0.0, scan:[0.22, 0.25]}    // the binoculars: half their height, their middle ahead of the eyes, a hand to either side of it, and under the eyes' line; scan: how fast and how far (rad) he turns his head with them, the hands going with them
};
// one person's lengths (c: who; everyone the same until the builds, FB5b)
// (FB7, steg 125: with the new people, «#folk2», the lengths are the skeleton's own for the body that is drawn, 'f' or 'm' (c, or
// c.sex; the man's when nothing says), and the shoulders' place over the hips is the skeleton's too; figpose.js figLens)
function limbLen(c){
  if (!LEMMER.on || typeof figSkelOf !== 'function' || typeof glbHas !== 'function' || !glbHas('folk2')) return LEMMER.STD;
  const s = c === 'f' || (c && c.sex === 'f') ? 'f' : 'm'; let L = LEMMER.LEN[s];
  if (!L){ const sk = figSkelOf(s); if (!sk) return LEMMER.STD; const q = figLens(sk); L = LEMMER.LEN[s] = {ua:q.ua, fa:q.fa, th:q.th, sn:q.sn}; if (s === 'm'){ LEMMER.SH = [q.sh[0], q.sh[1]];
      // (and the nearest a wrist comes its own shoulder is the elbow folded as far as it goes, 150 degrees of bend: 14.5 cm on this arm.
      // The 20 cm of the old, longer arm kept a hand at the mouth 30 cm off its cup and its binoculars)
      LEMMER.FOLD = Math.sqrt(q.ua * q.ua + q.fa * q.fa - 2 * q.ua * q.fa * Math.cos(Math.PI / 6)) + 0.005; } }
  return L; }
// a limb of two parts L1 and L2 from its root Rt towards a target Tg, the joint between them on the side pole points to: where the
// joint and the end are. The end is the target when the limb reaches it, else on the way to it at its reach (over: m short of it), or,
// a target nearer the root than the two parts fold to, that near (near: m past it). o is filled and returned ({j, e, over, near,
// push, d}; push is armIk's: m the wrist was kept out of his own body).
function ik2(Rt, Tg, L1, L2, pole, o){
  o = o || {j:[0, 0, 0], e:[0, 0, 0], over:0, near:0, push:0, d:0};
  let ux = Tg[0] - Rt[0], uy = Tg[1] - Rt[1], uz = Tg[2] - Rt[2]; const D = Math.hypot(ux, uy, uz);
  if (D < 1e-6){ ux = 0; uy = -1; uz = 0; } else { ux /= D; uy /= D; uz /= D; }
  const d = Math.min(Math.max(D, Math.abs(L1 - L2) + 1e-4), (L1 + L2) * LEMMER.REACH), a = (d * d + L1 * L1 - L2 * L2) / (2 * d), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  // (the pole square to the limb's own line; along it, any way square to it)
  const k = pole[0] * ux + pole[1] * uy + pole[2] * uz; let px = pole[0] - k * ux, py = pole[1] - k * uy, pz = pole[2] - k * uz, pl = Math.hypot(px, py, pz);
  if (pl < 1e-6){ if (Math.abs(uy) < 0.9){ px = -ux * uy; py = 1 - uy * uy; pz = -uz * uy; } else { px = 1 - ux * ux; py = -uy * ux; pz = -uz * ux; } pl = Math.hypot(px, py, pz) || 1; }
  o.j[0] = Rt[0] + ux * a + px / pl * h; o.j[1] = Rt[1] + uy * a + py / pl * h; o.j[2] = Rt[2] + uz * a + pz / pl * h;
  o.e[0] = Rt[0] + ux * d; o.e[1] = Rt[1] + uy * d; o.e[2] = Rt[2] + uz * d; o.over = Math.max(0, D - d); o.near = Math.max(0, d - D); o.push = 0; o.d = d; return o; }
// a point of the torso [ahead, up, right] from the hips, turned by tw about the spine and then bent b over ahead (as the torso is drawn)
function torsoPt(q, b, tw){ const ct = Math.cos(tw), st = Math.sin(tw), cb = Math.cos(b), sb = Math.sin(b), a = q[0] * ct - q[2] * st; return [a * cb + q[1] * sb, -a * sb + q[1] * cb, q[0] * st + q[2] * ct]; }
// (and back: a point in the hips' frame, in the torso's own)
function torsoInv(q, b, tw){ const ct = Math.cos(tw), st = Math.sin(tw), cb = Math.cos(b), sb = Math.sin(b), a = q[0] * cb - q[1] * sb; return [a * ct + q[2] * st, q[0] * sb + q[1] * cb, -a * st + q[2] * ct]; }
// the body goes after a hand it cannot reach: how much further the back bends (b, rad; less than 0 leaning back) and the torso turns
// (t, rad; more than 0 the right shoulder back and the left ahead, torsoPt) for both shoulders to come within reach of their hands. sh the two
// shoulders in the torso's own frame ([ahead, up, right] from the hips, standing straight), tg the two wrists' targets in the hips'
// frame (null: that hand is free), reach the arm's, b0 the bend the work has already. Nothing when both reach; the least that does
// it otherwise (a damped step at a time from nothing, so a target moving out takes the body with it evenly), within LEMMER's limits.
// over is what is still missing then (m), which the arm takes by moving the hand in.
function reachBody(sh, tg, reach, b0, o){
  o = o || {b:0, t:0, over:0, n:0}; const C = LEMMER; let b = 0, t = 0;
  const miss = (i, bb, tt) => { if (!tg[i]) return 0; const p = torsoPt(sh[i], b0 + bb, tt); return Math.hypot(tg[i][0] - p[0], tg[i][1] - p[1], tg[i][2] - p[2]) - reach; };
  let e0 = miss(0, 0, 0), e1 = miss(1, 0, 0); o.n = 0;
  if (e0 > 1e-4 || e1 > 1e-4) for (let it = 0; it < 8; it++){ const E = 0.01, J = [], e = [];
      for (const i of [0, 1]){ const ei = i ? e1 : e0; if (ei <= 0) continue; e.push(ei); J.push([(miss(i, b + E, t) - ei) / E, (miss(i, b, t + E) - ei) / E / C.TWISTW]); }
      if (!e.length) break; o.n++;
      // (the least step that takes the missing reach away: (JtJ + l) x = -Jt e)
      let A = 1e-3, B = 0, Cc = 1e-3, g0 = 0, g1 = 0; for (let r = 0; r < e.length; r++){ A += J[r][0] * J[r][0]; B += J[r][0] * J[r][1]; Cc += J[r][1] * J[r][1]; g0 += J[r][0] * e[r]; g1 += J[r][1] * e[r]; }
      const det = A * Cc - B * B || 1e-9; b = Math.min(C.BEND, Math.max(-C.BACK, b - (Cc * g0 - B * g1) / det)); t = Math.min(C.TWIST, Math.max(-C.TWIST, t - (A * g1 - B * g0) / det / C.TWISTW));
      e0 = miss(0, b, t); e1 = miss(1, b, t); if (e0 < 1e-3 && e1 < 1e-3) break; }
  o.b = b; o.t = t; o.over = Math.max(0, e0, e1); return o; }
// an arm in the torso's frame ([ahead, up, right] from the hips; the torso standing straight in it): the elbow and the wrist for
// the shoulder s and the wrist's target tg, sd 1 the right arm and -1 the left. The elbow points down, back and a little out
// (LEMMER.ELBOW), and further out when that would put it in the torso's side (CLEAR, and cl more under a life jacket), so it never
// goes through the body.
function armIk(s, tg, sd, L, o, cl){
  // (a wrist is never folded right up into its own shoulder: nearer than FOLD it is moved out to that, down, ahead and out of it the
  // nearer it was; how far it was moved is in near)
  { const dx = tg[0] - s[0], dy = tg[1] - s[1], dz = tg[2] - s[2], D = Math.hypot(dx, dy, dz), F = LEMMER.FOLD;
    if (D < F){ const k = F - D, vx = dx + 0.3 * k * 4, vy = dy - 0.8 * k * 4, vz = dz + 0.5 * sd * k * 4, l = Math.hypot(vx, vy, vz) || 1, t2 = [s[0] + vx / l * F * 1.001, s[1] + vy / l * F * 1.001, s[2] + vz / l * F * 1.001];
      o = armIk(s, t2, sd, L, o, cl); o.near = Math.hypot(t2[0] - tg[0], t2[1] - tg[1], t2[2] - tg[2]); return o; } }
  // (a wrist is never in his own body, and a hand across him by the far hip is not reached through it: before the chest and the
  // belly the wrist keeps CHEST ahead of the spine, and well across him FRONT, going round before the belly; how far it was moved
  // is in push. The edges soft)
  const C0 = LEMMER, k01 = v => v < 0 ? 0 : v > 1 ? 1 : v, wu = k01((tg[1] + 0.05) / 0.08) * k01((C0.SH[0] + 0.05 - tg[1]) / 0.08);
  // (the new people: the trunk is its own profile, measured on the mesh that is drawn (figpose.js figProfile), and the wrist keeps
  // WRIST clear of it: out ahead of it, out to its side when that is nearer (a hand hanging by the hip), or out behind a back it is
  // behind already; a wrist across his middle goes round before the belly as before. The solver's own turn, then, without the profile)
  const PF = C0.prof;
  if (PF){ const y = tg[1], r = tg[2], f = figProfAt(PF, y, r), bk = figProfAt(PF, y, r, true), pm = figProfAt(PF, y, 0);
    // (only a wrist that is across him and before him: one that is out past his far side is clear of him, the elbow's matter)
    const hw0 = PF.half[Math.floor((y - PF.lo) / PF.dy)] || 0, xk = k01((-0.05 - r * sd) / 0.1) * k01((hw0 + C0.WRIST + 0.02 - Math.abs(r)) / 0.04), lx = pm > 0 && xk > 0 && tg[0] > -0.2 ? (pm + C0.WRIST + C0.FRONT - C0.CHEST) * xk - tg[0] : 0;
    if (f > 0 || bk > 0 || lx > 1e-4){ const W = C0.WRIST, hw = PF.half[Math.floor((y - PF.lo) / PF.dy)] || 0, la = f + W - tg[0], lb = tg[0] + bk + W, ls = hw + W - Math.abs(r);
      if ((la > 1e-4 && lb > 1e-4 && ls > 1e-4) || lx > 1e-4){ let da = 0, ds = 0;
        if (lx > 1e-4 && lx >= la) da = Math.min(0.4, lx);
        else if (lb < la && lb < ls) da = -lb;
        else { const w = k01((la - ls) / 0.04 + 0.5); da = Math.min(0.4, la) * (1 - w); ds = ls * w; }
        C0.prof = null; C0.own = true; try { o = armIk(s, [tg[0] + da + (da >= 0 ? 1e-3 : -1e-3), y, r + (Math.abs(r) < 0.02 ? sd : Math.sign(r)) * ds], sd, L, o, cl); } finally { C0.prof = PF; C0.own = false; }
        o.push = Math.hypot(da, ds); if (C0.log) o.dbg = [tg[0], y, r, f, bk, hw, la, lb, ls, lx].map(v => +v.toFixed(3)); return o; } }
    C0.prof = null; C0.own = true; try { return armIk(s, tg, sd, L, o, cl); } finally { C0.prof = PF; C0.own = false; } }
  const need = Math.max(C0.CHEST * Math.sqrt(Math.max(0, 1 - tg[2] * tg[2] / 0.0361)), C0.FRONT * k01((-0.05 - tg[2] * sd) / 0.1)) * wu, lack = tg[0] < -0.2 ? 0 : Math.min(0.4, (need - tg[0]) * k01(need / 0.03) * k01((tg[0] + 0.2) / 0.05));   // (the torso round: 0.19 m to either side; nothing asked of a wrist out beside it, nor of one behind his back, which is not pulled through him)
  if (lack > 1e-4 && !C0.own){ o = armIk(s, [tg[0] + lack + 1e-3, tg[1], tg[2]], sd, L, o, cl); o.push = lack; return o; }   // (own: the profile has had its say already)
  // (a hand up by the shoulder or over it, the cup at the mouth, the binoculars, an arm up: the elbow down under it, not back)
  const C = LEMMER, P = C.ELBOW, CL = C.CLEAR + (cl || 0), up = Math.min(1, Math.max(0, (tg[1] - s[1] + 0.25) / 0.3)), hi = up * up * (3 - 2 * up); o = ik2(s, tg, L.ua, L.fa, [P[0] + (C.ELBOWHI - P[0]) * hi, P[1], P[2] * sd * (1 - hi * Math.min(1, Math.max(0, (tg[2] * sd - s[2] * sd) / 0.1)))], o);   // (and not out, under a hand raised out to his side)
  const e = o.j, side = e[2] * sd;
  // (beside or in the torso: between the hips and the shoulders, not well ahead of the chest or behind the back; the edges soft)
  const w = Math.min(1, (0.2 - Math.abs(e[0])) / 0.06, (e[1] + 0.05) / 0.06, (C.SH[0] + 0.08 - e[1]) / 0.06); if (side >= CL || w <= 0) return o;
  // the elbow is on a circle about the arm's own line: turned on it the least that takes it out to CLEAR, or as far out as it goes
  const d = o.d, ux = (o.e[0] - s[0]) / d, uy = (o.e[1] - s[1]) / d, uz = (o.e[2] - s[2]) / d, a = (d * d + L.ua * L.ua - L.fa * L.fa) / (2 * d), cx = s[0] + ux * a, cy = s[1] + uy * a, cz = s[2] + uz * a;
  const px = e[0] - cx, py = e[1] - cy, pz = e[2] - cz, qx = uy * pz - uz * py, qy = uz * px - ux * pz, qz = ux * py - uy * px, A = sd * pz, B = sd * qz, M = Math.hypot(A, B); if (M < 1e-6) return o;
  const K = side + (CL - side) * w - sd * cz, f0 = Math.atan2(B, A), n = x => x - 2 * Math.PI * Math.round(x / (2 * Math.PI)); let f = f0;
  if (K < M){ const dl = Math.acos(Math.max(-1, K / M)), f1 = n(f0 + dl), f2 = n(f0 - dl); f = Math.abs(f1) < Math.abs(f2) ? f1 : f2; }
  // (a hand far across him: the elbow cannot get out to his side, and goes out ahead of the belly as well)
  const v = Math.min(1, (K - 0.85 * M) / (0.3 * M)); if (v > 0) f += n(Math.atan2(B + qx, A + px) - f) * v;
  let c = Math.cos(f), sn = Math.sin(f), ea = cx + px * c + qx * sn, er = (cz + pz * c + qz * sn) * sd;
  // (still in the belly, a hand reaching across him: turned on, the least that takes the elbow out ahead of it)
  if (er < 0.17 && Math.abs(ea) < C.BELLY){ const M2 = Math.hypot(px, qx), K2 = C.BELLY - cx; if (M2 > 1e-6){ const g0 = Math.atan2(qx, px); if (K2 < M2){ const dl = Math.acos(Math.max(-1, K2 / M2)), g1 = n(g0 + dl - f), g2 = n(g0 - dl - f); f += Math.abs(g1) < Math.abs(g2) ? g1 : g2; } else f = g0; c = Math.cos(f); sn = Math.sin(f); } }
  e[0] = cx + px * c + qx * sn; e[1] = cy + py * c + qy * sn; e[2] = cz + pz * c + qz * sn; return o; }
// an arm to a hand's point hd (where it holds): the wrist a hand's length back from it along the hand, the hand along the forearm
// (a few rounds, as drawWorker turns it), in the torso's frame. o.w is the wrist's target
function armHand(s, hd, sd, L, o, cl){ const H = LEMMER.HAND; let zx = hd[0] - s[0], zy = hd[1] - s[1], zz = hd[2] - s[2], l = Math.hypot(zx, zy, zz) || 1; zx /= l; zy /= l; zz /= l;
  for (let n = 0; n < 4; n++){ o = armIk(s, [hd[0] - zx * H, hd[1] - zy * H, hd[2] - zz * H], sd, L, o, cl); if (n === 3 || o.over > 0) break;
    let fx = o.e[0] - o.j[0], fy = o.e[1] - o.j[1], fz = o.e[2] - o.j[2]; l = Math.hypot(fx, fy, fz) || 1; fx = fx / l - zx; fy = fy / l - zy; fz = fz / l - zz; if (Math.abs(fx) + Math.abs(fy) + Math.abs(fz) < 0.01) break;
    zx += fx * 0.8; zy += fy * 0.8; zz += fz * 0.8; l = Math.hypot(zx, zy, zz) || 1; zx /= l; zy /= l; zz /= l; }
  return o; }
// how far the hips come down for both feet to be within the legs' reach: hips and feet as [x, up, z] in any level frame
function legDrop(hips, feet, L){ const C = LEMMER, R = (L.th + L.sn) * C.REACH; let dr = 0;
  for (const i of [0, 1]){ const hx = hips[i][0] - feet[i][0], hz = hips[i][2] - feet[i][2], h2 = hx * hx + hz * hz, v = hips[i][1] - feet[i][1]; dr = Math.max(dr, h2 >= R * R ? C.DROP : v - Math.sqrt(R * R - h2)); }
  return Math.min(C.DROP, Math.max(0, dr)); }
// the sea legs of one person standing or walking on a deck: s his state (seaState), inp what the deck does where he stands, in his own
// frame (ahead and to his right, level in the world):
//   sr, sf   the deck's slope to his right and ahead (m up per m; from the deck's normal, so roll and pitch seen his way)
//   y        the height of the deck under him in the world (m; its changes are the heave)
//   hs       the significant wave height (m)
//   dt       s since the last call (none, or over half a second: he is put straight into the pose, nothing swings)
//   walk     he is walking (the feet are the gait's; no hand to the rail, no step)
//   room     the room for it (SEAROOM's form; deckcrew seaRoom): to each side and fore and aft 0–1 (1: upright with the sea legs, 0: square to the deck), each foot out 0 or 1, nostep no bracing step here
//   rail     a rail within reach as [ahead, right, height of its top] or null, hand the hand that may take it (0 right, 1 left, null either)
//   stepOk   (right, ahead) => whether a foot can be put out that way (nothing in the way); none: it can
// Gives (the same object each time, s.o): fr, fa where each foot stands ([left, right]; m to his right and ahead of where he stands),
// fy the deck's height under it over the deck under him, lift how far it is off the deck (the step), kf how far forward each knee is
// and kneeDeg its bend, sqR, sqU, sqF the way from the feet up to the hips (a unit: plumb, or along the deck's normal where there is
// no room to stand upright; pelv: the hips' slope to his right then), hipY how much nearer the feet the hips are along it (the knees
// bent), hipR, hipF the hips' shift to the side and ahead from there, leanR, leanF the torso's lean (rad, to the right and ahead), grab 0–1 the hand
// gh on the rail, step 0–1 the foot stFoot put out. Pure but for s.
function seaLegs(s, inp){
  const C = SJOBEIN, o = s.o, sr = inp.sr || 0, sf = inp.sf || 0, y = inp.y || 0, room = inp.room || SEAROOM, walk = !!inp.walk, dt = inp.dt;
  const tilt = Math.hypot(sr, sf), ang = Math.atan(tilt), snap = s.y === null || !(dt >= 0) || dt > 0.5, kT0 = Math.min(1, Math.max(0, (inp.hs || 0) / C.HSFULL));
  if (snap){ s.qr = sr; s.qf = sf; s.vr = s.vf = 0; s.hy = y; s.env = ang; s.envH = s.envP = 0; s.k = Math.max(kT0, Math.min(1, ang / C.ROLLFULL)); }
  else {
    const n = Math.max(1, Math.ceil(dt / 0.02)), h = dt / n, wn = 2 * Math.PI * C.FZ;
    for (let i = 0; i < n; i++){
      s.vr += (wn * wn * (sr - s.qr) - 2 * C.ZT * wn * s.vr) * h; s.qr += s.vr * h;
      s.vf += (wn * wn * (sf - s.qf) - 2 * C.ZT * wn * s.vf) * h; s.qf += s.vf * h;
    }
    s.hy += (y - s.hy) * (1 - Math.exp(-dt / C.HMEAN));
    s.env = Math.max(ang, s.env * Math.exp(-dt / 20));
    s.k += (Math.max(kT0, Math.min(1, s.env / C.ROLLFULL)) - s.k) * (1 - Math.exp(-dt / 3)); }
  s.y = y;
  const lim = (v, m) => v > m ? m : v < -m ? -m : v;
  // (the room to the deck's high side, 0–1: with all of it he stands upright with the sea legs; with none, square to the deck, the
  // hips over the feet as the deck has them, braced against what is there; between, that share of each)
  // (the room changes when he comes to a place or leaves it: taken over a third of a second, so the body does not jump; s.rm)
  const rm = s.rm, kr = snap ? 1 : 1 - Math.exp(-dt / 0.3); for (let i = 0; i < 2; i++){ rm[i] += (room.r[i] - rm[i]) * kr; rm[2 + i] += (room.f[i] - rm[2 + i]) * kr; rm[4 + i] += (room.w[i] - rm[4 + i]) * kr; }
  const uqR = rm[s.qr > 0 ? 1 : 0], uaR = rm[sr > 0 ? 1 : 0], uqF = rm[s.qf > 0 ? 3 : 2], uaF = rm[sf > 0 ? 3 : 2];
  const leanR = -uqR * lim(C.LEAN * Math.atan(s.qr), C.LEANMAX) - (1 - uaR) * Math.atan(sr), leanF = -uqF * lim(C.LEAN * Math.atan(s.qf), C.LEANMAX) - (1 - uaF) * Math.atan(sf);
  let hipR = uqR * lim(C.HIP * s.qr, C.HIPMAX), hipF = uqF * lim(C.HIP * C.HIPF * s.qf, C.HIPMAX * C.HIPF);
  // (the way from the feet to the hips, a unit: plumb with all the room, along the deck's normal with none)
  const qR = -(1 - uaR) * sr, qF = -(1 - uaF) * sf, ql = Math.hypot(qR, 1, qF), sqR = qR / ql, sqF = qF / ql, sqU = 1 / ql;
  // the heave: the knees give against the deck's way up and down about its mean (s.hy), by a share of it: HEAVE while the legs
  // reach that far, less in a big sea (the share of the heave lately, s.envH, that they do reach), so the hips move less than the
  // deck and never faster than the legs go; he stands lower the more there is to take up
  // (before the heave has been seen, a first frame or after a gap, it is taken from the sea's height: HSHEAVE of Hs each way)
  const dy = snap ? 0 : y - s.hy, pk0 = C.HSHEAVE * (inp.hs || 0), pk = Math.max(Math.abs(dy), pk0, snap ? 0 : s.envP * Math.exp(-dt / 15)); s.envP = pk; s.envH = snap ? pk : s.envH + (pk - s.envH) * (1 - Math.exp(-dt / 1));
  // (room.k: less of the crouch where the knees have no room ahead)
  const crT = Math.min(C.CROUCHMAX, C.CROUCH * s.k + C.HEAVE * s.envH) * (room.k == null ? 1 : room.k); s.cr = snap ? crT : s.cr + (crT - s.cr) * (1 - Math.exp(-dt / 2));
  const cr = s.cr, A = Math.min(C.HIPUP + cr, C.HIPDN - cr), beta = Math.min(C.HEAVE, A / Math.max(1e-3, pk)), hipY = -cr - A * Math.tanh(beta * dy / A);
  // the hand to the rail, and the foot put out down the slope
  const step = (on, v, t) => snap || !(t > 0) ? (on ? 1 : 0) : on ? Math.min(1, v + dt / t) : Math.max(0, v - dt / t), rl = !walk && inp.rail ? inp.rail : null, d0 = dt >= 0 ? Math.min(dt, 5) : 0;   // (after a gap the hand and the foot are where the time gone puts them)
  if (rl) s.rl = rl;   // (the rail last within reach: the hand leaves it over GRABT when he goes)
  if (rl && !s.gOn && ang > C.GRAB){ const gh = inp.hand != null ? inp.hand : rl[1] >= 0 ? 0 : 1;   // (a rail to one side is for the hand on that side)
    if (rl[1] * (gh ? -1 : 1) >= 0 && Math.hypot(rl[0], rl[2] - 1.42, (rl[1] || (gh ? -0.2 : 0.2)) - (gh ? -0.21 : 0.21)) < C.REACH){ s.gOn = true; s.gh = gh; s.gT = 0; } }
  else if (s.gOn){ if (!rl) s.gOn = false; else if (ang < C.FREE){ s.gT += d0; if (s.gT > C.HOLD) s.gOn = false; } else s.gT = 0; }
  s.g = step(s.gOn, s.g, C.GRABT);
  // (a foot on its way back in comes all the way in before it is put out again)
  if (!walk && !s.stOn && s.st === 0 && ang > C.STEP){ const dr = -sr / tilt, da = -sf / tilt;
    if (!room.nostep && (!inp.stepOk || inp.stepOk(dr, da))){ s.stOn = true; s.stT = 0; s.stR = dr; s.stF = da; s.stFoot = Math.abs(dr) > 0.35 ? (dr > 0 ? 1 : 0) : 1; } }
  else if (s.stOn){ if (walk) s.stOn = false; else if (ang < C.STEPBACK){ s.stT += d0; if (s.stT > C.STEPHOLD) s.stOn = false; } else s.stT = 0; }
  s.st = walk ? 0 : step(s.stOn, s.st, C.STEPT);
  const pelv = (1 - uaR) * sr;   // (square to the deck, the hips lie as the deck does: the slope across them)
  const e = s.st * s.st * (3 - 2 * s.st), sl = C.STEPLEN * e; hipR += 0.4 * s.stR * sl; hipF += 0.4 * s.stF * sl;
  const hh = 0.92 + hipY;   // (the hips' height over the feet along that way: the knees bend along the legs)
  for (let i = 0; i < 2; i++){ const sg = i ? 1 : -1, mine = i === s.stFoot ? sl : 0;
    o.fr[i] = sg * (0.12 + C.WIDE * s.k * (walk ? 0.4 : 1) * rm[4 + i]) + s.stR * mine; o.fa[i] = s.stF * mine; o.fy[i] = o.fa[i] * sf + o.fr[i] * sr;
    o.lift[i] = mine && s.st < 1 ? 0.05 * Math.sin(Math.PI * s.st) : 0;
    const d = Math.hypot(hh * sqU - 0.08 + sg * 0.11 * pelv - o.fy[i] - o.lift[i], hipR + hh * sqR + sg * 0.11 - o.fr[i], hipF + hh * sqF - o.fa[i]); o.kf[i] = Math.max(0.02, 0.07 + seaKnee(0.84, d)); o.kneeDeg[i] = 2 * Math.atan2(o.kf[i], d / 2) * 180 / Math.PI; }
  o.sr = sr; o.sf = sf; o.ang = ang; o.k = s.k; o.hipR = hipR; o.hipF = hipF; o.hipY = hipY; o.pelv = pelv; o.sqR = sqR; o.sqF = sqF; o.sqU = sqU; o.leanR = leanR; o.leanF = leanF; o.grab = s.g * s.g * (3 - 2 * s.g); o.gh = s.gh; o.rail = s.rl || null; o.step = e; o.stFoot = s.stFoot;
  return o;
}
