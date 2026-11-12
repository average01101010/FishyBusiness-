// Step 103 (Jonas 12.11.2026, «Bare bestanden»; docs/systemer/haill-pub-og-bonus.md 5.10): the haill's extra fish is not taken from the
// shared stock. A player's catch is multiplied by luck(sp) where it is taken (fish() in 05-vessels.js, soakHour in 10-gear.js, snoSoak in
// 10d-snokrabbe.js), and takeStock takes only the catch without it: from S.stock, from the cells that go to the others (wq().c) and from
// the layers of their own (the Greenland halibut, the snow crab, the crab). The buyer gets the same as before, and no less.
// The chart is not loaded here, so the place is stubbed: no land, 60 m (300 m for the snow crab), the fleet's baseline 1, and density()
// is a fixed number a species times the stock's share where it stands (stockAt), so what the players have fished down still counts.
export default function (t){
  const K = t.K, S = K.newState(); K.set('S', S);
  const EPOCH = K.EPOCH, H0 = (Date.UTC(2028, 8, 8, 6) - EPOCH) / 36e5, p = {x:300.4, y:400.7}, DEN = {v:2};
  K.set('isLand', () => false); K.set('depthF', () => 60); K.set('baseAt', () => 1); K.set('skreiShare', () => 0.3);
  K.set('density', (sp, q, H) => DEN.v * K.stockAt(q, sp, H));
  // a seeded Math.random (mulberry32, as #seed=N in core/01-world.js), so runs repeat
  const seed = n => { let a = n; K.get('Math').random = () => { a = a + 0x6D2B79F5 | 0; let x = Math.imul(a ^ a >>> 15, 1 | a); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; }; };
  const WSH = K.WSH, rec0 = WSH.rec; WSH.rec = true;   // with the cloud: the cells go to the others
  const clean = type => { S.stock = {}; S.bstk = {}; S.sstk = {}; S.cstk = {}; S.wq = null; S.t = Math.round(H0 * 60); S.haill = type ? {type, t0:S.t} : null; };
  const snap = () => JSON.stringify({stock:S.stock, b:S.bstk, s:S.sstk, c:S.cstk, q:(S.wq || {}).c || {}});
  const close = (a, b) => { const A = JSON.parse(a), B = JSON.parse(b); let d = 0; const walk = (x, y) => { for (const k of new Set([...Object.keys(x), ...Object.keys(y)])){ const u = x[k], v = y[k]; if (typeof u === 'object' || typeof v === 'object') walk(u || {}, v || {}); else d = Math.max(d, Math.abs((u == null ? 1 : u) - (v == null ? 1 : v))); } }; walk(A, B); return d; };

  // 1. takeStock: a catch with the haill takes as much as the catch without it, from the stock and from the cells to the others
  for (const [type, x] of [['haill', 2], ['luksus', 3]]) for (const sp of [undefined, 'torsk', 'blakveite', 'krabbe', 'snokrabbe']){
    clean(type); t.near(K.luck(sp), x, 1e-12, `${type}: luck er ×${x}`);
    K.takeStock(p, 120, sp); const withH = snap();
    clean(null); K.takeStock(p, 120 / x, sp); const without = snap();
    t.ok(close(withH, without) < 1e-12 && withH !== JSON.stringify({stock:{}, b:{}, s:{}, c:{}, q:{}}), `${type}, ${sp || 'fellesbestanden'}: 120 kg tatt med haill trekker det samme som ${(120 / x).toFixed(0)} kg uten (bestanden og cellene til de andre)`);
  }
  clean(null); t.ok(Object.keys(S.wq ? S.wq.c : {}).length === 0, 'et rent spill har ingen celler til de andre');
  clean(null); K.takeStock(p, 50); t.ok(Object.values(S.wq.c).reduce((a, v) => a + v, 0) > 49.99 && Object.keys(S.stock).length === 4, 'uten haill: 50 kg går til de fire rutene og til cellene som før');
  // the fleet's take (npc) is not the player's: no division
  clean('haill'); K.takeStock(p, 100, undefined, true); const npcH = snap(); clean(null); K.takeStock(p, 100, undefined, true);
  t.ok(close(npcH, snap()) < 1e-12 && Object.keys(S.wq ? S.wq.c : {}).length === 0, 'NPC-trekket (npc) deles ikke på hailla og går ikke til de andre');

  // 2. the gear in the sea, hour by hour (soakHour): nets, a line with the Greenland halibut's layer, crab pots and snow crab pots.
  // The catch is the haill's multiple, and the stock and the cells end the same as without the haill, hour after hour
  const soak = (kind, ex, type, hours, dry = false) => { clean(type);
    const s = Object.assign({kind, n:1, a:{x:p.x, y:p.y}, b:{x:p.x + 0.3, y:p.y}, tSet:S.t, acc:{}, dead:0, dry, cond:1}, ex);
    for (let h = 1; h <= hours; h++){ S.t = Math.round((H0 + h) * 60); K.soakHour(s, H0 + h); }
    return {kg:Object.values(s.acc).reduce((q, x) => q + x.kg, 0), st:snap(), s}; };
  const isL = K.isLand; K.set('snoArea', () => 1.2); K.set('depthF', () => 300);
  const KINDS = {garn:['garn', {n:6}], line:['line', {lk:'bank', hooks:2000, n:4, baitW:{makrell:4}}], teine:['teine', {pot:'big', n:4, bait:'makrell'}], sno:['teine', {pot:'sno', n:100, bait:'blekksprut'}]};
  // (20 hours, inside the haill's first stage: where it steps down in the middle of a soak, the room in the gear (haillCap) shrinks with
  // it while the fish already in the gear stays, so the last hour's catch is a little under luck × the catch without, and so is the draw)
  for (const k in KINDS){ const [kind, ex] = KINDS[k], a = soak(kind, ex, null, 20);
    for (const [type, x] of [['haill', 2], ['luksus', 3]]){ const b = soak(kind, ex, type, 20);
      t.ok(a.kg > 0 && Math.abs(b.kg / a.kg - x) < 1e-9 * x, `${k}: 20 t med ${type} gir ×${(b.kg / a.kg).toFixed(3)} av fangsten (×${x})`);
      t.ok(a.st !== '{"stock":{},"b":{},"s":{},"c":{},"q":{}}' && close(a.st, b.st) < 1e-6, `${k}: 20 t med ${type} trekker det samme fra bestanden og cellene som uten (største avvik ${close(a.st, b.st).toExponential(1)})`); }
    // (a dry soak, the tests' own, takes nothing; the crab is taken also then, as before: geartest's calibration of the pots rests on it)
    { const d = JSON.parse(soak(kind, ex, 'luksus', 24, true).st); if (k === 'teine') d.c = {}; t.ok(JSON.stringify(d) === '{"stock":{},"b":{},"s":{},"c":{},"q":{}}', `${k}: et tørt trekk (dry, bare i testene) tar ingenting fra bestanden${k === 'teine' ? ' utenom krabben, som før' : ''}`); } }
  // the fish in the crab pots (cod, tusk) are the sea's too: taken from the common stock as the nets' are (before, from nothing)
  { const a = soak('teine', {pot:'big', n:4, bait:'makrell'}, null, 20), fk = (a.s.acc.torsk || {kg:0}).kg + (a.s.acc.brosme || {kg:0}).kg, tk = Object.values(S.stock).reduce((q, v) => q + (1 - v), 0) * K.STK.K;
    t.ok(fk > 0 && Math.abs(tk - fk) < 1e-6 * fk + 1e-9, `teine: torsken og brosmen i krabbeteinene tas fra fellesbestanden (${fk.toFixed(2)} kg fanget, ${tk.toFixed(2)} kg trukket)`); }
  K.set('depthF', () => 60);

  // 3. the jig (fish() in 05-vessels.js), one boat alone with a hand jig, the deck kept clear (the work aboard is not what is measured
  // here): each minute takes from the stock the catch without the luck, and nothing for the guide's skrei patch or the top-up
  const b = S.boat; S.lang = 'no'; S.tut = 0; S.fleet = S.fleet || []; b.type = 'trebat'; K.applyVessel();
  K.set('ruBlockMsg', () => null); K.set('recCatch', () => {}); K.set('biteF', () => 1); K.set('motionHere', () => ({f:1})); K.set('deckPending', () => 0); K.set('jigWear', () => {}); K.set('jigQ', () => 1);
  const JH = K.JIG.hand; K.set('workTeam', () => ({n:1, eff:1, sum:JH}));
  // (days: that many days on the same place, the hold landed between them and the stock carried over, as a player going back)
  const jig = (type, mins, s0 = 7, days = 1) => { clean(type); seed(s0); let drawn = 0, got = 0, bad = 0, kg = 0;
    for (let d = 0; d < days; d++){ S.hold = []; S.facc = {}; S.fnext = {}; S.fsess = null; b.pos = {...p}; b.status = 'fishing'; b.fishUntil = null; b.gop = null; b.deckStop = false; b.trip = null;
      for (let m = 0; m < mins; m++){ S.t = Math.round(H0 * 60) + d * 1440 + m; const h0 = K.holdTotal(), s0 = stockKg(), l = K.luck('torsk'); K.fish(S.t / 60, 5, 0.6); const g = K.holdTotal() - h0, dk = stockKg() - s0; got += g; drawn += dk; if (Math.abs(dk - g / l) > 1e-6) bad++; }
      kg += K.holdTotal(); }
    return {kg, got, drawn, bad, st:snap()}; };
  // what the four cells have lost, in kg (each cell loses kg·w/K, and the weights add to 1)
  const stockKg = () => Object.values(S.stock).reduce((a, v) => a + (1 - v), 0) * K.STK.K;
  DEN.v = 0.015; const J0 = jig(null, 360), J1 = jig('haill', 360), J3 = jig('luksus', 360);
  t.ok(J0.got > 20 && J0.bad === 0 && Math.abs(J0.drawn - J0.got) < 1e-6, `juksa uten haill: hvert minutt trekker hele fangsten, som før (${J0.got.toFixed(1)} kg på 6 t)`);
  t.ok(J1.bad === 0 && Math.abs(J1.drawn - J1.got / 2) < 1e-6, `juksa med haill: hvert minutt trekker halve fangsten (${J1.got.toFixed(1)} kg tatt, ${J1.drawn.toFixed(1)} kg fra bestanden)`);
  t.ok(J3.bad === 0 && Math.abs(J3.drawn - J3.got / 3) < 1e-6, `juksa med luksushaill: hvert minutt trekker en tredel (${J3.got.toFixed(1)} kg tatt, ${J3.drawn.toFixed(1)} kg fra bestanden)`);
  // the guide's skrei patch is the guide's, not the stock's: a minute with the patch alone takes nothing, haill or not
  { const tb = K.tutBonus; K.set('tutBonus', () => 1); K.set('density', (sp) => sp === 'torsk' ? 1 : 0); const Jt = jig('haill', 60); t.ok(Jt.got > 0 && Jt.drawn === 0, `skreiflekken i veiledningen trekker ingenting, som før (${Jt.got.toFixed(1)} kg)`);
    K.set('tutBonus', tb); K.set('density', (sp, q, H) => DEN.v * K.stockAt(q, sp, H)); }

  // 4. the buyer gets no less (Ferdig når 2): the same seed, the old rule (the whole catch taken, as before step 103) against the new
  const takeNew = K.takeStock, takeOld = (q, kg, sp, npc) => takeNew(q, kg * (npc ? 1 : K.luck(sp)), sp, npc);
  const both = f => { K.set('takeStock', takeOld); const o = f(); K.set('takeStock', takeNew); const n = f(); return [o, n]; };
  // (the fish's weights come from a stream of their own, a species each, so the seeded Math.random is drawn the same number of times
  // a minute whatever is caught, and the same seed gives the same draws before and after: with the game's sampleFish, a fish more or
  // less shifts every draw after it, and three days of jigging differ by more than the stock does. The mean of ten seeds with the game's
  // own weights is printed below)
  const sf = K.sampleFish, own = sp => { const R = own[sp] || (own[sp] = {a:[...sp].reduce((h, c) => h * 31 + c.charCodeAt(0), 7) | 0}); R.a = R.a + 0x6D2B79F5 | 0; let x = Math.imul(R.a ^ R.a >>> 15, 1 | R.a); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; };
  const ownFish = sp => { const z = K.SPECIES[sp].size; return Math.round(z[0] * Math.exp(z[1] * K.gauss(own(sp), own(sp))) * 100) / 100; };
  const jigOwn = (type, mins, s0, days) => { for (const k of Object.keys(own)) delete own[k]; K.set('sampleFish', ownFish); const r = jig(type, mins, s0, days); K.set('sampleFish', sf); return r; };
  const rows = [];
  for (const type of [null, 'haill', 'luksus']){
    DEN.v = 0.015; const [jo, jn] = both(() => jigOwn(type, 480, 11, 3).kg);
    let mo = 0, mn = 0; for (let k = 1; k <= 10; k++){ const [a, c] = both(() => jig(type, 480, 100 + k, 3).kg); mo += a / 10; mn += c / 10; } DEN.v = 2;
    // three soaks of 24 h of 6 nets on the same place, the stock carried over (as a player setting the same string again)
    const nets = () => { clean(type); let kg = 0; for (let r = 0; r < 3; r++){ const t0 = S.t, s = {kind:'garn', n:6, a:{x:p.x, y:p.y}, b:{x:p.x + 0.3, y:p.y}, tSet:t0, acc:{}, dead:0, dry:false, cond:1};
      for (let h = 1; h <= 24; h++){ S.t = t0 + h * 60; K.soakHour(s, S.t / 60); } kg += Object.values(s.acc).reduce((q, x) => q + x.kg, 0); } return kg; };
    const [go, gn] = both(nets);
    rows.push(`${type || 'uten'}: juksa i trebåten 3 × 8 t ${jo.toFixed(1)} → ${jn.toFixed(1)} kg (snittet av ti frø med spillets vekter ${mo.toFixed(1)} → ${mn.toFixed(1)}), 6 garn 3 × 24 t ${go.toFixed(1)} → ${gn.toFixed(1)} kg`);
    if (!type){ t.eq(jn.toFixed(3), jo.toFixed(3), 'uten haill: juksefangsten er lik før og etter (samme frø)'); t.eq(gn.toFixed(3), go.toFixed(3), 'uten haill: garnfangsten er lik før og etter'); }
    else { t.ok(jn >= jo - 1e-9, `${type}: juksefangsten er minst like stor som før (${jo.toFixed(1)} → ${jn.toFixed(1)} kg)`); t.ok(gn >= go - 1e-9, `${type}: garnfangsten er minst like stor som før (${go.toFixed(1)} → ${gn.toFixed(1)} kg)`); }
  }
  for (const r of rows) t.note(r);
  WSH.rec = rec0; K.set('isLand', isL);
}
