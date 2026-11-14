// ================= work aboard: stations, and how the crew share them =================
// The crew organise themselves (Jonas 23.10.2026: «mannskapet skal i større grad være mer selvstendige dynamiske mennesker som tar egne
// valg slik de ville vært ombord på en fiskebåt. Vanlige mennesker hjelper hverandre og ser arbeidsoppgaver som trenger å gjøres»):
// nobody is given a list. Every minute each person aboard goes where they are most use, by what they can (the skill for that work), what
// they are used to (the minutes they have stood there, c.hab, which in time makes a regular: the one who always hauls), their ways (the
// workhorse takes the heavy work, the easy-going one is slow off a break, the perfectionist likes the gutting table, the eager learner
// wants to try what is new to them), how tired they are and what is piling up. A person stays at a task while it has work and looks
// around again at a natural break (every 20 minutes or so, each at their own minute), so the deck does not reshuffle every minute; and
// the choice is the same every time it is worked out within a minute (no dice: the day's small whims come from a hash of who and when).
// Some things are always done: a boat under way has someone at the helm (you; with you asleep or ashore the mate, c.mate, else the
// skipper, c.sk, else the best seaman), gear half out is hauled, the fish coming over the rail are bled, and the catch is bled, gutted and iced
// as the trade does it (Jonas 23.10.2026: «Fisken må nesten alltid sløyes før den ises og dette er nærmest bransjestandard»). When the
// boat is not being driven, you work on deck with the others («Skipperen bidrar på dekk når båten ikke kjøres aktivt»).
// Each station has its places (Jonas 20.10.2026, tilbakemelding #75: «det burde kun være en mann som har ansvaret for haling mens de
// andre tar seg av bløgging, sløying, og ising fortløpende»): the hauler takes as many as the boat has haulers (BOAT.stations.hauler;
// a net also one who picks the fish out of the meshes, pots one who empties, baits and stacks them), the bleeder one while the fish come
// aboard, the gutting table stations.table, the icing one (two on the big decks). The crew's own jobs on the gear (baiting, stripping,
// mending; 10b-gearcare.js CREW_JOBS) go at the pace of the hands on them, and are taken when the fish leave hands free.
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
  // the lines and the fenders round a quay (OB2, 05-vessels.js moorPhase): what is said is by the spell (workDoing, MOOR_ING)
  fort:{no:'Fortøyning', en:'Mooring', ing:['Fortøyer', 'Making fast']},
  pause:{no:'Pause', en:'Break', ing:['Pause', 'On a break']}
};
const WORK_ST = ['ror', 'fiske', 'haling', 'blogg', 'sort', 'sloy', 'is', 'kokk'];
// the crew's jobs (10b-gearcare.js CREW_JOBS) by the station they are worked at, and the skill each goes by
const JOB_ST = {egn:'egn', strip:'strip', mend:'mend', hk:'stell', lr:'stell', pr:'stell', jg:'stell', last:'last'};
const JOB_SKILL = {egn:'line', strip:'line', hk:'line', lr:'line', mend:'garn', pr:'teiner', jg:'juksa'};
const WORK_ALL = WORK_ST.concat(['egn', 'strip', 'mend', 'stell', 'last']);   // (the minutes of work that tire and teach, workMinute)
// the stations whose work is heavy, and how heavy: a tired person leaves them to the others first
const HEAVY_ST = {haling:1, last:1, fort:0.5, sloy:0.5, is:0.6, fiske:0.4, sort:0.3, blogg:0.3, egn:0.2, strip:0.2, mend:0.2, stell:0.2};
// the catch is bled, gutted and iced, the trade's way; S.settings.gut and .ice set to false leave it round or uniced (the tests; the
// player's own choice is per boat, b.gutAboard below)
// (H3b) the snow crab vessel's factory always splits its crab into clusters (10e-krabbefabrikk.js), whatever the setting for the fish.
// The first trip lands round (Jonas 08.11.2026: «Hva om nye brukere som åpner spillet ikke sløyer fisken første turen, men heller leverer
// fisken rund?»): alone, gutting stopped the jigging some three times and added about 35 game minutes (6 real) to it. The plant guts it;
// the price per round kilo is the same, and the liver, the roe and the gutting charge are what gutting aboard gives (ui/08-actions.js sell)
const tutRound = () => !!(S.tut && S.tut.v === 2);   // (tutOn in ui/07b-first-trip.js, read here so the core can be tested alone)
// Round or gutted is the boat's own choice (R1, docs/planer/etter-tonys-test.md 1.3; Jonas 07.11.2026 V1 A): b.gutAboard false lands the
// catch round, bled and iced, and the plant guts it; undefined guts aboard, so old saves and the fleet keep on as before. The rest is
// the vessel bound now (withVessel binds S.boat to the one the fleet loop works on), which is what every caller passes without a boat.
function catchGut(b){ b = b || S.boat; return ((!b || b.gutAboard !== false) && S.settings.gut !== false && !tutRound()) || snoVessel(); }
// the plant's charge for gutting round haddock and saithe, per round kilo (Råfisklaget: «30 øre pr. kg rund vekt» as the buyer's pay for
// the gutting; no charge for cod, the plant takes the liver and roe instead: R3). Gutted aboard, there is none (ui/08-actions.js sell)
const GUT_FEE = 0.30;
const gutFeeKg = x => !x.gut && !x.frozen && (x.sp === 'hyse' || x.sp === 'sei') ? GUT_FEE : 0;
function catchIce(){ return S.settings.ice !== false; }
// ---- the mate (Jonas 23.10.2026: «vi må kunne definere 1 fra mannskapet til å være styrmann ombord»): one of the crew, the same one
// who with the skipper runs the boat on the operations plan when you are not aboard (Driftsplan 2, 06h-plan2-engine.js); at the helm and in charge on deck when you sleep or are not aboard
const crewMate = () => (S.crew || []).find(c => c.mate) || null;
function setMate(id){
  for (const c of S.crew || []){ if (c.id === id){ c.mate = true; delete c.sk; } else delete c.mate; }
}
// ---- the skipper (Jonas 23.10.2026: «når jeg/brukeren ikke er ombord må det utnevnes en skipper og en styrmann ombord»): one of the crew,
// who runs the boat and the operations plan when you are not aboard (Driftsplan 2, 06h-plan2-engine.js). Aboard you are the skipper; the mate is someone else.
const crewSkipper = () => (S.crew || []).find(c => c.sk) || null;
// who sails her: none of the crew when you are aboard (you are), else the crew's skipper
function actingSkipper(){ return meAboard() ? null : crewSkipper(); }
function setSkipper(id){
  for (const c of S.crew || []){ if (c.id === id){ c.sk = true; delete c.mate; } else delete c.sk; }
}
// ---- what a person is used to: minutes at each station (c.hab), fading by a fifth a month. The station with most of them, once it is
// more than ten hours and close to half of all, is their place aboard: the hauler, the one at the table (crewRole)
const habShare = (c, k) => { const h = c && c.hab; if (!h) return 0; let t = 0; for (const s in h) t += h[s]; return t > 0 ? (h[k] || 0) / t : 0; };
function crewRole(c){ const h = c && c.hab; if (!h) return null; let best = null, bv = 0, t = 0; for (const s in h){ t += h[s]; if (h[s] > bv){ bv = h[s]; best = s; } } return best && bv >= 600 && bv >= 0.45 * t ? best : null; }
// a chain set up before (c.job, until 23.10.2026) becomes what the person is used to: the first station most
function habSeed(c){ const h = c.hab || (c.hab = {}); (c.job || []).forEach((k, i) => { if (WORK_ALL.includes(k)) h[k] = Math.max(h[k] || 0, Math.round(600 * (1 - 0.2 * Math.min(4, i)))); }); }
// ---- how good a person is at a station's work (1-5): you are a skipper who knows every job on deck
function stSkill(c, k, ctx, sk){
  if (!c) return k === 'ror' ? 5 : 3.2;
  const g = c.gear, A = c.attr;
  if (sk) return (sk === 'juksa' || sk === 'line' || sk === 'garn' || sk === 'teiner' ? g[sk] : A[sk] || g[sk]) || 1;
  if (k === 'ror') return A.sjo; if (k === 'kokk') return A.kokk; if (k === 'fiske') return g.juksa || 1;
  if (k === 'haling') return g[ctx.gk === 'garn' ? 'garn' : ctx.gk === 'teine' ? 'teiner' : 'line'] || 1;
  if (k === 'blogg' || k === 'sloy') return g.sloy || 1; if (k === 'is') return g.is || 1; if (k === 'sort') return g.sort || 1;
  return 1;
}
const pTired = p => p.c ? p.c.fatigue / 100 : (S.energy != null ? clamp(1 - S.energy / 100, 0, 1) : 0);
const pPrev = p => p.c ? p.c.st : S.mySt;
const pKey = p => p.c ? p.c.id : 'me';
// the day's small whim for a station, the same all day
const pWhim = (p, k) => p.c ? (hashStr(p.c.id + k + Math.floor(S.t / 1440)) % 1000 / 1000 - 0.5) * 0.16 : 0;
// a natural break: once in 20 minutes, each person at their own minute, they look around for where they are most use
const pBreak = p => (hashStr(pKey(p)) + S.t) % 20 === 0;
// how much a person wants a task (need: the work waiting per head, 1 = plenty; sk: the skill a crew job goes by)
function workScore(p, k, ctx, need, sk){
  const c = p.c, s1 = (stSkill(c, k, ctx, sk) - 1) / 4, T = c ? c.traits : [], f = pTired(p), hv = HEAVY_ST[k] || 0;
  let v = Math.min(1, need) + 0.45 * s1 + 0.35 * habShare(c, k);
  if (T.includes('arbeidsjern')) v += 0.12 * hv;
  if (T.includes('perfeksjonist') && (k === 'sloy' || k === 'is')) v += 0.1;
  if (T.includes('laerevillig') && s1 < 0.4) v += 0.12;
  v -= 0.5 * f * f * hv;
  if (pPrev(p) === k) v += 0.3;
  return v + pWhim(p, k);
}
// how much a person would rather rest: the easy-going more, the workhorse less, anyone worn out, and a crew that pulls together less
// (they see the others at it and pitch in: samhold, 04-crew.js crewTeam)
function restScore(p){
  const c = p.c, T = c ? c.traits : [], f = pTired(p);
  return 0.12 + (T.includes('makelig') ? 0.1 : 0) - (T.includes('arbeidsjern') ? 0.06 : 0) + Math.max(0, f - 0.6) * 4 + (pPrev(p) === 'pause' ? 0.08 : 0) - (c ? (crewTeam().v - 50) / 500 : 0);
}
// why a person stands where they do, said on the Mannskap page: the strongest reason
const WORK_WHY = {skipper:['skipperen', 'the skipper'], mate:['styrmannen har roret', 'the mate has the helm'], opsk:['har roret', 'has the helm'], seaman:['den mest sjøvante har roret', 'the best seaman has the helm'],
  moor:['tauene og fenderne', 'the lines and the fenders'], role:['det er den faste plassen', 'it is their regular place'], habit:['er vant med det', 'is used to it'], skill:['er flinkest til det', 'is best at it'], learn:['vil lære det', 'wants to learn it'],
  need:['det hoper seg opp', 'it is piling up'], stop:['alle tar i på dekk', 'all hands on deck'], cook:['det er snart mat', 'a meal is due'], tired:['er sliten', 'is tired'],
  rest:['tar en pust i bakken', 'takes a breather'], nowork:['ingenting å gjøre akkurat nå', 'nothing to do just now'], aground:['båten sitter fast', 'the boat is aground']};
const workWhyText = p => { const w = WORK_WHY[p.why]; return w ? w[S.lang === 'no' ? 0 : 1] : ''; };
// why a person stands where they do (the Mannskap page, M6): the strongest reason
function workWhy(p, k, ctx, sk){
  const c = p.c; if (!c) return 'skipper';
  if (crewRole(c) === k) return 'role';
  if (habShare(c, k) >= 0.4) return 'habit';
  const s = stSkill(c, k, ctx, sk); if (s >= 3.5) return 'skill';
  if (c.traits.includes('laerevillig') && s < 2.6) return 'learn';
  return 'need';
}
// the places at the hauler: the boat's haulers (stations.hauler), and on a net one more who picks the fish out of the meshes, on pots one
// more who empties, baits and stacks them
const haulPlaces = () => (BOAT.stations && BOAT.stations.hauler) || 1;
function stPlaces(st, ctx){
  const T = (BOAT.stations && BOAT.stations.table) || 1;
  if (st === 'haling') return haulPlaces() + (ctx.gk === 'line' ? 0 : 1);
  if (st === 'blogg' || st === 'ror' || st === 'kokk') return 1;
  if (st === 'fort') return ((VESSELS[S.boat.type] || {}).len || 0) >= 10 ? 2 : 1;   // (one on the lines and the fenders on a small boat, two from 10 m: one aft and one forward)
  if (st === 'sloy' || st === 'sort') return T;
  if (st === 'is') return T >= 3 ? 2 : 1;
  return Infinity;   // fishing at the rail, a break
}

// what has work now (the hauler waits while the boat is stopped to gut, so those on it go on deck: tilbakemelding #29). as = 'fishing': as if the boat were jigging where it lies (for the fishing effort outside the fishing minute)
function workCtx(as){
  const b = S.boat, st = S.settings, s = as === 'fishing' ? 'fishing' : b.status, g = as === 'fishing' ? null : b.gop, stop = as === 'fishing' ? false : !!b.deckStop;
  const icing = iceReady(), cg = catchGut(b); let gut = 0, ice = 0, pend = 0;
  for (const x of S.hold){ if (liveLot(x) || x.iced) continue; if (cg && !x.gut) gut += x.kg; else if (icing) ice += x.kg; if ((cg && !x.gut) || icing) pend += x.kg; }
  const deck = s !== 'aground' && pend > 0.5, gk = g ? g.kind : null;
  // the icing station packs what is gutted into the crate or the tub and ices it as it comes from the table, so it has work while anything is
  // on its way to it (the gutted fish, and the round fish waiting for the knife)
  // (round a quay, OB2: the helm is held until she lies made fast, and the lines and the fenders have their hands; 05-vessels.js moorPhase)
  const mp = as === 'fishing' || typeof moorPhase !== 'function' ? null : moorPhase(b);
  return {s, stop, mp, fort:!!mp, ror:s === 'sailing' || s === 'unmooring' || s === 'engine' || mp === 'in' || mp === 'lines' || mp === 'out', fiske:s === 'fishing' && !g && !stop, haling:!!g && !stop, gk, setting:!!g && g.op === 'set' && (gk === 'line' || gk === 'garn') && !g.auto,
    blogg:!!g && g.op === 'haul' && gk !== 'teine' && !stop && s !== 'aground', gutKg:cg ? gut : 0, iceKg:icing ? gut + ice : 0,
    sort:!!g && gk === 'teine' && g.op === 'haul', hands:g && gk === 'garn' && g.op === 'haul' ? 2 : 1, sloy:deck && gut > 0.01, is:deck && icing && (ice > 0.01 || gut > 0.01), iceNow:icing ? ice : 0, kokk:as !== 'fishing' && mealDue(), pause:true};
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

// who stands where: [{c (null for you), st, jw (the job for a job station), role (at the hauler: haler, plukk, teine), why}], you first
function workAssign(as){
  const team = crewAboard(), ctx = workCtx(as), P = [];
  if (meAboard() && !asleep() && !(typeof resting === 'function' && resting())) P.push({c:null});   // (in the bunk, #70: the crew work on without you)
  team.forEach(c => P.push({c}));
  lagOnDeck(S.t / 60, ctx.ror).forEach(c => P.push({c}));   // an ocean vessel's teams: the watch on (04-crew.js, H2b)
  if (typeof mobDeck === 'function') mobDeck(P, as);   // the one in the water is not aboard, and who is on deck is kept for the risk (Ø11.6, 14b-sikkerhet.js)
  if (!P.length) return P;
  for (const p of P){ p.st = null; p.why = null; }
  if (ctx.s === 'aground'){ for (const p of P){ p.st = 'pause'; p.why = 'aground'; } return P; }
  const n = {}, cnt = k => n[k] || 0, room = k => cnt(k) < stPlaces(k, ctx), put = (p, k, why) => { if (p.st) n[p.st]--; p.st = k; n[k] = cnt(k) + 1; if (why) p.why = why; };
  // «Jukse selv» (ui/10-rod-acts.js): while you jig by hand yourself, you stay at the rail; the chains never send you to the table (Tony
  // 06.11.2026: the skipper stood at the rail and at the table at once). Not while stopped to gut: then the jig game is off anyway
  if (ctx.fiske && !ctx.stop && typeof window !== 'undefined' && window.jigActive){ const me = P.find(p => !p.c); if (me) put(me, 'fiske', 'jig'); }
  const free = () => P.filter(p => !p.st), bestOf = (L, k) => L.slice().sort((a, b) => workScore(b, k, ctx, 1) - workScore(a, k, ctx, 1))[0];
  // the helm, while she is driven: you, else the mate, else the skipper, else the best seaman
  if (ctx.ror){ const me = P.find(p => !p.c), m = P.find(p => p.c && p.c.mate), sk = actingSkipper(), o = sk && P.find(p => p.c === sk);
    const who = me || m || o || P.slice().sort((a, b) => b.c.attr.sjo - a.c.attr.sjo)[0]; put(who, 'ror', me ? 'skipper' : m ? 'mate' : o ? 'opsk' : 'seaman'); }
  // the cook who has started the meal stays at the stove until it is served (14-crewlife.js mealMinute; before, the deck could take her
  // to the table between two minutes, another started over, and the meal came late: mannskapshot.py)
  if (ctx.kokk){ const M = mealState(), ck = M.cook && P.find(p => p.c && p.c.id === M.cook.id && !p.st && pTired(p) < 0.85); if (ck) put(ck, 'kokk', 'cook'); }
  // the lines and the fenders round a quay (OB2, F1-F3): before any other work (the cook at the stove stays there), the hands for them; alone aboard you leave the helm to
  // make her fast once she lies alongside, and cast her off before you take the helm (on the way in and out you are at the helm)
  if (ctx.fort){ while (cnt('fort') < stPlaces('fort', ctx)){ const L = free(); if (!L.length) break; put(bestOf(L, 'fort'), 'fort', 'moor'); }
    if (!cnt('fort') && (ctx.mp === 'lines' || ctx.mp === 'out')){ const r = P.find(p => p.st === 'ror' && !p.c); if (r) put(r, 'fort', 'moor'); } }
  // the work waiting at each station, in one person's minutes, and the crew's own jobs on the gear
  const left = {sloy:ctx.gutKg / gutPace(), is:ctx.iceKg / DECK.ice, blogg:ctx.blogg ? 30 : 0, haling:ctx.haling && ctx.gk !== 'teine' ? 20 : 0, sort:ctx.sort ? 10 : 0};
  const jobs = jobsOpen(as), jn = new Map(jobs.map(j => [j, 0]));
  // (while the gear comes in, or two gut, and nobody is at the ice, the gutted fish come off the table as fast as they are gutted and lie
  // unpacked: the ice is wanted as much as the table; before, a second hand went to the table and nobody packed, crewwalk.py on the new
  // sjark. Jigging with one at the table, the one gutting packs their own after, and the others jig)
  const needOf = k => k === 'fiske' ? 0.55 : k === 'is' && !cnt('is') && cnt('sloy') && (ctx.haling || cnt('sloy') > 1) ? Math.max(left.is, left.sloy / cnt('sloy')) / 10 : (left[k] || 0) / (cnt(k) + 1) / 10;
  const jobNeed = j => 0.7 * jobLeft(j) / ((jn.get(j) || 0) + 1) / 60;
  // (the icing station waits on the table: with nothing gutted yet and nobody gutting, there is nothing to pack, so it holds nobody;
  // before, the one aboard alone stayed at the ice from the minute before while the round fish lay ungutted, and nothing got done)
  const iceOpen = () => ctx.iceNow > 0.01 || cnt('sloy') > 0;
  // (and with the gear coming in, or two at the table, the one who packs comes before a second hand at the table: both wants are full,
  // so before the skills decided, and the 15 m boat hauling line with four hands had two gutting and nobody packing, selfcrew.py)
  const iceFirst = () => !cnt('is') && cnt('sloy') > 0 && (ctx.haling || cnt('sloy') > 1);
  const workOpen = k => ctx[k] && room(k) && (k === 'fiske' || left[k] > 0.01) && (k !== 'is' || iceOpen());
  // gear half out cannot wait. Alone aboard with the tub full (stopped to gut), the haul waits while the one aboard guts and ices, and
  // goes on after (07.10.2026: before, the one aboard was taken off the deck to the hauler, the deck work never came, and the haul stood
  // still between «tub full» and «deck work done» for good). A net takes two at the hauler: one pulls and one picks the fish out of the
  // meshes as they come over the rail and bleeds them when nobody else does (tilbakemelding #30)
  const alone = P.length < 2 && ctx.stop && (ctx.sloy || ctx.is);
  if (ctx.haling && !alone){ const need = Math.min(ctx.hands, stPlaces('haling', ctx), P.filter(p => p.st !== 'ror').length);
    while (cnt('haling') < need){ const L = free(); if (!L.length) break; put(bestOf(L, 'haling'), 'haling'); } }
  // the rest stay at what they do while it has work, and look around at their break
  for (const p of free()){ const k = pPrev(p); if (!k || k === 'pause' || k === 'ror' || k === 'kokk' || pBreak(p) || pTired(p) > 0.8) continue;
    if (workOpen(k)){ put(p, k, p.c && p.c.why || null); continue; }
    const j = jobs.find(x => JOB_ST[x.kind] === k && (jn.get(x) || 0) < jobPlaces(x)); if (j){ put(p, k, p.c && p.c.why || null); p.jw = j; jn.set(j, jn.get(j) + 1); } }
  // the fish coming over the rail are bled by one who does nothing else, when someone is free
  if (ctx.blogg && !cnt('blogg')){ const L = free(); if (L.length) put(bestOf(L, 'blogg'), 'blogg'); }
  // everyone else where they are most use, the best match first, or a break when that is worth more to them
  for (let guard = 0; guard < 40; guard++){
    const L = free(); if (!L.length) break;
    let bp = null, bk = null, bj = null, bv = -1e9;
    for (const p of L){
      for (const k of ['haling', 'blogg', 'sloy', 'is', 'sort', 'fiske']){ if (!workOpen(k)) continue; const v = workScore(p, k, ctx, needOf(k)) + (k === 'is' && iceFirst() ? 0.3 : 0); if (v > bv){ bv = v; bp = p; bk = k; bj = null; } }
      for (const j of jobs){ if ((jn.get(j) || 0) >= jobPlaces(j)) continue; const k = JOB_ST[j.kind], v = workScore(p, k, ctx, jobNeed(j), JOB_SKILL[j.kind]); if (v > bv){ bv = v; bp = p; bk = k; bj = j; } }
    }
    if (!bp) break;
    if (bv < restScore(bp)){ put(bp, 'pause', pTired(bp) > 0.65 ? 'tired' : 'rest'); continue; }
    put(bp, bk, workWhy(bp, bk, ctx, bj ? JOB_SKILL[bj.kind] : null)); if (bj){ bp.jw = bj; jn.set(bj, jn.get(bj) + 1); }
  }
  for (const p of free()) put(p, 'pause', 'nowork');
  // fish waiting and nobody at it (all on a break): the least tired goes, unless everyone is worn out
  for (const k of ['sloy', 'is']) if (ctx[k] && !cnt(k) && left[k] > 0.01 && (k !== 'is' || iceOpen())){ const q = P.filter(p => p.st === 'pause' && pTired(p) < 0.85).sort((a, b) => pTired(a) - pTired(b))[0]; if (q) put(q, k, 'need'); }
  // freight waiting on the quay and nobody on it (all on a break, or the one aboard alone is tired): the boat lies there until it is
  // aboard or ashore, so the least tired of those awake goes, worn out or not (feedback #2 from the test edition, 12.11.2026: alone and
  // tired, the parcel was never loaded and the boat never got away; a small job never weighed up for the rest, restScore)
  // (as many as the job has places for, since its work was sized for all the hands aboard, jobW; one dozing on a break is left alone
  // unless nobody else can go: the independent check 12.11.2026)
  if (ctx.s === 'port') for (const j of jobs) if (j.kind === 'last' && !(jn.get(j) > 0)){ const doze = p => !!(p.c && p.c.idle === 'sleep');
    const Q = P.filter(p => p.st === 'pause').sort((a, b) => (doze(a) ? 1 : 0) - (doze(b) ? 1 : 0) || pTired(a) - pTired(b));
    for (const q of Q){ if (jn.get(j) >= jobPlaces(j) || (doze(q) && jn.get(j) > 0)) break; put(q, 'last', 'need'); q.jw = j; jn.set(j, jn.get(j) + 1); } }
  // a meal is due: the best cook among those awake on a break, else one who jigs or works on the gear (they stop for it), however well
  // they cook (Ø8b M2: before only 3 or more, and with nobody that good it was dry bread; 14-crewlife.js cookPick)
  if (ctx.kokk && !cnt('kokk')){ const q = cookPick(P);
    if (q){ if (q.jw){ jn.set(q.jw, jn.get(q.jw) - 1); q.jw = null; } put(q, 'kokk', 'cook'); } }
  // stopped to gut: everyone free goes on deck, as long as there is room at the table and the tub
  if (ctx.stop) for (const p of P) if ((p.st === 'pause' || (alone && p.st === 'haling')) && pTired(p) < 0.85 && (ctx.sloy || ctx.is)){ const k = ctx.sloy && room('sloy') ? 'sloy' : ctx.is && room('is') && iceOpen() ? 'is' : null; if (k) put(p, k, 'stop'); }
  // at the hauler: those at the haulers, then the one picking the net or handling the pots (who bleeds when nobody else does: p.bl)
  // (setting line or nets, OB3, F4: nobody hauls; the first pays the gear out over the stern and the others hand it to him: the next tub
  // carried aft, the net seen clear of its tub. The same people on the same station as before, so the pace is as it was: gopUnitMin)
  const hp = haulPlaces(); P.filter(p => p.st === 'haling').forEach((p, i) => { p.role = ctx.setting ? (i ? 'lang' : 'sett') : i < hp ? 'haler' : ctx.gk === 'garn' ? 'plukk' : 'teine'; p.bl = p.role === 'plukk'; if (!p.why) p.why = workWhy(p, 'haling', ctx); });
  for (const p of P) if (!p.why) p.why = p.st === 'pause' ? 'nowork' : workWhy(p, p.st, ctx);
  idleAssign(P, ctx);
  quayRoles(P, ctx);
  deckRoles(P, ctx);
  return P;
}
// ---- the boat's own hands at the quay (OB4, 11.11.2026, docs/planer/om-bord.md F10, F11, F23; Jonas 09.11.2026: «at arbeidet ombord
// utføres på en så ekte måte som mulig»). While the plant's crane lands her tubs, one of those free hooks the sling on at the tubs
// ('hekt') and one stands where the crane driver sees him and gives the signs ('luke'); while ice runs from the silo, one takes it
// aboard and spreads it ('isrom'); and with her own crane on the freight, the first on the job drives it and the second hooks on and
// off ('kran', 'hekt'). Roles only, as 'sett' and 'lang' at the hauler (OB3): nobody changes station, nothing here waits on anything,
// and the landing, the ice and the freight take the time they took (a hand on a break stays on it in the numbers: p.idle is kept, so
// the rest, the meal and the watch are as before). Those asleep or worn out are left alone, and an ocean vessel's pallets and live
// crab have their own gang at the hatch (view3d/09-landing-deck.js landScene). The crew first, you last: alone you hook on yourself.
function quayRoles(P, ctx){
  const b = S.boat; if (ctx.s !== 'port' || ctx.fort) return;
  if (BOAT.crane > 0 && !b.land) P.filter(p => p.st === 'last').forEach((p, i) => { p.role = i ? 'hekt' : 'kran'; });   // (her crane lies folded while the plant lands her, view3d drawCrane)
  const L = b.land, e = L ? S.t - L.t0 : 0, landing = !!L && L.kind === 'tub' && !(L.lv > 0) && e >= 0 && e < landLiftT(L, L.lifts - 1) + liftMin(L);
  const icing = (b.iceUntil || 0) > S.t; if (!landing && !icing) return;
  const free = P.filter(p => p.st === 'pause' && p.idle !== 'sleep' && pTired(p) < 0.85).sort((x, y) => (x.c ? 0 : 1) - (y.c ? 0 : 1));
  const want = (landing ? ['hekt', 'luke'] : []).concat(icing ? ['isrom'] : []);
  // (alone, or one free: the ice is taken aboard before the signs are given; the sling is always hooked on first)
  if (free.length < want.length && icing && landing) want.splice(1, 1);
  free.slice(0, want.length).forEach((p, i) => { p.role = want[i];
    // (the one he was chatting with looks out over the sea instead of talking to nobody)
    if (p.idle === 'chat' && p.with) for (const q of P) if (q !== p && !q.role && q.idle === 'chat' && q.with === pKey(p)){ q.idle = 'look'; q.with = null; } });
}
// ---- the deck washed down, the packed lunch and the cold, as roles on those on a break (OB14, 11.11.2026, docs/planer/om-bord.md F12,
// F13, F14; Jonas 09.11.2026: «at arbeidet ombord utføres på en så ekte måte som mulig, at mannskapet oppfører seg som ekte
// mennesker»). Roles only, as at the quay (quayRoles): nobody changes station, p.idle is kept, and no number changes (the rest, the
// meal, the watch and the pace are as before); the 3D view walks them to it (deckcrew.js) and the Mannskap page says it (workDoing).
//   'spyl' and 'kost' (F12): once the gutting, the icing and the hauling have stopped, the deck they left is washed down as part of the
//     work: the first one free takes the hose (on an open boat the bucket and the brush), and with three or more free a second scrubs.
//     From WASH.after minutes after the last deck work (b.deckT, 05-vessels.js deckMinute) and for washMin() minutes; before, only a
//     break one might draw, and never the hose on an open boat.
//   'mat' (F13): on a boat with no galley the packed lunch and the flask come out when the meal is served (14-crewlife.js mealMinute,
//     S.meal.last): those free eat where they sit or stand for WASH.eat minutes, the lunch first and the coffee after.
//   'frys' (F14): when the cold and the wet cost (coldPen, 03-simulation.js, over CHILL), some of those standing still on a break beat
//     their arms and rub their hands; more of them the colder it is. At sea, lying still; never one at work.
// Those asleep, seasick, ashore or worn out are left alone, and so is anyone with a role at the quay.
const WASH = {after:2, base:4, perM:0.5, eat:12, lunch:7}, CHILL = 0.05, DECKWORK = {sloy:1, is:1, blogg:1, haling:1, sort:1, fort:1}, STILL = {look:1, lean:1, back:1};
function washMin(){ return clamp(Math.round(WASH.base + WASH.perM * ((VESSELS[S.boat.type] || {}).len || 10)), 6, 16); }
// (the deck is being washed now: it was worked on, and that stopped a little while ago)
function deckWash(){ const b = S.boat, e = b.deckT != null ? S.t - b.deckT : -1; return e >= WASH.after && e < WASH.after + washMin(); }
// (the packed lunch is out now, on a boat with no galley at sea; u: how far into it, 0-1)
function lunchNow(){ const M = S.meal, L = M && M.last; if (!L || S.boat.status === 'port' || ((BOAT.fac || {}).galley || 'bysse') !== 'none') return null; const e = S.t - L.t; return e >= 0 && e < WASH.eat ? {e, coffee:e >= WASH.lunch} : null; }
function deckRoles(P, ctx){
  if (ctx.s === 'aground' || ctx.fort || ctx.mp) return;
  const OFF = {sleep:1, seasick:1, shop:1, quay:1, worry:1}, free = () => P.filter(p => p.st === 'pause' && !p.role && !OFF[p.idle] && pTired(p) < 0.85).sort((x, y) => (x.c ? 0 : 1) - (y.c ? 0 : 1));
  // (the one he was chatting with looks out over the sea instead of talking to nobody, as at the quay)
  const give = (p, r) => { p.role = r; if (p.idle === 'chat' && p.with) for (const q of P) if (q !== p && !q.role && q.idle === 'chat' && q.with === pKey(p)){ q.idle = 'look'; q.with = null; } };
  // (under way on a boat with a house the crew are inside, Jonas 03.10 and 21.10.2026: nothing of this then; an open boat's are on deck)
  const E = idleEnv(); if (ctx.ror && !E.open) return;
  if (lunchNow()) for (const p of free()) give(p, 'mat');
  if (deckWash() && !P.some(p => DECKWORK[p.st])){ const L = free(); if (L.length){ give(L[0], 'spyl'); if (L.length >= 3) give(L[1], 'kost');
    // (one hose on deck: another whose break drew the hose takes the brush)
    for (const q of P) if (q.st === 'pause' && !q.role && q.idle === 'hose') q.idle = 'sweep'; } }
  // (at sea, as the cold counts there: 04-crew.js crewEffort)
  if (E.cold > CHILL && !ctx.ror && ctx.s !== 'port'){ const share = clamp(0.25 + 2.5 * (E.cold - CHILL), 0.25, 0.85);
    for (const p of free()) if (STILL[p.idle] && hashStr(pKey(p) + ':frys:' + Math.floor((S.t + hashStr(pKey(p)) % 12) / 12)) / 4294967296 < share) give(p, 'frys'); }
}
const DECK_ING = {spyl:['Spyler dekket', 'Hosing down the deck'], spylO:['Skyller og skrubber dørken', 'Sluicing and scrubbing the boards'], kost:['Skrubber dekket', 'Scrubbing the deck'],
  mat:['Spiser matpakka', 'Eating a packed lunch'], matK:['Drikker kaffe fra termosen', 'Coffee from the flask'], frys:['Slår floke for å holde varmen', 'Beating the arms to keep warm']};
function deckDoing(p){ const no = S.lang === 'no', r = p.role, k = r === 'spyl' && (BOAT.fac || {}).house === 'open' ? 'spylO' : r === 'mat' && (lunchNow() || {}).coffee ? 'matK' : r; return DECK_ING[k] ? DECK_ING[k][no ? 0 : 1] : null; }
const QUAY_ING = {hekt:['Hekter på karene', 'Hooking on the tubs'], luke:['Gir tegn til kranføreren', 'Signalling to the crane driver'], isrom:['Tar imot isen', 'Taking the ice aboard'], kran:['Kjører kranen', 'Driving the crane']};
// ---- what a person does on a break (Jonas 23.10.2026: «La det også stå hva de gjør når de ikke har en aktiv arbeidsoppgave som feks: lener
// seg på rekka, drikker kaffe, skrubber dekk og alle andre aktuelle ting de kan finne på å gjøre»): a spell of about twelve minutes each
// (each at their own minute), chosen by the weather, the hour, where she lies, how tired and hungry they are, what they are like and who
// else is free, and the same every time it is worked out within the spell (a hash of who and when, no dice). Some smoke and some take snus
// (crewVice; Jonas 23.10.2026: on deck, never in the wheelhouse, and never you). Under way on a boat with a house the crew are inside, and
// a smoker steps out aft in fair weather. Two who both chat stand together (p.with). The 3D view walks them to it (deckcrew.js idleGoal)
// and the Mannskap page says it (workDoing).
const IDLE_ACTS = {
  lean:['Lener seg på rekka', 'Leaning on the rail'], back:['Står med ryggen mot rekka', 'Back to the rail'], look:['Ser utover sjøen', 'Looking out over the sea'],
  coffee:['Drikker kaffe fra termosen', 'Coffee from the flask'], sit:['Sitter og hviler', 'Sitting down for a rest'], chat:['Prater med {b}', 'Chatting with {b}'],
  sweep:['Skrubber dekket', 'Scrubbing the deck'], hose:['Spyler dekket', 'Hosing down the deck'], knife:['Sliper kniven', 'Sharpening the knife'],
  lunch:['Spiser matpakka', 'Eating a packed lunch'], phone:['Ser på telefonen', 'On the phone'], binoc:['Speider med kikkerten', 'Scanning with the binoculars'],
  aurora:['Ser på nordlyset', 'Watching the northern lights'], seasick:['Er sjøsyk over rekka', 'Seasick over the rail'], gear:['Ser over redskapen', 'Looking over the gear'],
  smoke:['Tar seg en røyk', 'Having a smoke'], snus:['Legger inn en snus', 'Taking a snus'], inside:['Er inne og varmer seg', 'Inside, warming up'], sleep:['Sover i køya', 'Asleep in the bunk'],
  quay:['Slår av en prat på kaia', 'Chatting on the quay'], shop:['Er en tur på butikken', 'Gone up to the shop'], worry:['Ser etter grunnen', 'Looking at the ground she sits on']};
// smoke, snus or neither, from who they are (about one in seven smokes and three in ten take snus): set once, kept
function crewVice(c){ if (!c) return null; if (c.vice === undefined){ const h = hashStr(c.id + ':vice') % 100; c.vice = h < 15 ? 'smoke' : h < 45 ? 'snus' : null; } return c.vice; }
let IDLE_ENV = {t:-1};
function idleEnv(){
  if (IDLE_ENV.t === S.t) return IDLE_ENV;
  const b = S.boat, H = S.t / 60, p = b.pos, F = BOAT.fac || {}, hr = gDate(H).getUTCHours(); let dark = false, aur = 0, W = 0, hs = 0, cold = 0;
  try { dark = sunAt(H, p).el < -6; aur = dark && typeof auroraAt === 'function' ? auroraAt(H, p) : 0; W = windAt(H, p); hs = hsWork(p, H); cold = coldPen(H, hs); } catch (e) { /* a block not loaded */ }
  const M = S.meal, hungry = !!(M && M.due != null && S.t > M.due + 10) || (F.galley === 'none' && (hr === 11 || hr === 12 || hr === 18));
  return IDLE_ENV = {t:S.t, hr, dark, aur, W, hs, cold, open:F.house === 'open', bunks:typeof bunks === 'function' && !!bunks(b), hungry, mess:b.deckT != null && S.t - b.deckT < 40,
    gear:typeof rigOf === 'function' && rigOf() !== 'juksa', team:typeof crewTeam === 'function' ? crewTeam().v : 50, shop:hr >= 8 && hr < 20};
}
function idleWeights(p, ctx, E, mates){
  const c = p.c, T = c ? c.traits : [], has = t => T.includes(t), vice = crewVice(c), f = pTired(p), w = {}, add = (k, v) => { if (v > 0) w[k] = (w[k] || 0) + v; };
  const port = ctx.s === 'port', under = ctx.ror, closed = !E.open;
  if (ctx.s === 'aground'){ add('worry', 5); add('back', 2); add('look', 2); return w; }
  if (c && c.traits.includes('sjosyk') && E.hs > 1.2 && !port){ add('seasick', 20); return w; }
  if (ctx.mp && (ctx.mp !== 'lines' || closed)){ if (closed) add('inside', 6); else { add('look', 3); add('sit', 2); } return w; }   // (round a quay, OB2 F3: no break on deck while she moves)
  if (under && closed){
    // under way on a boat with a house: inside; asleep in a bunk when tired; a smoker out aft in fair weather
    add('inside', 6 + (has('makelig') ? 2 : 0)); if (c && E.bunks) add('sleep', 8 * f); if (vice === 'smoke' && E.W < 10 && E.hs < 1.2) add('smoke', 3); return w; }
  if (port && c && E.bunks && closed && c.fatigue > 30) add('sleep', 2 + 8 * f);
  if (under){ add('sit', 4 + 4 * f); add('look', 2); add('coffee', 1.5 + 3 * E.cold); }
  else { add('lean', 3); add('back', 2); add('look', 2); add('coffee', 2 + 3 * E.cold + (E.hr >= 5 && E.hr < 9 ? 1.5 : 0)); add('sit', 1 + 4 * f);
    add('knife', 0.6 + (E.mess ? 1.5 : 0));
    add('sweep', 0.4 + (E.mess ? 3 : 0) + (has('perfeksjonist') || has('arbeidsjern') ? 1.5 : 0) - (has('makelig') ? 0.3 : 0)); if (closed) add('hose', E.mess ? 2 : 0);
    if (E.gear) add('gear', 1 + (has('perfeksjonist') ? 1 : 0));
    if (!port && !E.dark) add('binoc', 0.6); if (E.aur > 0.25) add('aurora', 10 * E.aur); }
  add('lunch', E.hungry ? 5 : 0.3); add('phone', 0.8 + (c && c.age < 35 ? 1.5 : 0));
  if (mates > 0) add('chat', 2 + (E.team - 50) / 12 + (has('spokefugl') ? 1.5 : 0) - (has('grinebiter') ? 1 : 0));
  if (vice === 'smoke' && E.W < 15) add('smoke', 3); if (vice === 'snus') add('snus', 2);
  if (closed && !under) add('inside', 0.5 + 4 * E.cold + (E.dark ? 1.5 : 0) + (E.W > 12 ? 3 : 0) + (has('makelig') ? 1.5 : 0));
  if (port){ add('quay', 2.5); if (E.shop) add('shop', 0.8); }
  return w;
}
function idleAssign(P, ctx){
  const L = P.filter(p => p.st === 'pause'); if (!L.length) return;
  const E = idleEnv(), crewFree = L.filter(p => p.c).length;
  for (const p of L){
    const id = pKey(p), slot = Math.floor((S.t + hashStr(id) % 12) / 12), w = idleWeights(p, ctx, E, crewFree - (p.c ? 1 : 0));
    let tot = 0; for (const k in w) tot += w[k]; let r = hashStr(id + ':' + slot) / 4294967296 * tot, pick = 'look';
    for (const k in w){ r -= w[k]; if (r <= 0){ pick = k; break; } }
    p.idle = pick; p.with = null; }
  // two who both chose to chat stand together; one left over looks out over the sea
  const ch = L.filter(p => p.idle === 'chat').sort((a, b) => pKey(a) < pKey(b) ? -1 : 1);
  for (let i = 0; i + 1 < ch.length; i += 2){ ch[i].with = pKey(ch[i + 1]); ch[i + 1].with = pKey(ch[i]); }
  if (ch.length % 2) ch[ch.length - 1].idle = 'look';
}
// the break in words: «Drikker kaffe fra termosen», «Prater med Sindre»
function idleText(p){
  const k = p.idle, a = IDLE_ACTS[k]; if (!a) return null; let t = a[S.lang === 'no' ? 0 : 1];
  if (t.includes('{b}')){ const o = p.with === 'me' ? null : crewById(p.with); t = t.replace('{b}', p.with === 'me' ? (S.lang === 'no' ? 'deg' : 'you') : o ? o.name.split(' ')[0] : '?'); }
  return t;
}
// what a person does, for the work page: the station's word, or the part of it at the hauler
const MOOR_ING = {prep:['Henger ut fenderne', 'Putting the fenders out'], in:['Gjør klar tauene', 'Getting the lines ready'], lines:['Fortøyer', 'Making fast'],
  out:['Kaster loss', 'Casting off'], stow:['Tar inn fenderne og kveiler tauene', 'Fenders in, coiling the lines']};
function workDoing(p){ const no = S.lang === 'no';
  if (p.st === 'fort'){ const m = MOOR_ING[typeof moorPhase === 'function' && moorPhase()]; if (m) return m[no ? 0 : 1]; } if (p.role === 'plukk') return no ? 'Plukker og bløgger' : 'Picking and bleeding'; if (p.role === 'sett') return no ? 'Setter over hekken' : 'Setting over the stern'; if (p.role === 'lang') return no ? 'Langer redskapet akter' : 'Handing the gear aft'; if (p.role === 'teine') return no ? 'Tømmer og egner teiner' : 'Emptying and baiting pots';
  if (p.st === 'last' && p.role === 'hekt') return no ? 'Hekter på og av' : 'Hooking on and off';
  if ((p.st === 'pause' || p.st === 'last') && QUAY_ING[p.role]) return QUAY_ING[p.role][no ? 0 : 1];
  if (p.st === 'pause' && DECK_ING[p.role]){ const t = deckDoing(p); if (t) return t; }
  if (p.st === 'pause' && p.idle){ const t = idleText(p); if (t) return t; }
  if (snoVessel() && (p.st === 'sloy' || p.st === 'is')) return p.st === 'sloy' ? (no ? 'Deler krabben i klør' : 'Splitting the crab into clusters') : (no ? 'Koker, fryser og pakker klør' : 'Cooking, freezing and packing clusters');   // the snow crab factory (H3b)
  if (p.st === 'is' && holdFreezes()) return no ? 'Pakker og fryser' : 'Packing and freezing';   // a freezer hold (05-vessels.js)
  return STATIONS[p.st].ing[no ? 0 : 1]; }
// the people on a station and what they do there together: n, the sum of their efficiency for skill g, and the mean
function workTeam(st, g, as){
  const H = S.t / 60, hs = hsWork(S.boat.pos, H), on = workAssign(as).filter(p => Array.isArray(st) ? st.includes(p.st) : p.st === st);
  const sum = on.reduce((a, p) => a + (p.c ? crewEff(p.c, H, hs, g) : meEff()), 0);
  return {n:on.length, sum, eff:on.length ? sum / on.length : 1, crew:on.filter(p => p.c).map(p => p.c), me:on.some(p => !p.c)};
}
// once a minute per vessel: where each person is, and minutes per station (for learning)
function workMinute(){
  for (const c of S.crew || []) if (c.job){ habSeed(c); delete c.job; }
  if (S.myJob) delete S.myJob;
  const A = workAssign(); if (meAboard()) S.mySt = null;
  for (const c of S.crew || []){ c.st = null; c.why = null; }
  const sea = S.boat.status !== 'port';
  for (const p of A){ if (!p.c){ S.mySt = p.st; continue; } p.c.st = p.st; p.c.why = p.why; p.c.idle = p.idle || null;
    if (WORK_ALL.includes(p.st)){ const h = p.c.hab || (p.c.hab = {}); h[p.st] = (h[p.st] || 0) + 1;
      if (sea){ const w = p.c.wk || (p.c.wk = {}); w[p.st] = (w[p.st] || 0) + 1; } } }
  // what they are used to fades by about a fifth in a month
  if (S.t % 60 === 0) for (const c of S.crew || []) if (c.hab) for (const k in c.hab){ c.hab[k] *= 0.9997; if (c.hab[k] < 1) delete c.hab[k]; }
  mealMinute(A);
  return A;
}
