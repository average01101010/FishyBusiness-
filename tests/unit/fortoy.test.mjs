// Making fast and casting off with people (OB2, Jonas 09.11.2026, docs/planer/om-bord.md F1-F3): the short spells round a quay on the
// game's own clock (05-vessels.js moorPhase: 'prep' the fenders out the last 400 m in, 'in' and 'lines' after dock, 'out' casting off,
// also moving to the other quay, 'stow' the fenders and the lines in clear of the quay), and who stands where then (13-work.js): the
// skipper at the helm until she lies made fast, the hands on the lines and the fenders (one on a small boat, two from 10 m), alone you
// make her fast and cast her off yourself, and nobody takes a break on deck while she moves.
export default function (t){
  const K = t.K; K.set('S', K.newState());
  const S = K.get('S'), b = S.boat;
  const crew = n => { const C = []; for (let i = 0; i < n; i++){ const c = K.genCrew(); c.name = ['Ola A', 'Kari B', 'Per C'][i]; c.off = false; c.bi = false; c.sleepW = false; c.idle = null; c.traits = []; c.fatigue = 0; C.push(c); } S.crew = C; S.me = S.cur; };
  const who = () => { const A = K.workAssign(), me = A.find(p => !p.c); return {me:me ? me.st : null, fort:A.filter(p => p.st === 'fort').length, A}; };
  const pt = K.portById('husoy');
  b.type = 'sjark'; K.applyVessel(); crew(3); S.t = 600; b.status = 'sailing'; b.pos = {x:pt.p.x + 1, y:pt.p.y};
  t.ok(K.VESSELS.sjark.len >= 10 && K.VESSELS.snekke.len < 10, 'havsjarken er over 10 m og snekka under', [K.VESSELS.sjark.len, K.VESSELS.snekke.len]);

  // ---- on a route in to the harbour: the fenders out the last 400 m ----
  S.plan = {wps:[{x:pt.p.x + 0.25, y:pt.p.y}, {x:pt.p.x, y:pt.p.y, port:'husoy'}], idx:0};
  b.pos = {x:pt.p.x + 1.2, y:pt.p.y}; t.eq(K.moorPhase(), null, 'på vei inn 1,2 km fra havna: ingen fendere ennå');
  b.pos = {x:pt.p.x + 0.35, y:pt.p.y}; t.eq(K.moorPhase(), 'prep', 'de siste 400 m inn langs ruta: fenderne ut (prep)');
  let W = who(); t.eq([W.me, W.fort], ['ror', 2], 'prep: du ved roret, to på fenderne (havsjarken)');
  S.plan = null;

  // ---- docked: the first minute she is still on her way in, the next the lines go on ----
  K.dock('husoy'); const T = S.t;
  t.eq([K.moorPhase(), b.status], ['in', 'port'], 'dock: kjernen har henne i havn med en gang (ingenting venter), men anløpet er i gang (in)');
  W = who(); t.eq([W.me, W.fort], ['ror', 2], 'inn mot kaia: skipperen ved roret, to gjør klar tauene');
  const rest = W.A.filter(p => p.st === 'pause'); t.ok(rest.length && rest.every(p => p.idle === 'inside'), 'den tredje tar ikke pause på dekket mens hun er i fart: inne', rest.map(p => p.idle));
  S.t = T + 1; W = who(); t.eq([K.moorPhase(), W.me, W.fort], ['lines', 'ror', 2], 'tauene på: skipperen står ved roret til hun ligger fortøyd, to på tauene');
  S.t = T + 2; W = who(); t.eq([K.moorPhase(), W.me === 'ror', W.fort], [null, false, 0], 'fortøyd: ingen ved roret og ingen på tauene');

  // ---- casting off: the hands take the lines in, the skipper at the helm; clear of the quay the fenders and the lines come in ----
  b.status = 'unmooring'; b.castUntil = S.t + K.CAST_MIN;
  W = who(); t.eq([K.moorPhase(), W.me, W.fort], ['out', 'ror', 2], 'kaste loss: skipperen ved roret, to tar inn tauene');
  t.ok(W.A.filter(p => p.st === 'fort').every(p => p.c), 'de på tauene er mannskapet');
  S.t = b.castUntil; b.status = 'sailing'; b.port = null; b.castT = S.t;
  W = who(); t.eq([K.moorPhase(), W.me, W.fort], ['stow', 'ror', 2], 'klar av kaia: fenderne og tauene inn og kveilet før noen går inn (stow)');
  S.t += K.MOOR_STOW; t.eq(K.moorPhase(), null, 'etter et spillminutt er alt inne');

  // ---- alone aboard: at the helm on the way in, on the lines yourself once she lies alongside, and casting off ----
  crew(0); b.status = 'sailing'; S.t = 2000; K.dock('husoy');
  t.eq(who().me, 'ror', 'alene, inn mot kaia: ved roret');
  S.t += 1; t.eq(who().me, 'fort', 'alene, langs kaia: du fortøyer selv');
  S.t += 1; t.ok(who().me !== 'fort', 'alene, fortøyd: ferdig med tauene');
  b.status = 'unmooring'; b.castUntil = S.t + K.CAST_MIN; t.eq(who().me, 'fort', 'alene, kaste loss: du tar inn tauene selv før du tar roret');

  // ---- a small boat: one on the lines ----
  b.type = 'snekke'; K.applyVessel(); crew(2); b.status = 'sailing'; S.t = 3000; K.dock('husoy');
  t.eq(who().fort, 1, 'snekka (under 10 m): én på tauene og fenderne');

  // ---- moving to the other quay in the harbour: out, over and in, and the lines on ----
  b.type = 'sjark'; K.applyVessel(); crew(2); S.t = 4000; b.status = 'port'; b.port = 'husoy'; b.moorT = 0;
  b.shift = {from:'main', to:'bunker', t0:S.t, castUntil:S.t + 1, arriveAt:S.t + 3, until:S.t + 4};
  const ph = []; for (let k = 0; k < 5; k++){ S.t = 4000 + k; ph.push(K.moorPhase()); }
  t.eq(ph, ['out', 'in', 'in', 'lines', null], 'forhaling: tauene inn, over, tauene på, så fortøyd');
  S.t = 4000; W = who(); t.eq([W.me, W.fort], ['ror', 2], 'forhaling, tauene inn: skipperen ved roret, to på tauene');
  S.t = 4001; W = who(); t.eq([W.me, W.fort], ['ror', 2], 'forhaling: noen ved roret mens hun går over (før sto ingen der)');
  // the cook who has started the meal stays at the stove while she makes fast
  // (on the way in: the meal is not cooked in port, 14-crewlife.js mealDue)
  b.shift = null; S.t = 5500; b.status = 'sailing'; b.port = null; crew(3); b.pos = {x:pt.p.x + 0.35, y:pt.p.y}; S.plan = {wps:[{x:pt.p.x + 0.25, y:pt.p.y}, {x:pt.p.x, y:pt.p.y, port:'husoy'}], idx:0};
  S.meal = {due:S.t + 20, cook:{id:S.crew[0].id}, hist:[]};
  W = who(); t.eq([K.moorPhase(), W.A.find(p => p.c === S.crew[0]).st, W.fort], ['prep', 'kokk', 2], 'kokken som har begynt på maten, blir ved komfyren; to andre tar fenderne');
  S.meal = null; S.plan = null;

  // ---- a save from before (no castT, an old moorT): nothing round the quay ----
  b.status = 'port'; b.moorT = 10; b.castT = undefined; S.t = 5000; t.eq(K.moorPhase(), null, 'en gammel lagring i havn: ingen fortøyning i gang');
  b.status = 'sailing'; b.port = null; t.eq(K.moorPhase(), null, 'en gammel lagring på sjøen: ingenting å ta inn');
}
