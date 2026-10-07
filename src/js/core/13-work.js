// ================= work aboard: stations, and each person's chain of them =================
// Every minute each person aboard goes to the first station in their chain that has work. With none, they rest (M4: or cook).
// The helm and the hauling are never left empty: when nobody has them in the chain, someone with nothing to do takes them.
// The default chains give what the boat did before: you steer, haul and fish, the first hand guts and ices, the others fish,
// haul and help on deck. Each station goes at the speed of the people on it (crewEff for that skill; you count as 1).
const STATIONS = {
  ror:{no:'Ror', en:'Helm', ing:['Styrer', 'Steering']},
  fiske:{no:'Fiske', en:'Fishing', ing:['Fisker', 'Fishing']},
  haling:{no:'Haling', en:'Hauling', ing:['Haler', 'Hauling']},
  sort:{no:'Krabbesortering', en:'Crab sorting', ing:['Sorterer krabbe', 'Sorting crab'], skill:'sort'},
  sloy:{no:'Sløying', en:'Gutting', ing:['Sløyer', 'Gutting'], skill:'sloy'},
  is:{no:'Ising', en:'Icing', ing:['Iser', 'Icing'], skill:'is'},
  kokk:{no:'Kokk', en:'Cook', ing:['Lager mat', 'Cooking']},
  pause:{no:'Pause', en:'Break', ing:['Pause', 'On a break']}
};
const WORK_ST = ['ror', 'fiske', 'haling', 'sort', 'sloy', 'is', 'kokk'];
const JOB_ME = ['ror', 'haling', 'fiske', 'sloy', 'is'], JOB_FIRST = ['sloy', 'is', 'haling', 'fiske'], JOB_REST = ['fiske', 'haling', 'sloy', 'is'];
// ready-made setups: null is the default chain
const JOB_PRESETS = {
  en:{no:'Én på dekk', en:'One on deck', first:null, rest:null},
  fisk:{no:'Alle fisker', en:'All fish', first:['fiske', 'haling', 'sloy', 'is'], rest:['fiske', 'haling', 'sloy', 'is']},
  dekk:{no:'Alle på dekk', en:'All on deck', first:['sloy', 'is', 'haling', 'fiske'], rest:['sloy', 'is', 'haling', 'fiske']}
};
function jobPreset(k){ const P = JOB_PRESETS[k]; crewAboard().forEach((c, i) => { const j = i === 0 ? P.first : P.rest; c.job = j ? j.slice() : null; }); S.myJob = null; }
const jobOf = (c, i) => c ? (c.job || (i === 0 ? JOB_FIRST : JOB_REST)) : (S.myJob || JOB_ME);
// What is done with the catch: gutted when someone aboard has gutting in their chain, iced when someone has icing (the work menu decides;
// the phone's switches for it are gone, the user's wish 03.10.2026). S.settings.gut and .ice decide when they are set (the tests).
function workChains(){ const L = []; if (meAboard()) L.push(jobOf(null)); crewAboard().forEach((c, i) => L.push(jobOf(c, i))); return L; }
function catchGut(){ const v = S.settings.gut; return v === true || v === false ? v : workChains().some(j => j.includes('sloy')); }
function catchIce(){ const v = S.settings.ice; return v === true || v === false ? v : workChains().some(j => j.includes('is')); }

// what has work now (the hauler waits while the boat is stopped to gut, so those on it go on deck: tilbakemelding #29). as = 'fishing': as if the boat were jigging where it lies (for the fishing effort outside the fishing minute)
function workCtx(as){
  const b = S.boat, st = S.settings, s = as === 'fishing' ? 'fishing' : b.status, g = as === 'fishing' ? null : b.gop, stop = as === 'fishing' ? false : !!b.deckStop;
  const icing = catchIce() && b.ice > 0.5, cg = catchGut(); let gut = 0, ice = 0, pend = 0;
  for (const x of S.hold){ if (SPECIES[x.sp].live || x.iced) continue; if (cg && !x.gut) gut += x.kg; else if (icing) ice += x.kg; if ((cg && !x.gut) || icing) pend += x.kg; }
  const deck = s !== 'aground' && pend > 0.5;
  return {s, stop, ror:s === 'sailing' || s === 'unmooring' || s === 'engine', fiske:s === 'fishing' && !g && !stop && rigJig(), haling:!!g && !stop,
    sort:!!g && g.kind === 'teine' && g.op === 'haul', hands:g && g.kind === 'garn' && g.op === 'haul' ? 2 : 1, sloy:deck && gut > 0.01, is:deck && ice > 0.01, kokk:as !== 'fishing' && mealDue(), pause:true};
}
// who stands where: [{c (null for you), st}], you first
function workAssign(as){
  const team = crewAboard(), ctx = workCtx(as), P = [];
  if (meAboard() && !asleep()) P.push({c:null, job:jobOf(null)});
  team.forEach((c, i) => P.push({c, job:jobOf(c, i)}));
  if (!P.length) return P;
  if (ctx.s === 'aground'){ for (const p of P) p.st = 'pause'; return P; }
  // the helm and the galley take one person each: the first whose chain gets there
  let helm = false, cook = false;
  for (const p of P){ p.st = 'pause';
    for (const k of p.job) if (ctx[k] && (k !== 'ror' || !helm) && (k !== 'kokk' || !cook)){ p.st = k; if (k === 'ror') helm = true; if (k === 'kokk') cook = true; break; } }
  // nobody at the helm: someone resting, else the best seaman (you before the crew)
  const sjo = p => p.c ? p.c.attr.sjo : 9;
  if (ctx.ror && !helm){ const q = P.filter(p => p.st === 'pause'), who = (q.length ? q : P).slice().sort((a, b) => sjo(b) - sjo(a))[0]; who.st = 'ror'; }
  // gear half out cannot wait: someone resting hauls, else whoever is on deck. Alone aboard with the tub full (stopped to gut), the
  // haul waits while the one aboard guts and ices, and goes on after (07.10.2026: before, the one aboard was taken off the deck to the
  // hauler, the deck work never came, and the haul stood still between «tub full» and «deck work done» for good)
  const alone = P.length < 2 && ctx.stop && (ctx.sloy || ctx.is);
  // hauling a net takes two at the hauler: one pulls and one bleeds the fish as it comes over the rail (tilbakemelding #30), so with two
  // aboard nobody guts during the haul and the bleeding tub fills (the haul then goes slower, haulSlow in 10-gear.js); a third hand guts
  if (ctx.haling && !alone) for (let n = ctx.hands; n > 0 && P.filter(p => p.st === 'haling').length < Math.min(ctx.hands, P.length); n--){
    const who = P.find(p => p.st === 'pause') || P.find(p => p.st === 'sloy' || p.st === 'is' || p.st === 'sort'); if (!who) break; who.st = 'haling'; }
  if (ctx.hands > 1) P.filter(p => p.st === 'haling').forEach((p, i) => { p.bl = i > 0; });   // the second at the hauler bleeds
  // a meal is due and nobody has the galley in the chain: the best cook among those on a break, if they can cook (3 or more)
  if (ctx.kokk && !cook){ const q = P.filter(p => p.st === 'pause' && p.c && p.c.attr.kokk >= MEAL.ok).sort((a, b) => b.c.attr.kokk - a.c.attr.kokk)[0]; if (q) q.st = 'kokk'; }
  // stopped to gut: everyone free goes on deck
  if (ctx.stop) for (const p of P) if ((p.st === 'pause' || (alone && p.st === 'haling')) && (ctx.sloy || ctx.is)) p.st = ctx.sloy ? 'sloy' : 'is';
  return P;
}
// the people on a station and what they do there together: n, the sum of their efficiency for skill g, and the mean
function workTeam(st, g, as){
  const H = S.t / 60, hs = hsWork(S.boat.pos, H), on = workAssign(as).filter(p => Array.isArray(st) ? st.includes(p.st) : p.st === st);
  const sum = on.reduce((a, p) => a + (p.c ? crewEff(p.c, H, hs, g) : meEff()), 0);
  return {n:on.length, sum, eff:on.length ? sum / on.length : 1, crew:on.filter(p => p.c).map(p => p.c), me:on.some(p => !p.c)};
}
// once a minute per vessel: where each person is, and minutes per station (for learning)
function workMinute(){
  const A = workAssign(); if (meAboard()) S.mySt = null;
  for (const c of S.crew || []) c.st = null;
  for (const p of A){ if (!p.c){ S.mySt = p.st; continue; } p.c.st = p.st; if (WORK_ST.includes(p.st) && S.boat.status !== 'port'){ const w = p.c.wk || (p.c.wk = {}); w[p.st] = (w[p.st] || 0) + 1; } }
  mealMinute(A);
  return A;
}
