  // ---------- landing the catch ----------
  // The crane lifts the boxes (on pallets) or the tubs from the deck to the quay, the forklift takes two loads at a time into the
  // plant, and the people on the quay have their jobs: one signals at the edge, one takes the loads, one counts at the door and the
  // crane driver works the radio remote. It all follows the simulation's landing timeline (LANDING, game minutes), so the last load
  // is ashore when the landing note comes.
  const HOOK_UP = QTOP + 3.9;
  const ease = u => u * u * (3 - 2 * u), seg = (u, a, b) => clamp((u - a) / (b - a), 0, 1);
  // the loads (core/07f-kar.js, 04.11.2026): white 460 l tubs of TUB_KG, lifted in a four-leg sling (drawSling) from where they stand: an
  // open boat's own from their places on deck, and the same tubs back washed after (lifts n .. 2n-1, after the wash); a boat with a hold
  // fills the plant's tubs from the hold, set out on deck (deckSlots) one by one. A landing saved before then ('box') keeps its pallets.
  const SLH = 1.793;   // the hook's level over the base of the tub hanging in the sling (the ring 0.95 m over the rim)
  const TUBH = 0.74;   // a tub's height, for stacking two on the quay and on the forks
  const HOLDD = 3.2;   // how far below the weather deck the pallets are taken from in the hold (the hatch's trunk is 1.4 m, al45.py; a pallet 1.68 m)
  const PALLH = 1.9;   // a pallet of frozen cartons (H2b, 08-plants.js palF): about a tonne, 11 layers of four, wrapped (the Blender one, H2d: kitX('pall').h)
  const loadH = (kind, nb) => kind === 'tub' ? TUBH : kind === 'pall' ? PALLH : 0.13 + Math.ceil(nb / 3) * 0.29;
  const craneIdle = (P, T) => ({a:Math.atan2(P.u[0], P.u[1]) + Math.sin(T * 0.05) * 0.25, r:5.5, hook:QTOP + 3.2});
  // the forklift at rest: at its spot east of the drop spot, forks towards it
  const fkRest = P => { const R = fkRun(P); return {x:R.Wp[0], z:R.Wp[1], h:R.waitH, fl:0, loads:[]}; };
  const poseTo = (P, x, z, hook) => ({a:Math.atan2(x - P.crane[0], z - P.crane[1]), r:Math.max(1.5, Math.hypot(x - P.crane[0], z - P.crane[1])), hook});
  const poseMix = (A, B, k) => ({a:A.a + angDiff(A.a, B.a) * k, r:A.r + (B.r - A.r) * k, hook:A.hook + (B.hook - A.hook) * k});
  const tipOf = (P, q) => craneGeo(P, q).tip;
  // where the plant's tubs stand on deck on a boat with a hold, in the boat's frame (x to starboard, z aft); the first is the next to go up
  function deckSlots(kind){
    const G = GEO(vtype()), d = G.deck || {y:G.gw, z:(G.stern || 3) * 0.5};
    // (a freezer vessel's pallets come up through her cargo hatch over the hold, anchors.hatch, H2d: the next one stands down in the hold
    // under the opening, HOLDD below the deck, out of sight under the trunk's dark floor, and comes up through it on the fork, H2d2)
    if (kind === 'pall' && G.hatch) return [[G.hatch.at[0], G.hatch.deck - HOLDD, G.hatch.at[2]]];
    // (OB4, F10: on a boat with a deck crew the plant's tubs stand where her deck is clear and open to the sky, deckcrew.js landSlots:
    // [x, y, z, turn]; the fixed square below stood through the hatch coaming on some decks and under the 15 m boat's shelter deck)
    if (kind === 'tub' && typeof CREW3D !== 'undefined' && CREW3D.on()){ const L = CREW3D.landSlots(); if (L.length) return L; }
    return kind === 'tub' ? [[0.65, d.y, d.z - 0.55], [-0.65, d.y, d.z - 0.55], [0.65, d.y, d.z + 0.55], [-0.65, d.y, d.z + 0.55]] : [[0, d.y, d.z - 0.45], [0, d.y, d.z + 0.45]];
  }
  // the forklift's run on the unit's route: from its spot east of the drop spot forward to the loads, lift, on round a quarter turn to
  // the door's line and in through the door, set down, and back the same way in reverse. With back (an open boat's own tubs) it takes
  // the washed empties up inside and brings them out to the drop spot before it goes back to its spot. The route keeps the truck's
  // corners well inside the deck (unittest.py checks it). Its speed is set so a run takes at most two lifts (with back: the wash).
  // (Q: where a vessel's own crane set the loads down on the quay, H2d2: the forklift fetches them there and drives on its lane in;
  // kept while she lies within a metre of where it was made for)
  function fkRun(P, back, Q){
    const ck = back ? 'runB' : Q ? 'runQ' : 'run'; if (P[ck] && (!Q || Math.hypot(P[ck].Q[0] - Q[0], P[ck].Q[1] - Q[1]) < 1)) return P[ck];
    const T = unitModel(P.unit.v).A.truck, W = q => unitW(P.unit, q[0], q[2]), c = T.arc, r = T.r;
    const arc = []; for (let k = 0; k <= 8; k++){ const a = Math.PI / 2 * k / 8; arc.push(W([c[0] - r * Math.sin(a), 0, c[2] + r * Math.cos(a)])); }
    const wait = W(T.wait), pick = Q ? Q.slice() : W(T.pick), inn = W(T.in), inPath = Q ? [pick, W(T.pick), ...arc, inn] : [pick, ...arc, inn], outPath = [...inPath].reverse().concat([wait]);
    const hd = (a, b) => Math.atan2(b[0] - a[0], -(b[1] - a[1])), plen = pts => pts.reduce((s, q, i) => i ? s + Math.hypot(q[0] - pts[i - 1][0], q[1] - pts[i - 1][1]) : 0, 0);
    const legs = [{kind:'go', pts:[wait, pick], rev:false}, {kind:'pick', pts:[pick], h:hd(wait, pick), dur:0.35}, {kind:'go', pts:inPath, rev:false},
      {kind:'drop', pts:[inn], h:hd(arc[8], inn), dur:0.3}];
    if (back) legs.push({kind:'pick', pts:[inn], h:hd(arc[8], inn), dur:0.6, empties:true}, {kind:'go', pts:[...inPath].reverse(), rev:true, empties:true},
      {kind:'drop', pts:[pick], h:hd(wait, pick), dur:0.3, empties:true}, {kind:'go', pts:[pick, wait], rev:true});
    else legs.push({kind:'go', pts:outPath, rev:true});
    for (const g of legs) g.len = plen(g.pts);
    const dist = legs.reduce((s, g) => s + g.len, 0), fixed = legs.reduce((s, g) => s + (g.dur || 0), 0), room = back ? LANDING.wash + (1 - LANDING.hooked) * LANDING.lift - 0.4 - fixed : 3.95;
    const vG = Math.max(20, dist / Math.max(1, room));   // metres per game minute
    let t = 0; for (const g of legs){ g.t0 = t; g.dur = g.dur || g.len / vG; t += g.dur; }
    return P[ck] = {legs, T:t, Wp:wait, waitH:hd(wait, pick), inn, Q:Q || null};
  }
  // where a leg of the run puts the truck at w (0-1): moving off and pulling up gently, facing the way it drives (or the other way
  // when it reverses)
  function legAt(g, w){
    if (g.kind !== 'go'){ const q = g.pts[0]; return {x:q[0], z:q[1], h:g.h}; }
    let s = ease(w) * g.len;
    for (let i = 1; i < g.pts.length; i++){ const a = g.pts[i - 1], b = g.pts[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (s > L && i < g.pts.length - 1){ s -= L; continue; }
      const k = L ? clamp(s / L, 0, 1) : 0, dx = b[0] - a[0], dz = b[1] - a[1]; return {x:a[0] + dx * k, z:a[1] + dz * k, h:g.rev ? Math.atan2(-dx, dz) : Math.atan2(dx, -dz)}; }
    const q = g.pts[g.pts.length - 1]; return {x:q[0], z:q[1], h:0};
  }
  // what lift j of a landing carries: an open boat's tub i (out with its catch, or back washed), a plant's tub with its share of the catch,
  // or an old landing's pallet; draw(M) draws it with M at its base, h its height on the quay and the forks, sl its hook height in the sling
  function landLoad(L, j){
    if (L.kind === 'box'){ const nb = Math.min(9, L.n - 9 * j), m = PM.palN[Math.max(0, nb)]; return {draw:M => drawN(m, M), h:loadH('box', nb), sl:loadH('box', nb), box:true}; }
    // a freezer vessel's frozen catch: the Blender pallet of 44 cartons in film (tools/deck/pall.py, H2d), carried on the pallet fork whose
    // eye the hook takes (sl: the hook's eye over the pallet's base); the simple pallet of H2b where the model is not in the page
    // (H3d1, 07.11.2026) the snow crab vessel's: the clusters in their cartons on the pallet of their own (pall_sno), and the live crab
    // pumped from the tanks into the tubs (kar_levende) that go ashore after the pallets (07-harbours.js landPlan: lift np and after)
    if (L.kind === 'pall' || (L.kind === 'tub' && !L.own && L.lv > 0)){ const X = kitX('pall'), live = L.kind === 'tub' || (L.np != null && j >= L.np);
      if (L.sno == null) L.sno = (S.hold || []).some(x => x.sp === 'snokrabbe' && !x.tank);
      if (live){ const KL = kit('pall', 'kar_levende'), K = X.kar || {}; if (KL) return {draw:M => drawLiveTub(KL, M, K, j), h:K.h || TUBH, sl:SLH, tub:true, live:true}; }
      else { const PF = kit('pall', L.sno && kit('pall', 'pall_sno') ? 'pall_sno' : 'pall_full'); if (PF && X.gaffel) return {draw:M => drawN(PF, M), h:(L.sno && X.sno ? X.sno.h : X.h) || PALLH, sl:-X.gaffel.base, box:true, pall:true}; }
      if (L.kind === 'pall') return {draw:M => drawN(PM.palF, M), h:PALLH, sl:PALLH, box:true}; }
    if (L.own){ const vt = vtype(), i = j < L.n ? j : j - L.n, back = j >= L.n, T = tubLoads(S.hold, karPlaces(vt).length)[i];
      return {draw:M => drawKarLoad(M, back ? null : T, vt + ':' + i, back), h:TUBH, sl:SLH, tub:true, place:i, back}; }
    const ic = (() => { let a = 0, b = 0; for (const x of S.hold || []) if (inTub(x)){ a += x.kg; if (x.iced) b += x.kg; } return a > 0 ? b / a : 1; })();
    const kg = Math.max(0, Math.min(TUB_KG, (L.kg || 0) - TUB_KG * j));
    return {draw:M => drawKarLoad(M, {kg, iced:kg * ic}, 'pl:' + L.t0 + ':' + j, false), h:TUBH, sl:SLH, tub:true};
  }
  // a tub of live snow crab: the tub with its sea water, and the crabs in it at the surface (each tub its own few, from its lift)
  function drawLiveTub(KL, M, K, j){ drawN(KL, M); if (!SK || !SK.fishM) return; const w = (K.water || 0.62) + 0.02;
    for (let k = 0; k < 5; k++) drawN(fishOf('snokrabbe'), chain(M, M4.T((hash(j * 13 + k * 5) - 0.5) * 0.6, w, (hash(j * 7 + k * 11 + 3) - 0.5) * 0.8), M4.RY(hash(j + k * 3) * 6.3), M4.S(0.42))); }
  // how far open your boat's cargo hatch is (0 shut, 1 open; anchors.hatch, H2d): open while she lands pallets, from the crane's first move
  // over to the last pallet ashore, shut at sea
  function hatchOpenK(){ const b = S.boat, L = b && b.land; if (!L || L.kind !== 'pall' || b.status !== 'port') return 0;
    const e = S.t + currentFrac() - L.t0, end = landLiftT(L, (L.np > 0 && L.np < L.lifts ? L.np : L.lifts) - 1) + liftMin(L); return clamp(e / (LANDING.prep * 0.8), 0, 1) * (1 - clamp((e - end) / LANDING.prep, 0, 1)); }
  // the tubs of an open boat off her deck at a landing now (on the hook, on the quay, in the plant)
  function landOff(L){ if (!L || !L.own) return null; const e = S.t + currentFrac() - L.t0, lf = LANDING.lift, out = new Set();
    for (let i = 0; i < L.n; i++) if (e >= landLiftT(L, i) + 0.42 * lf && e < landLiftT(L, L.n + i) + LANDING.hooked * lf) out.add(i);
    return out; }
  // the tubs back aboard washed at a landing now
  function landBack(L){ if (!L || !L.own) return null; const e = S.t + currentFrac() - L.t0, out = new Set();
    for (let i = 0; i < L.n; i++) if (e >= landLiftT(L, L.n + i) + LANDING.hooked * LANDING.lift) out.add(i);
    return out; }
  // (H2d2) a vessel with her own deck crane over her cargo hatch (the autoliner's forward crane, anchors.crane) lands her pallets with it:
  // up from the hold through the hatch and ashore on the quay abreast of the crane, 1.6 m in from the edge (berthPose lays her with the
  // quay to starboard), along it as near the plant's drop spot as the boom reaches; the forklift fetches them there. The plant's crane
  // could not do it: the hatch on her far side was 13 m from it (Vannareid, 9.55 m its reach), under a coaming 6.6 m over the sea
  const LANDFIX = {j:null, u:0};
  const SBD = 0.5;   // the fork's eye under the top of the ship crane's hook block (tools/boats/al45.py crane_block)
  // (H3d2) a crane off the middle line (the snow crab vessel's stands at her port bulwark, 9.3 m from her starboard side) sets the load down
  // as far in on the quay as its boom reaches, but never nearer the edge than 0.8 m
  function shipQuay(P, BMrel, eye, VG){
    const C = VG.crane, R = C.len * 0.97 + 0.1, e0 = (VG.beam || 10) / 2 + 0.4, bx = Math.max(e0 + 0.8, Math.min(e0 + 1.6, C.axis[0] + R * 0.95)), lat = bx - C.axis[0], O = xf(BMrel, [0, 0, 0]), fx = Math.sin(bv.head), fz = -Math.cos(bv.head);
    const zDrop = -((P.drop[0] - (O[0] + eye[0])) * fx + (P.drop[1] - (O[2] + eye[2])) * fz), sm = Math.sqrt(Math.max(0, R * R - lat * lat)) * 0.92;
    const Qb = [bx, 0, clamp(zDrop, C.axis[2] - sm, C.axis[2] + sm)], w = xf(BMrel, Qb); return {b:Qb, w:[w[0] + eye[0], w[2] + eye[2]]};
  }
  // a pose of the ship's crane about its slewing axis (boat frame): the slew, the boom's elevation for its tip over (x, z), the hook's height
  function shipAim(C, x, z, hook){ const ho = Math.hypot(C.heel[0] - C.axis[0], C.heel[2] - C.axis[2]), r = Math.hypot(x - C.axis[0], z - C.axis[2]);
    return {a:Math.atan2(x - C.axis[0], z - C.axis[2]), el:Math.acos(clamp((r - ho) / C.len, 0.05, 0.97)), hook}; }
  function shipPark(C){ const v = [C.park[0] - C.heel[0], C.park[1] - C.heel[1], C.park[2] - C.heel[2]], h = Math.hypot(v[0], v[2]); return {a:Math.atan2(v[0], v[2]), el:Math.atan2(v[1], h), hook:C.park[1] - (C.hang || 1)}; }
  const shipMix = (A, B, k) => ({a:A.a + angDiff(A.a, B.a) * k, el:A.el + (B.el - A.el) * k, hook:A.hook + (B.hook - A.hook) * k});
  // everything a landing shows at game minute gt: the crane's pose and what hangs from it, the loads on deck and on the quay,
  // the forklift, and where the people stand and what they do. null when this plant is not landing the boat you are on.
  function landScene(P, T, BMrel, eye){
    const b = S.boat, L = b.land; if (!L || L.pid !== P.id || b.status !== 'port' || b.port !== P.id || !BMrel) return null;
    const Lg = LANDING, pr = Lg.prep, lf = liftMin(L), n = L.lifts, nOut = L.own ? L.n : n, hk = Lg.hooked, t0 = j => landLiftT(L, j);
    const e = LANDFIX.j != null && LANDFIX.j < n ? t0(LANDFIX.j) + LANDFIX.u * lf : S.t + currentFrac() - L.t0;   // (LANDFIX: a moment of a lift held for pictures, G3._debug.landFix)
    const LD = []; for (let j = 0; j < n; j++) LD.push(landLoad(L, j));
    // (her own crane, H2d2; H3d2: also the snow crab vessel's live crab, in tubs filled from the tanks, when she lands only that)
    const VG = GEO(vtype()), SC = (L.kind === 'pall' || (L.kind === 'tub' && !L.own && L.lv > 0 && VG.snok)) && VG.crane && VG.crane.axis && VG.hatch && typeof shipCraneOf === 'function' && shipCraneOf(vtype()) ? VG.crane : null;
    // (H3d2) the live crab's tub stands on deck by the RSW tanks' hatches while the pump fills it (snok.rsw), starboard of them
    const RW = SC && VG.snok && VG.snok.rsw && VG.snok.rsw.length ? VG.snok.rsw : null, liveAt = RW ? [RW.reduce((a, q) => a + q[0], 0) / RW.length + 1.5, (VG.deck || {y:VG.gw}).y, RW.reduce((a, q) => a + q[2], 0) / RW.length] : null;
    const wpos = q => { const r = xf(BMrel, q); return [r[0] + eye[0], r[1] + eye[1], r[2] + eye[2]]; }, SQ = SC ? shipQuay(P, BMrel, eye, VG) : null, D = SQ ? SQ.w : P.drop, slots = deckSlots(SC ? 'pall' : L.kind), places = L.own ? karPlaces(vtype()) : null;
    const slotOf = j => liveAt && LD[j] && LD[j].live ? liveAt : slots[0], sbd = j => LD[j] && LD[j].tub ? 0 : SBD;   // (a tub hangs in the sling on the hook, a pallet on the fork under the block)
    // where lift j is picked up and set down (world): an own tub from its place to the drop spot and back; the plant's from the deck slots
    // (the hook's travelling height: over the quay as before, but over a high deck and its hatch coaming with the load under it, as on
    // the autoliner, whose weather deck is 6.25 m over the sea, H2d2)
    const GH0 = L.kind === 'pall' ? GEO(vtype()).hatch : null, HU = GH0 && LD.length ? Math.max(HOOK_UP, wpos([GH0.at[0], GH0.at[1], GH0.at[2]])[1] + LD[0].sl + 0.6) : HOOK_UP;
    // (the ship's crane: over the hold and over the quay at the travelling height, clear of the coaming and the bulwark with the pallet
    // under it; a pallet set down on the quay is turned as the crane has turned it)
    // (crane.clear: the highest thing she slews the load over, the crane driver's cage forward of the crane on the autoliner)
    const sl0 = LD.length ? Math.max(...LD.map(q => q.sl)) : 2, HUb = SC ? Math.max(VG.hatch.at[1], VG.gw || 0, SC.clear || 0) + sl0 + SBD + 0.5 : 0;
    const pdB = SC ? shipAim(SC, SQ.b[0], SQ.b[2], HUb) : null, pkOf = j => { const q = slotOf(j); return shipAim(SC, q[0], q[2], HUb); };
    let pkB = SC ? pkOf(0) : null; const pk0 = pkB;   // (pk0: the load's turn on the quay is reckoned from the first lift's, as MQ is)
    if (SC){ const r = Math.hypot(SQ.b[0] - SC.axis[0], SQ.b[2] - SC.axis[2]) - Math.hypot(SC.heel[0] - SC.axis[0], SC.heel[2] - SC.axis[2]); KST.shipReach = +(r / SC.len).toFixed(3); }
    const MQ = SC ? chain(BMrel, M4.RY(angDiff(pkB.a, pdB.a))) : null;
    const deckOf = j => L.own ? places[LD[j].place] || {at:slots[0], ry:0} : {at:SC ? slotOf(j) : slots[Math.min(slots.length - 1, 0)], ry:SC ? 0 : slots[0][3] || 0}, slewD = SC ? Math.atan2(-MQ[2], MQ[0]) : Math.atan2(D[0] - P.crane[0], D[1] - P.crane[1]);
    // (yaw: the tub's turn in the world, so the one on the hook turns smoothly from where it stood to where it goes; M: its frame resting)
    const onDeck = j => { const q = deckOf(j), M = chain(BMrel, M4.T(q.at[0], q.at[1], q.at[2]), M4.RY(q.ry)); return {w:wpos(q.at), yaw:Math.atan2(-M[2], M[0]), M}; };
    const onQuay = j => { const y = quayY(j), c = [D[0] - eye[0], y - eye[1], D[1] - eye[2]]; return {w:[D[0], y, D[1]], yaw:slewD, M:chain(M4.T(c[0], c[1], c[2]), M4.RY(slewD))}; };
    const quayY = j => { if (L.own && LD[j].back) return QTOP + (j - nOut === 0 && nOut > 1 ? TUBH : 0); return QTOP + (j % 2 ? LD[j - 1].h : 0); };   // (the empties stand stacked, the first on top)
    const from = j => L.own && LD[j].back ? onQuay(j) : onDeck(j), to = j => L.own && LD[j].back ? onDeck(j) : onQuay(j);
    const idle = craneIdle(P, T);
    let pose, hang = null, i = -1, u = 0, att = null, spose = null;
    const pk = j => { const f = from(j); return poseTo(P, f.w[0], f.w[2], HU); }, pd = j => { const q = to(j); return poseTo(P, q.w[0], q.w[2], HU); };
    for (let j = 0; j < n; j++) if (e >= t0(j)) i = j;
    if (SC){
      // her own crane (H2d2): the same steps as the plant's crane, in her frame. Over the hatch, down through it into the hold, the fork
      // under the pallet, up through the hatch over the coaming, slewed out over the quay, down, the fork out, up; the plant's crane idle
      pose = idle; const park = shipPark(SC), qY = j => quayY(j) - wpos([SQ.b[0], 0, SQ.b[2]])[1], yUp = SC.heel[1] + Math.sin(pdB.el) * SC.len - 1.2;
      if (e < pr) spose = shipMix(park, pkB, ease(seg(e, 0, pr)));
      else if (i >= 0 && e < t0(i) + lf){
        pkB = pkOf(i); u = (e - t0(i)) / lf; const sl = LD[i].sl, yk = slotOf(i)[1] + sl + sbd(i), yd = qY(i) + sl + sbd(i);
        // (she slews the load over at the hatch's luff, high over the cage and the bulwark, and luffs out over the quay as she lowers it;
        // the empty fork comes back up under the tip as it lies out over the quay)
        const hi = {a:pdB.a, el:pkB.el, hook:HUb}, lo = {...pdB, hook:yd};
        if (u < 0.18) spose = i === 0 ? pkB : shipMix({...pdB, hook:yUp}, pkB, ease(seg(u, 0, 0.18)));   // (back from over the quay)
        else if (u < 0.32) spose = {...pkB, hook:HUb + (yk - HUb) * ease(seg(u, 0.18, 0.32))};
        else if (u < 0.42) spose = {...pkB, hook:yk};
        else if (u < 0.56) spose = {...pkB, hook:yk + (HUb - yk) * ease(seg(u, 0.42, 0.56))};
        else if (u < 0.74) spose = shipMix(pkB, hi, ease(seg(u, 0.56, 0.74)));
        else if (u < hk) spose = shipMix(hi, lo, ease(seg(u, 0.74, hk)));
        else if (u < 0.93) spose = lo;
        else spose = {...pdB, hook:yd + (yUp - yd) * ease(seg(u, 0.93, 1))};
        if (u >= 0.42 && u < hk) hang = {L:LD[i], h:sl, yaw:angDiff(pk0.a, spose.a), ship:true};
        // (the sling on a tub: hooked on while the hook is down at it on deck, off on the quay, H3d2)
        if (LD[i].tub){ const F = from(i), Q = to(i); if (u >= 0.18 && u < 0.42) att = {M:F.M, k:ease(seg(u, 0.2, 0.34))}; else if (u >= hk && u < 1) att = {M:Q.M, k:1 - ease(seg(u, 0.9, 0.99))}; }
      } else spose = shipMix(i >= 0 ? {...pdB, hook:yUp} : park, park, ease(seg(e, t0(n - 1) + lf, t0(n - 1) + lf + 1.5)));
      SHIPCR.pose = spose; SHIPCR.f = FRAMEN;
    }
    else if (e < pr) pose = poseMix(idle, pk(0), ease(seg(e, 0, pr)));   // straight over to the first load
    else if (i >= 0 && e < t0(i) + lf){
      u = (e - t0(i)) / lf; const F = from(i), Q = to(i), sl = LD[i].sl, yk = F.w[1] + sl + (LD[i].box ? 0.1 : 0), yd = Q.w[1] + sl + (LD[i].box ? 0.1 : 0);
      const prev = i === 0 ? pk(0) : e - t0(i - 1) < lf + 0.01 ? pd(i - 1) : poseMix(idle, pk(i), 1);
      if (u < 0.18) pose = poseMix(prev, pk(i), ease(seg(u, 0, 0.18)));
      else if (u < 0.32) pose = {...pk(i), hook:HU + (yk - HU) * ease(seg(u, 0.18, 0.32))};
      else if (u < 0.42) pose = {...pk(i), hook:yk};
      else if (u < 0.56) pose = {...pk(i), hook:yk + (HU - yk) * ease(seg(u, 0.42, 0.56))};
      else if (u < 0.74) pose = poseMix(pk(i), pd(i), ease(seg(u, 0.56, 0.74)));
      else if (u < hk) pose = {...pd(i), hook:HU + (yd - HU) * ease(seg(u, 0.74, hk))};
      else if (u < 0.93) pose = {...pd(i), hook:yd};
      else pose = {...pd(i), hook:yd + (HU - yd) * ease(seg(u, 0.93, 1))};
      if (u >= 0.42 && u < hk) hang = {L:LD[i], h:sl, yaw:F.yaw + angDiff(F.yaw, Q.yaw) * ease(seg(u, 0.56, 0.74))};
      // the sling on the tub: put on while the hook is down at it (the hooks drawn out to the corners as it comes down), off at the other end
      if (LD[i].tub){ if (u >= 0.18 && u < 0.42) att = {M:F.M, k:ease(seg(u, 0.2, 0.34))}; else if (u >= hk && u < 1) att = {M:Q.M, k:1 - ease(seg(u, 0.9, 0.99))}; }
    } else if (i >= 0 && L.own && i === nOut - 1 && e < t0(nOut)) pose = poseMix(pd(i), poseMix(idle, pk(nOut), 0.5), ease(seg(e, t0(i) + lf, t0(i) + lf + 1.5)));   // waiting for the wash
    else pose = poseMix(i >= 0 ? pd(i) : idle, idle, ease(seg(e, t0(n - 1) + lf, t0(n - 1) + lf + 1.5)));
    // on deck: a boat with a hold has the plant's next tubs set out on its slots (the rest below in the hold); an own boat's tubs are drawn
    // by drawDeck at their places (landOff)
    const deck = [];
    if (!L.own){ const onHook = clamp(Math.floor((e - pr) / lf - 0.37) + 1, 0, n); for (let s = 0; s < slots.length && onHook + s < n; s++) deck.push({L:LD[onHook + s], at:SC ? slotOf(onHook + s) : slots[s]}); }
    KST.liveDeck = deck.some(q => q.L.live && liveAt && q.at === liveAt);
    // the forklift takes lifts 2k and 2k+1 on run k, after the second is down (an own boat's: all of them on one run, and back with the
    // empties); loads wait on the quay until it picks them up
    const back = !!L.own, R = fkRun(P, back, SC ? D : null), runs = back ? 1 : Math.ceil(nOut / 2), last = k => back ? nOut - 1 : Math.min(2 * k + 1, nOut - 1), start = k => t0(last(k)) + hk * lf + 0.1, pickAt = k => start(k) + R.legs[1].t0;
    const quay = []; let fk = {x:R.Wp[0], z:R.Wp[1], h:R.waitH, fl:0, loads:[]};
    for (let j = 0; j < nOut; j++){ const k = back ? 0 : j >> 1; if (e >= t0(j) + hk * lf && e < pickAt(k)) quay.push({L:LD[j], y:quayY(j)}); }
    // the empties: set down at the drop spot by the forklift, until the crane takes each up
    if (back){ const dropT = start(0) + R.legs[6].t0 + R.legs[6].dur; for (let j = nOut; j < n; j++) if (e >= dropT && e < t0(j) + 0.42 * lf) quay.push({L:LD[j], y:quayY(j)}); }
    for (let k = runs - 1; k >= 0; k--){ const t = e - start(k); if (t < 0) continue; if (t >= R.T) break;
      const g = R.legs.find(q => t < q.t0 + q.dur) || R.legs[R.legs.length - 1], w = clamp((t - g.t0) / g.dur, 0, 1), gi = R.legs.indexOf(g), q = legAt(g, w);
      const full = (back ? [...Array(nOut).keys()] : [2 * k, 2 * k + 1].filter(j => j < nOut)).map(j => LD[j]), empt = back ? LD.slice(nOut) : [];
      // loads on the forks: the full ones from the pick to the drop inside, the empties from the pick inside to the drop outside
      const loads = gi >= 1 && gi <= 3 ? full : g.empties && !(g.kind === 'pick' && w < 0.5) && !(g.kind === 'drop' && w > 0.5) ? empt : [];
      const lifted = g.kind === 'pick' ? w : g.kind === 'drop' ? 1 - w : loads.length ? 1 : 0;
      fk = {x:q.x, z:q.z, h:q.h, fl:lifted, loads:loads.map(l => ({mesh:null, draw:l.draw, h:l.h}))};
      break; }
    // the people: stations and jobs
    const hdg = (p, q) => Math.atan2(q[0] - p[0], -(q[1] - p[1])), seaH = Math.atan2(P.n[0], -P.n[1]), tip = tipOf(P, pose);
    // at the unit's stations, clear of the forklift's route: one signals at the edge, one takes the loads, one counts by the door, one
    // works the crane's remote
    const s0 = P.ws.signal, s1 = P.ws.receive, s2 = P.ws.tally, s3 = P.ws.remote;
    const moving = i >= 0 && u > 0 && (u < 0.18 || (u >= 0.42 && u < 0.74)), atQuay = i >= 0 && L.own && LD[i].back ? u >= 0.18 && u < 0.42 : u >= 0.74 && u < 0.93;
    const recv = i >= 0 && u > 0 && atQuay ? (L.own && LD[i].back ? (u < 0.32 ? 'guide' : 'unhook') : u < hk ? 'guide' : 'unhook') : 'look';
    const busy = [{x:s0[0], z:s0[1], h:seaH, task:moving ? 'signal' : 'look'}, {x:s1[0], z:s1[1], h:hdg(s1, D), task:recv}, {x:s2[0], z:s2[1], h:hdg(s2, D), task:'tally'}, {x:s3[0], z:s3[1], h:hdg(s3, [tip[0], tip[2]]), task:'remote'}].map(q => ({...q, walk:false, s:0}));
    // the landing gang at the hatch (H2d2, a freezer vessel's pallets): one in the hatch on the hold's stack at a corner of the opening, who
    // puts the fork under the next pallet and sees it clear of the coaming, one at the coaming's after end signalling to the crane driver,
    // and one on the far side who guides the pallet clear as it comes up; in the boat's frame (x to starboard, z aft), their heading on hers
    let hatch = null; const GH = L.kind === 'pall' ? GEO(vtype()).hatch : null;
    if (GH && GH.size){ const [hx, , hz] = GH.at, dy = GH.deck, w2 = GH.size[0] / 2, l2 = GH.size[1] / 2, busyU = i >= 0 && u > 0 && u < 1;
      const inn = busyU && u >= 0.2 && u < 0.42 ? 'unhook' : busyU && u >= 0.42 && u < 0.52 ? 'guide' : 'look', sig = busyU && u > 0.1 && u < 0.62 ? 'signal' : 'look', gd = busyU && u >= 0.44 && u < 0.62 ? 'guide' : 'look';
      hatch = [{at:[hx - w2 + 0.38, dy - 1.4, hz + l2 - 0.38], h:Math.PI * 0.75, task:inn}, {at:[hx + 0.25, dy, hz + l2 + 0.6], h:0, task:sig}, {at:[hx + w2 + 0.65, dy, hz - 0.2], h:-Math.PI / 2, task:gd}]; }
    // (her own crane: one of the gang drives it from the crane driver's cage amidships forward, facing the hatch)
    // (H3d2: a landing of live crab only, from the tubs by the tanks: the crane driver, and one at the tub who hooks the sling on and sees
    // it clear)
    const liveNow = !!(liveAt && i >= 0 && LD[i] && LD[i].live);
    if (hatch && liveNow) hatch.forEach(q => { q.task = 'look'; });   // (the hatch gang stands by while the tubs go from beside the tanks)
    if (SC && liveAt && (!hatch || liveNow)){ const busyU = i >= 0 && u > 0 && u < 1; hatch = (hatch || []).concat([{at:[liveAt[0] + 0.95, liveAt[1], liveAt[2] + 0.4], h:-Math.PI / 2, task:busyU && u >= 0.18 && u < 0.42 ? 'unhook' : busyU && u >= 0.42 && u < 0.6 ? 'guide' : 'look'}]); }
    if (hatch && SC){ const cz = SC.axis[2] - 3.8, hx = (liveAt && (!GH || liveNow) ? liveAt : VG.hatch.at)[0], hz = (liveAt && (!GH || liveNow) ? liveAt : VG.hatch.at)[2]; const at = VG.snok ? [SC.axis[0] + 1.3, VG.hatch.deck, SC.axis[2] + 1.6] : [0, VG.hatch.deck, cz];   // (the snow crab vessel's crane on its column by the forecastle: driven with the remote from beside it)
      hatch.push({at, h:Math.atan2(hx - at[0], -(hz - at[2])), task:'remote'}); }
    return {e, i, u, pose, hang, att, deck, quay, fk, busy, hatch, ship:!!SC, spose, D, K:from(Math.max(0, i)).w, slewD, tubNow:!!(LD[Math.max(0, i)] || {}).tub, sbd:i >= 0 ? sbd(i) : sbd(0)};
  }
  // walking over when a job moves: a person or the forklift that has to be somewhere else walks (drives) there instead of jumping
  function follow(P, key, st, T, v){
    const m = P.fol || (P.fol = {}), w = m[key];
    if (!w || T - w.T > 1.5 || T < w.T){ m[key] = {x:st.x, z:st.z, T, go:false}; return st; }
    const dt = T - w.T, dx = st.x - w.x, dz = st.z - w.z, d = Math.hypot(dx, dz); w.T = T;
    if (d > 3) w.go = true;
    if (!w.go || d < v * dt + 0.05){ w.x = st.x; w.z = st.z; w.go = false; return st; }
    w.x += dx / d * v * dt; w.z += dz / d * v * dt; return {...st, x:w.x, z:w.z, h:Math.atan2(dx, -dz), task:st.fl !== undefined ? st.task : 'walk', walk:true, s:0};
  }
  function drawPlant(P, eye, VP, T, BMrel){
    nSetup(VP);
    const rel = (x, y, z) => [x - eye[0], y - eye[1], z - eye[2]], night = env.night > 0.3, hr = gDate(S.t / 60).getUTCHours(), LS = landScene(P, T, BMrel, eye), onShift = !!LS || (hr >= 6 && hr < 22);
    P.scene = LS;
    const dt = P.pT ? clamp(T - P.pT, 0, 0.5) : 0; P.pT = T;
    const pose = LS ? LS.pose : craneIdle(P, T), FK = LS ? LS.fk : fkRest(P), U = P.unit, A = unitModel(U.v).A;
    // the roller door (on a sensor) rolls up as the forklift turns in towards it, is open before the forks reach it, and rolls down
    // as it backs out
    const [, fz] = unitL(U, FK.x, FK.z), pz = A.truck.pick[2], az = A.truck.arc[2]; P.doorK = ease(clamp((pz - fz) / (pz - az), 0, 1));
    // the ice chute swings out over the boat's hold while ice runs, and back along the quay after
    const b = S.boat, gt = S.t + currentFrac(), icing = b.iceUntil > gt && b.status === 'port' && b.port === P.id && BMrel, ax = A.silo.axis;
    let chW = P.chRest, iceTo = null;
    if (icing){ const c = xf(BMrel, [0, 0, 0]), C = [c[0] + eye[0], c[2] + eye[2]], fw = [Math.sin(bv.head), -Math.cos(bv.head)], Lb = (VESSELS[vtype()] || {len:6}).len, sw = unitW(U, ax[0], ax[2]);
      const k = clamp((sw[0] - C[0]) * fw[0] + (sw[1] - C[1]) * fw[1], -Lb / 3, Lb / 3); let aim = [C[0] + fw[0] * k, C[1] + fw[1] * k];
      // (F11, OB4: the chute is swung towards the ice box on her deck, where one of the hands takes the ice, deckcrew.js isPlace;
      // before, towards the middle of the boat wherever that was)
      const IB = iceBoxTop(vtype()); iceTo = IB ? xf(BMrel, IB).map((v, i) => v + eye[i]) : null; if (iceTo) aim = [iceTo[0], iceTo[2]];
      const [tx, tz] = unitL(U, aim[0], aim[1]); chW = Math.atan2(tx - ax[0], tz - ax[2]); }
    P.chA = P.chA === undefined ? P.chRest : P.chA + clamp(angDiff(P.chA, chW), -0.35 * dt, 0.35 * dt);
    const r = drawUnitParts(P, eye, pose, FK, P.doorK, P.chA, LS ? T : null);   // (the driver is on the forklift while it works a landing)
    // what hangs from the hook (in the sling, swaying a little), the sling itself through the landing, the loads on deck and on the quay
    const ring = rel(r.tip[0], pose.hook + 0.1, r.tip[2]), sway = Math.sin(T * 1.3) * 0.035;
    if (LS){ KST.shipSling = false; KST.shipFork = false; }   // (only the plant that lands her says what hangs from her crane)
    if (LS && LS.ship){ const tip = SHIPCR.tip, sp = LS.spose, fork = kit('pall', 'gaffel');   // (her own crane's hook: drawShipCrane drew the crane and the block)
      // (a tub of live crab hangs in the four-leg sling on the hook, H3d2; a pallet on the fork)
      if (tip && sp){ const tub = LS.tubNow, ey = sp.hook - (tub ? 0 : SBD), yaw = LS.hang ? LS.hang.yaw : 0;
        if (LS.hang){ const HM = chain(BMrel, M4.T(tip[0], ey - LS.hang.h, tip[2]), M4.RY(yaw)); LS.hang.L.draw(HM); if (tub){ drawSling(xf(BMrel, [tip[0], ey + 0.1, tip[2]]), HM, 0, 1); KST.shipSling = true; } }
        else if (tub){ const R = xf(BMrel, [tip[0], ey + 0.1, tip[2]]); if (LS.att) drawSling(R, LS.att.M, 0, LS.att.k); else drawSling(R, null, T * 0.3, 0); KST.shipSling = true; }
        if (fork && !tub){ drawN(fork, chain(BMrel, M4.T(tip[0], ey, tip[2]), M4.RY(yaw + Math.PI / 2))); KST.shipFork = true; } } }
    else if (LS && LS.hang){ const h = LS.hang.h, t = rel(r.tip[0] + sway * Math.cos(pose.a), pose.hook - 0.1 - h, r.tip[2] - sway * Math.sin(pose.a)), HM = chain(M4.T(t[0], t[1], t[2]), M4.RY(LS.hang.yaw + Math.sin(T * 0.8) * 0.03));
      LS.hang.L.draw(HM); if (LS.hang.L.tub) drawSling([t[0], ring[1], t[2]], HM, 0, 1);
      if (LS.hang.L.pall) drawN(kit('pall', 'gaffel'), chain(M4.T(t[0], t[1] + h, t[2]), M4.RY(LS.hang.yaw + Math.sin(T * 0.8) * 0.03))); }
    else if (LS && LS.att) drawSling(ring, LS.att.M, T * 0.3, LS.att.k);
    else if (LS && b.land.kind === 'pall' && kit('pall', 'gaffel')){ const e = rel(r.tip[0] + sway * Math.cos(pose.a), pose.hook - 0.1, r.tip[2] - sway * Math.sin(pose.a)); drawN(kit('pall', 'gaffel'), chain(M4.T(e[0], e[1], e[2]), M4.RY(pose.a + Math.PI / 2))); }   // (the empty pallet fork on the hook)
    else if (LS) drawSling(ring, null, T * 0.3, 0);
    if (LS){
      for (const q of LS.deck) q.L.draw(chain(BMrel, M4.T(q.at[0], q.at[1], q.at[2]), M4.RY(q.at[3] || 0)));
      for (const q of LS.quay){ const c = rel(LS.D[0], q.y, LS.D[1]); q.L.draw(chain(M4.T(c[0], c[1], c[2]), M4.RY(LS.slewD))); }
    }
    // people: the day shift, or one on watch at night; everyone turns out for a landing
    const R = plantRounds(P); P.spray = 0;
    for (let i = 0; i < 4; i++){ if (!onShift && i !== 3) continue; drawWorker(P, follow(P, 'w' + i, LS ? LS.busy[i] : roundAt(R[i], T + i * 17), T, 1.6), eye, T, i); }
    // the gang at the hatch aboard (landScene hatch, H2d2), where the boat is now
    if (LS && LS.hatch) LS.hatch.forEach((q, k) => { const w = xf(BMrel, q.at), H = P.hgang || (P.hgang = {id:P.id, spray:0, y:0, gy(){ return this.y; }}); H.y = w[1] + eye[1];
      drawWorker(H, {x:w[0] + eye[0], z:w[2] + eye[2], h:bv.head + q.h, task:q.task, walk:false, s:0}, eye, T, 4 + k); });
    // ice from the chute's spout down into the boat
    // (F11, OB4 11.11.2026: on a boat with a deck crew the ice comes through the silo's hose from the spout, and the hand who takes it
    // aboard holds its end over the ice box (deckcrew.js isPlace); it runs once he stands there. Where the hose would have to go through
    // the boat to reach him (the 15 m boat's box is under her shelter deck), or nobody is free to take it, the ice falls from the spout
    // as before, now only down to the first thing of the boat under it, not through it)
    if (icing && Math.abs(angDiff(P.chA, chW)) < 0.15){
      const G = GEO(vtype()), dy = xf(BMrel, [0, (G.deck || {y:G.gw}).y, 0])[1] + eye[1], L = A.silo.chute, O = unitP(U, [ax[0] + Math.sin(P.chA) * L, ax[1] + A.silo.spout, ax[2] + Math.cos(P.chA) * L]);
      const c0 = xf(BMrel, [0, 0, 0]), ch = Math.cos(bv.head), sh = Math.sin(bv.head), dxw = O[0] - c0[0] - eye[0], dzw = O[2] - c0[2] - eye[2], Ob = [dxw * ch + dzw * sh, O[1] - c0[1] - eye[1], -(dxw * sh - dzw * ch)];
      const crewOn = typeof CREW3D !== 'undefined' && CREW3D.on() && CREW3D.setIce, taker = crewOn ? CREW3D.agents().find(a => a.role === 'isrom' && a.goal && a.goal.dyn === 'is') : null, man = taker && taker.mode === 'at' && taker.cell === taker.goal.k ? taker : null;
      let hose = null, from = [O[0] - eye[0], O[1] - eye[1], O[2] - eye[2]], to = null, fall = Math.max(0.5, O[1] - dy);
      if (man && iceTo){ const Fh = [Math.sin(man.h), -Math.cos(man.h)], hb = [man.x + Fh[0] * 0.44, man.y + 0.86, man.z + Fh[1] * 0.44];
        if (Math.hypot(hb[0] - Ob[0], hb[1] - Ob[1], hb[2] - Ob[2]) < 10 && CREW3D.clearLine([Ob[0], Ob[1] - 0.2, Ob[2]], [hb[0], hb[1] + 0.3, hb[2]])) hose = xf(BMrel, hb); }
      if (crewOn) CREW3D.setIce(man ? !!hose : true);
      // (he is waited for eight seconds from when the ice is at the spout; the core's ice runs on its own clock whatever he does)
      if (!P.iceT || T - P.iceS > 1.5) P.iceT = T; P.iceS = T; const late = T - P.iceT > 8;
      KST.iceHose = !!hose; KST.iceWait = !!(taker && !man && !late);
      if (hose){ let p0 = from; const s0 = Math.min(0.6, Math.hypot(hose[0] - from[0], hose[2] - from[2]) * 0.12);
        for (let k = 1; k <= 10; k++){ const q = k / 10, Pq = [from[0] + (hose[0] - from[0]) * q, from[1] + (hose[1] - from[1]) * q - s0 * 4 * q * (1 - q), from[2] + (hose[2] - from[2]) * q]; drawN(PM.fhose, limbM(p0, Pq, 0.055)); p0 = Pq; }
        from = hose; to = [iceTo[0] - eye[0], iceTo[1] - eye[1], iceTo[2] - eye[2]]; fall = Math.max(0.1, from[1] - to[1]); }
      else if (crewOn){ const y = CREW3D.dropY([Ob[0], Ob[1] - 0.2, Ob[2]]); if (y != null) fall = Math.max(0.3, Ob[1] - y); }
      if (!taker || man || late){
        let k = P.spray; const n = hose ? 40 : 70; for (let i = 0; i < n; i++){ const q = (T * 1.6 + i / n) % 1, rr = hose ? 0.05 + 0.05 * q : 0.12 + 0.1 * q;
          PB[k * 3] = from[0] + (to ? (to[0] - from[0]) * q : 0) + (hash(i) - 0.5) * rr; PB[k * 3 + 1] = from[1] - q * q * fall; PB[k * 3 + 2] = from[2] + (to ? (to[2] - from[2]) * q : 0) + (hash(i + 31) - 0.5) * rr; PA[k] = 0.85; k++; }
        P.spray = k; } }
    return {night, spray:P.spray, lamps:P.lamps.map(L => rel(L[0], L[2] - 0.12, L[1]))};
  }
  // the coast's plants (06b-coastports.js) are laid out when the eye comes within 1.5 km and their ground is in (the berths read it)
  const PLANT_TRIED = new Set();
  function plantsCoast(eye){
    for (const U of UNITA){
      if (!U.coastal || U.sted || PLANT_TRIED.has(U.id) || Math.hypot(U.o[0] - eye[0], U.o[1] - eye[2]) > 1500) continue;
      const pt = portById(U.id); if (!pt || !mapReadyAt(pt.p, 0.3)) continue; PLANT_TRIED.add(U.id);
      try { const P = plantLayout(pt); if (!P) continue; PLANTS.push(P); const ry = Math.atan2(U.n[0], U.n[1]);
        for (const [cx, cz, sx, sz, y0, y1] of unitModel(U.v).A.solids){ const c = unitW(U, cx, cz); camSolid(c[0], c[1], sx, sz, ry, y0, y1); } } catch (e){ console.error(e); }
    }
  }
  function nearestPlant(eye){ plantsCoast(eye); let best = null, bd = 900; for (const P of PLANTS){ const d = Math.hypot(P.drop[0] - eye[0], P.drop[1] - eye[2]); if (d < bd){ bd = d; best = P; } } return best; }

  // ---------- work on deck: the bleeding tub and the gutting table on the after deck; whoever works the deck guts or ices there ----------
  let DECKACT = {on:false}, DKGULL = null;   // DKGULL: where the old bait goes over the rail from the stripping (world), for the gulls
  function deckActivity(){
    const b = S.boat; if (!b || b.land || typeof deckHands !== 'function' || !S.hold || !S.hold.length) return {on:false};
    if (!waNow().some(p => p.st === 'sloy' || p.st === 'is') || deckPending() < 0.5) return {on:false};
    // who stands on the deck work (13-work.js workAssign): the skipper when alone or when the work chains put him there, and one of the crew
    // at the tub when they are on it too (tilbakemelding #42: with both on «Sløying» the skipper was left at the wheel while the one hand
    // gutted alone)
    const alone = handsAboard() === 1, WA = !alone && typeof workAssign === 'function' ? waNow().filter(p => p.st === 'sloy' || p.st === 'is') : [];
    return {on:true, alone, me:alone || WA.some(p => !p.c), crew:WA.some(p => p.c), task:catchGut() && S.hold.some(x => !x.gut && !x.iced) ? 'gut' : 'ice'};
  }
  // ---------- the deck kit (the user's wish 19.10.2026, tools/deck/*.py): the fish tubs, the gaff and the knife, the gutting table and
  // bench, the line tubs and the net in its tub, the crates, each a part of its own GLB (src/data/deck-*.b64) drawn like the fish; a part
  // the page does not have leaves the old block in its place ----------
  const KITF = {fish:'deck-fish', rig:'deck-rig', crane:'deck-crane', safe:'deck-safety', anchor:'deck-anchor', pause:'deck-pause', pall:'deck-pall', mob:'deck-mob', upg:'deck-upg'}, KITM = {}, KITX = {};
  function kit(f, nm){ const k = f + ':' + nm; if (k in KITM) return KITM[k]; let m = null; const t = KITF[f];
    if (typeof glbHas === 'function' && glbHas(t)){ const o = glbPart(t, nm); if (o) m = {pb:buf(asF32(o.p)), nb:buf(asF32(o.n)), cb:buf(asF32(o.c)), n:o.p.length / 3}; }
    return KITM[k] = m; }
  function kitX(f){ if (f in KITX) return KITX[f]; const t = KITF[f], G = typeof glbHas === 'function' && glbHas(t) ? glbLoad(t) : null; return KITX[f] = (G && G.ex) || {}; }
  // the knife and the gaff of the tier the boat has (OPP5 of docs/planer/oppgraderinger.md; tools/deck/oppgr.py kniv2, kniv3, hott2, hott3;
  // tier 1 is fisk.py's kniv and hott, and that is what everyone has where the upgrades are not in the page). own: a hand on your own
  // boat (drawWorker's P.bare); the plants' workers keep the plain ones
  const tierKit = (k, nm, own) => { const lv = own && typeof equipLv === 'function' && S.boat ? equipLv(k) : 1; return (lv > 1 && kit('upg', nm + lv)) || kit('fish', nm); };
  const knifeKit = own => tierKit('kniv', 'kniv', own), gaffKit = own => tierKit('hott', 'hott', own);
  // the steel glove of the knife's third tier («sløyekniver i ett stykke og stålhansker»): on the hand that holds the fish while the other
  // cuts (bleeding and gutting), on your own boat
  const GLOVE_T = {gut:1, gutw:1, bleed:1, bleedst:1, cut:1};   // (gutw: the crew's gutting at the table, 20-trawl-seine.js)
  const steelGlove = (st, own) => !!(own && GLOVE_T[st.task] && typeof equipLv === 'function' && S.boat && equipLv('kniv') >= 3);
  // a rigid tool held at A with its head (the part's -z) along dir
  // ---- the hands in their grips (tools/harbour/hender.py): the meshes once for all the figures (the glove is the same on every look),
  // and where each grip holds its thing (the worker GLB's extras 'hands': per grip and side, the point and the axis in the hand's frame) ----
  // (the sides swapped, tilbakemelding #105, 01.11.2026: hender.py builds «the right hand» with its thumb at +x = palm × fingers, which
  // is a left hand: palm down on the rail its thumb pointed out, not in. The GLB's hL_ meshes and grips are the true right hand and the
  // hR_ ones the true left, so they are taken that way round here, and the taped band, made for the hL_ mesh that was the left hand, is
  // mirrored onto the new left (hR_))
  let HANDM = null;
  const mirX = o => { if (!o) return o; const p = o.p.slice(), n = o.n.slice(); for (let i = 0; i < p.length; i += 3){ p[i] = -p[i]; n[i] = -n[i]; } return {p, n, c:o.c}; };
  // (the left hand's own mesh in steel, drawn a little larger over the hand: the mesh glove, steelGlove above)
  const steelOf = o => { if (!o) return null; const c = Float32Array.from(asF32(o.c)); for (let i = 0; i < c.length; i += 3){ const l = 0.62 + 0.5 * (0.3 * c[i] + 0.6 * c[i + 1] + 0.1 * c[i + 2]); c[i] = 0.60 * l; c[i + 1] = 0.63 * l; c[i + 2] = 0.66 * l; } return upA({p:o.p, n:o.n, c}); };
  function handMeshes(){
    if (HANDM !== null) return HANDM; const raw = n => wkPart(n, 'crew'), g = n => { const o = raw(n); return o ? upA(o) : null; }, GR = ['relax', 'flat', 'grip', 'hold', 'pinch', 'hook'];
    const Rm = {}, Lm = {}, St = {}; for (const k of GR){ Rm[k] = g('hL_' + k); Lm[k] = g('hR_' + k); St[k] = steelOf(raw('hR_' + k)); }
    const ex = (glbLoad('worker') || {}).ex || {}, grip = {}; for (const k in ex.hands || {}){ const s = ex.hands[k]; grip[k] = {R:s.L, L:s.R}; }
    return HANDM = Rm.relax && Lm.relax && ex.hands ? {R:Rm, L:Lm, lo:g('hand_lo') || g('hand'), tape:upA(mirX(raw('tape_L'))), steel:St, grip} : false;
  }
  const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], crs3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const nrm3 = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  // a hand's frame [x, y, z]: the fingers along z, the palm toward y, x = y × z (the thumb at -x on the right hand, +x on the left:
  // palm down and the fingers forward, x is the figure's right, so the right thumb points in, as a real hand's; handMeshes).
  // Holding a handle (sp.a, its axis) the fist closes across it: x along the handle, the thumb toward a tool's head (sp.tool) or the
  // palm toward sp.n; otherwise the palm turned toward sp.n, the wrist bending to lay a flat hand flat
  function handFrame(z0, sp, side){
    if (sp.a){ const a = nrm3(sp.a), z = nrm3(sub3(z0, mul3(a, dot3(z0, a)))); let x = a, y = crs3(z, a);
      if (sp.tool ? side > 0 : sp.n && dot3(y, sp.n) < 0){ x = mul3(a, -1); y = mul3(y, -1); } return [x, y, z]; }
    const n = nrm3(sp.n), z = nrm3(sub3(z0, mul3(n, dot3(z0, n) * (sp.g === 'flat' ? 1 : 0.6)))), y = nrm3(sub3(n, mul3(z, dot3(n, z))));
    return [crs3(y, z), y, z]; }
  const inFrame = (Fr, v) => [Fr[0][0] * v[0] + Fr[1][0] * v[1] + Fr[2][0] * v[2], Fr[0][1] * v[0] + Fr[1][1] * v[1] + Fr[2][1] * v[2], Fr[0][2] * v[0] + Fr[1][2] * v[1] + Fr[2][2] * v[2]];
  const handMtx = (Fr, o) => new Float32Array([Fr[0][0], Fr[0][1], Fr[0][2], 0, Fr[1][0], Fr[1][1], Fr[1][2], 0, Fr[2][0], Fr[2][1], Fr[2][2], 0, o[0], o[1], o[2], 1]);
  // what each hand does in each pose: the grip, the way the palm faces (n) or the axis held (a), as directions in the figure's frame
  // (forward, up, right); the knife's way (st.kd) is set here for the props after
  function handSpecs(st, F, R, hands){
    const D = (a, u, r) => [F[0] * a + R[0] * r, u, F[1] * a + R[1] * r], IN = s => D(0.15, -0.35, -s), dn = D(0, -1, 0), up = D(0, 1, 0);
    const rel = (g, n) => ({g, n}), both = (g, n) => [rel(g, n || IN(1)), rel(g, n || IN(-1))], across = () => sub3(hands[0], hands[1]);
    const knife = d => { st.kd = d; return {g:'grip', a:d, tool:true}; };
    if (st.gone) return both('relax');
    switch (st.task){
      case 'cut': return [knife(D(0.2, -1, 0.2)), rel('relax', D(-1, 0.3, 0))];
      case 'slip': return [rel('flat', D(1, -0.5, 0)), rel('flat', D(1, -0.5, 0))];
      case 'door': return [{g:'grip', a:up, n:D(0, 0, -1)}, rel('relax', IN(-1))];
      case 'lean': return [rel('flat', dn), rel('flat', dn)];
      case 'seasick': return [{g:'grip', a:D(0, 0, 1), n:D(0.4, -1, 0)}, {g:'grip', a:D(0, 0, 1), n:D(0.4, -1, 0)}];
      case 'jig': return [rel('hook', D(0, -0.6, -1)), rel('pinch', dn)];
      case 'haul': return [{g:'grip', a:D(0.3, 1, 0), n:IN(1)}, {g:'grip', a:D(0.3, 1, 0), n:IN(-1)}];
      case 'helm': case 'helmsit': case 'drive': return [{g:'grip', a:up, n:D(0.3, 0, -1)}, {g:'grip', a:up, n:D(0.3, 0, 1)}];
      case 'coffee': return [{g:'hold', a:up, n:IN(1)}, rel('relax', IN(-1))];
      case 'phone': return [rel('hold', D(-0.2, 0.6, -1)), rel('hold', D(-0.2, 0.6, 1))];
      case 'binoc': return [rel('hold', D(0, 0, -1)), rel('hold', D(0, 0, 1))];
      case 'smoke': return [rel('pinch', D(-0.5, -0.2, -0.8)), st.lean === false || !st.rail ? rel('relax', IN(-1)) : rel('flat', dn)];
      case 'snus': return [rel('pinch', D(-0.4, 0, -0.9)), rel('hold', up)];
      case 'lunch': return [rel('pinch', D(-0.4, 0, -0.9)), rel('hold', up)];
      case 'sit': return both('relax', dn);
      case 'back': case 'worry': return [rel('relax', D(-1, 0, 0)), rel('relax', D(-1, 0, 0))];
      case 'chat': return hands[0][1] > hands[1][1] + 0.1 ? [rel('relax', D(0.3, 0.8, -0.5)), rel('relax', IN(-1))] : [rel('relax', D(-1, 0, 0)), rel('relax', D(-1, 0, 0))];
      case 'gear': case 'tend': case 'pack': case 'sett': return both('hold', dn);
      case 'knife': return [knife(D(0, 0.15, -1)), {g:'grip', a:st.steel ? st.steel.dir : up, tool:true}];
      case 'sweep': case 'hose': case 'ice': { const a = across(); return [{g:'grip', a, n:IN(1)}, {g:'grip', a, n:IN(-1)}]; }
      case 'coil': return [{g:'hook', a:D(0, 0, 1), n:D(0, -0.5, -1)}, rel('hold', up)];
      case 'stack': case 'carry': case 'stow': return [{g:'hook', a:D(1, 0, 0), n:IN(1)}, {g:'hook', a:D(1, 0, 0), n:IN(-1)}];
      case 'gut': return [knife([F[0] * 0.7 - R[0] * 0.35, -0.55, F[1] * 0.7 - R[1] * 0.35]), rel('hook', dn)];
      case 'bleedst': return [knife([F[0] * 0.5 - R[0] * 0.2, -0.75, F[1] * 0.5 - R[1] * 0.2]), rel('relax', IN(-1))];
      case 'bleed': return [st.knife ? knife([F[0] * 0.7 - R[0] * 0.35, -0.55, F[1] * 0.7 - R[1] * 0.35]) : rel('hook', dn), rel('hook', D(0, -0.6, 1))];
      case 'gutw': return [st.knife ? knife(st.kdir || [F[0] * 0.3 - R[0] * 0.6, -0.55, F[1] * 0.3 - R[1] * 0.6]) : rel('hold', dn), st.gf && st.gf.hang ? rel('hook', D(0, -0.6, 1)) : rel('flat', dn)];
      case 'gaff': return st.gaff ? [{g:'grip', a:st.gaff.n, n:IN(1)}, {g:'grip', a:st.gaff.n, n:IN(-1)}] : both('relax');
      case 'pick': return [rel('pinch', IN(1)), rel('hook', D(0, -0.5, 1))];
      case 'jigup': return [rel('hook', dn), {g:'grip', a:up, n:IN(-1)}];
      case 'egn': case 'strip': case 'tally': return [rel('pinch', IN(1)), rel('hold', up)];
      case 'mend': return [rel('pinch', IN(1)), rel('hook', D(0, -0.5, 1))];
      case 'signal': return [rel('relax', D(1, 0, 0)), rel('relax', IN(-1))];
      case 'guide': return [rel('flat', D(1, 0, 0)), rel('flat', D(1, 0, 0))];
      case 'unhook': return [{g:'grip', a:up, n:IN(1)}, rel('relax', IN(-1))];
      case 'remote': return [rel('hold', D(-0.3, 0.6, -1)), rel('hold', D(-0.3, 0.6, 1))];
      case 'nozzle': return [{g:'grip', a:D(1, -0.5, 0), n:IN(1)}, {g:'grip', a:D(1, -0.5, 0), n:IN(-1)}];
      case 'aurora': return both('relax');
      default: return both('relax');
    }
  }
  function toolM(A, dir){ const l = Math.hypot(dir[0], dir[1], dir[2]) || 1; return limbM(A, [A[0] - dir[0] / l, A[1] - dir[1] / l, A[2] - dir[2] / l], 1); }
  // the catch coming aboard: a jigged fish is taken off at the rail, bled with the knife and tossed into the bleeding tub ('bleed'); on a
  // longline the hand at the hauler takes each fish in over the rail with the gaff and shakes it off into the tub ('gaff'). Each fish is
  // an event at its place on the rail (boat frame); the nearest hand at work there plays it (drawWorker), so the fish he handles is the
  // one that came up. DKBLOOD: the drops of the cut, drawn as points after the people.
  const DKEV = [], DKDUR = {bleed:3.0, gaff:2.4, pick:2.4, jigup:2.2}, DKDROP = {gaff:1.75, pick:2.0}, DKBLOOD = [], DKWATER = [], DKSMOKE = [], DKDECK = [], DKF = {t:0, jig:{}}, DKN = {gaff:0, pick:0, jigup:0, bleed:0};   // DKN: the events played (the tests)
  // a live fish (Jonas 13.11.2026: «fisken som kommer opp spreller litt helt til den er bløgget, snøret dras i litt ulike retninger og
  // fisken plasker litt i vannet når den kommer opp»): bursts of hard kicks with short rests between, each fish out of step with the
  // others (w its own phase), k how much life is left (1 alive, fading to 0 once the throat is cut). [the whole body's sweep, the head's
  // toss, the bend's amplitude at the tail (in the fish's 1 m), its phase, the wave and the stiff head] (the bend: bendOn, LITN_VS uBend in 12-skiff.js; the body
  // swings a little against the tail, as a fish's head does)
  // How each species moves (Jonas 13.11.2026: «bevegelsen kan brukes på andre typer fiskearter også»): [the bend's strength, the wave
  // over the body (radians: about 3.5 for the cod's kind, which swims with the after half, 6 or more for the ling and the tusk, which
  // swim with the whole long body as an eel does), the stiff head (share of the length), the beat's pace]. The redfish is stiff with its
  // spines, the halibuts slap slow and heavy (lying on the blind side the sweep is up and down, as a halibut on deck does). A species not
  // here moves as the cod; the crabs are never bent.
  const SWIM = {torsk:[1, 3.6, 0.22, 1], sei:[0.95, 3.4, 0.25, 1.15], hyse:[0.9, 3.6, 0.22, 1.1], lyr:[0.95, 3.4, 0.24, 1.1], uer:[0.6, 3.0, 0.3, 0.85],
    lange:[1.1, 6.5, 0.08, 0.75], brosme:[1.05, 5.5, 0.1, 0.8], kveite:[1.1, 3.2, 0.25, 0.6], blakveite:[1.0, 3.4, 0.22, 0.7]};
  // each fish its own temper (Jonas: «noen fisk spreller mer enn andre»), from its phase w: how hard it fights (0.3-1.5 of the
  // species'), how long it rests between the bursts and how often they come, and its own pace; a big fish beats slower
  const fh = (w, n) => { const x = Math.sin(w * 12.9898 + n * 78.233) * 43758.5453; return x - Math.floor(x); };
  function flapK(T, w){ const a = 0.9 + 0.9 * fh(w, 1), c = 2.6 + 2.2 * fh(w, 2), r = 0.05 + 0.65 * fh(w, 3);
    return clamp(r + 0.6 * Math.sin(T * a + w * 2.1) + 0.35 * Math.sin(T * c + w * 0.7), 0, 1); }
  function flap(T, w, k, sp, kg){ const Sw = SWIM[sp] || SWIM.torsk, kk = k == null ? 1 : k, b = flapK(T, w) * kk * (0.3 + 1.2 * fh(w, 4)),
      rate = Sw[3] * (0.85 + 0.35 * fh(w, 5)) * Math.pow(clamp((kg || 3) / 3, 0.2, 20), -0.12), ph = T * 15 * rate + w * 5;
    return [-Math.sin(ph) * (0.03 * kk + 0.16 * b) * Sw[0], Math.sin(T * 9.5 * rate + w * 3) * 0.2 * b, kk > 0 ? (0.03 * kk + 0.17 * b) * Sw[0] : 0, ph, Sw[1], Sw[2]]; }
  // where the fish pulls the line on its way up: a slow wander to both sides and a jerk with the kicks (m metres at most, across [x, z])
  function tug(T, w, m){ const j = 0.3 * flapK(T, w) * Math.sin(T * 13 + w * 4); return [m * (0.6 * Math.sin(T * 1.1 + w * 1.9) + j), m * (0.6 * Math.cos(T * 0.8 + w * 2.7) + 0.3 * Math.sin(T * 3.1 + w * 1.3))]; }
  // a fish breaking the surface: a few small drops thrown up where it is (E eye-relative), in the sea's own spray (SD, 24-cinema.js)
  function fishSplash(E, kg, n){ const s = clamp(Math.cbrt(kg || 2) * 0.6, 0.4, 1.4);
    for (let j = 0; j < n; j++){ const i = SD.n = (SD.n + 1) % SDN, a = Math.random() * 6.2832, v = (0.2 + Math.random() * 0.6) * s;
      SD.x[i] = E[0] + lastEye[0] + Math.sin(a) * 0.08; SD.z[i] = E[2] + lastEye[2] + Math.cos(a) * 0.08; SD.y[i] = E[1] + lastEye[1]; SD.vx[i] = Math.sin(a) * v; SD.vz[i] = Math.cos(a) * v;
      SD.vy[i] = (0.7 + Math.random() * 1.3) * s; SD.age[i] = 0; SD.life[i] = 0.35 + Math.random() * 0.4; }
    DKN.fsplash = (DKN.fsplash || 0) + 1; }   // (counted for the tests)
  // the surface by a fish on the line (y in the boat's frame, FS_Y where the lines go into the sea in these drawings): a splash once as it
  // comes out, and now and then while it kicks just at the surface. id: the fish (kept a few seconds to see it cross)
  const FS_Y = -0.3, FSURF = new Map(); FSURF.sl = 0;
  function fishSurf(id, y, E, kg, T, w){ const now = performance.now(), o = FSURF.get(id); FSURF.set(id, {y, t:now});
    if (FSURF.size > 80) for (const [k, v] of FSURF) if (now - v.t > 3000) FSURF.delete(k);
    // (the crossing seen across frames up to 1.5 s apart, a slow tablet included; the kicks at the surface at most one in 0.7 s, whatever the frame rate)
    if (o && now - o.t < 1500 && o.y < FS_Y && y >= FS_Y) fishSplash(E, kg, 12);
    else if (y > FS_Y - 0.25 && y < FS_Y + 0.2 && flapK(T, w) > 0.8 && now - FSURF.sl > 700){ FSURF.sl = now; fishSplash(E, kg, 4); } }
  const ASLIDE = [];   // the autoliner's gaffed fish sliding into the chute's mouth (e.chute, 10-gear.js drawAutoSlides; H2d2)
  // (o: the rest of it: D where it is let fall on the deck, for the one meant to take it, wait how long it may wait for him, t0 a later start)
  function dkEvent(kind, at, sp, kg, o){ const now = performance.now() / 1000; while (DKEV.length && (DKEV.length > 12 || now - DKEV[0].t0 > (DKEV[0].wait || DKDUR[DKEV[0].kind]) + 4)) DKEV.shift(); const e = {kind, at:at.slice(), sp, kg, t0:now, who:null}; if (o) Object.assign(e, o); DKEV.push(e); return e; }
  // which events a hand at his work plays (the agents' tasks, deckcrew.js): the hauler gaffs the fish in, the one at the net picks them out,
  // the jigger hauls them up by hand, the bleeder bleeds; each bleeds his own fish when nobody else is there to do it
  const DKPLAY = {jig:['bleed', 'jigup'], haul:['gaff', 'bleed'], pick:['pick', 'bleed'], bleedst:['bleed']};
  // the event for a hand standing at boat-frame point p doing task (one given to him, else the nearest of its kinds within 3 m; once
  // taken it stays his, and one that waited for him starts when he takes it)
  function dkFor(who, p, task){ const now = performance.now() / 1000, kinds = DKPLAY[task]; if (!kinds) return null;
    let best = null, bd = 3;
    for (const e of DKEV){ if (!kinds.includes(e.kind)) continue; const age = now - e.t0; if (age < 0) continue; if (e.who === who){ if (age <= DKDUR[e.kind]) return e; continue; }
      if (e.who != null || (e.for != null && e.for !== who) || age > (e.wait || DKDUR[e.kind])) continue;
      const d = e.for === who ? -1 : Math.hypot(e.at[0] - p[0], e.at[2] - p[2]); if (d < bd){ bd = d; best = e; } }   // (his own first)
    if (best && !DKEV.some(e => e.who === who && now >= e.t0 && now - e.t0 < DKDUR[e.kind])){ best.who = who; if (best.wait) best.t0 = now; DKN[best.kind]++; return best; } return null; }
  // an event as the hand sees it (eye-relative points): the rail where it came in (or the deck where it lies), the fish down by the hull
  // or in the water, and where it goes (the deck where the hauler shakes it off, else the bleeding tub)
  function dkEv(e, BMrel, G){ const sg = e.at[0] >= 0 ? 1 : -1; return {k:performance.now() / 1000 - e.t0, sp:e.sp, kg:e.kg, deck:!!e.deckF, R:xf(BMrel, e.deckF ? [e.at[0], e.at[1] - 0.06, e.at[2]] : e.at), W:xf(BMrel, e.Wat || [e.at[0] + sg * 0.6, e.at[1] - 1.15, e.at[2]]), U:xf(BMrel, e.D || dkTub(G)), D:e.D ? xf(BMrel, e.D) : null}; }
  // the real catch as it comes aboard (window.CATCHQ: the fishing step, the haul's slices, the rod), the stale left out
  function catchQ(){ const Q = window.CATCHQ || (window.CATCHQ = []), now = performance.now(); while (Q.length && (now - Q[0].t > 15000 || Q.length > 12)) Q.shift(); return Q; }
  // the fish across the deck (deckcrew.js places): when a gaff or a pick lets it fall at the drop, it lies there until the bleeder takes it
  // up (else the one who brought it in, who is then the bleeder); a hand-jigged fish is bled by the one who jigged it
  // a fish still waiting to be taken in or bled (the next one comes when it has been; one nobody took in time is let go)
  const dkWaits = () => { const now = performance.now() / 1000; return DKDECK.length > 0 || DKEV.some(e => e.who == null && (e.kind === 'gaff' || e.kind === 'pick' || (e.kind === 'bleed' && e.deckF)) && now - e.t0 <= (e.wait || DKDUR[e.kind])); };
  function dkTick(){
    const now = performance.now() / 1000;
    for (let i = DKEV.length - 1; i >= 0; i--){ const e = DKEV[i]; if (now - e.t0 > (e.who == null ? e.wait || DKDUR[e.kind] : DKDUR[e.kind]) + 4) DKEV.splice(i, 1); }
    for (const e of DKEV){ if (e.who == null || e.chained) continue; const age = now - e.t0;
      if ((e.kind === 'gaff' || e.kind === 'pick') && e.D && age >= DKDROP[e.kind]){ e.chained = true;
        // (the autoliner's: let fall at the chute, it slides on into its mouth to the bleeding tanks inside, nobody bleeds it in the station)
        if (e.chute){ ASLIDE.push({at:e.D.slice(), to:e.chute.slice(), t:now, sp:e.sp, kg:e.kg, yaw:Math.PI / 2 + (hash(Math.floor(now * 7)) - 0.5) * 0.6}); if (ASLIDE.length > 8) ASLIDE.shift(); continue; }
        const bl = CREW3D.visible().find(a => a.st === 'blogg' && a.mode === 'at'), f = {at:e.D.slice(), sp:e.sp, kg:e.kg, t:now, yaw:hash(Math.floor(now * 7)) * 6.28};
        DKDECK.push(f); dkEvent('bleed', e.D, e.sp, e.kg, {for:bl ? bl.id : e.who, deckF:f, wait:20, t0:now + (bl ? 0.3 : 0.6)}); }
      else if (e.kind === 'jigup' && age >= DKDUR.jigup){ e.chained = true; dkEvent('bleed', e.at, e.sp, e.kg, {for:e.who, wait:12}); }
      else if (e.kind === 'bleed' && e.deckF && age >= 0.3){ e.chained = true; const i = DKDECK.indexOf(e.deckF); if (i >= 0) DKDECK.splice(i, 1); } }
    for (let i = DKDECK.length - 1; i >= 0; i--) if (now - DKDECK[i].t > 24) DKDECK.splice(i, 1);
  }
  // the deck wet where the hose's jet lands (OB14, F12: «vannet synes på dørken»): the spots of the last WET_S seconds in the boat's own
  // frame (she moves under them), each on the first of her under the jet (the deck, the table, a tub; a jet over the side leaves none),
  // the water running out from it and thinning as it goes. Drawn with the jet's points (DKWATER), on her own boat only.
  const DKWET = [], WET_S = 14; let DKBM = null;
  function dkWet(bp, hr){ const now = performance.now() / 1000; if (DKWET.length && now - DKWET[DKWET.length - 1].t < 0.35) return;
    const x = bp[0] + Math.sin(hr) * 1.35, z = bp[2] - Math.cos(hr) * 1.35, fy = typeof CREW3D !== 'undefined' && CREW3D.dropY ? CREW3D.dropY([x, bp[1] + 1.1, z]) : bp[1];
    if (fy == null || fy < bp[1] - 0.25) return; DKWET.push({x, y:fy, z, t:now}); if (DKWET.length > 40) DKWET.shift(); }
  // (straight into the point buffers, nothing made a frame)
  function dkWetDraw(VP){ if (!DKWET.length || !DKBM) return false; const now = performance.now() / 1000; while (DKWET.length && now - DKWET[0].t > WET_S) DKWET.shift(); let n = 0;
    for (let i = 0; i < DKWET.length; i++){ const w = DKWET[i], u = (now - w.t) / WET_S, s0 = Math.floor(w.t * 97) % 1000, al = 0.5 * (1 - u) * (1 - u), m = DKBM;
      for (let j = 0; j < 6; j++){ const a = hash(s0 + j * 3) * 6.283, r = (0.08 + 0.6 * u) * (0.35 + 0.65 * hash(s0 + j * 7 + 1)), x = w.x + Math.cos(a) * r, y = w.y + 0.03, z = w.z + Math.sin(a) * r;
        PB[n * 3] = m[0] * x + m[4] * y + m[8] * z + m[12]; PB[n * 3 + 1] = m[1] * x + m[5] * y + m[9] * z + m[13]; PB[n * 3 + 2] = m[2] * x + m[6] * y + m[10] * z + m[14]; PA[n] = al; n++; } }
    if (n) drawPts(n, gl.POINTS, VP, [0.7, 0.8, 0.9], 30, true, null, 16); return n > 0; }
  function dkBloodDraw(VP){
    // the blood of the bleeding, the water of the deck hose and the smoke of a cigarette (drawWorker), as points after the people
    // (the water on the deck first and small, a glint of the sky in it; the jet over it)
    const wet = dkWetDraw(VP);
    const pts = (L, col, sz) => { if (!L.length) return; let n = 0; for (const q of L){ if (n >= 300) break; PB[n * 3] = q[0]; PB[n * 3 + 1] = q[1]; PB[n * 3 + 2] = q[2]; PA[n] = q[3] == null ? 1 : q[3]; n++; } L.length = 0; drawPts(n, gl.POINTS, VP, col, sz, true); };
    if (!DKBLOOD.length && !DKWATER.length && !DKSMOKE.length){ if (wet) nSetup(VP); return; }
    pts(DKBLOOD, [0.42, 0.02, 0.03], 60); pts(DKWATER, [0.8, 0.88, 0.95], 70); pts(DKSMOKE, [0.78, 0.78, 0.76], 34); nSetup(VP); }
  // the gear as it lies on deck (the user's wish 19.10.2026, tools/deck/rigg.py): the nets heaped in a 1000 l tub as high as the share
  // of them aboard; the line coiled in its tubs, side by side, the hooks hung on the rim while it is baited; the old box and tubs where
  // the kit is not in the page
  // where the rig's tubs stand: the model's places (kit.garn, kit.stamps), the hand boats' stack, or by the rail aft
  function rigAt(G, kind, d){ const K = G.kit && G.kit[kind === 'garn' ? 'garn' : 'stamps']; if (K) return {at:K.at, ry:K.ry || 0};
    const sx = G.beam / 2, DZ = d.z - 0.6; return G.hand && SKA.stack ? {at:[SKA.stack[0] + (kind === 'garn' ? 0.1 : 0), d.y, SKA.stack[2]], ry:0} : {at:[sx * (kind === 'garn' ? 0.3 : 0.25), d.y, DZ], ry:0}; }
  // the nets in a blue 460 l tub (tools/deck/rigg.py): the heap sinks as the nets go out and rises as they come in, mounded over the rim
  // when it is full, with the bights of net hanging over the rim then (garn_kant, not scaled)
  // (s: the model's net tub smaller than the 460 l one where the floor has no room for it, kit.garn.s; the wooden boat's, OB1)
  function drawNetTub(BMrel, at, fill, ry){ const sc = (((GEO(vtype()) || {}).kit || {}).garn || {}).s || 1, T = kit('fish', 'kar460b') || kit('fish', 'kar460'), N = kit('rig', 'garn'), NK = kit('rig', 'garn_kant'), M = chain(BMrel, M4.T(at[0], at[1], at[2]), M4.RY(ry || 0), M4.S(sc));
    if (T && N){ drawN(T, M); if (fill > 0.02) drawN(N, chain(M, M4.S(1, 0.25 + 0.75 * fill, 1))); if (NK && fill > 0.95) drawN(NK, M); return; }   // (over 1: more than the tub holds, heaped higher)
    drawN(GB.bin, chain(M, M4.S(1, 0.3 + 0.7 * fill, 1))); }
  // the line tubs (tools/deck/rigg.py): two across and up to four along from the place, each with its coil, the baited ones with the hooks
  // hung round the rim
  // fill: what each tub has on its rim while the crew work them (1 the hooks all baited, 0 none, between the baited hooks one by one)
  // (F8, OB3: every tub aboard stands on deck, a layer at the place and the rest stacked on it as tubs are stacked, four high at most;
  // a tub with one on top of it shows no hooks on its rim. fill -1: an empty tub, its line is in the sea)
  function drawLineTubs(BMrel, at, n, baited, green, ry, fill){ const M0 = chain(BMrel, M4.T(at[0], at[1], at[2]), M4.RY(ry || 0));
    const nMax = (VESSELS[vtype()] || {len:10}).len < 8 ? 4 : 8;   // (four fit between the thwarts of the small open boats)
    // (OB5: a model with room for only so many on the deck, kit.stamps.n, has the rest stacked on them, as tubs are stacked: the skiff's two along her)
    const KS = ((GEO(vtype()) || {}).kit || {}).stamps, per = KS && KS.n ? KS.n : nMax, nd = Math.min(per * 4, n); KST.stamps = nd;
    for (let i = 0; i < nd; i++){
      if (!kit('rig', 'stamp')){ if (i < nMax) drawN(GB.tub, chain(M0, M4.T(-(i % 2) * 0.6, Math.floor(i / 2) * 0.33, (Math.floor(i / 2) % 2) * 0.1))); continue; }
      const j = i % per, f = fill && fill[i] != null ? fill[i] : i < baited ? 1 : 0;
      drawTub1(chain(M0, M4.T((j % 2) * 0.52, Math.floor(i / per) * 0.38, Math.floor(j / 2) * 0.5), M4.RY(hash(i * 3 + 1) * 6.28)), f, green, i + per >= nd); } }
  // one line tub at M: its coil (not an empty one's), and with nothing on top of it the hooks hung round the rim (all baited: the
  // model's ring of them, else the baited ones one by one)
  function drawTub1(M, f, green, top){ const T = kit('rig', 'stamp'), Lr = kit('rig', green ? 'line_g' : 'line_r'), K = kit('rig', 'kroker'), HX = (kitX('rig').hooks) || {n:30, r:0.2238, y:0.38, a0:-75, a1:75};
    if (!T){ drawN(GB.tub, M); return; } drawN(T, M); if (f < 0) return; if (Lr) drawN(Lr, M); if (!top) return;
    if (K && f >= 0.999) drawN(K, M);
    else if (f > 0 && GB.bait){ const m = Math.round(f * HX.n); if (!BITM.length) for (let j = 0; j < HX.n; j++){ const a = (HX.a0 + (HX.a1 - HX.a0) * j / Math.max(1, HX.n - 1)) * DEG; BITM.push(chain(M4.T(Math.cos(a) * HX.r, HX.y + 0.012, -Math.sin(a) * HX.r), M4.RY(a), M4.S(1.3))); }
      for (let j = 0; j < m && j < BITM.length; j++) drawN(GB.bait, chain(M, BITM[j])); } }
  // the two tubs on the line setter's magazine (OPP5, tier 2; deck-upg mag: the roller table's ends in from the rail, its top under the
  // rail's top), in the frame of the place over the stern; null where it does not stand
  function magTubs(BMrel, G){ const P = G.kit && G.kit.setter, X = kitX('upg').mag; if (!P || !X || !X.at || typeof CREW3D === 'undefined' || !CREW3D.magOn()) return null;
    const M = chain(BMrel, M4.T(P[0], P[1], P[2]), M4.RY(P[3] || 0)); return [chain(M, M4.T(0, X.top, -(X.at[0] + 0.27))), chain(M, M4.T(0, X.top, -(X.at[1] - 0.27)))]; }
  // the line tubs aboard as a list of what each holds (1 baited, 0 coiled, -1 empty), drawn: the first two on the magazine where it
  // stands, one at the stern by the one setting (at: deckcrew.js setPlan's tub), the rest at the rig's place
  function drawTubList(BMrel, G, d, F, at){ const MT = magTubs(BMrel, G) || []; let i = 0;
    for (const M of MT){ if (i >= F.length) break; drawTub1(M, F[i++], false, true); }
    if (at && i < F.length) drawTub1(chain(BMrel, M4.T(at[0], at[1], at[2])), F[i++], false, true);
    const R = rigAt(G, 'line', d), rest = F.slice(i); KST.stamps = 0; if (rest.length) drawLineTubs(BMrel, R.at, rest.length, 0, false, R.ry, rest); KST.stampsAll = F.length; }
  // the empty tubs of the lines that lie in the sea (they stay aboard until the line is hauled back into them)
  const tubsOut = () => (typeof mySets === 'function' ? mySets() : []).filter(x => x.kind === 'line' && !(typeof isAuto === 'function' && isAuto(x.lk))).reduce((a, x) => a + (x.n || 0), 0);
  // while a line is set or hauled (core/10-gear.js: the tubs of the string left the count aboard when the set began): setting, the tub
  // the line runs from first, then those still to go, the rest of the line aboard, and the empty ones; hauling, the tubs filled, the
  // empty ones waiting, and the rest
  function drawLineOp(BMrel, G, d, g){ const L = (S.pgear || {}).lines || {}, rest = (L.hyse ? L.hyse.n : 0) + (L.bank ? L.bank.n : 0), bt = (L.hyse ? L.hyse.baited : 0) + (L.bank ? L.bank.baited : 0), F = [];
    const out = Math.max(0, tubsOut() - (g.op === 'haul' ? g.n : 0)), PN = g.op === 'set' && !G.hand && typeof CREW3D !== 'undefined' && CREW3D.on() ? CREW3D.setPlan('line') : null;
    if (g.op === 'set'){ for (let i = g.done; i < g.n; i++) F.push(1); for (let i = 0; i < rest; i++) F.push(i < bt ? 1 : 0); for (let i = 0; i < g.done + out; i++) F.push(-1); }
    else { for (let i = 0; i < g.done; i++) F.push(0); for (let i = 0; i < rest; i++) F.push(i < bt ? 1 : 0); for (let i = g.done; i < g.n + out; i++) F.push(-1); }
    if (G.hand){ const R = rigAt(G, 'line', d), n = g.op === 'haul' ? g.done : g.n - g.done; drawLineTubs(BMrel, R.at, n, g.op === 'set' ? n : 0, false, R.ry); return; }   // (the boats worked by hand as before: OB1, OB5)
    drawTubList(BMrel, G, d, F, PN && PN.tub); }
  // ---- the nets aboard (F8, OB3): NET_TUB to a tub, the tubs where the deck has room for them (deckcrew.js netTubs), the first ones
  // full and the last with what is left; what the tubs do not hold is heaped on the last
  // (how many: deckcrew.js rigGear, the same count the walking map takes the tubs out by)
  function netsAboard(g){ const R = typeof CREW3D !== 'undefined' ? CREW3D.gear() : null; if (R) return R.netN || 0;
    const pg = S.pgear || {}; return (pg.nets || []).reduce((a, l) => a + (l.n || 1), 0) + (g && g.kind === 'garn' ? (g.op === 'set' ? g.n - g.done : g.done) : 0); }
  function netTubsNow(G, d, n){ const on = !G.hand && typeof CREW3D !== 'undefined' && CREW3D.on(), NT = on ? CREW3D.NET_TUB : 12, R = rigAt(G, 'garn', d);
    const P = on && G.kit && G.kit.garn ? CREW3D.netTubs(n) : [[R.at[0], R.at[1], R.at[2], R.ry]], F = P.map((q, i) => i < P.length - 1 ? clamp((n - i * NT) / NT, 0, 1) : clamp((n - i * NT) / NT, 0, 1.7));
    return {P, F}; }
  // the tub the net runs from while it is set: the last one with nets in it
  function netFrom(G, d, g){ const T = netTubsNow(G, d, netsAboard(g)); let k = 0; for (let i = 0; i < T.F.length; i++) if (T.F[i] > 0.02) k = i; return T.P[k]; }
  function drawNets(BMrel, G, d, n){ const T = netTubsNow(G, d, n); KST.netTubs = T.P.length; T.P.forEach((q, i) => drawNetTub(BMrel, q, T.F[i], q[3])); }
  // (a boat worked by hand keeps her one tub by the share of the string in it, OB1)
  function drawNetsOp(BMrel, G, d, g){ if (G.hand){ const n = g.op === 'haul' ? g.done : g.n - g.done, R = rigAt(G, 'garn', d); drawNetTub(BMrel, R.at, clamp(n / Math.max(1, g.n), 0, 1), R.ry); return; } drawNets(BMrel, G, d, netsAboard(g)); }
  const BITM = [];   // the baited hooks on a tub's rim, in the tub's frame (made once)
  // the tubs of a crew job on the line (baiting or stripping) as the job has come: the ones in work in front of those doing them (a batch at a
  // time, one to each), then the ones done, then those waiting
  function jobTubs(j){ const jn = Math.max(1, j.n || 1), X = (typeof jobDone === 'function' ? jobDone(j) : 0) * jn, k = Math.max(1, Math.min(jn, CREW3D.agents().filter(a => a.jw === j && a.mode === 'at').length)), bd = Math.min(jn, Math.floor(X / k) * k), cur = Math.min(k, jn - bd), fr = X / k - Math.floor(X / k), F = [];
    for (let i = 0; i < cur; i++) F.push(fr); for (let i = 0; i < bd; i++) F.push(1); while (F.length < jn) F.push(0); return j.kind === 'strip' ? F.map(v => 1 - v) : F; }
  // a string of nets being mended: spread from its tub over the rail before each one mending, the floats along the rail and the meshes
  // hanging down outside, with the netting needle at work (drawWorker 'mend')
  function drawMendNet(BMrel, G, d, R){
    const gw = G.gw || d.y + 0.9, railH = clamp(gw - d.y, 0.6, 1.1), top = [R.at[0], R.at[1] + 0.7, R.at[2]], seg = (A, B, r, m) => drawN(m, chain(BMrel, limbM(A, B, r)));
    for (const a of CREW3D.agents()){ if (a.st !== 'mend' || a.mode !== 'at') continue;
      const F0 = [Math.sin(a.h), -Math.cos(a.h)], R0 = [Math.cos(a.h), Math.sin(a.h)], rp = [a.x + F0[0] * 0.5, a.y + railH + 0.02, a.z + F0[1] * 0.5], P = (u, dn, out) => [rp[0] + R0[0] * u + F0[0] * out, rp[1] - dn, rp[2] + R0[1] * u + F0[1] * out];
      // from the tub to the rail, then the floats along the rail and the meshes over it, down the outside
      for (const u of [-0.45, 0, 0.45]) seg([top[0] + R0[0] * u * 0.4, top[1], top[2] + R0[1] * u * 0.4], P(u, 0, -0.05), 0.006, GB.net);
      seg(P(-0.65, 0, 0.02), P(0.65, 0, 0.02), 0.012, GB.float);
      for (let k = 0; k <= 12; k++){ const u = -0.6 + k * 0.1; seg(P(u, 0, 0.02), P(u + (k % 2 ? 0.02 : -0.02), 0.45, 0.1), 0.007, GB.net); seg(P(u + (k % 2 ? 0.02 : -0.02), 0.45, 0.1), P(u, 0.85, 0.16), 0.007, GB.net); }
      for (const dn of [0.22, 0.45, 0.66]) seg(P(-0.6, dn, 0.02 + dn * 0.17), P(0.6, dn, 0.02 + dn * 0.17), 0.007, GB.net);
      seg(P(-0.62, 0.86, 0.16), P(0.62, 0.86, 0.16), 0.009, GB.net); }
  }
  // the gear aboard when the boat is rigged for it and not working it: the nets left aboard, the line tubs aboard (core/10-gear.js)
  // (and the crew's jobs on it, core/13-work.js: the tubs being baited or stripped stay on deck and show the job's progress, the nets being
  // mended stay in their tub and are spread over the rail where they are mended; Jonas 20.10.2026)
  function drawRigRest(BMrel, G, d){
    const b = S.boat, rig = typeof rigOf === 'function' ? rigOf() : b.rig, sx = G.beam / 2, DZ = d.z - 0.6, K = G.kit || {};
    KST.pots = 0; if (b.gop && b.status === 'fishing') return; if (!GB) buildGear();
    if (rig === 'teiner') KST.pots = drawPotsAboard(BMrel, G, d, potsAboard());
    const J = (S.jobs || []).filter(j => !j.shop), EJ = J.filter(j => j.kind === 'egn' || j.kind === 'strip'), MJ = J.find(j => j.kind === 'mend'), pg = S.pgear || {};
    if (rig === 'garn' || MJ){ const mend = MJ ? (pg.shore || []).find(x => x.kind === 'mendself' && x.lenke && x.lenke.id === MJ.nid) : null, aboard = (pg.nets || []).reduce((a, l) => a + (l.n || 1), 0) + (mend ? mend.lenke.n || 1 : 0);
      const out = (typeof mySets === 'function' ? mySets() : []).filter(x => x.kind === 'garn').reduce((a, x) => a + (x.n || 0), 0), R = rigAt(G, 'garn', d);
      // (F8, OB3: a boat with a crew has the nets in as many tubs as they fill; a boat worked by hand her one tub by the share aboard)
      if (aboard + out > 0){ if (G.hand) drawNetTub(BMrel, R.at, aboard / (aboard + out), R.ry); else drawNets(BMrel, G, d, netsAboard(null)); } if (MJ) drawMendNet(BMrel, G, d, R); }
    if (rig === 'line' || EJ.length){ const L = pg.lines || {}, n = rig === 'line' ? (L.hyse ? L.hyse.n : 0) + (L.bank ? L.bank.n : 0) : 0, bt = rig === 'line' ? (L.hyse ? L.hyse.baited : 0) + (L.bank ? L.bank.baited : 0) : 0;
      // the job's tubs first (they are off the line aboard while it runs, pg.shore 'egnself' and 'stripself', 10-gear.js), then the rest
      const fill = []; for (const j of EJ) fill.push(...jobTubs(j)); for (let i = 0; i < n; i++) fill.push(i < bt ? 1 : 0);
      // (OB3: the empty tubs of the lines in the sea stay aboard; with the setter's magazine the first two tubs stand on it, unless they are worked)
      if (rig === 'line' && !G.hand) for (let i = tubsOut(); i > 0; i--) fill.push(-1);
      const R = rigAt(G, 'line', d); if (fill.length){ if (G.hand || EJ.length) drawLineTubs(BMrel, R.at, fill.length, 0, false, R.ry, fill); else drawTubList(BMrel, G, d, fill, null); } }
  }
  // ---- the kit on the model's places (G.kit, from the boat's model; tools/deck): the life-saving gear the rules ask for (V.lsa,
  // 02-species-gear.js lsaOf), the radar that is bought, the freight on deck in crates and the crane. Nothing is drawn where the
  // model has no places or the kit is not in the page.
  const RAFTSZ = c => c <= 4 ? 4 : c <= 6 ? 6 : 12, RADS = {a:0, t:0}, BOYEQ = {}, BOYET = {k:'', top:null, bot:null, cv:null};
  const KST = {raft:0, buoys:0, text:0, smoke:0, mob:0, ladder:0, radar:0, cargo:0, crane:null, tubs:0, htub:0, pots:0, stern:null, gaff:null, vt:null, n:0};   // what the last frame drew of the kit, for which boat, and how many frames (the tests read it)
  // the buoy's lettering: the boat's name over the ring and her home port under it, in black block capitals (§ 43)
  function boyeCanvas(txt){
    // (1024 × 116: the strip's own shape on the ring, 0.57 m of arc by 0.065 m, so the letters are not stretched)
    const cv = BOYET.cv || (BOYET.cv = document.createElement('canvas')); cv.width = 1024; cv.height = 116; const g = cv.getContext('2d'); g.clearRect(0, 0, 1024, 116);
    g.fillStyle = '#121212'; g.textAlign = 'center'; g.textBaseline = 'middle'; let fs = 88; const f = () => { g.font = '800 ' + fs + 'px "Arial Narrow", Arial, sans-serif'; }; f();
    while (g.measureText(txt).width > 960 && fs > 24){ fs -= 4; f(); } g.fillText(txt, 512, 62); return cv;
  }
  function boyeTex(){
    const nm = String(S.boatName || '').toUpperCase().slice(0, 22), hp = portById(S.home || HOME0), pn = hp ? String(hp.name).toUpperCase().slice(0, 22) : '', k = nm + '|' + pn; if (!nm) return null;
    if (BOYET.k !== k){ BOYET.k = k; if (!BOYET.top){ BOYET.top = mkTex(); BOYET.bot = mkTex(); } upTex(BOYET.top, boyeCanvas(nm)); upTex(BOYET.bot, boyeCanvas(pn)); }
    return BOYET;
  }
  // the ladder's pieces as one mesh: two stiles along each centre line, w apart across a, and the rungs at their heights
  const LADM = {};
  function ladderMesh(L){
    const b = VB(), STL = VC.steel || [0.74, 0.76, 0.78, 0.9];
    for (const q of L){ const a = q.a, h = q.w / 2, off = (p, sg) => [p[0] + a[0] * h * sg, p[1] + a[1] * h * sg, p[2] + a[2] * h * sg];
      for (const sg of [-1, 1]) b.tube(q.c.map(p => off(p, sg)), 0.016, STL, 6);
      for (const y of q.r || []) for (let i = 0; i + 1 < q.c.length; i++){ const A = q.c[i], B = q.c[i + 1]; if ((y - A[1]) * (y - B[1]) > 0 || A[1] === B[1]) continue;
        const f = (y - A[1]) / (B[1] - A[1]), P = [A[0] + (B[0] - A[0]) * f, y, A[2] + (B[2] - A[2]) * f]; b.tube([off(P, -1), off(P, 1)], 0.013, STL, 6); break; } }
    return b.p.length ? upA(b) : null;
  }
  function boyeQ(){ if (!('q' in BOYEQ)){ const X = kitX('safe'), mk = st => st && st.length > 1 ? texStrip(st.map(p => p[0]), st.map(p => p[1])) : null; BOYEQ.q = [mk(X.boye_strip_top), mk(X.boye_strip_bot)]; } return BOYEQ.q; }
  function drawSafety(BMrel, G, VP, t){
    const K = G.kit; if (!K) return; const V = VESSELS[vtype()], L = V && V.lsa, X = kitX('safe'), b = S.boat, eq = S.equip || {};
    // the raft in its cradle with the hydrostatic release, the smallest size for everyone aboard (§ 38)
    if (L && L.rafts && K.raft){ const z = RAFTSZ(L.cap), R = kit('safe', 'flate' + z), C = kit('safe', 'vugge' + z), fa = (X.flate_at || {})[z] || [0, 0.07, 0];
      for (const q of K.raft.slice(0, L.rafts)){ const M = chain(BMrel, M4.T(q[0], q[1], q[2]), M4.RY(q[3] || 0)); if (C) drawN(C, M); if (R){ drawN(R, chain(M, M4.T(fa[0], fa[1], fa[2]))); KST.raft++; } } }
    // the buoys on their brackets, the first with the light and the line (§ 43: half with a light, one or two with 30 m of line); from 15 m
    // the first one or two with the MOB light with smoke on its bracket beside the holder instead of the buoy light (§ 7-10, Ø11.5: the
    // smoke canister's line runs to the buoy's grab line; sikker.py mobroyk_holder is the holder's place from the canister's)
    const BM = [];
    if (L && K.buoys){ const H = kit('safe', 'boyeholder'), B = kit('safe', 'livboye'), LT = kit('safe', 'boyelys'), LN = kit('safe', 'boyeline'), MR = kit('safe', 'mobroyk'), at = X.boye_at || [0, -0.3, 0.05], mh = X.mobroyk_holder || [-0.55, -0.15, 0];
      K.buoys.slice(0, L.buoys).forEach((q, i) => { const M = chain(BMrel, M4.T(q[0], q[1], q[2]), M4.RY(q[3] || 0)), MB = chain(M, M4.T(at[0], at[1], at[2]));
        if (H) drawN(H, M); if (B){ drawN(B, MB); BM.push(MB); KST.buoys++; }
        if (MR && i < (L.smoke || 0)){ drawN(MR, chain(M, M4.T(-mh[0], -mh[1], -mh[2]))); KST.smoke++; } else if (LT && i < L.lights) drawN(LT, chain(M, M4.T(0.42, 0.04, 0)));
        if (LN && i < L.lines) drawN(LN, chain(M, M4.T(-0.44, 0, 0))); }); }
    // the rescue boat from 45 m (§ 7-5; tools/deck/mob.py, Ø11.5) at kit.mob [x, y, z, ry, s] (the cradle's base on deck): the boat in its
    // cradle under its cover with the lashings and the sling, and the davit beside her with the arm stowed over her and the hook in the
    // sling's master link. s = -1 stands the davit on the other side of the cradle, turned round, so her bow is forward on either side
    // of the ship. The davit stands still; swinging her out is Ø11.6
    if (L && L.mob && K.mob){ const q = K.mob, XM = kitX('mob'), M = chain(BMrel, M4.T(q[0], q[1], q[2]), M4.RY(q[3] || 0)), ba = XM.boat_at || [0, 0.45, 0], MB = chain(M, M4.T(ba[0], ba[1], ba[2]));
      let n = 0; for (const nm of ['mob_boat', 'mob_tarp', 'mob_sling']){ const m = kit('mob', nm); if (m){ drawN(m, MB); n++; } }
      for (const nm of ['mob_vugge', 'mob_lash']){ const m = kit('mob', nm); if (m){ drawN(m, M); n++; } }
      // dz moves the davit along the ship (clear of what stands there); the arm slews about the column so the hook still points at the
      // sling's master link (short of it by reach - hypot(reach, dz), 3.5 cm at dz 0.35)
      const s = q[4] || 1, dz = q[5] || 0, da = XM.davit_at || [1.75, 0, 0.4], MD = s < 0 ? chain(M, M4.T(-da[0], da[1], da[2] + dz), M4.RY(Math.PI)) : chain(M, M4.T(da[0], da[1], da[2] + dz));
      const MA = dz ? chain(MD, M4.RY(Math.atan2(-dz * s, XM.reach || 1.75))) : MD, DV = kit('mob', 'mob_davit'), AR = kit('mob', 'mob_arm');
      if (DV){ drawN(DV, MD); n++; } if (AR){ drawN(AR, MA); n++; }
      const ha = XM.hook_at || [-1.75, 3.174, 0], hd = XM.head_at || [-1.75, 3.474, 0], HK = kit('mob', 'mob_hook'), FL = kit('mob', 'mob_fall');
      if (HK) drawN(HK, chain(MA, M4.T(ha[0], ha[1], ha[2]))); if (FL) drawN(FL, limbM(xf(MA, hd), xf(MA, ha), 1)); KST.mob = n; }
    // the ladder aft where the model lacks it or it is too short for § 63 (vessel3d.js LADDERS): stainless tube, built once a type
    if (K.ladder){ const m = LADM[vtype()] || (LADM[vtype()] = ladderMesh(K.ladder)); if (m){ drawN(m, BMrel); KST.ladder = K.ladder.length; } }
    // the radar that is bought: a dome on the roof or in the mast, or the open array on the mast that turns at 24 rpm while she is out
    // (where the model gives both the same place, the open array stands there when she has both)
    const on = b.status !== 'port' && !b.land; if (on) RADS.a = (RADS.a + Math.max(0, Math.min(0.2, t - RADS.t)) * 2.5) % (Math.PI * 2); RADS.t = t;
    const shared = K.radar && K.radarA && Math.hypot(K.radar[0] - K.radarA[0], K.radar[1] - K.radarA[1], K.radar[2] - K.radarA[2]) < 0.4;
    if (K.radar && eq.radar && !(shared && eq.radarA)){ const D = kit('safe', 'radome'); if (D){ drawN(D, chain(BMrel, M4.T(K.radar[0], K.radar[1] + liftY('radar'), K.radar[2]))); KST.radar = 1; } }
    if (K.radarA && eq.radarA){ const P = kit('safe', 'radar_ped'), A = kit('safe', 'radar_bar4'), ba = X.bar_at || [0, 0.38, 0], M = chain(BMrel, M4.T(K.radarA[0], K.radarA[1] + liftY('radarA'), K.radarA[2]));
      if (P) drawN(P, M); if (A){ drawN(A, chain(M, M4.T(ba[0], ba[1], ba[2]), M4.RY(RADS.a))); KST.radar = 2; } }
    if (BM.length){ const T = boyeTex(), q = boyeQ(); if (T && q[0]){ gl.disableVertexAttribArray(2); for (const M of BM){ drawTexQuad(q[0], T.top, M, VP, true, [0, 0.2, 0]); if (q[1]) drawTexQuad(q[1], T.bot, M, VP, true, [0, 0.2, 0]); KST.text++; } nSetup(VP); } }
  }
  // the freight on deck (S.cargo up to the boat's deckCargo, the deck first: 09g-turer.js): a pallet with a wooden crate for each 250 kg at
  // the model's cargo places, then a small crate on top of each
  function cargoUnits(G){ const K = G.kit; if (!K || !K.cargo || !K.cargo.length || typeof cargoKg !== 'function') return 0; const kg = Math.min(cargoKg(), BOAT.deckCargo || 0); return kg > 0 ? Math.min(K.cargo.length * 2, Math.ceil(kg / 250)) : 0; }
  function drawCargo(BMrel, G, hide){
    const K = G.kit, n = cargoUnits(G) - (hide || 0); if (n <= 0) return; KST.cargo = n; const P = kit('rig', 'pall'), C = kit('rig', 'kasse'), CS = kit('rig', 'kasse_s'), m = K.cargo.length;
    for (let i = 0; i < n; i++){ const q = K.cargo[i % m], M = chain(BMrel, M4.T(q[0], q[1], q[2]), M4.RY(q[3] || 0));
      if (i < m){ if (P) drawN(P, M); if (C) drawN(C, chain(M, M4.T(0, 0.144, 0))); } else if (CS) drawN(CS, chain(M, M4.T(0, 0.944, 0), M4.RY((hash(i * 5) - 0.5) * 0.3))); }
  }
  // the knuckle-boom crane (V.crane tonnes; tools/deck/kran.py): base, slewing column, main and outer boom, two telescopes, the two
  // cylinders between their eyes and the hook on its wire. Folded at sea; at the quay, while freight goes on or off (a 'last' job,
  // 09g-turer.js cargoJob), it unfolds and works a 40 s round: over a cargo place, the hook down and up, swing out over the quay
  // (the side she lies to it with), down and up, and back; the crate rides the hook from the quay (loading) or to it (landing). Every
  // joint moves at its own rate, so it folds and unfolds as a real one does.
  const CRN = {p:null, t:0};
  // a pose from the model (ext is each telescope's slide, e both together; wire the hook's drop under the tip) and the fold limit: with
  // the main boom low the outer one may not close so far that it goes through the column (a2_min, [a1, lowest a2])
  const crPose = (X, k) => { const p = X[k] || {}; return {sl:0, a1:p.a1 || 0, a2:p.a2 || 0, e:2 * (p.ext || 0), w:p.wire || 0.12}; };
  const crA2min = (X, a1) => { const T = X.a2_min; if (!T || !T.length) return -Math.PI; if (a1 <= T[0][0]) return T[0][1]; for (let i = 1; i < T.length; i++) if (a1 <= T[i][0]) return T[i - 1][1] + (T[i][1] - T[i - 1][1]) * (a1 - T[i - 1][0]) / (T[i][0] - T[i - 1][0]); return T[T.length - 1][1]; };
  function crFrames(X, Q, BMrel, p){
    const s = Q.s || 1, ca = X.col_at || [0, 0.35, 0], b1 = X.b1_at || [0, 1.0, 0], b2 = X.b2_at || [0, 0, -2.4], ea = X.ext_at || [0, 0, -1.6], e2a = X.ext2_at || [0, 0, -0.3], half = p.e / 2;
    const M0 = chain(BMrel, M4.T(Q.at[0], Q.at[1], Q.at[2]), M4.RY(Q.ry || 0), M4.S(s)), MC = chain(M0, M4.T(ca[0], ca[1], ca[2]), M4.RY(p.sl)), M1 = chain(MC, M4.T(b1[0], b1[1], b1[2]), M4.RX(p.a1));
    const M2 = chain(M1, M4.T(b2[0], b2[1], b2[2]), M4.RX(p.a2)), E1 = chain(M2, M4.T(ea[0], ea[1], ea[2] - half)), E2 = chain(E1, M4.T(e2a[0], e2a[1], e2a[2] - half));
    // the knuckle link (a rocker on the main boom and a push link to the outer boom's heel): its angles against the knuckle's, from the
    // model's table (klink: [a2, l1, l2]), so the outer boom folds right back along the main one as a real crane's does
    const lk = crLink(X, p.a2), L1 = lk && X.q1 ? chain(M1, M4.T(X.q1[0], X.q1[1], X.q1[2]), M4.RX(lk[0])) : null, L2 = lk && X.q2 ? chain(M2, M4.T(X.q2[0], X.q2[1], X.q2[2]), M4.RX(lk[1])) : null;
    return {s, M0, MC, M1, M2, E1, E2, L1, L2, tip:xf(E2, X.tip || [0, 0, -1.8])};
  }
  function crLink(X, a2){ const T = X.klink; if (!T || !T.length) return null; if (a2 <= T[0][0]) return [T[0][1], T[0][2]];
    for (let i = 1; i < T.length; i++) if (a2 <= T[i][0]){ const u = (a2 - T[i - 1][0]) / (T[i][0] - T[i - 1][0]); return [T[i - 1][1] + (T[i][1] - T[i - 1][1]) * u, T[i - 1][2] + (T[i][2] - T[i - 1][2]) * u]; }
    const L = T[T.length - 1]; return [L[1], L[2]]; }
  function drawCrane(BMrel, G, VP, t, d){
    const K = G.kit, V = VESSELS[vtype()]; if (!K || !K.crane || !V || !(V.crane > 0)) return;
    const X = kitX('crane'), mB = kit('crane', 'base'), mC = kit('crane', 'col'), m1 = kit('crane', 'b1'), m2 = kit('crane', 'b2'); if (!mB || !mC || !m1 || !m2) return;
    const Q = K.crane, b = S.boat, dt = Math.max(0, Math.min(0.2, t - CRN.t)); CRN.t = t;
    const job = b.status === 'port' && !b.land && S.jobs && S.jobs.find(j => j.kind === 'last' && j.until != null && j.until > S.t), loading = job && /^Lasting/.test(job.no || '');
    // parked on its rest where the boat has room for one under the parked boom (the model's rest_at, from the foot), else folded up tight
    // as cranes are packed on boats and lorries (Jonas 20.10.2026, with a photo)
    const restW = Q.rest && X.park && X.rest_at ? [Q.at[0] + (Math.sin(Q.ry || 0) * X.rest_at[2]) * (Q.s || 1), Q.at[1], Q.at[2] + Math.cos(Q.ry || 0) * X.rest_at[2] * (Q.s || 1)] : null;
    const parked = !!(restW && Math.hypot(restW[0] - Q.rest[0], restW[2] - Q.rest[2]) < 0.6);
    const stow = crPose(X, parked ? 'park' : 'stow'), work = crPose(X, 'work'), emax = 2 * (X.ext_max || 1.5);
    let tgt = stow, ph = -1, u = 0, at = null;
    if (job){
      // where the hook must go: a cargo place, or 2.5 m out over the quay on the starboard side, level with the crane
      const cp = K.cargo && K.cargo.length ? K.cargo[(Math.floor(t / 40)) % Math.min(K.cargo.length, Math.max(1, cargoUnits(G)))] : [Q.at[0] - 1.2, d.y, Q.at[2] + 2], qy = (G.gw || d.y + 0.9) + 0.6;
      u = (t % 40) / 40; ph = u < 0.2 ? 0 : u < 0.3 ? 1 : u < 0.4 ? 2 : u < 0.65 ? 3 : u < 0.75 ? 4 : u < 0.85 ? 5 : 6;
      // (F22, OB4: the quay is on the side she lies to it with, 07-harbours.js berthSide, not always to starboard)
      at = ph <= 2 || ph === 6 ? [cp[0], cp[1] + 0.95, cp[2]] : [(typeof berthSide === 'function' ? berthSide(vtype()) : 1) * (G.beam / 2 + 2.5), qy, Q.at[2]];
      // the slew to the point and the telescopes out to its distance (the tip moves along the outer boom as they slide)
      const dx = at[0] - Q.at[0], dz = at[2] - Q.at[2], sl = Math.atan2(-dx, -dz) - (Q.ry || 0), D = Math.hypot(dx, dz) / (Q.s || 1);
      const r0 = Math.hypot(...[0, 2].map(i => crFrames(X, Q, M4.T(0, 0, 0), {sl:0, a1:work.a1, a2:work.a2, e:0}).tip[i] - Q.at[i])) / (Q.s || 1);
      const r1 = Math.hypot(...[0, 2].map(i => crFrames(X, Q, M4.T(0, 0, 0), {sl:0, a1:work.a1, a2:work.a2, e:emax}).tip[i] - Q.at[i])) / (Q.s || 1);
      tgt = {sl, a1:work.a1, a2:work.a2, e:clamp(r1 > r0 + 1e-3 ? (D - r0) / (r1 - r0) * emax : 0, 0, emax)};
    }
    const p = CRN.p || (CRN.p = Object.assign({}, stow)), go = (k, to, r) => { const v = to - p[k], w = k === 'sl' ? Math.atan2(Math.sin(v), Math.cos(v)) : v; p[k] += Math.sign(w) * Math.min(Math.abs(w), r * dt); }, step = (k, r) => go(k, tgt[k], r);
    // the knuckle opens and closes with the main boom held up at the model's fold_a1, and the main boom goes down to the stow with the
    // knuckle shut (the drawings' transport position: the main boom lowered forward from the column, the outer boom folded back under it)
    const fa = !parked && X.fold_a1 != null ? X.fold_a1 : null, knuckle = r => { if (p.a1 < fa - 0.01) go('a1', fa, 0.25); else step('a2', r); };
    // folding: the telescopes in first, then the slew home, then the booms; unfolding the other way round (the makers' manual)
    const folding = tgt === stow;
    if (folding){ step('e', 0.45); if (p.e < 0.05){ step('sl', 0.3); if (Math.abs(Math.atan2(Math.sin(p.sl - tgt.sl), Math.cos(p.sl - tgt.sl))) < 0.05){
      if (fa == null){ step('a2', 0.35); step('a1', 0.25); } else if (Math.abs(p.a2 - tgt.a2) > 0.02) knuckle(0.35); else { step('a2', 0.35); step('a1', 0.25); } } } }
    else if (fa == null){ step('a1', 0.25); step('a2', 0.35); if (Math.abs(p.a2 - tgt.a2) < 0.3){ step('sl', 0.3); step('e', 0.45); } }
    else if (Math.abs(p.a2 - tgt.a2) > 0.02) knuckle(0.35);
    else { step('a2', 0.35); step('a1', 0.25); if (Math.abs(p.a1 - tgt.a1) < 0.3){ step('sl', 0.3); step('e', 0.45); } }
    p.a2 = Math.max(p.a2, crA2min(X, p.a1));
    const F = crFrames(X, Q, BMrel, p), S1 = M4.S(F.s); KST.crane = {sl:p.sl, a1:p.a1, a2:p.a2, e:p.e, job:!!job, tip:F.tip.slice()};
    drawN(mB, F.M0); drawN(mC, F.MC); drawN(m1, F.M1); drawN(m2, F.M2);
    const e1 = kit('crane', 'ext1'), e2 = kit('crane', 'ext2'), k1 = kit('crane', 'link1'), k2 = kit('crane', 'link2'); if (e1) drawN(e1, F.E1); if (e2) drawN(e2, F.E2);
    if (k1 && F.L1) drawN(k1, F.L1); if (k2 && F.L2) drawN(k2, F.L2);
    // the cylinders between their eyes: the barrel from its base eye, the rod from the far eye back into it
    for (const [nb, nr, fa, ka, fb, kb] of [['cyl1b', 'cyl1r', F.MC, 'c1_a', F.M1, 'c1_b'], ['cyl2b', 'cyl2r', F.M1, 'c2_a', X.c2_b_in === 'link1' ? F.L1 : F.M2, 'c2_b']]){
      const cb = kit('crane', nb), cr = kit('crane', nr); if (!cb || !cr || !fb || !X[ka] || !X[kb]) continue; const A = xf(fa, X[ka]), B = xf(fb, X[kb]), v = [B[0] - A[0], B[1] - A[1], B[2] - A[2]];
      drawN(cb, chain(toolM(A, v), S1)); drawN(cr, chain(toolM(B, v), S1)); }
    // the hook on its wire: short and made fast at sea, paid out to the deck or the quay in the round
    // (F23, OB4: unf, the crane stands unfolded in its working pose: the hook hangs on its working wire from then on, and what it has
    // lifted hangs in it through the swing too; before, the crate was drawn only while the crane stood still over the place, so it
    // was gone from the hook all the way between the deck and the quay)
    const H = kit('crane', 'hook'), tip = F.tip, near = !job || Math.hypot(p.sl - tgt.sl, p.e - tgt.e) > 0.15, unf = !!job && Math.abs(p.a2 - tgt.a2) < 0.3 && Math.abs(p.a1 - tgt.a1) < 0.3;
    KST.crane.unf = unf;   // (for the recordings, tests/ombord.py: the pictures of the crane's work wait until it stands unfolded)
    if (typeof CREW3D !== 'undefined' && CREW3D.setCrane) CREW3D.setCrane(unf ? {u, loading:!!loading} : null);
    let hy = tip[1] - (unf ? work.w * 0.3 : stow.w) * F.s;
    if (job && !near && at){ const goal = xf(BMrel, at)[1] + 0.35 * F.s, wv = ph === 1 || ph === 4 ? Math.sin(((ph === 1 ? u - 0.2 : u - 0.65) / 0.1) * Math.PI) : 0; const h0 = tip[1] - work.w * 0.3 * F.s; hy = h0 - (h0 - goal) * wv; }
    const at0 = (y) => { const m = F.MC.slice(); m[12] = tip[0]; m[13] = y; m[14] = tip[2]; return m; };   // (the column's turn and the boat's heading, at a point)
    drawN(PM.wire, limbM([tip[0], tip[1], tip[2]], [tip[0], hy, tip[2]], 0.012)); if (H) drawN(H, at0(hy));
    // the crate on the hook: from the quay to the deck when loading, from the deck to the quay when landing
    const carry = unf && (loading ? u >= 0.7 || u < 0.25 : u >= 0.25 && u < 0.7), C = kit('rig', 'kasse'); KST.craneCarry = !!carry;
    if (carry && C){ const hl = (X.hook_h || 0.35) * F.s; drawN(C, chain(at0(hy - hl - 0.8), M4.S(1 / F.s))); }
    // the boom rest stands where the parked crane's outer boom comes down (the model's rest_at, from the crane's foot)
    if (parked){ const R = kit('crane', 'rest'); if (R) drawN(R, chain(F.M0, M4.T(X.rest_at[0], X.rest_at[1], X.rest_at[2]))); }
    return carry;
  }
  // ---------- the fish tubs on an open boat's deck (core/07f-kar.js, docs/planer/fiskekar-dekk.md, Jonas 04.11.2026) ----------
  // The tubs are the boat's hold: each 460 l tub (tools/deck/fisk.py kar460) holds TUB_KG, and the gutted fish fill them in turn, one fish
  // at a time from the bottom up, laid where tubPack says (lengthwise and crosswise in turn, never through a wall). The fish under the top
  // two layers are covered by them and not drawn. The iced fish have lumps of crushed ice on them (isbit), and a tub that is all iced has
  // the crushed ice over its top with the top fish half in it (is). The blood and the slime (kar460_blod1-3) come as the tub fills; a
  // tub back from the plant is washed. The same drawing serves the tubs on deck, on the crane's hook, on the quay and on the forklift.
  const KARPLAN = {}, KARIN = 0.022;
  const karDims = () => (kitX('fish').tubs || {}).kar460 || {rim:0.74, floor:0.14, in_top:[0.86, 1.06], in_floor:[0.8137, 1.0137]};
  const SCL = (x, y, z) => new Float32Array([x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1]);
  // the plan of a tub (key: its boat and place, or a landing's load): made again when it was emptied or a species of a tenth or more of it
  // is not in the plan (the shares of the whole catch, so the tubs are alike)
  function karPlan(key, spec, kg, dims){
    const P = KARPLAN[key], has = P && Object.keys(spec).every(k => spec[k] < 0.1 * (kg || 1) || P.sps.includes(k));
    if (P && has && !(kg < 0.5 && P.kg >= 0.5)){ P.kg = kg; return P.plan; }
    let h = 7; for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
    const sps = Object.keys(spec).filter(k => spec[k] > 0), plan = tubPack(dims || karDims(), spec, (h % 997) + 1);
    KARPLAN[key] = {plan, sps, kg}; return plan;
  }
  // the share of each species in the whole catch in the tubs (the spec for a plan)
  function karSpec(){ const o = {}; for (const x of S.hold || []) if (inTub(x)) o[x.sp] = (o[x.sp] || 0) + x.kg; if (!Object.keys(o).length) o.torsk = 1; return o; }
  // a tub with its load at M (the tub's frame on deck: the base's centre): load {kg, iced} or null (empty); key: the plan's
  function drawKarLoad(M, load, key, washed){
    const T = kit('fish', 'kar460'); if (!T) return false; drawN(T, M);
    const kg = load ? load.kg : 0, f = kg / TUB_KG;
    if (!washed) for (const [k, at] of [[1, 0.015], [2, 0.3], [3, 0.65]]){ const B = f > at ? kit('fish', 'kar460_blod' + k) : null; if (B) drawN(B, M); }
    if (kg < 0.5 || !SK || !SK.fishM) return true;
    const plan = karPlan(key, karSpec(), kg), n = tubShown(plan, kg); if (!n) return true;
    const D = karDims(), top = plan[n - 1].y, nIce = Math.round(n * clamp((load.iced || 0) / Math.max(1e-6, kg), 0, 1)), BIT = kit('fish', 'isbit');
    for (let i = 0; i < n; i++){ const q = plan[i]; if (q.y < top - 0.17) continue;
      const lie = fishLie(q.sp), up = (q.sp === 'kveite' || q.sp === 'blakveite') ? 1 : (hash(i * 11 + 3) > 0.5 ? 1 : -1);
      drawN(fishOf(q.sp), chain(M, M4.T(q.x, q.y, q.z), M4.RY(q.yaw + (q.flip ? Math.PI : 0)), M4.RZ(up * Math.PI / 2), M4.S(q.s)));
      // the lumps of ice on an iced fish, along its back (inside its footprint)
      if (BIT && i < nIce && q.y > top - 0.09) for (const a of [-0.22, 0.18]){ const c = Math.cos(q.yaw), sn = Math.sin(q.yaw), u = a * q.s;
        drawN(BIT, chain(M, M4.T(q.x + sn * u, q.y + lie[1] * q.s * 0.5 + 0.004, q.z + c * u), M4.RY(hash(i * 5 + a * 10) * 6.28), M4.S(Math.min(0.85, lie[0] * q.s * 6)))); } }
    // full and all of it iced: the crushed ice over the top, the top fish lying in it (scaled to the inside at its height, a margin from the wall)
    const IS = kit('fish', 'is');
    if (IS && kg >= 0.9 * TUB_KG && nIce >= n){ const y0 = top - 0.075, w = karIn(D, y0); drawN(IS, chain(M, M4.T(0, y0, 0), SCL(2 * w[0] - 2 * KARIN, 1, 2 * w[1] - 2 * KARIN))); }
    return true;
  }
  // the tub places an open boat has now (GEO(vt).kit.tubs, the first BOAT.karN of them): {at, ry}
  function karPlaces(vt){ const G = GEO(vt), K = G && G.kit && G.kit.tubs; if (!K || !(VESSELS[vt] || {}).kar) return [];
    const n = vt === S.boat.type && BOAT.karN ? BOAT.karN : karN(vt, 0); return K.slice(0, n).map(q => ({at:[q[0], q[1], q[2]], ry:q[3] || 0})); }
  // the tubs on deck with what is in them (skip: the places whose tub is off the deck now, at a landing)
  // (washed: the tubs set back aboard washed at a landing; the catch is in the hold until the landing note, but not in them)
  function drawCatchTubs(BMrel, vt, skip, washed){
    const P = karPlaces(vt); if (!P.length) return 0; const T = tubLoads(S.hold, P.length); let n = 0;
    P.forEach((q, i) => { if (skip && skip.has(i)) return; const w = !!(washed && washed.has(i)); if (drawKarLoad(chain(BMrel, M4.T(q.at[0], q.at[1], q.at[2]), M4.RY(q.ry)), w ? null : T[i], vt + ':' + i, w)) n++; });
    return n;
  }
  // the heap's top in a tub (the tub's frame), where a packed fish lands
  function karTop(vt, i){ const T = tubLoads(S.hold, karPlaces(vt).length)[i], D = karDims(); if (!T || T.kg < 0.5) return D.floor + 0.05;
    const plan = karPlan(vt + ':' + i, karSpec(), T.kg), n = tubShown(plan, T.kg); return n ? plan[n - 1].y + 0.06 : D.floor + 0.05; }
  // the tub being filled now (the first not full), for the packer
  function karFilling(vt){ const T = tubLoads(S.hold, karPlaces(vt).length); for (let i = 0; i < T.length; i++) if (T[i].kg < TUB_KG - 0.5) return i; return T.length - 1; }
  // ---- the ice box (tools/deck/fisk.py iskasse, the 300 l tub in blue): it stands on deck at its place (the model's kit.iskasse, under
  // the gutting board on the open boats; on a boat with a hold by the packer's place), the crushed ice in it as high as the ice aboard,
  // and the shovel stands in it when nobody is icing (Jonas 04.11.2026: «Det kan ikke bare dukke opp en kasse med is fra løse luften») ----
  function iceBoxAt(vt){ const G = GEO(vt), K = G && G.kit && G.kit.iskasse; if (K) return {at:[K[0], K[1], K[2]], ry:K[3] || 0, s:K[4] || 1};
    const PT = typeof deckPoints === 'function' ? deckPoints(vt) : null, M = PT && PT.is && typeof deckMap === 'function' ? deckMap(vt) : null;
    if (!M) return null; const p = M.at(PT.is.k), h = PT.is.h || 0, F = [Math.sin(h), -Math.cos(h)], R = [Math.cos(h), Math.sin(h)];
    return {at:[p[0] - R[0] * 0.62 + F[0] * 0.1, p[1], p[2] - R[1] * 0.62 + F[1] * 0.1], ry:-h, s:0.75}; }
  // the ice's top in the box, in the boat's frame (where the shovel takes it)
  function iceBoxTop(vt){ const B = iceBoxAt(vt); if (!B) return null; const D = (kitX('fish').tubs || {}).iskasse || {rim:0.66, floor:0.14}, f = clamp((S.boat.ice || 0) / Math.max(1, BOAT.iceCap || 1), 0, 1);
    return [B.at[0], B.at[1] + (D.floor + f * (D.rim - D.floor - 0.09) + 0.02) * B.s, B.at[2]]; }
  // someone has the shovel in his hands (packing on the deck), so it is not in the ice box
  const packingNow = () => !!(typeof CREW3D !== 'undefined' && CREW3D.on() && CREW3D.agents().some(a => a.st === 'is' && a.mode === 'at')) || !!(DECKACT && DECKACT.on && DECKACT.task === 'ice');
  function drawIceBox(BMrel, vt, shovelIn){
    const B = iceBoxAt(vt), K = kit('fish', 'iskasse'); if (!B || !K) return null; const M = chain(BMrel, M4.T(B.at[0], B.at[1], B.at[2]), M4.RY(B.ry), M4.S(B.s)); drawN(K, M);
    const D = (kitX('fish').tubs || {}).iskasse || {rim:0.66, floor:0.14, in_top:[0.6, 0.96], in_floor:[0.5607, 0.9207]}, f = clamp((S.boat.ice || 0) / Math.max(1, BOAT.iceCap || 1), 0, 1), IS = kit('fish', 'is');
    const y = D.floor + f * (D.rim - D.floor - 0.09), w = karIn(D, y);
    if (IS && f > 0.01) drawN(IS, chain(M, M4.T(0, y - 0.03, 0), SCL(2 * w[0] - 0.03, 1, 2 * w[1] - 0.03)));
    // the shovel left in the ice: the blade down in it toward the far end, the shaft leaning on the near rim
    if (shovelIn){ const SP = kit('fish', 'spade'), SH = kit('fish', 'spade_skaft'); if (SP && SH){ const bl = [0, y + 0.02, -0.18], gr = [0.12, D.rim + 0.62, 0.48];
      const BM = chain(M, M4.T(bl[0], bl[1], bl[2]), M4.RX(-0.35)); drawN(SP, BM); drawN(SH, chain(M, shaftM(gr, [bl[0], bl[1] + 0.03, bl[2] + 0.02]))); } }
    return {M, top:[B.at[0], B.at[1] + (y + 0.05) * B.s, B.at[2]]};
  }
  // a frame along a line: local -z from A toward B with its length (the shovel's shaft, from the grip to the socket), y as near up as it can be
  function shaftM(A, B){ const d = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], L = Math.hypot(d[0], d[1], d[2]) || 1e-6, z = d.map(v => -v / L), up = Math.abs(z[1]) > 0.95 ? [1, 0, 0] : [0, 1, 0];
    let x = [up[1] * z[2] - up[2] * z[1], up[2] * z[0] - up[0] * z[2], up[0] * z[1] - up[1] * z[0]]; const xl = Math.hypot(x[0], x[1], x[2]) || 1; x = x.map(v => v / xl);
    const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
    return new Float32Array([x[0], x[1], x[2], 0, y[0], y[1], y[2], 0, z[0] * L, z[1] * L, z[2] * L, 0, A[0], A[1], A[2], 1]); }
  // ---- the sling (tools/deck/fisk.py slynge_*): the master link on the crane's hook at H (eye-relative, its top), a strap from the ring
  // under it to each corner of the tub at M (a tub's frame), a hook under the rim there; with no tub the legs hang from the ring ----
  function drawSling(H, M, swing, k){
    const R = kit('fish', 'slynge_ring'), LG = kit('fish', 'slynge_ben'), HK = kit('fish', 'slynge_krok'), X = kitX('fish').sling; if (!R || !LG || !HK || !X) return;
    drawN(R, M4.T(H[0], H[1], H[2])); const J = [H[0] + X.join[0], H[1] + X.join[1], H[2] + X.join[2]];
    const leg = (A, B, rad) => { const d = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], L = Math.hypot(d[0], d[1], d[2]) || 1e-6, u = d.map(v => v / L);
      // the strap's width across the leg and level, its face toward the tub (rad: the corner's way out from the tub's middle)
      let w = [u[1] * rad[2] - u[2] * rad[1], u[2] * rad[0] - u[0] * rad[2], u[0] * rad[1] - u[1] * rad[0]]; const wl = Math.hypot(w[0], w[1], w[2]) || 1; w = w.map(v => v / wl);
      const nx = [w[1] * u[2] - w[2] * u[1], w[2] * u[0] - w[0] * u[2], w[0] * u[1] - w[1] * u[0]];
      drawN(LG, new Float32Array([nx[0], nx[1], nx[2], 0, -u[0] * L, -u[1] * L, -u[2] * L, 0, w[0], w[1], w[2], 0, A[0], A[1], A[2], 1])); };
    const kk = k == null ? 1 : k;
    for (let c4 = 0; c4 < 4; c4++){
      // hanging free from the ring, or on the tub's corner (kk: how far the hand has drawn the hook out to it)
      const a = c4 * Math.PI / 2 + Math.PI / 4 + (swing || 0); let rad = [Math.cos(a), 0, Math.sin(a)], P = [J[0] + rad[0] * 0.09, J[1] - 1.05, J[2] + rad[2] * 0.09];
      if (M && kk > 0){ const q = X.lift[c4], C = xf(M, q), c = xf(M, [0, q[1], 0]), rc = [C[0] - c[0], 0, C[2] - c[2]], e2 = ease(kk);
        P = [P[0] + (C[0] - P[0]) * e2, P[1] + (C[1] - P[1]) * e2 + Math.sin(Math.PI * e2) * 0.12, P[2] + (C[2] - P[2]) * e2]; rad = [rad[0] + (rc[0] - rad[0]) * e2, 0, rad[2] + (rc[2] - rad[2]) * e2]; }
      leg(J, P, rad); const yaw = Math.atan2(rad[0], rad[2]);
      // the hook: its throat (X.throat in its frame, facing -z) under the rim at the corner, turned to face the tub's middle
      const Mh = chain(M4.T(P[0], P[1], P[2]), M4.RY(yaw), M4.T(-X.throat[0], -X.throat[1], -X.throat[2])); drawN(HK, Mh); }
  }
  // ---- the bleeding tub (Jonas 04.11.2026: «se at blodet og fisken fyller karet på en ordentlig måte»): the 300 l tub at the model's
  // work.tub (its scale s and turn ry), sea water reddened by the blood in it, and the bled fish waiting for the knife lying in it as
  // tubPack lays them (in the tub's inside at its size, so none goes through a wall), as many as the kilos waiting fill it toward
  // BOAT.tubCap, half under the bloody water that rises with them ----
  function drawBleedTub(BMrel, W, d, ux, uz, KT, KW){
    const s = W && W.s || 1, ry = W && W.ry || 0, M0 = chain(BMrel, M4.T(ux, d.y, uz), M4.RY(ry)); drawN(KT, chain(M0, M4.S(s)));
    const D0 = (kitX('fish').tubs || {}).kar300 || {rim:0.66, floor:0.14, in_top:[0.6, 0.96], in_floor:[0.5607, 0.9207]};
    const D = {rim:D0.rim * s, floor:D0.floor * s, in_top:D0.in_top.map(v => v * s), in_floor:D0.in_floor.map(v => v * s)};
    const wait = x => !x.gut && !x.iced && !(SPECIES[x.sp] || {}).live, spec = {}; let kg = 0;
    for (const x of S.hold || []) if (wait(x)){ spec[x.sp] = (spec[x.sp] || 0) + x.kg; kg += x.kg; }
    const f = clamp(kg / Math.max(20, BOAT.tubCap || 60), 0, 1);
    let top = D.floor, n = 0, plan = null;
    if (kg >= 0.5 && SK && SK.fishM){ plan = karPlan('blod:' + vtype(), Object.keys(spec).length ? spec : {torsk:1}, kg, D); n = Math.max(1, Math.ceil(plan.length * f - 1e-9)); n = Math.min(n, plan.length);
      for (let i = 0; i < n; i++){ const q = plan[i]; if (q.y < (plan[n - 1].y - 0.14)) continue; const up = hash(i * 11 + 7) > 0.5 ? 1 : -1;
        drawN(fishOf(q.sp), chain(M0, M4.T(q.x, q.y, q.z), M4.RY(q.yaw + (q.flip ? Math.PI : 0)), M4.RZ(up * Math.PI / 2), M4.S(q.s))); }
      if (n) top = plan[n - 1].y; }
    // the water: a third of the tub when it is empty, rising as the fish fill it, but under the top fish so they lie half in it
    if (KW){ const y = n ? Math.max(D.floor + 0.04, Math.min(D.floor + (D.rim - D.floor) * (0.35 + 0.4 * f), top + 0.005)) : D.floor + (D.rim - D.floor) * 0.35, w = karIn(D, y);
      drawN(KW, chain(M0, M4.T(0, y, 0), SCL(2 * w[0] - 0.04, 1, 2 * w[1] - 0.04))); }
    return top;
  }
  // the bleeding tub's top in the boat frame (where the fish are tossed)
  function dkTub(G){ const W = G.work || null, d = G.deck || {y:G.gw, z:2}, Bm = G.beam; return [W ? W.tub[0] : Bm / 2 - 0.62, d.y + 0.62, W ? W.tub[2] : d.z + 0.35]; }
  function drawDeck(BMrel, eye, VP, t, DK){
    const vt = vtype(), G = GEO(vt), d = G.deck || {y:G.gw, z:2}, Bm = G.beam, b = S.boat; DK.pt = null;
    // the fish tubs and the ice box stand on deck through a landing too (the tubs on the crane's hook or ashore are the landing's)
    nSetup(VP); KST.tubs = drawCatchTubs(BMrel, vt, b.land && PLANTS.length ? landOff(b.land) : null, b.land ? landBack(b.land) : null); KST.icebox = !!drawIceBox(BMrel, vt, !packingNow()) ? 1 : 0;
    // (OB10 runde 4, 12.11.2026: through a landing the kit stays on deck, the crane stowed, the bench, the bleeding tub and the life
    // buoys; before, all of it went away while she landed, and from above only the crew and the plant's tubs were left. The plant's tubs
    // are set down clear of all of it, deckcrew.js landSlots with fixedBoxes)
    if (b.status === 'aground') return;
    // (only where the plant's tubs have places clear of the kit: a boat with no deck crew, or none found, sets them on the old fixed
    // square, through the bench and the bleeding tub, and the kit stays out of the way as before; found in the review)
    if (b.land && !b.land.own && b.land.kind === 'tub' && !(typeof CREW3D !== 'undefined' && CREW3D.on() && CREW3D.landSlots().length)) return;
    // where they stand: by the beam on the after deck, or where a detailed model says (the starter boat has a seat and a bench aft)
    const W = G.work || null, tx = W ? W.table[0] : -(Bm / 2 - 0.42), ux = W ? W.tub[0] : Bm / 2 - 0.62, tz = W ? W.table[2] : d.z, uz = W ? W.tub[2] : d.z + 0.35;
    // a model with its own gutting table (work.own, the old wooden boat's across the gunwale) has it drawn already, the fish on its top;
    // else the kit's table: the plastic one on the small boats, the steel bench with its chute from 10 m (tools/deck/fisk.py)
    const own = !!(W && W.own), V = VESSELS[vt], big = !!(V && V.len >= 10), KT = kit('fish', 'kar300'), KW = kit('fish', 'vann'), KB = own ? null : kit('fish', big ? 'benk' : 'bord'), XF = kitX('fish');
    const tSide = tx < 0 ? 1 : -1, kTop = XF[big ? 'benk_top' : 'bord_top'], topY = own && W.top != null ? W.top + 0.02 : KB && kTop != null ? d.y + kTop + 0.02 : d.y + 0.885;
    const potRig = b.rig === 'teiner' && !(typeof deckPending === 'function' && deckPending() > 0.5);
    KST.tank = null; if (!G.hand){ if (!GB) buildGear(); drawCrabTank(BMrel, G, d, Bm / 2, G.hauler || [Bm / 2 * 0.92, d.y + 1, d.z - 1.3]); nSetup(VP); }
    drawRigRest(BMrel, G, d); drawHaulRest(BMrel, G, d, VP); drawUpg(BMrel, G, d, VP); nSetup(VP);
    KST.raft = KST.buoys = KST.text = KST.smoke = KST.mob = KST.ladder = KST.radar = KST.cargo = 0; KST.crane = null; KST.vt = vt; KST.n++;
    drawSafety(BMrel, G, VP, t); const lifted = drawCrane(BMrel, G, VP, t, d); drawCargo(BMrel, G, lifted ? 1 : 0);
    if (!potRig){
      // the bleeding tub: a 300 l fish tub with the bloody water at its level (the old box where the kit is not in the page)
      if (KT) drawBleedTub(BMrel, W, d, ux, uz, KT, KW);
      else drawN(PM.btub, chain(BMrel, M4.T(ux, d.y, uz), M4.RY(W && W.ry || 0), M4.S(W && W.s || 1)));
      // the table by the rail, its long side along the boat and the worker's side inboard
      if (!own){ if (KB) drawN(KB, chain(BMrel, M4.T(tx, d.y, tz), M4.RY(tSide * Math.PI / 2))); else drawN(PM.gtable, chain(BMrel, M4.T(tx, d.y, tz))); } }
    if (b.land) return;   // (through a landing the kit stands, but nobody works the catch on deck: the crew are at the landing, deckcrew.js)
    // the catch on deck (tools/fish): the round fish waiting for the knife lie in the bleeding tub (their species, about one for every 6 kg),
    // the gutted ones waiting for the icer at the end of the gutting table, and one on the table when nobody guts
    { const wait = x => !x.gut && !x.iced && !(SPECIES[x.sp] || {}).live, all = S.hold.reduce((a, x) => a + (wait(x) ? x.kg : 0), 0), n = Math.min(10, Math.ceil(all / 6)), ts = W && W.s || 1;
      const gd = S.hold.reduce((a, x) => a + (x.gut && !x.iced ? x.kg : 0), 0), ng = SK && SK.fishM && !potRig ? Math.min(3, Math.ceil(gd / 4)) : 0;
      for (let i = 0; i < ng; i++) drawN(fishOf(S.hold.find(x => x.gut && !x.iced).sp), chain(BMrel, M4.T(tx, topY, tz + (own ? 0.38 : 0.45) * (tz > d.z ? -1 : 1)), M4.T(0, i * 0.045, (hash(i * 3) - 0.5) * 0.12), M4.RY(0.15 + (i % 2) * Math.PI), M4.RZ(Math.PI / 2), M4.S(0.46)));
      if (n > 0 && SK && SK.fishM && !potRig && !DK.on){ const sp0 = (S.hold.find(wait) || {sp:'torsk'}).sp; drawN(fishOf(sp0), chain(BMrel, M4.T(tx, topY, tz + (own ? 0 : 0.25)), M4.RY(0.2), M4.RZ(Math.PI / 2), M4.S(0.5))); } }
    if (!DK.on) return;
    const agents = !G.hand && typeof CREW3D !== 'undefined' && CREW3D.on();   // (the agents walk to the table and the tub themselves, deckcrew.js)
    const wl = xf(BMrel, [tx + 0.62, d.y, tz]), wy = wl[1] + eye[1], P = {gy:() => wy, bare:true, spray:0, kit:DK.me ? 'skipper' : null, look:seaLook(DK.me ? lookMe() : lookCrew(0))}, head = bv.head - Math.PI / 2;
    // (icing on an open boat: the shovel from the ice box on deck over the fish in the tub being filled, as the packer does; deckcrew.js)
    const kp = karPlaces(vt), ki = kp.length ? karFilling(vt) : -1, IB = iceBoxTop(vt), icing = kp.length ? {task:'pack', Cr:xf(BMrel, kp[ki].at), crTop:karTop(vt, ki), crTub:true, Bin:IB ? xf(BMrel, IB) : null} : {task:'ice'};
    // (gutting: the fish from the bleeding tub onto the table, the guts over the rail, the gutted fish into the fish tub, 08-plants.js gutw)
    const DW = deckWork(G), gutting = {task:'gutw', Tb:xf(BMrel, DW.table), Ub:xf(BMrel, dkTub(G)), Of:xf(BMrel, DW.offal), Cr:kp.length ? xf(BMrel, kp[ki].at) : null, crTop:kp.length ? karTop(vt, ki) : 0.3,
      gsp:(S.hold.find(x => !x.gut && !x.iced) || {sp:'torsk'}).sp, gkg:2 + hash(Math.floor(t / 5.6)) * 3};
    if (!agents) drawWorker(P, Object.assign({x:wl[0] + eye[0], z:wl[2] + eye[2], h:head, walk:false, s:0}, DK.task === 'gut' ? gutting : icing), eye, t, 7);
    // the skipper and a hand both on the deck work: the hand stands inboard of the bleeding tub, facing it
    // (OB1, F19 in docs/planer/om-bord.md: on the old wooden boat that put him on the one gutting at the table, the table and the tub being
    // 0.15 m apart along her: a model with a mate's place, work.mate [x, y, z], has him there, facing the tub, clear of the other)
    if (!agents && DK.me && DK.crew && !DK.alone){ const M2 = W && W.mate, w2 = xf(BMrel, M2 ? [M2[0], d.y, M2[2]] : [ux + (ux > tx ? -0.62 : 0.62), d.y, uz]), y2 = w2[1] + eye[1];
      // (OB5: a fourth number is his heading in the boat, the skiff's mate facing the catch tub to port rather than the bleeding tub)
      const h2 = M2 ? bv.head + (M2[3] != null ? M2[3] : Math.atan2(ux - M2[0], -(uz - M2[2]))) : bv.head + (ux > tx ? 1 : -1) * Math.PI / 2;
      drawWorker({gy:() => y2, bare:true, spray:0, kit:null, look:seaLook(lookCrew(0))}, Object.assign({x:w2[0] + eye[0], z:w2[2] + eye[2], h:h2, walk:false, s:0}, icing), eye, t, 8); }
    // the offal goes over the rail on the table's side into the water (down the bench's chute), where the gulls come down for it
    const kDrop = KB && XF[big ? 'benk_drop' : 'bord_drop'], dropP = kDrop ? [tx + tSide * kDrop[2], d.y + Math.max(0.6, kDrop[1]), tz - tSide * kDrop[0]] : [tx - tSide * 0.15, d.y + 1.0, tz];
    const out = [-tSide * Math.cos(bv.head), -tSide * Math.sin(bv.head)], a = xf(BMrel, dropP), wat = (env.tide || 0) - eye[1];
    DK.pt = [a[0] + eye[0] + out[0] * 2.6, (env.tide || 0), a[2] + eye[2] + out[1] * 2.6];
    if (DK.task === 'gut' && !agents){ const c = (t % 3) / 3; if (c > 0.76){ const k = (c - 0.76) / 0.24; drawN(PM.slo, M4.T(a[0] + out[0] * 2.6 * k, a[1] + 1.2 * k * (1 - k) * 2 - (a[1] - wat) * k * k, a[2] + out[1] * 2.6 * k)); } }
  }
