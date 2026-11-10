// The Senja fleet far from the boat you follow (Ø3b, 10.11.2026; fleetOff in core/05-vessels.js): a boat of FLEET that cannot be
// within reach is left out of the list of all the boats (npcStates without a name), so her state is not asked of her harbour's vec
// tiles in every frame from the other end of the coast. Here the rule itself and its bound (the list needs the map: npctest,
// havntest and the session's run at Bodø, docs/systemer/npc-trafikk.md).
export default function (t){
  const K = t.K; K.set('S', K.newState()); const H = 24 * 200 + 13, f0 = K.FLEET[0], at = (dx, dy) => ({x:f0.hp[0] + dx, y:f0.hp[1] + dy});
  // at home nobody is out of reach
  t.ok(K.FLEET.every(f => !K.fleetOff(f, {x:f.hp[0], y:f.hp[1]})), 'hjemme er ingen i flåten utenfor rekkevidde');
  // her reach: the longest of her routes and 5 km for the drift on the bank
  t.ok(K.FLEET.every(f => f.reach >= 5 && f.R.concat(f.RR).every(R => f.reach >= R.len + 5 - 1e-9)), 'rekkevidden er den lengste ruta og 5 km');
  // every place a boat is through a day lies within her reach of her home (so a boat left out could not have been seen)
  let worst = 0, n = 0;
  try { K.FLEET.forEach((f, i) => { for (let h = 0; h < 24; h += 0.25){ const p = K.fleetState0(i, H + h).p, d = Math.hypot(p.x - f.hp[0], p.y - f.hp[1]) - f.reach; n++; if (d > worst) worst = d; } }); } catch (e){ n = -1; }
  if (n > 0) t.eq(worst, 0, `gjennom et døgn er ingen båt lenger hjemmefra enn rekkevidden sin (${n} punkter)`);
  else t.ok(true, 'døgnet kan ikke spilles uten kartet her (npctest tar det)');
  // the edge: FLEET_SEEN km and her reach, along each axis (a box, so never tighter than the circle)
  const d = K.FLEET_SEEN + f0.reach;
  t.ok(!K.fleetOff(f0, at(0, d - 0.01)) && !K.fleetOff(f0, at(-(d - 0.01), d - 0.01)), 'innenfor 45 km og rekkevidden er hun med');
  t.ok(K.fleetOff(f0, at(0, d + 0.01)) && K.fleetOff(f0, at(-(d + 0.01), 0)), 'utenfor er hun ikke');
  t.ok(K.FLEET_SEEN >= 30 + 8 + 5, 'grensa dekker det 3D tegner (30 km fra et kamera inntil 8 km fra båten) med margin, og AIS (15 km)');
  // far down the coast (Bodø is some 250 km from Senja) the whole fleet is out
  t.ok(K.FLEET.every(f => K.fleetOff(f, at(-150, 250))), 'langt unna er hele flåten utenfor rekkevidde');
  // a boat whose routes are not made yet is never left out
  t.ok(!K.fleetOff({hp:[0, 0]}, {x:900, y:900}), 'en båt uten ruter ennå er alltid med');
}
