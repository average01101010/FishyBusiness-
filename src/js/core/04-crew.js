// ================= crew: people with skills, habits and moods =================
// Candidates follow the 2025 fisher register: age groups, 6 % women, 11 % with fishing as a side occupation. Troms has only
// 963 full-time fishers, so hands are scarce, scarcest in the skrei season when every boat wants crew.
const CREW_M = ['Ole Martin', 'Stian', 'Tor Arne', 'Mats', 'Eirik', 'Sondre', 'Håkon', 'Vegard', 'Kjell', 'Rune', 'Geir', 'Arild', 'Svein Erik', 'Jørgen', 'Andreas', 'Kristian', 'Tommy', 'Roger', 'Frode', 'Bjørnar', 'Ronny', 'Jan Erik', 'Terje', 'Odd Inge', 'Magnus', 'Henrik', 'Sindre', 'Espen', 'Trond', 'Leif'];
const CREW_F = ['Kari', 'Ingrid', 'Siri', 'Hanne', 'Marit', 'Tone', 'Line', 'Silje', 'Ida', 'Hege', 'Marte', 'Randi'];
const CREW_SN = ['Hansen', 'Johansen', 'Olsen', 'Pedersen', 'Karlsen', 'Nilsen', 'Jakobsen', 'Andreassen', 'Berg', 'Eriksen', 'Mikalsen', 'Pettersen', 'Nordvik', 'Hamnvik', 'Strand', 'Isaksen', 'Bakke', 'Mathisen'];
const CREW_HOME = [['Husøy', 'husoy'], ['Gryllefjord', 'gryllefjord'], ['Senjahopen', 'senjahopen'], ['Botnhamn', 'botnhamn'], ['Finnsnes', 'finnsnes'], ['Torsken', 'torsken'], ['Skaland', null], ['Mefjordvær', null], ['Silsand', null], ['Sørreisa', null], ['Tromsø', null], ['Harstad', null], ['Andenes', null]];
// where a new hand is from: the places round your home harbour, anywhere on the coast (Senja's list where the game began)
function crewHome(){
  const hp = portById(S.home || HOME0), f = portById('finnsnes'), near = hp && typeof plantsNear === 'function' ? plantsNear(hp.p, 8) : [];
  if (hp && f && dist(hp.p, f.p) > 60 && near.length){ const x = near[Math.floor(Math.random() * near.length)].pt; return [x.name, x.id]; }
  return CREW_HOME[Math.floor(Math.random() * CREW_HOME.length)];
}
const ATTR = [['erf', 'Erfaring', 'Experience'], ['styrke', 'Styrke', 'Strength'], ['uth', 'Utholdenhet', 'Stamina'], ['tek', 'Teknisk', 'Technical'], ['kokk', 'Kokk', 'Cook'], ['sjo', 'Sjømannskap', 'Seamanship']];
const GEARS = [['juksa', 'Juksa', 'Jig'], ['line', 'Line', 'Longline'], ['garn', 'Garn', 'Nets'], ['teiner', 'Teiner', 'Pots']];
const TRAITS = {
  arbeidsjern:{no:'Arbeidsjern', en:'Workhorse', w:1.2, d:{no:'Jobber hardt og lenge, men blir irritert på folk som tar det med ro.', en:'Works hard and long, but gets annoyed by those who take it easy.'}},
  kranglefant:{no:'Kranglefant', en:'Quarrelsome', w:0.9, d:{no:'Sterk og dyktig, men lager lett splid om bord.', en:'Strong and able, but easily causes friction aboard.'}},
  spokefugl:{no:'Spøkefugl', en:'Joker', w:1, d:{no:'Holder humøret oppe og demper krangler.', en:'Keeps spirits up and calms quarrels.'}},
  grinebiter:{no:'Grinebiter', en:'Grump', w:0.9, d:{no:'Pålitelig og slutter sjelden, men sur, og trekker stemningen ned.', en:'Reliable and rarely quits, but sour, and drags the mood down.'}},
  perfeksjonist:{no:'Perfeksjonist', en:'Perfectionist', w:0.8, d:{no:'Behandler fisken perfekt, men jobber litt saktere.', en:'Handles the fish perfectly, but works a little slower.'}},
  lokalkjent:{no:'Lokalkjent', en:'Local knowledge', w:1, d:{no:'Kjenner feltene rundt hjemstedet og får mer fisk der.', en:'Knows the grounds around home and catches more there.'}},
  sjosyk:{no:'Sjøsyk', en:'Seasick', w:0.7, d:{no:'Blir dårlig i grov sjø og gjør lite da.', en:'Gets sick in rough seas and does little then.'}},
  olglad:{no:'Ølglad', en:'Likes a pint', w:0.9, d:{no:'Trives på puben, men morgenen etter går det tregt.', en:'Loves the pub, but the morning after is slow.'}},
  laerevillig:{no:'Lærevillig', en:'Eager learner', w:1, d:{no:'Blir fort flinkere med fartstid.', en:'Improves quickly with time at sea.'}},
  rastlos:{no:'Rastløs', en:'Restless', w:0.8, d:{no:'Mister fort motet når det går dårlig, og slutter lettere.', en:'Loses heart quickly when things go badly, and quits more easily.'}},
  makelig:{no:'Makelig', en:'Easy-going', w:0.9, d:{no:'Rolig og grei, men tar det med ro på dekk.', en:'Calm and pleasant, but takes it easy on deck.'}},
  omsorgsfull:{no:'Omsorgsfull', en:'Caring', w:0.8, d:{no:'Passer på de andre og skaper god stemning.', en:'Looks after the others and builds a good atmosphere.'}},
  stolt:{no:'Stolt', en:'Proud', w:0.8, d:{no:'Dyktig, men tåler dårlig å bli overkjørt.', en:'Able, but does not take being overruled well.'}}
};
function pickW(pairs){ let r = Math.random() * pairs.reduce((a, q) => a + q[1], 0); for (const q of pairs){ r -= q[1]; if (r <= 0) return q[0]; } return pairs[0][0]; }
function crewAge(){ const b = pickW([[0, 4.3], [1, 19.4], [2, 19.5], [3, 16.7], [4, 20.1], [5, 16.1], [6, 3.9]]), lo = [16, 20, 30, 40, 50, 60, 70][b], hi = [19, 29, 39, 49, 59, 69, 74][b]; return lo + Math.floor(Math.random() * (hi - lo + 1)); }
const r15 = x => clamp(Math.round(x * 2) / 2, 1, 5);
function skreiSeason(H){ const m = gDate(H).getUTCMonth(); return m <= 3; }
function crewDerive(c){ const lvl = c.attr.erf >= 4 ? 2 : c.attr.erf >= 2.5 ? 1 : 0; c.lv = ['lærling', 'erfaren', 'dreven'][lvl]; c.lvEn = ['apprentice', 'experienced', 'seasoned'][lvl]; c.skill = clamp(0.6 + 0.1 * c.attr.erf + 0.04 * c.attr.sjo, 0.7, 1.3); return c; }
function genCrew(){
  const f = Math.random() < 0.06, age = crewAge(), yrs = Math.max(0, Math.round((age - 16) * (0.25 + Math.random() * 0.75))), home = crewHome();
  const ex = 1 + 4 * (1 - Math.exp(-yrs / 9)), peak = 1 - Math.abs(age - 34) / 45, rnd = () => Math.random() - 0.5;
  const attr = {erf:r15(ex + rnd()), styrke:r15(2 + 3 * peak + rnd() * 1.5), uth:r15(1.8 + 2.6 * peak + rnd() * 1.6), tek:r15(1 + Math.random() * 3.2 + (Math.random() < 0.15 ? 1.2 : 0)), kokk:r15(1 + Math.random() * 3 + (Math.random() < 0.12 ? 1.5 : 0)), sjo:r15(ex * 0.8 + Math.random())};
  const gear = {juksa:r15(1.5 + ex * 0.7 * Math.random() + 0.5), line:r15(1 + (yrs > 10 ? ex * 0.7 : ex * 0.3) * Math.random() + 0.3), garn:r15(1 + ex * 0.6 * Math.random()), teiner:r15(1 + ex * 0.5 * Math.random()), ...deckSkills(ex)};
  const tw = () => Object.entries(TRAITS).map(([k, T]) => [k, T.w * (k === 'laerevillig' && age < 30 ? 2 : k === 'grinebiter' && age > 50 ? 1.8 : 1)]);
  const traits = [pickW(tw())]; if (Math.random() < 0.55){ let t2 = traits[0]; for (let i = 0; i < 8 && t2 === traits[0]; i++) t2 = pickW(tw()); if (t2 !== traits[0]) traits.push(t2); }
  if (traits.includes('kranglefant')) attr.styrke = Math.min(5, attr.styrke + 1);
  const bi = Math.random() < 0.108, nm = (f ? CREW_F : CREW_M)[Math.floor(Math.random() * (f ? CREW_F : CREW_M).length)] + ' ' + CREW_SN[Math.floor(Math.random() * CREW_SN.length)];
  const ask = Math.round((0.07 + 0.025 * attr.erf + (traits.includes('arbeidsjern') ? 0.01 : 0) + (skreiSeason(S.t / 60) ? 0.015 : 0)) * 100) / 100;
  return crewDerive({id:'k' + Math.random().toString(36).slice(2, 9), name:nm, sex:f ? 'f' : 'm', age, home:home[0], homePort:home[1], yrs, attr, gear, traits, known:[true, traits.length < 2], bi, biDays:bi ? [0, 0, 0, 0, 1, 1, 1] : null, ask, share:ask, morale:62, fatigue:10, seaH:0, grudge:{}, earn:[], hiredT:S.t});
}
// the deck skills: gutting, icing and crab sorting grow with the years on deck
function deckSkills(ex){ return {sloy:r15(1.2 + ex * 0.6 * Math.random() + 0.3), is:r15(1.3 + ex * 0.5 * Math.random()), sort:r15(1 + ex * 0.4 * Math.random())}; }
// crew from before this system get skills that match their level; crew from before the deck skills get those
function crewUpgrade(c){ if (c.attr){ if (c.gear && c.gear.sloy == null) Object.assign(c.gear, deckSkills(c.attr.erf)); return c; } const g = genCrew(), e = c.lv === 'dreven' ? 4.5 : c.lv === 'erfaren' ? 3 : 1.5; return crewDerive(Object.assign(g, {id:c.id, name:c.name, sex:c.sex || (CREW_F.includes(String(c.name).split(' ')[0]) ? 'f' : 'm'), age:c.age || g.age, share:c.share, ask:c.share, bi:false, biDays:null, known:[true, true], attr:Object.assign(g.attr, {erf:e, sjo:r15(e * 0.9)})})); }
// Hyre (E3 of the economy plan, 04.10.2026): instead of a share of the catch a crew member can be paid a day wage for every day signed
// on, whatever the catch and whether the boat goes out or not. It is allowed in the open group as in the closed one, and on a fishing
// vessel no employer's tax is paid on it (the product levy covers it: Skatteetaten, «Hyre til mannskap på fiske-, småhval- og
// selfangstfartøy»). The day wage asked is 90 % of what the share asked for would bring in a week such as the morale reckons with
// (6 000 kr a day, five days), a day: safety costs a little (an assumption, not a tariff).
const HYRE = {week:6000 * 5, safe:0.9};
const hyreAsk = c => Math.max(100, Math.round(c.ask * HYRE.week / 7 * HYRE.safe / 10) * 10);
// the day wages, paid at midnight for every vessel's crew on hyre
function payHyre(){ let sum = 0; eachVessel(() => { for (const c of S.crew) if (c.pay === 'hyre'){ book('mannskap', -c.hyre, 'Hyre', 'Wages'); sum += c.hyre; if (typeof lifeEarn === 'function') lifeEarn(c, c.hyre); c.earn = (c.earn || []).filter(e => e[0] > S.t - 7 * 1440).concat([[S.t, c.hyre]]); } }); return sum; }
// (all: those off watch asleep in their bunks too, 06d-drift.js driftWatch; they are crew and share the catch, but are not on deck)
// (a hand in the old form, as the quay's candidates are hired, is made whole in place once: made again at every call he came out
// different each time, aboard in one call and ashore in the next, until the hour's crewTick kept one)
function crewAboard(H, all){ if (H == null) H = S.t / 60; const wd = (gDate(H).getUTCDay() + 6) % 7, C = S.crew || []; for (let i = 0; i < C.length; i++) if (!C[i].attr) C[i] = crewUpgrade(C[i]); return C.filter(c => !c.off && (all || !c.sleepW) && (!c.bi || c.biDays[wd])); }
function crewEff(c, H, hs, g = 'juksa'){
  const A = c.attr, T = c.traits; let e = 0.55 + 0.08 * A.erf + 0.07 * (c.gear[g] || c.gear.juksa || 1) + 0.04 * A.styrke;
  if (T.includes('arbeidsjern')) e *= 1.12; if (T.includes('makelig')) e *= 0.9; if (T.includes('perfeksjonist')) e *= 0.95;
  if (T.includes('lokalkjent') && c.homePort && dist(portById(c.homePort).p, S.boat.pos) < 15) e *= 1.12;
  for (const f of crewDrive(c, H, hs)) e *= f[1];
  return e;
}
// ---- what lifts or drags a person's effort just now, besides what they can and who they are (Jonas 23.10.2026: «dette skal være dynamisk
// og vil variere alt etter energi, humør, miljø, sult, og andre faktorer»): [reason, factor about 1]. Fatigue and mood as before (the
// mood now in a smooth step, the same 0.85 at the bottom and a little over 1 at the top), a meal that is late, poor or good food, a heavy
// sea (the seaman minds it less), the seasick, the dark, how the crew pull together (crewTeam), a quarrel and the morning after the pub.
// The cold is not here: it already takes its share of the fishing and the hauling (coldPen), and crewEffort shows it beside these.
let DRIVE_SUN = {t:-1, dark:false};
function crewDrive(c, H, hs){
  const T = c.traits, b = S.boat, sea = b.status !== 'port', F = [];
  F.push(['tired', 1 - 0.5 * sstep(50, 100, c.fatigue)]);
  F.push([c.morale >= 62 ? 'glad' : 'sour', 0.85 + 0.2 * sstep(20, 85, c.morale)]);
  if (sea){
    const M = S.meal; if (M && M.due != null && S.t > M.due) F.push(['hungry', 1 - 0.08 * clamp((S.t - M.due) / 60, 0, 1)]);
    if (typeof foodScore === 'function'){ const q = foodScore(); if (Math.abs(q - 3) > 0.4) F.push([q > 3 ? 'food' : 'poorfood', 1 + (q - 3) * 0.02]); }
    const hw = hs * ((BOAT.fx && BOAT.fx.sea) || 1); if (hw > 1.5) F.push(['sea', 1 - Math.min(0.12, 0.05 * (hw - 1.5) * (1.2 - 0.12 * c.attr.sjo))]);
    if (T.includes('sjosyk') && hs > 1.2) F.push(['seasick', 0.75]);
    if (DRIVE_SUN.t !== S.t){ DRIVE_SUN.t = S.t; DRIVE_SUN.dark = sunAt(H, b.pos).el < -6; } if (DRIVE_SUN.dark) F.push(['dark', 0.98]);
  }
  const tv = crewTeam().v; if (Math.abs(tv - 50) > 5) F.push([tv > 50 ? 'team' : 'noteam', 0.96 + 0.08 * tv / 100]);
  if (c.cpen) F.push(['quarrel', 0.9]); if (c.cut && S.t < c.cut) F.push(['cut', 0.88]);
  if (T.includes('olglad') && S.pubE === pubEvening(H - 12) && gDate(H).getUTCHours() < 12) F.push(['hangover', 0.8]);
  return F;
}
// how a person is working, in words for the Mannskap page: a level and the strongest reason when it matters
const DRIVE_WHY = {tired:['sliten', 'tired'], glad:['i godt humør', 'in good spirits'], sour:['misfornøyd', 'unhappy'], hungry:['sulten', 'hungry'], food:['god mat i magen', 'good food inside'],
  poorfood:['dårlig mat', 'poor food'], sea:['grov sjø', 'a heavy sea'], seasick:['sjøsyk', 'seasick'], dark:['mørkt på dekk', 'dark on deck'], team:['godt lag om bord', 'a good team aboard'],
  noteam:['dårlig stemning om bord', 'a sour atmosphere aboard'], quarrel:['uvenner med noen', 'at odds with someone'], hangover:['tung i hodet etter puben', 'heavy-headed after the pub'], cut:['har skåret seg i hånda', 'has cut a hand'], cold:['kald på fingrene', 'cold fingers']};
const DRIVE_LVL = [[1.03, 'Står på', 'Going hard'], [0.95, 'Jevn innsats', 'Steady'], [0.85, 'Går litt tregt', 'A bit slow'], [0, 'Har lite å gi', 'Little left to give']];
function crewEffort(c, H, hs){
  if (H == null) H = S.t / 60; if (hs == null) hs = hsWork(S.boat.pos, H);
  const F = crewDrive(c, H, hs); if (S.boat.status !== 'port'){ const cp = coldPen(H, hs); if (cp > 0.03) F.push(['cold', 1 - cp]); }
  const f = F.reduce((a, x) => a * x[1], 1), L = DRIVE_LVL.find(x => f >= x[0]), no = S.lang === 'no';
  let why = null, wv = 0.03; for (const [k, v] of F){ const d = f >= 1 ? v - 1 : 1 - v; if (d > wv){ wv = d; why = k; } }
  return {f, lvl:DRIVE_LVL.indexOf(L), word:no ? L[1] : L[2], why, text:(no ? L[1] : L[2]) + (why ? ': ' + DRIVE_WHY[why][no ? 0 : 1] : '')};
}
// ---- samhold: how the crew aboard pull together (Jonas 23.10.2026: «Samhold ja, men det må gjøres intuitivt»), 0-100 per vessel (S.team,
// VKEYS), 50 among strangers. Once an hour it moves towards what the hour gives it: time at sea together (hard weather counts half again),
// people who get on (compat), the food, their spirits, and against it a quarrel, grudges and new faces (a newcomer takes it some of the way
// back to 50 and the shared time down by four tenths). It lifts their effort (crewDrive, ±4 %), their mood (crewTick), how ready they are
// to pitch in rather than rest (13-work.js restScore), and makes quarrels rarer. It stands still while nobody is aboard.
function crewTeam(){ return S.team || (S.team = {v:50, h:0, ids:'', nw:null, c:{}, why:null}); }
const TEAM_WHY = {pair:[['de kommer godt overens', 'they get on well'], ['{a} og {b} går hverandre på nervene', '{a} and {b} get on each other\'s nerves']],
  time:[['de har stått i det sammen en stund', 'they have been through it together for a while'], null], food:[['maten er god', 'the food is good'], ['maten er dårlig', 'the food is poor']],
  mood:[['humøret er godt', 'spirits are high'], ['flere er misfornøyde', 'several are unhappy']], quarrel:[null, ['krangelen henger i', 'the quarrel hangs over them']],
  grudge:[null, ['noen bærer nag', 'someone bears a grudge']], fresh:[null, ['det er nye folk om bord', 'there are new faces aboard']]};
function teamHour(H, on, hs, food){
  const T = crewTeam(); if (!on.length) return;
  const ids = on.map(c => c.id).sort().join(',');
  if (T.ids && ids !== T.ids){ const was = new Set(T.ids.split(',')), fresh = on.filter(c => !was.has(c.id)).length;
    if (fresh){ T.h *= 0.6; T.v += (50 - T.v) * Math.min(0.5, 0.25 * fresh); T.nw = S.t; } }
  T.ids = ids;
  const sea = S.boat.status !== 'port'; if (sea) T.h += hs > 1.5 ? 1.5 : 1;
  let pk = 0, n = 0, worst = null, wk = 1e9; for (let i = 0; i < on.length; i++) for (let j = i + 1; j < on.length; j++){ const k = compat(on[i], on[j]); pk += k; n++; if (k < wk){ wk = k; worst = [on[i], on[j]]; } }
  const mood = on.reduce((a, c) => a + c.morale, 0) / on.length, grudge = on.reduce((a, c) => a + Object.values(c.grudge || {}).reduce((x, v) => x + v, 0), 0);
  const ev = S.cevt && on.some(c => c.id === S.cevt.a || c.id === S.cevt.b);
  const C = {pair:n ? clamp(6 * pk / n, -12, 12) : 0, time:Math.min(14, T.h / 15), food:(food - 3) * 4, mood:clamp((mood - 60) * 0.25, -15, 10), quarrel:ev ? -14 : 0,
    grudge:-Math.min(12, grudge * 3), fresh:T.nw != null && S.t - T.nw < 3 * 1440 ? -5 : 0};
  const tg = clamp(50 + Object.values(C).reduce((a, v) => a + v, 0), 0, 100);
  T.v = clamp(T.v + (tg - T.v) * (sea ? 0.04 : 0.015), 0, 100); T.c = C; T.pair = worst && wk < 0 ? [worst[0].id, worst[1].id] : null;
  // the reason said with it: the strongest pull the way it is going (falling: what drags it down, even while it is still good), or, while
  // it holds, the way it stands
  const up = Math.abs(tg - T.v) >= 3 ? tg > T.v : T.v >= 50; let why = null, wv = 1; for (const k in C){ const v = up ? C[k] : -C[k]; if (v > wv && TEAM_WHY[k][up ? 0 : 1]){ wv = v; why = k; } } T.why = why; T.up = up;
}
// samhold in one line for the Mannskap page: how it stands and why
function teamLine(){
  const T = crewTeam(), no = S.lang === 'no', v = T.v, i = no ? 0 : 1;
  const w = v >= 70 ? ['Godt samhold', 'Pulling together well'] : v >= 55 ? ['Greit samhold', 'Getting along'] : v >= 40 ? ['Samholdet er så som så', 'So-so as a crew'] : ['Dårlig samhold', 'Not pulling together'];
  let r = T.why && TEAM_WHY[T.why][(T.up != null ? T.up : v >= 50) ? 0 : 1]; r = r ? r[i] : '';
  if (r && T.pair){ const a = crewById(T.pair[0]), b = crewById(T.pair[1]); r = a && b ? r.replace('{a}', a.name.split(' ')[0]).replace('{b}', b.name.split(' ')[0]) : ''; }
  if (r.includes('{a}')) r = '';
  return {v, text:w[i] + (r ? ': ' + r : ''), lvl:v >= 70 ? 0 : v >= 55 ? 1 : v >= 40 ? 2 : 3};
}
function teamEff(team, me = true, g = 'juksa'){ const H = S.t / 60, hs = hsWork(S.boat.pos, H), n = (me ? 1 : 0) + team.length; return n ? ((me ? 1 : 0) + team.reduce((a, c) => a + crewEff(c, H, hs, g), 0)) / n : 1; }
// how two people get along: habits, home village, age, and old grudges
function compat(a, b){
  const A = a.traits, B = b.traits, both = t => A.includes(t) && B.includes(t), either = t => A.includes(t) || B.includes(t); let k = 0;
  if (a.home === b.home) k += 1; if (either('spokefugl')) k += 1; if (either('omsorgsfull')) k += 1; if (both('olglad')) k += 1;
  if (either('kranglefant')) k -= both('kranglefant') ? 3 : 2; if ((A.includes('arbeidsjern') && B.includes('makelig')) || (B.includes('arbeidsjern') && A.includes('makelig'))) k -= 2;
  if (either('stolt') && either('kranglefant')) k -= 1; if ((A.includes('grinebiter') && B.includes('spokefugl')) || (B.includes('grinebiter') && A.includes('spokefugl'))) k -= 1;
  if (Math.abs(a.age - b.age) > 30) k -= 1; k -= Math.round(((a.grudge || {})[b.id] || 0) + ((b.grudge || {})[a.id] || 0));
  return k;
}
const PAIR_TOPICS = {jobb:{no:'{a} mener {b} ikke tar sin del av jobben på dekk.', en:'{a} thinks {b} is not pulling their weight on deck.'}, sloying:{no:'{a} og {b} er uenige om hvem som skal sløye.', en:'{a} and {b} disagree about who should gut the fish.'},
  musikk:{no:'{a} og {b} krangler om musikken i styrehuset.', en:'{a} and {b} are arguing about the music in the wheelhouse.'}, kaffe:{no:'{a} er sur fordi {b} tok den siste kaffen igjen.', en:'{a} is sulking because {b} took the last coffee again.'},
  respekt:{no:'{a} føler at {b} snakker ned til seg.', en:'{a} feels {b} talks down to them.'}, vaer:{no:'{a} og {b} er uenige om det var lurt å gå ut i dette været.', en:'{a} and {b} disagree about going out in this weather.'}};
const BOSS_TOPICS = {lott:{no:'{a} mener lotten er for lav for jobben som gjøres.', en:'{a} thinks the share is too low for the work done.'},
  vaer:{no:'{a} liker ikke at dere går ut i så mye vær.', en:'{a} does not like you going out in this much weather.'}, kulde:{no:'{a} fryser og vil ha bedre klær om bord.', en:'{a} is freezing and wants better clothes aboard.'}, generelt:{no:'{a} er misfornøyd og sier klart fra om det.', en:'{a} is unhappy and says so plainly.'}};
function crewById(id){ return (S.crew || []).find(c => c.id === id); }
// What the hold is worth to the crew now: priced at this plant (or the nearest one) as sell() would, less the sales organisation's
// deductions (TREKK), on which the share is reckoned
function holdNet(){
  if (!S.hold.length) return 0; const H = S.t / 60, here = portById(S.boat.port), pt = here && here.mottak ? here : (plantsNear(S.boat.pos, 1)[0] || {}).pt; if (!pt) return 0;
  let v = 0; for (const x of S.hold){ const c = x.cls != null ? x.cls : SPECIES[x.sp].ref, g = grade(x.fresh);
    v += x.kg * (x.sp === 'krabbe' ? ((x.fresh || 0) < KC.dead ? 0 : clsPrice(pt, x.sp, c, H, false)) : g === 'V' ? 1 : clsPrice(pt, x.sp, c, H, x.hook) * GM[g]); }
  return v - trekkOf(v, BOAT.len || 0).sum;
}
// The settlement when someone leaves the boat (let go, or signing off): a crew member on a share who was aboard when fish now in the
// hold was caught gets the share of it at once, and one on a wage gets the day's wage for the part of the day worked (Adrian 13.10.2026:
// crew let go just before the landing were paid nothing for the trip)
function crewSettle(c){
  let lott = 0, hyre = 0;
  if (c.pay === 'hyre'){ const g = gDate(S.t / 60), since = g.getUTCHours() * 60 + g.getUTCMinutes(), m = Math.min(since, c.hiredT != null ? Math.max(0, S.t - c.hiredT) : since);
    hyre = Math.round((c.hyre || 0) * m / 1440); }
  else if (c.trip && S.hold.length) lott = Math.round(c.share * holdNet());
  const sum = lott + hyre; delete c.trip; if (sum <= 0) return 0;
  book('mannskap', -sum, 'Oppgjør med ' + c.name, 'Settled with ' + c.name); c.earn = (c.earn || []).filter(e => e[0] > S.t - 7 * 1440).concat([[S.t, sum]]); if (typeof lifeEarn === 'function') lifeEarn(c, sum);
  log(c.name + ' fikk ' + kr(sum) + (lott ? ' i lott for fangsten om bord.' : ' i hyre for dagen.'), c.name + ' was paid ' + kr(sum) + (lott ? ' as the share of the catch aboard.' : ' in wages for the day.'));
  return sum;
}
function crewQuit(c, why, whyEn){ const i = S.crew.indexOf(c); if (i < 0) return; crewSettle(c); S.crew.splice(i, 1); for (const o of S.crew){ if (o.grudge) delete o.grudge[c.id]; }
  msg(c.name, why || 'Jeg mønstrer av her. Det er ikke noe for meg lenger.', whyEn || 'I am signing off here. It is not for me any more.'); log(c.name + ' har mønstret av.', c.name + ' has signed off.'); if (S.cevt && (S.cevt.a === c.id || S.cevt.b === c.id)) S.cevt = null; }
// the job exchange: new people look for a berth every morning; fewer in the skrei season, when every boat is hiring
function borsTick(H){
  const B = S.bors || (S.bors = {pool:[], day:-1}), day = Math.floor((H + 6) / 24);
  B.pool = B.pool.filter(c => c.until > S.t);
  const first = B.day === -1; if (B.day === day || (!first && gDate(H).getUTCHours() < 7)) return; B.day = day;
  if (typeof alumniReturn === 'function') alumniReturn(B);
  const n = skreiSeason(H) ? (Math.random() < 0.5 ? 1 : 0) : 1 + (Math.random() < 0.5 ? 1 : 0);
  for (let i = 0; i < n + (first ? 2 : 0) && B.pool.length < 6; i++){ const c = genCrew(); c.until = S.t + (2 + Math.floor(Math.random() * 4)) * 1440; B.pool.push(c); }
}
function crewRumour(){ const B = S.bors; if (!B || Math.random() < 0.5) return null; const c = B.pool.find(x => !x.known[1] && x.traits.length > 1); if (!c) return null; c.known[1] = true; const T = TRAITS[c.traits[1]];
  return S.lang === 'no' ? 'Kjentfolk på puben sier at ' + c.name + ' fra Mannskapsbørsen er ' + T.no.toLowerCase() + '. ' + T.d.no : 'Locals at the pub say ' + c.name + ' from the crew exchange is ' + T.en.toLowerCase() + '. ' + T.d.en; }
function crewTick(H){
  const b = S.boat; if (!S.crew || !S.crew.length){ S.workLog = []; return; }
  S.crew = S.crew.map(crewUpgrade);
  driftWatch(H);   // 2 + 2: who is on watch this hour (06d-drift.js)
  const hs = hsAt(b.pos, H), atSea = b.status === 'sailing' || b.status === 'fishing', fishing = b.status === 'fishing', hr = gDate(H).getUTCHours(), night = hr >= 22 || hr < 6;
  // the vessel's own log of hours at sea, for the crew page
  S.workLog = (S.workLog || []).concat([atSea ? 1 : 0]).slice(-24);
  const on = crewAboard(H), onIds = new Set(on.map(c => c.id)), has = t => on.filter(c => c.traits.includes(t)).length;
  // the drying room (UPGS.dry) takes the edge off the cold, as do the boat's own shelter deck and drying room; an open boat is colder (schema v2 fac, docs/batplan.md del 8)
  const F = BOAT.fac || {}, cold = coldPen(H, hs) * ((BOAT.fx && BOAT.fx.cold) || 1) * (F.shelter ? 0.75 : 1) * (F.dry ? 0.85 : 1) * (F.house === 'open' ? 1.15 : 1), food = foodScore();
  const tripH = (() => { let n = 0; for (let i = S.workLog.length - 1; i >= 0 && S.workLog[i]; i--) n++; return n; })();
  // resting ashore with the skipper (the naust or a rorbu, 15-energy.js) they come back as fast as he does: 0 to 100 in six hours in a
  // rorbu (Jonas 06.10.2026: «Så begge sover på en måte i rorbuen»)
  // and at a rorbu they sleep there too, with you or without you (tilbakemelding #11)
  const restC = meAboard() && restAshore() ? restRate(b) * 60 : b.status === 'port' && ((typeof isRorbu === 'function' && isRorbu(b.port)) || bunks(b)) ? RORBU.rate * 60 : b.anch && b.status !== 'port' && bunks(b) ? RORBU.rate * 60 * 0.85 : 0;   // (a boat with bunks rests the crew at the quay as fast as a rorbu does, Jonas 08.10.2026)
  for (const c of S.crew.slice()){
    const here = onIds.has(c.id) && atSea;
    if (typeof lifeDay === 'function'){ crewLife(c); lifeOffTick(c); lifeDay(c, H); if (!S.crew.includes(c)) continue; if (here && fishing) lifeInjury(c, hs); }   // del 2: their life beside the work (14-crewlife.js)
    // the share of the hour spent working: a break at sea tires less, but is not rest
    const wm = Object.values(c.wk || {}).reduce((a, m) => a + m, 0), workF = c.wk ? clamp(wm / 60, 0, 1) : 1;
    c.fatigue = skipOn() ? 0 : here ? clamp(c.fatigue + (fishing ? 6 : 3) * (0.4 + 0.6 * workF) * (1.4 - 0.16 * c.attr.uth) * (night ? 1.25 : 1) * ((BOAT.fx && BOAT.fx.fat) || 1) * (F.house === 'open' ? 1.1 : 1), 0, 100) : clamp(c.fatigue - Math.max(8 * (night ? 1.5 : 1), restC), 0, 100);
    if (onIds.has(c.id) && b.status !== 'port') learnHour(c);
    c.wk = {};
    if (here){ c.seaH = (c.seaH || 0) + 1; const k = c.traits.includes('laerevillig') ? 2 : 1;
      // the skills grow with the station they work (learnHour); experience grows with the hours at sea
      if (c.seaH % 40 === 0){ c.attr.erf = Math.min(5, c.attr.erf + 0.1 * k); c.attr.sjo = Math.min(5, c.attr.sjo + 0.05 * k); crewDerive(c); }
      if (!c.known[1] && c.seaH >= 12){ c.known = [true, true]; const T = TRAITS[c.traits[c.traits.length - 1]]; msg(c.name, 'Etter noen dager på sjøen vet du mer om ' + c.name + ': ' + T.no.toLowerCase() + '. ' + T.d.no, 'After some days at sea you know more about ' + c.name + ': ' + T.en.toLowerCase() + '. ' + T.d.en); } }
    // what their mood is heading towards
    // on lott: the share against the one asked for, and the week's earnings against what was hoped for; on hyre: the day wage against
    // the one asked for, and a little for the safety of it, whatever the catch
    let tg;
    if (c.pay === 'hyre') tg = 64 + clamp((c.hyre / hyreAsk(c) - 1) * 30, -20, 20);
    else { tg = 60 + (c.share - c.ask) * 300;
      const earn = (c.earn || []).filter(e => e[0] > S.t - 7 * 1440).reduce((a, e) => a + e[1], 0), expect = c.ask * 6000 * 5;
      if (S.t - (c.hiredT || 0) > 3 * 1440) tg += clamp((earn - expect) / expect * 12, -12, 12); }
    if (here) tg += (food - 3) * 3 + ((BOAT.fx && BOAT.fx.mood) || 0) + (F.mess ? 3 : F.galley === 'bysse' ? 1 : 0) - (!F.wc && tripH >= 12 ? 3 : 0);   // the food on board (the last four meals), the mess and galley (built in, or UPGS.galley), no toilet on a long day
    tg -= Math.max(0, c.fatigue - 50) * 0.5; tg -= cold * 50 * (here ? 1 : 0.3);
    if (here && hs * ((BOAT.fx && BOAT.fx.sea) || 1) > 1.5) tg -= (hs * ((BOAT.fx && BOAT.fx.sea) || 1) - 1.5) * 10 * (1.2 - 0.12 * c.attr.sjo); if (here && hs > 1.2 && c.traits.includes('sjosyk')) tg -= 15;
    if (here) tg += (crewTeam().v - 50) * 0.1;   // samhold (teamHour)
    const me = t => c.traits.includes(t) ? 1 : 0; tg += 4 * (has('spokefugl') - me('spokefugl')) + 3 * (has('omsorgsfull') - me('omsorgsfull')) - 2 * (has('grinebiter') - me('grinebiter')); if (me('grinebiter')) tg -= 5;
    tg -= Object.values(c.grudge || {}).reduce((a, v) => a + v, 0) * 5; if (me('olglad') && S.pubE === pubEvening(H)) tg += 6; if (c.cpen) tg -= c.cpen;
    c.morale = clamp(c.morale + (tg - c.morale) * (me('rastlos') ? 0.07 : 0.04), 0, 100);
    for (const k in (c.grudge || {})){ c.grudge[k] = Math.max(0, c.grudge[k] - 0.01); if (c.grudge[k] <= 0) delete c.grudge[k]; }
    // someone who stays unhappy too long signs off at the next harbour
    const lim = me('rastlos') ? 30 : me('grinebiter') ? 15 : 22; c.low = c.morale < lim ? (c.low || 0) + 1 : 0;
    if (c.low > 36 && b.status === 'port'){ crewQuit(c, 'Jeg har ikke trivdes på lenge. Jeg mønstrer av her.'); continue; }
  }
  teamHour(H, on, hs, food);
  // quarrels between people, or with you as skipper; bad food makes them likelier, good food rarer, and so does a crew that pulls together
  const foodQ = (food < 2.5 ? 1.6 : food > 3.5 ? 0.7 : 1) * (1.5 - crewTeam().v / 100);
  if (!S.cevt && atSea){
    for (let i = 0; i < on.length && !S.cevt; i++) for (let j = i + 1; j < on.length && !S.cevt; j++){ const a = on[i], c2 = on[j], k = compat(a, c2); if (k > -1) continue;
      const pr = 0.004 * (-k) * (1 + (a.fatigue + c2.fatigue) / 200) * (1 + (100 - (a.morale + c2.morale) / 2) / 100) * foodQ;
      if (Math.random() < pr){ const tp = (a.traits.includes('arbeidsjern') && c2.traits.includes('makelig')) ? 'jobb' : (a.traits.includes('stolt') || c2.traits.includes('stolt')) ? 'respekt' : hs > 1.5 ? 'vaer' : ['sloying', 'musikk', 'kaffe'][Math.floor(Math.random() * 3)];
        S.cevt = {type:'pair', a:a.id, b:c2.id, topic:tp, t0:S.t}; const tx = PAIR_TOPICS[tp]; msg('Om bord', tx.no.replace('{a}', a.name).replace('{b}', c2.name) + ' Løs det under Mannskap.', tx.en.replace('{a}', a.name).replace('{b}', c2.name) + ' Sort it out under Crew.'); } }
    for (const c of on){ if (S.cevt || c.morale >= 45) continue; const tf = c.traits.some(t => ['kranglefant', 'stolt', 'grinebiter', 'rastlos'].includes(t)) ? 1.5 : 0.6;
      if (Math.random() < 0.003 * (45 - c.morale) / 20 * tf * foodQ){ const tp = c.pay !== 'hyre' && c.share < c.ask - 0.001 ? 'lott' : hs > 1.5 ? 'vaer' : cold > 0.1 ? 'kulde' : 'generelt'; S.cevt = {type:'boss', a:c.id, topic:tp, t0:S.t};
        const tx = BOSS_TOPICS[tp]; msg(c.name, tx.no.replace('{a}', c.name) + ' Svar under Mannskap.', tx.en.replace('{a}', c.name) + ' Answer under Crew.'); } }
  }
  vitalsTalk(on);
  sayHour(H, on, hs);
  if (typeof lifeHail === 'function') lifeHail(H);
  // a quarrel left alone gets worse
  if (S.cevt){ const age = S.t - S.cevt.t0, A = crewById(S.cevt.a), Bc = crewById(S.cevt.b);
    if (age > 720 && !S.cevt.esc){ S.cevt.esc = true; if (A) A.cpen = 10; if (Bc) Bc.cpen = 10; msg('Om bord', 'Krangelen om bord er ikke løst, og stemningen blir verre.', 'The quarrel aboard is not sorted out, and the mood is getting worse.'); }
    if (age > 2880){ const q = Bc || A; S.cevt = null; if (A) A.cpen = 0; if (Bc) Bc.cpen = 0; if (q) crewQuit(q, 'Når ingen tar tak i dette, mønstrer jeg av.'); } }
}
function codRoom(H){ const q = quotaState(); return Math.max(0, codLimitNow(H) - q.torsk); }

