// The first trip lands round (Jonas 08.11.2026, core/13-work.js catchGut): no gutting while the guided first trip runs, so the jigging
// never stops for the knife; the bled round fish go in the tubs (core/07f-kar.js inTub) and the deck has nothing pending without ice;
// after the trip the catch is gutted again as before. The plant's hand says what gutting aboard gives at the first landing (09d-folk.js).
export default function (t){
  const {newState, catchGut, deckPending, inTub, plantLine, PORTS} = t.K;
  t.K.set('S', newState()); const S = t.K.get('S');
  t.ok(catchGut(), 'uten første tur sløyes fangsten som før');
  S.tut = {v:2, m:{}, catch:true};
  t.ok(!catchGut(), 'i første tur leveres fangsten rund');
  S.settings.gut = false; t.ok(!catchGut(), '… også med sløying slått av i innstillingene');
  delete S.settings.gut;
  S.boat.ice = 0; S.hold = [];
  const x = {sp:'torsk', cls:1, kg:60, n:20, bled:true, iced:false, hr:0, fresh:100, gut:false, hook:true}; S.hold.push(x);   // as addCatch lays it down
  t.near(deckPending(), 0, 1e-9, 'uten is og uten sløying er det ingenting som venter på dekk, så fisket stopper ikke for kniven');
  t.ok(inTub(x), 'den blødde runde fisken ligger i karene');
  S.tut = 0;
  t.ok(catchGut(), 'etter første tur sløyes fangsten igjen');
  t.near(deckPending(), 60, 1e-9, '… og den runde fisken venter på kniven');
  t.ok(!inTub(x), '… i bløggekaret, ikke i karene');
  // the plant's line at the first landing of round cod, haddock or saithe
  const pt = PORTS.find(p => p.mottak), L = (kg, sp, gut) => ({lines:[{sp, kg, g:'A', gut:!!gut}], confKg:0}), rnd = (() => { let a = 7; return () => (a = (a * 16807) % 2147483647) / 2147483647; })();
  S.landN = 1;
  let n = 0; for (let i = 0; i < 50; i++) if (plantLine(pt, L(150, 'torsk'), rnd).pick === 'round') n++;
  t.eq(n, 50, 'første levering av rund torsk: kaia sier alltid hva sløying om bord gir');
  n = 0; for (let i = 0; i < 50; i++) if (plantLine(pt, L(150, 'torsk', true), rnd).pick === 'round') n++;
  t.eq(n, 0, 'sløyd torsk: ingen slik replikk');
  n = 0; for (let i = 0; i < 50; i++) if (plantLine(pt, L(150, 'lyr'), rnd).pick === 'round') n++;
  t.eq(n, 0, 'lyr har ingen lever å betale for: ingen slik replikk');
  n = 0; for (let i = 0; i < 50; i++) if (plantLine(pt, L(10, 'torsk'), rnd).pick === 'round') n++;
  t.eq(n, 0, 'under 15 kg: ingen slik replikk');
}
