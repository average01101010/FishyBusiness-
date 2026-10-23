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
  pause:{no:'Pause', en:'Break', ing:['Pause', 'On a break']}
};
const WORK_ST = ['ror', 'fiske', 'haling', 'blogg', 'sort', 'sloy', 'is', 'kokk'];
// the crew's jobs (10b-gearcare.js CREW_JOBS) by the station they are worked at, and the skill each goes by
const JOB_ST = {egn:'egn', strip:'strip', mend:'mend', hk:'stell', lr:'stell', pr:'stell', jg:'stell', last:'last'};
const JOB_SKILL = {egn:'line', strip:'line', hk:'line', lr:'line', mend:'garn', pr:'teiner', jg:'juksa'};
const WORK_ALL = WORK_ST.concat(['egn', 'strip', 'mend', 'stell', 'last']);   // (the minutes of work that tire and teach, workMinute)
// the stations whose work is heavy, and how heavy: a tired person leaves them to the others first
const HEAVY_ST = {haling:1, last:1, sloy:0.5, is:0.6, fiske:0.4, sort:0.3, blogg:0.3, egn:0.2, strip:0.2, mend:0.2, stell:0.2};
// the catch is bled, gutted and iced, the trade's way; S.settings.gut and .ice set to false leave it round or uniced (the tests)
function catchGut(){ return S.settings.gut !== false; }
function catchIce(){ return S.settings.ice !== false; }
// ---- the mate (Jonas 23.10.2026: «vi må kunne definere 1 fra mannskapet til å være styrmann ombord»): one of the crew, the same one
// who with the skipper runs the boat on the operations plan when you are not aboard (06d-drift.js); at the helm and in charge on deck when you sleep or are not aboard
const crewMate = () => (S.crew || []).find(c => c.mate) || null;
function setMate(id){
  for (const c of S.crew || []){ if (c.id === id){ c.mate = true; delete c.sk; } else delete c.mate; }
}
// ---- the skipper (Jonas 23.10.2026: «når jeg/brukeren ikke er ombord må det utnevnes en skipper og en styrmann ombord»): one of the crew,
// who runs the boat and the operations plan when you are not aboard (06d-drift.js). Aboard you are the skipper; the mate is someone else.
const crewSkipper = () => (S.crew || []).find(c => c.sk) || null;
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
  role:['det er den faste plassen', 'it is their regular place'], habit:['er vant med det', 'is used to it'], skill:['er flinkest til det', 'is best at it'], learn:['vil lære det', 'wants to learn it'],
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
  if (!P.length) return P;
  for (const p of P){ p.st = null; p.why = null; }
  if (ctx.s === 'aground'){ for (const p of P){ p.st = 'pause'; p.why = 'aground'; } return P; }
  const n = {}, cnt = k => n[k] || 0, room = k => cnt(k) < stPlaces(k, ctx), put = (p, k, why) => { if (p.st) n[p.st]--; p.st = k; n[k] = cnt(k) + 1; if (why) p.why = why; };
  const free = () => P.filter(p => !p.st), bestOf = (L, k) => L.slice().sort((a, b) => workScore(b, k, ctx, 1) - workScore(a, k, ctx, 1))[0];
  // the helm, while she is driven: you, else the mate, else the skipper, else the best seaman
  if (ctx.ror){ const me = P.find(p => !p.c), m = P.find(p => p.c && p.c.mate), sk = typeof opsSkipper === 'function' && opsSkipper(), o = sk && P.find(p => p.c === sk);
    const who = me || m || o || P.slice().sort((a, b) => b.c.attr.sjo - a.c.attr.sjo)[0]; put(who, 'ror', me ? 'skipper' : m ? 'mate' : o ? 'opsk' : 'seaman'); }
  // the work waiting at each station, in one person's minutes, and the crew's own jobs on the gear
  const left = {sloy:ctx.gutKg / DECK.gut, is:ctx.iceKg / DECK.ice, blogg:ctx.blogg ? 30 : 0, haling:ctx.haling && ctx.gk !== 'teine' ? 20 : 0, sort:ctx.sort ? 10 : 0};
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
  // a meal is due: the best cook among those on a break, else one who jigs or works on the gear (they stop for it), if they can cook (3 or more)
  if (ctx.kokk && !cnt('kokk')){ const ok = p => p.c && p.c.attr.kokk >= MEAL.ok, by = (a, b) => b.c.attr.kokk - a.c.attr.kokk;
    const q = P.filter(p => p.st === 'pause' && ok(p)).sort(by)[0] || P.filter(p => ok(p) && (p.st === 'fiske' || p.jw)).sort(by)[0];
    if (q){ if (q.jw){ jn.set(q.jw, jn.get(q.jw) - 1); q.jw = null; } put(q, 'kokk', 'cook'); } }
  // stopped to gut: everyone free goes on deck, as long as there is room at the table and the tub
  if (ctx.stop) for (const p of P) if ((p.st === 'pause' || (alone && p.st === 'haling')) && pTired(p) < 0.85 && (ctx.sloy || ctx.is)){ const k = ctx.sloy && room('sloy') ? 'sloy' : ctx.is && room('is') && iceOpen() ? 'is' : null; if (k) put(p, k, 'stop'); }
  // at the hauler: those at the haulers, then the one picking the net or handling the pots (who bleeds when nobody else does: p.bl)
  const hp = haulPlaces(); P.filter(p => p.st === 'haling').forEach((p, i) => { p.role = i < hp ? 'haler' : ctx.gk === 'garn' ? 'plukk' : 'teine'; p.bl = p.role === 'plukk'; if (!p.why) p.why = workWhy(p, 'haling', ctx); });
  for (const p of P) if (!p.why) p.why = p.st === 'pause' ? 'nowork' : workWhy(p, p.st, ctx);
  idleAssign(P, ctx);
  return P;
}
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
  sweep:['Skrubber dekket', 'Scrubbing the deck'], hose:['Spyler dekket', 'Hosing down the deck'], coil:['Kveiler tau', 'Coiling rope'], knife:['Sliper kniven', 'Sharpening the knife'],
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
  if (under && closed){
    // under way on a boat with a house: inside; asleep in a bunk when tired; a smoker out aft in fair weather
    add('inside', 6 + (has('makelig') ? 2 : 0)); if (c && E.bunks) add('sleep', 8 * f); if (vice === 'smoke' && E.W < 10 && E.hs < 1.2) add('smoke', 3); return w; }
  if (port && c && E.bunks && closed && c.fatigue > 30) add('sleep', 2 + 8 * f);
  if (under){ add('sit', 4 + 4 * f); add('look', 2); add('coffee', 1.5 + 3 * E.cold); }
  else { add('lean', 3); add('back', 2); add('look', 2); add('coffee', 2 + 3 * E.cold + (E.hr >= 5 && E.hr < 9 ? 1.5 : 0)); add('sit', 1 + 4 * f);
    add('coil', 1 + (has('arbeidsjern') || has('perfeksjonist') ? 1.5 : 0)); add('knife', 0.6 + (E.mess ? 1.5 : 0));
    add('sweep', 0.4 + (E.mess ? 3 : 0) + (has('perfeksjonist') ? 1.5 : 0) - (has('makelig') ? 0.3 : 0)); if (closed) add('hose', E.mess ? 2 : 0);
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
function workDoing(p){ const no = S.lang === 'no'; if (p.role === 'plukk') return no ? 'Plukker og bløgger' : 'Picking and bleeding'; if (p.role === 'teine') return no ? 'Tømmer og egner teiner' : 'Emptying and baiting pots';
  if (p.st === 'pause' && p.idle){ const t = idleText(p); if (t) return t; }
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
