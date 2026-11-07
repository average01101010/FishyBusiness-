// #seed=N (core/01-world.js, 29.10.2026): Math.random becomes a seeded generator, so a test run repeats; without it the game's own
// Math.random is the browser's. The core here starts with a seeded address, and t.fresh makes the cores to compare with (each is a
// whole core load, about a second, so they are few).
export const stubs = {location:{hash:'#qfix,seed=5', hostname:'localhost', search:'', href:'http://localhost/#qfix,seed=5'}};
export default function (t){
  const seq = K => Array.from({length:6}, () => K.get('Math').random());
  const loc = (hash, hostname = 'localhost') => ({location:{hash, hostname, search:'', href:''}});
  // the same seed twice: the same new game (S.qseed is drawn from Math.random off the world clock) and the same draws after it
  const K2 = t.fresh(stubs);
  t.eq(t.K.newState().qseed, K2.newState().qseed, 'S.qseed er lik i to nye spill med samme frø');
  const a = seq(t.K), b = seq(K2);
  t.eq(a, b, 'samme frø gir samme rekke (seed=5 to ganger)');
  t.ok(a.every(v => v >= 0 && v < 1), 'verdiene ligger i [0, 1)');
  t.ok(new Set(a).size === a.length, 'verdiene er forskjellige fra hverandre');
  t.ok(a.some((v, i) => v !== seq(t.fresh(loc('#seed=6')))[i]), 'et annet frø gir en annen rekke');
  // the seed is read after other keys too (the rows are not compared across addresses: what the core draws while loading depends on
  // the other keys and the host, so only the same address repeats)
  t.ok(Object.hasOwn(t.fresh(loc('#notut,no3d,seed=5')).get('Math'), 'random'), 'frøet leses etter andre nøkler i adressen');
  t.ok(!Object.hasOwn(t.fresh(loc('#qfix,notut')).get('Math'), 'random'), 'uten seed= er Math.random urørt');
  t.ok(!Object.hasOwn(t.fresh().get('Math'), 'random'), 'uten location (Node) er Math.random urørt');
  t.ok(/\[native code\]/.test(String(Math.random)), 'harnessens egen Math.random er fortsatt den innebygde');
}
