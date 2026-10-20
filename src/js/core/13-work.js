// ================= work aboard: stations, and each person's chain of them =================
// Every minute each person aboard goes to the first station in their chain that has work and room. With none, they rest (M4: or cook).
// The helm and the hauling are never left empty: when nobody has them in the chain, someone with nothing to do takes them.
// The default chains give what the boat did before: you steer, haul and fish, the first hand guts and ices, the others fish,
// haul and help on deck. Each station goes at the speed of the people on it (crewEff for that skill; you count as 1).
// Each station has its places (Jonas 20.10.2026, tilbakemelding #75: «det burde kun være en mann som har ansvaret for haling mens de
// andre tar seg av bløgging, sløying, og ising fortløpende»): the hauler takes as many as the boat has haulers (BOAT.stations.hauler;
// a net also one who picks the fish out of the meshes, pots one who empties, baits and stacks them), the bleeder one while the fish come
// aboard, the gutting table stations.table, the icing one (two on the big decks). Whoever is left over takes the free work with most to do
// («tar ansvar om det er ledig arbeid på noen av stasjonene»): the fish first, then the crew's own jobs on the gear (baiting, stripping,
// mending; 10b-gearcare.js CREW_JOBS), which go at the pace of the hands on them; else they rest.
const STATIONS = {
  ror:{no:'Ror', en:'Helm', ing:['Styrer', 'Steering']},
  fiske:{no:'Fiske', en:'Fishing', ing:['Fisker', 'Fishing']},
  haling:{no:'Haling', en:'Hauling', ing:['Haler', 'Hauling']},
  blogg:{no:'Bløgging', en:'Bleeding', ing:['Bløgger', 'Bleeds'], skill:'sloy'},
  sort:{no:'Krabbesortering', en:'Crab sorting', ing:['Sorterer krabbe', 'Sorting crab'], skill:'sort'},
  sloy:{no:'Sløying', en:'Gutting', ing:['Sløyer', 'Gutting'], skill:'sloy'},
  is:{no:'Ising', en:'Icing', ing:['Pakker og iser', 'Packing and icing'], skill:'is'},
  kokk:{no:'Kokk', en:'Cook', ing:['Lager mat', 'Cooking']},
  // the crew's own jobs on the gear: free hands take them, as many as there is room for
  egn:{no:'Egning', en:'Baiting', ing:['Egner line', 'Baiting line'], skill:'line'},
  strip:{no:'Rensing', en:'Stripping', ing:['Renser line', 'Strips line'], skill:'line'},
  mend:{no:'Bøting', en:'Mending', ing:['Bøter garn', 'Mending nets'], skill:'garn'},
  stell:{no:'Vedlikehold', en:'Upkeep', ing:['Steller redskap', 'Gear upkeep']},
  last:{no:'Last', en:'Cargo', ing:['Laster', 'Handling cargo']},
  pause:{no:'Pause', en:'Break', ing:['Pause', 'On a break']}
};
const WORK_ST = ['ror', 'fiske', 'haling', 'blogg', 'sort', 'sloy', 'is', 'kokk'];
// the crew's jobs (10b-gearcare.js CREW_JOBS) by the station they are worked at, and the skill each goes by
const JOB_ST = {egn:'egn', strip:'strip', mend:'mend', hk:'stell', lr:'stell', pr:'stell', jg:'stell', last:'last'};
const JOB_SKILL = {egn:'line', strip:'line', hk:'line', lr:'line', mend:'garn', pr:'teiner', jg:'juksa'};
const WORK_ALL = WORK_ST.concat(['egn', 'strip', 'mend', 'stell', 'last']);   // (the minutes of work that tire and teach, workMinute)
// (the others pack and ice before they take the table's second place: one hauls, one bleeds, one guts and one packs and ices as it comes)
const JOB_ME = ['ror', 'haling', 'fiske', 'sloy', 'is'], JOB_FIRST = ['sloy', 'is', 'haling', 'fiske'], JOB_REST = ['fiske', 'haling', 'is', 'sloy'];
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
// the places at the hauler: the boat's haulers (stations.hauler), and on a net one more who picks the fish out of the meshes, on pots one
// more who empties, baits and stacks them
const haulPlaces = () => (BOAT.stations && BOAT.stations.hauler) || 1;
function stPlaces(st, ctx){
  const T = (BOAT.stations && BOAT.stations.table) || 1;
  if (st === 'haling') return haulPlaces() + (ctx.gk === 'line' ? 0 : 1);
  if (st === 'blogg' || st === 'ror' || st === 'kokk') return 1;
  if (st === 'sloy' || st === 'sort') return T;
  if (st === 'is') return T >= 3 ? 2 : 1;
  return Infinity;   // fishing at the rail, a break
}

// what has work now (the hauler waits while the boat is stopped to gut, so those on it go on deck: tilbakemelding #29). as = 'fishing': as if the boat were jigging where it lies (for the fishing effort outside the fishing minute)
function workCtx(as){
  const b = S.boat, st = S.settings, s = as === 'fishing' ? 'fishing' : b.status, g = as === 'fishing' ? null : b.gop, stop = as === 'fishing' ? false : !!b.deckStop;
  const icing = catchIce() && b.ice > 0.5, cg = catchGut(); let gut = 0, ice = 0, pend = 0;
  for (const x of S.hold){ if (SPECIES[x.sp].live || x.iced) continue; if (cg && !x.gut) gut += x.kg; else if (icing) ice += x.kg; if ((cg && !x.gut) || icing) pend += x.kg; }
  const deck = s !== 'aground' && pend > 0.5, gk = g ? g.kind : null;
  // the icing station packs what is gutted into the crate or the tub and ices it as it comes from the table, so it has work while anything is
  // on its way to it (the gutted fish, and the round fish waiting for the knife)
  return {s, stop, ror:s === 'sailing' || s === 'unmooring' || s === 'engine', fiske:s === 'fishing' && !g && !stop, haling:!!g && !stop, gk,
    blogg:!!g && g.op === 'haul' && gk !== 'teine' && !stop && s !== 'aground', gutKg:cg ? gut : 0, iceKg:icing ? gut + ice : 0,
    sort:!!g && gk === 'teine' && g.op === 'haul', hands:g && gk === 'garn' && g.op === 'haul' ? 2 : 1, sloy:deck && gut > 0.01, is:deck && icing && (ice > 0.01 || gut > 0.01), kokk:as !== 'fishing' && mealDue(), pause:true};
}
// ---- the crew's own jobs as stations: where they may be worked (in port, or at sea while she goes or lies still: seaWork), how many can
// work one at once (a tub each at the line, a net each at the string, up to the deck's room by the table and one), and what n of them do
function jobsOpen(as){ const b = S.boat; return as !== 'fishing' && (b.status === 'port' || (typeof seaWork === 'function' && seaWork())) ? (S.jobs || []).filter(j => typeof crewJob === 'function' && crewJob(j) && JOB_ST[j.kind]) : []; }
function jobPlaces(j){
  const T = (BOAT.stations && BOAT.stations.table) || 1, pg = S.pgear, by = n => clamp(Math.round(n || 1), 1, T + 1);
  if (j.kind === 'egn' || j.kind === 'strip') return by(j.n);
  if (j.kind === 'hk' || j.kind === 'lr') return by(pg && pg.lines && pg.lines[j.lk] ? pg.lines[j.lk].n : 1);
  if (j.kind === 'mend'){ const s = pg && (pg.shore || []).find(x => x.kind === 'mendself' && x.lenke && x.lenke.id === j.nid); return by(s ? s.lenke.n : 2); }
  if (j.kind === 'pr') return 2;
  if (j.kind === 'last') return BOAT.crane ? 2 : 4;
  return 1;   // a new jig set is fitted by one
}
// one person's minutes a minute for n on a job: at the line two bait twice as fast as one and each further hand half a tub more (they
// share the bait tub; egnSelf, tilbakemelding #28); the crane takes the freight at its own pace (cargoMin); the rest add up
function jobCoop(j, n){ if (n <= 0) return 0; if (j.kind === 'egn' || j.kind === 'strip') return n <= 2 ? n : 2 + 0.5 * (n - 2); if (j.kind === 'last' && BOAT.crane) return 1; return n; }
// the work in a job, in one person's minutes at an even pace (j.w; j.wd is done). A job is queued with its hours for all the hands aboard
// then (egnSelf, mendSelf, careQuote, cargoMin), so its work is those hours at their pace; a job may give one person's hours itself (h1).
// A job from before this (running on its end time alone) keeps what it has done.
function jobW(j){
  if (j.w > 0) return j;
  const team = crewAboard(), me = meAboard(), n = Math.max(1, (me ? 1 : 0) + team.length), e = j.kind === 'last' ? 1 : teamEff(team, me, JOB_SKILL[j.kind] || 'juksa');
  j.w = Math.max(1, j.h1 > 0 ? j.h1 * 60 : (j.h || 0.2) * 60 * jobCoop(j, n) * e);
  j.wd = j.until != null && j.h > 0 ? j.w * clamp(1 - (j.until - S.t) / (j.h * 60), 0, 1) : 0; j.uw = j.until; return j;
}
function jobRate(j, A){
  const on = A.filter(p => p.jw === j), n = on.length; if (!n) return 0; if (j.kind === 'last') return jobCoop(j, n);
  const H = S.t / 60, hs = hsWork(S.boat.pos, H), sk = JOB_SKILL[j.kind] || 'juksa';
  return jobCoop(j, n) * on.reduce((a, p) => a + (p.c ? crewEff(p.c, H, hs, sk) : meEff()), 0) / n;
}
// a minute of a crew job by those on it (A: this minute's workAssign); the end time and the hours follow their pace, so the queue shows
// the time left as it is (ui/05-phone.js: done = 1 - left / h). True when the job is done.
function jobMinute(j, A){
  jobW(j);
  // the end time was moved from outside (overtime halves what is left, admin's «done now»): the work left follows it
  if (j.until != null && j.uw != null && j.until !== j.uw){ if (j.until <= S.t){ j.wd = j.w; return true; }
    j.wd = j.w - (j.w - j.wd) * clamp((j.until - S.t) / Math.max(1, j.uw - S.t), 0, 1); }
  const r = jobRate(j, A || []);
  if (r > 0){ j.wd += r; if (j.wd >= j.w - 1e-6) return true; j.h = j.w / r / 60; j.until = S.t + Math.ceil((j.w - j.wd) / r); }
  else j.until = j.until == null ? S.t + Math.ceil((j.w - j.wd) / Math.max(0.5, teamEff(crewAboard(), meAboard(), JOB_SKILL[j.kind] || 'juksa'))) : j.until + 1;   // nobody on it: it waits
  j.uw = j.until; return false;
}
function jobWait(j){ if (j.until != null){ j.until += 1; j.uw = j.until; } }
const jobLeft = j => { jobW(j); return Math.max(0, j.w - j.wd); };
const jobDone = j => { jobW(j); return clamp(j.wd / j.w, 0, 1); };

// who stands where: [{c (null for you), st, jw (the job for a job station), role (at the hauler: haler, plukk, teine)}], you first
function workAssign(as){
  const team = crewAboard(), ctx = workCtx(as), P = [];
  if (meAboard() && !asleep() && !(typeof resting === 'function' && resting())) P.push({c:null, job:jobOf(null)});   // (in the bunk, #70: the crew work on without you)
  team.forEach((c, i) => P.push({c, job:jobOf(c, i)}));
  if (!P.length) return P;
  if (ctx.s === 'aground'){ for (const p of P) p.st = 'pause'; return P; }
  const n = {}, cnt = k => n[k] || 0, room = k => cnt(k) < stPlaces(k, ctx), put = (p, k) => { if (p.st) n[p.st]--; p.st = k; n[k] = cnt(k) + 1; };
  // each to the first station in the chain with work and room; the hauling crew also bleeds when the hauler is taken (the chain's
  // «Haling» is the work at the hauler: hauling, picking, bleeding). The helm and the galley take one person each.
  for (const p of P){ p.st = null;
    for (const k of p.job){ if (!ctx[k]) continue; if (room(k)){ put(p, k); break; } if (k === 'haling' && ctx.blogg && room('blogg')){ put(p, 'blogg'); break; } }
    if (!p.st) put(p, 'pause'); }
  // nobody at the helm: someone resting, else the best seaman (you before the crew)
  const sjo = p => p.c ? p.c.attr.sjo : 9;
  if (ctx.ror && !cnt('ror')){ const q = P.filter(p => p.st === 'pause'), who = (q.length ? q : P).slice().sort((a, b) => sjo(b) - sjo(a))[0]; put(who, 'ror'); }
  // gear half out cannot wait: someone resting hauls, else whoever bleeds or is on deck. Alone aboard with the tub full (stopped to gut),
  // the haul waits while the one aboard guts and ices, and goes on after (07.10.2026: before, the one aboard was taken off the deck to the
  // hauler, the deck work never came, and the haul stood still between «tub full» and «deck work done» for good)
  const alone = P.length < 2 && ctx.stop && (ctx.sloy || ctx.is);
  // a net takes two at the hauler: one pulls and one picks the fish out of the meshes as they come over the rail and bleeds them when
  // nobody else does (tilbakemelding #30), so with two aboard nobody guts during the haul and the bleeding tub fills (the haul then goes
  // slower, haulSlow in 10-gear.js); a third hand bleeds or guts
  if (ctx.haling && !alone){ const need = Math.min(ctx.hands, stPlaces('haling', ctx), P.length);
    while (cnt('haling') < need){ const who = P.find(p => p.st === 'pause') || P.find(p => p.st === 'blogg') || P.find(p => p.st === 'sloy' || p.st === 'is' || p.st === 'sort'); if (!who) break; put(who, 'haling'); } }
  // the fish coming over the rail are bled by one who does nothing else, when someone is free; else the one at the hauler does it
  if (ctx.blogg && !cnt('blogg')){ const who = P.find(p => p.st === 'pause' && !p.job.includes('pause')); if (who) put(who, 'blogg'); }
  // a meal is due and nobody has the galley in the chain: the best cook among those on a break, if they can cook (3 or more)
  if (ctx.kokk && !cnt('kokk')){ const q = P.filter(p => p.st === 'pause' && p.c && p.c.attr.kokk >= MEAL.ok).sort((a, b) => b.c.attr.kokk - a.c.attr.kokk)[0]; if (q) put(q, 'kokk'); }
  // stopped to gut: everyone free goes on deck, as long as there is room at the table and the tub
  if (ctx.stop) for (const p of P) if ((p.st === 'pause' || (alone && p.st === 'haling')) && (ctx.sloy || ctx.is)){ const k = ctx.sloy && room('sloy') ? 'sloy' : ctx.is && room('is') ? 'is' : null; if (k) put(p, k); }
  // the rest take the free work where most waits for them: the fish first (minutes of work each, with one more on it), then the crew's own
  // jobs on the gear; one whose chain says Pause keeps the break
  const fishLeft = {sloy:ctx.gutKg / DECK.gut, is:ctx.iceKg / DECK.ice, blogg:ctx.blogg ? 30 : 0, haling:ctx.haling && ctx.gk !== 'teine' ? 20 : 0, sort:ctx.sort ? 10 : 0};
  const jobs = jobsOpen(as), jn = new Map(jobs.map(j => [j, 0]));
  for (const p of P){ if (p.st !== 'pause' || p.job.includes('pause')) continue;
    let best = null, bv = 0;
    for (const k in fishLeft){ if (!ctx[k] || !room(k)) continue; const v = fishLeft[k] / (cnt(k) + 1); if (v > bv){ bv = v; best = k; } }
    if (best){ put(p, best); continue; }
    let bj = null; bv = 0;
    for (const j of jobs){ const m = jn.get(j); if (m >= jobPlaces(j)) continue; const v = jobLeft(j) / (m + 1); if (v > bv){ bv = v; bj = j; } }
    if (bj){ put(p, JOB_ST[bj.kind]); p.jw = bj; jn.set(bj, jn.get(bj) + 1); } }
  // at the hauler: those at the haulers, then the one picking the net or handling the pots (who bleeds when nobody else does: p.bl)
  const hp = haulPlaces(); P.filter(p => p.st === 'haling').forEach((p, i) => { p.role = i < hp ? 'haler' : ctx.gk === 'garn' ? 'plukk' : 'teine'; p.bl = p.role === 'plukk'; });
  return P;
}
// what a person does, for the work page: the station's word, or the part of it at the hauler
function workDoing(p){ const no = S.lang === 'no'; if (p.role === 'plukk') return no ? 'Plukker og bløgger' : 'Picking and bleeding'; if (p.role === 'teine') return no ? 'Tømmer og egner teiner' : 'Emptying and baiting pots';
  return STATIONS[p.st].ing[no ? 0 : 1]; }
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
  for (const p of A){ if (!p.c){ S.mySt = p.st; continue; } p.c.st = p.st; if (WORK_ALL.includes(p.st) && S.boat.status !== 'port'){ const w = p.c.wk || (p.c.wk = {}); w[p.st] = (w[p.st] || 0) + 1; } }
  mealMinute(A);
  return A;
}
