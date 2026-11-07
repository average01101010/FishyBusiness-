// OPP1 of docs/planer/oppgraderinger.md (07.11.2026): the knives and the gaff in three tiers, per boat, bought at the tackle shop. Tier 1 is
// what every boat has aboard (a save without the field is tier 1); the shares are of the base level and add up, never compound (prinsipp 1,
// Jonas 07.11.2026: «Om det står 10% økning feks, så betyr det at økningen er 10% opp fra grunnnivået»). The knife speeds the gutting
// (DECK.gut in deckMinute, deckEta and the work's left.sloy) and makes the botched gutting and the cuts in crewSlip rarer; the gaff makes
// a fish over the rail rarer, the slip at a half hit in the jig game, and a tub of line quicker to haul (gopUnitMin, line only).
export default function (t){
  const K = t.K, {EQUIP, VESSELS, DECK, PORTS} = K;
  const S = K.newState(); K.set('S', S);
  const B = K.BOAT, boat = type => { Object.assign(B, VESSELS[type]); S.boat.type = type; };
  boat('trebat');

  // ---- the tiers: names, numbers and prices as the plan's tables
  t.ok(EQUIP.kniv && EQUIP.kniv.tiers && EQUIP.kniv.tiers.length === 3, 'kniven har tre trinn');
  t.ok(EQUIP.hott && EQUIP.hott.tiers && EQUIP.hott.tiers.length === 3, 'høtten har tre trinn');
  if (!(EQUIP.kniv && EQUIP.kniv.tiers && EQUIP.hott && EQUIP.hott.tiers)) return;
  t.eq(EQUIP.kniv.tiers.map(x => x.gut), [0, 0.1, 0.2], 'kniven: sløyetempoet over grunnivået per trinn');
  t.eq(EQUIP.kniv.tiers.map(x => x.slip), [0, 0.3, 0.5], 'kniven: andelen færre stygt sløyde og kutt per trinn');
  t.eq(EQUIP.hott.tiers.map(x => x.rail), [0, 0.3, 0.6], 'høtten: andelen færre fisk over ripa per trinn');
  t.eq(EQUIP.hott.tiers.map(x => x.haul), [0, 0.04, 0.08], 'høtten: andelen kortere trekk per stamp line per trinn');
  t.eq([1, 2, 3].map(lv => K.tierKr('kniv', lv, 'trebat')), [0, 1500, 4500], 'kniven koster 1 500 og 4 500 kr per sløyeplass (trebåten har én)');
  t.eq([1, 2, 3].map(lv => K.tierKr('kniv', lv, 'kyst15')), [0, 4500, 13500], 'kystbåten på 15 m har tre sløyeplasser');
  t.eq([1, 2, 3].map(lv => K.tierKr('hott', lv, 'kyst15')), [0, 900, 2900], 'høtten koster 900 og 2 900 kr, én per båt');

  // ---- the sums: shares of the base level, added (never a product)
  t.near(K.upgSum(0.1, 0.2), 1.3, 1e-12, 'to trinn på +10 % og +20 % gir +30 % av grunnivået, ikke 1,1 × 1,2');
  t.near(K.upgSum(-0.04, -0.1), 0.86, 1e-12, 'to trinn på −4 % og −10 % gir −14 %, ikke 0,96 × 0,9');
  t.near(K.upgSum(), 1, 1e-12, 'ingen trinn er grunnivået');

  // ---- an old save (no field) is tier 1; the field is the tier bought; the ocean fleet stays at the base
  S.equip = {};
  t.eq([K.equipLv('kniv'), K.equipLv('hott')], [1, 1], 'en lagring uten feltet har kniv og høtt på trinn 1');
  t.near(K.knifeX(), 1, 1e-12, 'trinn 1 sløyer som i dag');
  S.equip.kniv = 2; t.near(K.knifeX(), 1.1, 1e-12, 'kniv trinn 2: +10 % sløyetempo');
  S.equip.kniv = 3; t.near(K.knifeX(), 1.2, 1e-12, 'kniv trinn 3: +20 % sløyetempo');
  boat('autoliner'); t.eq(K.equipLv('kniv'), 1, 'havbåten (autolineren) har ikke trinnene, selv med feltet satt'); t.near(K.knifeX(), 1, 1e-12, 'og sløyer som før');
  t.ok(!K.equipFits('kniv', 'autoliner') && !K.equipFits('hott', 'snokrabbe') && K.equipFits('kniv', 'skiff') && K.equipFits('hott', 'kyst21'), 'kniv og høtt passer kystbåtene, ikke havflåten');
  boat('trebat');

  // ---- the gutting: DECK.gut times the knife where it is used (deckMinute, deckEta), the gutting machine untouched
  const wt = K.workTeam; K.set('workTeam', (st) => st === 'sloy' ? {n:1, sum:1, eff:1, crew:[], me:true} : {n:0, sum:0, eff:1, crew:[], me:false});
  S.settings.ice = false;
  const gutMin = (lv, mach) => { S.equip = lv > 1 ? {kniv:lv} : {}; B.gutMachine = mach || 0; S.hold = [{sp:'torsk', kg:1000, n:300, cls:0, fresh:100, bled:true, gut:false, iced:false, hr:0, hook:true}];
    K.deckMinute(); return S.hold.filter(x => x.gut).reduce((a, x) => a + x.kg, 0); };
  t.eq([1, 2, 3].map(lv => Math.round(gutMin(lv) * 1000) / 1000), [DECK.gut, DECK.gut * 1.1, DECK.gut * 1.2], 'én person sløyer 5, 5,5 og 6 kg i minuttet per trinn');
  t.near(gutMin(3, 600) - gutMin(1, 600), DECK.gut * 0.2, 1e-9, 'sløyemaskinen (10 kg i minuttet) tar like mye med alle knivene');
  K.set('workTeam', wt);
  K.set('workTeam', () => ({n:1, sum:1, eff:1, crew:[], me:true}));
  S.hold = [{sp:'torsk', kg:600, n:200, cls:0, fresh:100, bled:true, gut:false, iced:false, hr:0, hook:true}];
  const eta = lv => { S.equip = lv > 1 ? {kniv:lv} : {}; return K.deckEta(1); };
  t.near(eta(1) / eta(3), 1.2, 1e-9, 'tida som står igjen ved bordet (deckEta) er 1,2 ganger lengre med trinn 1 enn med trinn 3');
  K.set('workTeam', wt); B.gutMachine = 0; S.settings.ice = true;

  // ---- the mistakes on deck, with the seeded dice (window.CREW_SEED), many minutes per tier: the knife takes the botched gutting and
  // the cuts, never the fish over the rail; the gaff the fish over the rail, never the other two
  const W = K.get('window'), stub = {}; for (const n of ['log', 'crewSay', 'hsWork', 'coldPen', 'crewEffort']) stub[n] = K.get(n);
  let cnt;
  K.set('log', no => { if (/over ripa/.test(no)) cnt.rail++; else if (/stygt/.test(no)) cnt.botch++; else if (/skar seg/.test(no)) cnt.cut++; });
  const fmt0 = globalThis.fmt; globalThis.fmt = (v, d) => (+v).toFixed(d);   // (the log's number format is the page's, ui/02-format-state.js)
  K.set('crewSay', () => false); K.set('hsWork', () => 0); K.set('coldPen', () => 0); K.set('crewEffort', () => ({f:0}));
  const c = {name:'Ola Test', gear:{sloy:1}, fatigue:100};
  const run = (kn, ho, N) => { S.equip = {}; if (kn > 1) S.equip.kniv = kn; if (ho > 1) S.equip.hott = ho; W.CREW_SEED = 12345; cnt = {rail:0, botch:0, cut:0}; S.stats.lostRail = null;
    for (let i = 0; i < N; i++){ S.hold = [{sp:'torsk', kg:5000, n:1000, cls:0, fresh:100, bled:true, gut:false, iced:false, hr:0, hook:true}, {sp:'torsk', kg:100, n:30, cls:0, fresh:100, bled:true, gut:true, iced:false, hr:0, hook:true}]; c.cut = 0; K.crewSlip([c]); }
    return cnt; };
  const N = 400000, base = run(1, 1, N), k3 = run(3, 1, N), h3 = run(1, 3, N), k2 = run(2, 2, N);
  t.note(`feilene på ${N} minutter: trinn 1 ${JSON.stringify(base)}, kniv 3 ${JSON.stringify(k3)}, høtt 3 ${JSON.stringify(h3)}, begge 2 ${JSON.stringify(k2)}`);
  const tot = base.rail + base.botch + base.cut;
  t.ok(tot > 1500, `trinn 1 gir mange nok feil til å telle (${tot})`);
  t.ok(Math.abs(base.rail / tot - 0.45) < 0.03 && Math.abs(base.botch / tot - 0.30) < 0.03 && Math.abs(base.cut / tot - 0.25) < 0.03, 'trinn 1 som i dag: 45 % over ripa, 30 % stygt sløyd, 25 % kutt');
  // (within three standard deviations of the count, and 3 % of it)
  const near = (a, b, msg) => t.ok(Math.abs(a - b) < 3 * Math.sqrt(b) + 0.03 * b, `${msg} (${a} mot ${Math.round(b)})`);
  near(k3.botch, base.botch * 0.5, 'kniv trinn 3: halvparten så mange stygt sløyde');
  near(k3.cut, base.cut * 0.5, 'kniv trinn 3: halvparten så mange kutt');
  near(k3.rail, base.rail, 'kniv trinn 3: like mange over ripa');
  near(h3.rail, base.rail * 0.4, 'høtt trinn 3: 60 % færre over ripa');
  near(h3.botch + h3.cut, base.botch + base.cut, 'høtt trinn 3: like mange stygt sløyde og kutt');
  near(k2.rail, base.rail * 0.7, 'høtt trinn 2: 30 % færre over ripa');
  near(k2.botch + k2.cut, (base.botch + base.cut) * 0.7, 'kniv trinn 2: 30 % færre stygt sløyde og kutt');
  // the fish lost over the rail are counted (S.stats.lostRail, kg and number, all and this week)
  run(1, 1, 20000); const R = S.stats.lostRail;
  t.ok(R && R.n === cnt.rail && R.kg >= 1.5 * R.n && R.kg <= 4.5 * R.n && R.wn === R.n && Math.abs(R.wkg - R.kg) < 1e-9 && R.w === K.weekOfH(S.t / 60), `tapt over ripa telles: ${R ? R.n + ' fisk, ' + R.kg.toFixed(1) + ' kg' : 'ingenting'}`);
  const R0 = Object.assign({}, R); S.t += 7 * 1440; K.railLost(2);
  t.ok(S.stats.lostRail.n === R0.n + 1 && Math.abs(S.stats.lostRail.kg - R0.kg - 2) < 1e-9 && S.stats.lostRail.wn === 1 && S.stats.lostRail.wkg === 2, 'en ny uke begynner tellingen for uka på nytt, totalen går videre');
  // per boat this week (the gaff is the boat's): what another boat in the fleet lost is not on this boat's card
  S.cur = 'a'; K.railLost(3); K.railLost(1); S.cur = 'b'; K.railLost(2);
  t.ok(K.railWeek('a').n === 2 && K.railWeek('a').kg === 4 && K.railWeek('b').n === 1 && K.railWeek('c').n === 0 && S.stats.lostRail.wn === 4, 'tapt over ripa denne uka per båt: a 2 fisk 4 kg, b 1, c ingen');
  S.t += 7 * 1440; t.eq(K.railWeek('a').n, 0, 'neste uke har båten ingen tapt ennå');
  S.t -= 14 * 1440; for (const n in stub) K.set(n, stub[n]); delete W.CREW_SEED; if (fmt0) globalThis.fmt = fmt0; else delete globalThis.fmt;

  // ---- hauling: the gaff takes 4 and 8 % off a tub of line, not the setting, not nets, pots or the autoline
  K.set('workTeam', () => ({n:1, sum:1, eff:1, crew:[], me:true}));
  const hh = K.hasHauler, cp = K.coldPen; K.set('hasHauler', () => true); K.set('coldPen', () => 0);
  const unit = (g, lv) => { S.equip = lv > 1 ? {hott:lv} : {}; return K.gopUnitMin(g, 0, 0); };
  const line = {kind:'line', op:'haul', hooksPer:600};
  t.near(unit(line, 1), 25 / 700 * 600, 1e-9, 'en stamp hyseline (600 kroker) tar 21,4 min å trekke på trinn 1');
  t.near(unit(line, 2) / unit(line, 1), 0.96, 1e-9, 'stålhøtta: 4 % kortere trekk per stamp');
  t.near(unit(line, 3) / unit(line, 1), 0.92, 1e-9, 'den lange høtta: 8 % kortere');
  const set = {kind:'line', op:'set', hooksPer:600}, garn = {kind:'garn', op:'haul'}, teine = {kind:'teine', op:'haul'}, auto = {kind:'line', op:'haul', hooksPer:7000, auto:true};
  t.ok(unit(set, 3) === unit(set, 1), 'settinga av line er som før');
  t.ok(unit(garn, 3) === unit(garn, 1), 'garna trekkes like fort (tømmes ved garnbordet)');
  t.ok(unit(teine, 3) === unit(teine, 1), 'teinene like fort');
  t.ok(unit(auto, 3) === unit(auto, 1), 'autolina går i maskinens tempo');
  K.set('workTeam', wt); K.set('hasHauler', hh); K.set('coldPen', cp);

  // ---- the jig game: the slip at a half hit is 50 %, 40 % and 30 %
  t.eq([1, 2, 3].map(lv => { S.equip = lv > 1 ? {hott:lv} : {}; return Math.round(K.jigSlip() * 1000) / 1000; }), [0.5, 0.4, 0.3], 'glippet ved halvt treff i juksespillet per høtt-trinn');

  // ---- buying: only at the tackle shop's quay, tier by tier, not on the ocean fleet
  const shop = PORTS.find(p => K.portServices(p).butikk), plant = PORTS.find(p => K.portServices(p).mottak && !K.portServices(p).butikk);
  S.equip = {}; S.cash = 100000; S.boat.status = 'port'; S.boat.berth = 'main';
  S.boat.port = plant.id; t.ok(!!K.buyGate('tier', 'kniv'), `ved et mottak uten butikk nektes kjøpet: «${(K.buyGate('tier', 'kniv') || [''])[0]}»`);
  S.boat.status = 'sailing'; S.boat.port = shop.id; t.ok(!!K.buyGate('tier', 'hott'), 'på sjøen nektes kjøpet');
  S.boat.status = 'port';
  t.eq(K.buyGate('tier', 'kniv'), null, 'ved butikkens kai kan trinn 2 kjøpes');
  t.ok(!!K.buyGate('tier', 'kniv', 3), `trinn 3 uten trinn 2 nektes: «${(K.buyGate('tier', 'kniv', 3) || [''])[0]}»`);
  const c0 = S.cash; t.eq(K.buyGear('tier', 'kniv'), null, 'kjøpet av trinn 2 går');
  t.ok(S.equip.kniv === 2 && S.cash === c0 - 1500, `kniven er trinn 2 og 1 500 kr er betalt (${S.equip.kniv}, ${c0 - S.cash})`);
  t.eq(K.buyGate('tier', 'kniv', 3), null, 'nå kan trinn 3 kjøpes');
  t.eq(K.buyGear('tier', 'kniv'), null, 'kjøpet av trinn 3 går'); t.eq(S.equip.kniv, 3, 'kniven er trinn 3');
  t.ok(!!K.buyGate('tier', 'kniv'), 'over trinn 3 finnes ingenting å kjøpe');
  S.cash = -1e7; t.ok(!!K.buyGear('tier', 'hott'), 'uten penger nektes høtten'); t.ok(!S.equip.hott, 'og ingenting er kjøpt');
  S.cash = 100000; boat('autoliner'); t.ok(!!K.buyGate('tier', 'hott'), 'havbåten får ikke kjøpe trinn'); boat('trebat');
}
