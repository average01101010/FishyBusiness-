// OB3 (steg 81, docs/planer/om-bord.md F4, F8, F24; Jonas 09.11.2026: «at arbeidet ombord utføres på en så ekte måte som mulig»): setting
// the line and the nets, one hand pays the gear out over the stern and the others hand it to him, nobody stands at the hauler in the
// hauling pose; hauling, the hauler has its hand on every boat (the 15 m and the 21 m boats hauled with nobody there: the hauler stands
// 1.25 and 1.30 m over the deck, and the rule sent them in at 1.2); and the nets aboard stand in tubs on clear deck. The core's part
// (the roles) and the places on each boat's own model (deckcrew.js over vessel3d.js deckMap), without a browser.
export const scripts = ['js/figpose.js', 'js/vessel3d.js', 'js/deckcrew.js'];
export const data = true;

export default function (t){
  const K = t.K; K.set('S', K.newState()); const S = K.get('S'), {VESSELS, CREW3D, applyVessel, genCrew, GROUNDS, workAssign} = K;
  K.set('hsWork', () => 0.3); K.set('hsAt', () => 0.3);   // (no chart in Node: a calm sea)
  const BOATS = ['snekke', 'plastsjark', 'sjark', 'hurtigsjark', 'sjarkny', 'breisjark', 'kyst15', 'kyst21'], g0 = GROUNDS[2].p, b = S.boat;
  const settle = () => { const ST = CREW3D._st; ST.ctxT = -1e9; ST.lastSim = null; CREW3D.tick(0.05); ST.ctxT = -1e9; CREW3D.tick(0.05); };
  const gop = (op, kind) => { b.gop = {op, kind, n:10, done:2, prog:0, a:{...g0}, b:{x:g0.x + 0.2, y:g0.y}, hooksPer:300}; S.t += 40; };
  const noSett = [], noHaul = [], atHauler = [], far = [], clip = [], pace = [], tubsBad = [];
  for (const vt of BOATS){ const V = VESSELS[vt];
    S.tut = 0; S.me = S.cur; b.type = vt; applyVessel(); CREW3D.reset(); if (!CREW3D.on()){ t.ok(false, vt + ' har dekkskart og mannskap på dekk'); continue; }
    S.crew = [...Array(Math.min(3, V.crewMax || 1)).keys()].map(() => Object.assign(genCrew(), {bi:false, off:false, fatigue:10, morale:62}));
    b.status = 'fishing'; b.port = null; b.pos = {...g0}; S.hold = []; b.deckStop = false; S.equip.linehaler = true; S.equip.garnhaler = true;
    for (const kind of ['line', 'garn']){
      // the core: the same people on the hauling station setting as hauling (the pace is theirs, gopUnitMin), but none of them hauls
      gop('haul', kind);
      settle(); const hauler = CREW3D.agents().find(a => a.st === 'haling' && a.role === 'haler');
      if (!hauler || !hauler.goal || hauler.goal.inside || hauler.goal.task !== 'haul') noHaul.push(vt + ':' + kind);
      gop('set', kind); const WA = workAssign().filter(p => p.st === 'haling'), roles = WA.map(p => p.role);
      if (roles.filter(r => r === 'sett').length !== 1 || roles.some(r => r !== 'sett' && r !== 'lang')) noSett.push(vt + ':' + kind + ':' + roles.join('+'));
      // (the pace is the hands' on the station whatever their role: the same with the roles taken away again)
      const u1 = K.gopUnitMin(b.gop, S.t / 60, 0.3), n1 = K.workTeam('haling', 'line').n; if (!(n1 === WA.length && n1 >= 1 && u1 > 0 && u1 < 1e6)) pace.push(vt + ':' + kind + ':' + n1 + '/' + WA.length + ':' + u1);
      // the place: at the stern (or the rail) where the gear goes over, within reach of it, not at the hauler, no limb through anything
      settle(); const a = CREW3D.agents().find(q => q.role === 'sett'), P = CREW3D.setPlan(kind), G = CREW3D._st.G;
      if (!a || !a.goal || a.goal.inside || a.goal.task !== 'sett'){ noSett.push(vt + ':' + kind + ':ingen plass'); continue; }
      const p = CREW3D._st.M.at(a.goal.k), reach = Math.hypot(p[0] - P.ov[0], p[2] - P.ov[2]), dh = Math.hypot(p[0] - G.hauler[0], p[2] - G.hauler[2]);
      if (reach > 1.05) far.push(vt + ':' + kind + ':' + reach.toFixed(2));
      if (dh < 1.2) atHauler.push(vt + ':' + kind + ':' + dh.toFixed(2));
      for (const c of CREW3D.clipNow() || []) if (c.n > 0 && (c.task === 'sett' || c.task === 'gear')) clip.push(vt + ':' + kind + ':' + c.task + ':' + c.n);
      if (CREW3D.agents().some(q => q.st === 'haling' && q.goal && q.goal.task === 'haul')) noSett.push(vt + ':' + kind + ':en står i trekkestilling');
    }
    b.gop = null;
    // the net tubs: one at least, never more than the nets fill, each clear of the others
    for (const n of [5, 30, 100]){ const T = CREW3D.netTubs(n); if (T.length < 1 || T.length > Math.ceil(n / CREW3D.NET_TUB)) tubsBad.push(vt + ':' + n + ':' + T.length);
      for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) if (Math.hypot(T[i][0] - T[j][0], T[i][2] - T[j][2]) < 0.95) tubsBad.push(vt + ':' + n + ':to kar i hverandre'); }
  }
  t.ok(!noSett.length, 'under setting av line og garn betaler én redskapet ut (rollen sett), de andre langer, og ingen står i trekkestilling' + (noSett.length ? ': ' + noSett.join(' ') : ''));
  t.ok(!far.length, 'den som setter, står innen rekkevidde av der redskapet går over (1,05 m)' + (far.length ? ': ' + far.join(' ') : ''));
  t.ok(!atHauler.length, 'og ikke ved haleren' + (atHauler.length ? ': ' + atHauler.join(' ') : ''));
  t.ok(!clip.length, 'ingen lem gjennom modellen for den som setter og den som langer' + (clip.length ? ': ' + clip.join(' ') : ''));
  t.ok(!pace.length, 'de som setter og langer, står på stasjonen Haling og gir settefarten (minst én, og tida per enhet er endelig)' + (pace.length ? ': ' + pace.join(' ') : ''));
  t.ok(!noHaul.length, 'under trekk står det en ved haleren på alle båtene, også der den står høyt (F24)' + (noHaul.length ? ': ' + noHaul.join(' ') : ''));
  t.ok(!tubsBad.length, 'garnkarene: minst ett, aldri flere enn garnet fyller, og ikke i hverandre' + (tubsBad.length ? ': ' + tubsBad.join(' ') : ''));
  // the words on the crew page
  S.lang = 'no'; t.eq(K.workDoing({st:'haling', role:'sett'}), 'Setter over hekken', 'Mannskap-siden sier hva den som setter gjør');
}
