// The haill in store (HS2, 10.11.2026, docs/planer/haill-saldo.md; core/03-simulation.js): the Luck app shows the game's own numbers
// (S.haillInv: the pub, the chapters) and the copy of what the server holds unused (S.haillSrv = [{id, type}]) together, an id that
// was switched on here (S.haillUsed) never counts again whatever the server says, and switching one on takes the game's own first
// (it can be lost with the save, the server's cannot), else the oldest from the server, which goes on the list the server is told of.
export default function (t){
  const K = t.K, St = () => K.get('S'), fresh = () => { K.set('S', K.newState()); K.haillInit(); return St(); };
  const g = (id, type, more) => ({id, product:'x', data:{give:'haill', type, ...more}});

  // ---- the number shown (haillStock) ----
  t.eq(K.haillStock({haill:0, luksus:0}, [], []), {haill:0, luksus:0, takk:0}, 'tom beholdning: null av hver');
  t.eq(K.haillStock(undefined, undefined, undefined), {haill:0, luksus:0, takk:0}, 'en lagring uten feltene: null av hver');
  t.eq(K.haillStock({haill:2, luksus:1}, [], []), {haill:2, luksus:1, takk:0}, 'bare lokal: spillets egne tall');
  t.eq(K.haillStock({haill:0, luksus:0}, [{id:5, type:'haill'}, {id:6, type:'takk'}, {id:9, type:'takk'}], []), {haill:1, luksus:0, takk:2}, 'bare server: én per ID');
  t.eq(K.haillStock({haill:1, luksus:1, takk:1}, [{id:5, type:'haill'}, {id:7, type:'luksus'}], []), {haill:2, luksus:2, takk:1}, 'begge: lagt sammen per type');
  t.eq(K.haillStock({haill:1}, [{id:5, type:'haill'}, {id:7, type:'luksus'}], [5]), {haill:1, luksus:1, takk:0}, 'brukt ID: telles ikke');
  t.eq(K.haillStock({haill:-3, luksus:1.9}, [{id:5, type:'haill'}, {id:5, type:'haill'}, {id:8, type:'ukjent'}], []), {haill:1, luksus:1, takk:0}, 'negativt tall, samme ID to ganger og ukjent type: tåles');

  // ---- the copy of the server's list (haillMirror) ----
  t.eq(K.haillMirror([], []), [], 'tom liste fra serveren: tomt speil');
  t.eq(K.haillMirror([g(9, 'takk'), g(5, 'haill'), g(7, 'luksus', {gift:true})], []), [{id:5, type:'haill'}, {id:7, type:'luksus'}, {id:9, type:'takk'}], 'speilet: haillen fra serveren, eldste først');
  t.eq(K.haillMirror([g(5, 'haill'), g(7, 'luksus')], [5]), [{id:7, type:'luksus'}], 'speilet: en brukt ID tas aldri med');
  t.eq(K.haillMirror([g(5, 'haill'), g(5, 'haill'), {id:8, product:'trim_turbo', data:{give:'trim', k:'turbo'}}, g(3, 'kveite'), {id:4}], []), [{id:5, type:'haill'}], 'speilet: ikke trim, ikke ukjent type, ikke samme ID to ganger');

  // ---- giving and switching on ----
  { const S = fresh(); K.giveHaill('haill', 'pub'); K.giveHaill('haill', 'shop', 12); K.giveHaill('haill', 'shop', 11); K.giveHaill('haill', 'shop', 12);
    t.eq([S.haillInv.haill, S.haillSrv.map(x => x.id)], [1, [11, 12]], 'giveHaill: uten ID i spillets tall, med ID i speilet, aldri samme ID to ganger');
    t.eq(K.haillStock(S.haillInv, S.haillSrv, S.haillUsed).haill, 3, 'beholdningen: 1 lokal og 2 fra serveren');
    t.ok(K.useHaill('haill') && S.haill.how === 'inv' && S.haillInv.haill === 0 && S.haillSrv.length === 2 && S.haillQ.length === 0, 'useHaill tar den lokale først');
    t.ok(K.useHaill('haill') && S.haill.how === 'srv', 'så en fra serveren');
    t.eq([S.haillSrv.map(x => x.id), S.haillUsed, S.haillQ], [[12], [11], [11]], 'den eldste fra serveren: ute av speilet, ID-en i haillUsed og i køen til serveren');
    t.eq(K.haillMirror([g(11, 'haill'), g(12, 'haill')], S.haillUsed), [{id:12, type:'haill'}], 'serveren som ikke har fått vite det ennå, gir den ikke tilbake');
    t.ok(K.useHaill('haill') && !K.useHaill('haill') && !K.useHaill('luksus'), 'den siste brukes, og så er det tomt');
    t.eq([S.haillUsed, S.haillQ], [[11, 12], [11, 12]], 'begge ID-ene venter på serveren');
    K.giveHaill('haill', 'shop', 11); t.eq(S.haillSrv, [], 'en brukt ID kan ikke gis igjen'); }
  { const S = fresh(); for (let i = 1; i <= 205; i++){ K.giveHaill('takk', 'fb', i); K.useHaill('takk'); }
    t.eq([S.haillUsed.length, S.haillUsed[0], S.haillUsed[199]], [200, 6, 205], 'haillUsed holder de siste 200'); }
  // ---- an old save ----
  { K.set('S', K.newState()); const S = St(); delete S.haillSrv; delete S.haillUsed; delete S.haillQ; delete S.haillOld; S.haillInv = {haill:2, luksus:0}; S.shopGiven = [7, 8, 9]; K.haillInit();
    t.eq([S.haillInv.haill, S.haillSrv, S.haillUsed, S.haillQ, S.haillOld], [2, [], [], [], [7, 8, 9]], 'en gammel lagring: feltene tomme, tallene urørt, og det den fikk før HS2, i haillOld');
    S.shopGiven.push(10); K.haillInit(); t.eq(S.haillOld, [7, 8, 9], 'haillInit en gang til endrer ingenting'); }
}
