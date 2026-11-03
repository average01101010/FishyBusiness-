// ===== Ukas fangst: the Sunday card (docs/planer/oppdrag-2.md U1, docs/engasjement.md arbeidslista 6; Jonas 30.10.2026: «10. Ja.») =====
// Once a game week, from Sunday 18:00 game time, a card looks back on the week: what was landed and earned, the best day, the biggest
// fish, the species, the plants, the new dots on Kystkartet, and from the cloud the place on the leaderboard, the fiskarlag's week and
// what the neighbours in the harbour landed, and the season's board. Not a daily and nothing to miss: a week with nothing landed has
// no card, a week not seen is shown when the game is next opened (the latest only), and the card is in the Sesong app until the next.
// The game week is the one the leaderboard and the fiskarlag count (weekOf: 168 game hours from Monday 06:00, so the card comes on the
// week's last evening). The one push a week from the world is the server's (push_week, 20261103120000_push_ukas.sql).
// S.uke = {big:{w, sp, kg} the biggest fish of the week, seen:w the last card shown}
const UKE = {sun:156};   // Sunday 18:00: hours into the game week (it starts Monday 06:00)
function ukeState(){ const U = S.uke || (S.uke = {big:null, seen:-1}); if (U.seen == null) U.seen = -1; return U; }
// every fish over the rail (09b-records.js recCatch): the week's biggest
function ukeBig(sp, kg){ if (!(kg > 0) || !SPECIES[sp]) return; const U = ukeState(), w = weekOf(S.t / 60);
  if (!U.big || U.big.w !== w || kg > U.big.kg) U.big = {w, sp, kg:Math.round(kg * 10) / 10}; }
// the week w in numbers, from the sales (every boat of the company) and what the game keeps
function ukeSum(w){
  const m0 = w * 168 * 60, m1 = (w + 1) * 168 * 60, sales = (S.sales || []).filter(x => x.t >= m0 && x.t < m1);
  const kg = sales.reduce((a, x) => a + (x.kg || 0), 0), kr = sales.reduce((a, x) => a + (x.total || 0), 0);
  const day = new Array(7).fill(0), sp = {}, ports = {};
  for (const x of sales){ const d = Math.min(6, Math.floor((x.t - m0) / 1440)); day[d] += x.kg || 0;
    for (const [s, k] of x.sp || []) sp[s] = (sp[s] || 0) + k; if (x.port) ports[x.port] = (ports[x.port] || 0) + (x.kg || 0); }
  let best = -1; for (let d = 0; d < 7; d++) if (day[d] > 0 && (best < 0 || day[d] > day[best])) best = d;
  const U = ukeState(), big = U.big && U.big.w === w ? U.big : null;
  // what the week set on Kystkartet (core/09m-kystkart.js): the areas and lighthouses first had this week; the plants first landed at
  const K = typeof kkState === 'function' ? kkState() : {hom:{}, fyr:{}}, inW = t => t >= m0 && t < m1;
  const before = new Set((S.sales || []).filter(x => x.t < m0).map(x => x.port));
  const newPlants = Object.keys(ports).filter(id => !before.has(id) && (portById(id) || {}).mottak).length;
  return {w, kg:Math.round(kg), kr:Math.round(kr), n:sales.length, day:day.map(Math.round), best, bestKg:best >= 0 ? Math.round(day[best]) : 0,
    sp:Object.entries(sp).sort((a, b) => b[1] - a[1]).map(([s, k]) => [s, Math.round(k)]), ports:Object.entries(ports).sort((a, b) => b[1] - a[1]).map(([p, k]) => [p, Math.round(k)]), big,
    kk:{mottak:newPlants, omr:Object.values(K.hom).filter(inW).length, fyr:Object.values(K.fyr).filter(inW).length}};
}
// the hour the card for week w may come (Sunday 18:00 of that week)
const ukeAt = w => w * 168 + UKE.sun;
// the week whose card is due now: this week from Sunday evening, else last week if it was never shown; only a week with a landing
function ukeDue(){
  const H = S.t / 60, w = weekOf(H), U = ukeState();
  for (const k of H >= ukeAt(w) ? [w, w - 1] : [w - 1]){ if (k < 0 || U.seen >= k) continue; if (ukeSum(k).kg > 0) return k; }
  return null;
}
// the card last due (shown or not): for the Sesong app, until the next one
function ukeLast(){ const H = S.t / 60, w = weekOf(H); return H >= ukeAt(w) ? w : w - 1; }
