// FB7 (steg 125; Jonas 13.11.2026: «Sørg for at objekter ikke kan clippe inn i menneskene»): the bleeder's place and where the gaffed
// fish is let fall, against the packer's place, which is the model's own. Before, the bleeder was put 16 to 40 cm from the packer on
// five of the eight boats and the fish fell 30 to 43 cm from him: the two stood inside each other and the gaff swung the fish into the
// packer. With the new people (LEMMER.on) the fish falls 0.6 m clear of him and the bleeder has 0.8 m to the packer and 0.95 m to the hauler,
// on every boat type whose deck has the room (the 15 m boat's well has not: four at work in 1 x 1.5 m; there he gets the cell with
// the most room, and 0.45 m to the nearest of them is what is asked).
// Without the new people the places are where they were. The places on each boat's own model (deckcrew.js places), without a browser.
export const scripts = ['js/figpose.js', 'js/vessel3d.js', 'js/deckcrew.js'];
export const data = true;

export default function (t){
  const K = t.K; K.set('S', K.newState()); const S = K.get('S'), {VESSELS, CREW3D, applyVessel, LEMMER} = K, b = S.boat;
  const BOATS = ['snekke', 'plastsjark', 'sjark', 'hurtigsjark', 'sjarkny', 'breisjark', 'kyst15', 'kyst21'], TIGHT = {kyst15:0.45};
  const d = (a, c) => Math.hypot(a[0] - c[0], a[1] - c[1]), was = LEMMER.on;
  for (const on of [false, true]){ LEMMER.on = on; const bad = [], seen = [];
    for (const vt of BOATS){ S.tut = 0; S.me = S.cur; b.type = vt; applyVessel(); CREW3D.reset(); if (!CREW3D.on()){ bad.push(vt + ': ikke noe dekk'); continue; }
      const ST = CREW3D._st, PL = CREW3D.places(), q = ST.PT.is, I = q && q.k != null && ST.M0.ok(q.k) ? [ST.M0.at(q.k)[0], ST.M0.at(q.k)[2]] : null, H = PL.haul[0], B = PL.bleed, D = PL.drop;
      if (!on){ if (Math.abs(d(H, B) - 1.08) > 0.01 || Math.abs(d(D, B) - 0.69) > 0.01 || Math.abs(d(H, D) - 0.45) > 0.01) bad.push(vt + ': flyttet uten merket'); continue; }
      seen.push(vt + ' ' + (I ? d(I, B).toFixed(2) : '-') + '/' + d(H, B).toFixed(2) + (PL.tight || PL.tightB ? ' trangt' + (PL.tight || 0) + (PL.tightB || 0) : ''));
      if (I && d(I, B) < (TIGHT[vt] || 0.8) - 0.005) bad.push(vt + ': bløggeren ' + d(I, B).toFixed(2) + ' m fra pakkeren');
      if (I && d(I, D) < 0.6 - 0.005) bad.push(vt + ': fisken slippes ' + d(I, D).toFixed(2) + ' m fra pakkeren');
      if (d(H, B) < (TIGHT[vt] || 0.95) - 0.005) bad.push(vt + ': bløggeren ' + d(H, B).toFixed(2) + ' m fra haleren');
      if (d(D, B) < 0.4 - 0.005 || d(D, B) > 0.9 + 0.005) bad.push(vt + ': bløggeren ' + d(D, B).toFixed(2) + ' m fra fisken');
      if (d(H, D) > 0.85) bad.push(vt + ': fisken slippes ' + d(H, D).toFixed(2) + ' m fra haleren');
      if (ST.M.near(B[0], B[1], 0.15) < 0) bad.push(vt + ': bløggerens plass er ikke på dekket'); }
    t.ok(!bad.length, on ? 'med de nye folkene står bløggeren klar av pakkeren og haleren, og fisken slippes klar av pakkeren, på alle åtte båttypene (m fra pakkeren/haleren; «trangt»: dekket har ingen plass med alt rommet, og han har fått den med mest: ' + seen.join(', ') + ')' + (bad.length ? ' | ' + bad.join('; ') : '')
      : 'uten de nye folkene er bløggerens plass og slippstedet der de var' + (bad.length ? ' | ' + bad.join('; ') : '')); }
  LEMMER.on = was;
}
