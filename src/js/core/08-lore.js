// ===== the old ways at sea: superstition as lore =====
// Fishermen along the coast were superstitious, and the game lets the crew, the quay and the pub tell of it. It is lore only: no
// effect on the catch, the weather or the crew's mood. Sources (checked 29.09.2026): Store norske leksikon (noaord, draug),
// Redningsselskapet «Ikke ta med brunost på havet!», Båtmagasinet «Om tro og overtro til sjøs», Norsk Fisk «Overtro»,
// NRK on the mast coin, and forum talk on renaming boats (weak). What you have heard is kept in S.lore and shown in the Seaman app.
const LORE = {
  noaord:{t:['Noaord', 'Noa words'], x:['På sjøen og på feltet brukte fiskerne andre ord for det som var farlig å nevne. Kirka ble «høghus» og presten «svartkjole», og hest og gris var det best å ikke snakke om i det hele tatt. Man trodde havets makter ikke tålte å høre folks vanlige språk.', 'At sea and on the grounds fishermen used other words for what was dangerous to name. The church became the «high house» and the priest the «black gown», and horses and pigs were best not mentioned at all. The powers of the sea were thought not to bear ordinary speech.']},
  plystre:{t:['Ikke plystre om bord', 'No whistling aboard'], x:['Den som plystrer om bord, plystrer opp vind og storm.', 'Whoever whistles aboard whistles up wind and storm.']},
  fredag:{t:['Aldri ut på en fredag', 'Never sail on a Friday'], x:['Det var gammel sjømannstro at det brakte ulykke å legge ut på en fredag.', 'Old seafarers held that it was unlucky to set out on a Friday.']},
  lykke:{t:['Ikke ønsk god tur', 'Do not wish a good trip'], x:['En fisker skulle ikke ønskes god tur eller god fangst. Det kunne ødelegge fiskelykka.', 'A fisherman was not to be wished a good trip or a good catch. It could spoil his luck.']},
  snu:{t:['Den som snur', 'Turning back'], x:['Å snu på vei ut og gå hjem igjen ble regnet som dårlig fiskelykke.', 'Turning back on the way out and going home was reckoned bad fishing luck.']},
  prest:{t:['Presten på veien', 'The priest on the road'], x:['Møtte man presten på vei til sjøen, kunne man like godt snu og gå hjem igjen.', 'If you met the priest on the way to the boat, you might as well turn round and go home.']},
  mat:{t:['Brunost, vafler og bananer', 'Brown cheese, waffles and bananas'], x:['Noe mat skulle ikke med om bord. Brunost, vafler, flatbrød og bananer ble regnet som ulykkesmat på sjøen.', 'Some food was not to come aboard. Brown cheese, waffles, flatbread and bananas were reckoned unlucky at sea.']},
  kost:{t:['Kosten og bøtta', 'The broom and the bucket'], x:['Mistet man kosten eller bøtta over bord, var det et dårlig varsel.', 'Losing the broom or the bucket overboard was a bad sign.']},
  mastemynt:{t:['Mastemynten', 'The mast coin'], x:['Når en båt ble bygget, la man gjerne en mynt under masta for lykke og god ferd. Skikken er kjent fra romertida, og det var ofte rederen eller skipperen som la den.', 'When a boat was built, a coin was often laid under the mast for luck and a safe voyage. The custom is known from Roman times, and it was often the owner or the skipper who laid it.']},
  omdoping:{t:['Å døpe om en båt', 'Renaming a boat'], x:['Mange mener det bringer ulykke å gi en båt nytt navn. Noen gjør det ikke uten en ordentlig båtdåp.', 'Many hold that it brings bad luck to give a boat a new name. Some will not do it without a proper christening.']},
  draugen:{t:['Draugen', 'The draug'], x:['Draugen er en gjenganger fra nordnorsk folketro: en fisker som druknet og ikke fikk kristen grav. Han seiler i en halv båt, ofte med tang til hode, og den som så ham, fikk varsel om død. Fiskerne tok heller ikke gjerne en tangstein som ballast.', 'The draug is a revenant of northern Norwegian folk belief: a fisherman who drowned and was never buried in Christian ground. He sails half a boat, often with seaweed for a head, and whoever saw him had a warning of death. Fishermen did not like to take a seaweed-covered stone as ballast either.']},
  kvinner:{t:['Kvinner om bord', 'Women aboard'], x:['Før i tida mente mange at kvinner om bord brakte ulykke. I dag er det kvinner i fiskeflåten langs hele kysten, og de fleste ler av den gamle troen.', 'Many used to hold that women aboard brought bad luck. Today there are women in the fishing fleet all along the coast, and most laugh at the old belief.']}
};
// who tells it: the oldest hand aboard where you are, or someone on the quay
function loreTeller(){ const c = meAboard() ? crewAboard().slice().sort((a, b) => b.age - a.age)[0] : null; return c || null; }
// tell a piece of lore: a message and a line in the deck log; the first time it is kept for the Seaman app
function hearLore(id, from, no, en){
  if (!LORE[id]) return false; S.lore = S.lore || {}; const L0 = S.lore[id], now = S.t;
  if (L0 && typeof L0 === 'object' && now - L0.last < 3 * 1440) return false;   // not the same story every day
  S.lore[id] = {first:L0 ? L0.first : now, last:now};
  msg(from, no, en); log(no, en);
  return true;
}
// the moments that bring it up
function loreDepart(){
  if (!meAboard()) return;
  const H = S.t / 60, d = gDate(H), c = loreTeller(), nm = c ? c.name.split(' ')[0] : null, r = Math.random();
  if (d.getUTCDay() === 5 && (!S.lore || !S.lore.fredag || r < 0.3)){ if (c) hearLore('fredag', c.name, nm + ' mumlet noe om at de gamle aldri gikk ut på en fredag.', nm + ' muttered that the old-timers never set out on a Friday.'); else hearLore('fredag', 'Kaia', 'En gammel kar på kaia ristet på hodet: – Ut på en fredag, du?', 'An old man on the quay shook his head: – Out on a Friday, are you?'); return; }
  if (r < 0.04){ hearLore('prest', c ? c.name : 'Kaia', 'Du møtte presten på vei ned til båten.' + (c ? ' ' + nm + ' sa ingenting, men så lenge på deg.' : ' Før i tida hadde folk snudd hjem for mindre.'), 'You met the priest on the way down to the boat.' + (c ? ' ' + nm + ' said nothing, but gave you a long look.' : ' In the old days people turned home for less.')); return; }
  if (r < 0.12) hearLore('lykke', 'Kaia', 'En kar på kaia løftet bare hånda da dere kastet loss. God tur ønsker man ikke en fisker.', 'A man on the quay just raised a hand as you cast off. You do not wish a fisherman a good trip.');
}
function loreTurnBack(){ const c = loreTeller(); if (c && Math.random() < 0.6) hearLore('snu', c.name, c.name.split(' ')[0] + ': – Snur vi? Det sa de gamle at var dårlig fiskelykke.', c.name.split(' ')[0] + ': – Turning back? The old-timers said that was bad luck for the fishing.'); }
function loreWater(){ const c = loreTeller(); if (c && Math.random() < 0.5) hearLore('kost', c.name, 'Bøtta gikk over bord med sjøen. ' + c.name.split(' ')[0] + ' ristet på hodet: det er ikke noe godt tegn.', 'The bucket went over the side with the sea. ' + c.name.split(' ')[0] + ': that is not a good sign.'); }
function loreRename(nm){ const c = loreTeller(); hearLore('omdoping', c ? c.name : 'Kaia', (c ? c.name.split(' ')[0] + ': – ' : 'Folk på kaia prater: ') + 'Nytt navn på båten? Det skal visst bringe ulykke uten en ordentlig båtdåp. Vi får skåle for «' + nm + '».', (c ? c.name.split(' ')[0] + ': – ' : 'Talk on the quay: ') + 'A new name for the boat? That is meant to be bad luck without a proper christening. We had better drink to the «' + nm + '».'); }
function loreNewBoat(nm){ hearLore('mastemynt', 'Verftet', 'Vi la en mynt under masta på «' + nm + '», som skikken er. God vind.', 'We laid a coin under the mast of the «' + nm + '», as the custom is. Fair winds.'); }
// an hour at sea with crew: now and then someone brings up the old ways
function loreHour(){
  const b = S.boat; if (!meAboard() || b.status === 'port' || Math.random() > 0.03) return;
  const cr = crewAboard(); if (!cr.length) return;
  const H = S.t / 60, old = cr.slice().sort((a, c) => c.age - a.age)[0], young = cr.slice().sort((a, c) => a.age - c.age)[0], on = old.name.split(' ')[0], yn = young.name.split(' ')[0];
  const night = sunAt(H).el < -4, dim = visibility(H) < 6;
  if (night && dim && Math.random() < 0.35){ hearLore('draugen', old.name, on + ' stirret ut i mørket og ble stille lenge. – Trodde jeg så en halv båt der ute.', on + ' stared out into the dark and went quiet for a long time. – Thought I saw half a boat out there.'); return; }
  const pick = ['plystre', 'noaord', 'mat'][Math.floor(Math.random() * 3)];
  if (pick === 'plystre') hearLore('plystre', old.name, young !== old ? yn + ' begynte å plystre. ' + on + ': – Ikke plystre om bord. Du plystrer opp storm.' : on + ' ba deg slutte å plystre: – Du plystrer opp storm.', young !== old ? yn + ' started whistling. ' + on + ': – No whistling aboard. You will whistle up a storm.' : on + ' asked you to stop whistling: – You will whistle up a storm.');
  else if (pick === 'noaord') hearLore('noaord', old.name, on + ': – Vi får gå innom høghuset på søndag. På sjøen sier man ikke kirke, og presten er svartkjole.', on + ': – We had better look in at the high house on Sunday. At sea you do not say church, and the priest is the black gown.');
  else hearLore('mat', old.name, on + ' fant vafler i matkassa og kikket på deg: – Hvem tok med vafler om bord?', on + ' found waffles in the food box and looked at you: – Who brought waffles aboard?');
}
// a story at the pub, instead of an empty evening
function lorePub(){
  const pool = ['draugen', 'kvinner', 'noaord', 'plystre', 'prest', 'mat', 'mastemynt'].filter(id => !(S.lore && S.lore[id]));
  const id = pool.length ? pool[Math.floor(Math.random() * pool.length)] : null; if (!id) return null;
  const T = {draugen:['En gammel fisker fortalte om draugen, han med tang til hode som seiler en halv båt. Den som ser ham, får varsel om død.', 'An old fisherman told of the draug, with seaweed for a head, who sails half a boat. Whoever sees him has a warning of death.'],
    kvinner:['En gammel kar i hjørnet mente at kvinner om bord bringer ulykke. Resten av puben lo ham ut.', 'An old man in the corner held that women aboard bring bad luck. The rest of the pub laughed him down.'],
    noaord:['Ved bardisken lærte du noaordene: høghus for kirke, svartkjole for prest, og hest og gris nevner man ikke på sjøen.', 'At the bar you learnt the noa words: high house for church, black gown for priest, and horses and pigs are not named at sea.'],
    plystre:['Noen plystret en slager. – Ikke gjør det på sjøen, sa bartenderen. Da plystrer du opp storm.', 'Someone whistled a tune. – Not at sea, said the barman. You will whistle up a storm.'],
    prest:['De gamle snudde hjem om de møtte presten på vei til sjøen, fortalte en av karene.', 'The old-timers turned home if they met the priest on the way to sea, one of the men told you.'],
    mat:['– Brunost og vafler har ingenting om bord å gjøre, sa en skipper, og bananer i hvert fall ikke.', '– Brown cheese and waffles have no business aboard, said a skipper, and bananas least of all.'],
    mastemynt:['En båtbygger fortalte om mynten han alltid la under masta på nye båter, for lykke og god ferd.', 'A boatbuilder told of the coin he always laid under the mast of a new boat, for luck and a safe voyage.']}[id];
  hearLore(id, 'Puben', T[0], T[1]); return T;
}
