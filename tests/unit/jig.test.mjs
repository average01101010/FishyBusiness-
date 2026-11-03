// Only a boat rigged for the jig can jig (Jonas 03.11.2026: «En havfiskebåt skal ikke kunne fiske med juksa»): vesselJigs in 10-gear.js
// reads VESSELS rigs; the ocean vessels have no juksa there.
export default function (t){
  const K = t.K, V = K.VESSELS, hav = Object.keys(V).filter(k => V[k].cls === 'hav'), kyst = Object.keys(V).filter(k => V[k].cls !== 'hav');
  t.ok(hav.length >= 5 && hav.every(k => !K.vesselJigs(k)), `havfiskefartøyene jukser ikke: ${hav.join(', ')}`);
  t.ok(kyst.every(k => K.vesselJigs(k)), `kyst- og åpne båter jukser: ${kyst.join(', ')}`);
}
