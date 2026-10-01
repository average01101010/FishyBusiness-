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
  if (st === 'kokk') return ['attr', 'kokk'];
  if (st === 'ror') return ['attr', 'sjo'];
  return null;
}
const SKILL_WHAT = {juksa:['jukse', 'at jigging'], line:['fiske med line', 'at longlining'], garn:['fiske med garn', 'at net fishing'], teiner:['fiske med teiner', 'at potting'],
  sloy:['sløye', 'at gutting'], is:['ise fisken', 'at icing'], sort:['sortere krabbe', 'at sorting crab'], kokk:['lage mat', 'at cooking'], sjo:['føre båten', 'at handling the boat']};
function learnHour(c){
  const wk = c.wk || {}, f = 0.012 * ageLearn(c.age) * moraleLearn(c.morale) * (c.traits.includes('laerevillig') ? 2 : 1);
  for (const st in wk){
    const sk = stationSkill(st), m = Math.min(60, wk[st]); if (!sk || m <= 0) continue;
    const o = c[sk[0]], v0 = o[sk[1]] || 1, v1 = Math.min(5, v0 + f * (1 - v0 / 5.5) * m / 60); o[sk[1]] = v1;
    if (Math.floor(v1) > Math.floor(v0)){ const w = SKILL_WHAT[sk[1]]; log(c.name + ' har blitt flinkere til å ' + w[0] + '.', c.name + ' has got better ' + w[1] + '.'); crewSay(c, 'lvl'); }
  }
  crewDerive(c);
}

// ---- meals: one every 6 hours at sea, cooked in 30 minutes by whoever stands at Kokk; the dish is as good as the cook.
// Nobody free within an hour, and it is dry bread. The last four meals make the food on board (foodScore, 1–5).
const MEAL = {every:360, cook:30, wait:60, ok:3};
const DISH = [null, ['tørre brødskiver', 'dry slices of bread'], ['pølser i lompe', 'hot dogs in flatbread'], ['fiskekaker med løk', 'fish cakes with onions'],
  ['kokt torsk med poteter', 'boiled cod with potatoes'], ['mølje med lever og rogn', 'mølje: cod with liver and roe']];
function mealState(){ return S.meal || (S.meal = {due:null, cook:null, hist:[]}); }
function foodScore(){ const h = mealState().hist.slice(-4); return h.length ? h.reduce((a, q) => a + q, 0) / h.length : 3; }
function mealDue(){ const M = mealState(); return M.due != null && S.t >= M.due && S.boat.status !== 'port'; }
// a minute in the galley, with the minute's work (core/13-work.js)
function mealMinute(A){
  const M = mealState();
  // in port they eat ashore, and alone you eat as you go
  if (S.boat.status === 'port' || !crewAboard().length){ M.due = null; M.cook = null; return; }
  if (M.due == null){ M.due = S.t + MEAL.every; return; }
  if (S.t < M.due) return;
  const ck = A.find(p => p.st === 'kokk');
  if (ck){ const id = ck.c ? ck.c.id : 'me'; if (!M.cook || M.cook.id !== id) M.cook = {id, m:0}; M.cook.m++;
    if (M.cook.m >= MEAL.cook) serveMeal(ck.c ? clamp(Math.round(ck.c.attr.kokk), 1, 5) : 3, ck.c, !ck.c); return; }
  if (S.t >= M.due + MEAL.wait && !M.cook) serveMeal(1, null, false);
}
function serveMeal(q, cook, me){
  const M = mealState(); M.hist.push(q); if (M.hist.length > 8) M.hist.shift(); M.due = S.t + MEAL.every; M.cook = null; M.last = {t:S.t, q, by:cook ? cook.id : me ? 'me' : null};
  const d = DISH[q];
  if (cook) log(cook.name.split(' ')[0] + ' laget ' + d[0] + ' til mannskapet.', cook.name.split(' ')[0] + ' made ' + d[1] + ' for the crew.');
  else if (me) log('Du laget ' + d[0] + ' til mannskapet.', 'You made ' + d[1] + ' for the crew.');
  else log('Ingen hadde tid til å lage mat. Det ble ' + d[0] + '.', 'Nobody had time to cook. It was ' + d[1] + '.');
  if (q >= 4 && meAboard() && typeof S.energy === 'number') S.energy = Math.min(100, S.energy + 4);   // a good meal gives you energy
  crewSay(null, q >= 4 ? 'foodGood' : q <= 2 ? 'foodBad' : null);
}

// ---- the rest rule for fishers (FOR-2017-11-10-1758, forskrift om arbeids- og hviletid på fiskefartøy § 3; § 1 leaves out
// those who work alone on their own vessel, so not you): at least 10 hours of
// rest in any 24 and 77 in any 7 days; the rest in at most two periods, one of at least 6 hours; at most 14 hours between rest
// periods. Each person keeps a log of the last 168 hours (1 = rest). Without berths, only hours ashore or at the quay are rest.
const REST = {day:10, long:6, gap:14, week:77};
const REST_RULE = {day:['minst 10 timer hvile i døgnet', 'at least 10 hours of rest a day'], split:['hvilen i høyst to perioder, én på minst 6 timer', 'rest in at most two periods, one of at least 6 hours'],
  gap:['høyst 14 timer mellom hvileperiodene', 'at most 14 hours between rest periods'], week:['minst 77 timer hvile i uka', 'at least 77 hours of rest a week']};
function restLog(c){ if (!Array.isArray(c.rest) || c.rest.length !== 168) c.rest = Array(168).fill(1); return c.rest; }
function restCheck(r){
  const d = r.slice(-24), sum = a => a.reduce((x, y) => x + y, 0);
  let w = 0; for (let i = r.length - 1; i >= 0 && !r[i]; i--) w++; if (w > REST.gap) return 'gap';
  if (sum(d) < REST.day) return 'day';
  const runs = []; let k = 0; for (const v of d){ if (v) k++; else if (k){ runs.push(k); k = 0; } } if (k) runs.push(k);
  runs.sort((a, b) => b - a); if (runs.length && (runs[0] < REST.long || runs[0] + (runs[1] || 0) < REST.day)) return 'split';
  if (sum(r) < REST.week) return 'week';
  return null;
}
// hours of work left before a rule is broken, if the person keeps working from now (0: broken now)
function restLeft(c){ const r = restLog(c).slice(); if (restCheck(r)) return 0; for (let k = 1; k <= 24; k++){ r.push(0); r.shift(); if (restCheck(r)) return k - 1; } return 24; }
// an hour of the log: rest when not aboard, in port, or on a break in a berth
function restHour(c, onb){
  const r = restLog(c), afloat = S.boat.status !== 'port', work = Object.values(c.wk || {}).reduce((a, m) => a + m, 0);
  r.push(!onb || !afloat || ((BOAT.berths || 0) > 0 && work <= 10) ? 1 : 0); r.shift();
  return onb && afloat ? restCheck(r) : null;
}

// ---- what the crew says: lines driven by the situation and by each person's ways. [no, en, trait the line suits]
// The Norwegian lines are in North Norwegian speech (words from the user's list: agalaus, au hirre, hustri, sjyen, kokning, …)
const SAY = {
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
    ['Nu blir det Sænja-sjampagne te hele mannskapet. Bare tulla!', 'Senja champagne for the whole crew now. Only joking!', 'spokefugl']],
  lvl:[['Nu begynne æ å få taket på det her.', 'I am starting to get the hang of this.'], ['Såg du det? Det gikk nesten av sæ sjøl!', 'Did you see that? It almost did itself!'],
    ['Æ e jo blitt rene kløpparen.', 'I have become quite the expert.'], ['Lær mæ nokka mer, skipper!', 'Teach me something more, skipper!', 'laerevillig'], ['Det va på tide at nån la merke te det.', 'About time somebody noticed.', 'stolt']],
  morning:[['God mårrå! Kaffen e klar, skipper.', 'Good morning! The coffee is ready, skipper.'], ['Morgenstund har gull i munn. Og fesk på krok, håpe æ.', 'The early bird gets the worm. And the fish, I hope.'],
    ['Bekkmørtna ennu. Men kaffen e varm.', 'Still pitch dark. But the coffee is hot.'], ['Koffør e det så lyst? Og koffør snakke alle så høgt?', 'Why is it so bright? And why is everyone talking so loudly?', 'olglad']],
  haulGood:[['Se på det her! Det kjæm fesk på hver meter.', 'Look at this! Fish on every metre.'], ['Au hirre, ka med fesk!', 'Wow, look at all the fish!'], ['Det va verdt å vente på.', 'That was worth the wait.'],
    ['Nu får haleren kjørt sæ.', 'The hauler is earning its keep now.', 'arbeidsjern']],
  haulBad:[['Mest tare og sjøstjerne. Kanskje vi kan selge dem?', 'Mostly kelp and starfish. Maybe we can sell them?'], ['Marfloen har ett bedre enn oss i natt.', 'The amphipods ate better than us last night.'],
    ['Det her va ikkje mye å skrompe av.', 'Nothing much to brag about here.'], ['Vi skulle satt lenger inn. Bare sei det.', 'We should have set closer in. Just saying.', 'grinebiter']],
  chat:[['Det e nokka eget med å se Senja fra sjyen.', 'There is something special about seeing Senja from the sea.'], ['Hørte dokker værmeldinga? Æ stole ikkje på ho.', 'Did you hear the forecast? I do not trust it.'],
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
// someone says a line for the situation: c, or a person whose ways suit one of the lines, or anyone aboard
function crewSay(c, sit){
  const on = crewAboard(), L0 = sit && SAY[sit]; if (!on.length || !L0) return false;
  // what happens is said at once, but not more than once every 15 minutes
  if (S.t - (S.sayT || -1e9) < 15) return false;
  let who = c, pool;
  if (who) pool = L0.filter(l => !l[2] || who.traits.includes(l[2]));
  else { const fit = L0.filter(l => l[2] && on.some(p => p.traits.includes(l[2])));
    if (fit.length && Math.random() < 0.6){ const l = pick1(fit); who = pick1(on.filter(p => p.traits.includes(l[2]))); pool = [l]; }
    else { pool = L0.filter(l => !l[2]); who = pick1(on); } }
  if (!pool.length || !who) return false;
  const l = pick1(pool), nm = who.name.split(' ')[0]; S.sayT = S.t;
  log(nm + ': «' + l[0] + '»', nm + ': «' + l[1] + '»');
  (who.said = who.said || []).push({t:S.t, no:l[0], en:l[1]}); if (who.said.length > 5) who.said.shift();
  if (hooks.onSay && meAboard()) hooks.onSay(who, l[0], l[1]);
  return true;
}
// once an hour at sea: now and then (at most every 1.5 hours) someone remarks on how things are
function sayHour(H, on, hs){
  const b = S.boat; if (!on.length || b.status === 'port' || S.t - (S.sayT || -1e9) < 90 || Math.random() > 0.55) return;
  const W = windAt(H), hr = gDate(H).getUTCHours(), fs = S.fsess, sits = [];
  if (b.status === 'fishing' && fs && S.t - fs.t0 >= 60){ const kgh = fs.kg / ((S.t - fs.t0) / 60); if (kgh > 40) sits.push(['goodCatch']); else if (kgh < 8 && S.t - fs.t0 >= 120) sits.push(['badCatch']); }
  if (deckPending() > tubCap() * 0.8) sits.push(['tubFull']);
  if (coldPen(H, hs) > 0.1) sits.push(['cold']);
  const sick = on.find(c => c.traits.includes('sjosyk')); if (sick && hs > 1.2) sits.push(['seasick', sick]);
  const tired = on.slice().sort((a, c) => c.fatigue - a.fatigue)[0]; if (tired.fatigue > 70) sits.push(['tired', tired]);
  if (hs > 2 || W > 14) sits.push(['storm']); else if (W < 2) sits.push(['calm']);
  if (on.some(c => { const r = restLog(c); let w = 0; for (let i = r.length - 1; i >= 0 && !r[i]; i--) w++; return w > 12; })) sits.push(['longTrip']);
  if (hr >= 5 && hr <= 7) sits.push(['morning']);
  const s = sits.length && Math.random() < 0.75 ? pick1(sits) : ['chat'];
  crewSay(s[1] || null, s[0]);
}
