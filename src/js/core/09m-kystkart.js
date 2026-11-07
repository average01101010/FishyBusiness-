// ===== Kystkartet: the collection for the whole coast (docs/planer/oppdrag-2.md K2, docs/engasjement.md arbeidslista 7) =====
// Jonas 30.10.2026: «Ja, dette er intressante stats for enkelte, og vil bygge geografisk lærdom.» Four lists on one chart, filled by
// what the player already does: the fish plants landed at (the harbours with a plant, PORTS .mottak), the lighthouses photographed for
// Kystposten (FYR, src/data/fyr.json), the species landed (S.ach.sp) and Fiskeridirektoratet's statistical main areas fished in
// (RU.hom, the same areas as the seasons and the rules). Nothing new to do: a landing, a picture and a fishing hour set the dots. A game
// from before starts with what it has done (the plants and species from the sales, the pictures in the paper it keeps, the areas of the
// catch marks it keeps): endowed progress, never an empty map for one who has played.
// S.kk = {fyr:{index:t}, hom:{code:t}, mk:t of the last catch mark read, seed:1}
function kkState(){
  const K = S.kk || (S.kk = {fyr:{}, hom:{}, mk:0});
  K.fyr = K.fyr || {}; K.hom = K.hom || {};
  if (!K.seed){ K.seed = 1;
    try { for (const it of ((S.press || {}).own || [])) if (it.kind === 'foto' && it.d && it.d.fyr >= 0) K.fyr[it.d.fyr] = K.fyr[it.d.fyr] || Math.max(1, it.t || 1); } catch (e){}
    kkMarks(K); }
  return K;
}
// the area at a point (null outside them all: the areas are Fiskeridirektoratet's, they cover the sea along the whole coast)
function kkHomAt(p){ try { return p && typeof ruHom === 'function' ? ruHom(p) : null; } catch (e){ return null; } }
// a statistical area fished in: the fishing minute (09f-merker.js achMinute) and the catch marks (jig sessions and hauls, S.marks)
function kkFish(p){ const c = kkHomAt(p); if (!c) return null; const K = S.kk || kkState(); if (!K.hom[c]){ K.hom[c] = Math.max(1, S.t); return c; } return null; }
function kkMarks(K){ K = K || kkState(); let t = K.mk || 0; for (const m of S.marks || []){ if (m.t <= (K.mk || 0)) continue; kkFish(m); t = Math.max(t, m.t); } K.mk = t; }
// a lighthouse photographed for the paper (09g-turer.js turFotoTake), by its index in FYR
function kkFyr(fi){ if (!(fi >= 0)) return; const K = kkState(); if (!K.fyr[fi]) K.fyr[fi] = Math.max(1, S.t); }
// the plants: every harbour with a plant, and those landed at (the sales and the tally of landings, as the badge «Mottak langs kysten»)
const kkPlants = () => PORTS.filter(q => q.mottak);
function kkPlantsHad(){ const s = new Set((S.sales || []).map(x => x.port).filter(Boolean)); for (const k in ((S.tat && S.tat.plant) || {})) s.add(k);
  return new Set([...s].filter(id => { const pt = portById(id); return pt && pt.mottak; })); }
// the species a coastal boat can land (not the ones only the NPC fleet takes)
const kkSpecies = () => Object.keys(SPECIES).filter(s => !SPECIES[s].npc);
// the four lists: what is had and how many there are
function kkCount(){
  const K = kkState(), sp = (S.ach && S.ach.sp) || {}, all = kkSpecies(), had = kkPlantsHad();
  return {mottak:[had.size, kkPlants().length], fyr:[Object.keys(K.fyr).filter(i => FYR && FYR[i]).length, FYR ? FYR.length : 0],
    arter:[all.filter(s => sp[s]).length, all.length], omr:[Object.keys(K.hom).filter(c => RU.hom.some(h => h.c === c)).length, RU.hom.length]};
}
// each game minute with the boat fishing (achMinute), and the catch marks every ten
function kkMinute(){ const b = S.boat; if (!b) return; const K = kkState(); if (b.status === 'fishing' && S.t % 5 === 0) kkFish(b.pos); if (S.t % 10 === 0) kkMarks(K); }
