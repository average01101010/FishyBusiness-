// Kystkartet (core/09m-kystkart.js; docs/planer/oppdrag-2.md K2): the four lists and their totals, a game from before starting with
// what it has done (the plants and species from the sales, the pictures in the paper, the catch marks' areas), and the areas found by
// the point (Fiskeridirektoratet's statistical main areas, the same as the seasons use).
export default function (t){
  const {kkState, kkCount, kkFish, kkFyr, kkHomAt, kkPlants, kkSpecies, P, newState, PORTS, FYR, RU} = t.K;
  const S = newState(); t.K.set('S', S);
  const c0 = kkCount();
  t.eq(c0.mottak[1], PORTS.filter(q => q.mottak).length, 'mottakene er havnene med mottak');
  t.ok(c0.mottak[1] >= 150, 'over 150 mottak langs hele kysten (' + c0.mottak[1] + ')');
  t.eq(c0.fyr[1], FYR.length, 'fyrene er de 134 i fyr.json');
  t.eq(c0.omr[1], RU.hom.length, 'statistikkområdene er Fiskeridirektoratets hovedområder (' + RU.hom.length + ')');
  t.eq(c0.arter[1], kkSpecies().length, 'artene er de kystflåten kan lande');
  t.eq(c0.mottak[0] + c0.fyr[0] + c0.arter[0] + c0.omr[0], 0, 'et nytt spill har ingen prikker');
  // the areas by the point: Vestfjorden is 00, the Finnmark coast 03/04
  t.eq(kkHomAt(P(68.0, 14.6)), '00', 'Vestfjorden er område 00');
  t.ok(['03', '04'].includes(kkHomAt(P(70.9, 25.5))), 'utenfor Honningsvåg er Finnmark (03 eller 04): ' + kkHomAt(P(70.9, 25.5)));
  t.eq(kkFish(P(68.0, 14.6)), '00', 'fiske i Vestfjorden setter område 00');
  t.eq(kkFish(P(68.0, 14.6)), null, 'samme område to ganger teller én gang');
  kkFyr(3); kkFyr(3); kkFyr(-1);
  const c1 = kkCount(); t.eq(c1.omr[0], 1, 'ett område fisket'); t.eq(c1.fyr[0], 1, 'ett fyr fotografert (to bilder av samme fyr, ingen av -1)');
  // a game from before: two sales at two plants with three species, a picture in the paper, a catch mark off Bergen
  const pl = kkPlants();
  const S2 = newState(); t.K.set('S', S2);
  S2.sales = [{port:pl[0].id, det:{ln:[['torsk', 10], ['sei', 5]]}}, {port:pl[5].id, det:{ln:[['hyse', 4]]}}, {port:'finnsnes'}];
  S2.ach = {sp:{torsk:1, sei:1, hyse:1}};
  S2.press = {own:[{kind:'foto', d:{fyr:7}, t:100}, {kind:'tur', d:{}}]};
  S2.marks = [{x:P(60.4, 5.0).x, y:P(60.4, 5.0).y, t:50}];
  delete S2.kk; kkState();
  const c2 = kkCount();
  t.eq(c2.mottak[0], 2, 'to mottak fra salgene (Finnsnes har ikke mottak og teller ikke)');
  t.eq(c2.arter[0], 3, 'tre arter fra salgene');
  t.eq(c2.fyr[0], 1, 'bildet i avisa teller');
  t.eq(c2.omr[0], 1, 'fangstmerket utenfor Bergen gir ett område (' + Object.keys(S2.kk.hom).join(',') + ')');
  // the steps (K2 part 2, core/09f-merker.js ACHL): one badge per list, the last species step is every species
  const {ACHL} = t.K, id = k => ACHL.find(x => x.id === k);
  t.ok(['mottak', 'fyr', 'omr', 'arter'].every(id), 'hver liste har et merke med trinn');
  t.eq(id('arter').tiers[id('arter').tiers.length - 1], kkSpecies().length, 'siste artstrinn er alle artene');
  t.ok(id('mottak').tiers.every(v => v <= c0.mottak[1]) && id('fyr').tiers.every(v => v <= c0.fyr[1]) && id('omr').tiers.every(v => v <= c0.omr[1]), 'ingen trinn over det som finnes');
  t.eq(id('fyr').v(), 1, 'fyrmerket leser Kystkartet (spillet over: ett fyr)'); t.eq(id('omr').v(), 1, 'områdemerket leser Kystkartet');
}
