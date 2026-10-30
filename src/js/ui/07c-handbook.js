// ===== Håndboka: chapters 2–6 of the on-boarding as drips, and the app that keeps every tip (docs/onboarding.md 3–4, Jonas 09–10.10.2026) =====
// A drip is one tip, shown the first time something happens after the first trip: the guide's own box, pointing at the button when
// there is one, with «Skjønner» and «Jeg kan dette» (which puts the rest of its chapter to rest). Nothing stops the game, one drip
// at a time and at least a minute and a half between them, never in the first trip, in a window, in the book, in the jig game or in
// a room. What was skipped or never came stays in the Håndboka app with a dot, and «Vis meg» shows it again, pointing. A game that
// has landed five times when the book arrives has every chapter at rest from the start (the app has them all; nothing drips over an
// old hand). S.hb = {seen:{id:t}, skip:{ch:1}, cur, at}. Each drip sends hb {id, how} to the cloud (seen or skip), for the funnel.
const HB_CH = [[2, 'Tur 2 og 3', 'Trips 2 and 3'], [3, 'Kvelden og natta', 'The evening and the night'], [4, 'Rutinen', 'The routine'], [5, 'Utstyr og båt', 'Gear and boat'], [6, 'Sosialt og økonomi', 'Social and money'], [7, 'Økonomien', 'The money'], [8, 'Utstyr og redskap', 'Gear and equipment']];
const HB_GAP = 90000;   // real ms between two drips
function hbState(){
  if (!S.hb){ S.hb = {seen:{}, skip:{}, cur:null, at:0}; if ((S.landN || 0) >= 5) for (const [c] of HB_CH) S.hb.skip[c] = 1; }
  return S.hb;
}
const hbL = (no, en) => S.lang === 'no' ? no : en;
const hbPort = () => S.boat.status === 'port';
const hbSea = () => ['sailing', 'fishing', 'idle'].includes(S.boat.status);
const hbLand = () => S.landN || 0;
const hbTry = f => { try { return !!f(); } catch (e){ return false; } };
// at a place that offers this (core/06c-steder.js portServices): 'mottak', 'butikk', 'verft'; Father's naust is a home
const hbSvc = k => hbTry(() => hbPort() && berthKind(S.boat) !== 'naust' && portServices(portById(S.boat.port), berthKind(S.boat))[k]);
const hbDock = ids => inPlot() ? to3d() : {el:vis([].concat(ids).map(k => '#dock [data-dk=' + k + ']'))};
// the tips: id, chapter, a short name, the text, when it drips (first time true), and where it points while shown
const HB = [
  // 2: trips 2 and 3, the same day
  // what the first trip used to teach on the way home and at the plant (Onboarding 2, O4): each drips when it matters. The ice first: the
  // task the first trip leaves open (the first fill is on the plant, S.iceFree)
  {id:'is', ch:2, t:['Is før turen', 'Ice before the trip'], when:() => hbPort() && hbLand() >= 1 && S.boat.ice < 50 && hbSvc('mottak'), show:() => dockApp('marked', 'is', 'is', '#drawerBody [data-pa=shop][data-k=ice][data-fill]'),
    no:'Is holder fisken fersk og gir bedre pris. Fyll iskassa før du går ut: Mottak, så Is. Den første fyllingen tar mottaket.', en:'Ice keeps the fish fresh and gets a better price. Fill the ice box before you go out: Plant, then Ice. The plant covers the first fill.'},
  {id:'bok', ch:2, t:['Dekksdagboka', 'The deck log'], when:() => hbLand() >= 1 && !hbSea(), show:() => ({el:vis('#logbook')}),
    no:'Dekksdagboka: alt som skjer om bord skrives her, med fangst, salg, sesonger og utstyr. Første tur står der alt.', en:'The deck log: everything that happens aboard is written here, with catches, sales, seasons and gear. The first trip is in it already.'},
  {id:'status', ch:2, t:['Statusboksen', 'The status box'], when:() => hbLand() >= 1 && hbSea(), show:() => ({el:vis('#hud')}),
    no:'Statusboksen: klokka og dagen, hva båten gjør, pengene, drivstoffet, lasten og energien din. «–» gjør den til en tynn stripe, «+» åpner den igjen.', en:'The status box: the clock and the day, what the boat is doing, your money, the fuel, the hold and your energy. «–» folds it to a thin strip, «+» opens it again.'},
  {id:'beh', ch:2, t:['Beholdning', 'The inventory'], when:() => hbPort() && hbLand() >= 1, show:() => hbDock('beh'),
    no:'Beholdning: lasterommet, isen, drivstoffet og redskapet. Her ser du hva du har med deg før du går ut.', en:'The inventory: the hold, the ice, the diesel and the gear. Here you see what you have with you before you go out.'},
  {id:'rute', ch:2, t:['Egen rute', 'Your own route'], when:() => inPlot() && hbPort() && !S.plan && hbLand() >= 1,
    no:'Tur 2 er din egen. Trykk i kartet der du vil fiske, så legger rutepunktene seg etter hverandre, og kurslista under viser kurs, distanse og tid for hver etappe. Autonav finner leia for deg om du vil.',
    en:'Trip 2 is your own. Tap the chart where you want to fish and the waypoints line up, and the course list below shows course, distance and time for each leg. Autonav finds the fairway for you if you like.'},
  {id:'guide', ch:2, t:['Fiskeguiden', 'The fish guide'], when:() => hbLand() >= 1 && (hbSea() || hbPort()), show:() => phoneApp('guide'),
    no:'Fiskeguiden viser hvor hver art står, på hvilket dyp og når på året. Se i den før du velger felt.', en:'The fish guide shows where each species stands, at what depth and when in the year. Look there before you choose a ground.'},
  // the luck, out of the first trip (Onboarding 2, O3, V1 A): the first time the boat fishes after the first landing
  {id:'lykke', ch:2, t:['Fiskelykke og haill', 'Luck and haill'], when:() => hbLand() >= 1 && S.boat.status === 'fishing', show:() => phoneApp('haill'),
    no:'Hvor mye som biter, kommer an på hvor tett fisken står, redskapet, været, årstida og fiskelykka. Fiskerne langs kysten har alltid hatt troen på haill, lykke på havet. En haill gir mer fiskelykke en stund, og den ser du i Haill-appen.',
    en:'How much bites depends on how dense the fish stand, the gear, the weather, the season and your luck. Fishermen along the coast have always believed in haill, luck at sea. A haill gives more luck for a while, and you find it in the Luck app.'},
  {id:'ekko', ch:2, t:['Ekkoloddet', 'The echo sounder'], when:() => inPlot() && hbSea(), show:() => ({el:vis('#heatBox [data-hm]')}),
    no:'Ekkoloddet viser fisken under båten. Trykk på arten for å bytte hva det leter etter.', en:'The echo sounder shows the fish under the boat. Tap the species to change what it looks for.'},
  {id:'tide', ch:2, t:['Flo og fjære', 'The tide'], when:() => inPlot() && hbLand() >= 1, show:() => ({el:vis('#ecTide')}),
    no:'Flo og fjære står her, for stedet båten er. Grunne sund og fjæra ved kaia følger tidevannet.', en:'The tide stands here, for where the boat is. Shallow sounds and the shore by the quay follow it.'},
  {id:'regler', ch:2, t:['Kan jeg fiske her?', 'May I fish here?'], when:() => hbSea() && hbLand() >= 2, show:() => phoneApp('regler'),
    no:'«Kan jeg fiske her?» i Regler-appen svarer for stedet båten er: fjordlinjer, stengte felt og minstemål, med kilden.', en:'«May I fish here?» in the Rules app answers for where the boat is: fjord lines, closed areas and minimum sizes, with the source.'},
  {id:'sesong', ch:2, t:['Sesongen', 'The season'], when:() => hbLand() >= 2, show:() => phoneApp('sesong'),
    no:'Sesong-appen forteller hva som skjer på kysten nå, og når skreien kommer.', en:'The Season app tells what is happening on the coast now, and when the skrei comes.'},
  {id:'post', ch:2, t:['Kystposten', 'The Coast Post'], when:() => hbLand() >= 1 && hbTry(() => pressUnread() > 0), show:() => phoneApp('post'),
    no:'Kystposten kommer med saker fra hele kysten: rekordpriser, de største landingene og årets første skrei.', en:'The Coast Post brings stories from the whole coast: record prices, the biggest landings and the first skrei of the year.'},
  {id:'meld', ch:2, t:['Meldinger', 'Messages'], when:() => hbLand() >= 1 && S.msgs.length > 0, show:() => phoneApp('meld'),
    no:'Meldinger fra mottaket, Salgslaget og folk langs kysten havner her.', en:'Messages from the plant, the sales organisation and people along the coast land here.'},
  // 3: the evening and the night
  {id:'mannskap', ch:3, t:['Mannskap', 'Crew'], when:() => hbLand() >= 1 && !S.crew.length && BOAT.crewMax > 0 && (deckPending() > tubCap() * 0.5 || hbLand() >= 2), show:() => dockApp('bygd', 'mannskap', 'mannskap', null),
    no:'Fisken hoper seg opp på dekk? Med en mann til går sløyinga dobbelt så fort. Mannskap får lott, en del av fangsten, så det koster ingenting før du leverer. Se Bygd, så Ansatte.', en:'Fish piling up on deck? With one more hand the gutting goes twice as fast. The crew gets a share of the catch, so it costs nothing until you land. See Village, then Employees.'},
  {id:'vaer', ch:3, t:['Været', 'The weather'], when:() => hbLand() >= 1 && hbTry(() => hsAt(S.boat.pos, S.t / 60) > (VESSELS[S.boat.type] || VESSELS.skiff).risk[0] * 0.8), show:() => phoneApp('vaer'),
    no:'Sjøen øker. Vær-appen har varselet for to døgn, farget etter hva båten din tåler. Blir det rødt, snur båten av seg selv eller blir liggende ved kai.', en:'The sea is building. The Weather app has the forecast for two days, coloured for what your boat can take. When it turns red, the boat turns back on her own or stays at the quay.'},
  {id:'redning', ch:3, t:['Redning', 'Rescue'], when:() => S.boat.status === 'engine', show:() => phoneApp('redning'),
    no:'Motoren har stoppet. Starter den ikke igjen, eller går du på grunn, ber du om hjelp i Redning-appen. Første gang er gratis.', en:'The engine has stopped. If it does not start again, or you run aground, you ask for help in the Rescue app. The first time is free.'},
  {id:'energi', ch:3, t:['Hvile', 'Rest'], when:() => typeof S.energy === 'number' && S.energy < 45 && hbPort(), show:() => hbDock('rest'),
    no:'Du er trøtt. Sov i naustet eller rorbua, så er du uthvilt til morgenturen. En trøtt skipper jobber saktere og døser på vakt.', en:'You are tired. Sleep in the boathouse or the rorbu and you are rested for the morning trip. A tired skipper works slower and dozes on watch.'},
  {id:'kulde', ch:3, t:['Kulda', 'The cold'], when:() => hbSea() && hbTry(() => airTemp(S.t / 60, S.boat.pos) < 0),
    no:'Under null fryser fingrene: sløying og egning går saktere, og kulda står i statusboksen. Klær fra utstyrsbutikken hjelper.', en:'Below zero the fingers freeze: gutting and baiting go slower, and the cold stands in the status box. Clothing from the tackle shop helps.'},
  {id:'diesel', ch:3, t:['Diesel', 'Diesel'], when:() => S.boat.fuel < 0.3 * ((typeof BOAT !== 'undefined' && (BOAT.fuel || BOAT.tank)) || 60),
    no:'Tanken er under en tredel. Diesel fylles på bunkerskaia ved mottak og verft, under Bunkers i menyen. Tom tank, og båten driver.', en:'The tank is under a third. Diesel is filled at the bunker quay at plants and yards, under Bunkers in the menu. An empty tank, and the boat drifts.'},
  {id:'rorbu', ch:3, t:['Rorbua', 'The rorbu'], when:() => hbPort() && hbTry(() => portById(S.boat.port).rorbu && dist(S.boat.pos, portById(S.home || HOME0).p) > 30), show:() => hbDock('rest'),
    no:'Langt hjemmefra kan du leie rorbu for natta: hvil der, så ligger båten trygt ved kaia til i morgen.', en:'Far from home you can rent a rorbu for the night: rest there, and the boat lies safe at the quay until morning.'},
  // 4: the routine, after the third landing
  {id:'drift', ch:4, t:['Driftsplanen', 'The operations plan'], when:() => hbLand() >= 3 && S.crew.length > 0, show:() => phoneApp('drift'),
    no:'Driftsplanen lar båten fiske, levere og hvile på egen hånd, også når spillet er lukket: velg hjem, redskap, plasser, vær og rytme, og trykk Start. Uten deg om bord trenger den en skipper og en styrmann.', en:'The operations plan lets the boat fish, land and rest on her own, also while the game is closed: choose home, gear, places, weather and rhythm, and tap Start. Without you aboard it needs a skipper and a mate.'},
  {id:'topp', ch:4, t:['Salgslaget og topplista', 'Sales and the top list'], when:() => hbLand() >= 1 && hbPort(),   // right after the first landing (Onboarding 2, O4: the others on the coast)
 show:() => phoneApp('salg'),
    no:'Salgslaget viser prisene i dag, det du har levert, og topplista over kysten denne uka.', en:'The sales organisation shows today’s prices, what you have landed, and the week’s top list along the coast.'},
  {id:'merker', ch:4, t:['Milepæler', 'Milestones'], when:() => hbLand() >= 3, show:() => phoneApp('merker'),
    no:'Milepæler samler alt du har oppnådd, og hvert merke gir en gave fra noen på kysten.', en:'Milestones gather everything you have achieved, and each badge gives a gift from someone on the coast.'},
  {id:'tilbake', ch:4, t:['Si fra', 'Speak up'], when:() => hbLand() >= 3, show:() => phoneApp('tilbake'),
    no:'Noe rart? Si fra i Tilbakemelding, det er lov å være ærlig. Nyttige meldinger takkes med en haill.', en:'Something odd? Say so in Feedback; honesty is welcome. Useful reports are thanked with a luck.'},
  {id:'patch', ch:4, t:['Patchnotes', 'Patch notes'], when:() => hbLand() >= 4, show:() => phoneApp('patch'),
    no:'Patchnotes forteller hva som er nytt i spillet. Prikken på appen betyr at noe er kommet.', en:'Patch notes tell what is new in the game. The dot on the app means something has arrived.'},
  // 5: gear and boat, the first week
  {id:'oppdrag', ch:5, t:['Oppdrag', 'Orders'], when:() => (hbLand() >= 4 && hbTry(() => ordState().offers.length > 0)) || hbTry(() => S.turer.board.some(m => m.first) || S.turer.act.some(m => m.first)), show:() => phoneApp('ordl'),
    no:'Oppdragstavla: turer med god betaling ut fra der du er. Det første ligger klart: litt post til nabohavna, uten hast. Lang tur, god lønn. Med trim går båten fortere, så turen tar kortere tid.', en:'The order board: well-paid trips from where you are. The first lies ready: a little mail for the next harbour, no hurry. Long trip, good pay. With tuning the boat goes faster, so the trip takes less time.'},
  {id:'butikk', ch:5, t:['Utstyrsbutikken', 'The tackle shop'], when:() => hbSvc('butikk'), show:() => hbDock(['butikk', 'fiskeutstyr']),
    no:'Utstyrsbutikken: line, garn og teiner trenger hver sin haler, og kroker, blåser og agn hører til redskapet. Det som ikke passer båten, kan du ikke kjøpe.', en:'The tackle shop: lines, nets and pots each need their hauler, and hooks, floats and bait belong to the gear. What does not fit the boat cannot be bought.'},
  {id:'nett', ch:5, t:['Nettet', 'The Net'], when:() => hbLand() >= 2 && !hbSvc('butikk'), show:() => phoneApp('nett'),
    no:'Nettet på telefonen har nettbutikken til utstyrsbutikkene langs kysten. Bestill det du trenger hvor du er, så ligger det klart i butikken du velger. Du betaler og får det montert når du henter.', en:'The Net on the phone has the web shop of the tackle shops along the coast. Order what you need wherever you are, and it is ready at the shop you choose. You pay and have it fitted when you fetch it.'},
  {id:'verft', ch:5, t:['Verftet', 'The yard'], when:() => hbSvc('verft'), show:() => hbDock(['vedlikehold', 'oppgr', 'batmarked']),
    no:'Verftet: vedlikehold, begroing på skroget, maling og større båter. Jobbene tar ekte tid, og båten ligger der imens.', en:'The yard: maintenance, fouling on the hull, paint and bigger boats. The jobs take real time, and the boat lies there meanwhile.'},
  {id:'neste', ch:5, t:['Neste båt', 'The next boat'], when:() => S.cash >= 150000, show:() => phoneApp('fartoy'),
    no:'Neste båt: Båthandelen på verftet viser hva du har råd til, og hva som følger med av lasterom, køyer og mannskap.', en:'The next boat: the boat dealer at the yard shows what you can afford, and what comes with it in hold, bunks and crew.'},
  // 6: social and money
  {id:'venner', ch:6, t:['Venner', 'Friends'], when:() => hbLand() >= 3 && typeof isGuest === 'function' && !isGuest(), show:() => phoneApp('folk'),
    no:'Venner: del fiskeposisjoner og fangstmerker, og se hvor de er på kysten.', en:'Friends: share fishing positions and catch marks, and see where they are on the coast.'},
  {id:'ais', ch:6, t:['Andre båter', 'Other boats'], when:() => hbLand() >= 4 && hbSea(),
    no:'Båtene rundt deg i kartplotteren er ekte spillere og kystflåten. Trykk på en for å se hvem det er.', en:'The boats around you in the chart plotter are real players and the coastal fleet. Tap one to see who it is.'},
  {id:'pub', ch:6, t:['Puben', 'The pub'], when:() => hbPort() && !!document.querySelector('#dock [data-dk=pub]'), show:() => hbDock('pub'),
    no:'På puben treffer du folk, kjentmannen selger rapporten sin, og du kan spandere en runde på mannskapet.', en:'At the pub you meet people, the old hand sells his report, and you can stand the crew a round.'},
  {id:'rederi', ch:6, t:['Rederiet', 'The company'], when:() => S.cash >= 50000 && hbLand() >= 4, show:() => phoneApp('rederi'),
    no:'Rederi-appen: hele flåten på én skjerm, med papirene og årets regnskap. Den åpnes når du har mannskap, flere båter eller et AS. Over 50 000 kr i omsetning blir du enkeltpersonforetak med MVA.', en:'The Company app: the whole fleet on one screen, with the papers and the year\'s accounts. It opens when you have crew, more vessels or a company. Past NOK 50,000 in turnover you become a sole proprietorship with VAT.'},
  {id:'kvote', ch:6, t:['Kvoten', 'The quota'], when:() => hbLand() >= 4, show:() => phoneApp('kvote'),
    no:'Kvote: åpen gruppe har sin egen torskekvote per fartøy, og ferskfiskordningen gir tillegg om høsten.', en:'Quota: the open group has its own cod quota per vessel, and the fresh-fish scheme gives a bonus in the autumn.'},
  // 7: the money (Økonomi 2, Ø5, Jonas 27.10.2026: «legg gjerne til en økonomi-del i håndboka-appen»), each the first time it happens
  {id:'okseddel', ch:7, t:['Sluttseddelen', 'The landing note'], when:() => hbLand() >= 1 && !!(S.lastSale && S.lastSale.tk),
    no:'Sluttseddelen: fangstverdien, så Råfisklagets trekk (rundt 4 %: lagsavgift, pensjon, produktavgift, forskning og ressursavgift). Det som er igjen, er ditt, minus mannskapets lott.', en:'The landing note: the catch value, then the sales organisation\'s levies (about 4 %: its levy, pension, product, research and resource levies). What is left is yours, less the crew\'s shares.'},
  {id:'oklott', ch:7, t:['Lotten', 'The shares'], when:() => !!(S.lastSale && S.lastSale.ls && S.lastSale.ls.per && S.lastSale.ls.per.length),
    no:'Lotten: fra netto trekkes turens felleskostnader: drivstoff, is, agn og egning, havneavgift, juksautstyr og tapt redskap. Det som er igjen, delingsfangsten, deles mellom båten og mannskapet etter oppgjørsavtalene i Norges Fiskarlag: etter fisket, båtens lengde og hvor mange som er om bord, og på juksa etter antall juksamaskiner. En mann har 1 lott, en lærling 40–75 %. Din egen lott og båtens del blir i kassa, og rederiet betaler skippertillegget når du er i land.', en:'The shares: the trip\'s common costs come off the net: fuel, ice, bait and baiting, harbour dues, jig tackle and gear lost. What is left, the shared catch, is split between the boat and the crew by the settlement agreements of Norges Fiskarlag: by the fishery, the length and how many are aboard, and on the jig by the jigging machines. A hand has 1 share, an apprentice 40-75 %. Your own share and the boat\'s part stay in the cash box, and the company pays the skipper\'s extra while you are ashore.'},
  {id:'okmva', ch:7, t:['MVA', 'VAT'], when:() => !!S.mva,
    no:'MVA: når salget har passert 50 000 kr på tolv måneder, er fisket et enkeltpersonforetak i Merverdiavgiftsregisteret. Råfisklaget legger 11,11 % MVA på oppgjøret, og du betaler den samme summen videre til staten. Den står på sluttseddelen, men koster deg ingenting.', en:'VAT: once the sales pass NOK 50,000 in twelve months, the fishing is a sole proprietorship in the VAT register. The sales organisation adds 11.11 % VAT to the settlement, and you pass the same sum on to the state. It stands on the note, but costs you nothing.'},
  {id:'okskatt', ch:7, t:['Skatten', 'The tax'], when:() => hbTry(() => taxOwed() > 0), show:() => hbDock('bank'),
    no:'Skatten: som enkeltpersonforetak er overskuddet din inntekt. Forskuddsskatten betales 15. mars, juni, september og desember, og skatteoppgjøret kommer i juni året etter. Med minst 130 dager på fiske får du fiskerfradrag: 30 % av overskuddet, høyst 160 000 kr. Hver dag du selv er ute med båten, teller.', en:'The tax: as a sole proprietor the profit is your income. The advance tax is paid 15 March, June, September and December, and the settlement comes in June the year after. With at least 130 days fishing you get the fisherman\'s deduction: 30 % of the profit, at most NOK 160,000. Every day you are out in the boat yourself counts.'},
  {id:'okskattekonto', ch:7, t:['Skattekontoen', 'The tax account'], when:() => !!(S.bank && S.bank.skatt >= 1), show:() => hbDock('bank'),
    no:'Skattekontoen: etter hver levering setter banken av det skatten på årets overskudd blir. Terminene betales derfra først, så skatten aldri kommer som en overraskelse. Du kan velge en fast prosent i stedet.', en:'The tax account: after each landing the bank sets aside what the tax on the year\'s profit comes to. The terms are paid from it first, so the tax never comes as a surprise. You can pick a fixed share instead.'},
  {id:'okspare', ch:7, t:['Sparekontoen', 'The savings account'], when:() => hbLand() >= 6, show:() => hbDock('bank'),
    no:'Sparekontoen gir 3,5 % rente, og pengene der regnes som egenkapital når du kjøper neste båt. Du kan spare en fast del av hver levering.', en:'The savings account pays 3.5 % interest, and the money there counts as equity when you buy the next boat. You can save a fixed part of each landing.'},
  {id:'okkk', ch:7, t:['Kassekreditten', 'The overdraft'], when:() => S.cash < 0, show:() => hbDock('bank'),
    no:'Kassekreditten: kontoen kan gå i minus inntil rammen, 10 % av flåtens verdi og minst 20 000 kr, men det koster 10 % rente. Over rammen kan du ikke kjøpe noe.', en:'The overdraft: the account can go below zero to the limit, 10 % of the fleet\'s value and at least NOK 20,000, but it costs 10 % interest. Over the limit nothing can be bought.'},
  {id:'okregnskap', ch:7, t:['Regnskapet', 'The accounts'], when:() => hbLand() >= 5, show:() => hbDock('bank'),
    no:'Regnskapet i banken viser året: inntekter og kostnader per post, avskrivningen på båtene, resultatet før og etter skatt, og pengene som går utenom resultatet, som lån, avdrag og båtkjøp.', en:'The accounts in the bank show the year: income and costs by kind, the depreciation of the vessels, the result before and after tax, and the money outside the result, such as loans, instalments and vessels bought.'},
  // 8: gear and equipment, a reference (M1, 30.10.2026): the long explanations that stood on the shop's cards; never dripped (lex), opened from
  // a card's «Mer» with the search set to the title
  {id:'lex_juksa', ch:8, lex:true, t:['Juksa', 'The jig'], when:() => false,
    no:'Håndjuksa er snøre, søkke, pilk og markkroker på en rull ved ripa. Med den fisker du torsk, sei og hyse. Uten juksa kan du ikke fiske for hånd. En juksamaskin fisker omtrent dobbelt så mye som håndjuksa, og én person kan passe tre; med maskiner om bord passer du dem og jukser ikke selv. Hvor mange båten har plass til, står i databladet.',
    en:'The hand jig is line, sinker, pilk and fly hooks on a reel at the rail. It takes cod, saithe and haddock. Without a jig you cannot fish by hand. A jigging machine catches about twice as much as a hand jig, and one person can tend three; with machines aboard you tend them and do not jig by hand. How many the boat has room for is in the spec sheet.'},
  {id:'lex_kveiteutstyr', ch:8, lex:true, t:['Kveiteutstyr', 'Halibut gear'], when:() => false,
    no:'Kveiteutstyret er kveitepilk, kraftig snøre og gaff. Med kveitepilken tar juksa mest kveite og lite annet. Kveita er fredet fra 20. desember til og med 20. april. Reservesett av kveitepilk kjøpes i utstyrsbutikken når kveiteutstyret er om bord.',
    en:'The halibut gear is a halibut pilk, heavy line and a gaff. With the halibut pilk the jig takes mostly halibut and little else. Halibut is closed from 20 December to 20 April. Spare halibut pilks are sold at the tackle shop once the halibut gear is aboard.'},
  {id:'lex_garn', ch:8, lex:true, t:['Garn', 'Nets'], when:() => false,
    no:'Garn settes i lenker mellom to blåser. 156 mm er vanlig torskegarn, 180 og 200 mm tar større fisk som skrei. Flytegarn fisker høyere og tar mest sei. Blåkveitegarn (360 mm) tar blåkveite og kveite. Minste lovlige maskevidde nord for 62° N er 156 mm. Garn krever minst to om bord og en garnhaler, som passer båter fra 7,5 m. Garna slites ved hvert trekk og bøtes av mannskapet, på bøteriet eller i butikken.',
    en:'Nets are set in strings between two buoys. 156 mm is the usual cod net; 180 and 200 mm take bigger fish such as skrei. Floating nets fish higher and take mostly saithe. Greenland halibut nets (360 mm) take Greenland halibut and halibut. The smallest legal mesh north of 62° N is 156 mm. Nets need at least two aboard and a net hauler, which fits boats from 7.5 m. Nets wear with every haul and are mended by the crew, at the net loft or at the shop.'},
  {id:'lex_line', ch:8, lex:true, t:['Line', 'Line'], when:() => false,
    no:'Hyseline har rundt 600 kroker per stamp og tar mest hyse. Bankline har rundt 300 større kroker og tar lange, brosme, kveite og blåkveite. Lina egnes med det agnet du velger, i havn eller av mannskapet på sjøen, og trekkes med linehaler. Hyseline og bankline deler plassen om bord; line du ikke trenger, selger du tilbake under Service (uegnede stamper).',
    en:'Haddock line has about 600 hooks a tub and takes mostly haddock. Bank line has about 300 bigger hooks and takes ling, tusk, halibut and Greenland halibut. The line is baited with the bait you choose, in port or by the crew at sea, and hauled with a line hauler. Haddock line and bank line share the room aboard; line you do not need is sold back under Service (unbaited tubs).'},
  {id:'lex_teiner', ch:8, lex:true, t:['Teiner og kongekrabbe', 'Pots and king crab'], when:() => false,
    no:'Teinene er for kongekrabbe, som fiskes fritt vest for 26° Ø, men nesten bare finnes i Finnmark. Teinene er store og må trekkes med teinehaler. Det er høyst 30 per fartøy. Uten krabbekar lever krabben rundt et døgn i lasten, og død krabbe er verdiløs.',
    en:'The pots are for king crab, fished freely west of 26° E but found almost only in Finnmark. The pots are big and need a pot hauler. At most 30 a vessel. Without a crab tank a crab lives about a day in the hold, and a dead crab is worthless.'},
  {id:'lex_blaser', ch:8, lex:true, t:['Blåser og dregg', 'Buoys and anchors'], when:() => false,
    no:'Hvert sett i sjøen trenger et blåsesett: to blåser med stake, flagg og dregg. Tung dregg holder bedre i storm og strøm. Blåsesett og dregger kan ikke kjøpes i flere enn redskapet ditt kan bruke.',
    en:'Each set in the sea needs a buoy set: two buoys with pole, flag and anchor. A heavy anchor holds better in storm and current. Buoy sets and anchors cannot be bought in greater numbers than your gear can use.'},
  {id:'lex_kroker', ch:8, lex:true, t:['Kroker og juksasett', 'Hooks and jig sets'], when:() => false,
    no:'Ny line kommer komplett med kroker. Slitte eller bøyde kroker byttes mot kroker fra lageret, under Beholdning › Redskap, av mannskapet eller i butikken. Pilk og markkroker til juksa slites og byttes på samme måte, med reservesett fra butikken.',
    en:'New line comes complete with hooks. Worn or bent hooks are changed from the store, under Inventory › Gear, by the crew or at the shop. The jig\'s pilk and fly hooks wear and are changed the same way, with spare sets from the shop.'},
  {id:'lex_halere', ch:8, lex:true, t:['Halere', 'Haulers'], when:() => false,
    no:'Line, garn og teiner trekkes med hver sin haler. Uten haler trekkes garn og line for hånd og tar 2–2,5 ganger så lang tid, og teiner kan ikke trekkes for hånd. Linehaler og teinehaler passer alle båter, garnhaler båter fra 7,5 m. Når haleren er om bord, rigger du om mellom juksa, line, garn og teiner under Beholdning › Rigg.',
    en:'Line, nets and pots each have their own hauler. Without one, nets and line are hauled by hand and take 2–2.5 times as long, and pots cannot be hauled by hand. Line and pot haulers fit every boat, the net hauler boats from 7.5 m. Once the hauler is aboard you re-rig between jig, line, nets and pots under Inventory › Rig.'},
  {id:'lex_elektronikk', ch:8, lex:true, t:['Elektronikk', 'Electronics'], when:() => false,
    no:'Alle båter har GPS og et enkelt ekkolodd. CHIRP-ekkoloddet gir skarpere ekko og viser fisken rundt båten i kartet, og du kan velge art. Sonaren ser lenger, skiller torsk, hyse og sei og viser hvor stimene trekker; den passer båter fra 10 m. Kartplotteren gir dybdefarger og kurver, VHF-en kulingvarsel og nødanrop, AIS-en gjør at andre og redningstjenesten ser deg, og brovaktsalarmen vekker deg om du døser av ved roret. Radaren er en kuppel på styrhuset opp til 12 m eller en åpen antenne i masta fra 10 til 21 m.',
    en:'Every boat has GPS and a basic sounder. The CHIRP sounder gives sharper echoes and shows the fish around the boat on the chart, and you can pick the species. The sonar sees further, tells cod, haddock and saithe apart and shows where the schools are heading; it fits boats from 10 m. The chart plotter gives depth colours and contours, the VHF gale warnings and distress calls, the AIS lets others and the rescue service see you, and the watch alarm wakes you if you doze at the wheel. The radar is a dome on the wheelhouse up to 12 m or an open array on the mast from 10 to 21 m.'},
  {id:'lex_montering', ch:8, lex:true, t:['Montering', 'Fitting'], when:() => false,
    no:'Utstyr monteres i havn og tar en halvtime på verftet eller i butikken, og flere jobber går samtidig. Utstyret følger med om du bytter båt, bortsett fra motoren og utstyr som ikke passer den nye båten; det blir igjen på den gamle og betales ikke.',
    en:'Equipment is fitted in port and takes half an hour at the yard or the shop, and several jobs run side by side. The equipment moves with you if you change vessel, except the engine and equipment that does not suit the new vessel; that stays with the old one and is not paid for.'},
  {id:'lex_klaer', ch:8, lex:true, t:['Klær og kulde', 'Clothes and the cold'], when:() => false,
    no:'Kalde og våte hender fisker dårligere: under null går sløying, egning og fisket saktere, og kulda står i statusboksen. Alle om bord trenger sine egne klær. Oljehyre holder deg tørr, varmedressen holder varmen.',
    en:'Cold, wet hands fish worse: below zero gutting, baiting and the fishing go slower, and the cold stands in the status box. Everyone aboard needs their own clothes. Oilskins keep you dry, the thermal suit keeps you warm.'},
  {id:'lex_is', ch:8, lex:true, t:['Is', 'Ice'], when:() => false,
    no:'Is holder fisken fersk. Uten is faller kvaliteten fort, og mottaket betaler mindre. Du bruker rundt 0,3 kg is per kg fisk. Is selges fra isrenna på fiskemottakene, og første fylling etter første levering tar mottaket.',
    en:'Ice keeps the fish fresh. Without it the quality drops fast and the plant pays less. You use about 0.3 kg of ice per kg of fish. Ice is sold from the chute at the fish plants, and the plant covers the first fill after the first landing.'},
  {id:'lex_agn', ch:8, lex:true, t:['Agn', 'Bait'], when:() => false,
    no:'Agn selges på fiskemottaket. Agnet velges når stampene egnes, selv eller i egnebua, og når teinene settes. Sju slag, og hvert tar best på sine arter. Agnet kan tas av stampene igjen for å egne med et annet slag.',
    en:'Bait is sold at the fish plant. The bait is chosen when the tubs are baited, by the crew or at the baiting shed, and when the pots are set. Seven kinds, each best for its species. The bait can be taken off the tubs again to bait with another kind.'},
  {id:'lex_service', ch:8, lex:true, t:['Service i butikken', 'Service at the shop'], when:() => false,
    no:'Butikken reparerer line og teiner, bøter garn og bytter kroker på halve tiden av det mannskapet bruker, mot et gebyr. Den kjøper redskap tilbake til en firedel av nypris ganger standen, så det lønner seg aldri å kjøpe og selge. Hver reparasjon senker taket litt, så slitt redskap bør byttes ut.',
    en:'The shop mends line and pots, mends nets and changes hooks in half the time the crew takes, for a fee. It buys gear back at a quarter of the new price times its condition, so buying and selling never pays. Every repair lowers the ceiling a little, so worn gear should be replaced.'},
  {id:'okas', ch:7, t:['ENK eller AS', 'ENK or AS'], when:() => hbTry(() => S.form !== 'AS' && S.tx && txProfit(S.t / 60) > 500000), show:() => hbDock('bank'),
    no:'ENK eller AS: et aksjeselskap betaler 22 % av overskuddet, og alt blir i selskapet. Som ENK blir personskatten høyere enn det når overskuddet vokser. Skattekortet i banken regner ut begge.', en:'ENK or AS: a limited company pays 22 % of the profit, and it all stays in the company. As ENK the personal tax rises above that as the profit grows. The tax card in the bank reckons both.'}];
const hbById = id => HB.find(t => t.id === id);
// the drip to show now: the one under way, else the first whose moment has come
function hbPick(){
  if (typeof NOTUT !== 'undefined' && NOTUT && !/hb/.test(location.hash)) return null;   // the tests' games (#notut) get no tips over their buttons; #hb turns them on (hbtest)
  const H = hbState();
  if (H.cur){ const t = hbById(H.cur); if (t && (!H.seen[t.id] || H.force)) return t; H.cur = null; H.force = 0; }
  if (Date.now() - (H.at || 0) < HB_GAP) return null;
  const t = HB.find(x => !H.seen[x.id] && !H.skip[x.ch] && hbTry(x.when)); if (!t) return null;
  H.cur = t.id; H.at = Date.now(); return t;
}
function hbEv(id, how){ if (typeof cloudEv === 'function') cloudEv('hb', {id, how}); }
function hbDone(id){ const H = hbState(); if (!H.seen[id]) hbEv(id, 'seen'); H.seen[id] = S.t || 1; H.cur = null; H.force = 0; H.at = Date.now(); save(); }
function hbSkip(ch, id){ const H = hbState(); H.skip[ch] = 1; if (id){ H.seen[id] = S.t || 1; hbEv(id, 'skip'); } H.cur = null; H.force = 0; H.at = Date.now(); save(); }
// the tips whose moment has come and that have not been seen: the dot on the app
function hbReady(){ const H = hbState(); return HB.filter(x => !H.seen[x.id] && !H.skip[x.ch] && hbTry(x.when)).length; }
// the drip's box, drawn by the guide's code (tipPlace in 07b-first-trip.js); true when something is shown
// ---------- what the phone shows (Onboarding 2, O5, V7 A, 27.10.2026) ----------
// The first trip shows only what it uses; after it each app comes out, marked «ny», when its drip comes (or its chapter is put to rest), and
// from the third landing everything is out, so nobody is kept from anything for long. S.apps: {id:'ny' | 1}; a game from before has none
// and sees everything as it did
const APP_ALWAYS = ['vaer', 'meld', 'redning', 'handbok', 'tilbake', 'innst', 'admin'];
const HB_APP = {nett:'nett', guide:'guide', lykke:'kaiboden', regler:'regler', sesong:'sesong', post:'post', meld:'meld', drift:'drift', topp:'salg', merker:'merker', patch:'patch', oppdrag:'ordl', venner:'folk', rederi:'rederi', kvote:'kvote', vaer:'vaer', redning:'redning'};
function appShown(id){
  if (!S.apps || APP_ALWAYS.includes(id) || S.apps[id]) return true;
  return !tutOn() && hbLand() >= 3;
}
function appUnlock(id){ if (id && S.apps && !S.apps[id]) S.apps[id] = 'ny'; }
const appNew = id => !!(S.apps && S.apps[id] === 'ny');
function appSeen(id){ if (S.apps && S.apps[id] === 'ny') S.apps[id] = 1; }
function hbUpdate(){
  if (typeof NAUST3D !== 'undefined' && NAUST3D.isOpen()) return false;
  if (typeof PUB3D !== 'undefined' && PUB3D.isOpen && PUB3D.isOpen()) return false;
  const t = hbPick(); if (!t) return false;
  appUnlock(HB_APP[t.id]);   // its app comes out with it (O5)
  let T0 = {}; if (t.show){ try { T0 = t.show() || {}; } catch (e){ T0 = {}; } }
  if (PHONE.isOpen() && T0.el && !T0.el.closest('#phone')) T0 = {el:vis('#phone .ph-nav [data-pa=close]'), no:'Lukk telefonen først.', en:'Close the phone first.'};
  const txt = T0.no ? hbL(T0.no, T0.en) : hbL(t.no, t.en);
  T0 = Object.assign({}, T0, {nodim:true, okAct:() => hbDone(t.id), alt:[hbL('Jeg kan dette', 'I know this'), 'I know this'], altAct:() => hbSkip(t.ch, t.id)});
  tutCur = {st:{id:'hb:' + t.id, ok:true}, T0};
  tipPlace(txt, T0, {ok:!T0.no});   // an instruction on the way (close the phone first) has no «Skjønner»
  return true;
}
// the app: every tip by chapter, a dot by what is not seen, «Vis meg» (points again), and the chapter's drips on or off
const HBUI = (() => {
  let q = '', only = null;   // only: one entry opened from an item card's «Mer» (ui/05a-itemcard.js), with the way back to the whole book
  const esc = v => String(v).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'})[c]);
  function list(){
    const H = hbState(), f = q.trim().toLowerCase(), h = [];
    if (only && hbById(only)){ const t = hbById(only);
      return '<div class="ph-card hb-t seen" id="hb-' + t.id + '"><h4>' + esc(hbL(t.t[0], t.t[1])) + '</h4><p>' + esc(hbL(t.no, t.en)) + '</p></div><button class="ph-btn alt" data-pa="hball">' + esc(hbL('Hele Håndboka', 'The whole handbook')) + '</button>'; }
    for (const [c, no, en] of HB_CH){
      const tips = HB.filter(t => t.ch === c && (!f || (hbL(t.t[0], t.t[1]) + ' ' + hbL(t.no, t.en)).toLowerCase().includes(f))); if (!tips.length) continue;
      const n = HB.filter(t => t.ch === c && H.seen[t.id]).length, all = HB.filter(t => t.ch === c).length, lex = tips[0].lex;
      h.push('<div class="hb-ch"><b>' + esc(hbL(no, en)) + (lex ? '' : ' <small>' + n + ' / ' + all + '</small>') + '</b>' + (lex ? '' : '<button class="ph-btn sm" data-pa="hbskip" data-ch="' + c + '">' + (H.skip[c] ? esc(hbL('Vis tipsene', 'Show the tips')) : esc(hbL('Jeg kan dette', 'I know this'))) + '</button>') + '</div>');
      for (const t of tips) h.push('<div class="ph-card hb-t' + (H.seen[t.id] ? ' seen' : t.lex ? ' lex' : '') + '" id="hb-' + t.id + '"><h4>' + (H.seen[t.id] || t.lex ? '' : '<span class="hb-dot"></span>') + esc(hbL(t.t[0], t.t[1])) + '</h4><p>' + esc(hbL(t.no, t.en)) + '</p>' +
        (t.show ? '<button class="ph-btn" data-pa="hbshow" data-id="' + t.id + '">' + esc(hbL('Vis meg', 'Show me')) + '</button>' : '') + '</div>');
    }
    return h.join('') || '<p class="ph-note">' + esc(hbL('Ingen tips passer søket.', 'No tip matches the search.')) + '</p>';
  }
  function page(){
    const H = hbState(), n = Object.keys(H.seen).length, tips = HB.filter(t => !t.lex).length;
    return '<div class="ph-c"><p class="ph-note">' + esc(hbL('Alt veiledningen har å si etter første tur, kapittel for kapittel. Tipsene kommer av seg selv første gang noe skjer; her kan du lese dem igjen og la dem peke.', 'Everything the guide has to say after the first trip, chapter by chapter. The tips come by themselves the first time something happens; here you can read them again and let them point.')) + ' ' + n + ' / ' + tips + '</p>' +
      '<input id="hbQ" type="search" placeholder="' + esc(hbL('Søk i Håndboka', 'Search the handbook')) + '" value="' + esc(q) + '" autocomplete="off"><div class="hb-list">' + list() + '</div></div>';
  }
  // «Vis meg»: close the phone and let the tip point until «Skjønner»
  function show(id){ const H = hbState(); if (!hbById(id)) return; H.cur = id; H.force = 1; H.at = 0; PHONE.show(false); tutUpdate(); }
  function toggle(ch){ const H = hbState(); if (H.skip[ch]) delete H.skip[ch]; else H.skip[ch] = 1; H.at = Date.now(); save(); }
  return {page, list, show, toggle, set q(v){ q = v || ''; only = null; }, get q(){ return q; }, set only(v){ only = v || null; q = ''; }, get only(){ return only; }};
})();
