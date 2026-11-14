// The rorbuer and Father's naust take boats up to 15 m (Jonas 13.11.2026, «Grense ved 15 m»: «Rorbua og naustet tar båter opp til 15 m,
// uansett dybde ved kaia. Større båter avvises»; 07-harbours.js SITE_MAXLEN, siteFits, SITE_DRAFT, sitePockE, siteDredge): which types
// fit, the draught the berths are dredged for, the pocket in front of the quay, and the dredged depth there in the simulation.
export default function (t){
  const K = t.K; K.set('S', K.newState()); const S = K.get('S'), V = K.VESSELS;
  const fit = Object.keys(V).filter(k => K.siteFits(k)).sort(), over = Object.keys(V).filter(k => !K.siteFits(k));
  t.ok(fit.includes('trebat') && fit.includes('kyst15') && !fit.includes('kyst21'), 'rorbua og naustet tar båtene opp til 15 m: trebåten og kystbåten på 14,99 m, ikke den på 21 m', fit);
  t.ok(over.every(k => V[k].len > 15) && fit.every(k => V[k].len <= 15), 'grensen går ved 15 m for alle båttypene', over);
  t.eq(K.SITE_DRAFT, Math.max(...fit.map(k => V[k].draft)), 'kaia mudres for den dypeste av dem (kystbåten på 14,99 m, 3,0 m)', K.SITE_DRAFT);
  // the pocket of a quay along x (u = [1, 0], out to sea = [0, 1]: z grows out from the face)
  const s = {o:[1000, 2000], u:[1, 0]}, P = K.SITE_POCK;
  t.eq([K.sitePockE(s, 1000, 2005), K.sitePockE(s, 1000 + P.a, 2000 + P.w)], [0, 0], 'foran kaia, innenfor lomma: 0 m utenfor');
  t.eq(K.sitePockE(s, 1000, 1999), Infinity, 'bak kaia (på land) er ikke lomma');
  t.eq(K.sitePockE(s, 1000 + P.a + 4, 2000), 4, '4 m forbi lommas ende langs kaia: 4 m utenfor');
  t.eq(K.sitePockE(s, 1000, 2000 + P.w + 6), 6, '6 m lenger ut enn lomma: 6 m utenfor');
  // the depth in the simulation: a shallow berth at the naust is dredged to SITE_DRAFT and half a metre, rising outside, and left deeper
  S.naust = {o:[1000, 2000], u:[1, 0]};
  const at = (x, z) => ({x:x / 1000, y:z / 1000}), want = K.SITE_DRAFT + 0.5;
  t.eq(+K.siteDredge(at(1000, 2006), 1.8).toFixed(2), +want.toFixed(2), 'ved naustkaia: 1,8 m blir ' + want.toFixed(1) + ' m ved laveste lavvann', want);
  t.eq(+K.siteDredge(at(1000, 2000 + P.w + 2), 1.8).toFixed(2), +(want - P.slope * 2).toFixed(2), '2 m utenfor lomma stiger bunnen 1:2');
  t.eq(K.siteDredge(at(1000, 2006), 12), 12, 'dypere vann står som det er');
  t.eq(K.siteDredge(at(1000, 2006), 0), 0, 'land graves ikke ut');
  t.eq(K.siteDredge(at(1300, 2006), 1.8), 1.8, '300 m unna naustet: ingenting mudres');
}
