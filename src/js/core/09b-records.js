// ===== Personal records: the biggest fish you have landed of each species (Jonas 09.10.2026: «Nå kjører vi kun på største fisk man har
// fisket, en slags trofevegg med personlige rekorder») =====
// Every fish that comes aboard (addCatch, 05-vessels.js) is weighed against the record of its species, S.rec[sp] = {sp, kg, t, at, boat,
// how}: the weight, when, the nearest place, the boat's name and the gear (juksa, line, garn or teine). A bigger one takes its place.
// The wall in Father's naust and the Rekordfisk tab in Milepæler show them (ui/06c-notebook.js wall). The dream fish and Father's notebook
// are gone; an old game's S.trophies is folded into the records the first time they are read (the biggest of each species), and S.dream
// is dropped. A game from before has no history of single fish, so its records start with the trophies and with what is landed from now.
const REC_HOW = {juksa:['juksa', 'the jig'], line:['line', 'long line'], garn:['garn', 'net'], teine:['teine', 'pot']};
function recState(){
  if (!S.rec){
    S.rec = {};
    for (const x of S.trophies || []){ const o = S.rec[x.sp]; if (SPECIES[x.sp] && (!o || x.kg > o.kg)) S.rec[x.sp] = {sp:x.sp, kg:x.kg, t:x.t, at:x.at || '', boat:x.boat || '', how:'juksa'}; }
  }
  delete S.trophies; delete S.dream;
  return S.rec;
}
// the nearest named place (a harbour or a fishing ground) within 25 km, else ''
function recPlace(p){
  let best = null; for (const q of PORTS.map(pt => ({n:pt.name, p:pt.p})).concat(GROUNDS.map(g => ({n:g.name[S.lang] || g.name.no, p:g.p})))){ const d = dist(p, q.p); if (!best || d < best.d) best = {n:q.n, d}; }
  return best && best.d < 25 ? best.n : '';
}
function recCatch(sp, kg, how){
  if (!SPECIES[sp] || !(kg > 0)) return;
  const R = recState(), o = R[sp]; kg = Math.round(kg * 10) / 10; if (o && kg <= o.kg) return;
  R[sp] = {sp, kg, t:S.t, at:recPlace(S.boat.pos), boat:S.boatName || '', how:how || 'juksa'};
  const nm = SPECIES[sp], quiet = typeof tutOn === 'function' && tutOn();
  if (!o){ if (!quiet) log('Første ' + nm.no.toLowerCase() + ' på rekordlista: ' + fmt(kg, 1) + ' kg.', 'First ' + nm.en.toLowerCase() + ' on the record list: ' + fmt(kg, 1) + ' kg.'); return; }
  // a clearly bigger one gets a message; a few grams more only changes the wall
  if (!quiet && kg >= o.kg * 1.15 && kg >= 1) msg('Trofeveggen', 'Ny rekord: ' + nm.no.toLowerCase() + ' på ' + fmt(kg, 1) + ' kg (før ' + fmt(o.kg, 1) + ' kg).', 'New record: ' + nm.en.toLowerCase() + ' of ' + fmt(kg, 1) + ' kg (was ' + fmt(o.kg, 1) + ' kg).');
}
// every species in order, with its record or null: [{sp, rec}]
const recList = () => { const R = recState(); return Object.keys(SPECIES).map(sp => ({sp, rec:R[sp] || null})); };
