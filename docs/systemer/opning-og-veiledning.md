# Åpningsscenen og «Første tur»

> Flyttet ordrett fra `docs/OVERLEVERING.md` 26.10.2026 (`docs/utviklingsplan.md`, fase A). Tallene i overskriftene er de gamle kapittelnumrene; `docs/systemer/gamle-numre.md` viser hvor hvert nummer havnet. Nytt skrives inn her, under det systemet det gjelder.

## 5.15b Åpningsscenen: brevet fra far (05.10.2026)

Jonas: «Skjermen er helt svart, med en slitt konvolutt med røff håndskrift hvor det står: "Til den som tar over" ... Ut kommer det et brettet brev som åpnes.» Teksten i brevet er Jonas sin.

- **Flyt** (`ui/08b-letter.js`, `showLetter`):
  1. Et nytt spill (`showIntro` uten `namesOnly`) åpner på en svart skjerm med lyskjegle, støv og filmkorn.
  2. Spilleren trykker på konvolutten. Den snus, klaffen løsner og svinger opp, og brevet glir ut av lomma.
  3. Konvolutten faller bort, og brevet kommer fram og brettes ut, først øverste og så nederste tredjedel.
  4. «Ta over» går videre til båtnavnet.
- **Lyd:** Papirlyden lages av støy med båndpass og spredte klikk (`letterSound`) og følger lydinnstillingen.
- **Når den ikke vises:** `#notut` hopper over brevet, slik testene gjør (bare fra testmaskinen). Nullstilling (`reset`) viser det heller ikke.
- **Papiret** er fra Blender (`tools/opening/brev.py`). Det er fem WebP-bilder, til sammen rundt 150 kB, i `pic-letter-*`:
  - konvoluttens forside, lomme, innside og klaff
  - selve arket
  
  Bildene har ekte skrukker i geometrien, lys som streifer over arket og flekker i et fargelag. Kantene er slitt bort i alfakanalen.
- **Håndskriften** er sidens egen tekst, så den er skarp og finnes på begge språk:
  - Caveat (SIL OFL 1.1) i brevet og Rock Salt (Apache 2.0) på konvolutten
  - Fontene ligger i siden som base64 (`src/data/font-*.b64`), så de virker uten nett.
  - Skriftstørrelsen tilpasses arket, målt på en kopi utenfor skjermen.
- **Båtnavnet uten rederi** (Jonas: «nye spillere skal ikke lage rederi, kun gi båten et navn. Rederi skal opprettes når man skal kjøpe seg inn i lukket gruppe»):
  - Dialogen spør bare om båtnavnet, og `S.company` står tom.
  - Arket for en båt med hjemmel i lukket gruppe har feltet «Rederiet» med et navneforslag. Navnet settes når kjøpet går gjennom (`buylic`).
  - Stifter spilleren AS før det (`foundAS`), får rederiet navnet «båtnavn Fiskeri AS».
- **Test:** `tut.py` åpner brevet med berøring, både liggende og stående. Den sjekker at brevet er helt utbrettet, at teksten får plass, og at dialogen etterpå bare har båtnavnet.

## 5.16 Veiledningen «Første tur» (01.10.2026)

- **Obligatorisk** for nye spill, også etter nullstilling, og den kan ikke hoppes over (Jonas 05.10.2026: «Hvert steg må gjennomføres, og om spillet lukkes mens tutorial pågår skal den fortsette der den slapp»). Eldre lagringer sendes ikke gjennom den. `#notut` i adressen hopper over den bare når spillet kjøres fra testmaskinen (`127.0.0.1` eller `localhost`, `NOTUT` i `08-actions.js`).
- **Tilstand:** `S.tut = {v:2, m:{…}, catch:true, pAt}`. `m` er milepælene. Steget som vises, er det første som ikke er gjort, og «gjort» leses også av spilltilstanden, så veiledningen tåler omlasting. Rutestegene (`live`) leses på nytt hver gang til båten har kastet loss.
- **Stegene** (`TSTEPS` i `ui/07b-first-trip.js`; fra 07.10.2026 ligger håndjuksa montert i båten fra start og første fiske går uten is, mens naustet ikke selger noe): kartplotteren, rute til ringen ved Gisundet nord (med «Autonav» fremhevet), minst 2 timer fisketid, «Kast loss», «Neste»-brikka og ventingen mens båten går ut, fisket og «Jukse selv», dekksarbeidet, full last, rute til Botnhamn med «Autonav», «Kast loss», gjennomgangen på vei inn, levering, sluttseddelen, isen (steget `ice`: Marked → Is, første fylling på 150 kg er på mottaket, som kjenner igjen den gamle båten, og prisen nevnes ikke) og «Neste mål». `tests/icestep.py` dekker jakta, naustet og isesteget.
- **Fiskelykke og haill like før første fiske** (05.10.2026, Jonas: «Spilleren burde introduseres for "fiskelykke" og haill-appen like før han skal fiske første gangen»):
  - Båten venter på feltet til luksushaillen er aktivert (`tutWait`, `core/05-vessels.js`).
  - Der forklarer `luck` hva fiskelykke er, og `haill` henter den gratis luksushaillen i Haill-appen.
  - `luckhud` viser haill-linja i statusboksen, som blekner trinn for trinn.
- **Gjennomgangen på vei til mottaket** (05.10.2026, Jonas: «… når brukeren har fisket og er på tur til nærmeste fiskemottak. Da må det tas en gjennomgang på alt fra statusfanen, dekksdagboken, appene, kamera, innstillinger, værsystemer»):
  - `tour` og `hud`: statusboksen og «–»/«+».
  - `book`: dekksdagboka. Steget er gjort når den åpnes, fordi tipset er skjult mens boka er åpen.
  - `cam` og `cam2`: til broa med kameraknappen og tilbake. Steget hoppes over uten 3D. Kinoknappen nevnes.
  - `apps`: telefonens hjemskjerm.
  - `vaer`: Vær-appen med varselet for 48 timer og risikofargene.
  - `innst`: innstillingene.
  - Hvert av disse stegene leses ferdig med «Skjønner». Båten seiler videre imens, og venter ved kaia hvis den kommer fram først.
- **Kapittel 1 omskrevet (10.10.2026, etter `docs/onboarding.md` og Jonas' svar der):**
  - **Starten er inne i naustet.** Når åpningen er ferdig og båten står ved fars naust, åpner `tutNaustTry` NAUST3D så snart notatboka er klar (`NOTEBOOK.atNaust() && NAUST3D.ready()`), og gir opp etter 25 s eller uten 3D (`m.naustOpened`/`m.naustGaveUp`). Tre linjer med «Skjønner» (`n1`–`n3`: naustet, det han etterlot, trofeveggen), så `nout` på «Gå ut». Når naustet lukkes, glir kameraet fra kaia foran naustet inn til den vanlige plassen bak båten på 5 s (`G3.intro(sec)`, `INTRO` i `view3d.js`, `tutIntroGo`), og `intro` forteller om båten.
  - **Ut:** `gps`, `route1` (ett trykk på feltet; antall fisketimer settes til 2 av veiledningen selv, `fish2` leses ferdig av seg selv), `cast1`, `chip` (Neste mål-brikka), så underveis `kino`/`kino2` (kinoknappen og tilbake), `cam`/`cam2` (broa, snu seg, kikkerten nevnes) og `sail`. Stegene på sjøen hoppes over når båten er framme (`arrived()`) eller uten 3D (`no3dv()`), slik at ingen av dem stopper noe.
  - **På feltet** som før: `luck`, `haill`, `luckhud`, `fish`, `deck` (bløgging og sløying), `full`.
  - **Hjem:** `route2` og `cast2` med Autonav (Jonas' svar 2: manuell rute med kursliste læres på tur 2), `legs` viser kurslista i panelet, så `tour`, `hud`, `apps`, `vaer` (varselet og hva som skjer over grensen), `salg`, `regler`, `redning`, bare så mange som rekker før båten er framme.
  - **Levering:** `land`, `slip` (sluttseddelen), **`reg`** (registrering som «skriv under i eget navn», `guestAsk('tut')`, med «Senere» som `#tipAlt` → `m.regLater`; ferdig når spilleren ikke er gjest), `book`, `ice`, `beh` (Beholdning i skuffen), **`crew`** (den første kandidaten fra `PHONE.candidates()` står på kaia; «Mønstre på» kaller `PHONE.hire(id)`, «Nei takk» → `m.crewLater`; valgfritt, Jonas' svar 1), `goal`. `innst` er tatt ut.
  - **Fars torsk** (Jonas 10.10.2026: «en utstoppet torsk der som er fars rekord»): `FAR_REC` i `core/09b-records.js` (torsk, 24,6 kg, juksa, mars 1998, utenfor hjemhavna). Den henger på en lakkert plate midt på veggplata over øverste rad kroker (`FAR_AT` i `ui/09c-naust3d.js`; over ramma sto den bak takbjelken), uansett om veggen er satt i stand, med etikett over fisken (`[data-s=far]`), kort (`farCard`: historien, og spillerens egen torsk ved siden av). Første torsk over 24,6 kg gir meldingen «Du slo fars torsk» (`S.farBeat`). `n2` i veiledningen ringer inn selve fisken (`rect` i tipset, `NAUST3D.farRect()`; `tutRect` tar nå også `T0.rect`). `tests/tut.py` leser sluttseddelen mens `slip`-steget viser den (den forlater siden fire spilltimer etter salget), og sjekker at registreringsmerket ikke nevnes.
  - **Tipset har en nei-knapp** (`#tipAlt`, dempet) for stegene med et valg (`alt`/`altAct` i `TSTEPS`).
  - **Måling:** hvert steg sender `tut_step {id, s, settled}` (`tutEv`; `settled` når et senere steg merket det), og slutten `tut_done {s}`. Admin viser trakten per steg (`TUT_STEPS`, `tuView` i trakt-fanen, `admin_tut(weeks)` i `supabase/migrations/20261010100000_tut_steps.sql`).
  - `tests/tut.py` har den nye rekkefølgen (`ORDER`), stegene som kan hoppes over (`SKIPPABLE`), og sjekker at naustet åpnet seg ved start og at mannen på kaia ble mønstret på.
- **Kartet er lastet før spilleren slippes inn** (Jonas 10.10.2026: «Alt burde være ferdig innlastet så snart den nye spilleren har kommet forbi innlastingsskjermen», etter at kartplotteren i Vannvåg bare viste dybdetall til spilleren zoomet ut og inn): `chooseStart` (`ui/08c-start.js`) laster nå med `mapPreload` (`core/01b-mapdata.js`) alle slags pakker som første tur bruker rundt havna, feltet og leveringsstedet (sim og chart 8 km, view og vec 10 km, far 30 km), fire om gangen, hver prøvd tre ganger (og `mapFetch` fem), med «Laster kartet · n av m» på knappen. Kommer noe ikke fram, står det «Kartet kom ikke fram. Sjekk nettet og prøv igjen.» med «Prøv igjen» i stedet for at spillet starter uten kart (før gikk det videre med båten på feil sted). Kartplotteren ber om en pakke som feilet på nytt etter 3 s, opptil fem ganger (`chartPump`). Ikke reprodusert lokalt (pakkene kommer for fort på localhost); mekanismen er målt med blokkerte pakker.
- **Landsdelslista** (`.stp`, `ui/08c-start.js`): `align-items:flex-start`, slik at boksens bunnpolstring teller med i rullehøyden; før lå de to siste landsdelene (Vestlandet, Rogaland og Sørlandet) bak «Start her»-linja.
- **Håndboka og dryppene, kapittel 2–6 (10.10.2026, `ui/07c-handbook.js`, `docs/onboarding.md` 3–4):**
  - **Et drypp** er ett tips som kommer første gang noe skjer etter første tur, i veiledningens egen boks uten det dempede laget, pekende på knappen når det finnes en (`show()` gir samme `T0` som veiledningens steg: `phoneApp`, `hbDock`, `el`). Knappene er «Skjønner» (`hbDone`) og «Jeg kan dette» (`hbSkip`: resten av kapittelet legges til ro). Ett om gangen, minst 90 s mellom (`HB_GAP`), aldri i første tur, i et vindu, i boka, i jukse-spillet, i naustet eller på puben. `tutUpdate` gir boksen til `hbUpdate()` når `S.tut` er 0; plasseringen av boksen er skilt ut i `tipPlace(txt, T0, o)` og deles.
  - **Tipsene** (`HB`, 26 stk. med `id`, `ch`, `t` (kort navn), `no`/`en`, `when()` og `show()`): kapittel 2 egen rute, Fiskeguiden, ekkoloddet, flo og fjære, «Kan jeg fiske her?», Sesong, Kystposten, Meldinger; 3 hvile, kulda, diesel, rorbua; 4 driftsplanen, Salgslaget og topplista, Milepæler, Si fra, Patchnotes; 5 oppdrag (med trim nevnt som det det gjør), utstyrsbutikken, verftet, neste båt; 6 venner, andre båter, puben, rederiet, kvoten. Alle `when()` kjøres i `try` (`hbTry`), så et manglende felt stopper ingenting.
  - **Tilstand:** `S.hb = {seen:{id:t}, skip:{ch:1}, cur, at, force}`. Et spill med fem landinger når boka kommer, får alle kapitlene til ro fra start (ingenting drypper over en gammel skipper; appen har alt). Hvert drypp sender `hb {id, how:'seen'|'skip'}` til skyen; admin viser per tips hvor mange som leste det og hvor mange som hoppet over kapittelet derfra (`admin_hb(weeks)` i `supabase/migrations/20261010120000_hb.sql`, `hbView` under trakt-fanen, `HB_TIPS` med navnene). Et tips mange hopper over fra, kommer for tidlig eller sier for lite.
  - **Appen «Håndboka»** på telefonen (`HBUI.page()`, APPS `handbok`): søkefelt (`#hbQ`, filtrerer på navn og tekst), fem kapitler med telling og en knapp «Jeg kan dette»/«Vis tipsene» per kapittel (`hbskip`), hvert tips som kort med prikk når det ikke er sett, og «Vis meg» (`hbshow`: `HBUI.show(id)` lukker telefonen og lar tipset peke til «Skjønner»). Prikken på appikonet på hjemskjermen er antall tips som er klare og ikke sett (`hbReady()`).
  - `tests/hbtest.py` (lett, begge formater): gammel skipper får ingen drypp, første drypp etter første tur uten dempet lag, «Skjønner» og ventetiden, «Jeg kan dette» legger kapittelet til ro, ingenting i første tur, appen med kapitler, prikker og søk, «Vis meg» peker på telefonknappen.
- **Lagringer midt i første tur:** et steg regnes som gjort når et senere steg er merket (`tutStep`). Da møter ikke en lagring fra før endringen nye steg bak seg.
- **Visning:** Et dempet lag med hull rundt målet og en pulserende ring (z-index 61–62, over telefonen), med tipset over (63). `tutRect()` gir målet.
- **Garantert første fangst** (`S.tut.catch`): Så lenge flagget er satt, ligger det en ekte skreiflekk på feltet i Gisundet nord (`tutBonus`, `TUTB`, `TUT_FIELD`). Den gir rundt 175 kg/t for én person i sentrum og en tidel ved kanten av ringen, i samme miks som påfyllingen (72 % torsk, 18 % sei, 10 % hyse). Flekken legges oppå bestanden og fiskes ikke ned, så ekkoloddet og varmekartet viser det båten får.
  - `fish()` fyller fortsatt på, så lasten er full når fisketida er ute, men påfyllingen er nå et sikkerhetsnett: rundt en firedel av fangsten i stedet for ni tideler (`window.TUTTOP` teller den i testene). Bare bestandens egen andel av fangsten trekkes fra bestanden.
  - `risk()` og snuing for vind er slått av, og i jukse-spillet kommer nappet etter 4–8 s. Flagget nullstilles ved første levering.
- **Haill:** Kommer båten fram før haillen er hentet, venter den på feltet (`b.tutWait`) og begynner å fiske når haillen er om bord.
- **Sperrer** (`tutAllow`): «Kast loss», nye punkter og levering bare på sine steg. Puben, kveiteutstyret, driftsplanen, «Hjem samme vei» og levering andre steder enn Botnhamn er skjult til veiledningen er ferdig.
- **Ingen nødutgang:** knappen «Hopp over veiledningen» (etter 20 minutter uten fremgang) er fjernet. Steget leses fra spilltilstanden og milepælene i `S.tut`, som lagres, så veiledningen fortsetter der den slapp etter at spillet har vært lukket.
- **Knappelinja:** Veiledningen peker på Verft og så Fiskeutstyr (`dockApp()`), på «Jukse selv» og statusfeltet i knappelinja, og på Marked, Lever og «Lever» i skuffen. Sluttseddelen vises i skuffen under Marked, Lever.

## Onboarding 2 (27.10.2026, `docs/planer/onboarding-2.md`)

Jonas valgte 1A–8A og sa «kjør på» 27.10.2026. Fasene O0–O6 står i planfila med status.

### O0: tida til første fisk måles

- **Klokka for første tur** (`S.tutT`, kopieres inn i `S.tut.T` når båten tas over): `take` når brevets «Ta over» trykkes (`08b-letter.js`), `pick` ved «Start her» og `map` når kartet rundt startstedet er inne (`08c-start.js`). Et spill som ble begynt før dette, har ingen klokke, og tidene sendes som `null`.
- **Hendelsene:**
  - `tut_load {r, home, letter, map, naust}` sendes én gang når fars naust er åpnet i 3D, eller når spillet har gitt opp naustet (uten 3D, eller ikke funnet innen 25 s). Da er `naust` `null`. Alle tider er ekte sekunder fra «Start her», og `letter` er fra brevet til «Start her».
  - `tut_fish {r, home, s, sBoat}` sendes ved første fisk om bord (`holdTotal() > 0`, `m.fish1`). `s` er sekunder fra brevets «Ta over», `sBoat` fra båten ble tatt over.
  - `tut_step` og `tut_done` har med `r`, landsdelen til startstedet (`REGIONS` i `08c-start.js`, lagret som `S.tut.reg`).
- **Admin:** «Første tur per landsdel» i trakt-fanen (`ttView`, `admin_tut_time(weeks)` i `supabase/migrations/20261027120000_tut_time.sql`). Den viser hvor mange som begynte, fikk fisk og fullførte, tida til første fisk (median og 90 %), andelen med første fisk innen 5 minutter, og tida for kartet og naustet etter «Start her». Hendelser fra før 27.10.2026 står som «Uten landsdel». `sqltest` dekker funksjonen.
- **Målingen hadde ikke stoppet** (sjekket 27.10.2026): to spillere sender hendelser hver dag, men ingen nye spillere har begynt siden 13.10.

### O1: første tur langs hele kysten

- **Feltet** (`tutFieldNear(pt, land)` i `08c-start.js`):
  - Det søkes i tre ringer. Først 1,5–2,5 km ut, så 3–6 km, så 1–10 km i 10–250 m dybde. Kartet lastes nå 10,5 km rundt startstedet.
  - Et felt må ha sjø under båtens forsiktige grense de neste seks timene, og juksa må få fiske der på datoen (`ruBlockMsg`). Ellers ville båten blitt liggende og ventet der (`05-vessels.js`), og veiledningen hadde stått fast.
  - I hver ring velges plassen som er verdt mest: mengden av hver art ganger ukas pris, litt mindre jo lenger ut. Da blir det torsk der torsken står, og ikke bare sei fordi seien er tettest.
  - Finnes det ingen slik plass (aldri sett), legges feltet i det mest skjermede vannet 2 km ut. Feltet mangler aldri, så ringen havner ikke lenger i Gisundet for en start et annet sted.
- **Miksen** (`S.tut.f.mix`, `tutMixAt`):
  - Den består av juksas fisk (torsk, sei, lyr, hyse) som står der nå (`density`), og som er lovlig der på datoen. Arter under 5 % tas ut.
  - Mottaket må ta imot arten. Tar mottaket ingen av dem, spørres det ikke.
  - Torsk tas ut av miksen utenfor grunnlinjen i Skagerrak, øst for Lindesnes, der norske fartøy ikke får fiske torsk (FOR-2022-12-16-2281 § 1, samme regel hvert år). Regelmotoren har ikke Skagerrak-laget ennå (`BACKLOG.md`).
  - `tutBonus` og påfyllingen i `05-vessels.js` bruker miksen (`tutMixOf()`). Mengden er fortsatt garantert. Den gamle skrei-miksen (`TUTB.mix`) gjelder bare spill uten `f.mix`.
- **Test:** `tests/tutcoast.py` tar hvert fjerde startsted og det nærmeste startstedet til Oslofjorden, Kristiansand, Egersund, Bergen, Ålesund, Bodø, Vangshamn, Hammerfest og Båtsfjord. Det gir 47 steder, i januar og i juli, og tar rundt 15 minutter. Med `--all` tas alle stedene, og det tar rundt en time. Bergen og Hammerfest har ikke noe mottak i registeret, så Bøvågen og Forsøl står for dem. Testen holder spillets løkke (`TAB.held`) mens klokka flyttes. Den første utgaven hang på det. Testen sjekker:
  - at det finnes et felt ved hvert sted
  - at feltet er lovlig for juksa og for hver art i miksen på datoen
  - at ni av ti felt ligger innen 2,5 km, og ingen over 10 km
  - at søket tar under 1,5 s
  - at det ikke kommer feil
- **Stikkprøven 27.10.2026** (samme 47 steder, gammel kode mot ny):

  | | Gammel januar | Ny januar | Gammel juli | Ny juli |
  |---|---|---|---|---|
  | Felt funnet | 47 | 47 | 47 | 47 |
  | Ulovlige felt | 0 | 0 | 0 | 0 |
  | Over 2,5 km ut | 32 | 4 | 36 | 1 |
  | Turen ut, median | 3,6 min | 1,8 min | 3,6 min | 1,8 min |
  | Lengste tur ut | 5,4 min | 7,9 min | 5,4 min | 4,9 min |
  | Søket, lengst | 278 ms | 567 ms | 199 ms | 105 ms |
  | Miksens verdi, median | 44,3 kr/kg | 31,4 kr/kg | 32,8 kr/kg | 28,7 kr/kg |

  - Ingen av de 47 stedene ga et ulovlig felt med den gamle koden heller, så feilen med feltet i et stengt gytefelt er ikke sett i praksis, bare funnet i koden.
  - De fire stedene over 2,5 km i januar er Egersund, Skudeneshavn, Hidrasund og Bokn: Rogaland med gytefelt og åpen sjø.
  - **Første levering blir mindre verdt.** Miksen er den lokale, ikke 72 % torsk overalt, så den er rundt 30 % mindre verdt per kilo i januar. Det gamle tallet kom fra et oppdiktet skreifelt hele året. Om første levering trenger flere kilo for å kjennes like god, tas i O3, sammen med fisketida (V2).

### O2: fram til første napp (27.10.2026)

- **Naustet er én linje** (`n1`), og den peker på fars torsk (`NAUST3D.farRect()`). `n2` og `n3` er tatt ut; de ble trykket bort på 1–2 s hver.
- **På vei ut:** `chip`, `kino`, `kino2`, `cam` og `cam2` er tatt ut som steg. `sail` er nå ett lite tips som ikke må besvares og forsvinner etter 9 s: «Neste» viser når båten er framme, og Kino og broa nevnes (V4 A). Fire av sju spillere 11.–13.10.2026 sluttet på dette stedet.
- **Ingen dempet lag** (V3 A): `tipPlace` viser bare ringen og boksen, også for dryppene i Håndboka.
- **«Kast loss» sier selv hva den venter på** (`tutStartWhy`, vist over knappen i rutepanelet i `07-guide.js`): «Legg et punkt i ringen … først» eller «Ruta skal ende i …». Knappen er grå til det er gjort, i stedet for en toast etter trykket. Sperrene i `tutAllow` er som før.
- **Ikke gjort i O2:** «Lever» som grå knapp (levering andre steder enn mottaket for første tur er allerede skjult), og `deck` ved første fisk (kommer med O3, sammen med fisketida).
- `tut.py`: ny `ORDER` (`n1`, `nout`, `intro`, `gps`, `route1`, `cast1`, `sail`, …), `sail` kan hoppes over når båten er framme.
- **Energien står stille under første tur** (27.10.2026, Jonas: «Kan vi ikke bare skru av energien til etter tutorialen?»): `energyMinute` (`core/15-energy.js`) trekker ikke energi, vekker en sovende og tar bort døsingen så lenge `S.tut.v === 2`. Før kunne en spiller som gikk fra båten i mange timer midt i turen sovne, og båten drev i land der ruta hjem ikke fant noen vei. Energien går som vanlig fra minuttet etter første tur. Skippertak er ikke berørt, og gjester kan ikke kjøpe noe i første tur uansett.

### O3: fisket (27.10.2026, V1 A, V2 A)

- **Ingen haill i første tur:** `luck`, `haill` og `luckhud` er tatt ut, båten venter ikke lenger på feltet (`tutWait`; en lagring som venter, begynner å fiske), og første tur gir ingen gratis luksushaill (`tutFree('haill')` er alltid usann). Luksushaill er bare gaven ved registrering (`CLAUDE.md`). Haillen kommer som dryppet `lykke` (kapittel 2) første gang båten fisker etter første levering.
- **Én times fisketid** (`TUT_FISH_H` i `core/03-simulation.js`, ti ekte minutter), og påfyllingen fyller til halvt lasterom (`TUT_HOLD`, `tutTarget()`, 175 kg i trebåten). Leveringen venter ikke på full last: `full` er ferdig når fisketida er ute.
- **`deck`** viser «Rykk når det napper» til første fisk er om bord, og bløggingen etterpå.

### O4: hjem og mottaket (27.10.2026, V5 A)

- **Første tur er nå 15 steg:** `n1`, `nout`, `intro`, `gps`, `route1` (`fish2`), `cast1`, `sail`, `fish`, `deck`, `full`, `route2`, `cast2`, `land`, `slip`, `reg`, `goal`. `legs`, `tour`, `hud`, `apps`, `vaer`, `salg`, `regler`, `redning`, `book`, `ice`, `beh` og `crew` er tatt ut.
- **Den åpne oppgaven er isen:** `goal` sier «Før tur 2: fyll iskassa på mottaket». Første fylling venter gratis etter første tur (`S.iceFree`, satt i `tutFinish`, brukt opp i `14-act.js`).
- **Sluttseddelen i første tur** har to nye linjer (`portSlip` i `07-guide.js`):
  - **Vanlig fiske her:** at turen var ekstra god, og hva håndjuksa vanligvis gir der nå. Tallet er fangsten ganger bestandens andel av tettheten på feltet (`S.tut.fk`, summert i `05-vessels.js`) per fisketime, rundet til 10 kg. Det retter backloggen 10.2.
  - **Andre fiskere:** at andre har levert på mottaket det siste døgnet, og mest av hvilken art (`WSH.mkt`, felles verden). Linja står bare når det finnes slike leveringer. Det skrives aldri et oppdiktet tall.
- **Nye drypp** (`07c-handbook.js`):
  - Kapittel 2: `is` (først, ved mottaket med under 50 kg is), `bok`, `status` og `beh`.
  - Kapittel 3: `mannskap` (når fisken hoper seg opp på dekk, eller ved andre levering), `vaer` (når sjøen nærmer seg båtens grense) og `redning` (ved motorstopp).
  - `topp` (Salgslaget og topplista) kommer rett etter første levering, ikke etter tredje.
  - Admin-lista `HB_TIPS` har de nye dryppene.
- **Tester:** `tut.py` har ny `ORDER` og sjekker isen som åpen oppgave, linja om vanlig fiske, og at ingen er mønstret på. `icestep.py` del 3 prøver isen som drypp etter første tur.

