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
  // (the snekke too, Jonas 09.11.2026, OB6: «Om båten ikke har plass til teiner på en realistisk måte, skal den ikke drive med teiner»)
  for (const v of ['trebat', 'skiff', 'snekke']){
    t.ok(!VESSELS[v].rigs.includes('teiner'), v + ': databladet har ikke teiner');
    t.ok(VESSELS[v].rigs.includes('garn') && VESSELS[v].rigs.includes('line') && VESSELS[v].rigs.includes('juksa'), v + ': juksa, line og garn står');
    t.ok(!K.equipFits('teinehaler', v) && !K.equipFits('teinehalerLv', v) && !K.equipFits('krabbekar', v), v + ': teinehaleren, trinnene og krabbekaret passer ikke');
    t.ok(/ikke plass til teiner/.test(VESSELS[v].desc.no), v + ': båtbladet sier at det ikke er plass til teiner');
  }
  for (const v of ['plastsjark', 'kyst21', 'snokrabbe']) t.ok(K.equipFits('teinehaler', v), v + ': teinehaleren passer som før');
  // (OB16, valg 25 A, Jonas 09.11.2026: as many conical pots as the stacks on deck hold, tools/boats/potplaces.json; the havsjark and
  // kyst15 none)
  for (const v of ['sjark', 'kyst15']){
    t.ok(!VESSELS[v].rigs.includes('teiner') && !K.equipFits('teinehaler', v) && !K.equipFits('krabbekar', v), v + ': ingen teiner, teinehaler eller krabbekar (valg 25 A)');
    t.ok(/ikke plass til kongekrabbeteiner/.test(VESSELS[v].desc.no) && /no room for king crab pots/.test(VESSELS[v].desc.en), v + ': båtbladet sier at det ikke er plass til teinene');
  }
  t.eq(['hurtigsjark', 'sjarkny', 'breisjark', 'kyst21'].map(v => VESSELS[v].gearMax.teine), [6, 21, 6, 30], 'teinene båtene har plass til: 6, 21, 6 og 30 (stablene på dekk)');
  t.ok(K.equipFits('krabbekar', 'plastsjark'), 'plastsjarken kan fortsatt ha krabbekar');

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
  S.equip.teinehaler = true; t.ok(!!K.buyGate('pot'), 'snekka kjøper ikke teiner, heller ikke med en teinehaler fra før');
  boat('plastsjark'); S.equip = {teinehaler:true}; t.eq(K.buyGate('pot'), null, 'plastsjarken med teinehaler kjøper teiner som før');

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
  boat('plastsjark'); S.equip = {teinehaler:true}; S.pgear = K.newPGear(); S.pgear.pots.big = 4; S.boat.port = yard.id;
  t.eq(K.potsUnfit(), 0, 'plastsjarken beholder teinene og haleren');
  t.ok(S.pgear.pots.big === 4 && S.equip.teinehaler, 'plastsjarken: alt står');
  // (the snekke's pots and hauler from a save go ashore and are paid back, as the wooden boat's)
  boat('snekke'); S.equip = {teinehaler:true}; S.pgear = K.newPGear(); S.pgear.pots.big = 4; S.sets = []; S.boat.gop = null; S.boat.status = 'port'; S.boat.port = yard.id;
  t.ok(K.potsUnfit() > 0 && S.pgear.pots.big === 0 && !S.equip.teinehaler, 'snekka: teinene og haleren tatt i land og betalt tilbake ved verftet');

  // ---- more pots than the deck holds (OB16, valg 25 A): those aboard over it go ashore in port, paid back; the hauler stays
  boat('hurtigsjark'); S.equip = {teinehaler:true, krabbekar:true}; S.pgear = K.newPGear(); S.pgear.pots.big = 18; S.sets = []; S.boat.gop = null; S.boat.status = 'port'; S.boat.port = plant.id; S.cash = 0;
  t.eq(K.potsOver(), 12, 'den brukte hurtigsjarken med 18 teiner fra før: 12 over de 6 det er plass til');
  S.boat.status = 'sailing'; t.eq(K.potsUnfit(), 0, 'på sjøen skjer ingenting');
  S.boat.status = 'port'; t.eq(K.potsUnfit(), 12 * POTS.big.price, 'i havn: de 12 tas i land og betales tilbake til full pris');
  t.ok(S.pgear.pots.big === 6 && S.equip.teinehaler && S.equip.krabbekar && Math.round(S.cash) === 12 * POTS.big.price, '6 teiner om bord, haleren og karet står, pengene på konto');
  t.eq(K.potsUnfit(), 0, 'neste time: ingenting');
  S.pgear.pots.big = 4; S.sets = [{vid:S.cur, kind:'teine', n:6, pot:'big'}];
  t.eq(K.potsOver(), 4, 'med 6 i sjøen og 4 om bord: de 4 om bord er over');
  t.eq(K.potsOver('hurtigsjark', S.pgear, []), 0, 'potsOver for en annen liste med lenker: ingen i sjøen, 4 om bord er innenfor');
  boat('kyst21'); S.pgear.pots.big = 30; S.sets = []; t.eq(K.potsOver(), 0, 'kyst21 med 30: ingen over');
  globalThis.kr = kr0;
}
