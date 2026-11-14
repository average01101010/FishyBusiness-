// Steg 125b (Jonas 14.11.2026: no standard stations, the boats keep their own layouts; docs/planer/arbeidsceller.md «Valgt»): the
// working zone. The fixed things (the hauler, the gutting table, the bleeding tub, the ice box, where the fish is let fall) are read
// where each boat has them, and for each station it is told whether what the man works with lies in a roomy zone before him as he
// stands and faces today: a thing his hands stay on (hold) within HOLD m and HOLD_A rad of straight ahead, a thing he fetches from or
// throws to (reach) within REACH m and REACH_A rad (he may turn and lean for it). This first version only tells: the list of what is
// outside is what the step begins from, and the places are moved after it.
export const scripts = ['js/figpose.js', 'js/vessel3d.js', 'js/deckcrew.js'];
export const data = true;
export const ZONE = {hold:[0.3, 0.75, 1.05], reach:[0.3, 1.05, 1.92]};   // m at the least and the most, rad to either side of ahead

export default function (t){
  const K = t.K; K.set('S', K.newState()); const S = K.get('S'), {VESSELS, CREW3D, applyVessel, LEMMER} = K, b = S.boat, was = LEMMER.on; LEMMER.on = true;
  const out = [], rows = []; let nSt = 0, nBoats = 0;
  for (const vt of Object.keys(VESSELS)){ S.tut = 0; S.me = S.cur; b.type = vt; applyVessel(); CREW3D.reset(); if (!CREW3D.on()) continue; nBoats++;
    const ST = CREW3D._st, G = ST.G, PL = CREW3D.places(), d = G.deck || {y:G.gw, z:0}, Bm = G.beam || 3, W = G.work, HP = G.hauler || [Bm / 2 * 0.92, d.y + 1, d.z - 1.3];
    const pt = n => { const c = ST.PT[n]; return c && c.k != null && ST.M0.ok(c.k) ? [ST.M0.at(c.k)[0], ST.M0.at(c.k)[2], c.h || 0] : null; };
    const table = W ? [W.table[0], W.table[2]] : [-(Bm / 2 - 0.42), d.z], tub = PL.tub, ice = G.kit && G.kit.iskasse ? [G.kit.iskasse[0], G.kit.iskasse[2]] : null;
    const Sl = pt('sloy'), Is = pt('is'), Ha = PL.haul[0], Bl = PL.bleed, crate = Is ? [Is[0] + Math.sin(Is[2]) * 0.58, Is[1] - Math.cos(Is[2]) * 0.58] : null;
    const ST8 = [['haler', Ha, [['haleren', [HP[0], HP[2]], 'hold'], ['slippet', PL.drop, 'reach']]],
      ['bløgger', Bl, [['fisken', PL.drop, 'reach'], ['karet', tub, 'reach']]],
      ['sløyer', Sl, [['bordet', table, 'hold'], ['karet', tub, 'reach'], ['pakkerens kasse', crate, 'reach']]],
      ['pakker', Is, [['iskassa', ice, 'reach']]]];
    for (const [nm, P, things] of ST8){ if (!P) continue; nSt++;
      for (const [tn, q, kind] of things){ if (!q) continue; const dx = q[0] - P[0], dz = q[1] - P[1], dist = Math.hypot(dx, dz); let a = Math.atan2(dx, -dz) - P[2]; while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI;
        const Z = ZONE[kind], ok = dist >= Z[0] - 0.005 && dist <= Z[1] + 0.005 && Math.abs(a) <= Z[2] + 0.01; rows.push([vt, nm, tn, dist, a, ok]);
        if (!ok) out.push(vt + ' ' + nm + ': ' + tn + ' ' + dist.toFixed(2) + ' m, ' + Math.round(a * 180 / Math.PI) + '°'); } } }
  LEMMER.on = was;
  const bad = new Set(out.map(s => s.split(':')[0]));
  console.log('arbeidssonene i dag (' + nBoats + ' båttyper, ' + nSt + ' stasjoner, ' + rows.length + ' ting): ' + out.length + ' ting utenfor sonen på ' + bad.size + ' stasjoner');
  for (const s of out) console.log('  utenfor: ' + s);
  t.ok(rows.length > 20, 'arbeidssonene er målt på hver båttype med dekk (' + rows.length + ' ting; ' + out.length + ' utenfor sonen i dag, se lista)');
}
