// ===== the people on the quay (05.10.2026; Jonas chose it from the list of what makes people play on, 7) =====
// Three who are there wherever you start, with names that fit the coast:
// - Edvard, who knew Father. He sits on the bench by the quay in the home harbour (S.home, else Finnsnes) and has a word for you the
//   first time you come in each day (08-20): about Father, the weather, the marks in the notebook you have not found yet (the way to
//   one of them), the big fish you got. What he has said is in S.folk.edvard.seen, so he does not repeat himself soon.
// - The plant's manager at the plant you sell most to: she keeps count of what you land there (folkSold, from sell()). At 2, 10 and
//   30 tonnes you are a regular supplier, and the plant pays 1, 2 and 3 % more there (folkPf, in clsPrice: on the market price).
// - Solveig in the tackle shop: she counts what you buy (folkShop); the fifth time the coffee is on her, and from the fifteenth the
//   bagged ice is 10 % cheaper (folkIce).
// The phone's Folk app shows them, how well you know them, and what they said last.
const FOLK_NAMES = {plant:['Randi', 'Bente', 'Tove', 'Hilde', 'Marit', 'Grete'], shop:'Solveig'};
const FOLK_LV = [2000, 10000, 30000];
const EDVARD = {
  first:['Så det er du som har tatt over båten til far din. Jeg heter Edvard. Vi fisket sammen i førti år, han og jeg. Kom innom når du er i havn.', 'So you are the one who took over your father’s boat. I’m Edvard. He and I fished together for forty years. Drop by when you are in port.'],
  lines:[
    ['Far din sa alltid at en god skipper ser på himmelen før han ser på kartet.', 'Your father always said a good skipper looks at the sky before he looks at the chart.'],
    ['Når måkene setter seg på sjøen, kommer det vind. Det har aldri slått feil for meg.', 'When the gulls settle on the water, wind is coming. It has never failed me.'],
    ['Den båten der har vært gjennom flere stormer enn du har hatt bursdager. Stell den godt, så steller den deg.', 'That boat has been through more storms than you have had birthdays. Look after her and she looks after you.'],
    ['Far din kunne kjenne på juksa om det var torsk eller sei før fisken var halvveis oppe.', 'Your father could feel on the line whether it was cod or saithe before the fish was halfway up.'],
    ['Fisken flytter seg, men den har sine vaner. Den som lærer vanene, får fisken.', 'The fish move, but they have their habits. Learn the habits and you get the fish.'],
    ['Ikke gå ut i kuling for noen kilo torsk. Fisken er der i morgen også.', 'Don’t go out in a gale for a few kilos of cod. The fish will be there tomorrow too.'],
    ['Han lo av meg den gangen jeg fikk propellen i garnet hans. Det tok oss hele dagen å få det løs.', 'He laughed at me the time I got my propeller in his net. It took us the whole day to get it free.'],
    ['Skreien er som et gammelt vennskap. Den kommer tilbake hvert år, om du bare venter.', 'The skrei is like an old friendship. It comes back every year, if you just wait.']],
  hint:(m, home) => ['Far din fisket ofte ' + SPECIES[m.sp].no.toLowerCase() + ' et stykke ' + m.dir[0] + ' for ' + home + '. Det står i notatboka hans, tror jeg.', 'Your father often fished ' + SPECIES[m.sp].en.toLowerCase() + ' a way ' + m.dir[1] + ' of ' + home + '. It is in his notebook, I think.'],
  big:t => ['Jeg hørte om ' + SPECIES[t.sp].no.toLowerCase() + 'a på ' + fmt(t.kg, 0) + ' kilo. Far din hadde vært stolt.', 'I heard about the ' + SPECIES[t.sp].en.toLowerCase() + ' of ' + fmt(t.kg, 0) + ' kilos. Your father would have been proud.']
};
function folkState(){ const F = S.folk || (S.folk = {}); F.edvard = F.edvard || {met:0, last:-1, seen:[], said:null}; F.plants = F.plants || {}; F.shop = F.shop || {n:0}; return F; }
const folkPlantName = id => FOLK_NAMES.plant[Math.abs([...String(id)].reduce((a, c) => a * 31 + c.charCodeAt(0), 7)) % FOLK_NAMES.plant.length];
const folkLevel = kg => FOLK_LV.filter(v => kg >= v).length;
// the price a plant pays a regular supplier on top (clsPrice)
function folkPf(id){ const P = S && S.folk && S.folk.plants && S.folk.plants[id]; return P ? 1 + 0.01 * folkLevel(P.kg) : 1; }
// what was landed at a plant (sell)
function folkSold(id, kg){
  if (!id || !(kg > 0)) return; const F = folkState(), P = F.plants[id] || (F.plants[id] = {kg:0}), l0 = folkLevel(P.kg); P.kg += kg;
  const l1 = folkLevel(P.kg), pt = portById(id), nm = folkPlantName(id);
  if (!P.met){ P.met = S.t; msg(nm + (pt ? ' på mottaket i ' + pt.name : ''), 'Velkommen til oss. Jeg er ' + nm + ' og har ansvaret for mottaket. Leverer du jevnt hos oss, skal vi behandle deg godt.', 'Welcome. I’m ' + nm + ' and I run the plant. Land with us regularly and we’ll treat you well.'); }
  if (l1 > l0){ const t = fmt(FOLK_LV[l1 - 1] / 1000, 0);
    msg(nm + (pt ? ' på mottaket i ' + pt.name : ''), 'Du har levert ' + t + ' tonn hos oss. Nå er du fast leverandør, og vi betaler ' + l1 + ' % ekstra på markedsprisen.', 'You have landed ' + t + ' tonnes with us. You are a regular supplier now, and we pay ' + l1 + ' % over the market price.'); }
}

// ===== the plant's hands comment on the landing (Jonas 08.10.2026: «arbeiderne på fiskemottakene kommenterer fangsten vår med tekst over
// hodet … hvor mye eller lite fangst, humoristiske ord og uttrykk, et spørsmål om spilleren ikke har haill … på dialektene på de forskjellige
// stedene langs kysten») =====
// One of the day's hands at the plant says a line when the landing note is paid: by how much was landed, by what (halibut, king crab, skrei,
// saithe), by how fresh it was, by what the sales organisation took, by whether the skipper has luck aboard, and by region. The lines are
// written in the Northern Norwegian of Troms like the crew's (14-crewlife.js) and turned into the dialect of the plant's place by
// dialectText; the REGION lines are written in their own dialect and stand as they are. In 3D the line is over the hand's head (view3d.js
// sayWorker), else it is a toast; it is in the log too.
const PSAY = {
  none:[['Va det alt? Æ trudde du kom med ei tom kasse.', 'Was that all? I thought you came with an empty crate.'], ['Æ ser at fesken hadde annet å gjøre i dag.', 'I see the fish had other things to do today.'],
    ['Ska vi vege dem, eller bare telle dem på fingran?', 'Shall we weigh them, or just count them on our fingers?'], ['Det e ikkje mye å skrive heim om, nei.', 'Not much to write home about, no.'],
    ['Dieselen kosta mer enn lasta, trur æ.', 'The diesel cost more than the load, I reckon.'], ['Sånne dager e det godt å ha kaffen å holde sæ i.', 'On days like this it is good to have the coffee to hold on to.']],
  small:[['Nåh, det e jo nesten nok te middag.', 'Well, that is almost enough for dinner.'], ['Det e da noe. Kaffen e gratis i alle fall.', 'It is something. The coffee is free at least.'],
    ['Pøse eller kasse, vi tar det vi får.', 'Bag or crate, we take what we get.'], ['Neste tur blir bedre. Det e alltid neste tur.', 'Next trip will be better. There is always a next trip.'],
    ['Ska vi ta dem inn, eller vil du ha dem med heim te middag?', 'Shall we take them in, or do you want them home for dinner?'], ['Ikkje alle dager e fiskedager, vet du.', 'Not every day is a fishing day, you know.'],
    ['Sånn ja. Æ har sett verre.', 'There you go. I have seen worse.']],
  mid:[['Det e en grei tur, det der.', 'That is a decent trip.'], ['Pent, pent! Det blir lønn av det her.', 'Nice, nice! There will be pay from this.'], ['Det luktar fesk! Det likar vi.', 'It smells of fish! We like that.'],
    ['Sånn ja. Tyngre inn enn ut, det ska det være.', 'There you go. Heavier in than out, that is how it should be.'], ['Der satt det. Nu e vi i gang.', 'That did it. Now we are under way.'],
    ['Heile kassa full. Det blir kaffe på mæ.', 'The whole crate full. The coffee is on me.'], ['Ikkje gæli, skipper. Ikkje gæli i det heile tatt.', 'Not bad, skipper. Not bad at all.']],
  big:[['Au hirre, ka med lass!', 'Wow, what a load!'], ['Ska vi ha overtid i dag? Det ser sånn ut.', 'Are we working overtime today? It looks like it.'], ['Har du tømt heile sjyen, eller?', 'Have you emptied the whole sea, or what?'],
    ['Det her e fesk så det holder te heile bygda!', 'This is fish enough for the whole village!'], ['Hent trucken! Og så hent en te!', 'Fetch the truck! And then fetch another!'], ['Nu kjenner æ ryggen. Men det e verdt det.', 'Now I feel my back. But it is worth it.']],
  huge:[['Nu må æ ringe sjefen! Det her e rekord!', 'I have to call the boss now! This is a record!'], ['Heller ikkje bestefar fikk så mye på ei hel høst.', 'Not even grandad got this much in a whole autumn.'],
    ['E det heile havet du har med dæ?', 'Is that the whole ocean you have with you?'], ['Alle mann på kaia! Vi trenge alle armer!', 'All hands to the quay! We need every arm!'],
    ['Æ må sette mæ ned. Det her e for mye lykke på ein gang.', 'I have to sit down. This is too much luck all at once.']],
  noLuck:[['Har du ikkje haill, eller?', 'Haven’t you got any luck, or what?'], ['Glømte du haillen heime i dag?', 'Did you leave your luck at home today?'],
    ['Æ tippe du har tomt for haill. Haill e halve fesket, vet du.', 'I bet you are out of luck. Luck is half the catch, you know.'], ['Prøv med litt haill neste gang. Det hjelpe, sa bestefar.', 'Try some luck next time. It helps, grandad said.']],
  luckFail:[['Haillen virka ikkje i dag, he?', 'The luck did not work today, did it?'], ['Selv haill kan ikkje redde ei dårlig dag.', 'Even luck cannot save a bad day.']],
  first:[['Første gang hos oss? Velkommen! Vi bite ikkje. Så veldig.', 'First time with us? Welcome! We don’t bite. Much.'], ['Ny skipper! Vi ska lære dæ rutinene. Kaffen står der.', 'New skipper! We will teach you the routines. The coffee is over there.']],
  poor:[['Det her luktar som fredagsfesk fra i fjor.', 'This smells like last year’s Friday fish.'], ['Ska vi ha is på det neste gang? Det hjelpe.', 'Shall we have ice on it next time? It helps.'],
    ['Fesken e litt sliten. Han har hatt ein lang dag.', 'The fish look a bit worn. They have had a long day.']],
  fresh:[['Fersk som morgenen! Sånn ska det være.', 'Fresh as the morning! That is how it should be.'], ['Se på den glansen! Det her e kvalitet.', 'Look at that shine! This is quality.'],
    ['Dette e fesk som man får lyst te å si takk te.', 'This is fish you feel like saying thank you to.']],
  kveite:[['Ei kveite! Må æ ta bilde av ho?', 'A halibut! May I take a picture of her?'], ['Se på ho! Ho e større enn ungen min.', 'Look at her! She is bigger than my kid.'], ['Kveita e kongen på kaia i dag.', 'The halibut is king of the quay today.']],
  blakveite:[['Blåkveite! Den gjev æ ikkje bort for noko.', 'Greenland halibut! I would not give that away for anything.'], ['Fra dypet, ja. Den ser ut som den har sett ting.', 'From the deep, yes. It looks like it has seen things.']],
  krabbe:[['Kongekrabbe! Pass fingran, dem e ikkje døde ennu.', 'King crab! Mind your fingers, they are not dead yet.'], ['Kongekrabbe e dyrt gull. Vi passe godt på.', 'King crab is expensive gold. We will look after it.']],
  skrei:[['Skrei! Nu e det rette tia på året.', 'Skrei! Now is the right time of year.'], ['Skreia har kommet heim. Velkommen heim, tenker æ.', 'The skrei has come home. Welcome home, I think.'], ['Dette e sjølve vinterfisket!', 'This is the winter fishery itself!']],
  sei:[['Sei igjen? Det e greit, vi kan alltid bruke sei.', 'Saithe again? Fine, we can always use saithe.'], ['Seien står tett i dag, ser æ.', 'The saithe stand thick today, I see.']],
  conf:[['Æ hørte at Råfisklaget tok litt av lasta di. Surt.', 'I heard the sales organisation took some of your load. Sour.'], ['Kvota e kvota. Det hjelpe ikkje å sutre.', 'A quota is a quota. Complaining does not help.']]
};
// in their own dialect, by the place (null north of 65° N is nord): small, mid and big loads
const PSAYR = {
  nord:{small:[['Lite fesk, men godt humør. Sånn e det nordpå.', 'Little fish, but good spirits. That is how it is in the north.'], ['Det blir bedre i morgen, sjø. Det blir alltid det.', 'It gets better tomorrow, you see. It always does.']],
    mid:[['Ja, det der va tøft, gutt!', 'Yes, that was tough, boy!'], ['Ikke dårlig, gutt! Ikke dårlig i det heile tatt!', 'Not bad, boy! Not bad at all!']],
    big:[['Nå har du ordentlig fisk, det e herlig!', 'Now you have proper fish, it is wonderful!'], ['Fantastisk, gutt! Det her ska vi snakke om i heile uka.', 'Fantastic, boy! We will be talking about this all week.']]},
  tro:{small:[['Dæ va ikkje mykkje, men dæ va ærli arbeid.', 'That was not much, but it was honest work.'], ['Itj verst, itj så gøy heller. Neste gang, a?', 'Not the worst, not much fun either. Next time, eh?']],
    mid:[['Dæ va flotte greier, dæ!', 'That is fine stuff, that is!'], ['Dæ e itj dårlig, det her. Itj dårlig i hele tatt.', 'This is not bad. Not bad at all.']],
    big:[['Å, du skjønne, dæ va mykkje fisk! Nu e vi rike.', 'Oh, you see, that was a lot of fish! Now we are rich.'], ['Æ ha itj sett så mykkje fesk sia i fjor. Fantastisk!', 'I haven’t seen this much fish since last year. Fantastic!']]},
  mor:{small:[['Det var ikkje mykje, men det er ærleg arbeid.', 'That was not much, but it is honest work.'], ['Det blir betre neste tur, du skal sjå.', 'It will be better next trip, you will see.']],
    mid:[['Det var ein fin fangst, det der!', 'That was a fine catch!'], ['Du er flink, du. Det skal du ha.', 'You are good, you. Credit where it is due.']],
    big:[['Oi sann, kor mykje fisk! No blir det fest.', 'My, how much fish! Now there will be a party.'], ['Dette skal vi hugse lenge, dette!', 'We will remember this for a long time!']]},
  vest:{small:[['Det var no ikkje all verda, men det går fint.', 'It was not all the world, but it will do.'], ['Neste gong, gut. Neste gong.', 'Next time, boy. Next time.']],
    mid:[['Det var då ein skikkeleg fangst, det!', 'Now that was a proper catch!'], ['Kjekt å sjå deg, og kjekt å sjå fisken.', 'Nice to see you, and nice to see the fish.']],
    big:[['Herregud, kor mykje fisk! Dette blir bra, det!', 'Good grief, how much fish! This will be good!'], ['No har du fått fisk så det held! Gratulerer, gut!', 'Now you have got fish enough! Congratulations, boy!']]},
  sor:{small:[['Det var litt lite, men sånn er det av og til.', 'A bit little, but that is how it is sometimes.'], ['Det blir bedre neste gang, ass.', 'It will be better next time, mate.']],
    mid:[['Det er helt greit, det der! Bra jobba!', 'That is quite all right! Well done!'], ['Kjempebra, da. Fersk fisk er alltid gøy.', 'Great stuff. Fresh fish is always fun.']],
    big:[['Wow, for en fangst! Dette blir en god dag, vel!', 'Wow, what a catch! This will be a good day!'], ['Gøy å se! Så mye fisk har vi ikke hatt på lenge.', 'Fun to see! We haven’t had this much fish for ages.']]}
};
const PSAY_NAMES = ['Roger', 'Kjell', 'Åse', 'Bjørn', 'Tor', 'Randi', 'Odd', 'Liv', 'Arne', 'Gunn', 'Per', 'Marit'];
// the line for a landing at a plant: the situations it fits are weighed, one is drawn, and a line from it, not the one said last
function plantLine(pt, ls, rnd){
  const lines = ls.lines || [], by = {}; let kg = 0, bad = 0, fine = 0;
  for (const r of lines){ by[r.sp] = (by[r.sp] || 0) + r.kg; kg += r.kg; if (r.g === 'X' || r.g === 'V') bad += r.kg; if (r.g === 'E' || r.g === 'A') fine += r.kg; }
  const dial = dialectAt(pt.p), reg = dial || 'nord', size = kg < 15 ? 'none' : kg < 200 ? 'small' : kg < 1500 ? 'mid' : kg < 5000 ? 'big' : 'huge', band = size === 'none' || size === 'small' ? 'small' : size === 'mid' ? 'mid' : 'big';
  const lucky = typeof haillBoost === 'function' && haillBoost() > 0, mo = gDate(S.t / 60).getUTCMonth(), cand = [];
  if ((S.landN || 0) <= 1) cand.push([6, 'first']);
  cand.push([3, size]);
  if (size === 'none' || size === 'small') cand.push([lucky ? 1.5 : 3.5, lucky ? 'luckFail' : 'noLuck']);
  if ((by.kveite || 0) >= 20) cand.push([2.5, 'kveite']); if ((by.blakveite || 0) >= 20) cand.push([2.5, 'blakveite']); if ((by.krabbe || 0) >= 10) cand.push([2.5, 'krabbe']);
  if (mo <= 3 && (by.torsk || 0) >= 300) cand.push([2, 'skrei']); if (kg >= 200 && (by.sei || 0) / kg >= 0.6) cand.push([1.8, 'sei']);
  if ((ls.confKg || 0) > 20) cand.push([2.5, 'conf']);
  if (kg >= 50 && bad / kg >= 0.4) cand.push([2.5, 'poor']); else if (kg >= 100 && fine / kg >= 0.8) cand.push([1.5, 'fresh']);
  cand.push([2.2, 'REG']);
  let r = rnd() * cand.reduce((a, c) => a + c[0], 0), pick = cand[0][1]; for (const c of cand){ r -= c[0]; if (r <= 0){ pick = c[1]; break; } }
  const pool = pick === 'REG' ? PSAYR[reg][band] : PSAY[pick], last = S.psayLast, fresh = pool.filter(l => l[0] !== last), l = (fresh.length ? fresh : pool)[Math.floor(rnd() * (fresh.length ? fresh : pool).length)];
  return {no:pick === 'REG' ? l[0] : dialectText(dial, l[0]), raw:l[0], en:l[1], pick, dial};
}
// the hand who says it, by the plant and the draw (the 3D view puts the line over the head of the hand with that number if he is out, else the first one out)
function plantSay(pt, ls){
  if (!pt || !ls || !pt.mottak) return false;
  const rnd = Math.random, L = plantLine(pt, ls, rnd), idx = Math.floor(rnd() * 4), nm = PSAY_NAMES[(Math.abs([...String(pt.id)].reduce((a, c) => a * 31 + c.charCodeAt(0), 7)) + idx * 5) % PSAY_NAMES.length];
  S.psayLast = L.raw; PSAYLOG.push({id:pt.id, nm, no:L.no, en:L.en, pick:L.pick, dial:L.dial}); if (PSAYLOG.length > 40) PSAYLOG.shift();
  log(nm + ' på mottaket: «' + L.no + '»', nm + ' at the plant: «' + L.en + '»');
  if (hooks.onPlantSay) hooks.onPlantSay(pt.id, idx, nm, L.no, L.en);
  return true;
}
const PSAYLOG = [];   // what the plants said this session (for the tests)
// a purchase in the tackle shop
function folkShop(){
  const F = folkState(); F.shop.n++;
  if (F.shop.n === 5) msg(FOLK_NAMES.shop + ' i butikken', 'Du er her så ofte at kaffen er på meg. Sett deg ned en stund.', 'You’re here so often the coffee is on me. Sit down for a while.');
  if (F.shop.n === 15) msg(FOLK_NAMES.shop + ' i butikken', 'Faste kunder får 10 % på isen hos meg. Du har fortjent det.', 'Regular customers get 10 % off the ice with me. You’ve earned it.');
}
const folkIce = () => (S.folk && S.folk.shop && S.folk.shop.n >= 15) ? 0.9 : 1;
// in the home harbour, the first time each day between 08 and 20: Edvard's word
function folkPort(H){
  const F = folkState(), E = F.edvard, b = S.boat, home = S.home || HOME0, day = Math.floor(H / 24), hr = gDate(H).getUTCHours();
  if (b.status !== 'port' || b.port !== home || hr < 8 || hr >= 20 || E.last === day || (S.tut && S.tut.v)) return null;
  E.last = day; const pt = portById(home), hn = pt ? pt.name : '';
  let l;
  if (!E.met){ E.met = S.t; l = EDVARD.first; }
  else {
    const T = (S.trophies || []).filter(t => t.t > (E.bigSeen || 0) && !t.crew).sort((a, b2) => b2.kg - a.kg)[0];
    const N = S.notes, open = N && N.marks ? N.marks.filter(m => !N.found[m.id]) : [];
    if (T){ E.bigSeen = S.t; l = EDVARD.big(T); }
    else if (open.length && h2(day, 8811) < 0.4) l = EDVARD.hint(open[Math.floor(h2(day, 8812) * open.length)], hn);
    else { const free = EDVARD.lines.map((x, i) => i).filter(i => !E.seen.includes(i)); const i = free.length ? free[Math.floor(h2(day, 8813) * free.length)] : Math.floor(h2(day, 8814) * EDVARD.lines.length);
      E.seen.push(i); if (E.seen.length > 5) E.seen.shift(); l = EDVARD.lines[i]; }
  }
  E.said = {t:S.t, no:l[0], en:l[1]};
  msg('Edvard', l[0], l[1]);
  return l;
}
