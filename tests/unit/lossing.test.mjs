// OB4 (steg 82, docs/planer/om-bord.md F10, F11, F22, F23; Jonas 09.11.2026: «at arbeidet ombord utføres på en så ekte måte som mulig,
// at mannskapet oppfører seg som ekte mennesker ... at ingenting clipper inn i andre ting»): the boat's own hands at the quay. The core's
// part: the side to the quay (07-harbours.js berthPose, a boat whose crane stands to port lies with her port side to the quay) and the
// roles while she lands, takes ice or works her own crane (13-work.js quayRoles), with nobody moved between the stations and nothing
// of the landing's time changed. The view's part, on each boat's own model without a browser (deckcrew.js over vessel3d.js deckMap):
// the plant's tubs on clear deck open to the sky, the one who hooks on beside the tub and not on the quay's side of it, the one who
// gives the signs at the rail to the quay, the one at the ice box, the crane driver by the crane, and no limb through anything.
export const scripts = ['js/vessel3d.js', 'js/deckcrew.js'];
export const data = true;

export default function (t){
  const K = t.K; K.set('S', K.newState()); const S = K.get('S'), {VESSELS, CREW3D, applyVessel, genCrew, workAssign, LANDING} = K, b = S.boat;
  K.set('hsWork', () => 0.3); K.set('hsAt', () => 0.3);
  const BOATS = ['snekke', 'plastsjark', 'sjark', 'hurtigsjark', 'sjarkny', 'breisjark', 'kyst15', 'kyst21'];
  const settle = () => { const ST = CREW3D._st; ST.ctxT = -1e9; ST.lastSim = null; CREW3D.tick(0.05); ST.ctxT = -1e9; CREW3D.tick(0.05); };
  const crew = n => { S.crew = [...Array(n).keys()].map(() => Object.assign(genCrew(), {bi:false, off:false, sleepW:false, fatigue:10, morale:62, traits:[]})); S.me = S.cur; };
  const quay = vt => { S.tut = 0; b.type = vt; applyVessel(); CREW3D.reset(); b.status = 'port'; b.port = 'husoy'; b.berth = 'main'; b.gop = null; b.land = null; b.iceUntil = 0; b.moorT = S.t - 90; b.castT = null; b.shift = null; S.plan = null; S.jobs = []; S.cargo = []; S.hold = []; b.deckStop = false; S.rest = null; };
  const land = (own, n) => { b.land = {pid:'husoy', t0:S.t, until:S.t + LANDING.prep + n * LANDING.lift * (own ? 2 : 1) + LANDING.note, kind:'tub', n, lifts:own ? 2 * n : n, kg:n * 400, ops:false, own, wash:own ? LANDING.wash : 0}; };
  const rolesOf = A => A.filter(p => p.role).map(p => (p.c ? 'c' : 'me') + ':' + p.st + ':' + p.role).sort().join(' ');
  S.lang = 'no'; S.t = 12 * 60 + 600000;

  // ---- F22: the side to the quay ----
  const sideBad = [];
  for (const vt of Object.keys(VESSELS)){ const bp = K.berthPose('husoy', vt), want = VESSELS[vt].quay === -1 ? -1 : 1; if (!bp) continue;
    const f = bp.face, qd = (Math.cos(bp.hd) * -f.nx + Math.sin(bp.hd) * -f.nz) * want;   // (starboard of her is (cos hd, sin hd); the quay lies against the face's way out)
    if (bp.side !== want || !(qd > 0.99)) sideBad.push(vt + ':' + bp.side + ':' + qd.toFixed(2)); }
  t.ok(!sideBad.length, 'berthPose gir siden mot kaia (side), og kaia ligger på den siden av båten' + (sideBad.length ? ': ' + sideBad.join(' ') : ''));
  const bs = K.berthPose('husoy', 'sjark'), bn = K.berthPose('husoy', 'sjarkny');
  t.ok(bs && bn, 'Husøy har kaiplass for havsjarken og den nye hurtigsjarken');
  if (bs && bn){
    t.eq([bs.side, bn.side], [1, -1], 'havsjarken ligger med styrbord mot kaia, den nye hurtigsjarken (kranen i babord hekk) med babord');
    const fs = bs.face, fn = bn.face, along = (bs.fwd.x * fs.ux + bs.fwd.z * fs.uz) * (bn.fwd.x * fn.ux + bn.fwd.z * fn.uz);
    t.ok(along < -0.99, 'de to ligger hver sin vei langs den samme kaia', along);
    const off = bp => (bp.x * 1000 - bp.face.x) * bp.face.nx + (bp.y * 1000 - bp.face.z) * bp.face.nz - bp.Bb / 2;
    t.ok(Math.abs(off(bs) - off(bn)) < 0.01, 'og like langt ut fra kaifronten (halve bredden og fenderne)', [off(bs), off(bn)]); }
  t.eq(['sjarkny', 'kyst15', 'kyst21', 'hurtigsjark', 'sjark'].map(v => K.berthSide(v)), [-1, -1, -1, 1, 1], 'kranbåtene med kranen om babord (sjarkny, kyst15, kyst21) legger babord til; den brukte hurtigsjarken (kranen om styrbord) og båtene uten kran styrbord');

  // (the field against the models: a knuckle-boom crane on her port side, kit.crane, asks for the port side to the quay, and only that)
  const fieldBad = []; for (const vt of Object.keys(VESSELS)){ const G = K.geoOf(vt), C = G && G.kit && G.kit.crane, port = !!(C && C.at && C.at[0] < -0.5); if (port !== (VESSELS[vt].quay === -1)) fieldBad.push(vt + ':' + (C && C.at ? C.at[0].toFixed(2) : 'ingen kran') + ':' + VESSELS[vt].quay); }
  t.ok(!fieldBad.length, 'feltet quay i VESSELS stemmer med hvor dekkskranen står i modellen (babord: -1)' + (fieldBad.length ? ': ' + fieldBad.join(' ') : ''));

  // ---- F10, F11, F23: the roles, and nothing else changed ----
  quay('sjark'); crew(3); let A0 = workAssign().map(p => p.st + ':' + (p.idle || '')).join(' ');
  t.eq(rolesOf(workAssign()), '', 'ved kai uten lossing og is: ingen roller');
  land(false, 3); const until = b.land.until; let A = workAssign();
  t.eq(rolesOf(A), 'c:pause:hekt c:pause:luke', 'under lossing: én av mannskapet hekter på, én gir tegn (du er den siste som tas)');
  t.eq(A.map(p => p.st + ':' + (p.idle || '')).join(' '), A0, 'ingen bytter stasjon, og pausen de hadde, står i tallene som før');
  t.eq(b.land.until, until, 'lossingen tar den tida kjernen sa');
  t.eq([K.workDoing({st:'pause', role:'hekt', idle:'coffee'}), K.workDoing({st:'pause', role:'luke'}), K.workDoing({st:'pause', role:'isrom'}), K.workDoing({st:'last', role:'kran'})], ['Hekter på karene', 'Gir tegn til kranføreren', 'Tar imot isen', 'Kjører kranen'], 'Mannskap-siden sier hva de gjør');
  b.iceUntil = S.t + 5; t.eq(rolesOf(workAssign()), 'c:pause:hekt c:pause:isrom c:pause:luke', 'kommer det is samtidig, tar den tredje imot den');
  b.land = null; t.eq(rolesOf(workAssign()), 'c:pause:isrom', 'bare is: én tar imot den');
  b.iceUntil = 0; land(false, 3); S.t = b.land.t0 + LANDING.prep + 3 * LANDING.lift + 0.5; t.eq(rolesOf(workAssign()), '', 'når siste kar er oppe, er rollene borte (sluttseddelen ventes)'); S.t = b.land.t0;
  S.crew.forEach(c => { c.fatigue = 95; }); t.eq(rolesOf(workAssign()), 'me:pause:hekt', 'de som er utslitt, får være; da hekter du på selv');
  crew(0); land(false, 2); t.eq(rolesOf(workAssign()), 'me:pause:hekt', 'alene om bord: du hekter på selv');
  b.iceUntil = S.t + 5; t.eq(rolesOf(workAssign()), 'me:pause:hekt', 'alene med lossing og is: karene først');
  quay('sjarkny'); crew(3); S.cargo = [{tur:'t1', kg:500, no:'proviant', en:'provisions'}]; S.jobs = [{kind:'last', crew:true, h:2, until:S.t + 120, no:'Lasting av proviant', en:'Loading the provisions'}];
  A = workAssign(); t.eq(rolesOf(A).replace(/(c|me):/g, ''), 'last:hekt last:kran', 'frakt med egen kran: én kjører kranen, én hekter på', A.map(p => p.st));
  t.eq(K.workDoing({st:'last', role:'hekt'}), 'Hekter på og av', 'og Mannskap-siden sier det');

  // ---- the places on each boat ----
  const noSlot = [], slotBad = [], noHekt = [], hektBad = [], noLuke = [], lukeBad = [], noIs = [], clip = [], kranBad = [], dynBad = [];
  for (const vt of BOATS){ const V = VESSELS[vt]; quay(vt); crew(Math.min(3, V.crewMax || 1)); if (!CREW3D.on()){ t.ok(false, vt + ' har dekkskart og mannskap på dekk'); continue; }
    const ST = CREW3D._st, sd = K.berthSide(vt), own = !!V.kar; S.jobs = []; S.cargo = [];
    S.pgear = K.newPGear(); land(own, 2); b.iceUntil = S.t + 30; S.t += 0.4; settle(); const M = ST.M, M0 = ST.M0, G = ST.G;
    // the tubs
    const Ls = CREW3D.landSlots(); if (!own){ if (!Ls.length) noSlot.push(vt);
      for (const q of Ls){ if (M0.hit([q[0], q[1] + 9, q[2]], [q[0], q[1] + 0.14, q[2]]) >= 0) slotBad.push(vt + ':noe over karet'); const f = M0.floorAt(q[0], q[2]); if (!(Math.abs(f - q[1]) < 0.09)) slotBad.push(vt + ':ikke på dørken'); if (M.ok(M.cellOf(q[0], q[2]))) slotBad.push(vt + ':karet er ikke ute av gangkartet'); }
      if (Ls.length > 1 && Math.hypot(Ls[0][0] - Ls[1][0], Ls[0][2] - Ls[1][2]) < 1.0) slotBad.push(vt + ':to kar i hverandre'); }
    const T = own ? (G.kit.tubs || [])[0] : Ls[0], ag = r => CREW3D.agents().find(a => a.role === r && a.goal && !a.goal.inside);
    // the one who hooks on
    const h = ag('hekt'); if (!h || h.goal.task !== 'unhook' || !T) noHekt.push(vt + ':' + (h ? h.goal.task : 'ingen'));
    else { const p = M.at(h.goal.k), dd = Math.hypot(p[0] - T[0], p[2] - T[2]); if (dd > 1.45 || dd < 0.55) hektBad.push(vt + ':' + dd.toFixed(2) + ' m fra karet'); if ((p[0] - T[0]) * sd > 0.45 && !own) hektBad.push(vt + ':på kaisiden av karet'); }
    // the one who gives the signs (two free at least: the snekke has one hand and you)
    const l = ag('luke'); if (S.crew.length < 2){ if (l) noLuke.push(vt + ':isen skulle gått foran tegnene med to om bord'); }
    else if (!l || l.goal.task !== 'signal') noLuke.push(vt + ':' + (l ? l.goal.task : 'ingen'));
    else { const p = M.at(l.goal.k); if (p[0] * sd <= 0) lukeBad.push(vt + ':ikke på siden mot kaia'); if (h && h.goal.k === l.goal.k) lukeBad.push(vt + ':samme plass'); if (h && Math.hypot(p[0] - M.at(h.goal.k)[0], p[2] - M.at(h.goal.k)[2]) < 0.8) lukeBad.push(vt + ':oppå den som hekter'); }
    // the ice (the third free hand, where she has three)
    const B = CREW3D.iceBox(), ic = ag('isrom'); { if (!ic || !ic.goal.ice || !B) noIs.push(vt + ':' + (ic ? ic.goal.task : 'ingen')); else { const p = M.at(ic.goal.k), dd = Math.hypot(p[0] - B[0], p[2] - B[2]); if (dd > 1.3) noIs.push(vt + ':' + dd.toFixed(2) + ' m fra iskassa'); } }
    for (const c of CREW3D.clipNow() || []) if (c.n > 0 && ['unhook', 'signal', 'nozzle', 'tend', 'look'].includes(c.task)) clip.push(vt + ':' + c.task + ':' + c.n + '[' + c.segs.join('.') + ']');
    // the pose follows the hook: hooking on with the hook down at the tub, the signs while the crane moves
    if (h){ const L0 = b.land, at = u => { S.t = L0.t0 + LANDING.prep + u * LANDING.lift; CREW3D.tick(0.05); return [h.task, l ? l.task : '-'].join('+'); };
      const got = [at(0.36), at(0.5), at(0.8)].join(' '); if (got !== (l ? 'unhook+look guide+signal tend+look' : 'unhook+- guide+- tend+-')) dynBad.push(vt + ':' + got); S.t = L0.t0 + 0.4; }
    // her own crane on the freight
    if (V.crane > 0 && G.kit && G.kit.crane){ b.land = null; b.iceUntil = 0; S.cargo = [{tur:'t1', kg:500, no:'proviant', en:'provisions'}]; S.jobs = [{kind:'last', crew:true, h:2, until:S.t + 120, no:'Lasting av proviant', en:'Loading the provisions'}]; S.t += 1; settle();
      const kr = CREW3D.agents().find(a => a.role === 'kran'), hk = CREW3D.agents().find(a => a.role === 'hekt');
      if (!kr || !kr.goal || kr.goal.inside || kr.goal.task !== 'remote') kranBad.push(vt + ':ingen kjører kranen');
      else { const p = M.at(kr.goal.k), c = G.kit.crane.at, dd = Math.hypot(p[0] - c[0], p[2] - c[2]); if (dd > 2.4 || dd < 0.8) kranBad.push(vt + ':føreren ' + dd.toFixed(2) + ' m fra kranfoten'); }
      if (!hk || !hk.goal || hk.goal.inside) kranBad.push(vt + ':ingen hekter på'); else if (kr && kr.goal && kr.goal.k === hk.goal.k) kranBad.push(vt + ':samme plass');
      for (const c of CREW3D.clipNow() || []) if (c.n > 0 && ['unhook', 'remote'].includes(c.task)) clip.push(vt + ':' + c.task + ':' + c.n); }
  }
  t.ok(!noSlot.length, 'mottakets kar har plass på dekket på hver båt med rom' + (noSlot.length ? ': ' + noSlot.join(' ') : ''));
  t.ok(!slotBad.length, 'karene står på dørken, ute av gangkartet, uten noe over seg (kroken kommer rett ned) og ikke i hverandre' + (slotBad.length ? ': ' + slotBad.join(' ') : ''));
  t.ok(!noHekt.length, 'én står ved karet og hekter på (F10)' + (noHekt.length ? ': ' + noHekt.join(' ') : ''));
  t.ok(!hektBad.length, 'innen rekkevidde av karet, ikke i det, og ikke på kaisiden der karet svinger ut' + (hektBad.length ? ': ' + hektBad.join(' ') : ''));
  t.ok(!noLuke.length, 'én gir tegn til kranføreren (F10)' + (noLuke.length ? ': ' + noLuke.join(' ') : ''));
  t.ok(!lukeBad.length, 'ved rekka mot kaia, på egen plass' + (lukeBad.length ? ': ' + lukeBad.join(' ') : ''));
  t.ok(!noIs.length, 'én står ved iskassa og tar imot isen (F11)' + (noIs.length ? ': ' + noIs.join(' ') : ''));
  t.ok(!dynBad.length, 'stillingen følger kroken: hekter på når kroken er nede, gir tegn mens kranen går' + (dynBad.length ? ': ' + dynBad.join(' ') : ''));
  t.ok(!kranBad.length, 'egen kran (F23): én kjører den ved kranfoten, én hekter på ved frakten' + (kranBad.length ? ': ' + kranBad.join(' ') : ''));
  t.ok(!clip.length, 'ingen lem gjennom modellen i lossingens, isens og kranens stillinger' + (clip.length ? ': ' + clip.join(' ') : ''));
}
