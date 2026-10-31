# Hva gjør oppdrag gøy? Psykologi, spilldesign og churn for FishyBusiness

*Researchnotat, oktober 2026. Grunnlag for oppdragssystemet i FishyBusiness (MMORPG fiskeri-skip-simulator, PWA, norskekysten 1:1).*

---

## 0. Kortversjon: ti ting å ta med seg

1. **Oppdrag er gøy når de dekker tre psykologiske behov:** å mestre noe (kompetanse), å velge selv (autonomi) og å bety noe for andre (tilhørighet). Dette er Self-Determination Theory, og det er den best dokumenterte forklaringen vi har på spillglede.
2. **Et oppdrag trenger en grunn til å finnes.** "Fetch quests" er ikke problemet. Poengløse fetch quests er problemet. Hvert oppdrag bør ha en "hook" som gjør at designteamet selv har lyst til å gjøre det.
3. **Varier rytmen.** Fire likeartede oppdrag på rad dreper flyten. Veksle mellom fange, levere, navigere, undersøke, forhandle, redde.
4. **Oppdrag må være den smarte måten å spille.** Hvis fri fisking gir bedre lønn og mer glede enn oppdragene, blir oppdragene en plikt.
5. **Uforutsigbarhet er gull.** Vær som slår om, en bestand som har flyttet seg, en konkurrent på samme felt. Emergente historier er det billigste retention-verktøyet som finnes.
6. **Ekte fiske er allerede en variabel belønningsplan.** Dere trenger ikke loot boxes. Naturen gir usikkerheten gratis, og den er etisk forsvarlig fordi den er sann.
7. **Progresjon skal være synlig og aldri starte på null.** Goal gradient, endowed progress og uferdige oppgaver trekker folk tilbake.
8. **Sosiale bånd holder folk i spillet. Achievement-jag forutsier churn.** Spillere som bare jager tall slutter når tallene stopper. Spillere med et mannskap, en båtlagsgruppe eller en havn de bryr seg om, blir.
9. **Daglige plikter er en felle.** Mists of Pandaria-lærdommen: for mange "må gjøres i dag"-oppdrag skaper skyld, utbrenthet og frafall. Bruk "2 av 3"-prinsippet og rullerende tilbud i stedet.
10. **Unngå blindveier.** En spiller som mister alt eller står fast uten utvei forlater spillet for godt. Hver fiasko trenger en vei videre.

---

## 1. Psykologien bak gode oppdrag

### 1.1 Self-Determination Theory (SDT): kompetanse, autonomi, tilhørighet

Ryan, Rigby og Przybylski (2006) viste at opplevd **kompetanse**, **autonomi** og **tilhørighet** hver for seg forutsier både spillglede og ønsket om å spille videre. Dette er det mest robuste funnet i spillpsykologien.

Hva det betyr for oppdrag:

| Behov | Oppdraget bør gi | Eksempel i FishyBusiness |
|---|---|---|
| Kompetanse | Noe som er lett å lære men vanskelig å mestre, med tydelig tilbakemelding | Lese ekkolodd, sette garn riktig i strøm, treffe kvoten uten bifangst |
| Autonomi | Reelle valg om *hvordan* og *når* målet nås | "Lever 2 tonn sei til Myre innen fredag" uten å dikte hvor eller hvordan |
| Tilhørighet | Andre mennesker som ser og trenger innsatsen din | Mannskap, båtlag, kjøpere i havna som husker deg, redningsoppdrag for andre spillere |

Et viktig poeng fra SDT-litteraturen om jobbsimulatorer (Euro Truck Simulator, PowerWash Simulator, Farming Simulator): vi liker å simulere jobber vi aldri ville hatt fordi spillet fjerner de delene av jobben som truer behovene (kjeft fra sjefen, økonomisk ruin, kjedelig venting) og beholder de som nærer dem (synlig framgang, mestring, ro). FishyBusiness har et fortrinn her: ekte data gir mestringen *mening* fordi det du lærer er sant.

**Ytre belønning ødelegger ikke automatisk indre motivasjon.** Debatten er reell, men en god tommelfingerregel er: belønning som *bekrefter mestring* (du fikk bedre pris fordi fangsten var kvalitetssortert) styrker motivasjonen. Belønning som *kontrollerer* (logg inn hver dag ellers mister du streaken) svekker den.

### 1.2 Flow: utfordring møter ferdighet

Csikszentmihalyis flow-modell er grundig testet i spill (Tetris, Candy Crush). Betingelsene er:

- **Klare mål.** Spilleren vet hva suksess er.
- **Umiddelbar tilbakemelding.** Du ser med en gang om du gjør det riktig.
- **Balanse mellom utfordring og ferdighet.** For lett gir kjedsomhet, for vanskelig gir angst.

Studier viser også at spillere noen ganger *foretrekker* overbelastning framfor kjedsomhet. For et sim-spill med lange økter betyr det at dere bør stable risiko, lettelse og belønning i samme øyeblikk (storm kommer, kvoten er nesten full, hvor lenge tør du bli?), ikke bare bygge en jevn kurve over tid.

### 1.3 Koster: moro er læring

Raph Kosters *A Theory of Fun*: moro er hjernens belønning for å lære mønstre. Et spill blir kjedelig når det ikke lenger har noe nytt å lære deg. Konsekvens for oppdrag: **hvert oppdrag bør lære spilleren noe**, enten om spillet (en ny teknikk, et nytt område) eller om verden (hvorfor skreien kommer til Lofoten i januar, hvorfor det er forbudt å fiske her nå). Dere har et unikt innholdslager av ekte kunnskap å undervise gjennom oppdrag. Det er nettopp det Koster sier gir langvarig moro.

### 1.4 Variabel belønning og den etiske grensen

Variabel belønning (du vet ikke når neste store fangst kommer) er psykologisk svært sterkt. Det er grunnen til at fiskeminispill aldri dør ut, og det er mekanismen loot boxes etterligner.

To ting å vite:

- **Fiske er den opprinnelige variable belønningsplanen.** Dere trenger ikke konstruere den, bare la den ekte usikkerheten i bestand, vær og sesong komme til uttrykk. En spiller som leser data riktig *reduserer* usikkerheten, og det er mestring.
- **Dark patterns-forskningen (Zagal m.fl.)** deler manipulative mønstre i tidsmessige (kunstig venting), monetære (betal for å slippe) og sosiale (skam om du ikke bidrar). Nær alle topplistespill på mobil bruker variabel belønning sammen med sjeldenhetsgradering og sanseeffekter. Dette fungerer kortsiktig og skaper mistillit langsiktig. Anbefaling: all tilfeldighet i FishyBusiness skal være *forklarbar med ekte data*. Da er den ikke manipulasjon, den er simulering.

### 1.5 Progresjonseffekter som trekker folk tilbake

- **Goal gradient:** innsatsen øker jo nærmere målet man kommer. Vis "3 av 5 leveranser" tydelig.
- **Endowed progress:** en progresjonsbar som starter på 20 % fullføres oftere enn en som starter på 0 (Nunes og Drèze 2006: 34 % mot 19 %). Krediter det spilleren faktisk allerede har gjort, aldri falske trinn.
- **Zeigarnik-effekten:** uferdige oppgaver huskes bedre enn ferdige. Et påbegynt oppdrag ved utlogging er en grunn til å komme tilbake. Replikasjonen er omdiskutert, men mekanismen er godt nok støttet til å brukes med måte.

### 1.6 Spillertyper: hvem lager vi oppdrag for?

Tre modeller er nyttige sammen:

- **Bartle (1996):** Achievers, Explorers, Socializers, Killers. Grovt, men et felles vokabular.
- **Yee / Quantic Foundry:** empirisk, basert på hundretusener av spillere. I Yees MMO-data var de tre viktigste motivasjonene **å gjøre framgang, å være oppslukt (immersion) og å utforske verden**. De minst viktige var å flykte fra virkeligheten, rollespill og å bli mektig.
- **Octalysis (Chou):** åtte drivkrefter, nyttig som sjekkliste for *hvilke* motivasjonsknapper et oppdrag trykker på.

For FishyBusiness betyr Yee-funnet noe konkret: **immersion og utforskning er ikke sekundært.** Et 1:1 norskekyst-kart med ekte vær er selve produktet for en stor gruppe. Oppdrag som sender folk til steder de ikke har vært, under forhold de ikke har opplevd, treffer to av de tre sterkeste motivasjonene.

---

## 2. Hva gjør et enkelt oppdrag gøy? Lærdommer fra bransjen

### 2.1 Hvert oppdrag trenger en "hook" (RuneScape, Falmouth, Game Developer)

RuneScape-teamet krever at *hvert* oppdrag har en hook som interesserer hele designteamet. En Falmouth-foreleser formulerer testen som: "Hva er dette oppdraget *for*?" En morsom karakter, en overraskelse, en ny kunnskap, et dilemma. Hvis svaret er "for å gi XP", stryk det eller gjør det om.

RuneScape-oppdragene ble bedre da de ble **skilt fra levelgrinden**. Oppdrag som bare er den obligatoriske veien til neste nivå føles som hindre. Oppdrag som er valgfrie opplevelser med egne belønninger føles som gaver.

### 2.2 Variasjon i flyt (Jeff Kaplan, GDC 2009)

Kaplans selvkritikk av World of Warcraft: en oppdragskjede med fire drepeoppdrag på rad etterfulgt av fire samleoppdrag på rad er dårlig design, selv om hvert enkelt oppdrag er greit. Tips:

- Aldri to oppdrag av samme type rett etter hverandre i en kjede.
- Alterner mellom aktive (fange, navigere i storm), rolige (levere, reparere) og sosiale (forhandle, hjelpe) oppgaver.
- Kaplans viktigste poeng: Blizzard måtte **gjøre oppdragsfullføring til den smarte måten å spille**. Tuning av belønning fortjener mer oppmerksomhet enn den vanligvis får.

### 2.3 Lærdommer fra CD Projekt Red (Sasko, GDC 2023)

Fra "10 Key Quest Design Lessons from The Witcher 3 and Cyberpunk 2077" (basert på sekundære omtaler, selve foredraget er på GDC Vault):

- **Valg uten full informasjon.** La spilleren ta beslutninger med ufullstendig kunnskap, slik man gjør i virkeligheten. Skal du gå ut i dag med dette værvarselet?
- **Etterforskningsdetaljer som engasjerer.** Gi biter av informasjon som får spilleren til å ville vite mer, uten å tvangsfôre. En fangstrapport som ikke stemmer med det du ser på ekkoloddet.
- **Konsekvenser som dukker opp senere.** Et valg i uke 1 gir en reaksjon i uke 3. Skipperen du hjalp husker deg.

### 2.4 Uforutsigbarhet og emergens (Sea of Thieves, EVE Online)

- **Sea of Thieves:** Voyages sender deg fra øy til øy, og "det kommer IKKE til å gå som planlagt". Skjelettskip, andre spillere, vær. Designdirektør Mike Chapman: målet var at verdien av å *dele en rik verden* skulle bety mer enn stadig økende tall. Skattekister er **eierløse objekter**, og det er kilden til nesten all dramatikk. Progresjon via **rykte hos handelskompanier**, der voyages blir rikere, vanskeligere og får nye mekanikker etter hvert som ryktet vokser. Tre kompanier på nivå 50 gir "Pirate Legend".
- **EVE Online (CCP, GDC Online 2012):** Emergens er verdifull fordi den "lar oss beholde spillere billig". De store heist-historiene får oppmerksomheten, men den daglige uforutsigbarheten er det som holder folk. CCPs tre pilarer inkluderte **"unngå blindveier"**: å tape ferdig arbeid uten utvei er det som sender spillere ut for godt. Emergens kan ikke testes på forhånd, markedet må teste den. Og: for mye strømlinjeforming reduserer emergensen.

For FishyBusiness: dere har et emergens-maskineri innebygd. Ekte vær, ekte vandring, ekte sesonger og andre spillere på samme felt. Oppdragene bør *lene seg på* dette, ikke isolere seg fra det. Et leveringsoppdrag er kjedelig i stille vær og en historie i kuling.

### 2.5 Prosedurelle oppdrag: Skyrim Radiant-lærdommen

Radiant Story var ment å gi uendelig gjenspillbarhet og endte med å forsterke følelsen av repetisjon. Hva vi vet:

- Prosedurelle oppdrag fungerer bare når det er **nok håndlaget innhold rundt dem**.
- Mønsteret "skriv oppdraget én gang, la systemet fylle inn variasjoner" holder kostnadene nede, men variasjonene må være *meningsfulle* (annen art, annet vær, annen kjøper, annen konsekvens), ikke bare andre navn.
- De fungerte best når de var **få og valgfrie**, ikke påtvunget.

Konkret anbefaling: bygg et lite antall håndlagde oppdragsmaler med sterke hooks, og la **de ekte dataene** (bestand, sesong, vær, priser) være variasjonsmotoren. Da blir "lever 2 tonn torsk" et annet oppdrag i februar i Lofoten enn i august i Finnmark, uten at dere skriver det to ganger.

### 2.6 Det mundane som er tilfredsstillende (PowerWash, ETS2, Barents Sea)

- **PowerWash Simulator:** "eksisterer for å være en tilfredsstillende aktivitet, ikke en utfordring". Synlig framgang holder folk i timer. Men: det tipper over i kjedsomhet uten variasjon. Små valg (verktøy, kjemikalie) gir autonomi.
- **Euro Truck Simulator 2 / World of Trucks:** jobber med tidsfrist i *ekte* tid, og fellesskapsmål der hele spillerbasen jobber mot én teller for belønning. Dette er en god modell for "landsdekkende kvote-dugnad"-events. Merk at SCS i mars 2026 satte eventene på pause for å integrere dem bedre i spillet, altså er heller ikke de ferdige med designet.
- **Fishing: Barents Sea** (nærmeste konkurrent, Misc Games, Norge): anmeldelsene er samstemte. "Svært repeterende", "mer management-spill enn fiskespill", "meditativt og avslappende innimellom", "ekstremt kjedelig til tider, men jeg er hekta" (PC Gamer). Oppdrag fra havnene ga "litt penger på siden" og rykte, altså var de perifere. **Fishing: North Atlantic** fikk ros for vær ("blant de beste") og for at hver art ga egen utfordring. Lærdom: konkurrenten vant på atmosfære og tapte på repetisjon og tynne oppdrag. Det er nøyaktig hullet FishyBusiness kan fylle.

---

## 3. Churn: hvorfor folk slutter, og hva som holder dem

### 3.1 Hva forskningen sier

- **Achievement forutsier churn, sosiale bånd forutsier retention.** EverQuest II-data: achievement-motivasjon var den dominerende prediktoren for *at* spillere slutter. Flere studier finner at sosial aktivitet og påvirkning fra venner forutsier retention bedre.
- **Retention-faktorene endrer seg med nivå** (arXiv 2017, "Achievement and Friends"): tidlig i spillet driver framgang. Senere driver venner. Et spill som bare optimaliserer for det ene mister folk i overgangen.
- **Guild-stabilitet:** Ducheneaut m.fl. (2006, 2007): spillere spiller regelmessig med bare en brøkdel av guilden sin ("alone together"), men det å *være* i en stabil gruppe forutsier at man blir. Debeauvais m.fl. (2011) fant at tidligere lojalitet, gruppestabilitet og sosialt engasjement var de viktigste faktorene for å forutsi om noen forlot guilden.
- **"Alone together"** er et viktig designmål: mange vil være *nær* andre uten å måtte samarbeide. En havn full av andre spilleres båter, en radiokanal, en fellesteller, uten tvungen gruppering.

### 3.2 Den daglige fellen (Mists of Pandaria, 2012)

Blizzard fjernet taket på 25 daglige oppdrag. Resultat: 48 tilgjengelige dailies hver dag, fem hubs åpne samtidig. Spillerne *måtte* ikke gjøre alle, men de **følte** at de måtte. Utbrenthet, skyld ved å hoppe over en dag, og en bred motreaksjon. Patch 5.2 kuttet rykte-gevinsten fra dailies for å dempe presset.

Lærdommer:

- Volum er problemet, ikke konseptet. Noen få, varierte, valgfrie daglige tilbud er fint.
- **"2 av 3"-prinsippet** (fra RuneScape-miljøet): krev bare 2 av 3 daglige for full belønning. Da føles ikke en travel dag som tap.
- Ikke vift tilbudet i ansiktet på folk. En rolig spiller føler ikke FOMO før spillet forteller hen at noe gikk tapt.
- **Lockouts i kalendertid skaper harme.** "Det er stor forskjell på å farme 50 ganger når jeg har tid, og 50 dager fordi det er daglig låst."

### 3.3 Blindveier og tap

CCP: tap av ferdig arbeid uten utvei er det som får folk til å slutte for godt. For FishyBusiness: båten går ned, kvoten er brukt opp, gjelden er for stor. Hver av disse trenger en designet vei tilbake (forsikring, redningsoppdrag fra andre spillere, nødkontrakt fra en rederi-NPC). Ikke fjern konsekvensen, men fjern blindveien.

### 3.4 Onboarding og første økt

Designlitteraturen er enig om at kjerneverdien må oppleves raskt. Konkret for et fiskespill: **tid til første fangst** og **tid til første salg** er de to tallene som betyr mest for D1-retention. Ikke start med regelverk. Start med en båt, en fisk og en kjøper. Introduser forskrifter som oppdrag senere ("du har fått en inspektør om bord, nå lærer du hvorfor").

---

## 4. Konkrete oppdragstyper for FishyBusiness

Hver type er knyttet til motivasjonene over, slik at porteføljen treffer bredt.

| Type | Hook | Treffer | Datadrevet variasjon |
|---|---|---|---|
| **Kontrakt** ("Lever X tonn Y til Z innen T") | Tidspress, pris, valgfri rute | Kompetanse, autonomi | Art, sesong, pris, vær, avstand |
| **Letefiske** ("Finn hvor seien står nå") | Nysgjerrighet, utforskning, ufullstendig info | Utforskning, immersion | Faktisk vandringsmønster per måned |
| **Første gang** ("Første tur til Røst", "Første natt på havet") | Opplevelse, ikke tall | Immersion | Geografi, lys, vær |
| **Redning / assistanse** (hjelp et annet skip, spiller eller NPC) | Noen trenger deg | Tilhørighet | Nød oppstår av ekte vær og spilleratferd |
| **Inspektør / regelverk** ("Overlev kontrollen") | Læring, dilemma | Kompetanse, Koster-læring | Faktiske forskrifter per redskap og sone |
| **Sesong-event** (Lofotfisket, skreiinnsig, sildefiske) | Felles kalender, fellesteller | Tilhørighet, alone together | Ekte sesong |
| **Rederi-rykte** (Sea of Thieves-modellen) | Langsiktig progresjon, nye mekanikker | Framgang | Rykte låser opp oppdrag med ny kompleksitet |
| **Mannskapskjede** (små historier om de om bord) | Karakter, humor, konsekvens senere | Immersion, tilhørighet | Håndskrevet, få og gode |
| **Dugnad / fellesmål** (World of Trucks-modellen) | Hele serveren fyller én kvote | Tilhørighet | Ekte kvote-tall |
| **Blindvei-redning** (nødkontrakt når du er blakk) | Vei tilbake | Trygghet | Trigges av spillerens tilstand |

Prinsipper for porteføljen:

1. **Alltid minst tre forskjellige typer tilgjengelig**, aldri to like rett etter hverandre i en kjede.
2. **Spilleren velger.** Oppdragstavle, ikke tvungen kø. "2 av 3" på alt som er tidsbegrenset.
3. **Oppdraget er lønnsomt** sammenlignet med fri fisking, men fri fisking er aldri straffet.
4. **Hver oppdragstype lærer noe sant** om fiskeri, hav eller kyst.
5. **Konsekvens, aldri blindvei.**
6. **Ekte vær og ekte bestand får lov å ødelegge planen.** Det er featuren, ikke buggen.

---

## 5. Anti-mønstre å unngå

- Daglige streaks med straff for brudd.
- Fler enn en håndfull tidsbegrensede oppdrag synlig samtidig.
- Oppdrag hvis eneste formål er XP eller penger.
- Prosedurelle oppdrag uten håndlaget ramme.
- Tilfeldighet som ikke kan forklares med data (føles som juks).
- Tvungen gruppering for å komme videre. Tilby "alone together" først.
- Lockouts i kalendertid på kjerneinnhold.
- Tap uten utvei.
- Onboarding som begynner med regler i stedet for fisk.

---

## 6. Hva bør måles

| Måltall | Hvorfor |
|---|---|
| Tid til første fangst og første salg | Avgjør D1 |
| D1 / D7 / D30 retention | Standard |
| Andel oppdrag startet som fullføres, per type | Finner de kjedelige typene |
| Andel spillere som gjør 0, 1, 2, 3+ oppdrag per økt | Er oppdrag "den smarte måten"? |
| Øktlengde og gap mellom økter | Burnout-signal når øktene blir kortere og gapene lengre |
| Andel spillere i et mannskap/båtlag etter 7 dager | Sterkeste retention-prediktor |
| Antall som slutter rett etter et stort tap | Blindvei-signal |
| Spredning i hvor spillere fisker | Utforskningsmotivasjonen fungerer eller ikke |

---

## 7. Kildevurdering

Forskningen på SDT, flow og sosial retention i MMO er solid (fagfellevurdert, store datasett). Progresjonseffektene (goal gradient, endowed progress, Zeigarnik) er godt dokumentert i markedsføring men mindre testet i spill, og Zeigarnik har blandet replikasjon. FOMO- og utbrenthetsmaterialet er i hovedsak bransjekommentarer og spillerrapporter, ikke studier. Bransjeeksemplene (Kaplan, Sasko, CCP, Rare) er fra GDC-foredrag gjenfortalt av presse. Flere primærkilder (Game Developer, ACM, GDC Vault) kunne ikke hentes direkte i denne sesjonen på grunn av nettverksbegrensninger, så de er gjengitt via sekundærkilder.

### Kilder

**Psykologi**
- Ryan, Rigby, Przybylski (2006), "The Motivational Pull of Video Games: A Self-Determination Theory Approach": https://www.rochester.edu/warner/lida/wp-content/uploads/2022/11/02bfe513dd59366750000000.pdf
- SDT og jobbsimulatorer: https://selfdeterminationtheory.org/why-do-we-enjoy-playing-games-that-simulate-jobs-we-would-never-want-to-do-in-real-life/
- Madigan, "Why do we really play": https://www.gamedeveloper.com/design/why-do-we-really-play-
- Intrinsic/extrinsic som falsk dikotomi: https://www.gamedeveloper.com/business/intrinsic-extrinsic-motivation-a-false-dichotomy-
- Chen, "Flow in games (and everything else)", CACM 2007: https://khoury.northeastern.edu/~lieber/courses/csu670/f08/materials/p31-chen-flow-in-games.pdf
- Flow-review (PeerJ 2020): https://peerj.com/articles/10520.pdf
- Candy Crush og flow (PMC 2022): https://pmc.ncbi.nlm.nih.gov/articles/PMC8943660
- Koster, "Theory of Fun 10 Years Later": https://www.raphkoster.com/wp-content/uploads/2026/07/Theory-of-Fun-10-Years-Later.pdf
- Endowed progress: https://uxdesign.cc/endowed-progress-effect-give-your-users-a-head-start-97d52d8b0396
- Progresjonsbarer og onboarding: https://userpilot.com/blog/progress-bar-psychology/
- Zeigarnik i digitale produkter: https://bootcamp.uxdesign.cc/the-zeigarnik-effect-why-is-it-important-for-your-digital-products-fa879f6f8321
- Dark patterns i mobilspill (arXiv 2024): https://arxiv.org/pdf/2412.05039
- Loot boxes og gambling-mekanismer: https://rozprawyspoleczne.edu.pl/Loot-boxes-gambling-like-mechanisms-hidden-in-digital-games-A-narrative-review-of,216647,0,2.html

**Spillertyper**
- Yee, "A Model of Player Motivations": https://nickyee.com/daedalus/archives/print/001298.php
- Yee, Facets: https://nickyee.com/facets/home.html
- Bartle-typer forklart: https://gamedesignskills.com/game-design/gamer-types/
- Quantic Foundry-diskusjon: https://massivelyop.com/2016/01/07/massively-overthinking-lets-play-with-the-gamer-motivation-model/
- Octalysis: https://yukaichou.com/octalysis.html

**Oppdragsdesign**
- Kaplan, GDC 2009 (WoW quest design mistakes): https://www.gamedeveloper.com/game-platforms/gdc-learning-from-i-world-of-warcraft-i-s-quest-design-mistakes og https://www.engadget.com/2009-03-27-kaplan-on-being-the-cruise-director-of-azeroth-at-gdc-09.html
- RuneScape "hook"-kravet: https://gamesbeat.com/secrets-of-mmo-storytelling-exclusive/
- Fetch quests og formål: https://www.gamedeveloper.com/design/quest-for-change og https://malaysia.news.yahoo.com/why-wont-fetch-quests-die-234432459.html
- Bartle, "Pleasing the Teller" (2009): https://aom.jku.at/archiv/cmc/text/bartle.90/mud.co.uk/richard/IMGDC2009.pdf
- Sasko, GDC 2023: https://gdcvault.com/play/1028897/10-Key-Quest-Design-Lessons og https://www.gamedeveloper.com/marketing/10-key-takeaways-from-the-quest-design-of-cyberpunk-2077-and-the-witcher-3
- Skyrim Radiant Story: https://gamesbeat.com/bethesdas-nesmith-reflects-on-the-difficult-birth-of-skyrims-radiant-story-system/ og https://www.shamusyoung.com/twentysidedtale/?p=30572 og https://labjogos.tecnico.ulisboa.pt/en/thesis/procedural-quest-generation-improving-skyrim-s-radiant-story

**Emergens og sandbox**
- CCP, tre pilarer for sandbox-MMO (GDC Online 2012): https://gamedeveloper.com/design/ccp-online-s-three-design-pillars-for-sandbox-mmos
- EVE og emergens: https://massivelyop.com/2015/06/28/eve-evolved-is-eve-becoming-less-emergent/
- Sea of Thieves, emergent gameplay: https://www.filamentgames.com/blog/sea-of-thieves-and-real-emergent-gameplay og https://roadtovr.com/7-lessons-sea-of-thieves-can-teach-us-about-great-vr-game-design/
- Rare om progresjon og voyages: https://vip-develop.destructoid.com/?p=209609 og https://cogconnected.com/2017/12/progression-system-works-sea-of-thieves/

**Retention og churn**
- Debeauvais, Nardi, Schiano, Ducheneaut, Yee (2011), "If you build it they might stay": https://www.artifex.org/~bonnie/WoW_retention_04_24_11.pdf
- "Achievement and Friends: Key Factors of Player Retention Vary Across Player Levels" (arXiv 2017): https://arxiv.org/pdf/1702.08005
- Ducheneaut m.fl., "Alone Together?" og guild survival, via Yees indeks: https://nickyee.com/daedalus/archives/print/001539.php
- Mists of Pandaria dailies: https://www.engadget.com/2012-07-18-48-dailies-are-48-dailies-too-many.html og https://www.tentonhammer.com/articles/patch-5-2-the-death-of-dailies
- "The daily quest trap": https://www.wayline.io/blog/the-daily-quest-trap
- "2 av 3"-prinsippet (RuneScape): https://informer.rsbandb.com/?p=12120
- Deep Rock Galactic retention-intervju (via AV Club): https://www.avclub.com/the-future-and-past-of-deep-rock-galactic

**Sim-spill og konkurrenter**
- Fishing: Barents Sea anmeldelser: https://www.pcgamer.com/fishing-barents-sea/ og https://cogconnected.com/review/fishing-barents-sea-review/ og https://indiegamereviewer.com/fishing-barents-sea-an-indie-game-review/
- Fishing: North Atlantic anmeldelse: https://www.thumbculture.co.uk/fishing-north-atlantic-xbox-review
- Fiskeminispill-design: https://bugnet.io/blog/how-to-design-a-fishing-minigame-people-enjoy og https://uppercutcrit.com/gone-fishing-why-the-fishing-mini-game-will-never-die-out/
- Dredge-utvikling: https://gamasutra.com/design/trawling-in-the-deep-how-black-salt-games-made-spooky-fishing-rpg-i-dredge-i- og https://www.well-played.com.au/black-salt-games-on-night-fishing-and-cosmic-horror-in-dredge/
- PowerWash Simulator: https://gamespot.com/reviews/powerwash-simulator-review-filthy-rich/1900-6417923/ og https://www.axios.com/2021/06/04/futurlab-power-wash-simulator-game
- Jobbsimulatorer: https://filmstories.co.uk/features/job-simulators-find-magic-in-the-mundane/
- World of Trucks (ETS2): https://trucksimulator.wiki.gg/wiki/World_of_Trucks og https://blog.scssoft.com/2015/11
