// The ensign's hours where another player's boat is (TP1, steg 108: view3d/13-instruments.js drawPeerFlags asks core/03-simulation.js
// flagUp at her position): the stikkprøve in January at Kristiansand, Ålesund and Hammerfest. Flaggforskriften as flagUp has it: from
// November to February hoisted at 09 and lowered at sunset (21 at the latest); north of 65° N from 10 to 15.
export default function (t){
  const K = t.K, {flagUp, natP, newState, EPOCH} = K;
  K.set('S', newState());
  const H = (y, m, d, h) => (Date.UTC(y, m - 1, d) - EPOCH) / 3600000 + h;   // (the game's clock in the UTC fields, as sol.test.mjs)
  const at = (lat, lon, h) => flagUp(H(2028, 1, 15, h), natP(lat, lon));
  const krs = [8.5, 9.5, 15, 17].map(h => at(58.15, 8.0, h)), aal = [8.5, 9.5, 15, 16.75].map(h => at(62.47, 6.15, h)), hfs = [9.5, 10.5, 14.5, 15.5].map(h => at(70.66, 23.68, h));
  t.eq(krs, [false, true, true, false], 'Kristiansand 15. januar: nede 08.30, oppe 09.30 og 15.00, nede 17.00 (etter solnedgang)');
  t.eq(aal, [false, true, true, false], 'Ålesund 15. januar: nede 08.30, oppe 09.30 og 15.00, nede 16.45 (etter solnedgang)');
  t.eq(hfs, [false, true, true, false], 'Hammerfest 15. januar (nord for 65° N): nede 09.30, oppe 10.30 og 14.30, nede 15.30');
}
