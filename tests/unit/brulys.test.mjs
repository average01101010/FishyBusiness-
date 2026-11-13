// The marks on a bridge (core/11b-obstacles.js markOnDeck, deckAt; tilbakemelding #6 fra testutgaven, 13.11.2026): Puddefjordsbroen
// in Bergen has a red, a white and a green light on each side of its two decks, which OpenStreetMap has 1.5 to 3.5 m outside the deck
// as the game draws it. They stood as posts in the water across the passage, and a boat on Autonav ran into them. A fixed mark within
// 4 m of a deck's edge hangs on the bridge: no obstacle (and no post in 3D); a buoy there, or a mark further off, stays one.
// The bridges and marks are the real ones from the vec pack and the sjomerker-8 release (national frame, m and km).
export default function (t){
  const K = t.K;
  K.set('S', K.newState());
  const BR = [[0, 377, 'Puddefjordsbroen', 'yes', 217631, 1316408, 217372, 1316681], [0, 376, 'Puddefjordsbroen', 'yes', 217383, 1316690, 217641, 1316416]];
  const ON = [[217.4846, 1316.592, 'm', ''], [217.4765, 1316.6008, 'm', ''], [217.4714, 1316.6076, 'm', ''], [217.4508, 1316.5891, 'm', ''], [217.4573, 1316.5816, 'm', ''], [217.4641, 1316.5741, 'm', '']];
  // a lateral beacon on the deck's edge, a buoy under the bridge, a minor light 12 m off the deck, a lighthouse on it
  const BEACON = [217.5, 1316.555, 'L', 'port'], BUOY = [217.43, 1316.60, 'B', 'port'], OFF = [217.4895, 1316.5331, 'm', ''], FYR = [217.5, 1316.555, 'M', ''];
  // the off one: how far from the nearer deck's middle line (m)
  const segD = (x, z, b) => { const ax = b[4], az = b[5], dx = b[6] - ax, dz = b[7] - az, u = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz))); return Math.hypot(x - ax - dx * u, z - az - dz * u); };
  const dOff = Math.min(...BR.map(b => segD(OFF[0] * 1000, OFF[1] * 1000, b)));
  t.ok(dOff > 4.5 + 4 + 2, `merket som skal stå, er ${dOff.toFixed(1)} m fra midtlinja til nærmeste dekk`);
  // 1. in the obstacles' index (obsIndex), with the bridges and marks as a tile of the coast's packs
  const VEC = K.get('VEC'), MARKS = K.get('MARKS'), ready = K.get('mapReadyAt');
  K.set('mapReadyAt', () => false);   // (Node has no map: the wind turbines in the sea are left out of the index, as before their blocks come)
  VEC.tiles.set('4:26', {k:'4:26', tx:4, ty:26, bridges:BR, piers:[], npc:[]}); VEC.ver++;
  MARKS.tiles.set('4:26', {k:'4:26', tx:4, ty:26, lights:[], rocks:[], marks:[...ON, BEACON, BUOY, OFF]}); MARKS.ver++;
  try {
    K.obsIndex(); const HIND = K.get('HIND'), at = mk => HIND.list.filter(o => o.why === 'mark' && Math.hypot(o.x - mk[0] * 1000, o.z - mk[1] * 1000) < 0.01).length;
    t.eq(ON.map(at), [0, 0, 0, 0, 0, 0], 'de seks lysene på Puddefjordsbroen er ingen hindring i sjøen');
    t.eq(at(BEACON), 0, 'et lateralmerke på dekkets kant er ingen hindring');
    t.eq([at(BUOY), at(OFF)], [1, 1], 'en bøye under brua og et lys 12 m utenfor dekket er fortsatt hindringer');
    t.ok(HIND.list.some(o => o.t === 2) && HIND.list.some(o => o.t === 0 && o.B), 'brua selv (dekket og pilarene) er fortsatt hindringer');
    // 2. markOnDeck and bridgeDeckAt, as the 3D view asks them (view3d/05-quays-breakwaters.js markInto, 06-buildings-lights.js lightY)
    t.eq(ON.map(mk => K.markOnBridge(mk)), [true, true, true, true, true, true], 'markOnBridge: lysene henger på brua (ingen stake i 3D)');
    t.eq([K.markOnBridge(BUOY), K.markOnBridge(OFF), K.markOnBridge(FYR), K.markOnBridge(BEACON)], [false, false, false, true], 'markOnBridge: bøya, lyset utenfor og fyret står; lateralmerket henger');
    const d = K.bridgeDeckAt(ON[1][0], ON[1][1]);
    t.ok(d && d.B.br[2] === 'Puddefjordsbroen' && d.under > 5, `bridgeDeckAt finner dekket over det hvite lyset (undersiden ${d && d.under.toFixed(1)} m over sjøen)`);
    t.eq(K.bridgeDeckAt(OFF[0], OFF[1]), null, 'bridgeDeckAt: ingen bru ved lyset 12 m utenfor');
    // 3. the way under twin bridges (obsWays): the two decks have their piers every 70 m from opposite ends, so a gap in one faced a pier
    // of the other and 7 of the 9 ways under it were not clear; with the other's piers counted, 7 are. The leg is Autonav's last one to Bergen verft
    // (leiaRoute in the build, 13.11.2026), which ran at a pier of the 376 m deck; the ways through the gaps beside that pier (all their
    // points within 120 m of it), not those far along the bridge, which end on land
    const keepL = K.get('isLand'); K.set('isLand', () => false);   // (Node has no map: water everywhere)
    try {
      const a = {x:217.413, y:1316.538}, b = {x:217.672, y:1316.737}, hit = K.obsSegHit(a, b), pr = hit || {x:0, z:0, s:0};
      const ways = hit ? K.obsWays(hit, a, b) : [], near = w => w.every(p => Math.hypot(p.x * 1000 - pr.x, p.y * 1000 - pr.z) < 120), clear = ways.filter(w => near(w) && w.every((p, i) => i === 0 || K.obsClear(w[i - 1], p)));
      t.ok(!!hit && !!hit.B && hit.t === 0, `Autonavs etappe til verftet treffer en pilar (${hit && hit.B ? hit.B.br[1] + ' m-dekket, s = ' + hit.s.toFixed(0) + ' m' : 'ingenting'})`);
      t.ok(clear.length > 0 && clear.length >= ways.filter(near).length - 2, `obsWays: veiene under brua ved pilaren (alle punktene innen 120 m) er fri for pilarene til begge dekkene, høyst to er stengt (${clear.length} av ${ways.filter(near).length} fri; uten det andre dekkets pilarer var 2 av 9 fri)`);
    } finally { K.set('isLand', keepL); }
  } finally { K.set('mapReadyAt', ready); VEC.tiles.delete('4:26'); VEC.ver++; MARKS.tiles.delete('4:26'); MARKS.ver++; }
}
