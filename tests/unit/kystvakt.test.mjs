// The coast guard (core/09j-kystvakt.js; docs/planer/oppdrag-2.md V1, 30.10.2026): the limits she asks about are the regulation's, and the
// sums of gear she counts inside the fjord lines are counted right. The visit itself (the roll, the ship, the word) is kystvakttest.py's.
export default function (t){
  const {KV, kvSums, newState} = t.K;
  t.K.set('S', newState());
  t.eq(KV.nets, 80, '§ 33a: høyst 80 garn i torskefisket innenfor fjordlinjene'); t.eq(KV.hooks, 5000, '§ 33: høyst 5 000 kroker per døgn innenfor fjordlinjene');
  t.eq(KV.gale, 13.9, 'kuling (13,9 m/s) stopper kontrollen'); t.ok(KV.pAfterOk < KV.p && KV.okFor === 14 * 1440, 'en ren kontroll halverer sjansen i to uker');
  t.ok(KV.minLand >= 3, 'aldri før tredje levering (Første uke er spillerens egen)');
  const sets = [{kind:'garn', n:50, in:true}, {kind:'garn', n:40, in:true}, {kind:'garn', n:30, in:false}, {kind:'line', hooks:3000, in:true}, {kind:'line', hooks:2400, in:true}, {kind:'line', hooks:9000, in:false}, {kind:'teine', n:20, in:true}];
  const s = kvSums(sets, x => x.in);
  t.eq(s.nets, 90, 'garna innenfor linjene telles (50 + 40), de utenfor ikke'); t.eq(s.hooks, 5400, 'krokene innenfor linjene telles (3 000 + 2 400), de utenfor ikke');
  t.eq(kvSums([], () => true).nets + kvSums(null, () => true).hooks, 0, 'ingen redskap gir null');
}
