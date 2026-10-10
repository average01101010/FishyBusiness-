// ===== looks: how the people of the game look (Jonas 10.10.2026: character customisation, and the crew in the same clothes so nobody looks alike) =====
// A look is a small object of numbers and names, not a model: {b body 'm'|'f', s skin tone, hs hair style, hc hair colour, bd beard, ht hat,
// hk hat colour (null: as the hat comes), tp jacket, tk jacket colour, lg trousers colour, sh shoes, sc shoe colour}. The parts are in the
// worker GLB (tools/harbour/arbeider.py and garderobe.py) and are painted by zone (vessel3d.js wkPart): 1 jacket, 3 trousers, 4 skin, 5 hair
// and beard, 6 hat, 7 shoes. The clothes are a coastal life's: oilskins, wool and fleece, caps and rain hats, boots and deck shoes.
// The player's look is S.look. A crew member's is c.look, drawn from the id once (lookFromSeed) and then kept, so the same person always
// looks the same, also after a save; no two in the fleet look alike (lookUnique).
const LOOK_SKIN = [[0.96, 0.80, 0.68], [0.91, 0.72, 0.58], [0.86, 0.64, 0.50], [0.76, 0.54, 0.39], [0.64, 0.43, 0.30], [0.50, 0.33, 0.23], [0.38, 0.25, 0.18], [0.28, 0.19, 0.14]];
const LOOK_SKIN_N = [['Veldig lys', 'Very fair'], ['Lys', 'Fair'], ['Middels', 'Medium'], ['Brunet', 'Tanned'], ['Brun', 'Brown'], ['Mørkbrun', 'Dark brown'], ['Mørk', 'Dark'], ['Svært mørk', 'Very dark']];
const LOOK_HAIR_C = [[0.06, 0.05, 0.05], [0.16, 0.10, 0.07], [0.26, 0.17, 0.10], [0.42, 0.28, 0.15], [0.74, 0.58, 0.30], [0.52, 0.20, 0.09], [0.50, 0.50, 0.51], [0.84, 0.84, 0.82], [0.32, 0.12, 0.07]];
const LOOK_HAIR_CN = [['Svart', 'Black'], ['Mørkebrun', 'Dark brown'], ['Brun', 'Brown'], ['Lysebrun', 'Light brown'], ['Blond', 'Blond'], ['Rød', 'Red'], ['Grå', 'Grey'], ['Hvit', 'White'], ['Kastanje', 'Chestnut']];
// the garment colours (jacket, trousers, hat, shoes): the sea's and the harbour's
const LOOK_COL = [[0.10, 0.14, 0.28], [0.20, 0.36, 0.64], [0.95, 0.42, 0.07], [0.93, 0.74, 0.12], [0.72, 0.13, 0.12], [0.09, 0.30, 0.20], [0.36, 0.40, 0.18], [0.38, 0.46, 0.54],
  [0.40, 0.41, 0.43], [0.07, 0.07, 0.08], [0.88, 0.85, 0.74], [0.70, 0.52, 0.16], [0.40, 0.10, 0.14], [0.10, 0.34, 0.38], [0.55, 0.48, 0.30], [0.35, 0.24, 0.14]];
const LOOK_COL_N = [['Marineblå', 'Navy'], ['Kornblå', 'Cornflower'], ['Signaloransje', 'Signal orange'], ['Oljegul', 'Oilskin yellow'], ['Rød', 'Red'], ['Flaskegrønn', 'Bottle green'], ['Olivengrønn', 'Olive'],
  ['Gråblå', 'Grey-blue'], ['Grå', 'Grey'], ['Svart', 'Black'], ['Kremhvit', 'Cream'], ['Sennep', 'Mustard'], ['Burgunder', 'Burgundy'], ['Petrol', 'Petrol'], ['Khaki', 'Khaki'], ['Oljebrun', 'Oil brown']];
const LOOK_SHOE_COLS = [9, 15, 10, 3, 5, 0];            // the colours offered for the shoes
const LOOK_HAIR = [['short', 'Kort', 'Short'], ['side', 'Sidestilt', 'Side-swept'], ['mid', 'Midlang', 'Medium'], ['long', 'Langt', 'Long'], ['pony', 'Hestehale', 'Ponytail'], ['braid', 'Flette', 'Braid'],
  ['bun', 'Knute', 'Bun'], ['curl', 'Krøllete', 'Curly'], ['ring', 'Tynt hår', 'Thinning'], ['none', 'Skallet', 'Bald']];
const LOOK_BEARD = [['none', 'Glattbarbert', 'Clean-shaven'], ['stache', 'Bart', 'Moustache'], ['goat', 'Hakeskjegg', 'Goatee'], ['short', 'Kortskjegg', 'Short beard'], ['full', 'Fullskjegg', 'Full beard'], ['mutton', 'Kinnskjegg', 'Mutton chops']];
const LOOK_HAT = [['none', 'Ingen', 'None', null], ['skippercap', 'Skipperlue', "Skipper's cap", 'skippercap'], ['beanie', 'Strikkelue', 'Knitted cap', 'beanie'], ['bobble', 'Toppluen', 'Bobble hat', 'hat_bobble'],
  ['bucket', 'Sydvest', 'Sou’wester', 'hat_bucket'], ['flat', 'Fiskerlue', "Fisherman's cap", 'hat_flat'], ['ball', 'Fiskercaps', 'Ball cap', 'hat_ball'], ['hardhat', 'Hjelm', 'Hard hat', 'hardhat']];
const LOOK_TOP = [['jacket', 'Arbeidsjakke', 'Work jacket', 'torso', 'jacketF'], ['sweater', 'Ullgenser', 'Wool sweater', 'sweater', 'sweaterF'], ['oilskin', 'Oljehyre', 'Oilskin', 'oilskin', 'oilskinF'],
  ['parka', 'Parka', 'Parka', 'parka', 'parkaF'], ['fleece', 'Fleece', 'Fleece', 'fleece', 'fleeceF']];
const LOOK_SHOE = [['boot', 'Gummistøvel', 'Rubber boots', 'boot'], ['shoe', 'Ankelstøvel', 'Ankle boots', 'shoe'], ['sneaker', 'Seilersko', 'Deck shoes', 'sneaker']];
const lookNames = (L, k) => L.find(x => x[0] === k);
const lookIdx = (a, k) => Math.max(0, a.findIndex(x => x[0] === k));
const lookClampI = (v, n, d) => { v = Math.round(+v); return v >= 0 && v < n ? v : d; };

// the start look: the player's own, as he has always looked (the skipper's cap, the navy sweater)
function lookDefault(){ return {b:'m', s:2, hs:'short', hc:2, bd:'none', ht:'skippercap', hk:null, tp:'sweater', tk:0, lg:8, sh:'boot', sc:9}; }
// a look from whatever was stored: every field known, in range
function lookClean(l){
  const d = lookDefault(); if (!l || typeof l !== 'object') return d;
  const has = (L, k, f) => L.some(x => x[0] === k) ? k : f;
  return {b:l.b === 'f' ? 'f' : 'm', s:lookClampI(l.s, LOOK_SKIN.length, d.s), hs:has(LOOK_HAIR, l.hs, d.hs), hc:lookClampI(l.hc, LOOK_HAIR_C.length, d.hc), bd:l.b === 'f' ? 'none' : has(LOOK_BEARD, l.bd, 'none'),
    ht:has(LOOK_HAT, l.ht, 'none'), hk:l.hk == null ? null : lookClampI(l.hk, LOOK_COL.length, null), tp:has(LOOK_TOP, l.tp, d.tp), tk:lookClampI(l.tk, LOOK_COL.length, d.tk), lg:lookClampI(l.lg, LOOK_COL.length, d.lg),
    sh:has(LOOK_SHOE, l.sh, d.sh), sc:lookClampI(l.sc, LOOK_COL.length, d.sc)};
}
const lookKey = l => [l.b, l.s, l.hs, l.hc, l.bd, l.ht, l.hk == null ? '-' : l.hk, l.tp, l.tk, l.lg, l.sh, l.sc].join('.');
// the paint and the part names of a look: what vessel3d.js wkPart and view3d.js wkMeshes take. The hair goes in its _h version under a hat (nothing
// on top of the head: tools/harbour/garderobe.py, checked against every hat), and under a rain hat the hairstyles with a bun or a tail on the
// back are a plain medium cut (the brim comes down over them)
const LOOK_KITS = {};
function lookKit(l){
  l = lookClean(l); const key = lookKey(l); if (LOOK_KITS[key]) return LOOK_KITS[key];
  const hat = lookNames(LOOK_HAT, l.ht), top = lookNames(LOOK_TOP, l.tp), shoe = lookNames(LOOK_SHOE, l.sh), f = l.b === 'f';
  let hs = l.hs; if (hs !== 'none' && l.ht === 'bucket' && (hs === 'bun' || hs === 'pony' || hs === 'braid')) hs = 'mid';
  const under = hat[3] != null;
  const hair = hs === 'none' ? null : hs === 'ring' ? 'hair_ring' : 'hair_' + hs + (under ? '_h' : '');
  if (Object.keys(LOOK_KITS).length > 400) for (const k in LOOK_KITS) delete LOOK_KITS[k];
  return LOOK_KITS[key] = {key:'L' + key, f, top:LOOK_COL[l.tk], legs:LOOK_COL[l.lg], skin:LOOK_SKIN[l.s], hair:LOOK_HAIR_C[l.hc], hatc:l.hk == null ? null : LOOK_COL[l.hk], shoec:LOOK_COL[l.sc],
    torso:f ? top[4] : top[3], hat:hat[3], hairP:hair, beard:l.bd === 'none' ? null : 'b_' + l.bd, shoe:shoe[3], look:l};
}

// ---- the crew's looks: drawn from the id, by age and sex ----
function lookHash(s){ let h = 2166136261; for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function lookRng(seed){ let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function lookPick(r, pairs){ let x = r() * pairs.reduce((a, q) => a + q[1], 0); for (const q of pairs){ x -= q[1]; if (x <= 0) return q[0]; } return pairs[0][0]; }
// a look for somebody of this sex and age (job: 'sea' for the crew, 'quay' for the people on the quays)
function lookFromSeed(seed, sex, age, job){
  const r = lookRng(lookHash(String(seed))), f = sex === 'f', old = age >= 50, older = age >= 65, d = lookDefault(), L = Object.assign({}, d);
  L.b = f ? 'f' : 'm'; L.s = lookPick(r, [[0, 10], [1, 28], [2, 36], [3, 14], [4, 7], [5, 3], [6, 1.5], [7, 0.5]]);
  L.hc = older ? lookPick(r, [[6, 5], [7, 4], [1, 0.5], [2, 0.5]]) : old ? lookPick(r, [[6, 3], [7, 1.2], [2, 1.2], [1, 1], [3, 1], [0, 0.6], [8, 0.4]])
    : lookPick(r, [[0, 1], [1, 2.2], [2, 2.5], [3, 1.8], [4, 1.5], [5, 0.6], [8, 0.4], [6, age >= 40 ? 0.7 : 0.05]]);
  L.hs = f ? lookPick(r, [['long', 25], ['mid', 20], ['pony', 15], ['braid', 10], ['bun', 10], ['short', 12], ['side', 5], ['curl', 3]])
    : lookPick(r, [['short', 30], ['side', 20], ['mid', 12], ['long', 3], ['curl', 8], ['pony', 3], ['braid', 1], ['bun', 1], ['ring', age >= 45 ? 10 : 0.5], ['none', age >= 40 ? 10 : 0.5]]);
  L.bd = f ? 'none' : age < 20 ? lookPick(r, [['none', 80], ['stache', 6], ['short', 14]]) : lookPick(r, [['none', 45], ['stache', 10], ['goat', 7], ['short', 15], ['full', 18], ['mutton', 5]]);
  const q = job === 'quay';
  L.ht = q ? lookPick(r, [['hardhat', 70], ['beanie', 12], ['ball', 10], ['none', 8]]) : lookPick(r, [['none', 14], ['skippercap', 8], ['beanie', 24], ['bobble', 8], ['bucket', 10], ['flat', 12], ['ball', 14], ['hardhat', 2]]);
  L.hk = L.ht === 'hardhat' ? lookPick(r, [[3, 50], [2, 20], [10, 20], [4, 10]]) : lookPick(r, [[0, 12], [2, 8], [3, 10], [4, 9], [5, 8], [6, 5], [8, 8], [9, 6], [11, 5], [12, 4], [13, 6], [1, 6], [15, 4]]);
  L.tp = q ? lookPick(r, [['jacket', 60], ['fleece', 20], ['parka', 20]]) : lookPick(r, [['oilskin', 30], ['sweater', 18], ['parka', 14], ['fleece', 16], ['jacket', 22]]);
  L.tk = L.tp === 'oilskin' ? lookPick(r, [[2, 28], [3, 26], [4, 12], [0, 12], [5, 14], [6, 8]]) : L.tp === 'sweater' ? lookPick(r, [[0, 20], [10, 22], [8, 14], [12, 10], [5, 10], [7, 12], [13, 12]])
    : lookPick(r, [[2, 14], [3, 8], [0, 12], [1, 10], [4, 7], [5, 8], [6, 6], [7, 8], [8, 6], [9, 5], [11, 5], [12, 3], [13, 6]]);
  L.lg = L.tp === 'oilskin' && r() < 0.5 ? lookPick(r, [[2, 40], [3, 40], [0, 20]]) : lookPick(r, [[0, 22], [8, 18], [9, 12], [15, 8], [14, 10], [5, 6], [1, 12], [7, 8]]);
  L.sh = lookPick(r, [['boot', 65], ['shoe', 20], ['sneaker', 15]]); L.sc = lookPick(r, [[9, 45], [15, 20], [10, 8], [3, 8], [5, 10], [0, 9]]);
  return lookClean(L);
}
// how far apart two looks are (the number of fields that differ): the crew of a boat and of the fleet keep at least 5 apart where they can
const lookDist = (a, b) => ['b', 's', 'hs', 'hc', 'bd', 'ht', 'hk', 'tp', 'tk', 'lg', 'sh', 'sc'].reduce((n, k) => n + (a[k] === b[k] ? 0 : 1), 0);
function lookAllCrew(){ const o = (S.crew || []).slice(); for (const v of S.fleet || []) if (v && v.crew && v.crew !== S.crew) o.push(...v.crew); return o; }
// the look of a crew member: kept on him; made from his id when he has none (an old save), and made different from the others'
function lookOf(c){
  if (!c) return null;
  if (c.look) return c.look;
  const others = lookAllCrew().filter(x => x !== c && x.look).map(x => x.look);
  let best = null, bd = -1;
  for (let i = 0; i < 14; i++){
    const L = lookFromSeed(c.id + (i ? '#' + i : ''), c.sex, c.age || 30, 'sea'), m = others.length ? Math.min(...others.map(o => lookDist(L, o))) : 99;
    if (m > bd){ bd = m; best = L; } if (m >= 5) break;
  }
  return c.look = best;
}
const lookMe = () => S.look ? lookClean(S.look) : lookDefault();
const lookCrew = i => lookOf(crewAboard()[i]);

// the people on a quay: each at a place has his own look from the place and his number (a hard hat mostly, and work clothes)
const LOOK_Q = new Map();
function lookQuay(id, i){
  const k = id + '|' + i; let l = LOOK_Q.get(k);
  if (!l){ const r = lookRng(lookHash(k + '#q')); l = lookFromSeed(k, r() < 0.25 ? 'f' : 'm', 20 + Math.floor(r() * 40), 'quay'); LOOK_Q.set(k, l); if (LOOK_Q.size > 300) LOOK_Q.delete(LOOK_Q.keys().next().value); }
  return l;
}
