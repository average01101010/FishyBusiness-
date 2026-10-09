// ===== The dream fish (05.10.2026; Jonas chose it from the list of what makes people play on). Father's notebook and his marks round the
// home harbour were taken out 09.10.2026 (Jonas: «notatboka kan fjernes i sin helhet og fars fiskeplasser strykes fra kartet»); an old
// game's S.notes is left as it is and read by nothing =====
// The dream fish: now and then something big takes the jig (dreamTick, each fishing minute): a halibut of 60-180 kg, a skrei of 25-42
// kg (most in its season), a ling of 18-30, a saithe of 16-24, a redfish of 8-13 or a tusk of 10-16, by how much of each stands there.
// About one in 30 hours of jigging on good ground. With you aboard and watching, the fight is yours (ui/06c-notebook.js); else the crew
// lands it half the time. What is landed goes in the hold and on the trophy wall (S.trophies); a halibut in its closed season goes back.
const DREAM = {
  kveite:{min:60, max:180, d:[40, 250]}, torsk:{min:25, max:42, d:[20, 200], months:[0, 1, 2, 3]}, lange:{min:18, max:30, d:[120, 400]},
  sei:{min:16, max:24, d:[15, 200]}, uer:{min:8, max:13, d:[100, 400]}, brosme:{min:10, max:16, d:[80, 400]}
};
function noteHome(){ return portById(S.home || HOME0) || PORTS[0]; }
// the nearest named place to p other than the home harbour (a harbour or a fishing ground)
function notePlace(p, not){
  let best = null; for (const q of PORTS.map(pt => ({n:pt.name, p:pt.p})).concat(GROUNDS.map(g => ({n:g.name.no, p:g.p})))){ if (q.n === not) continue; const d = dist(p, q.p); if (!best || d < best.d) best = {n:q.n, d}; }
  return best && best.d < 25 ? best.n : null;
}
// each fishing minute: a mark found, and now and then the dream fish
function dreamTick(H, p, room){
  // a fight left from a page that was closed or reloaded is lost
  if (S.dream && !(typeof window !== 'undefined' && window.DREAMUI && window.DREAMUI.active())) dreamEnd(false, true);
  if (S.dream || room < 30) return;
  const P = dreamP(H, p); if (!P.p || Math.random() > P.p) return;
  const ws = P.ws, w = P.w, halibut = P.halibut;
  let r = Math.random() * w, sp = ws[0][0]; for (const [s2, x] of ws){ if (r < x){ sp = s2; break; } r -= x; }
  if (halibut && Math.random() < 0.6) sp = 'kveite';
  const D = DREAM[sp], kg = Math.round((D.min + (D.max - D.min) * Math.pow(Math.random(), 1.8)) * 10) / 10;
  S.dream = {sp, kg, t:S.t, p:{x:p.x, y:p.y}};
  // you fight it when you are aboard and watching; else the crew does, and gets it in half the time
  if (meAboard() && typeof document !== 'undefined' && !document.hidden && window.DREAMUI && window.DREAMUI.start()) return;
  dreamEnd(Math.random() < 0.5, true);
}
// the chance a minute that a dream fish takes the jig at p: about one in 30 hours of jigging where two of the kinds stand well (density
// near 1 each), eight times as often on Father's halibut bank (found); with the kinds that stand there and how much ({p, w, ws, halibut})
function dreamP(H, p){
  const d = depthF(p), mon = gDate(H).getUTCMonth(); let w = 0; const ws = [];
  for (const sp in DREAM){ const D = DREAM[sp]; if (d < D.d[0] || d > D.d[1]) continue; let x = density(sp, p, H); if (D.months && !D.months.includes(mon)) x *= 0.25; ws.push([sp, x]); w += x; }
  return {p:w > 0 ? Math.min(0.02, w / 2 / (30 * 60)) : 0, w, ws, halibut:false};
}
// the end of the fight: landed (into the hold and onto the wall) or lost
function dreamEnd(won, crew){
  const D = S.dream; if (!D) return null; S.dream = null;
  const nm = SPECIES[D.sp], at = notePlace(D.p, '') || noteHome().name;
  if (!won){ log((crew ? 'Mannskapet' : 'Du') + ' hadde en stor ' + nm.no.toLowerCase() + ' på kroken, men den slet seg.', (crew ? 'The crew' : 'You') + ' had a big ' + nm.en.toLowerCase() + ' on the hook, but it got away.'); return {won:false, ...D}; }
  const rel = D.sp === 'kveite' && kveiteClosed(S.t / 60);
  if (!rel) addCatch(D.sp, Math.min(D.kg, Math.max(0, capHold() - holdTotal())), clsOf(D.sp, D.kg), true);   // what the hold has room for
  S.trophies = S.trophies || []; S.trophies.push({sp:D.sp, kg:D.kg, t:S.t, at, boat:S.boatName || '', rel, crew:!!crew});
  log((crew ? 'Mannskapet' : 'Du') + ' fikk en ' + nm.no.toLowerCase() + ' på ' + fmt(D.kg, 1) + ' kg ved ' + at + (rel ? '. Kveita er fredet nå, så den gikk ut igjen.' : '!'), (crew ? 'The crew' : 'You') + ' landed a ' + nm.en.toLowerCase() + ' of ' + fmt(D.kg, 1) + ' kg off ' + at + (rel ? '. Halibut is protected now, so it went back.' : '!'));
  msg('Kystposten', 'Storfisk: ' + nm.no.toLowerCase() + ' på ' + fmt(D.kg, 0) + ' kg tatt på juksa ved ' + at + '.', 'Big fish: a ' + nm.en.toLowerCase() + ' of ' + fmt(D.kg, 0) + ' kg taken on the jig off ' + at + '.');
  if (!rel) pressPut('fish', {sp:D.sp, kg:Math.round(D.kg)});   // and in the paper for the others (09h-press.js)
  return {won:true, rel, ...D};
}
