// OB14 (steg 92, docs/planer/om-bord.md F12, F13, F14; Jonas 09.11.2026: «at arbeidet ombord utføres på en så ekte måte som mulig, at
// mannskapet oppfører seg som ekte mennesker ... at ingenting clipper inn i andre ting»): the deck washed down as part of the work, the
// packed lunch on the boats with no galley, and the cold seen on the people. The core's part (13-work.js deckRoles): roles on those on
// a break, with nobody moved between the stations, the break they had kept, and the meal's numbers as they were. The view's part, on
// each boat's own model without a browser (deckcrew.js over vessel3d.js deckMap): the one with the hose a jet's length from where the
// fish were gutted and turned to it, the one with the brush on a place of his own, those eating seated or standing by the rail, the
// lunch then the coffee on the same place, the cold where the break had them, and no limb through anything.
export const scripts = ['js/vessel3d.js', 'js/deckcrew.js'];
export const data = true;

export default function (t){
  const K = t.K; K.set('S', K.newState()); const S = K.get('S'), {VESSELS, CREW3D, applyVessel, genCrew, workAssign, WASH} = K, b = S.boat;
  K.set('hsWork', () => 0.3); K.set('hsAt', () => 0.3); let COLD = 0; K.set('coldPen', () => COLD);
  const BOATS = ['snekke', 'plastsjark', 'sjark', 'hurtigsjark', 'sjarkny', 'breisjark', 'kyst15', 'kyst21'];
  const settle = () => { const ST = CREW3D._st; ST.ctxT = -1e9; ST.lastSim = null; CREW3D.tick(0.05); ST.ctxT = -1e9; CREW3D.tick(0.05); };
  // (the same people every run: the breaks and who feels the cold hang on a hash of the id)
  const crew = n => { S.crew = [...Array(n).keys()].map(i => Object.assign(genCrew(), {id:'ob14-' + i, age:30 + 9 * i, vice:null, bi:false, off:false, sleepW:false, fatigue:10, morale:62, traits:[]})); S.me = S.cur; };
  const sea = vt => { S.tut = 0; b.type = vt; applyVessel(); CREW3D.reset(); b.status = 'idle'; b.port = null; b.berth = null; b.gop = null; b.land = null; b.iceUntil = 0; b.moorT = null; b.castT = null; b.shift = null; b.deckT = null; b.deckStop = false;
    S.plan = null; S.jobs = []; S.cargo = []; S.hold = []; S.rest = null; S.meal = null; };
  const rolesOf = A => A.filter(p => p.role).map(p => (p.c ? 'c' : 'me') + ':' + p.st + ':' + p.role).sort().join(' ');
  const shape = A => A.map(p => p.st + ':' + (p.idle || '')).join(' ');
  S.lang = 'no'; S.t = 12 * 60 + 600000;

  // ---- F12: the deck washed down, as a role ----
  sea('sjark'); crew(3);
  t.eq(rolesOf(workAssign()), '', 'på sjøen uten skittent dekk, uten måltid og uten kulde: ingen roller');
  const A0 = shape(workAssign());
  b.deckT = S.t - 1; t.eq(rolesOf(workAssign()), '', 'minuttet etter at sløyingen stoppet: ikke ennå (hun kan være midt mellom to fisker)');
  b.deckT = S.t - WASH.after; let A = workAssign();
  t.eq(rolesOf(A), 'c:pause:kost c:pause:spyl', 'når dekksarbeidet har stoppet: én av de ledige spyler, og med tre eller flere ledige skrubber en til (du tas sist)');
  t.eq(shape(A), A0, 'ingen bytter stasjon, og pausen de hadde, står i tallene som før');
  t.eq([K.workDoing({st:'pause', role:'spyl', idle:'coffee'}), K.workDoing({st:'pause', role:'kost', idle:'look'})], ['Spyler dekket', 'Skrubber dekket'], 'Mannskap-siden sier hva de gjør');
  const wm = K.washMin(); t.ok(wm >= 6 && wm <= 16, 'spylingen tar 6–16 minutter etter båtens lengde', wm);
  b.deckT = S.t - WASH.after - wm + 1; t.ok(/spyl/.test(rolesOf(workAssign())), 'i det siste minuttet av spylingen spyles det fortsatt');
  b.deckT = S.t - WASH.after - wm; t.eq(rolesOf(workAssign()), '', 'etter det er dekket rent, og rollene er borte');
  // (fish still to gut: the deck is worked on, nobody washes it)
  b.deckT = S.t - WASH.after; S.hold = [{sp:'torsk', cls:1, kg:300, n:80, bled:true, iced:false, gut:false, hr:0, fresh:95, hook:true}];
  A = workAssign(); t.ok(A.some(p => p.st === 'sloy') && !/spyl|kost/.test(rolesOf(A)), 'mens noen sløyer, spyler ingen', [A.map(p => p.st), rolesOf(A)]); S.hold = [];
  S.crew.forEach(c => { c.fatigue = 95; }); t.eq(rolesOf(workAssign()), 'me:pause:spyl', 'de som er utslitt, får være; da spyler du selv'); S.crew.forEach(c => { c.fatigue = 10; });
  crew(1); t.eq(rolesOf(workAssign()), 'c:pause:spyl', 'med to ledige spyler én, og ingen skrubber'); crew(3);
  // (under way on a boat with a house the crew are inside: Jonas 03.10 and 21.10.2026)
  b.status = 'sailing'; b.v = 8; b.dest = {x:b.pos.x + 5, y:b.pos.y}; A = workAssign(); t.ok(A.some(p => p.st === 'ror') && !/spyl|kost/.test(rolesOf(A)), 'under fart på en båt med hus er mannskapet inne: ingen spyler', [A.map(p => p.st), rolesOf(A)]); b.status = 'idle'; b.v = 0; b.dest = null;
  b.status = 'aground'; t.eq(rolesOf(workAssign()), '', 'på grunn spyler ingen'); b.status = 'idle';
  sea('skiff'); t.eq(K.workDoing({st:'pause', role:'spyl'}), 'Skyller og skrubber dørken', 'en åpen båt uten slange: pøs og kost');

  // ---- F13: the packed lunch on a boat with no galley ----
  sea('snekke'); crew(1); const meal = () => JSON.stringify(S.meal);
  S.meal = {due:S.t + 300, cook:null, hist:[2], last:{t:S.t - 1, q:2, by:null, nm:'middag'}}; const m0 = meal(); A = workAssign();
  t.eq(rolesOf(A), 'c:pause:mat me:pause:mat', 'matpakka er kommet fram (snekka har ikke bysse): de ledige spiser');
  t.eq(meal(), m0, 'måltidets tall er urørt');
  t.eq(K.workDoing({st:'pause', role:'mat', idle:'look'}), 'Spiser matpakka', 'Mannskap-siden: matpakka først');
  S.meal.last.t = S.t - WASH.lunch; t.eq(K.workDoing({st:'pause', role:'mat', idle:'look'}), 'Drikker kaffe fra termosen', 'så kaffen');
  S.meal.last.t = S.t - WASH.eat; t.eq(rolesOf(workAssign()), '', 'etter tolv minutter er maten ryddet bort');
  S.meal.last.t = S.t - 1; b.deckT = S.t - WASH.after; t.eq(rolesOf(workAssign()), 'c:pause:mat me:pause:mat', 'maten går foran spylingen');
  b.deckT = null; b.status = 'port'; b.port = 'husoy'; b.moorT = S.t - 90; t.eq(rolesOf(workAssign()), '', 'ved kai spiser de i land');
  sea('sjark'); crew(3); S.meal = {due:S.t + 300, cook:null, hist:[4], last:{t:S.t - 1, q:4, by:null, nm:'middag'}};
  t.eq(rolesOf(workAssign()), '', 'en båt med kokeplate eller bysse spiser inne: ingen matpakke på dekk'); S.meal = null;

  // ---- F14: the cold ----
  sea('sjark'); crew(3); let frys = 0, bad = [], n0 = 0;
  for (let i = 0; i < 40; i++){ S.t += 11; COLD = 0; n0 += workAssign().filter(p => p.role === 'frys').length; S.t += 1; COLD = 0.3;   // (idleEnv is kept for the minute)
    for (const p of workAssign()) if (p.role === 'frys'){ frys++; if (p.st !== 'pause' || !{look:1, lean:1, back:1}[p.idle]) bad.push(p.st + ':' + p.idle); } }
  t.ok(n0 === 0, 'uten kulde fryser ingen', n0);
  t.ok(frys > 0, 'når kulda koster, slår noen av dem som står stille på pause, floke', frys);
  t.ok(!bad.length, 'bare de som har pause og står stille (ser utover, lener seg), aldri en som arbeider' + (bad.length ? ': ' + bad.join(' ') : ''));
  t.eq(K.workDoing({st:'pause', role:'frys', idle:'look'}), 'Slår floke for å holde varmen', 'Mannskap-siden sier det');
  COLD = 0;

  // ---- the places on each boat ----
  const noHose = [], hoseBad = [], kostBad = [], clip = [], matBad = [], frysBad = [];
  for (const vt of BOATS){ const V = VESSELS[vt]; sea(vt); crew(Math.min(3, V.crewMax || 1)); if (!CREW3D.on()){ t.ok(false, vt + ' har dekkskart og mannskap på dekk'); continue; }
    const ST = CREW3D._st; S.pgear = K.newPGear(); b.deckT = S.t - WASH.after; S.t += 0.4; settle(); const M = ST.M, PT = ST.PT, ag = r => CREW3D.agents().find(a => a.role === r && a.goal);
    const sp = [PT.sloy, PT.is, PT.haling].find(q => q && q.k != null && ST.M0.ok(q.k)), T = sp ? ST.M0.at(sp.k) : null, G = ST.G, wy = G.work ? G.work.table[1] : (G.deck || {}).y;
    const under = !!(PT.sloy && M.ok(PT.sloy.k) && wy != null && Math.abs(M.at(PT.sloy.k)[1] - wy) > 0.5);
    const h = ag('spyl');
    if (under){ if (!h || !h.goal.inside) noHose.push(vt + ':sløyeplassen er under dekk, så spylingen skal være ute av syne'); }
    else if (!h || h.goal.inside || h.goal.task !== 'hose' || !T) noHose.push(vt + ':' + (h ? h.goal.task + (h.goal.inside ? ' (inne)' : '') : 'ingen'));
    else { const p = M.at(h.goal.k), dd = Math.hypot(p[0] - T[0], p[2] - T[2]); if (dd < 1.2 || dd > 2.6) hoseBad.push(vt + ':' + dd.toFixed(2) + ' m fra sløyeplassen'); if (Math.abs(p[1] - T[1]) > 0.2) hoseBad.push(vt + ':på et annet dekk');
      let dh = Math.atan2(T[0] - p[0], -(T[2] - p[2])) - h.goal.h; while (dh > Math.PI) dh -= 2 * Math.PI; while (dh < -Math.PI) dh += 2 * Math.PI; if (Math.abs(dh) > 0.05) hoseBad.push(vt + ':vendt ' + dh.toFixed(2) + ' rad fra sløyeplassen'); }
    const ko = ag('kost'); if (ko && !ko.goal.inside && ko.goal.task === 'sweep' && h && !h.goal.inside){ const p = M.at(ko.goal.k), q = M.at(h.goal.k); if (Math.hypot(p[0] - q[0], p[2] - q[2]) < 1.1) kostBad.push(vt + ':oppå den som spyler');
      let da = Math.atan2(p[0] - q[0], -(p[2] - q[2])) - h.goal.h; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI; if (Math.hypot(p[0] - q[0], p[2] - q[2]) <= 2.2 && Math.abs(da) < 0.8) kostBad.push(vt + ':i strålen (' + da.toFixed(2) + ' rad fra den)'); }
    for (const c of CREW3D.clipNow() || []) if (c.n > 0 && ['hose', 'sweep'].includes(c.task)) clip.push(vt + ':' + c.task + ':' + c.n + '[' + c.segs.join('.') + ']');
    // the cold, where the break has them
    b.deckT = null; COLD = 0.3; let seen = 0; for (let i = 0; i < 30 && !seen; i++){ S.t += 12; settle(); for (const a of CREW3D.agents()) if (a.role === 'frys' && a.goal && !a.goal.inside){ if (a.goal.task === 'cold') seen++; }
      for (const c of CREW3D.clipNow() || []) if (c.n > 0 && c.task === 'cold') clip.push(vt + ':cold:' + c.n + '[' + c.segs.join('.') + ']'); }
    if (!seen) frysBad.push(vt); COLD = 0;
    // the packed lunch (the boats with no galley)
    if (((V.fac || {}).galley) === 'none'){ S.meal = {due:S.t + 300, cook:null, hist:[2], last:{t:S.t - 1, q:2, by:null, nm:'middag'}}; S.t += 0.2; settle();
      const E = CREW3D.agents().filter(a => a.role === 'mat' && a.goal && !a.goal.inside); if (!E.length) matBad.push(vt + ':ingen spiser på dekk');
      for (const a of E){ if (!['sitmat', 'lunch'].includes(a.task)) matBad.push(vt + ':' + a.task); }
      const k0 = E.map(a => a.goal.k).join(','); for (const c of CREW3D.clipNow() || []) if (c.n > 0 && ['sitmat', 'lunch'].includes(c.task)) clip.push(vt + ':' + c.task + ':' + c.n);
      S.meal.last.t = S.t - WASH.lunch - 0.5; CREW3D.tick(0.05); for (const a of E) if (!['sitkaffe', 'coffee'].includes(a.task)) matBad.push(vt + ':etter maten ' + a.task);
      if (E.map(a => a.goal.k).join(',') !== k0) matBad.push(vt + ':byttet plass mellom maten og kaffen'); S.meal = null; }
  }
  t.ok(!noHose.length, 'én spyler der fisken ble sløyd, på hver båt (F12)' + (noHose.length ? ': ' + noHose.join(' ') : ''));
  t.ok(!hoseBad.length, 'en strålelengde (1,2–2,6 m) fra sløyeplassen, på samme dekk, vendt mot den' + (hoseBad.length ? ': ' + hoseBad.join(' ') : ''));
  t.ok(!kostBad.length, 'den som skrubber, har egen plass utenfor strålen' + (kostBad.length ? ': ' + kostBad.join(' ') : ''));
  t.ok(!matBad.length, 'på båtene uten bysse spiser de på dekk, matpakka først og kaffen etterpå på samme plass (F13)' + (matBad.length ? ': ' + matBad.join(' ') : ''));
  t.ok(!frysBad.length, 'kulda synes: minst én slår floke der pausen har ham (F14)' + (frysBad.length ? ': ' + frysBad.join(' ') : ''));
  t.ok(!clip.length, 'ingen lem gjennom modellen i spylingens, matens og kuldas stillinger' + (clip.length ? ': ' + clip.join(' ') : ''));
}
