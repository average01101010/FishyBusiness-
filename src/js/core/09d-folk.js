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
// a purchase in the tackle shop
function folkShop(){
  const F = folkState(); F.shop.n++;
  if (F.shop.n === 5) msg(FOLK_NAMES.shop + ' i butikken', 'Du er her så ofte at kaffen er på meg. Sett deg ned en stund.', 'You’re here so often the coffee is on me. Sit down for a while.');
  if (F.shop.n === 15) msg(FOLK_NAMES.shop + ' i butikken', 'Faste kunder får 10 % på isen hos meg. Du har fortjent det.', 'Regular customers get 10 % off the ice with me. You’ve earned it.');
}
const folkIce = () => (S.folk && S.folk.shop && S.folk.shop.n >= 15) ? 0.9 : 1;
// in the home harbour, the first time each day between 08 and 20: Edvard's word
function folkPort(H){
  const F = folkState(), E = F.edvard, b = S.boat, home = S.home || 'finnsnes', day = Math.floor(H / 24), hr = gDate(H).getUTCHours();
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
