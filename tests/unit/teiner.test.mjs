// OB1 (steg 70, docs/planer/om-bord.md 4.1; Jonas 09.11.2026: «Jeg tror ikke den trebåten skal kunne holde på med krabbeteiner. Det har den
// åpenbart ikke plass til. Det må i så fall oppdateres i databladet til båten og gjøres slik at spillere ikke kan kjøpe det til den båten
// heller»), the skiff the same (valg 23 A), and the nets drawn by hand on both (valg 21 B). One rule (CLAUDE.md «Én logikk i alle
// kjøpssystemer»): VESSELS rigs is the datasheet, equipFits (fit.rig) and buyGate follow it, and a save that had pots on her loses nothing
// (potsUnfit: the pots ashore at the full price in port, the pot hauler and the crab tank off at the next yard at what they cost).
export default function (t){
  const K = t.K, {VESSELS, EQUIP, POTS, PORTS} = K;
  const S = K.newState(); K.set('S', S);
  const logs = []; K.set('log', no => logs.push(no));
  const kr0 = globalThis.kr; globalThis.kr = n => Math.round(n) + ' kr';   // (the page's money format, ui/02-format-state.js)
  const boat = type => { S.boat.type = type; K.applyVessel(); };

  // ---- the datasheet
  for (const v of ['trebat', 'skiff']){
    t.ok(!VESSELS[v].rigs.includes('teiner'), v + ': databladet har ikke teiner');
    t.ok(VESSELS[v].rigs.includes('garn') && VESSELS[v].rigs.includes('line') && VESSELS[v].rigs.includes('juksa'), v + ': juksa, line og garn står');
    t.ok(!K.equipFits('teinehaler', v) && !K.equipFits('teinehalerLv', v) && !K.equipFits('krabbekar', v), v + ': teinehaleren, trinnene og krabbekaret passer ikke');
    t.ok(/ikke plass til teiner/.test(VESSELS[v].desc.no), v + ': båtbladet sier at det ikke er plass til teiner');
  }
  for (const v of ['snekke', 'plastsjark', 'kyst15', 'snokrabbe']) t.ok(K.equipFits('teinehaler', v), v + ': teinehaleren passer som før');
  t.ok(K.equipFits('krabbekar', 'snekke'), 'snekka kan fortsatt ha krabbekar');

  // ---- buying: the pots, the rig, and the nets by hand
  boat('trebat'); S.boat.status = 'port'; S.equip = {}; S.pgear = K.newPGear(); S.sets = [];
  t.ok(!!K.buyGate('pot'), 'trebåten: teiner kan ikke kjøpes');
  t.ok(/ikke plass til teiner/.test((K.buyGate('pot') || [''])[0]), 'grunnen er at det ikke er plass (' + (K.buyGate('pot') || [''])[0] + ')');
  S.equip.teinehaler = true;
  t.ok(!!K.buyGate('pot'), 'trebåten med teinehaler fra en gammel lagring: teiner kan likevel ikke kjøpes');
  t.ok(!!K.rigBlock('teiner'), 'trebåten med teinehaler fra en gammel lagring kan ikke rigges for teiner');
  S.equip = {};
  t.ok(K.rigHas('garn') && !K.rigBlock('garn'), 'trebåten kan rigges for garn uten garnhaler (for hånd, valg 21 B)');
  t.eq(K.buyGate('net'), null, 'trebåten kan kjøpe garn uten garnhaler');
  t.ok(K.handGear('garn', 'trebat') && K.handGear('garn', 'skiff') && !K.handGear('garn', 'snekke') && !K.handGear('line', 'trebat'), 'garn for hånd bare der ingen garnhaler passer, og aldri line');
  t.ok(K.gearRoom('garn') === VESSELS.trebat.gearMax.garn && K.gearRoom('teine') === 0, 'plass til ' + VESSELS.trebat.gearMax.garn + ' garn og ingen teiner');
  boat('snekke'); S.equip = {};
  t.ok(!K.handGear('garn') && !!K.buyGate('net'), 'snekka trenger fortsatt garnhaler for å kjøpe garn');
  S.equip.teinehaler = true; t.eq(K.buyGate('pot'), null, 'snekka med teinehaler kjøper teiner som før');

  // ---- a save from before: pots and a pot hauler on the wooden boat
  const yard = PORTS.find(p => K.portServices(p).verft), plant = PORTS.find(p => !K.portServices(p).verft && K.portServices(p).mottak);
  t.ok(!!yard && !!plant, 'et verft og et mottak uten verft finnes (' + (yard && yard.id) + ', ' + (plant && plant.id) + ')');
  boat('trebat'); S.cash = 0; S.equip = {teinehaler:true, teinehalerLv:2, krabbekar:true, linehaler:true}; S.pgear = K.newPGear(); S.pgear.pots.big = 6;
  S.boat.status = 'port'; S.boat.port = plant.id; S.boat.berth = 'main';
  S.sets = [{vid:S.cur, kind:'teine', n:6, pot:'big'}];
  t.eq(K.potsUnfit(), 0, 'med teiner i sjøen skjer ingenting (de må kunne trekkes)');
  t.ok(S.pgear.pots.big === 6 && S.equip.teinehaler, 'teinene og haleren står mens teiner er i sjøen');
  S.sets = [];
  S.boat.status = 'sailing';
  t.eq(K.potsUnfit(), 0, 'på sjøen skjer ingenting');
  S.boat.status = 'port';
  const potKr = 6 * POTS.big.price;
  t.eq(K.potsUnfit(), potKr, 'i havn: teinene tas i land og betales tilbake til full pris (' + potKr + ' kr)');
  t.ok(S.pgear.pots.big === 0 && Math.round(S.cash) === potKr, 'ingen teiner om bord, og pengene er på konto');
  t.ok(S.equip.teinehaler && S.equip.krabbekar, 'haleren og krabbekaret står til hun ligger ved et verft');
  t.eq(K.potsUnfit(), 0, 'andre gang i havn: ingenting å betale');
  S.boat.port = yard.id;
  const eqKr = EQUIP.teinehaler.price + EQUIP.teinehalerLv.tiers[1].kr + EQUIP.krabbekar.price;
  t.eq(K.potsUnfit(), eqKr, 'ved verftet: teinehaleren med trinn 2 og krabbekaret tas av og betales tilbake (' + eqKr + ' kr)');
  t.ok(!S.equip.teinehaler && !S.equip.krabbekar && !('teinehalerLv' in S.equip), 'teinehaleren, trinnet og krabbekaret er borte');
  t.ok(S.equip.linehaler, 'linehaleren står');
  t.eq(Math.round(S.cash), potKr + eqKr, 'spilleren har mistet ingenting');
  t.eq(K.potsUnfit(), 0, 'neste time ved verftet: ingenting mer');

  // ---- another boat is not touched
  boat('snekke'); S.equip = {teinehaler:true}; S.pgear = K.newPGear(); S.pgear.pots.big = 4; S.boat.port = yard.id;
  t.eq(K.potsUnfit(), 0, 'snekka beholder teinene og haleren');
  t.ok(S.pgear.pots.big === 4 && S.equip.teinehaler, 'snekka: alt står');
  globalThis.kr = kr0;
}
