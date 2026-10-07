// ===== Father's notebook and the dream fish (05.10.2026; Jonas chose them from the list of what makes people play on, 2 and 3) =====
// The notebook: Father's five marks round the home harbour (S.home, else Finnsnes), each where one species stands best within 2 to 12 km
// (cod on 20-80 m, haddock on 60-160 m, saithe on 20-120 m, ling on 150-350 m, halibut on 40-140 m), at least 1.5 km apart, made once
// (S.notes.marks) with the words he wrote: the way from the harbour, how far, the place near by and the depth in fathoms. Fishing within
// 400 m of a mark finds it (S.notes.found): from then that species bites 30 % better there (noteBoost, in fish()), and on the halibut mark
// the dream fish comes eight times as often.
// The dream fish: now and then something big takes the jig (dreamTick, each fishing minute): a halibut of 60-180 kg, a skrei of 25-42
// kg (most in its season), a ling of 18-30, a saithe of 16-24, a redfish of 8-13 or a tusk of 10-16, by how much of each stands there.
// About one in 30 hours of jigging on good ground. With you aboard and watching, the fight is yours (ui/06c-notebook.js); else the crew
// lands it half the time. What is landed goes in the hold and on the trophy wall (S.trophies); a halibut in its closed season goes back.
const DREAM = {
  kveite:{min:60, max:180, d:[40, 250]}, torsk:{min:25, max:42, d:[20, 200], months:[0, 1, 2, 3]}, lange:{min:18, max:30, d:[120, 400]},
  sei:{min:16, max:24, d:[15, 200]}, uer:{min:8, max:13, d:[100, 400]}, brosme:{min:10, max:16, d:[80, 400]}
};
const NOTE_SP = [['torsk', 20, 80], ['hyse', 60, 160], ['sei', 20, 120], ['lange', 150, 350], ['kveite', 40, 140]];
const NOTE_NAME = {torsk:['Torskegrunnen', 'The cod ground'], hyse:['Hyseflaket', 'The haddock flat'], sei:['Seistrømmen', 'The saithe current'], lange:['Langedjupet', 'The ling deep'], kveite:['Kveitebakken', 'The halibut bank']};
const NOTE_DIRS = [['nord', 'north'], ['nordøst', 'north-east'], ['øst', 'east'], ['sørøst', 'south-east'], ['sør', 'south'], ['sørvest', 'south-west'], ['vest', 'west'], ['nordvest', 'north-west']];
function noteHome(){ return portById(S.home || 'finnsnes') || PORTS[0]; }
// Father's marks round the home harbour (needs the map round it: made when the boat is there)
function notesMake(){
  const home = noteHome(), H = S.t / 60, marks = [];
  const cand = [];
  for (let r = 2; r <= 12; r += 0.5) for (let a = 0; a < 360; a += 12){
    const q = {x:home.p.x + Math.sin(a * Math.PI / 180) * r, y:home.p.y - Math.cos(a * Math.PI / 180) * r};
    if (!mapSimAt(q) || !mapReadyAt(q, 0) || isLand(q)) continue; cand.push({q, r, a, d:depthF(q)});
  }
  for (const [sp, d0, d1] of NOTE_SP){
    let best = null;
    for (const c of cand){ if (c.d < d0 || c.d > d1 || marks.some(m => dist(m.p, c.q) < 1.5)) continue; const s = density(sp, c.q, H) - c.r * 0.004; if (!best || s > best.s) best = {...c, s}; }
    if (!best) continue;
    const near = notePlace(best.q, home.name), dir = NOTE_DIRS[Math.round(((best.a % 360) + 360) % 360 / 45) % 8];
    // the circle the notebook shows on the chart before the mark is found: 1 km across, the mark somewhere inside it
    const ca = Math.random() * 6.283, cr = Math.random() * 0.35, P2 = v => Math.round(v * 1000) / 1000;
    marks.push({id:sp, sp, p:{x:P2(best.q.x), y:P2(best.q.y)}, c:{x:P2(best.q.x + Math.cos(ca) * cr), y:P2(best.q.y + Math.sin(ca) * cr)}, nm:Math.round(best.r / NM * 10) / 10, dir, near, fv:Math.round(best.d / 1.83)});
  }
  S.notes = {home:home.id, marks, found:{}, made:S.t};
  return S.notes;
}
// the nearest named place to p other than the home harbour (a harbour or a fishing ground)
function notePlace(p, not){
  let best = null; for (const q of PORTS.map(pt => ({n:pt.name, p:pt.p})).concat(GROUNDS.map(g => ({n:g.name.no, p:g.p})))){ if (q.n === not) continue; const d = dist(p, q.p); if (!best || d < best.d) best = {n:q.n, d}; }
  return best && best.d < 25 ? best.n : null;
}
// a found mark makes its species bite 30 % better within 400 m; with every mark found, Father's old jig gives 5 % more everywhere
const noteAll = () => !!(S.notes && S.notes.marks && S.notes.marks.length && S.notes.marks.every(m => S.notes.found[m.id]));
function noteBoost(sp, p){
  const N = S.notes; if (!N || !N.marks) return 1;
  const all = noteAll() ? 1.05 : 1;
  for (const m of N.marks) if (m.sp === sp && N.found[m.id] && dist(m.p, p) < 0.4) return 1.3 * all;
  return all;
}
// each fishing minute: a mark found, and now and then the dream fish
function dreamTick(H, p, room){
  // the first time you fish on your own (after «Første tur», or in a game from before): the notebook turns up
  if (!S.notesMsg && !S.tut){ S.notesMsg = 1; msg('Naustet', 'I fars naust lå en gammel notatbok med medene hans rundt havna. Se Notatbok på telefonen.', 'In Father\u2019s boathouse lay an old notebook with his marks round the harbour. See Notebook on the phone.'); }
  const N = S.notes;
  if (N && N.marks) for (const m of N.marks) if (!N.found[m.id] && dist(m.p, p) < 0.4){
    N.found[m.id] = S.t; const nm = NOTE_NAME[m.sp];
    log('Du fant fars méd «' + nm[0] + '». Her biter ' + SPECIES[m.sp].no.toLowerCase() + ' bedre.', 'You found Father’s mark «' + nm[1] + '». ' + SPECIES[m.sp].en + ' bite better here.');
    msg('Notatboka', 'Fars méd «' + nm[0] + '» er funnet. Han skrev noe ved siden av, se notatboka.', 'Father’s mark «' + nm[1] + '» is found. He wrote something beside it, see the notebook.');
    if (noteAll()) msg('Notatboka', 'Alle fars méd er funnet. Inni permen lå den gamle pilken hans: litt bedre fangst overalt.', 'All Father\u2019s marks are found. Inside the cover lay his old jig: a little better catch everywhere.');
  }
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
  const N = S.notes, d = depthF(p), mon = gDate(H).getUTCMonth(); let w = 0; const ws = [];
  for (const sp in DREAM){ const D = DREAM[sp]; if (d < D.d[0] || d > D.d[1]) continue; let x = density(sp, p, H); if (D.months && !D.months.includes(mon)) x *= 0.25; ws.push([sp, x]); w += x; }
  const halibut = !!(N && N.marks && N.marks.some(m => m.sp === 'kveite' && N.found[m.id] && dist(m.p, p) < 0.5));
  return {p:w > 0 ? Math.min(0.02, w / 2 / (30 * 60)) * (halibut ? 8 : 1) : 0, w, ws, halibut};
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
