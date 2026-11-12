// The small errands (Oppdrag 2, punkt 2; steg 45a; core/14-crewlife.js ERR, docs/systemer/folk-om-bord.md 5.6 «Ærendene»). Jonas
// 30.10.2026: «de må være kontekstualiserte slik at han ikke spør om å dra hjem til feks botnhamn hvis båten ligger i kirkenes». Home only
// within 40 nm of the boat, a call only at a harbour within 20 minutes at her cruising speed, a day off only in a harbour or on the way in;
// «Ikke nå» costs nothing; done, a line in the story and a week of learning a little faster.
export default function (t){
  const K = t.K; K.set('S', K.newState());
  const S = K.get('S'), NM = K.NM, D = 1440, ERR = K.ERR;
  const b = S.boat; b.type = 'sjark'; K.applyVessel(); S.boatName = 'Havgull';
  K.set('crewRand', Math.random);   // (the picks below are drawn many times, so every branch is seen)
  const port = re => K.get('PORTS').find(p => re.test(p.name) && p.mottak);
  const put = (pt, st, dx = 0) => { b.pos = {x:pt.p.x + dx, y:pt.p.y}; b.status = st; b.port = st === 'port' ? pt.id : null; S.plan = null; };
  const mk = home => { const c = K.genCrew(); c.homePort = home; c.hiredT = S.t - 30 * D; c.off = false; c.bi = false; c.morale = 60; K.crewLife(c); return c; };
  const picks = (c, n = 300) => Array.from({length:n}, () => K.errandPick(c)).filter(Boolean);

  // ---- Kirkenes, and a man from Botnhamn: never «home», only what fits where the boat is ----
  // (Kirkenes has no harbour of its own in the game: the boat lies off the town, 69.727 N 30.045 E, and in harbour at Bugøynes, 40 km west)
  const kirk = {id:null, p:K.P(69.727, 30.045)}, bug = port(/^Bugøynes/), botn = K.portById('botnhamn');
  t.ok(bug && botn, 'Bugøynes og Botnhamn finnes');
  const A = mk('botnhamn'); S.crew = [A];
  put(kirk, 'fishing', 3);
  const atKirk = picks(A);
  t.ok(atKirk.every(p => p.k !== 'home'), 'båten ved Kirkenes: ingen «hjem til Botnhamn»', atKirk.slice(0, 3));
  t.ok(atKirk.every(p => !p.port || K.dist(K.portById(p.port).p, b.pos) <= ERR.nm * NM), 'alt ærendet peker på, er innen 40 nm av båten');
  t.ok(atKirk.filter(p => p.k === 'stop').every(p => K.dist(K.portById(p.port).p, b.pos) <= K.errKmMin() * ERR.min + 1e-9), 'et anløp er innen 20 minutter med båtens fart');
  put(bug, 'port'); const offK = picks(A);
  t.ok(offK.length && offK.every(p => p.k === 'off'), 'i havn i Bugøynes: bare fridagen', offK[0]);
  t.ok(offK.every(p => !K.ERR_WHY.offHome.some(w => w[0] === p.why[0])), 'fridagen i Bugøynes er ikke «hjem en dag» (hjemme er langt unna)', offK[0] && offK[0].why);
  put(botn, 'port'); const offB = picks(A);
  t.ok(offB.length && offB.every(p => K.ERR_WHY.offHome.some(w => w[0] === p.why[0])), 'fridagen i Botnhamn er hjemme', offB[0] && offB[0].why);

  // ---- near home: «home» is asked ----
  put(botn, 'fishing', 8);
  const nearHome = picks(A);
  t.ok(nearHome.some(p => p.k === 'home' && p.port === 'botnhamn'), 'innen 40 nm av Botnhamn: «Kan vi gå innom Botnhamn?»', nearHome[0]);

  // ---- the coast (stikkprøven): Bergen, Bodø, Båtsfjord with the man from Botnhamn ----
  for (const re of [/^Bergen/, /^Bodø/, /^Båtsfjord/]){ const pt = port(re) || K.get('PORTS').find(p => re.test(p.name)); if (!pt){ t.ok(false, 'fant ikke ' + re); continue; }
    put(pt, 'fishing', 2); const P = picks(A, 150);
    t.ok(P.every(p => p.k !== 'home' && (!p.port || K.dist(K.portById(p.port).p, b.pos) <= ERR.nm * NM)), pt.name + ': ingen hjem til Botnhamn, bare noe som passer der båten er', P.slice(0, 2).map(p => p.k + ' ' + p.port)); }

  // ---- the ask through crewTick's hour: by day, fair weather, aboard; one open, then none for a week from the same person ----
  put(botn, 'fishing', 8); K.set('meAboard', () => true); K.set('windAt', () => 5); S.tut = null; S.msgs = [];
  const H = Math.floor(S.t / 60 / 24) * 24 + 10; S.t = H * 60; A.hiredT = S.t - 30 * D; A.life.errT = null;
  ERR.p = 1; K.errandHour(H);
  t.ok(A.err && A.err.k, 'han spør', A.err);
  t.ok(S.msgs.some(m => m.from === A.name && /Mannskap/.test(m.no)), 'meldingen sier hvor spørsmålet besvares');
  const m0 = A.morale, sk0 = JSON.stringify(A.gear);
  t.ok(K.errandAnswer(A.id, false) && !A.err, '«Ikke nå»: ærendet er borte');
  t.eq(A.morale, m0, 'nei koster ingen trivsel'); t.eq(JSON.stringify(A.gear), sk0, 'og ingenting annet');
  S.t += 2 * D; K.errandHour(S.t / 60 | 0); t.ok(!A.err, 'han spør ikke igjen samme uke');
  S.t += 6 * D; K.errandHour(Math.floor(S.t / 60 / 24) * 24 + 10); t.ok(!!A.err, 'etter en uke kan han spørre igjen', A.err);

  // ---- yes, and the boat calls in: the line in the story and a week of learning a little faster ----
  A.err = {k:'home', port:'botnhamn', why:['x', 'x'], t0:S.t, ok:false}; const n0 = A.life.story.length;
  t.ok(K.errandAnswer(A.id, true) && A.err.ok, '«Ja»');
  put(botn, 'port'); K.errandHour(S.t / 60 | 0);
  t.ok(!A.err && A.life.story.length === n0 + 1 && /Botnhamn/.test(A.life.story[A.life.story.length - 1][1]), 'lagt til i Botnhamn: linja står i historien hans', A.life.story.slice(-1));
  t.near(K.errandLearn(A), ERR.learn, 1e-9, 'han lærer litt raskere');
  S.t += 7 * D + 1; t.eq(K.errandLearn(A), 1, 'i sju døgn, ikke lenger');

  // ---- not answered and nothing done: it runs out after a day, with no harm ----
  put(kirk, 'fishing', 3); A.err = {k:'stop', port:bug.id, why:['x', 'x'], t0:S.t, ok:false}; const m1 = A.morale;
  S.t += D; K.errandHour(S.t / 60 | 0); t.ok(!A.err && A.morale === m1, 'etter ett døgn løper det ut uten følge');

  // ---- the day off in a harbour: ashore one day ----
  put(bug, 'port'); A.err = {k:'off', port:null, why:['x', 'x'], t0:S.t, ok:false};
  t.ok(K.errandAnswer(A.id, true) && A.off && A.offUntil === S.t + D && !A.err, 'fridagen: i land ett døgn med en gang', {off:A.off, u:A.offUntil - S.t});

  // ---- never in a gale, never on the first trip, never in their first week aboard ----
  const B = mk('botnhamn'); S.crew = [B]; put(botn, 'fishing', 8);
  K.set('windAt', () => 15); K.errandHour(Math.floor(S.t / 60 / 24) * 24 + 10); t.ok(!B.err, 'ikke i kuling');
  K.set('windAt', () => 5); S.tut = {v:2}; K.errandHour(Math.floor(S.t / 60 / 24) * 24 + 10); t.ok(!B.err, 'ikke på første tur'); S.tut = null;
  B.hiredT = S.t - 2 * D; K.errandHour(Math.floor(S.t / 60 / 24) * 24 + 10); t.ok(!B.err, 'ikke den første uka om bord');
  B.hiredT = S.t - 30 * D; K.errandHour(Math.floor(S.t / 60 / 24) * 24 + 22); t.ok(!B.err, 'ikke om kvelden (22)');
  K.errandHour(Math.floor(S.t / 60 / 24) * 24 + 10); t.ok(!!B.err, 'om dagen, i godt vær, etter første uka: ja');
}
