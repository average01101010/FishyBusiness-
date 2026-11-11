"""OB0 (steg 69 i docs/planer/koen.md, Jonas 09.11.2026): the recording tool for the work aboard the coastal fleet. It plays each
operation of a boat's day for a given boat and fishery (from the quay and casting off, out to the ground, setting, waiting and jigging,
hauling, the fish in over the rail, bleeding, gutting, icing and the tub, clearing the deck, in to the plant, mooring, landing, and rest
and food aboard where she has it) and records a short video of each, landscape and portrait, with three pictures (early, middle, late) without the chart, the status box and
the compass (S.settings.hudOff; Jonas 09.11.2026: «send meg gjerne bilder, men sørg for å minimere kartet og statusboksen»). The middle
picture is a screenshot; the early and the late one are taken from the recording when it is cut (a screenshot waits for a frame, some
50 s on the slow clock). Jonas looks at the pictures, not the videos («De er alt for hakkete uansett»); the videos are for the review.

Not a test and not in run.py: it prints what each clip showed (the deck events counted in G3._debug.dk.n, the crew's stations from
CREW3D.agents()), the damage to the hull, and crewclip's check (clipNow, bodyHits, agents off the deck), so OB1 and the next phases can
show the same operation before and after their change. A boat with all her operations takes some 20-40 minutes a format with two
recordings at a time.

SwiftShader draws under one frame a second, so a plain recording is a slide show. The page runs on a slow clock instead (TIMESCALE:
performance.now, Date, the timers and requestAnimationFrame all at K of real time, everything in the page in step), and ffmpeg plays
the cut back at 1/K: the clip has the game's own pace and some 3-5 frames a second at K = 0.15 (the default). Judge the movements and
the places, not the frame rate.

  python3 tests/ombord.py trebat                      every fishery and every operation, landscape and portrait
  python3 tests/ombord.py trebat juksa line           only those fisheries (and the common operations)
  python3 tests/ombord.py kyst15 --format liggende --ops kast,trekk --k 0.15 --sec 9
  python3 tests/ombord.py --recut <out>/trebat [liggende]   cut the clips again from the kept raw recording (_raw_<format>/)
  python3 tests/ombord.py trebat                      the default since 09.11.2026: only the three pictures, never a video (Jonas: «Ny regel:
                                                      Ikke ta videoopptak»); --bilder says the same. Before (OB1, Jonas 09.11.2026: «Du trenger
                                                      ikke å ta videoklipp av båten, det holder med bilder»): the game's own clock, nothing
                                                      recorded, so a boat takes a fraction of the time
  KYST_OMBORD_OUT=<dir>                               where the clips go (default tests/out/ombord/); the videos stay out of git

Output: <out>/<boat>/<fishery>_<op>_<format>.mp4 and _1/_2/_3.jpg, and <out>/<boat>/clips_<format>[_<ops>].json with what each clip
showed; the raw recording stays in _raw_<format>/ (for --recut)."""
from _env import boot, OUT
import asyncio, json, os, subprocess, sys, time
from playwright.async_api import async_playwright

BOATS = ['trebat', 'skiff', 'snekke', 'plastsjark', 'sjark', 'hurtigsjark', 'sjarkny', 'breisjark', 'kyst15', 'kyst21']
FISHERIES = ['juksa', 'line', 'garn', 'teiner']
FORMATS = {'liggende': (640, 360), 'staaende': (360, 640)}

# the slow clock for the whole page (see the docstring); __TK.set(k) changes the pace from now on
TIMESCALE = """(() => {
  const P = performance, pn = P.now.bind(P), OD = Date, ost = window.setTimeout.bind(window), osi = window.setInterval.bind(window), orf = window.requestAnimationFrame.bind(window);
  const K = window.__TK = {k:1}; let r0 = pn(), v0 = r0; const ep = OD.now() - pn();
  const vnow = () => v0 + (pn() - r0) * K.k;
  K.set = k => { v0 = vnow(); r0 = pn(); K.k = k; }; K.now = vnow;
  P.now = vnow;
  function D(...a){ if (!new.target) return new OD(ep + vnow()).toString(); return a.length ? new OD(...a) : new OD(ep + vnow()); }
  D.prototype = OD.prototype; D.now = () => Math.floor(ep + vnow()); D.UTC = OD.UTC; D.parse = OD.parse; window.Date = D;
  window.setTimeout = (f, ms, ...a) => ost(f, (ms || 0) / K.k, ...a);
  window.setInterval = (f, ms, ...a) => osi(f, (ms || 0) / K.k, ...a);
  window.requestAnimationFrame = cb => orf(() => cb(vnow()));
})();"""

# the base of every scene (OB in the code reading of OB0): the boat, a clean state, the crew she is built for (crewMax, no traits: a
# seasick hand stands over the rail in any sea), the catch feeder off. SEA puts her still on the first ground; FEEDON feeds CATCHQ as
# the game does (one fish every 0.9 s, at most three waiting)
BASE = """((a) => { const [type, fish, op] = a, b = S.boat, V = VESSELS[type]; S.tut = 0; S.mult = 1; S.cash = 1e7; S.settings.autoOn = false;
  S.t = Math.round((Date.UTC(2027, fish === 'teiner' ? 7 : 2, 12, 11) - EPOCH) / 6e4);
  const m = document.getElementById('modal'); if (m) m.hidden = true;
  b.type = type; applyVessel(); G3.vesselChanged(); S.boatName = 'Havbris';
  S.equip = {}; S.jobs = []; S.cargo = []; S.sets = []; S.plan = null; S.rest = null; S.me = S.cur; S.myJob = null; S.meal = null;
  b.gop = null; b.land = null; b.iceUntil = 0; b.shift = null; b.deckStop = false; b.dmg = null; b.damage = 0; S.incidents = []; b.deckEnd = null; b.ice = 300; b.fuel = BOAT.fuelCap;
  S.settings.gut = true; S.settings.ice = true; S.settings.careAuto = false;
  S.settings.hudMin = true; S.settings.plotMin = true; S.settings.hudOff = true; renderHud();   /* (the chart, the status box and the compass away, so they do not cover the boat; Jonas 09.11.2026) */
  S.pgear = newPGear(); S.pgear.kits.n = 4; S.hold = []; b.rig = fish; S.target = 'torsk';
  const nn = Math.min(3, V.crewMax || 0);
  S.crew = Array.from({length:nn}, () => Object.assign(genCrew(), {bi:false, off:false, fatigue:5, morale:70, job:null, traits:[]}));
  if (window.OB_IDLE) { window.idleAssign = window.OB_IDLE; window.OB_IDLE = null; }
  if (window.OB_COLD) { window.coldPen = window.OB_COLD; window.OB_COLD = null; }
  window.CATCHQ = []; clearInterval(window.FEED); window.FEED = null; G3._debug.cam.at = null;
  window.SEA = (st) => { const g = GROUNDS[0].p; b.status = st || 'idle'; b.port = null; b.berth = null; b.pos = {x:g.x, y:g.y}; b.heading = 0.4; b.v = 0;
    b.fishUntil = st === 'fishing' ? S.t + 600 : null; G3.vesselChanged(); };
  window.FEEDON = (sp) => { clearInterval(window.FEED); window.FEED = setInterval(() => { const Q = window.CATCHQ || (window.CATCHQ = []);
    if (Q.length < 3) Q.push({sp:sp || (Math.random() < 0.75 ? 'torsk' : 'hyse'), kg:2 + Math.random() * 4, t:performance.now()}); }, 900); };
  window.QUAY = (pid) => { const q = portById(pid); Object.assign(G3._debug.MO, {init:false}); b.status = 'port'; b.port = pid; b.pos = {...q.p}; b.berth = 'main'; b.moorT = S.t - 60; G3.vesselChanged(); };
  window.FISH = (kg, gut, iced) => ({sp:'torsk', cls:SPECIES.torsk.ref, kg, n:Math.max(1, Math.round(kg / 3)), bled:true, iced, gut, hr:Math.floor(S.t / 60), fresh:100, hook:true});
})"""

# each operation: [the fisheries it belongs to ('*' = common, once per boat), what it shows, the JS after BASE (an async function body
# with type, fish, op, b, V, g; return 'SKIP: why' when the boat cannot do it), the camera (yaw from the bow, pitch, distance in boat
# lengths), and the clip's length in game seconds when not --sec]. The recipes and the code they lean on: docs/planer/om-bord.md, kap. 2
OPS = {
  # from the quay and casting off: the lines come in, she backs out on her route (DYN), the crew at their places
  'kast': ['*', 'ved kai og kaste loss: tauene inn, hun rygger ut og går', """QUAY('husoy'); if (S.crew.length) CREW3D.reset();
      await new Promise(r => setTimeout(r, 2500)); const q = portById('husoy');
      const r = await leiaRoute({x:q.p.x, y:q.p.y}, {x:g.x, y:g.y}, 'husoy', null); if (r.why) return 'SKIP: ' + r.why;
      S.plan = {wps:r.wps.map(w => ({x:w.x, y:w.y, port:null, fish:0, leia:true})), idx:0, speed:BOAT.vcruise || 6, full:false, returning:false};
      depart();""", (0.9, 0.42, 1.6), 14],
  # out to the ground: the skipper at the wheel, the crew inside or on the open deck
  'ut': ['*', 'til feltet: skipperen ved roret, mannskapet inne eller på det åpne dekket', """b.status = 'sailing'; b.port = null; b.pos = {x:g.x, y:g.y}; b.heading = 1.2; G3.vesselChanged();
      S.plan = {wps:[{x:b.pos.x + Math.sin(1.2) * 6, y:b.pos.y - Math.cos(1.2) * 6, port:null, fish:0}], idx:0, speed:BOAT.vcruise || 7, returning:false}; if (S.crew.length) CREW3D.reset();""",
      (1.1, 0.3, 1.5), 10],
  # jigging by hand: the reel or the line over the rail, the fish up and bled
  'jig': [['juksa'], 'juksa for hånd: snella eller lina over rekka, fisken opp, bløgget', """SEA('fishing'); b.gear = true; S.equip.jukse = 0; window.jigActive = false;
      S.hold = [FISH(30, true, true)]; FEEDON(); if (S.crew.length) CREW3D.reset();""", (-1.3, 0.35, 0.9), 12],
  # the jigging machines on the rail
  'maskin': [['juksa'], 'juksamaskinene på rekka: rykker, fisken opp og tatt av', """SEA('fishing'); b.gear = true; S.equip.jukse = Math.min(3, V.jukseMax || 0); window.jigActive = false;
      if (!S.equip.jukse) return 'SKIP: ingen juksamaskin'; S.hold = [FISH(30, true, true)]; FEEDON(); if (S.crew.length) CREW3D.reset();""", (-1.0, 0.4, 0.9), 12],
  # the tub is full: everyone to the work on deck, bleeding, gutting, icing and the tub or the hold
  'sloy': [['juksa'], 'karet er fullt: bløgge, sløye, ise og legge i kar eller rom', """SEA('fishing'); b.gear = true; S.equip.jukse = 0;
      addCatch('torsk', tubCap(), null, true); b.deckStop = true; b.deckEnd = S.t + 60; if (S.crew.length) CREW3D.reset();""", (-0.6, 0.6, 0.85), 14],
  # setting line, nets or pots with the game's own setChoices and startSet
  'sett': [['line', 'garn', 'teiner'], 'sette redskapet: stampen, garnet eller teinene over hekken eller siden', """SEA('idle'); const pg = S.pgear;
      if (fish === 'line'){ S.equip.linehaler = true; pg.lines.hyse.n = 4; pg.lines.hyse.baited = 4; }
      if (fish === 'garn'){ if (!equipFits('garnhaler', type) && !(typeof handGear === 'function' && handGear('garn', type))) return 'SKIP: garnhaleren passer ikke båten (minLen 7,5 m)'; if (equipFits('garnhaler', type)) S.equip.garnhaler = true; pg.nets = [{id:'n1', mesh:180, ty:'bunn', n:6, cond:1}]; }
      if (fish === 'teiner'){ S.equip.teinehaler = true; pg.pots.big = 6; baitOf(pg).makrell = 50; }
      const ch = setChoices().find(c => !c.off); if (!ch) return 'SKIP: ingen valg i setChoices';
      const why = startSet(ch.kind, ch.spec, 0); if (why) return 'SKIP: ' + (why[0] || why); if (S.crew.length) CREW3D.reset();""", (0.5, 0.45, 1.0), 12],
  # (OB3, steg 81: the same with everything she may carry aboard and the kit over the stern: the line through the line setter from the
  # tubs on its magazine, the nets through the net chute, the tubs stacked and the nets in as many tubs as the deck has room for)
  'settfull': [['line', 'garn'], 'sette med fullt redskap om bord, gjennom linesetteren eller garnrenna', """SEA('idle'); const pg = S.pgear, GM = V.gearMax || {};
      if (geoOf(type).hand) return 'SKIP: håndbåt';
      if (fish === 'line'){ S.equip.linehaler = true; if (equipFits('linesetter', type)){ S.equip.linesetter = true; S.equip.linesetterLv = 2; } pg.lines.hyse.n = Math.min(24, GM.stamp || 4); pg.lines.hyse.baited = pg.lines.hyse.n; pg.kits.n = 8; }
      if (fish === 'garn'){ if (!equipFits('garnhaler', type)) return 'SKIP: garnhaleren passer ikke'; S.equip.garnhaler = true; if (equipFits('garnrenne', type)) S.equip.garnrenne = true;
        const n = Math.min(60, GM.garn || 6); pg.nets = []; for (let i = 0; i < n; i += 15) pg.nets.push({id:'n' + i, mesh:180, ty:'bunn', n:Math.min(15, n - i), cond:1}); pg.kits.n = 12; }   /* (strings of 15: six nets were out through the chute before the middle picture) */
      const ch = setChoices().find(c => !c.off); if (!ch) return 'SKIP: ingen valg i setChoices';
      const why = startSet(ch.kind, ch.spec, 0); if (why) return 'SKIP: ' + (why[0] || why); if (S.crew.length) CREW3D.reset();""", (0.5, 0.5, 1.05), 12],
  # (and lying still rigged with all of it aboard: the tubs stacked, the two first on the magazine, the nets in their tubs)
  'riggfull': [['line', 'garn'], 'ligge stille med fullt redskap om bord: stampene stablet, garnet i karene', """SEA('idle'); const pg = S.pgear, GM = V.gearMax || {};
      if (geoOf(type).hand) return 'SKIP: håndbåt';
      if (fish === 'line'){ S.equip.linehaler = true; if (equipFits('linesetter', type)){ S.equip.linesetter = true; S.equip.linesetterLv = 2; } pg.lines.hyse.n = Math.min(24, GM.stamp || 4); pg.lines.hyse.baited = Math.round(pg.lines.hyse.n / 2); }
      if (fish === 'garn'){ if (!equipFits('garnhaler', type)) return 'SKIP: garnhaleren passer ikke'; S.equip.garnhaler = true; if (equipFits('garnrenne', type)) S.equip.garnrenne = true;
        const n = Math.min(60, GM.garn || 6); pg.nets = []; for (let i = 0; i < n; i += 6) pg.nets.push({id:'n' + i, mesh:180, ty:'bunn', n:Math.min(6, n - i), cond:1}); }
      if (S.crew.length) CREW3D.reset();""", (0.5, 0.55, 1.05), 6],
  # hauling: a real set in the sea, startHaul, the fish in over the rail, gaffed or picked, bled
  'trekk': [['line', 'garn', 'teiner'], 'trekke: haleren går, fisken inn over rekka, hugget eller plukket, bløgget', """SEA('idle'); const p = {...b.pos}, kind = fish === 'teiner' ? 'teine' : fish;
      if (kind === 'line') S.equip.linehaler = true;
      if (kind === 'garn'){ if (!equipFits('garnhaler', type) && !(typeof handGear === 'function' && handGear('garn', type))) return 'SKIP: garnhaleren passer ikke båten (minLen 7,5 m)'; if (equipFits('garnhaler', type)) S.equip.garnhaler = true; }
      if (kind === 'teine') S.equip.teinehaler = true;
      const acc = kind === 'teine' ? {krabbe:{kg:60, n:90}} : {torsk:{kg:220, n:70}, hyse:{kg:60, n:40}};
      S.sets = [{id:'s0', vid:S.cur, kind, n:6, a:p, b:{x:p.x + 0.6, y:p.y}, tSet:S.t - 12 * 60, acc, dead:0, cond:1, heavy:false, depth:Math.round(depthF(p)), warn:0,
        ...(kind === 'line' ? {lk:'hyse', hooks:6 * 600, miss:0, bent:0} : kind === 'garn' ? {mesh:180, ty:'bunn', lid:'n1'} : {pot:'big', bait:'makrell'})}];
      const why = startHaul('s0', false, 0); if (why) return 'SKIP: ' + (why[0] || why); if (S.crew.length) CREW3D.reset();""", (-0.8, 0.45, 0.9), 14],
  # clearing the deck: the hose and the broom after gutting (only pauses in the game; forced here as crewclip does)
  'rydd': ['*', 'rydde og spyle dekket etter sløyingen', """if (geoOf(type).hand || !S.crew.length) return 'SKIP: ingen agenter på håndbåtene (drawSkiff)'; SEA('idle'); b.deckT = S.t;
      /* (OB14: the washing down is a role now, 13-work.js deckRoles, from two minutes after the deck work stopped; on a build from
         before it, the breaks are forced as crewclip does) */
      if (typeof deckRoles === 'function') b.deckT = S.t - WASH.after;
      else { const orig = idleAssign; window.OB_IDLE = orig;
        window.idleAssign = (P, ctx) => { orig(P, ctx); let i = 0; for (const p of P) if (p.st === 'pause' && p.c){ p.idle = ['hose', 'sweep'][i++ % 2]; p.with = null; } }; }
      CREW3D.reset(); CREW3D._st.ctxT = -1e9; CREW3D._st.lastSim = null;""", (0.3, 0.6, 0.9), 10],
  # in to the plant and mooring: 300 m out, then dock; the path in along the quay, the lines one by one
  'inn': ['*', 'inn til mottaket og fortøye: hun glir inn langs kaia, tauene på', """const q = portById('husoy'); b.status = 'idle'; b.port = null;
      /* (300 m out along the fairway in from the ground, not a fixed offset: east of the plant is land for some berths) */
      const r = await leiaRoute({x:g.x, y:g.y}, {x:q.p.x, y:q.p.y}, null, 'husoy'); let P = {x:q.p.x + 0.3, y:q.p.y};
      if (r && r.wps && r.wps.length){ const W = [{x:g.x, y:g.y}, ...r.wps.map(w => ({x:w.x, y:w.y})), {x:q.p.x, y:q.p.y}]; let left = 0.3;
        for (let i = W.length - 1; i > 0; i--){ const d = Math.hypot(W[i].x - W[i - 1].x, W[i].y - W[i - 1].y); if (d >= left){ const k = left / d; P = {x:W[i].x + (W[i - 1].x - W[i].x) * k, y:W[i].y + (W[i - 1].y - W[i].y) * k}; break; } left -= d; } }
      b.pos = P; b.heading = Math.atan2(q.p.x - P.x, -(q.p.y - P.y)); G3.vesselChanged();
      if (S.crew.length) CREW3D.reset(); await new Promise(r => setTimeout(r, 2500));
      /* (on the slow clock: the glide in and the lines fall inside the clip) */ setTimeout(() => dock('husoy', 'main'), 2500);""", (-0.6, 1.0, 2.0), 16],
  # landing at the plant: the plant's crane lifts the tubs, the truck, the people on the quay
  'loss': ['*', 'losse ved mottaket: karene opp med mottakets kran, trucken, folkene på kaia', """let why = null;
      for (const pid of ['husoy', 'torsken']){ const q = portById(pid); if (!q) continue; b.status = 'port'; b.port = pid; b.pos = {...q.p}; b.berth = 'main'; b.land = null; S.plan = null; G3.vesselChanged();
        S.hold = [{sp:'sei', cls:1, kg:Math.max(450, Math.min(4000, (V.holdCap || 500) * 0.8)), n:200, bled:true, iced:true, hr:0, fresh:95, gut:false, hook:true}];
        why = startLanding(false); if (!why && b.land) break; }
      /* (OB4: she has lain there an hour, so nobody is on the lines: moorPhase) */ b.moorT = S.t - 60;
      if (!b.land) return 'SKIP: ' + JSON.stringify(why); if (S.crew.length) CREW3D.reset();
      /* (the plant waits a minute before the first lift and takes 2.5 game minutes a lift: the clip starts in the first lift, at twice the pace) */
      S.mult = 2; b.land.t0 -= LANDING.prep * 0.95; b.land.until -= LANDING.prep * 0.95;""", (-0.6, 1.0, 1.8), 14],
  # ice from the plant's silo (OB4, F11): the chute swung out over her, one of the hands takes the ice aboard
  'is': ['*', 'is om bord ved mottaket: renna fra siloen svinger ut, én tar imot isen og fordeler den', """QUAY('husoy'); if (!plantFor(portById('husoy'), type)) return 'SKIP: ikke mottak for henne';
      b.ice = 150; iceChute(2500); if (S.crew.length) CREW3D.reset();""", (-0.6, 1.0, 1.8), 14],
  # the boat's own crane at the quay with freight
  'kran': ['*', 'båtens egen kran ved kaia: frakt om bord', """if (!(V.crane > 0)) return 'SKIP: ingen kran'; QUAY('husoy');
      S.cargo = [{tur:'t1', kg:Math.min(1500, V.deckCargo || 0), no:'proviant', en:'provisions'}];
      S.jobs = [{kind:'last', crew:true, h:2, until:S.t + 120, no:'Lasting av proviant', en:'Loading the provisions'}]; if (S.crew.length) CREW3D.reset();""", (1.0, 0.45, 1.3), 12],
  # rest and food aboard: the meal is due (the cook) and the skipper turns in where she has bunks
  'hvile': ['*', 'mat og hvile om bord: kokken lager mat, skipperen går til køys der båten har køyer', """if (!S.crew.length) return 'SKIP: ingen mannskap (håndbåt)'; SEA('idle');
      b.deckT = null; S.meal = {due:S.t + 10, cook:null, hist:[]}; S.crew.forEach(c => { c.fatigue = 60; }); if ((V.berths || 0) > 0) restStart();
      /* (OB14, F13: no galley, so the packed lunch is out now; the crew rested enough to eat it sitting up) */
      if (((V.fac || {}).galley) === 'none'){ S.meal = {due:S.t + 300, cook:null, hist:[2], last:{t:S.t, q:2, by:null, nm:'middag'}}; S.crew.forEach(c => { c.fatigue = 20; }); }
      CREW3D.reset(); CREW3D._st.ctxT = -1e9;""", (0.2, 0.5, 0.95), 10],
  # the cold (OB14, F14): lying still on a winter's day with the cold costing a third; those on a break beat their arms, the hoods are up
  'kulde': ['*', 'kulda synes: de som har pause, slår floke og gnir hendene, hetta er oppe', """if (!S.crew.length) return 'SKIP: ingen mannskap (håndbåt)'; SEA('idle');
      if (typeof deckRoles !== 'function') return 'SKIP: bygget har ikke kulda på folkene (før OB14)';
      b.deckT = null; window.OB_COLD = coldPen; window.coldPen = () => 0.3; CREW3D.reset(); CREW3D._st.ctxT = -1e9;""", (0.3, 0.6, 0.9), 10],
}
# (OB14) the washing down from abeam and nearer, for the boats whose deck is hidden from ahead (the havsjark's gear house)
OPS['ryddn'] = [OPS['rydd'][0], OPS['rydd'][1] + ' (fra siden, nært)', OPS['rydd'][2], (-1.35, 0.75, 0.75), 10]

# (OB4 11.11.2026) the same at the quay from nearer and lower, so the hands at the tubs, the rail and the ice box can be seen: 'lossn' in
# the first lift at the game's own pace (the hook comes down, the sling goes on, the tub goes up), 'isn' and 'krann' as 'is' and 'kran'
# the camera for the work under a shelter deck (F18, OB12): abeam to starboard and low for the hauling station, astern and low for the
# setting port; the fourth number is how far aft of her middle the camera looks, as a part of her length (cam.at)
UNDER = {'jig': (-1.45, 0.10, 0.62, 0.20), 'maskin': (-1.45, 0.10, 0.62, 0.20), 'sloy': (-1.30, 0.10, 0.55, 0.14), 'trekk': (-1.25, 0.10, 0.60, 0.10),
         'sett': (0.22, 0.10, 0.70, 0.42), 'settfull': (0.22, 0.10, 0.70, 0.42), 'riggfull': (-2.0, 0.14, 0.75, 0.30)}
OPS['lossn'] = [OPS['loss'][0], OPS['loss'][1] + ' (nært: den som hekter på, og den som gir tegn)', OPS['loss'][2] + " S.mult = 1; b.land.t0 -= LANDING.prep * 0.05 + LANDING.lift * 0.2; b.land.until -= LANDING.prep * 0.05 + LANDING.lift * 0.2;", (0.55, 1.22, 0.95), 16]
OPS['isn'] = [OPS['is'][0], OPS['is'][1] + ' (nært)', OPS['is'][2], (0.55, 1.22, 0.95), 12]
OPS['krann'] = [OPS['kran'][0], OPS['kran'][1] + ' (nært)', OPS['kran'][2], (0.55, 1.22, 0.95), 14]
QUAYOPS = {'kast', 'inn', 'loss', 'lossn', 'is', 'isn', 'kran', 'krann'}

# the crew against the model while the clip runs (crewclip's own checks: limbs in their pose, bodies on the way, agents off the deck)
CLIP = """(() => { if (!CREW3D.on()) return null; const M = CREW3D._st.M;
  return {clip:(CREW3D.clipNow() || []).filter(x => x.n > 0).map(x => x.id + ':' + x.task + ':' + x.n + '[' + (x.segs || []).join('.') + ']'),
    walk:(CREW3D.bodyHits() || []).map(x => x.id + ':' + x.which + ':' + x.mode),
    off:M ? CREW3D.visible().filter(a => a.mode !== 'in' && !M.ok(M.cellOf(a.x, a.z))).map(a => a.id) : []}; })()"""

STATE = """(() => ({st:CREW3D.agents().map(a => a.st + ':' + a.mode + ':' + (a.task || '')), n:JSON.parse(JSON.stringify(G3._debug.dk.n || {})),
  anim:(G3._debug.SK && G3._debug.SK.anim) ? G3._debug.SK.anim.st : null, gop:S.boat.gop ? S.boat.gop.op + ':' + S.boat.gop.kind : null, status:S.boat.status,
  hold:Math.round((S.hold || []).reduce((s, h) => s + h.kg, 0)), jobs:(S.jobs || []).map(j => j.kind),
  kst:(k => ({setting:k.setting || null, stamps:k.stamps, stampsAll:k.stampsAll, netTubs:k.netTubs, stern:k.stern || null}))(G3._debug.kitStat || {}), roles:CREW3D.agents().filter(a => a.role).map(a => a.role + ':' + (a.goal && a.goal.task)),
  dmg:S.boat.dmg ? JSON.parse(JSON.stringify(S.boat.dmg)) : null, inc:(S.incidents || []).slice(-3).map(i => i.k)}))()"""


# a picture of the 3D view only (--bilder): the canvas read in the frame after the game has drawn it (its callback was asked for first,
# so it runs first), which takes a second where a screenshot under SwiftShader takes a minute; the labels over the boats are not in it.
# A blank read (the buffer already gone) falls back on the screenshot
SNAP = """() => new Promise(r => requestAnimationFrame(() => { try { r(document.getElementById('gl').toDataURL('image/jpeg', 0.85)); } catch (e){ r(''); } }))"""
async def snap(pg, path):
    import base64
    u = await pg.evaluate(SNAP)
    if u and u.startswith('data:image/jpeg') and len(u) > 20000:
        with open(path, 'wb') as f: f.write(base64.b64decode(u.split(',', 1)[1]))
    else: await pg.screenshot(path=path, type='jpeg', quality=80)


def args():
    # (only pictures, never a video, Jonas 09.11.2026: «Ny regel: Ikke ta videoopptak. Kvaliteten er alt for dårlig og hakkete»; --video
    # is kept for the code that cuts the old recordings, and is not to be used)
    a = sys.argv[1:]; o = {'format': 'begge', 'ops': None, 'k': 0.15, 'sec': None, 'bilder': '--video' not in a}
    pos = []
    i = 0
    while i < len(a):
        if a[i] in ('--bilder', '--video'): i += 1
        elif a[i].startswith('--'): o[a[i][2:]] = a[i + 1]; i += 2
        else: pos.append(a[i]); i += 1
    if not pos or pos[0] not in BOATS: sys.exit('bruk: ombord.py <båt> [fiske ...] [--format liggende|staaende|begge] [--ops a,b] [--k 0.1] [--sec 12]; båtene: ' + ' '.join(BOATS))
    o['boat'] = pos[0]; o['fish'] = [f for f in pos[1:] if f in FISHERIES] or FISHERIES
    o['k'] = float(o['k']); o['sec'] = float(o['sec']) if o['sec'] else None
    o['formats'] = list(FORMATS) if o['format'] == 'begge' else [o['format']]
    if o['ops']: o['ops'] = o['ops'].split(',')
    return o


def clips_for(o, rigs):
    out = []
    for name, (fs, what, js, cam, *rest) in OPS.items():
        if o['ops'] and name not in o['ops']: continue
        if fs == '*': out.append(('felles', name))
        else:
            for f in o['fish']:
                if f in fs and f in rigs: out.append((f, name))
    return out


async def record(o, fmt, outdir):
    w, h = FORMATS[fmt]; viddir = os.path.join(outdir, '_raw_' + fmt); os.makedirs(viddir, exist_ok=True)
    log = []
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        ctx = await br.new_context(viewport={'width': w, 'height': h}) if o['bilder'] else await br.new_context(viewport={'width': w, 'height': h}, record_video_dir=viddir, record_video_size={'width': w, 'height': h})
        await ctx.add_init_script(TIMESCALE)
        pg = await ctx.new_page(); T0 = time.time(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(2000)
        rigs = await pg.evaluate("(t) => VESSELS[t].rigs", o['boat'])
        L = await pg.evaluate("(t) => VESSELS[t].len", o['boat'])
        for fish, op in clips_for(o, rigs):
            fs, what, js, cam, *rest = OPS[op]; sec = o['sec'] or (rest[0] if rest else 12)
            f = fish if fish != 'felles' else (rigs[0] if rigs else 'juksa')
            n0 = await pg.evaluate("G3._debug.kitStat.n")
            await pg.evaluate("__TK.set(1)")
            await pg.evaluate(BASE, [o['boat'], f, op])
            res = await pg.evaluate("(async (a) => { const [type, fish, op] = a, b = S.boat, V = VESSELS[type], g = GROUNDS[0].p; " + js + " })", [o['boat'], f, op])
            if isinstance(res, str) and res.startswith('SKIP'):
                rec = {'clip': f'{fish}_{op}_{fmt}', 'what': what, 'skip': res}; log.append(rec); print(json.dumps(rec, ensure_ascii=False), flush=True); continue
            yaw, pitch, dist = cam
            # (F18, OB12: on a boat whose work is under a shelter deck the camera stands low off the working side, or astern for the
            # setting through the port in her stern, and looks in through the openings; from above only the shelter deck shows)
            if op in UNDER and await pg.evaluate("(t) => { const V = VESSELS[t]; return !!(V.fac && V.fac.shelter === true && V.len >= 12 && V.len < 20); }", o['boat']):
                yaw, pitch, dist, aft = UNDER[op]
                await pg.evaluate("(z) => { G3._debug.cam.at = [0, 0.9, z]; }", aft * L)
            # (F22, OB4: at a quay the camera stands off the side away from it; a boat that lies port side to has it on the other side)
            if op in QUAYOPS: yaw *= await pg.evaluate("(t) => typeof berthSide === 'function' ? berthSide(t) : 1", o['boat'])
            await pg.evaluate("([y, p, d]) => { const c = G3._debug.cam; c.helm = false; c.yaw = y; c.pitch = p; c.dist = d; }", [yaw, pitch, dist * max(L, 4) * (1.35 if fmt == 'staaende' else 1)])
            try:
                await pg.wait_for_function("([t, n0]) => { const K = G3._debug.kitStat; return K.vt === t && K.n >= n0 + 3; }", arg=[o['boat'], n0], timeout=120000)
            except Exception: pass
            a = await pg.evaluate(STATE); fa = await pg.evaluate("G3._debug.kitStat.n")
            if o['bilder']:
                # pictures only (--bilder): the game's own clock, a screenshot at 15, 50 and 85 % of the operation's seconds
                t1 = time.time() - T0; c1 = None; ran = 0.0
                for i, at in ((1, 0.15), (2, 0.5), (3, 0.85)):
                    left = sec * at - ran
                    if left > 0: await pg.wait_for_timeout(int(left * 1000)); ran += left
                    t0 = time.time(); await snap(pg, os.path.join(outdir, f'{fish}_{op}_{fmt}_{i}.jpg')); ran += time.time() - t0
                    if i == 2: c1 = await pg.evaluate(CLIP)
                t2 = time.time() - T0
                b = await pg.evaluate(STATE); c2 = await pg.evaluate(CLIP); fb = await pg.evaluate("G3._debug.kitStat.n")
                d = {k: b['n'].get(k, 0) - a['n'].get(k, 0) for k in b['n'] if b['n'].get(k, 0) != a['n'].get(k, 0)}
                rec = {'clip': f'{fish}_{op}_{fmt}', 'what': what, 't1': t1, 't2': t2, 'before': a['st'], 'after': b['st'], 'events': d, 'anim': b['anim'], 'gop': b['gop'], 'status': b['status'], 'hold': b['hold'], 'jobs': b['jobs'], 'kst': b.get('kst'), 'roles': b.get('roles'), 'dmg': b['dmg'], 'inc': b['inc'], 'clipcheck': [c1, c2], 'fps': round((fb - fa) / max(1e-3, t2 - t1), 1)}
                log.append(rec); print(json.dumps(rec, ensure_ascii=False), flush=True); continue
            await pg.evaluate("(k) => __TK.set(k)", o['k']); t1 = time.time() - T0
            # the picture in the middle as a screenshot; the early and the late one are taken from the recording when it is cut (a screenshot
            # waits for a frame, some 50 s on the slow clock under SwiftShader; Jonas 09.11.2026: pictures, not the videos)
            span = sec / o['k'] * 1000
            await pg.wait_for_timeout(int(span * 0.5))
            await pg.screenshot(path=os.path.join(outdir, f'{fish}_{op}_{fmt}_2.jpg'), type='jpeg', quality=75)
            c1 = await pg.evaluate(CLIP)
            await pg.wait_for_timeout(int(span * 0.5))
            t2 = time.time() - T0
            await pg.evaluate("__TK.set(1)")
            b = await pg.evaluate(STATE); c2 = await pg.evaluate(CLIP); fb = await pg.evaluate("G3._debug.kitStat.n")
            d = {k: b['n'].get(k, 0) - a['n'].get(k, 0) for k in b['n'] if b['n'].get(k, 0) != a['n'].get(k, 0)}
            rec = {'clip': f'{fish}_{op}_{fmt}', 'what': what, 't1': t1, 't2': t2, 'before': a['st'], 'after': b['st'], 'events': d, 'anim': b['anim'], 'gop': b['gop'], 'status': b['status'], 'hold': b['hold'], 'jobs': b['jobs'], 'kst': b.get('kst'), 'roles': b.get('roles'), 'dmg': b['dmg'], 'inc': b['inc'], 'clipcheck': [c1, c2], 'fps': round((fb - fa) / sec, 1)}
            log.append(rec); print(json.dumps(rec, ensure_ascii=False), flush=True)
        log.append({'errors': errs[:5]}); log.append({'tend': time.time() - T0})
        await ctx.close(); raw = None if o['bilder'] else await pg.video.path(); await br.close()
    return raw, log


def cut(raw, log, outdir, k):
    # the recording starts before the clock here does (the context opens first): the offset is the video's length against the time the
    # context was closed, and the cut is decoded (-ss after -i), not sought to a key frame, so no frame of the scene before slips in
    dur_v = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', raw], capture_output=True, text=True).stdout.strip() or 0)
    tend = next((r['tend'] for r in log if 'tend' in r), dur_v); off = max(0.0, dur_v - tend)
    for r in log:
        if 'clip' not in r or 'skip' in r: continue
        ss, dur = r['t1'] + off + 1.0, r['t2'] - r['t1'] - 1.5
        dst = os.path.join(outdir, r['clip'] + '.mp4')
        # (trim before setpts: an -ss or -t on the output would count on the time already played fast)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', raw, '-vf', 'trim=start=%.2f:duration=%.2f,setpts=%g*(PTS-STARTPTS)' % (ss, dur, k), '-r', '12', '-an',
                        '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '30', dst], check=False)
        # the early and the late picture, from the recording itself (15 % and 85 % into the clip)
        for i, at in ((1, 0.15), (3, 0.85)):
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', '%.2f' % (ss + dur * at), '-i', raw, '-frames:v', '1', '-q:v', '3',
                            os.path.join(outdir, r['clip'] + '_%d.jpg' % i)], check=False)


async def main():
    if sys.argv[1:2] == ['--recut']:
        # cut the clips again from the kept raw recording: ombord.py --recut <dir of the boat> [format]
        for fmt in (sys.argv[3:4] or list(FORMATS)):
            jp = os.path.join(sys.argv[2], '_raw_%s.json' % fmt)
            if os.path.exists(jp):
                R = json.load(open(jp)); cut(R['raw'], R['log'], sys.argv[2], R['k'])
        return
    o = args()
    base = os.environ.get('KYST_OMBORD_OUT') or os.path.join(OUT, 'ombord')
    outdir = os.path.join(base, o['boat']); os.makedirs(outdir, exist_ok=True)
    allog = []
    for fmt in o['formats']:
        raw, log = await record(o, fmt, outdir)
        with open(os.path.join(outdir, '_raw_%s%s.json' % (fmt, ('_' + '_'.join(o['ops'])) if o['ops'] else '')), 'w') as f: json.dump({'raw': raw, 'k': o['k'], 'log': log}, f)
        if raw: cut(raw, log, outdir, o['k'])
        allog += log
    with open(os.path.join(outdir, 'clips_%s%s.json' % ('_'.join(o['formats']), ('_' + '_'.join(o['ops'])) if o['ops'] else '')), 'w') as f: json.dump(allog, f, ensure_ascii=False, indent=1)
    print('ferdig:', outdir)

if __name__ == '__main__':
    asyncio.run(main())
