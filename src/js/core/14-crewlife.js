// ================= life aboard: learning, meals, the rest rule and what the crew says =================

// ---- learning: an hour on a station trains that skill. The young, the eager and the content learn fastest, and it gets
// harder towards the top: gain = 0.012 × age × morale × eager (×2) × (1 − skill / 5.5) per full hour
const AGE_LEARN = [[18, 1.7], [30, 1.3], [40, 1.0], [50, 0.7], [60, 0.45], [75, 0.3]];
function ageLearn(a){
  if (a <= AGE_LEARN[0][0]) return AGE_LEARN[0][1];
  for (let i = 1; i < AGE_LEARN.length; i++){ const [x1, y1] = AGE_LEARN[i], [x0, y0] = AGE_LEARN[i - 1]; if (a <= x1) return y0 + (y1 - y0) * (a - x0) / (x1 - x0); }
  return AGE_LEARN[AGE_LEARN.length - 1][1];
}
const moraleLearn = m => m < 30 ? 0.2 : m < 50 ? 0.6 : m <= 75 ? 1 : 1.25;
// the skill a station trains: hauling trains the gear the boat is rigged for, the helm seamanship, the galley cooking
function stationSkill(st){
  if (st === 'fiske') return ['gear', 'juksa'];
  if (st === 'haling'){ const k = RIGS[rigOf()].kind; return k ? ['gear', GEAR[k].skill] : null; }
  if (st === 'sort' || st === 'sloy' || st === 'is') return ['gear', st];
  if (st === 'blogg') return ['gear', 'sloy'];   // (the knife at the throat is the gutter's hand)
  if (st === 'egn' || st === 'strip') return ['gear', 'line'];
  if (st === 'mend') return ['gear', 'garn'];
  if (st === 'kokk') return ['attr', 'kokk'];
  if (st === 'ror') return ['attr', 'sjo'];
  return null;
}
const SKILL_WHAT = {juksa:['jukse', 'at jigging'], line:['fiske med line', 'at longlining'], garn:['fiske med garn', 'at net fishing'], teiner:['fiske med teiner', 'at potting'],
  sloy:['sløye', 'at gutting'], is:['ise fisken', 'at icing'], sort:['sortere krabbe', 'at sorting crab'], kokk:['lage mat', 'at cooking'], sjo:['føre båten', 'at handling the boat']};
// The galley is worked two hours a day at most (four meals of half an hour), so cooking is learnt three times as fast as the other
// skills (Ø8b M2, Jonas 06.11.2026: «noen av mannskapet må prøve å lage mat i allefall, og eventuelt at de blir bedre over tid»; the
// factor is a start value, assumed): from 2 to 2.5, the step to «fiskekaker», about 17 hours at the stove for one of 30, some five weeks
const LEARN_ST = {kokk:3};
function learnHour(c){
  const wk = c.wk || {}, f = 0.012 * ageLearn(c.age) * moraleLearn(c.morale) * (c.traits.includes('laerevillig') ? 2 : 1) * errandLearn(c);   // (a little faster the week after an errand, ERR)
  for (const st in wk){
    const sk = stationSkill(st), m = Math.min(60, wk[st]); if (!sk || m <= 0) continue;
    const o = c[sk[0]], v0 = o[sk[1]] || 1, v1 = Math.min(5, v0 + f * (LEARN_ST[st] || 1) * (1 - v0 / 5.5) * m / 60); o[sk[1]] = v1;
    if (Math.floor(v1) > Math.floor(v0)){ const w = SKILL_WHAT[sk[1]]; log(c.name + ' har blitt flinkere til å ' + w[0] + '.', c.name + ' has got better ' + w[1] + '.'); crewSay(c, 'lvl'); }
  }
  crewDerive(c);
}

// ---- meals (Ø8b M3, Jonas 06.11.2026: «Frokost 06:30, Lunsj 12:30, Middag 18:30, Nattmat 00:30», and «Mannskapet står ikke nødvendigvis
// opp midt på natten for å spise mat om de sover. Da vil eventuelt bare de som er våkne spise.»): at sea with crew aboard the meals come
// at fixed hours of the game's clock, and the cook starts 30 minutes before (BOAT.fx.cook when the galley is slower). The dish is as good
// as the cook: the best cook of those free (Ø8b M2: anyone of the crew, also under 3, 1 is dry bread and 2 hot dogs; never you, the
// skipper does not cook). Nobody free within an hour of the meal, and it is dry bread. A meal nobody is awake for is passed over and does
// not count: at night with the boat lying still and everyone resting (mealAwake). The food is one for the boat (assumed, as before: the
// last four meals make the food on board, foodScore 1–5, for everyone aboard; a food score per person is a larger change)
const MEAL = {cook:30, wait:60, ok:3, at:[30, 390, 750, 1110], night:[22 * 60, 6 * 60], every:360};   // (every: the ocean vessel's lagMeal, 04-crew.js; mealMinute sets the next fixed hour after it)
const MEAL_NAME = {30:['nattmat', 'night meal'], 390:['frokost', 'breakfast'], 750:['lunsj', 'lunch'], 1110:['middag', 'dinner']};
const DISH = [null, ['tørre brødskiver', 'dry slices of bread'], ['pølser i lompe', 'hot dogs in flatbread'], ['fiskekaker med løk', 'fish cakes with onions'],
  ['kokt torsk med poteter', 'boiled cod with potatoes'], ['mølje med lever og rogn', 'mølje: cod with liver and roe']];
function mealState(){ return S.meal || (S.meal = {due:null, cook:null, hist:[]}); }
function foodScore(){ const h = mealState().hist.slice(-4); return h.length ? h.reduce((a, q) => a + q, 0) / h.length : 3; }
// the minute of the day on the game's clock (gDate, as the clock on screen), and the first meal after minute t
const dayMin = t => { const d = gDate(t / 60); return d.getUTCHours() * 60 + d.getUTCMinutes(); };
function nextMealAt(t){ const m = dayMin(t), d0 = t - m; for (const a of MEAL.at) if (d0 + a > t) return d0 + a; return d0 + 1440 + MEAL.at[0]; }
const mealName = t => MEAL_NAME[dayMin(t)] || ['måltid', 'meal'];
const cookMin = () => (BOAT.fx && BOAT.fx.cook) || MEAL.cook;
// the galley has work from the cook's start until the meal is served (or passed over); never where nobody cooks: no galley aboard (the
// flask), or an ocean vessel's own cook in the galley
const ownGalley = () => ((BOAT.fac && BOAT.fac.galley) || 'bysse') !== 'none' && !(lagOf() && lagSpec().key.includes('kokk'));
function mealDue(){ const M = mealState(); return M.due != null && S.t >= M.due - cookMin() && S.boat.status !== 'port' && ownGalley(); }
// the night (22–06 on the clock) with the boat lying still: the crew sleep on a break (sleep, or rest at night when nothing is being worked)
const mealNight = t => { const m = dayMin(t); return m >= MEAL.night[0] || m < MEAL.night[1]; };
function crewAsleep(p, A){ if (!p || p.st !== 'pause') return false; if ((p.c && p.c.idle === 'sleep') || p.idle === 'sleep') return true;
  return mealNight(S.t) && !(A || []).some(q => q.st && q.st !== 'pause' && q.st !== 'kokk'); }
// someone of the crew awake to eat: the ocean vessel's watch, one of the crew at work, or one on a break and awake. You alone at the
// helm with the crew asleep in the bunks is no meal: the skipper does not cook, and eats as she goes
function mealAwake(A){
  if (lagOf()) return true;
  return (A || []).some(p => p.c && ((p.st && p.st !== 'pause') || (p.st === 'pause' && !crewAsleep(p, A))));   // (the cook is awake: cookPick takes nobody asleep)
}
// who cooks: the best cook among the crew free and awake on a break, else one who jigs or works on the gear (they stop for it)
function cookPick(P){
  const ok = p => p.c && !p.c.anon && !crewAsleep(p, P), by = (a, b) => b.c.attr.kokk - a.c.attr.kokk;
  return P.filter(p => p.st === 'pause' && ok(p)).sort(by)[0] || P.filter(p => ok(p) && (p.st === 'fiske' || p.jw)).sort(by)[0] || null;
}
// a minute in the galley, with the minute's work (core/13-work.js)
function mealMinute(A){
  const M = mealState();
  // in port they eat ashore, and alone you eat as you go
  if (S.boat.status === 'port' || (!crewAboard().length && !lagOf())){ M.due = null; M.cook = null; return; }
  // the first meal at sea is the next one the cook can make (they ate ashore); a game from before the fixed hours moves to them
  if (M.due == null || !MEAL_NAME[dayMin(M.due)]){ M.due = nextMealAt(S.t + cookMin() - 1); M.cook = null; return; }
  if (S.t < M.due - cookMin()) return;
  // the cook taken from the stove before the meal was ready (the helm, or gone from the crew): it is started over by whoever comes
  const ck = A.find(p => p.st === 'kokk'); if (!ck && M.cook) M.cook = null;
  // nobody awake when the cook would start: the meal is passed over and does not count
  if (!M.cook && S.t < M.due + MEAL.wait && !mealAwake(A)){ if (S.t >= M.due){ M.skip = (M.skip || 0) + 1; M.due = nextMealAt(S.t); } return; }
  // no galley aboard (schema v2 fac.galley): a packed lunch and coffee from the flask when the meal is due, nobody cooks; a hotplate caps the dish at 4
  const gal = (BOAT.fac && BOAT.fac.galley) || 'bysse';
  if (gal === 'none'){ if (S.t >= M.due) serveMeal(2, null, false, ['matpakke og kaffe fra termosen', 'a packed lunch and coffee from the flask']); return; }
  if (lagOf() && lagSpec().key.includes('kokk')){ if (S.t >= M.due){ const nm = mealName(M.due); lagMeal(); M.due = nextMealAt(S.t + cookMin()); if (M.last) M.last.nm = nm; } return; }   // an ocean vessel's own cook (04-crew.js, H2b)
  if (ck){ const id = ck.c ? ck.c.id : 'me'; if (!M.cook || M.cook.id !== id) M.cook = {id, m:0}; M.cook.m++;
    if (M.cook.m >= cookMin() && S.t >= M.due) serveMeal(Math.min(gal === 'plate' ? 4 : 5, ck.c ? clamp(Math.round(ck.c.attr.kokk), 1, 5) : 3), ck.c, !ck.c); return; }
  if (S.t >= M.due + MEAL.wait && !M.cook) serveMeal(1, null, false);
}
function serveMeal(q, cook, me, dish){
  const M = mealState(); M.hist.push(q); if (M.hist.length > 8) M.hist.shift(); const nm = mealName(M.due); M.due = nextMealAt(S.t + cookMin()); M.cook = null; M.last = {t:S.t, q, by:cook ? cook.id : me ? 'me' : null, nm};
  const d = dish || DISH[q];
  if (cook) log(cook.name.split(' ')[0] + ' laget ' + d[0] + ' til mannskapet.', cook.name.split(' ')[0] + ' made ' + d[1] + ' for the crew.');
  else if (me) log('Du laget ' + d[0] + ' til mannskapet.', 'You made ' + d[1] + ' for the crew.');
  else log('Ingen hadde tid til å lage mat. Det ble ' + d[0] + '.', 'Nobody had time to cook. It was ' + d[1] + '.');
  if (q >= 4 && meAboard() && typeof S.energy === 'number') S.energy = Math.min(100, S.energy + 4);   // a good meal gives you energy
  crewSay(null, q >= 4 ? 'foodGood' : q <= 2 ? 'foodBad' : null);
}

// (no rest rule for the crew: Jonas 11.10.2026, «Fjern alt om hviletid». The energy system stays: fatigue, and rest ashore.)

// ---- what the crew says: lines driven by the situation and by each person's ways. [no, en, trait the line suits]
// The Norwegian lines are in North Norwegian speech (words from the user's list: agalaus, au hirre, hustri, sjyen, kokning, …)
const SAY = {
  // the gear (10b-gearcare.js gearTalk; Jonas 09.10.2026)
  hooksOut:[['Skipper, vi e tom førr kroka. Lina fesker dårlig med alle de tomme plassan.', 'Skipper, we are out of hooks. The line fishes badly with all those empty places.'], ['Ikkje en krok igjen i kassa. Vi må innom butikken.', 'Not one hook left in the box. We have to call at the shop.'],
    ['Halve lina e uten krok. Det e som å fiske med hull i garnet.', 'Half the line has no hooks. It is like fishing with a hole in the net.', 'grinebiter']],
  hooksLow:[['Det e lite kroka igjen. Det rekk ikkje te å skifte alle.', 'There are few hooks left. Not enough to change them all.'], ['Vi bør kjøpe en pakke kroka neste gang vi e i land.', 'We should buy a pack of hooks next time we are ashore.']],
  baitOut:[['Agnet e tomt. Vi kan ikkje egne mer før vi har kjøpt.', 'The bait is gone. We cannot bait any more until we have bought some.'], ['Ingen agn igjen. Skal æ egne med kaffegrut?', 'No bait left. Shall I bait with coffee grounds?', 'spokefugl']],
  baitLow:[['Agnet begynne å bli lite. Det rekk te et par stampa te.', 'The bait is running low. Enough for a couple more tubs.'], ['Husk agn når vi kjem inn. Det e snart tomt.', 'Remember bait when we come in. It is nearly gone.']],
  gearWorn:[['Redskapen e sliten. Den treng en skikkelig omgang snart.', 'The gear is worn. It needs a proper going-over soon.'], ['Garnan e fulle av hol. Vi fesker halvparten av ka vi kunne.', 'The nets are full of holes. We fish half of what we could.'],
    ['Det her har sett bedre dager. Akkurat som mæ.', 'This has seen better days. Just like me.', 'spokefugl']],
  jigWorn:[['Pilken e slitt blank. Fesken ser den ikkje lenger.', 'The pilk is worn dull. The fish do not see it any more.'], ['Markkrokan e sløve. Vi treng et nytt sett.', 'The fly hooks are blunt. We need a new set.']],
  // the boat and the skipper (vitalsTalk; Jonas 10.10.2026)
  fuelLow:[['Skipper, vi har bare en fjerdedel igjen på tanken. Tenk på hjemveien.', 'Skipper, we have only a quarter left in the tank. Think of the way home.'],
    ['Dieselen begynne å bli lite. Vi bør ha en plan førr å fylle.', 'The diesel is getting low. We should have a plan to fill up.'],
    ['Tanken e under en fjerdedel. Æ liker det ikkje så langt ute.', 'The tank is under a quarter. I do not like it this far out.']],
  fuelCrit:[['Nu e det snart tomt! Vi må inn nu, skipper!', 'It is nearly empty! We have to head in now, skipper!'],
    ['Dieselen e nesten borte. Æ vil ikkje ligge og drive her.', 'The diesel is almost gone. I do not want to lie drifting here.'],
    ['Under ti prosent, skipper. Det e ikkje mye å gå på.', 'Under ten per cent, skipper. There is not much to go on.']],
  meTired:[['Skipper, du ser sliten ut. Bør du ikkje hvile litt?', 'Skipper, you look worn out. Should you not rest a bit?'],
    ['Du e grå i fjeset, skipper. Gå og legg deg, vi klare oss.', 'You are grey in the face, skipper. Go and lie down, we will manage.'],
    ['Æ har sett lik ut som deg etter ei uke uten søvn. Ta en pause.', 'I have seen people looking like you after a week without sleep. Take a break.']],
  workDone:[['Sånn, da e det gjort. Klart te neste sett.', 'There, that is done. Ready for the next set.'], ['Ferdig med det. Godt å ha noe å gjøre på overfarten.', 'Done with that. Good to have something to do on the crossing.'],
    ['Stampan står egna og klare.', 'The tubs stand baited and ready.']],
  goodCatch:[['Nu bit dem! Det her e nesten førr lett.', 'They are biting now! This is almost too easy.'], ['Ka med fesk! Fortsett det sånn, må vi kjøpe større båt.', 'So much fish! If it keeps up like this, we need a bigger boat.'],
    ['Torsken står i kø førr å komme om bord.', 'The cod are queueing to come aboard.'], ['Søkkanes bra dag. Sånne dager skulle man hatt flere nævva.', 'A seriously good day. Days like this you wish you had more hands.'],
    ['Æ trur fesken har hørt om lotten min og vil hjelpe te.', 'I think the fish have heard about my share and want to help.', 'spokefugl'], ['Ja ja, det går vel an. Men det vare ikkje.', 'Yes, well, it will do. But it will not last.', 'grinebiter'],
    ['Kløppar-fiske, det her. Bare så det e sagt.', 'Expert fishing, this. Just so it is said.', 'stolt']],
  badCatch:[['Hvis torsken bit like dårlig som kaffen smake, blir det en lang dag.', 'If the cod bite as badly as the coffee tastes, it will be a long day.'], ['Det blir i det minste kokning i dag. Kanskje.', 'At least there will be enough for dinner today. Maybe.'],
    ['Det e så stille her at æ høre måsan tenke.', 'It is so quiet here I can hear the gulls think.'], ['Sa æ ikkje at vi skulle gått lenger ut?', 'Did I not say we should have gone further out?', 'grinebiter'],
    ['Fesken har fri i dag. Fagforeninga, vet du.', 'The fish have the day off. The union, you know.', 'spokefugl'], ['Korsn vet man egentlig kor fesken står?', 'How do you actually know where the fish are?', 'laerevillig'],
    ['Æ e så agalaus. Ska vi ikkje prøve et nytt sted?', 'I am so restless. Should we not try a new spot?', 'rastlos'], ['Æ sei vi lægg inn åran og prøve igjen i mårrå.', 'I say we give up and try again tomorrow.', 'makelig']],
  tubFull:[['Bløggekaret renn snart over!', 'The bleeding tub is about to overflow!'], ['Vi treng flere nævva på dekk her.', 'We need more hands on deck here.'],
    ['Fesken ligg førr lenge i karet. Det koste kvalitet.', 'The fish lie too long in the tub. That costs quality.', 'perfeksjonist'], ['Gi mæ en kniv, så e det unnagjort.', 'Give me a knife and it is done.', 'arbeidsjern']],
  noGalley:[['Ti tima på sjyen og bare tørre brødskiver. Hadde vi hatt ei kokeplate …', 'Ten hours at sea and only dry bread. If we had a hotplate …'], ['Termosen e tom, skipper. Ei bysse hadde vorre nå.', 'The flask is empty, skipper. A galley would be something.'],
    ['Æ drømme om varm mat. Det her e en lang dag førr en matpakke.', 'I dream of hot food. This is a long day for a packed lunch.', 'grinebiter']],
  noWc:[['Tolv tima uten do. Æ sei ikkje meir.', 'Twelve hours without a toilet. I say no more.'], ['Neste båt har toalett, skipper. Det e alt æ ber om.', 'The next boat has a toilet, skipper. That is all I ask.'],
    ['Det e grensa førr ka en kar held ut uten do.', 'There is a limit to what a man puts up with without a toilet.', 'grinebiter']],
  // mistakes on deck (crewSlip; Jonas 23.10.2026: «Ja, det kan de godt gjøre. Det skaper realisme»)
  slip:[['Der gikk den. Torsken ville heller svømme.', 'There it went. The cod would rather swim.'], ['Han glapp ut av nævan, rett over ripa.', 'It slipped out of my hand, straight over the rail.'],
    ['Ikkje sei det te nån.', 'Do not tell anyone.', 'stolt'], ['Typisk. Den største, sjølsagt.', 'Typical. The biggest one, of course.', 'grinebiter']],
  cut:[['Au! Æ skar mæ i tommeln.', 'Ow! I cut my thumb.'], ['Søren, kniven glapp. Det e bare et lite kutt.', 'Blast, the knife slipped. It is only a small cut.'],
    ['Det blør litt, men det går. Plaster og hansken på igjen.', 'It bleeds a bit, but it is fine. A plaster and the glove back on.', 'arbeidsjern']],
  botch:[['Den der ble ikkje pen. Æ tar neste bedre.', 'That one was not pretty. I will do the next one better.'], ['Æ har sløyd bedre fesk i søvne.', 'I have gutted better fish in my sleep.', 'grinebiter'],
    ['Æ må finne teknikken igjen. Hode, buk, rens.', 'I have to find the knack again. Head, belly, clean.', 'laerevillig']],
  // advice from those who know (sayHour): never a question to answer, only a word to go by (Jonas 23.10.2026: «de skal fungere mer som guidelines»)
  adviceWx:[['Det kjem te å friske på rundt {t}, skipper. Med den her båten bør vi vær i ly før det.', 'It is going to freshen around {t}, skipper. In this boat we should be in shelter before then.'],
    ['Æ liker ikkje himmelen i vest. Varselet sei mer vind rundt {t}.', 'I do not like the sky to the west. The forecast says more wind around {t}.'],
    ['Æ har sett sånne dager før. Det blir stygt utpå, rundt {t}.', 'I have seen days like this before. It turns nasty out here, around {t}.', 'lokalkjent']],
  adviceGround:[['Æ har fått bra med {sp} {place} før. Kanskje verdt et forsøk?', 'I have done well for {sp} {place} before. Might be worth a go?'],
    ['På sånne dager pleide vi å prøve {place}. Der står {sp} gjerne nu.', 'On days like this we used to try {place}. There is often {sp} there now.'],
    ['Æ kjenne de her farvannan. {Place} ligg {sp} i denne tida.', 'I know these waters. {Place} is where the {sp} lie at this time.', 'lokalkjent']],
  // a meal that is late, and how the crew pull together (04-crew.js crewDrive, crewTeam; Jonas 23.10.2026: «De kan gjerne mumle, klage og sånt»)
  hungry:[['Æ e så sulten at æ kunne ete en sjøstøvel.', 'I am so hungry I could eat a sea boot.'], ['Kæm har byssa i dag? Magen min knurre høgere enn motoren.', 'Who has the galley today? My stomach is growling louder than the engine.'],
    ['Ka blir det te middag? Eller blir det ingenting i dag heller?', 'What is for dinner? Or is it nothing today as well?', 'grinebiter'], ['Æ tar gjerne kokkevakta, bare æ får ete først.', 'I will gladly take the galley, as long as I get to eat first.', 'spokefugl']],
  teamGood:[['Det e godt å jobbe med folk som vet ka dem gjør.', 'It is good to work with people who know what they are doing.'], ['Vi e et godt lag, vi. Det merkes på dekk.', 'We are a good team, us. You can tell on deck.'],
    ['Med det her mannskapet kunne vi tatt Lofotfisket aleine.', 'With this crew we could take the Lofoten fishery on our own.', 'stolt'], ['Ingen ka det e lenger, vi bare gjør det.', 'Nobody needs telling any more, we just do it.', 'arbeidsjern']],
  teamBad:[['Det e ikkje akkurat god stemning om bord i dag.', 'It is not exactly a good mood aboard today.'], ['Æ sei ingenting. Æ bare jobbe her.', 'I say nothing. I just work here.', 'grinebiter'],
    ['Kanskje vi alle treng en dag i land.', 'Maybe we all need a day ashore.', 'omsorgsfull'], ['Det e stille på dekk. For stille.', 'It is quiet on deck. Too quiet.']],
  cold:[['Æ har låppen på nævan. Kjenn ikkje fingran lenger.', 'My hands have gone numb with cold. I cannot feel my fingers.'], ['Hustri e det. Kæm va det som snakka om sommer i Nord-Norge?', 'It is bitterly cold. Who said anything about summer up north?'],
    ['Naggelbett på alle ti. Takk førr det.', 'Frostbitten nails on all ten. Thanks for that.'], ['Snørret mitt har frosse te istapp. Ny rekord.', 'My snot has frozen into an icicle. New record.', 'spokefugl'],
    ['Neste gang kjøpe vi ordentlige klær. Eller ny skipper.', 'Next time we buy proper clothes. Or a new skipper.', 'grinebiter']],
  seasick:[['Ikkje snakk te mæ. Ikkje se på mæ. Bare … ikkje.', 'Do not talk to me. Do not look at me. Just … do not.'], ['Det va ikkje lurt å spise lapskaus te frokost.', 'Stew for breakfast was not a good idea.'],
    ['Si fra når sjyen blir flat igjen.', 'Tell me when the sea goes flat again.']],
  tired:[['Æ kunne sovna ståanes.', 'I could sleep standing up.'], ['Katti e det vi går inn?', 'When are we heading in?'], ['Æ kjenn\'kje æ vinnj mer i dag.', 'I do not feel I can manage any more today.'],
    ['Æ ska bare haille mæ litt på tauverket her.', 'I will just have a little nap on the rope here.', 'makelig'], ['Sliten? Æ? Aldri. Kanskje litt.', 'Tired? Me? Never. Maybe a little.', 'arbeidsjern']],
  foodGood:[['Nu snakke vi! Det her e mat førr folk som jobbe.', 'Now we are talking! This is food for working people.'], ['Den som laga det her, ska ha medalje.', 'Whoever made this deserves a medal.'],
    ['Etter sånn mat kan æ trekke garn te i mårrå.', 'After food like that I could haul nets till tomorrow.'], ['Æ må gaffle i mæ. Det her e førr godt te å vente på.', 'I have to shovel it in. This is too good to wait for.'],
    ['Æ måillkose mæ. Sånn ska det være.', 'I am thoroughly enjoying this. That is how it should be.'], ['Hm. Ikkje verst. Ikkje si te nån at æ sa det.', 'Hm. Not bad. Do not tell anyone I said so.', 'grinebiter'],
    ['Takk førr maten! Nu e alle blide igjen.', 'Thanks for the food! Now everyone is happy again.', 'omsorgsfull']],
  foodBad:[['E det her mat eller agn?', 'Is this food or bait?'], ['Stomp igjen? Æ blir te ei brødskive snart.', 'Bread again? I am turning into a slice of bread.'],
    ['Neste tur tar æ med niste fra mor.', 'Next trip I am bringing a packed lunch from mum.'], ['Æ e så svang at æ et det uansett.', 'I am so hungry I will eat it anyway.'],
    ['Gir vi det her te måsan, slutte dem å følge oss.', 'If we feed this to the gulls, they will stop following us.', 'spokefugl'], ['Bikkja mi et bedre enn det her.', 'My dog eats better than this.', 'grinebiter'],
    ['Det her hadde ikkje bestått i nån bysse æ kjenne.', 'This would not pass in any galley I know.', 'perfeksjonist']],
  rest:[['Vi har jobba i ett sett. Katti ska vi sove?', 'We have worked without a break. When do we sleep?'], ['Det fins regla førr hviletid, vet du.', 'There are rules about rest, you know.'],
    ['Æ e ikkje en maskin, skipper.', 'I am not a machine, skipper.', 'stolt'], ['Sovne æ med kniven i handa, e det ikkje mi skyld.', 'If I fall asleep with the knife in my hand, it is not my fault.', 'kranglefant']],
  storm:[['Han e ikkje nådig i dag.', 'The weather shows no mercy today.'], ['Han står stiv i dag. Hold dokker fast, folkens!', 'It is blowing hard today. Hold on tight, everyone!'],
    ['Fåkk og kav, og vi her ute. Au hirre!', 'Snow squalls, and us out here. Oh my!'], ['Vi står han av.', 'We will weather it.'],
    ['Gratis karusell! Kæm treng tivoli?', 'A free ride! Who needs a funfair?', 'spokefugl'], ['Æ sa det. Æ sa det i går: no kjæm han me han.', 'I said so. I said so yesterday: here comes the storm.', 'grinebiter']],
  calm:[['Blikkstille. Sjyen ser ut som et speil.', 'Dead calm. The sea looks like a mirror.'], ['Sånne dager glømme man at man frys.', 'Days like this you forget you are cold.'],
    ['Bare ei lita nordvestpeising. Nu mea vi godt.', 'Just a light breeze from the northwest. We are making good way.'], ['Ta dokker en kopp kaffe nu mens det e rolig.', 'Have a cup of coffee while it is calm, everyone.', 'omsorgsfull']],
  longTrip:[['Æ har glømt korsn land ser ut.', 'I have forgotten what land looks like.'], ['Kjæresten min lure nok på om æ fins.', 'My partner is probably wondering if I exist.'],
    ['Æ vil bare ta på skubben og dra heim.', 'I just want to pack up and go home.'], ['Puben rope på mæ. Æ høre han helt hit.', 'The pub is calling me. I can hear it from here.', 'olglad']],
  payday:[['Det va en god lott! Nu blir det biff i kveld.', 'That was a good share! Steak tonight.'], ['Lotten e i boks. Da va det verdt det.', 'The share is in. Then it was worth it.'],
    ['Første runde på puben e min!', 'The first round at the pub is on me!', 'olglad'], ['Lotten va grei. Men skatten …', 'The share was fine. But the tax …', 'grinebiter'],
    ['Nu blir det sjampagne te hele mannskapet. Bare tulla!', 'Champagne for the whole crew now. Only joking!', 'spokefugl']],
  lvl:[['Nu begynne æ å få taket på det her.', 'I am starting to get the hang of this.'], ['Såg du det? Det gikk nesten av sæ sjøl!', 'Did you see that? It almost did itself!'],
    ['Æ e jo blitt rene kløpparen.', 'I have become quite the expert.'], ['Lær mæ nokka mer, skipper!', 'Teach me something more, skipper!', 'laerevillig'], ['Det va på tide at nån la merke te det.', 'About time somebody noticed.', 'stolt']],
  morning:[['God mårrå! Kaffen e klar, skipper.', 'Good morning! The coffee is ready, skipper.'], ['Morgenstund har gull i munn. Og fesk på krok, håpe æ.', 'The early bird gets the worm. And the fish, I hope.'],
    ['Bekkmørtna ennu. Men kaffen e varm.', 'Still pitch dark. But the coffee is hot.'], ['Koffør e det så lyst? Og koffør snakke alle så høgt?', 'Why is it so bright? And why is everyone talking so loudly?', 'olglad']],
  haulGood:[['Se på det her! Det kjæm fesk på hver meter.', 'Look at this! Fish on every metre.'], ['Au hirre, ka med fesk!', 'Wow, look at all the fish!'], ['Det va verdt å vente på.', 'That was worth the wait.'],
    ['Nu får haleren kjørt sæ.', 'The hauler is earning its keep now.', 'arbeidsjern']],
  haulBad:[['Mest tare og sjøstjerne. Kanskje vi kan selge dem?', 'Mostly kelp and starfish. Maybe we can sell them?'], ['Marfloen har ett bedre enn oss i natt.', 'The amphipods ate better than us last night.'],
    ['Det her va ikkje mye å skrompe av.', 'Nothing much to brag about here.'], ['Vi skulle satt lenger inn. Bare sei det.', 'We should have set closer in. Just saying.', 'grinebiter']],
  chat:[['Det e nokka eget med å se lande fra sjyen.', 'There is something special about seeing the land from the sea.'], ['Hørte dokker værmeldinga? Æ stole ikkje på ho.', 'Did you hear the forecast? I do not trust it.'],
    ['Bestefar jårra om ei kveite på 200 kilo. Æ trur det va mest bjor og bjug.', 'Grandad told tales of a 200-kilo halibut. I think it was mostly nonsense.'],
    ['Vet dokker koffør måsan skrike? Dem har sett lotten vår.', 'Know why the gulls scream? They have seen our share.', 'spokefugl'], ['En torsk går inn på en bar. Bartenderen sei: «Koffør så lang i maska?»', 'A cod walks into a bar. The barman says: «Why the long face?»', 'spokefugl'],
    ['Æ åt det opp. Ka va det vi skulle?', 'I forgot. What were we going to do?', 'spokefugl'], ['Før i tida va både fesken og folket større.', 'In the old days both the fish and the people were bigger.', 'grinebiter'],
    ['Kan du vise mæ korsn du lese ekkoloddet?', 'Can you show me how you read the sounder?', 'laerevillig'], ['Den blåsa der står skeiv. Det plage mæ.', 'That buoy is crooked. It bothers me.', 'perfeksjonist'],
    ['Etter turen tar vi en pils. Det har æ bestemt.', 'After the trip we are having a beer. I have decided.', 'olglad'], ['Har alle fått i sæ nok vatn i dag?', 'Has everyone had enough water today?', 'omsorgsfull'],
    ['Står vi her og prate, eller ska vi jobbe?', 'Are we standing here talking, or are we working?', 'arbeidsjern'], ['Fesken kjæm når han kjæm. Ikkje nå stress.', 'The fish come when they come. No stress.', 'makelig'],
    ['Her fiska bestefar hver vinter. Han kalte det Gullgrunnen.', 'Grandad fished here every winter. He called it the Gold Ground.', 'lokalkjent'], ['Det va æ som fant den stimen, bare så det e sagt.', 'It was me who found that school, just so you know.', 'stolt'],
    ['Kæm har flytta kniven min? Igjen!', 'Who moved my knife? Again!', 'kranglefant']]
};
const pick1 = a => a[Math.floor(Math.random() * a.length)];
// A hand says the lines in the dialect of where he is from (Jonas 08.10.2026, tilbakemelding #44: «Mannskap burde skrive på dialekt med ord
// og uttrykk basert på hvor det kommer fra»). The lines are written in the Northern Norwegian of Troms; north of 65° N they stand as they
// are, and further south the words are changed by region: Trøndelag, Møre, the west and the south coast.
const DIALECTS = {
  tro:[['ikkje', 'itj'], ['kæm', 'kem'], ['kjæm', 'kjem'], ['fesken', 'fisken'], ['fesk', 'fisk'], ['sjyen', 'sjøen'], ['koffør', 'korfor'], ['dokker', 'dikkan']],
  mor:[['æ', 'eg'], ['mæ', 'meg'], ['sæ', 'seg'], ['dæ', 'deg'], ['dokker', 'dykk'], ['kæm', 'kven'], ['ka', 'kva'], ['korsn', 'korleis'], ['koffør', 'kvifor'], ['e', 'er'], ['ska', 'skal'], ['kjæm', 'kjem'], ['fesken', 'fisken'], ['fesk', 'fisk'], ['sjyen', 'sjøen'], ['nå', 'no']],
  vest:[['æ', 'eg'], ['mæ', 'meg'], ['sæ', 'seg'], ['dæ', 'deg'], ['dokker', 'dykk'], ['kæm', 'kven'], ['ka', 'kva'], ['korsn', 'korleis'], ['koffør', 'kvifor'], ['e', 'er'], ['ska', 'skal'], ['kjæm', 'kjem'], ['fesken', 'fisken'], ['fesk', 'fisk'], ['sjyen', 'sjøen'], ['nå', 'no']],
  sor:[['æ', 'jeg'], ['mæ', 'meg'], ['sæ', 'seg'], ['dæ', 'deg'], ['dokker', 'dere'], ['kæm', 'hvem'], ['ka', 'hva'], ['korsn', 'hvordan'], ['koffør', 'hvorfor'], ['e', 'er'], ['ska', 'skal'], ['kjæm', 'kommer'], ['ikkje', 'ikke'], ['fesken', 'fisken'], ['fesk', 'fisk'], ['sjyen', 'sjøen'], ['vatn', 'vann']]
};
// whole words, one by one (the letters æ, ø and å are no word characters to \b)
const capLike = (from, to) => from[0] !== from[0].toLowerCase() ? to[0].toUpperCase() + to.slice(1) : to;
// the dialect of a place: null north of 65° N (the lines stand as they are), else tro, mor, vest or sor
function dialectAt(p){ const la = natLL(p).lat; return la >= 65 ? null : la >= 63.3 ? 'tro' : la >= 62 ? 'mor' : la >= 59.2 ? 'vest' : 'sor'; }
function dialectOf(c){
  const pt = c && c.homePort && portById(c.homePort), q = pt || portById(S.home || HOME0); if (!q) return null;
  return dialectAt(q.p);
}
function dialectText(key, text){
  const d = DIALECTS[key]; if (!d) return text;
  return text.replace(/\p{L}+/gu, w => { for (const [from, to] of d) if (w.toLowerCase() === from) return capLike(w, to); return w; });
}
function crewDialect(c, text){ return dialectText(dialectOf(c), text); }
// the named folk's own lines (04-crew.js NAMED_CREW): Tony, the joker from Husøy who kept a shop and tended salmon before the nets
const NAMED_SAY = {tony:{
  chat:[['Æ sto bak disken i butikken i mange år. Nu står æ bak rekka. Færre kunda, meir fesk.', 'I stood behind the shop counter for years. Now I stand at the rail. Fewer customers, more fish.'],
    ['Æ passa laks i merd før. Dem svømte i ring heile dagen. Litt som oss, skipper.', 'I tended salmon in the pens before. They swam in circles all day. A bit like us, skipper.'],
    ['Vet du ka forskjellen på en røkter og en fesker e? Røkteren vet kor fesken e.', 'Know the difference between a farm hand and a fisher? The farm hand knows where the fish are.'],
    ['Æ har vært kjøpmann, røkter og fesker. Neste gang blir æ kanskje fesk, så får æ sett det fra den sia òg.', 'I have been a shopkeeper, a farm hand and a fisher. Next time maybe a fish, to see it from that side too.'],
    ['Husøy e verdens navle. Det e bare resten av verden som ikkje har skjønt det ennu.', 'Husøy is the hub of the world. The rest of the world just has not noticed yet.']],
  morning:[['God mårrå! Æ har sovna i verre køya enn den her, men ikkje mange.', 'Good morning! I have slept in worse bunks than this one, but not many.'],
    ['Kaffen e klar. Æ har lært å koke han av en røkter, så han e sterk nok te å vekke laks.', 'The coffee is ready. I learned to make it from a farm hand, so it is strong enough to wake salmon.']],
  goodCatch:[['Det her e som Black Friday i butikken, bare at kundan bit.', 'This is like Black Friday at the shop, only the customers bite.'],
    ['Nu slår vi kassa i butikken på Husøy, og den gikk bra, den.', 'Now we are beating the till at the Husøy shop, and that one did well.']],
  badCatch:[['Æ har sett meir fesk i frysedisken.', 'I have seen more fish in the freezer counter.'],
    ['Vi sku ha tatt med oss laksen fra merda. Han bet i alle fall.', 'We should have brought the salmon from the pens. At least they bit.']],
  tubFull:[['Karet e fullt, skipper! Det e kø ved kassa.', 'The tub is full, skipper! There is a queue at the till.']],
  cold:[['Det e så kaldt at æ sakne kjøledisken. Den va varmar.', 'It is so cold I miss the chiller cabinet. That was warmer.']],
  storm:[['Han blås så det e like før butikkskiltet på Husøy tar av.', 'It blows so hard the shop sign on Husøy is about to take off.']],
  calm:[['Så stilt at æ hør laksen tenke. Nei vent, det e magen min.', 'So still I can hear the salmon think. No wait, that is my stomach.']],
  hungry:[['Æ hadde en heil butikk full av mat før. Nu har æ ei tørr brødskive. Karriere, kalle dem det.', 'I had a whole shop full of food once. Now I have a dry slice of bread. A career, they call it.']],
  payday:[['Lott! Nu går æ i butikken æ sjøl sto i og kjøpe nokka dyrt. Full sirkel.', 'A share! Now I will go to the shop I used to keep and buy something dear. Full circle.']],
  haulGood:[['Garnet e fullt! Det e som å telle opp kassa lille julaften.', 'The net is full! It is like counting the till on the 23rd of December.']],
  haulBad:[['Mest tang. Tang selg dårlig. Æ har prøvd.', 'Mostly kelp. Kelp sells badly. I have tried.']],
  foodBad:[['Æ solgte bedre mat på tilbud, tre førr to.', 'I sold better food on offer, three for two.']],
  slip:[['Den der va på vei te butikken sjøl. La han gå.', 'That one was on its way to the shop by itself. Let it go.']],
  cut:[['Au. Det der hadde ikkje skjedd bak disken.', 'Ow. That would not have happened behind the counter.']],
  tired:[['Æ e så trøtt at æ sa «velkommen innom» te en måse.', 'I am so tired I said «welcome in» to a gull.']],
  longTrip:[['Æ begynne å savne laksan. Dem sa i alle fall ikkje nokka.', 'I am starting to miss the salmon. At least they said nothing.']],
  teamGood:[['Godt lag det her. Nesten like bra som kveldsskiftet i butikken, og dem va gode.', 'A good crew, this. Almost as good as the evening shift at the shop, and they were good.']]}};
// someone says a line for the situation: c, or a person whose ways suit one of the lines, or anyone aboard
// (vars fill the line's {t}, {place}, {sp}: a value, or [no, en]; filled after the dialect, so a place keeps its name)
function crewSay(c, sit, vars){
  const on = crewAboard(), L0 = sit && SAY[sit]; if (!on.length || !L0) return false;
  // what happens is said at once, but not more than once every 15 minutes
  if (S.t - (S.sayT || -1e9) < 15) return false;
  let who = c, pool;
  if (who) pool = L0.filter(l => !l[2] || who.traits.includes(l[2]));
  else { const fit = L0.filter(l => l[2] && on.some(p => p.traits.includes(l[2])));
    if (fit.length && Math.random() < 0.6){ const l = pick1(fit); who = pick1(on.filter(p => p.traits.includes(l[2]))); pool = [l]; }
    else { pool = L0.filter(l => !l[2]); who = pick1(on); } }
  // a named person aboard with lines of their own for this: theirs, three times in four (and when nobody was picked for them, they
  // are picked half the time)
  if (!c){ const nm = on.filter(p => p.nid && NAMED_SAY[p.nid] && NAMED_SAY[p.nid][sit]); if (nm.length && Math.random() < 0.5) who = pick1(nm); }
  if (who && who.nid && NAMED_SAY[who.nid] && NAMED_SAY[who.nid][sit] && Math.random() < 0.75) pool = NAMED_SAY[who.nid][sit];
  if (!pool.length || !who) return false;
  const fill = (t, i) => vars ? t.replace(/\{(\w+)\}/g, (m, k) => vars[k] == null ? m : Array.isArray(vars[k]) ? vars[k][i] : vars[k]) : t;
  const l0 = pick1(pool), l = [fill(crewDialect(who, l0[0]), 0), fill(l0[1], 1)], nm = who.name.split(' ')[0], no = l[0]; S.sayT = S.t;
  log(nm + ': «' + no + '»', nm + ': «' + l[1] + '»');
  (who.said = who.said || []).push({t:S.t, no, en:l[1]}); if (who.said.length > 5) who.said.shift();
  if (hooks.onSay && meAboard()) hooks.onSay(who, no, l[1]);
  return true;
}
// the boat's state and the skipper's: once an hour at sea, each thing at most once a game day (S.gsay), and again after refuelling
function vitalsTalk(on){
  const b = S.boat; if (!on.length || b.status === 'port' || !BOAT.fuelCap) return;
  const said = S.gsay || (S.gsay = {}), fresh = k => S.t - (said[k] || -1e9) > 24 * 60, say = k => { if (fresh(k) && crewSay(null, k)){ said[k] = S.t; return true; } return false; };
  const f = b.fuel / BOAT.fuelCap;
  if (f > 0.4){ delete said.fuelLow; delete said.fuelCrit; }
  if (f < 0.1 && say('fuelCrit')) return;
  if (f < 0.25 && f >= 0.1 && say('fuelLow')) return;
  if (meAboard() && !asleep() && S.energy != null && S.energy < ENERGY.warn && !energyOff()) say('meTired');
}
// once an hour at sea: now and then (at most every 1.5 hours) someone remarks on how things are
function sayHour(H, on, hs){
  const b = S.boat; if (!on.length || b.status === 'port' || S.t - (S.sayT || -1e9) < 90 || Math.random() > 0.55) return;
  const W = windAt(H), hr = gDate(H).getUTCHours(), fs = S.fsess, sits = [];
  if (b.status === 'fishing' && fs && S.t - fs.t0 >= 60){ const kgh = fs.kg / ((S.t - fs.t0) / 60); if (kgh > 40) sits.push(['goodCatch']); else if (kgh < 8 && S.t - fs.t0 >= 120) sits.push(['badCatch']); }
  if (deckPending() > tubCap() * 0.8) sits.push(['tubFull']);
  if (coldPen(H, hs) > 0.1) sits.push(['cold']);
  { const M = S.meal, tv = typeof crewTeam === 'function' ? crewTeam().v : 50; if (M && M.due != null && S.t - M.due > 20) sits.push(['hungry']); if (tv >= 72 && Math.random() < 0.4) sits.push(['teamGood']); else if (tv < 35) sits.push(['teamBad']); }
  const sick = on.find(c => c.traits.includes('sjosyk')); if (sick && hs > 1.2) sits.push(['seasick', sick]);
  const tired = on.slice().sort((a, c) => c.fatigue - a.fatigue)[0]; if (tired.fatigue > 70) sits.push(['tired', tired]);
  if (hs > 2 || W > 14) sits.push(['storm']); else if (W < 2) sits.push(['calm']);
  if (S.workLog && S.workLog.length >= 12 && S.workLog.slice(-12).every(v => v)) sits.push(['longTrip']);
  // the boat's own facilities (schema v2): no galley on a long day, no toilet on a longer one
  { const F = BOAT.fac || {}; let n = 0; for (let i = (S.workLog || []).length - 1; i >= 0 && S.workLog[i]; i--) n++;
    if (F.galley === 'none' && n >= 10) sits.push(['noGalley']); if (!F.wc && n >= 12) sits.push(['noWc']); }
  if (hr >= 5 && hr <= 7) sits.push(['morning']);
  // advice first when someone aboard knows: the weather turning, a better ground (each at most every six hours)
  if (crewAdvice(H, on, W, fs)) return;
  const s = sits.length && Math.random() < 0.75 ? pick1(sits) : ['chat'];
  crewSay(s[1] || null, s[0]);
}
// ---- advice from those who know (Jonas 23.10.2026: «de kan gjerne ta initiativ og komme med kommentarer knyttet til driften om de vet
// hva de snakker om, men det skal ikke komme opp et ja/nei-spørsmål»): the most seasoned hand (seamanship 3 or more) speaks when the
// forecast brings more wind than the boat is built for within six hours; the most experienced (experience 3.5 or more, or local to these
// waters) speaks of a better ground near by after two poor hours. A word to go by, said once in six hours each; nothing to answer.
function crewAdvice(H, on, W, fs){
  const b = S.boat, said = S.gsay || (S.gsay = {}), fresh = k => S.t - (said[k] || -1e9) > 6 * 60;
  const sea = on.slice().sort((a, c) => c.attr.sjo - a.attr.sjo)[0];
  if (sea && sea.attr.sjo >= 3 && fresh('adviceWx') && BOAT.risk){ let at = null;
    try { for (let k = 1; k <= 6 && at == null; k++) if (fcWind(H + k, H, b.pos) >= BOAT.risk[2]) at = H + k; } catch (e) { /* no forecast here */ }
    if (at != null && W < BOAT.risk[2] - 1 && crewSay(sea, 'adviceWx', {t:hm(at)})){ said.adviceWx = S.t; return true; } }
  if (b.status === 'fishing' && fs && S.t - fs.t0 >= 120 && fs.kg / ((S.t - fs.t0) / 60) < 8 && fresh('adviceGround')){
    const near = c => c.traits.includes('lokalkjent') && c.homePort && portById(c.homePort) && dist(portById(c.homePort).p, b.pos) < 25;
    const who = on.filter(c => c.attr.erf >= 3.5 || near(c)).sort((a, c) => c.attr.erf - a.attr.erf)[0]; if (!who) return false;
    const g = adviceGround(H), cap = t => t.charAt(0).toUpperCase() + t.slice(1);
    if (g && crewSay(who, 'adviceGround', {place:g.place, Place:g.place.map(cap), sp:[SPECIES[g.sp].no.toLowerCase(), SPECIES[g.sp].en.toLowerCase()]})){ said.adviceGround = S.t; return true; } }
  return false;
}
// a better ground within six kilometres for cod, saithe or haddock: the best point by the fish model, worth it at half as much again
function adviceGround(H){
  const p0 = S.boat.pos; let best = null;
  for (const sp of ['torsk', 'sei', 'hyse']){ let here = 0; try { here = density(sp, p0, H); } catch (e) { continue; }
    for (let dy = -6; dy <= 6; dy += 0.8) for (let dx = -6; dx <= 6; dx += 0.8){ if (dx * dx + dy * dy > 36 || dx * dx + dy * dy < 2) continue; const p = {x:p0.x + dx, y:p0.y + dy};
      try { if (isLand(p)) continue; const d = depthF(p); if (d < 8 || d > 400) continue; const v = density(sp, p, H), r = v / Math.max(1e-9, here); if (r >= 1.5 && (!best || r > best.r)) best = {sp, p, r}; } catch (e) { /* a block not loaded */ } } }
  if (!best) return null;
  // said as a way from the nearest harbour within 15 km: «nord for Gryllefjord», or «ved Gryllefjord» close in
  let pt = null, pd = 15; for (const q of PORTS){ const d = dist(q.p, best.p); if (d < pd){ pd = d; pt = q; } } if (!pt) return null;
  if (pd < 1.5) return {sp:best.sp, p:best.p, place:['ved ' + pt.name, 'off ' + pt.name]};
  const deg = (Math.atan2(best.p.x - pt.p.x, pt.p.y - best.p.y) * 180 / Math.PI + gridGamma(pt.p) + 360) % 360, i = Math.round(deg / 45) % 8;
  const NO = ['nord', 'nordøst', 'øst', 'sørøst', 'sør', 'sørvest', 'vest', 'nordvest'], EN = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
  return {sp:best.sp, p:best.p, place:[NO[i] + ' for ' + pt.name, EN[i] + ' of ' + pt.name]};
}
// ---- mistakes on deck (Jonas 23.10.2026: «Ja, det kan de godt gjøre. Det skaper realisme»): now and then a fish slips over the side, the
// knife slips and someone cuts a hand, or a fish is gutted badly. Likelier tired, cold, in a heavy sea, with little skill or little heart in
// it; rare otherwise (about once in a long day at the table). A cut slows the one cut for four hours (04-crew.js crewDrive 'cut').
// (the dice for the mistakes: Math.random, or a seeded run for the tests, window.CREW_SEED, so a test sees the same slips each time)
function crewRand(){ if (typeof window === 'undefined' || window.CREW_SEED == null) return Math.random(); window.CREW_SEED = (window.CREW_SEED * 1664525 + 1013904223) >>> 0; return window.CREW_SEED / 4294967296; }
// The knives and the gaff (OPP1 of docs/planer/oppgraderinger.md): the three ways it goes are 45, 30 and 25 % of the base chance; the gaff
// takes its share off the first (a fish over the rail), the knife its share off the other two (badly gutted, a cut), never across.
// The chance of any of them is the base chance times what is left of the three; at tier 1 it is as before, the same dice included.
const SLIP_W = {rail:0.45, botch:0.30, cut:0.25};
function crewSlip(team){
  if (!team.length) return;
  const b = S.boat, H = S.t / 60, hs = hsWork(b.pos, H), cp = coldPen(H, hs);
  const wr = SLIP_W.rail * upgSum(-hookX('rail')), kn = upgSum(-equipTier('kniv').slip), wb = SLIP_W.botch * kn, wc = SLIP_W.cut * kn, W = wr + wb + wc;
  for (const c of team){
    const sk = (c.gear && c.gear.sloy) || 1, f = c.fatigue / 100, e = crewEffort(c, H, hs).f;
    const pr = 0.0012 * (1 + 2 * f * f + Math.max(0, hs - 1) + 2 * cp + (5 - sk) / 3 + 3 * Math.max(0, 1 - e));
    if (crewRand() >= pr * W) continue;
    const r = crewRand() * W, nm = c.name.split(' ')[0];
    if (r < wr){ const x = S.hold.filter(y => !y.iced && !liveLot(y) && y.kg > 0.5).sort((a, y) => y.kg - a.kg)[0]; if (!x) continue;
      const kg = Math.min(x.kg, 1.5 + crewRand() * 3); if (x.n) x.n = Math.max(0, x.n - 1); x.kg -= kg; if (x.kg < 0.01) S.hold.splice(S.hold.indexOf(x), 1); railLost(kg);
      log(nm + ' mistet en ' + SPECIES[x.sp].no.toLowerCase() + ' på ' + fmt(kg, 1) + ' kg over ripa.', nm + ' lost a ' + SPECIES[x.sp].en.toLowerCase() + ' of ' + fmt(kg, 1) + ' kg over the rail.'); crewSay(c, 'slip'); if (hooks.onCrewFx) hooks.onCrewFx(c, 'slip', {sp:x.sp, kg}); }
    else if (r < wr + wb){ const x = S.hold.find(y => y.gut && !y.iced && !liveLot(y)); if (!x) continue;
      x.fresh = Math.max(0, x.fresh - 6 * Math.min(1, 4 / x.kg)); log(nm + ' sløyde en fisk stygt. Den blir litt dårligere betalt.', nm + ' gutted a fish badly. It will fetch a little less.'); crewSay(c, 'botch'); }
    else { c.cut = S.t + 240; log(nm + ' skar seg i hånda på sløyekniven.', nm + ' cut a hand on the gutting knife.'); crewSay(c, 'cut'); if (hooks.onCrewFx) hooks.onCrewFx(c, 'cut'); }
  }
}

// the fish lost over the rail (S.stats.lostRail): kg and number for the whole company, in all and this week (w, wkg, wn), and this
// week's per boat (v, by the vessel's id: the gaff is the boat's), so the gaff's card can show what a better one would save (OPP1)
function railLost(kg){
  const st = S.stats || (S.stats = {}), w = weekOfH(S.t / 60), R = st.lostRail || (st.lostRail = {kg:0, n:0, w, wkg:0, wn:0});
  if (R.w !== w){ R.w = w; R.wkg = 0; R.wn = 0; }
  R.kg += kg; R.n++; R.wkg += kg; R.wn++;
  const V = R.v || (R.v = {}), id = S.cur == null ? '_' : S.cur; for (const q in V) if (V[q].w !== w) delete V[q];
  const x = V[id] || (V[id] = {w, kg:0, n:0}); x.kg += kg; x.n++;
}
// this week's loss over the rail on one boat (the one bound now): {kg, n}
function railWeek(id = S.cur){ const R = (S.stats || {}).lostRail, x = R && R.v && R.v[id == null ? '_' : id]; return x && x.w === weekOfH(S.t / 60) ? x : {kg:0, n:0}; }

// ===== Del 2 of «mannskap med liv» (docs/mannskap-plan.md; Jonas 17.10.2026): each person's life beside the work =====
// c.life = {fam, goal, saved, target, best, story[], notice, day, bday}: a family at home, a dream (a boat of their own, skipper of a
// second boat, or a quiet life), savings that grow with what they earn aboard, a story of at most twelve lines, and the week's notice
// when the dream is within reach. Everything runs on the game's hours (crewTick), so it goes on while the game is closed (catchUp).
const LIFE_BOATS = ['Havella', 'Solglimt', 'Nordlys', 'Fjordgutt', 'Straumen', 'Vårsol', 'Kvitnes', 'Leik', 'Trygg', 'Brødrene', 'Måken', 'Sjøblomst'];
const LIFE_GOAL = {egenbat:['Egen båt', 'A boat of their own'], skipper:['Føre båt nummer to', 'Skipper of a second boat'], ro:['Et rolig liv', 'A quiet life']};
function crewLife(c){
  if (c.life) return c.life;
  const r = Math.random, a = c.age || 30;
  const fam = a < 26 ? (r() < 0.75 ? 'single' : 'partner') : a <= 40 ? (r() < 0.3 ? 'single' : r() < 0.5 ? 'partner' : 'kids') : (r() < 0.1 ? 'single' : r() < 0.28 ? 'partner' : 'kids');
  const g = r(), goal = a < 35 ? (g < 0.55 ? 'egenbat' : g < 0.8 ? 'skipper' : 'ro') : a <= 50 ? (g < 0.3 ? 'egenbat' : g < 0.6 ? 'skipper' : 'ro') : (g < 0.1 ? 'egenbat' : g < 0.25 ? 'skipper' : 'ro');
  const target = Math.round((600000 + r() * 300000) / 10000) * 10000;   // a used sjark with gear
  const saved = Math.min(Math.round(target * 0.7), Math.round((c.yrs || 0) * 25000 * (0.3 + r() * 0.7) / 1000) * 1000);   // never from nought (docs/engasjement.md: endowed progress)
  c.life = {fam, goal, saved, target, best:0, story:[], notice:null, day:-1, bday:Math.floor(r() * 365)};
  lifeStory(c, 'Mønstret på «' + (S.boatName || 'båten') + '».', 'Signed on the «' + (S.boatName || 'boat') + '».');
  return c.life;
}
function lifeStory(c, no, en){ const L = crewLife(c); L.story.push([S.t, no, en]); while (L.story.length > 12) L.story.shift(); }
// what was earned aboard goes to the savings: 40 % of it, 25 % with children at home
function lifeEarn(c, sum){ if (!(sum > 0) || !c) return; const L = crewLife(c); L.saved += Math.round(sum * (L.fam === 'kids' ? 0.25 : 0.4));
  if (sum > L.best){ L.best = sum; if (sum >= 15000) lifeStory(c, 'Beste oppgjøret så langt: ' + kr(sum) + '.', 'Best settlement so far: ' + kr(sum) + '.'); } }
function lifeOff(c, days, no, en, sno, sen){ c.off = true; c.offUntil = S.t + days * 1440; msg(c.name, crewDialect(c, no), en); lifeStory(c, sno, sen); }
// once a day for each person: a birthday, the notice and the day it is up, and the small and large things of a life ashore
function lifeDay(c, H){
  const L = crewLife(c), day = Math.floor(H / 24); if (L.day === day) return; const fresh = L.day === -1; L.day = day; if (fresh) return;
  const d = gDate(H), doy = Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - Date.UTC(d.getUTCFullYear(), 0, 1)) / 864e5);
  if (doy === L.bday){ c.age = (c.age || 30) + 1; msg(c.name, crewDialect(c, 'Jeg fyller ' + c.age + ' i dag. Kaka står i byssa.'), 'I turn ' + c.age + ' today. The cake is in the galley.'); lifeStory(c, 'Fylte ' + c.age + ' år om bord.', 'Turned ' + c.age + ' aboard.'); for (const o of S.crew) if (o !== c) o.morale = Math.min(100, o.morale + 2); }
  if (L.notice && !c.opp){ if (S.t >= L.notice && S.boat.status === 'port') lifeDepart(c); return; }   // (a week's notice from a save before Ø11.9)
  if (c.off && c.offUntil) return;
  // the dream within reach: notice by the law (Ø11.9, crewNotice in 04-crew.js), ashore at the first harbour after it (crewOppTick)
  if (L.goal === 'egenbat' && L.saved >= L.target && !c.opp){ const o = crewNotice(c, 'egenbat'); if (o) L.notice = o.end; return; }
  if (L.goal === 'skipper' && !L.saidSkip && c.attr.erf >= 4.5 && c.attr.sjo >= 4){ L.saidSkip = true; msg(c.name, crewDialect(c, 'Jeg er klar til å føre en båt for deg den dagen du får en til.'), 'I am ready to skipper a boat for you the day you get another.'); }
  const r = Math.random();
  if (L.fam === 'partner' && c.age < 50 && r < 0.0012){ lifeOff(c, 3, 'Jeg gifter meg på lørdag! Jeg tar tre dager fri.', 'I am getting married on Saturday! I take three days off.', 'Giftet seg.', 'Got married.'); for (const o of S.crew) o.morale = Math.min(100, o.morale + 3); }
  else if ((L.fam === 'partner' || L.fam === 'kids') && c.age < 46 && r < 0.0020){ L.fam = 'kids'; lifeOff(c, 2, 'Vi har fått en liten en! Jeg er hjemme et par dager.', 'We have had a little one! I am at home a couple of days.', 'Ble forelder.', 'Became a parent.'); }
  else if (r < 0.0035) lifeOff(c, 1 + Math.floor(Math.random() * 3), 'Jeg ligger med feber. Jeg er tilbake om noen dager.', 'I am down with a fever. Back in a few days.', 'Lå syk noen dager.', 'Was ill a few days.');
}
// a fall on deck in a heavy sea (per hour fishing, hs the significant wave height): two to three weeks ashore
function lifeInjury(c, hs){ if (c.offUntil || !(hs > 2.2) || Math.random() >= 0.0006 * (hs - 2.2)) return;
  lifeOff(c, 14 + Math.floor(Math.random() * 8), 'Jeg gikk over ende på dekk og slo foten stygt. Legen sier noen uker i land.', 'I went over on deck and hurt my leg badly. The doctor says some weeks ashore.', 'Skadet seg på dekk i grov sjø.', 'Was hurt on deck in a heavy sea.'); c.morale = Math.max(0, c.morale - 10); }
// time off that has a date on it runs out by itself
function lifeOffTick(c){ if (c.offUntil && S.t >= c.offUntil){ c.off = false; delete c.offUntil; msg(c.name, crewDialect(c, 'Jeg er tilbake om bord.'), 'I am back aboard.'); } }
// off to a boat of their own: the name of the boat, a look to remember them by, and a place among the alumni (at most ten) who fish
// out of their home port and come back to the exchange after a year or two
function lifeDepart(c){
  const L = crewLife(c), hp = c.homePort && portById(c.homePort), used = new Set((S.alumni || []).map(a => a.boat)), boat = LIFE_BOATS.find(b => !used.has(b)) || LIFE_BOATS[Math.floor(Math.random() * LIFE_BOATS.length)];
  lifeStory(c, 'Kjøpte egen båt, «' + boat + '».', 'Bought a boat of their own, the «' + boat + '».');
  let lk = null; try { lk = typeof lookOf === 'function' && typeof lookKey === 'function' ? lookKey(lookOf(c)) : null; } catch (e){}
  const snap = JSON.parse(JSON.stringify(Object.assign({}, c, {wk:undefined, grudge:{}, earn:[], off:false, offUntil:undefined, trip:undefined, sleepW:undefined, low:0})));
  S.alumni = (S.alumni || []).filter(a => a.id !== c.id).concat([{id:c.id, name:c.name, boat, home:c.home, homePort:c.homePort, lk, t0:S.t, back:S.t + Math.round((365 + Math.random() * 365) * 1440), c:snap}]).slice(-10);
  crewQuit(c, crewDialect(c, 'Takk for tiden om bord. Nå går jeg om bord i min egen. Du ser meg nok på feltet.'), 'Thank you for the time aboard. Now I go aboard my own. You will see me on the grounds.');
  log(c.name + ' har kjøpt egen båt, «' + boat + '», og fisker fra ' + (hp ? hp.name : c.home) + '.', c.name + ' has bought a boat of their own, the «' + boat + '», and fishes out of ' + (hp ? hp.name : c.home) + '.');
}
// the alumni's boats on the AIS (core/05-vessels.js npcStates): on the nearest named fishing ground within 40 km of the home port
// (Ø14 F3, 11.11.2026: Fiskeridirektoratet's grounds along the whole coast, feltNear in 01-world.js, not Senja's six), 07–15 every day
// but Sunday; no ground that near, and the boat stays out of sight. a.gv: the place was found after F3 (one from before is found anew)
function alumniGround(a){ if (a.g !== undefined && a.gv === 1) return a.g; const hp = (a.homePort && portById(a.homePort)) || portById(S.home || HOME0) || portById('finnsnes');
  if (!hp){ a.gv = 1; return a.g = null; }   // a home with no port in the game: out of the skipper's home port
  const q = feltNear(hp.p, 40).find(k => k.d > 1.5 && feltSd(k.g, k.p.x, k.p.y) > 0), g = q ? {x:Math.round(q.p.x * 1000) / 1000, y:Math.round(q.p.y * 1000) / 1000} : null;
  // (kept only once the grounds' shapes are in, or known not to come: before that every ground is a circle round its label point)
  if (typeof FELTW !== 'undefined' && FELTW.key >= 1){ a.g = g; a.gv = 1; } return g; }
function alumniStates(H){
  const out = []; if (!S.alumni || !S.alumni.length) return out; const d = gDate(H), hod = d.getUTCHours() + d.getUTCMinutes() / 60; if (d.getUTCDay() === 0) return out;
  S.alumni.forEach((a, i) => { const G = alumniGround(a); if (!G) return; const j = (lookHash(String(a.id)) % 100) / 100; if (hod < 7 + j || hod >= 15 + j * 1.5) return;
    out.push({id:'al' + a.id, name:a.boat, type:'sjark', p:{x:G.x + Math.sin(i * 2.1 + j) * 0.5, y:G.y + Math.cos(i * 2.1 + j) * 0.5}, hd:0.3 + i + j, cog:0.3 + i + j, v:0, st:'fishing', alum:true, L:10.99, B:3.9, liv:(i % 3) + 1, lk:a.lk || '', ck:'', first:a.name.split(' ')[0]}); });
  return out;
}
// passing an old hand on the grounds: a horn from her boat, once a day (until the VHF talk is built)
function lifeHail(H){
  if (!S.alumni || !S.alumni.length || S.boat.status === 'port') return; const day = Math.floor(H / 24);
  for (const n of alumniStates(H)){ const a = S.alumni.find(x => 'al' + x.id === n.id); if (!a || a.hailDay === day || dist(n.p, S.boat.pos) > 1.5) continue; a.hailDay = day;
    msg('Sjøen', n.first + ' tuter til deg fra «' + a.boat + '».', n.first + ' sounds the horn at you from the «' + a.boat + '».');
    if (typeof SND !== 'undefined' && SND.horn) SND.horn(0.6); if (typeof G3 !== 'undefined' && G3.sayBoat) G3.sayBoat(n.id, S.lang === 'en' ? 'Good to see you!' : crewDialect(a.c || null, 'Godt å se deg!')); }
}
// ===== the small errands (Oppdrag 2, punkt 2; steg 45a, 12.11.2026; docs/planer/oppdrag-2.md, 5.6 in docs/systemer/folk-om-bord.md) =====
// One aboard asks for something that belongs to their life while the boat is out: in by their home harbour, a short call at a harbour
// on the way, or a day off. Jonas 30.10.2026: «de må være kontekstualiserte slik at han ikke spør om å dra hjem til feks botnhamn hvis
// båten ligger i kirkenes»: home only when it is within ERR.nm of the boat, a call only where the boat is (ERR.min at her cruising speed),
// and a day off says home only when home is that near. Never money, never a wait, never a deadline with a cost (CLAUDE.md, «Engasjement og
// inntekt»): «Ikke nå» does nothing but keep them from asking again for a week; «Ja» and the errand done gives a line in their story and
// a week of learning a little faster (learnHour). At most one open errand aboard (c.err on the one who asked), one ask per person per week, not in their
// first week aboard, not on the first trip, not in a gale. All the numbers are start values for the play test.
const ERR = {nm:40, min:20, week:7 * 1440, life:1440, learn:1.05, p:0.006, h0:8, h1:20, gale:13.9};
const ERR_WHY = {
  home:[['Søstera mi har en pakke til meg.', 'My sister has a parcel for me.'], ['Mor fyller år, og jeg vil stikke innom med blomster.', 'Mum has her birthday, and I would like to drop in with flowers.'], ['Jeg har glemt medisinen min hjemme.', 'I left my medicine at home.']],
  stop:[['Jeg må på apoteket og hente medisin.', 'I need the chemist for my medicine.'], ['Jeg har en pakke som venter på posten der.', 'I have a parcel waiting at the post office there.'], ['Telefonen min er knust, og de har en butikk der.', 'My phone is broken, and there is a shop there.']],
  offHome:[['Jeg vil hjem en dag, det er dåp i familien.', 'I would like a day at home, there is a christening in the family.'], ['Ungen min har avslutning på skolen.', 'My youngest has the end-of-term show at school.'], ['Jeg vil hjem og hjelpe far med båtnaustet.', 'I would like to go home and help Dad with the boathouse.']],
  off:[['Jeg trenger en dag på land for å ringe hjem og sove ut.', 'I need a day ashore to call home and sleep in.'], ['Jeg vil gå en tur i fjellet her i morgen.', 'I would like a walk in the hills here tomorrow.'], ['Ryggen trenger en dag uten løft.', 'My back needs a day without lifting.']]};
// what they tell about themselves when it is done (lifeStory): by their family and their dream
function errandLine(c){
  const L = crewLife(c), first = c.name.split(' ')[0];
  const fam = L.fam === 'kids' ? ['Fortalte om ungene hjemme og viste bilder av dem.', 'Told about the children at home and showed pictures of them.']
    : L.fam === 'partner' ? ['Fortalte om den som venter hjemme.', 'Told about the one who waits at home.'] : ['Fortalte om oppveksten sin.', 'Told about growing up.'];
  const goal = L.goal === 'egenbat' ? ['Fortalte om båten ' + first + ' sparer til.', 'Told about the boat ' + first + ' is saving for.'] : L.goal === 'skipper' ? ['Fortalte at ' + first + ' vil føre båt en dag.', 'Told that ' + first + ' wants to skipper a boat one day.'] : ['Fortalte om det rolige livet ' + first + ' vil ha.', 'Told about the quiet life ' + first + ' wants.'];
  return crewRand() < 0.5 ? fam : goal;
}
// the boat's cruising speed in km a minute, for the call on the way (ERR.min)
const errKmMin = () => Math.max(4, BOAT.vcruise || 6) * NM / 60;
// may this person ask now (not who is picked, nor where): aboard, settled in, not on notice or off, a week since the last ask
function errandMay(c){
  if (!c || !c.attr || c.off || c.opp || c.fly || c.mobOff) return false; const L = crewLife(c);
  return S.t - (c.hiredT || 0) >= ERR.week && S.t - (L.errT == null ? -1e12 : L.errT) >= ERR.week;
}
// what this person could ask for where the boat is now, or null: {k:'home'|'stop'|'off', port, why:[no, en]}. Home only within ERR.nm of
// the boat; a call at a harbour within ERR.min at her cruising speed; a day off only in a harbour or on the way in
function errandPick(c, r = crewRand){
  const b = S.boat; if (!b || !b.pos) return null;
  const sea = b.status === 'sailing' || b.status === 'fishing' || b.status === 'idle', inPort = b.status === 'port', goingIn = sea && !!(S.plan && S.plan.returning);
  const hp = c.homePort ? portById(c.homePort) : null, near = hp && hp.p && dist(hp.p, b.pos) <= ERR.nm * NM && portFits(hp, b.type) ? hp : null;
  const pick = a => a[Math.floor(r() * a.length) % a.length], opts = [];
  if (sea && near && near.id !== b.port) opts.push({k:'home', port:near.id, why:pick(ERR_WHY.home)});
  if (sea && !opts.length){ const R = errKmMin() * ERR.min, q = PORTS.filter(pt => pt.p && !pt.rorbu && pt.id !== (hp && hp.id) && dist(pt.p, b.pos) <= R && portFits(pt, b.type)).sort((x, y) => dist(x.p, b.pos) - dist(y.p, b.pos))[0];
    if (q) opts.push({k:'stop', port:q.id, why:pick(ERR_WHY.stop)}); }
  if (inPort || goingIn) opts.push({k:'off', port:null, why:pick(near ? ERR_WHY.offHome : ERR_WHY.off)});
  return opts.length ? opts[Math.floor(r() * opts.length) % opts.length] : null;
}
// the question, in their own words and dialect
function errandAskText(c, E){
  const pt = E.port && portById(E.port), nm = pt ? pt.name : '';
  const q = E.k === 'home' ? ['Kan vi gå innom ' + nm + '? ', 'Could we call in at ' + nm + '? '] : E.k === 'stop' ? ['Kan vi legge til i ' + nm + ' en liten stund? ', 'Could we put in at ' + nm + ' for a little while? '] : ['Kan jeg få en fridag? ', 'Could I have a day off? '];
  return [q[0] + E.why[0], q[1] + E.why[1]];
}
const errEv = (k, E) => { if (typeof cloudEv === 'function') cloudEv('crew_errand', {k, e:E.k}); };
// the open errand aboard, on the one who asked (c.err; a crew member's own field, so it goes with the vessel when the fleet ticks, eachVessel)
const errOpen = () => (S.crew || []).find(c => c.err) || null;
// once an hour (crewTick, for each vessel in turn): an open errand is done or runs out; else, by day and in fair weather, one aboard may ask
function errandHour(H){
  const b = S.boat, c0 = errOpen();
  if (c0){ const E = c0.err, at = b.status === 'port';
    if (c0.off || c0.opp){ errEv('lapse', E); delete c0.err; return; }   // ashore for other reasons, or on notice: no more of it
    if (E.k !== 'off' && at && b.port === E.port) return errandDone(c0);   // they called in where asked (also with no answer given: she did it)
    if (E.k === 'off' && E.ok && at) return errandDone(c0);                 // the day off, once in a harbour
    if (S.t - E.t0 >= ERR.life || (E.k !== 'off' && at && b.port !== E.port && S.t - E.t0 > 60)){ errEv('lapse', E); delete c0.err; }   // a day gone, or in a harbour elsewhere: no more, and no harm
    return; }
  if (S.tut || (typeof lagOf === 'function' && lagOf()) || !meAboard()) return;
  const hr = gDate(H).getUTCHours(); if (hr < ERR.h0 || hr >= ERR.h1) return;
  if (windAt(H, b.pos) >= ERR.gale) return;   // never in a gale (Bft 7 and over)
  for (const c of crewAboard(H)){ if (!errandMay(c) || crewRand() >= ERR.p) continue;
    const P = errandPick(c); if (!P) continue;
    crewLife(c).errT = S.t; c.err = Object.assign({t0:S.t, ok:false}, P);
    const tx = errandAskText(c, c.err); msg(c.name, crewDialect(c, tx[0]) + ' Svar på kortet under Mannskap.', tx[1] + ' Answer on the card under Crew.');
    errEv('ask', c.err); return; }
}
// the answer on the card: yes, or not now (which does nothing but keep the week before they ask again)
function errandAnswer(id, yes){
  const c = crewById(id), E = c && c.err; if (!E || E.ok) return false;
  if (!yes){ errEv('no', E); delete c.err; msg(c.name, crewDialect(c, 'Greit, det får bli en annen gang.'), 'All right, another time then.'); return true; }
  E.ok = true; errEv('yes', E);
  if (E.k === 'off' && S.boat.status === 'port'){ errandDone(c); return true; }
  const pt = E.port && portById(E.port);
  msg(c.name, crewDialect(c, E.k === 'off' ? 'Takk! Da tar jeg fri når vi ligger til kai.' : 'Takk! Det er ' + (pt ? pt.name : 'kaia') + ' jeg tenker på.'), E.k === 'off' ? 'Thanks! I will take the day when we are at the quay.' : 'Thanks! It is ' + (pt ? pt.name : 'the quay') + ' I have in mind.');
  return true;
}
// done: the line in their story, a week of learning a little faster, and the day off when that was the errand
function errandDone(c){
  const E = c && c.err; if (!E) return; delete c.err; const L = crewLife(c), ln = errandLine(c), pt = E.port && portById(E.port);
  if (E.k === 'off') lifeOff(c, 1, 'Takk for fridagen. Jeg er tilbake i morgen.', 'Thanks for the day off. I am back tomorrow.', 'Fikk en fridag. ' + ln[0], 'Had a day off. ' + ln[1]);
  else { lifeStory(c, (E.k === 'home' ? 'Var innom hjemme i ' : 'Fikk gå i land i ') + (pt ? pt.name : '') + '. ' + ln[0], (E.k === 'home' ? 'Called in at home in ' : 'Went ashore at ') + (pt ? pt.name : '') + '. ' + ln[1]);
    msg(c.name, crewDialect(c, 'Tusen takk for at vi gikk innom. Det betydde mye.'), 'Thank you so much for calling in. It meant a lot.'); }
  L.errUp = S.t + ERR.week; errEv('done', E);
}
// learning a little faster for a week after an errand done (learnHour)
const errandLearn = c => (c.life && c.life.errUp > S.t) ? ERR.learn : 1;
// back to the exchange after the years with a boat of their own: a smaller share asked, and the story goes on
function alumniReturn(B){
  for (const a of (S.alumni || []).slice()){ if (a.back > S.t || !a.c || B.pool.length >= 6) continue; S.alumni.splice(S.alumni.indexOf(a), 1);
    const c = crewDerive(Object.assign(a.c, {ask:lotR(lotMigrate(a.c).ask - LOTT.step), morale:62, fatigue:0, known:[true, true], grudge:{}, earn:[], off:false, until:S.t + 5 * 1440})); c.share = c.ask; if (c.cpen) delete c.cpen;
    delete c.opp; delete c.avt; delete c.hiredT; c.noProve = true;   // a new agreement when signing on again, without probation (Ø11.9; a game choice in the spirit of § 3-2 (3))
    if (c.life){ c.life.notice = null; c.life.goal = 'ro'; c.life.saved = Math.round(c.life.target * 0.3); c.life.day = -1; lifeStory(c, 'Solgte «' + a.boat + '» og søker hyre igjen.', 'Sold the «' + a.boat + '» and looks for a berth again.'); }
    B.pool.push(c); }
}

