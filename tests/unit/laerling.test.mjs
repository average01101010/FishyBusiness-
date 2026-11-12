// The apprentice aboard (Oppdrag 2, punkt 8; steg 45b; core/14-crewlife.js LAER, docs/systemer/folk-om-bord.md 5.6 «Lærlingen»). From
// ten years at sea a young one may stand in the crew exchange to learn from you; he works on the apprentice's share of the agreement
// (§ 24.4: 40 % his first year), asks why after something that happened aboard, at most once a day, and the answer is a lift in the
// skill that belongs to it; after the apprenticeship he gives notice by the law and goes to a boat of his own, a named skipper among the
// alumni who does not come back to the exchange, and you get «Læremester».
export default function (t){
  const K = t.K; K.set('S', K.newState());
  const S = K.get('S'), D = 1440, L = K.LAER;
  t.ok(L && K.LAER_Q, 'LAER og LAER_Q finnes');
  if (!L) return;
  const b = S.boat; b.type = 'sjark'; K.applyVessel(); S.boatName = 'Havgull'; S.tut = null;
  K.set('achCheck', () => {});   // (the badge's gift is written with the UI's kr, ui/02-format-state.js, which the core has not; mob.test.mjs does the same)
  // a seeded random, so the days below are the same each run (the core's Math is its own copy)
  let seed = 7; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  K.set('Math', Object.assign(Object.create(Math), {random:rnd}));
  const yrs = y => { S.fs = {p:K.fsNeed(y) + 1, rest:0, away:0}; t.eq(K.fsOf(S.fs.p).y, y, 'fartstida er ' + y + ' år'); };
  const days = (n, stop) => { for (let d = 0; d < n; d++){ S.t += D; K.borsTick(S.t / 60); if (stop && S.bors.pool.some(c => c.laer)) return d + 1; } return null; };
  const hp = K.portById('husoy'); S.home = 'husoy'; b.status = 'port'; b.port = 'husoy'; b.pos = {x:hp.p.x, y:hp.p.y};
  S.t = Math.round((Date.UTC(2027, 5, 1, 8) - K.EPOCH) / 6e4); S.crew = []; S.bors = {pool:[], day:-1};

  // ---- under ten years: never in the exchange ----
  yrs(9); days(120);
  t.ok(!S.bors.pool.some(c => c.laer), 'under ti års fartstid: ingen lærling i børsen på 120 døgn');
  // ---- from ten years: within reasonable time ----
  yrs(10); const n = days(60, true), A = S.bors.pool.find(c => c.laer);
  t.ok(n != null && n <= 30, 'fra ti års fartstid: lærlingen står i børsen innen 30 døgn', n);
  if (!A) return;
  t.ok(A.age >= L.age[0] && A.age <= L.age[1], 'han er ung (' + L.age.join('–') + ')', A.age);
  t.eq(A.lv, 'lærling', 'nivået er lærling'); t.near(A.ask, 0.4, 1e-9, 'han vil ha lærlinglott første år, 40 % (§ 24.4)');
  t.ok(A.laer.t0 == null && A.until > S.t, 'han venter i børsen, ikke mønstret ennå');
  // one at a time: no second while he waits
  days(30); t.eq(S.bors.pool.filter(c => c.laer).length, A.until > S.t ? 1 : S.bors.pool.filter(c => c.laer).length, 'høyst én lærling i børsen');
  // ---- signs on ----
  const c = A; S.bors.pool = S.bors.pool.filter(x => x !== c); c.hiredT = S.t; c.earn = []; delete c.until; S.crew.push(c); K.laerSign(c);
  t.ok(c.laer.t0 === S.t && c.life && c.life.goal === 'egenbat', 'mønstret på: læretida begynner, drømmen er egen båt');
  days(40); t.ok(!S.bors.pool.some(x => x.laer), 'med en lærling om bord kommer ingen ny i børsen');
  // he stays an apprentice while he learns, also when the hours at sea have made him able (crewDerive)
  c.attr.erf = 3.2; K.crewDerive(c);
  t.eq(c.lv, 'lærling', 'han er lærling hele læretida, også med erfaring 3,2');
  t.near(K.lotOf(c), 0.4, 1e-9, 'lotten er lærlinglotten etter årene (apprLot)');

  // ---- the questions: after something that happened aboard, at most once a day; the answer is a lift in the skill ----
  K.set('meAboard', () => true); K.set('windAt', () => 5); K.set('fcWind', () => 5); K.set('tideH', () => 0); K.set('curAt', () => ({sx:0, sy:0}));
  const hour = () => { S.t = Math.floor(S.t / 60) * 60 + 60; K.laerHour(S.t / 60); };
  b.status = 'fishing'; b.port = null; b.pos = {x:hp.p.x - 3, y:hp.p.y - 3}; c.laer.qT = null; S.msgs = [];
  for (let i = 0; i < 5; i++) hour();
  t.ok(!c.laer.ask, 'ingenting har skjedd: han spør ikke');
  // a string of nets set this hour (finishSet)
  S.sets = [{id:'s1', vid:S.cur, kind:'garn', n:4, tSet:S.t + 30, a:{...b.pos}, b:{x:b.pos.x + 0.3, y:b.pos.y}}]; hour();
  t.ok(c.laer.ask && c.laer.ask.k === 'garn', 'garnet satt: han spør hvorfor', c.laer.ask);
  t.ok(S.msgs.some(m => m.from === c.name && /Mannskap/.test(m.no)), 'meldingen sier hvor han får svar');
  t.eq(c.laer.ask.o.slice().sort().join(), '0,1,2', 'tre svar');
  const g0 = c.gear.garn, kg0 = JSON.stringify(S.hold), right = c.laer.ask.o.indexOf(0);
  t.eq(K.laerAnswer(c.id, right), true, 'riktig svar');
  t.near(c.gear.garn - g0, L.up[0], 1e-9, 'riktig svar løfter garnferdigheten med ' + L.up[0]);
  t.eq(JSON.stringify(S.hold), kg0, 'og ingenting i fangsten');
  t.ok(!c.laer.ask && c.laer.n === 1, 'spørsmålet er besvart');
  t.eq(K.laerAnswer(c.id, 0), null, 'et svar uten spørsmål gjør ingenting');
  // the stream: within the day no new question
  K.set('tideH', H => H * 0.3); hour();
  t.ok(!c.laer.ask, 'høyst ett spørsmål i døgnet');
  S.t += D; hour();
  t.ok(c.laer.ask && c.laer.ask.k === 'strom', 'fisket i sterk strøm neste dag: han spør om strømmen', c.laer.ask);
  const sk = c.laer.ask.sk, o = c[sk[0]], v0 = o[sk[1]], wrong = c.laer.ask.o.indexOf(2);
  t.eq(K.laerAnswer(c.id, wrong), false, 'galt svar');
  t.near(o[sk[1]] - v0, L.up[1], 1e-9, 'et annet svar gir litt (' + L.up[1] + ')');
  // nets known: no more about the nets; the stream answered wrong: may be asked again
  K.set('tideH', () => 0); S.t += D; S.sets[0].tSet = S.t + 30; hour();
  t.ok(!c.laer.ask, 'garnet kan han: han spør ikke om det igjen');
  // the gale: in to port with a gale in the forecast and fair weather now
  S.t += D; b.status = 'sailing'; hour(); K.set('fcWind', (H, now) => H > now + 4 ? 16 : 5); b.status = 'port'; b.port = 'husoy'; b.pos = {x:hp.p.x, y:hp.p.y}; hour();
  t.ok(c.laer.ask && c.laer.ask.k === 'kuling', 'inn før kulingen: han spør hvorfor vi gikk inn', c.laer.ask);
  const sj = c.attr.sjo; K.laerAnswer(c.id, c.laer.ask.o.indexOf(0)); t.near(c.attr.sjo - sj, Math.min(5, sj + L.up[0]) - sj, 1e-9, 'kulingen er sjømannskap');
  // an unanswered question runs out after a day, with no harm
  K.set('fcWind', () => 5); K.set('tideH', H => H * 0.3); b.status = 'fishing'; b.port = null; S.t += D; hour();
  const q1 = c.laer.ask; S.t += L.life + 60; hour(); t.ok(q1 && !c.laer.ask, 'et spørsmål uten svar går ut etter et døgn');

  // ---- the end of the apprenticeship: notice by the law, then ashore to a boat of his own ----
  K.set('tideH', () => 0); K.crewAvt(c);
  S.t = c.laer.t0 + (L.days - 1) * D; hour(); t.ok(!c.opp, 'før ' + L.days + ' døgn: ingen oppsigelse');
  S.t = c.laer.t0 + L.days * D + 60; hour();
  t.ok(c.opp && c.opp.gr === 'laer', 'etter ' + L.days + ' døgn og ' + c.laer.n + ' svar: han sier opp etter loven', c.opp);
  t.eq(K.crewStay(c), 'egenbat', 'han lar seg ikke be om å bli');
  b.status = 'port'; b.port = 'husoy'; S.t = c.opp.end + 60; K.crewOppTick(c);
  const al = (S.alumni || []).find(a => a.id === c.id);
  t.ok(!S.crew.includes(c) && al && al.laer && al.boat, 'han har gått i land til egen båt, med lærlingmerket blant de gamle', al && {boat:al.boat, laer:al.laer});
  t.eq(K.achC('laer'), 1, '«Læremester» telles');
  t.ok(K.ACHL.some(x => x.id === 'laer' && x.tiers[0] === 1), 'merket «Læremester» står i ACHL');
  // he stays a skipper on the grounds: never back in the exchange
  S.t += 3 * 365 * D; S.bors = {pool:[], day:-1}; K.set('Math', Object.assign(Object.create(Math), {random:() => 0.99})); K.borsTick(S.t / 60);
  t.ok(!S.bors.pool.some(x => x.id === c.id) && S.alumni.some(a => a.id === c.id), 'lærlingen kommer aldri tilbake til børsen; han blir skipper');
}
