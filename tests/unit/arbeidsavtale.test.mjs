// The employment agreement (Ø11.9, steg 27; core/04-crew.js AVT, docs/systemer/sjofart-og-lover.md kap. 10): skipsarbeidsloven
// LOV-2013-06-21-102 §§ 3-1, 3-2, 5-2, 5-5 and 5-6 as read on Lovdata 12.11.2026, and Jonas' choice the same day (valg 40 A): the law's
// notice in real time on the shared clock, worked out aboard, ashore at the first harbour after it; a notice that runs out with the
// game closed costs nothing but the settlement for the catch aboard (prinsipp 4), and no fines.
export default function (t){
  const K = t.K; K.set('S', K.newState());
  const S = K.get('S'), D = 1440, EPOCH = K.EPOCH;
  const at = (y, m, d, h = 12) => (Date.UTC(y, m, d, h) - EPOCH) / 60000;   // game minutes for a UTC date
  const day = x => { const d = new Date(EPOCH + x * 60000); return d.getUTCDate() + '.' + (d.getUTCMonth() + 1) + '.' + d.getUTCFullYear(); };

  // ---- § 5-2 (1): «regnes fra dato til dato» ----
  t.eq(day(K.avtAddMonths(at(2027, 10, 12), 1)), '12.12.2027', 'én måned fra 12. november er 12. desember');
  t.eq(day(K.avtAddMonths(at(2028, 0, 31), 1)), '29.2.2028', 'fra 31. januar til siste dag i februar (skuddår)');
  t.eq(day(K.avtAddMonths(at(2027, 3, 1), 6)), '1.10.2027', 'seks måneder fra 1. april er 1. oktober');

  // ---- the agreement when someone signs on (§ 3-1), with probation of six months (§ 3-2) ----
  const b = S.boat; b.type = 'sjark'; K.applyVessel(); const pt = K.portById('finnsnes'); b.pos = {x:pt.p.x, y:pt.p.y}; b.status = 'port'; b.port = 'finnsnes';
  S.boatName = 'Havgull'; S.t = at(2027, 3, 1);
  const mk = (nm, share = 1) => { const c = K.genCrew(); c.name = nm; c.attr.erf = 3; K.crewDerive(c); c.share = c.ask = share; c.hiredT = S.t; c.off = false; c.bi = false; c.morale = 60; return c; };   // (the share after crewDerive: one drawn as an apprentice gets the deckhand's share when erf 3 makes them experienced, and the test's share was lost by chance)
  const A = mk('Ola Avtale', 0.9); S.crew = [A];
  const av = K.crewAvt(A);
  t.ok(av.t0 === S.t && av.boat === 'Havgull' && av.share === 0.9, 'avtalen: dagen, båten og lotten', av);
  t.eq(day(av.prove), '1.10.2027', 'prøvetida er seks måneder');
  t.eq(K.crewPos(A)[0], 'Fisker', 'stillingen: fisker'); A.mate = true; t.eq(K.crewPos(A)[0], 'Styrmann', 'styrmannen'); delete A.mate;

  // ---- § 5-2: 14 days on probation, then one month, three for the skipper, two after five years, three after ten ----
  t.eq((K.crewFrist(A, at(2027, 5, 1))[0] - at(2027, 5, 1)) / D, 14, 'i prøvetida er fristen 14 dager');
  t.eq(day(K.crewFrist(A, at(2027, 10, 12))[0]), '12.12.2027', 'etter prøvetida: én måned, dato til dato');
  A.sk = true; t.eq(day(K.crewFrist(A, at(2027, 10, 12))[0]), '12.2.2028', 'skipperen (skipsfører): tre måneder'); delete A.sk;
  t.eq(day(K.crewFrist(A, at(2032, 5, 1))[0]), '1.8.2032', 'etter fem år: to måneder');
  t.eq(day(K.crewFrist(A, at(2037, 5, 1))[0]), '1.9.2037', 'etter ti år: tre måneder');

  // ---- the person gives notice: stays aboard on the share, ashore at the first harbour after the notice ----
  S.t = at(2027, 10, 12, 8); S.msgs = [];
  const o = K.crewNotice(A, 'trivsel');
  t.ok(o && A.opp && day(A.opp.end) === '12.12.2027', 'misfornøyd: sier opp med én måneds frist', A.opp);
  t.ok(S.msgs.some(m => m.from === A.name && /12\.12\.2027/.test(m.no) && /én måned/.test(m.no)), 'meldingen sier dagen og fristen');
  t.eq(K.crewNotice(A, 'krangel'), null, 'en som alt har sagt opp, sier ikke opp igjen');
  S.t = at(2027, 11, 1); t.ok(!K.crewOppTick(A) && S.crew.includes(A), 'før fristen er ute: fortsatt om bord');
  // ---- prinsipp 4: the notice runs out with the game closed and the boat at sea: nothing until the harbour, then only the settlement ----
  b.status = 'fishing'; S.t = at(2027, 11, 13); const cash0 = S.cash, led0 = (S.ledger || []).length;
  t.ok(!K.crewOppTick(A) && S.crew.includes(A), 'fristen ute på sjøen: blir om bord til neste havn');
  b.status = 'port'; t.ok(K.crewOppTick(A) && !S.crew.includes(A), 'i havn etter fristen: går i land');
  const settle = (S.ledger || []).slice(led0).filter(e => /^Oppgjør med /.test(e.no)).reduce((a, e) => a + e.kr, 0);
  t.eq(S.cash - cash0, settle, 'det koster ingenting utover oppgjøret for fangsten om bord (ingen bot, ingen avgift)', {d:S.cash - cash0, settle});
  t.ok(!S.cevt, 'og ingen hendelse om bord');

  // ---- the same through crewTick, the hour the game runs on also when it is closed (catchUp): unhappy 37 hours gives notice, not ashore ----
  const B = mk('Kari Trivsel'); S.crew = [B]; S.t = at(2027, 11, 20); B.hiredT = at(2027, 3, 1); delete B.avt; B.morale = 5; B.low = 36;
  K.set('hsAt', () => 0.4);   // (calm sea; the wave field needs the map, which the core in Node has not loaded)
  K.crewTick(S.t / 60);
  t.ok(S.crew.includes(B) && B.opp && B.opp.gr === 'trivsel', 'trivselen under grensa i 37 timer: oppsigelse med frist, ikke i land i havna', B.opp);
  t.eq(day(B.opp.end), '20.1.2028', 'og fristen er én måned');

  // ---- prinsipp 4 again through crewTick with fish in the hold: the notice runs out at sea with the game closed (catchUp runs crewTick
  // every hour); at the quay she goes, and the cash changes by her share of the catch aboard, the settlement she was owed, and nothing else ----
  globalThis.kr = v => Math.round(v) + ' kr';   // (the settlement's log line formats with ui/02-format-state.js kr, which the core in Node has not loaded)
  const F = mk('Siri Fangst'), G = mk('Geir Fangst'); F.hiredT = G.hiredT = at(2027, 3, 1); delete F.avt; delete G.avt; S.crew = [F, G]; F.morale = G.morale = 60;
  S.t = at(2028, 0, 2); F.opp = {t:at(2027, 11, 2), end:at(2028, 0, 2, 9), gr:'trivsel'}; b.status = 'fishing'; b.pos = {x:pt.p.x, y:pt.p.y};
  S.hold = [{sp:'torsk', kg:400, fresh:1, hook:true, t:S.t}]; F.trip = G.trip = 1;   // (as addCatch leaves them: 05-vessels.js; its log line needs the UI)
  t.ok(K.holdNet() > 0, 'fisk i rommet, og hun var om bord da den ble tatt', K.holdNet());
  for (let h = 0; h < 6; h++){ S.t += 60; K.crewTick(S.t / 60); }
  t.ok(S.crew.includes(F), 'fristen er ute mens båten er på sjøen og spillet lukket: om bord til havna');
  b.status = 'port'; b.port = 'finnsnes'; const cash1 = S.cash, led1 = (S.ledger || []).length; S.t += 60; K.crewTick(S.t / 60);
  const set1 = (S.ledger || []).slice(led1).filter(e => /^Oppgjør med Siri/.test(e.no)).reduce((a, e) => a + e.kr, 0);
  t.ok(!S.crew.includes(F) && S.crew.includes(G), 'første time ved kaia: hun går i land, han blir');
  t.ok(set1 < 0, 'hun får lotten sin av fangsten om bord', set1);
  t.eq(Math.round(S.cash - cash1), Math.round(set1), 'og kassa endres bare med det oppgjøret (ingen bot, ingen avgift)', {d:S.cash - cash1, set1});

  delete globalThis.kr;

  // ---- «La gå nå» for one going to a boat of their own: to the boat, not just ashore ----
  const E = mk('Eli Egen'); E.hiredT = at(2027, 3, 1); delete E.avt; S.crew = [E, G]; K.crewLife(E); E.life.goal = 'egenbat'; E.life.saved = E.life.target; E.opp = {t:S.t, end:S.t + 30 * D, gr:'egenbat'};
  S.alumni = []; K.crewLetGo(E); t.ok(!S.crew.includes(E) && S.alumni.some(a => a.id === E.id), '«La gå nå» for den som skal kjøpe egen båt: hun får båten sin (blant de gamle om bord)');

  // ---- asking them to stay (by agreement, § 5-2 (6)): only when the mood has come back; a boat of their own does not turn back ----
  B.morale = 30; t.eq(K.crewStay(B), 'mood', 'trivselen under 45: hun blir ikke');
  B.morale = 55; t.eq(K.crewStay(B), null, 'trivselen er tilbake: hun trekker oppsigelsen'); t.ok(!B.opp, 'og oppsigelsen er borte');
  B.opp = {t:S.t, end:S.t + D, gr:'egenbat'}; B.morale = 90; t.eq(K.crewStay(B), 'egenbat', 'den som skal kjøpe egen båt, snur ikke'); delete B.opp;

  // ---- the ground when you let someone go (§ 5-5 on probation, § 5-6 otherwise) ----
  const C = mk('Per Prøve'); S.crew = [B, C]; C.hiredT = S.t; delete C.avt;
  t.ok(/prøvetida/.test(K.crewGrunn(C)[0]), 'i prøvetida: tilpasningen til arbeidet (§ 5-5)');
  S.cevt = {type:'pair', a:B.id, b:C.id, topic:'kaffe', t0:S.t}; t.ok(/prøvetida/.test(K.crewGrunn(C)[0]) && /samarbeidet/.test(K.crewGrunn(B)[0]), 'en krangel etter prøvetida: samarbeidet om bord (§ 5-6)');
  S.cevt = null; t.ok(/færre folk/.test(K.crewGrunn(B)[0]), 'ellers: driften (§ 5-6, virksomhetens forhold)');
  S.log = []; const g = K.crewLetGo(C);
  t.ok(g && !S.crew.includes(C) && S.log.some(l => /sagt opp/.test(l.no) && /14 dager/.test(l.no)), 'sagt opp i havn: i land nå, grunnen og fristen i loggen', S.log.slice(-1));

  // ---- one who comes back after a boat of their own: a new agreement without probation (§ 3-2 (3)) ----
  const R = mk('Siv Tilbake'); R.noProve = true; R.hiredT = S.t; delete R.avt; S.crew = [R];
  t.eq(K.crewAvt(R).prove, S.t, 'ingen ny prøvetid for den som har vært i rederiet før');
  t.ok(!K.crewOnProve(R) && day(K.crewFrist(R)[0]) === day(K.avtAddMonths(S.t, 1)), 'og fristen er én måned med en gang');
}
