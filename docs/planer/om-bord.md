# Om bord: revisjonen av kystflåten (OB0, 09.11.2026)

Steg 69 i `docs/planer/koen.md`, Jonas' økt på grenen `ccr-59f8e7e6-m00yni`. Bare måling og plan: ingenting i `src/`, `tools/boats/` eller modellene er endret. Det som er laget, er opptaksverktøyet `tests/ombord.py` og denne fila.

Jonas 09.11.2026: «Grafikken er svært viktig i mine øyne. Jeg ønsker jo at båten skal fungere så ekte som mulig, at arbeidet ombord utføres på en så ekte måte som mulig, at mannskapet oppfører seg som ekte mennesker, at utstyr står plassert på rasjonelle og logiske plasser, at utstyr opereres på en realistisk måte, at ingenting clipper inn i andre ting, rett og slett at vi på en så realistisk måte som mulig klarer å simulere hverdagen til en fisker ombord i båten. Det er det som er viktigst for meg.» Og: «kystflåten er MVPen.»

Kapitlene: 1 hvordan det er målt, 2 skalaen og karakterene, 3 funnene som gjelder alle båtene (koden er felles), 4 båt for båt, 5 båten i sjøen, 6 fasene, 7 valgene, 8 det usikre.

## 1. Slik er det målt

- **Opptakene** (`tests/ombord.py`, ikke i `run.py`): spillet settes i hver operasjon med spillets egne funksjoner (`depart`, `startSet`, `startHaul`, `addCatch`, `dock`, `startLanding`, `restStart`; oppskriftene står i fila), og hver operasjon tas opp for seg, 9–16 sekunder spilltid, liggende 640×360 og stående 360×640, med tre skjermbilder (tidlig, midt i og sent i operasjonen) der kartet, statusboksen og kompasset er tatt bort (`S.settings.hudOff`, som «Vis HUD» av i innstillingene) så de ikke dekker båten. Verktøyet skriver ut hva hvert klipp viste: hendelsene på dekk (`G3._debug.dk.n`: hugget, plukket, jukset opp, bløgget), stasjonene til hver i mannskapet (`CREW3D.agents()`), skaden på skroget, og klippesjekken fra `crewclip` (`clipNow`: armer og bein i stillingen mot modellen, `bodyHits`: kroppen på veien, og om noen står utenfor dekket).
- **SwiftShader tegner under ett bilde i sekundet.** Siden går derfor på en sakte klokke (alle klokkene i siden, `performance.now`, `Date`, tidtakerne og `requestAnimationFrame`, går på 0,12–0,15 av ekte tid), og videoen spilles fort fram igjen. Klippene har spillets eget tempo, men bare 3–5 bilder i sekundet. Bevegelsene og plassene kan vurderes, ikke bildetakten.
- **Ingen videoopptak** (Jonas 09.11.2026: «Ny regel: Ikke ta videoopptak. Kvaliteten er alt for dårlig og hakkete. Jeg kan sende deg klipp fortsatt.»): `tests/ombord.py` tar bare bildene (standard fra OB1; `--video` skal ikke brukes). Klippene som trengs, sender Jonas.
- **Bildene, ikke videoene, går til Jonas.** Jonas 09.11.2026: «Du trenger ikke sende de videoene. De er alt for hakkete uansett. Men send meg gjerne bilder, men sørg for å minimere kartet og statusboksen så de ikke dekker over båten i bildet.» Videoene brukes bare i revisjonen (sammendragsark med seks bilder per klipp) og ligger ikke i git; skjermbildene ligger som jpeg i `docs/okter/2026-11-09-ob0/`.
- **Lesingen:** grunnlagene og byggefilene for hver båt i `docs/skipsmodeller/`, kartleggingen, planlisten, `batplan.md` kap. 8 og 10, `grafikk-batmodeller.md`, systemdokumentene og koden for operasjonene (`core/10-gear.js`, `core/13-work.js`, `deckcrew.js`, `view3d/09`, `10`, `12`, `13`, `15`, `20`). Fil og linje står ved funnene.
- **Hva en fisker gjør:** kildene er grunnlagene og planlisten i `docs/skipsmodeller/` (referansebåtene i `referanseanalyse-runde-2.md`, planlistens SJK-, LIN-, GRN- og TEI-punkter), Mattilsynets side om bløgging og sløying (bløgging straks, sløying snarest mulig etter utblødingen, fisk som skal bløgges skal også sløyes, med unntak; https://www.mattilsynet.no/mat-og-drikke/matproduksjon/fisk-og-sjomat/regler-ved-fiske-landing-og-omsetning-av-fisk/blogging-og-sloying) og det som er alminnelig kjent om kystfisket. Der en kilde mangler, står det.

## 2. Skalaen og karakterene

Godkjenningsgrensen er Jonas' (01.11.2026): ingenting under 75/100. Grunnlagene setter karakteren i fritekst («holder» og «trekk»), og ingen vekter er skrevet ned. Planlistens benchmark (kap. 30 i `planliste-fiskefartoy.md`) er aldri regnet ut, og den kan ikke gi 75 før materialene (F2 i `grafikk-batmodeller.md`) er bygd: 3 poeng krever ferdige PBR-materialer, så en modell der alt er riktig, får 66,7 %.

**Jonas' skala (valg 17, 09.11.2026):** «Skrogutforming 20, Detaljer, 15, lanterner 5, Styrhus, 10, Arbeidsflyt 20, utforming av dekk 20.», og da summen ble 90: «Da blir det detaljer 20 og arbeidsflyt 25.» Grensen 75 står.

| Punkt | Vekt | Hva |
|---|---|---|
| Skrogutforming | 20 | Skroget som én flate, jevne linjer, kjøl og undervann, vekta mot `disp` (den tomme båten, valg 18) |
| Detaljer | 20 | Hull, beslag, slitasje, det som gjør båten troverdig på nært hold |
| Lanterner | 5 | Etter loven, sett i spillet om natta |
| Styrhus | 10 | Styrhuset og broa, også fra skipperens øye |
| Arbeidsflyt | 25 | Arbeidet om bord: operasjonene i kapittel 4 (rekkefølgen, grepene, mannskapet, ingen gjennom noe) |
| Utforming av dekk | 20 | Dekket og plassene: utstyret der fiskeren arbeider, gangveiene, garnbinger, stamper, teiner, kar og luker |

Kildene (bildene fra valg 22, oppgitt og vist Jonas) og testene er ikke egne punkter; de er det som gjør at punktene over kan settes. Hver fase setter karakteren etter denne skalaen med begrunnelse per punkt, og økta setter den endelige som en egen evaluering (Jonas 10.11.2026).

**Karakterene under er satt før Jonas valgte skala**, etter en rekonstruksjon av grunnlagenes fritekst med åtte punkter (kilder 15, skrog og vekt 20, detalj 15, lanterner 5, broa 10, arbeidsflyt og plasser 15, kontroller og tester 10, prosessen 10). De viser rekkefølgen og hvor langt unna båtene er; fasene setter dem på nytt etter Jonas' skala.

**Fra revisjonen:** arbeidsflyten (25) settes etter operasjonene i kapittel 4, og en båt bør ikke få mer enn rundt 60 % på den så lenge et funn med alvor A står åpent for henne (forslag; Jonas avgjør).

**Karakterene** (satt i grunnlagene; trebåten, skiffen og snekka er forslag fra denne revisjonen, med punktene i kapittel 4). Karakteren settes av økta som bygger, som en egen evaluering (Jonas 10.11.2026: «Det er ikke jeg som skal sette karakter»), og en båt regnes som ferdig ved 75 eller mer.

| Båt | Satt i grunnlaget | Etter OB0 | Kapittel |
|---|---|---|---|
| `kyst15` | 76 (godkjent) | **71**, under grensen; etter OB12 **68** (egen evaluering, Jonas' skala; eksportert på nytt) | 4.9 |
| `breisjark` | 72 | **68**; etter OB11 **68** (egen evaluering, Jonas' skala) | 4.8 |
| `snekke` | ingen | **67** (forslag) | 4.3 |
| `sjarkny` | 70 | **66**; etter OB10 **71** (egen evaluering, Jonas' skala) | 4.7 |
| `plastsjark` | 66 | **63** | 4.4 |
| `trebat` | ingen | **63** (forslag) | 4.1 |
| `sjark` | 64 | **61** | 4.5 |
| `hurtigsjark` | 62 | **59** | 4.6 |
| `skiff` | ingen | **57** (forslag) | 4.2 |
| `kyst21` | ingen (ikke revidert) | **48** (grovt anslag); etter OB13 **70** (egen evaluering, Jonas' skala; bygd på nytt) | 4.10 |

Ingen av de ti er over 75 etter klippene. Det som trekker ned, er nesten bare K6 (arbeidsflyten og plassene): funnene med alvor A i arbeidet. De fleste av dem ligger i den felles koden (kapittel 3), ikke i modellene, så OB2–OB4 løfter alle båtene samtidig.

## 3. Funnene som gjelder alle båtene

Koden for arbeidet er felles for kystflåten, så det meste som er galt, er galt på alle båtene samtidig. Alvoret er etter hvor mye spilleren ser det: **A** ses hver tur fra første uke (trebåten og juksa først), **B** ses ofte, **C** ses sjelden eller bare på nært hold.

| # | Operasjonen | Hva som er galt | Hvorfor det ikke er ekte | Kilde i koden | Alvor |
|---|---|---|---|---|---|
| F1 | Fortøye og kaste loss | Tauene flyr av seg selv fra klampene til pullertene, ett om gangen hvert 1,2 s, og trekkes inn av seg selv. Ingen på dekk eller kai tar i dem. Fenderne dukker opp når båten er halvveis inn, alltid tre om styrbord. | Mannskapet henger ut fendere før kaia, én går i land eller kaster tauet til en på kaia, springene først; på håndbåtene gjør skipperen alt selv. | `view3d/15-env-mooring.js:113–160`; `deckcrew.js` leser ikke `MO` | A |
| F2 | Kaste loss | Mannskapet går inn døra mens tauene tas inn (pausen `inside` under `unmooring`). | Mannskapet tar inn tau og fendere og rydder dem før de går inn. | `core/13-work.js:294–296` | A |
| F3 | Inn til kai | `dock()` setter båten i havn med en gang, mens 3D bruker 6–45 s på å gli inn; skipperen forlater roret og mannskapet tar pauser på dekk mens båten ennå er i fart. | Skipperen står ved roret til båten ligger fortøyd. | `core/05-vessels.js:930`, `core/13-work.js:138` | A |
| F4 | Sette line og garn | Redskapet løper over hekken fra stampen eller garnkaret, men ingen står akter. De som skal hale, står ved haleren i trekkestilling uten noe å gjøre. | Lina settes fra stampen over en setterenne akter mens én passer stampen og kaster ut ankeret og blåsa; garnet settes fra binga over hekken, én passer at det ikke hekter seg. | `view3d/10-gear.js:232` (`drawSetting`), `core/13-work.js:258` | B |
| F5 | Sette på håndbåtene | Fiskerens hender pumper ved haleren likt når det settes og når det trekkes. | Ved setting går redskapet ut over hekken eller ripa fra stampen, haleren står. | `view3d/13-instruments.js:245–248` | B |
| F6 | Teinetrekk på skiffen og trebåten | Fangsten fra teinene går samme runde som fisken: tatt inn ved rekka og «bløgget» med kniv, krabben også. | Krabbe og hummer bløgges ikke; de sorteres, og de som skal leveres, legges levende i kar eller kasser. | `view3d/13-instruments.js:249`, `core/10-gear.js:603` | B (lest i koden, sjekkes i klippene) |
| F7 | Teinene om bord | Teinestabelen tegnes aldri på skiffen og trebåten, og ingen av de ti har en egen plass for teinene (`kit.pots`). | Teinene står stablet og surret på dekk før de settes og etter at de er trukket. | `view3d/10-gear.js:326` | B |
| F8 | Stampene og garnet | Høyst 8 stamper tegnes (4 under 8 m) og én garnhaug i ett kar uansett hvor mye som er om bord (D3, D4 i kartleggingen). | 30 garn eller 24 stamper fyller dekket; det er det som gjør at en sjark ser ut som en garnsjark. | `view3d/09-landing-deck.js:435, 442` | B |
| F9 | Setterenne, settebord, garnrenne | Ingen av de ti har setterenne eller settebord akter, eller rørramme med hydraulikkslanger; kniv, høtt, linesetter og garnrenne venter som modeller i OPP5 (steg 57). | Planlisten SJK-10, GRN-03, LIN-03 og referansebåtene (RAGNHILD, F-163-NK) har dem. | `planliste-fiskefartoy.md:521–583`, `referanseanalyse-runde-2.md:126–143` | B |
| F10 | Lossing | Båtens eget mannskap gjør ingenting mens mottakets kran løfter; på båtene med rom står mottakets kar på dekk og fylles uten at noen henter fisken opp fra rommet. Båtens egen kran står foldet. | Én står i rommet og fyller karene eller hekter på, én ved luka gir tegn til kranføreren. | `view3d/09-landing-deck.js:287, 585` | B |
| F11 | Ising i havn | Bare isen i renna fra siloen synes; ingen om bord tar imot den. | Isen går i rommet eller i karene, og én fordeler den. | `view3d/09-landing-deck.js:237` | C |
| F12 | Rydde og spyle | Finnes bare som pauser (kost og slange) en stund etter sløyingen, aldri som en jobb når dekket er skittent, og etter koden aldri slangen på de åpne båtene (`core/13-work.js:301`), men den ble sett på snekka. Spyleslange som del av modellen finnes bare på plastsjarken, havsjarken, breisjarken og kyst15 (på snekka synes en slange som pause, `hose`, i klippet). | Dekket spyles etter hvert trekk og før man går inn; det er en fast del av arbeidet. | `core/13-work.js:270–301` | B |
| F13 | Mat og søvn | Kokken, de som sover og skipperen i køya går inn døra og forsvinner. På de åpne båtene uten bysse spiser ingen, med mindre pausen «matpakke» trekkes. | Matpakke og kaffe på dekk eller i styrhuset mellom trekkene er det vanlige på en dagsbåt. | `deckcrew.js:182, 202`, `core/14-crewlife.js:61` | C |
| F14 | Kulde og vått | Kulda og våt hud koster i fisket (`coldPen`), men synes ikke på folkene (ingen hette, ingen som slår armene, ingen gnir hendene). | Det er det første en ser på et dekk om vinteren. | `core/04-crew.js`, `folk-om-bord.md` 5.11 | C |
| F15 | Folk gjennom modellen | Klippesjekken (`clipNow`, `bodyHits`) i klippene fant `me:jig:2` på snekka (skipperen på juksaplass 2 med to lemmer gjennom modellen, sett i bildet: hardtopstolpen gjennom ham), mens `crewclip` er grønn for alle de ti (rød bare for bunntrålen og ringnotbåten). `crewclip` prøver altså ikke alle plassene i alle stillingene; det må rettes i testen før den kan stå som port. Håndbåtene (skiffen og trebåten) har faste figurer og ingen klippesjekk i det hele tatt; der ble to inni hverandre og én utenfor ripa bare sett i bildene. Per båt i kapittel 4. | Klippesjekken skal finne det spilleren ser. | `deckcrew.js:414, 445`, `tests/crewclip.py`, `view3d/13-instruments.js:199` | A |
| F19 | To på samme punkt | To som sløyer (eller iser) står inni hverandre ved bordet eller karet: på havsjarken ved sløyebordet, på trebåten ved karet. Nummer to skal stå 0,7 m forut eller akter, men legges på samme punkt når veien dit ikke finnes; på håndbåtene står figurene fast. | To ved samme bord står side om side eller på hver sin side. | `deckcrew.js:133–137` (`deckAt`), `view3d/13-instruments.js:199` | A |
| F20 | Redskapet settes gjennom huset | Garnet og lina går fra karet eller stampen rett til hekken, også gjennom styrhuset (plastsjarken, styrhuset akter) og redskapsrommet (havsjarken). | Redskapet føres over ripa eller gjennom en renne langs dekket der det er åpent. | `view3d/10-gear.js:232` (`drawSetting`) | A |
| F21 | Folk i klump på én side | De som jukser, står i en klump i styrbord hjørne (plastsjarken tre, havsjarken fire), babord er tom; maskinene står under en meter fra hverandre. | Juksamaskinene fordeles langs begge ripene med armlengdes avstand, så snørene ikke går i hverandre. | `jigRail` (`view3d/13-instruments.js`), `kartlegging-spillet.md` K2 | B |
| F22 | Alltid styrbord mot kaia | Båten legges alltid med styrbord mot kaia, med fenderne og tauene der. På den nye hurtigsjarken står kranen i babord hekk (som tegningen), så den må nå over hele dekket og ut over kaia. | Skipperen legger til med den siden som passer kaia og arbeidet; en kranbåt legger kranen mot kaia. | `view3d/15-env-mooring.js` (`sx * 0.95`), `berthPose` (`core/07-harbours.js:293`) | B |
| F23 | Båtens egen kran | Kranen står riktig, svinger og løfter, men ingen kjører den (de på dekk vinker, `last:at:guide`), ingen på kaia hekter på, og ingen kasse ses i kroken i klippene (hurtigsjarken og den nye hurtigsjarken). | Én kjører kranen fra standplassen, én hekter på. | `view3d/09-landing-deck.js:585`, `deckcrew.js` | B |
| F24 | Haleren uten folk på de store båtene | I alle trekkene på breisjarken, kyst15 og kyst21 står ingen ved haleren eller blødekaret: den som haler og den som bløgger, sendes inn (`haling:in`, `blogg:in`) fordi haleren står mer enn 1,2 m over dekkskartet der de skulle stå (1,25 m på breisjarken og kyst15, 1,30 m på kyst21). På kyst21 er dekket åpent, og i garntrekket er alle inne og dekket tomt. Haleren står der en mann når den; det er regelen som er feil. Lina og garnet går inn i en tom haler. | Haleren betjenes av én som står ved den hele trekket. | `deckcrew.js:190` (grensen 1,2 m mot `ST.G.hauler[1]`), `malo36.py:78–80, 101, 1064`, `kyst15.py:44, 385, 1093`, `kyst21.py:434` | **A** |
| F16 | Garn på skiffen og trebåten | `VESSELS` sier at begge kan rigges for garn, men garnhaleren krever 7,5 m, så det går ikke i spillet. | Små båter setter og trekker garn for hånd eller med en liten haler. | `core/02-species-gear.js:111–121, 255` | C (valg 21) |
| F17 | Roing | Ingen årer og ingen roing finnes; trebåten og skiffen går for motor. | Riktig for båtene slik de er; nevnt fordi det ble spurt etter. | søkt i `src/js` | – |
| F18 | Arbeidet under shelterdekket og lyet synes ikke | På kyst15 er shelterdekket tomt i hele sløyeklippet med 800 kg i karet: de fire står ved bordet og karet i halestasjonen (`sloy:at`, `is:at`), men kameraet over shelterdekket ser ikke inn. På breisjarken skjuler takkanten hodene og hendene til dem som sløyer under lyet. | Riktig plassert (arbeidet skjer under ly), men spilleren ser ikke arbeidet. Kameraet bør kunne se inn i halestasjonen (et eget utsnitt når arbeidet er der, eller lavere og fra siden). | `deckcrew.js:187–190`, `view3d/24-cinema.js:316–335` (kameraet) | **A** |

## 4. Båt for båt

Klippene heter `<fiske>_<operasjon>_<format>.mp4` (operasjonene: `kast` ved kai og kaste loss, `ut` til feltet, `jig` juksa for hånd, `maskin` juksamaskinene, `sloy` fullt kar, bløgge, sløye og ise, `sett`, `trekk`, `rydd`, `inn` inn og fortøye, `loss` losse, `kran` båtens kran, `hvile` mat og hvile).

Felles for alle klippene: **store hvite flekker rundt båten** i mange klipp, ved ripa når fisken kommer opp og i ro. Det er sprutpartiklene: plasket fra fisken og ankeret (`ancSplash`, `view3d/21-rescue-anchor.js:82`) og sjørokken (`driftSpray`) deler bufferen `SD`, som tegnes som punkter med størrelse 90 (`drawPts(n, gl.POINTS, VP, col, 90, true)`, `view3d/24-cinema.js:497`). Nær kameraet blir hvert punkt en stor ugjennomsiktig flekk. Ikke avgjort om det ser likt ut på nettbrettet (SwiftShader kan tegne punktene annerledes); Jonas sjekker det. F3b (steg 67) eier `24-cinema.js` og endrer sjørokken nå, og OPP5 (steg 57) skal lage plasket som modell. **Alvor B** til det er sett på nettbrettet.

**Innseilingen og lossingen tatt på nytt** (alle ti, liggende, med kameraet høyere og innseilingen fra leia 300 m ute; bildene `felles_inn` og `felles_loss` i `docs/okter/2026-11-09-ob0/<båt>/`): lossingen synes nå ovenfra på alle båtene. Mottakets kran løfter, trucken og folkene står på kaia, og båtens eget mannskap står uten oppgave på dekk (F10); på kyst15 er ingen å se. Båten ligger alltid med styrbord mot kaia (F22). Innseilingen starter på sjøen, men kameraet kan havne inne i en bygning eller en tank på land på slutten (trebåten). Fortøyningstauene (F1) er for små til å ses fra den høyden. **Nytt UI-funn:** en snakkeboble fra mannskapet presses sammen til en smal stripe med loddrett tekst i høyre kant i 640×360 (sett i `plastsjark/felles_loss.jpg` og `breisjark/felles_loss.jpg`); ført i backloggen, ikke en del av OB-fasene.

### 4.1 Trebåten (`trebat`, `snekke23.py`): forslag 63/100

Data: 7,0 m, 1,9 t, én i mannskapet og deg, ingen køyer, ett fangstkar på 500 kg på dørken, rigges i spillet for juksa, line og teiner (garn går ikke, F16). Håndbåt: ingen agenter; `drawSkiff` tegner faste figurer (`view3d/13-instruments.js:199`).

| Operasjonen | Hva som er galt | Hvorfor det ikke er ekte | Kilde | Alvor |
|---|---|---|---|---|
| Teiner, trekk | **Kongekrabbeteinene er større enn båten og står gjennom skroget, ripa og skipperen** mens de tømmes og stables. | En teine løftes inn over ripa og settes på dørken eller et teinebord; den får plass i båten, eller båten passer ikke for den teina. | `view3d/10-gear.js:357–400` (`drawPots`: `X.pot.half` 0,7 m, `potDeck` legger den i båten) | **A** |
| Teiner, sett | Bare blåsa synes; ingen teiner om bord og ingen som går ut over ripa (F7). Settingen er over på sekunder. | Teinene står stablet og surret på dørken og går ut én og én med tauet imellom. | `view3d/10-gear.js:326` | **A** |
| Kaste loss, fortøye | Tauene går av og på uten at noen tar i dem (F1). Skipperen sitter ved rorkulten. | På en håndbåt gjør skipperen det selv: tauet av klampen, et skubb fra kaia, så til rorkulten. | `view3d/15-env-mooring.js` | **A** |
| Line, sett | Ingen akter; skipperen og mannskapet står ved haleren i trekkestilling (F4, F5); lina synes ikke gå ut. | Lina går fra stampen over hekken eller ripa mens båten går sakte; haleren står. | `view3d/13-instruments.js:245–248`, `10-gear.js:232` | B |
| Line, trekk | Riktig grep: skipperen ved haleren på styrbord ripe, lina kommer opp. Mannskapet sitter akter uten arbeid; ingen tar fisken av kroken eller kveiler lina i stampen. | Én haler og tar av fisken, den andre bløgger og legger lina i stampen. | `drawSkiff` | B |
| Juksa | Skipperen ved snella på styrbord ripe, fisken opp og i karet. Ser riktig ut. Den andre står ved karet. | | | – |
| Juksamaskinene | Maskinene på ripa, skipperen tar av fisken. Ser riktig ut. | | | – |
| Fullt kar, sløying | **De to står inni hverandre ved karet** (skipperen og mannskapet på samme punkt; tydeligst stående). Ellers riktig: sløyingen ved karet og avfallet over ripa. | To som sløyer, står hver på sin side av karet eller bordet. Håndbåtene har faste figurer i `drawSkiff`, uten agentene som holder folk fra hverandre på de andre båtene. | `view3d/13-instruments.js:199`, sett i `juksa_sloy_staaende.jpg` | **A** |
| Utstyret | Haleren er en grå trommel på en stolpe (U4); snella tegnes i koden; garnet, stampene og lasten står på samme punkt 0,74 m over dørken (`snekke23.py:961–963`, ikke sett i klippene); ingen teinestabel. | Planlisten SJK-04: liten hydraulisk line- eller teinehaler på ripa. | `kartlegging-spillet.md` U4 | B |
| Modellen | Ingen tegning og ingen bilder; volumet 2,11 t mot 1,9 (+11 %); GLB 5,3 MB. | | `trebat-grunnlag.md` | K1, K2 |

**Jonas 09.11.2026, etter bildene av teinene:** «Jeg tror ikke den trebåten skal kunne holde på med krabbeteiner. Det har den åpenbart ikke plass til. Det må i så fall oppdateres i databladet til båten og gjøres slik at spillere ikke kan kjøpe det til den båten heller.» Det betyr: `teiner` ut av `VESSELS.trebat.rigs` (databladet og båtbladet på verftet sier det), og teinehaleren, krabbekaret, teinene og agnet for teiner kan ikke kjøpes til trebåten (regelen i `equipFits` og `buyGate`, så både kjøpet og knappene følger, etter CLAUDE.md «Én logikk i alle kjøpssystemer»). En spiller som alt har teinehaler eller teiner på trebåten, mister ikke pengene: teinene blir liggende på lageret i naustet til en båt de passer på (eller selges tilbake), og haleren går av ved neste verftsbesøk med prisen tilbake som ved innbytte. Bygges først i OB1. Skiffen har samme problem (valg 23).

Karakteren (forslag, skalaen i kap. 2): K1 3, K2 15, K3 13, K4 4, K5 8, K6 6 (teinene gjennom skroget, de to inni hverandre ved karet, settingen uten folk), K7 8, K8 6 = **63**. Det som løfter mest: bilder med kjent lengde (K1), teinene og haleren der fiskeren arbeider (K6), og Jonas' gjennomgang uten nye funn (K8).

**OB1 (09.11.2026, Jonas' økt, grenen `ccr-e474ac41-zlir5x`):** teinene er ute (`rigs`, `fit.rig`, `potsUnfit`; skiffen likt), garnet trekkes for hånd (`handGear`); stampene, garnbinga og frakten står på dørken akter; linehaleren står på stolpen rett forut for fiskeren (`haulFoot`); juksahjulet er en modell etter Jonas' bilde (`tools/gear/vinde.py`); settingen går over styrbord låring med skipperen ved rorkulten og den andre ved stampene; ved trekket legger den andre lina i stampen; skipperen tar tauene selv ved kaia og naustet; de to ved karet står ikke i hverandre (`work.mate`). Funnene i tabellen over med alvor A er rettet, så nær som fenderne og tauene selv (`15-env-mooring.js`, OB2) og skroget (+11 %, venter på bildene etter valg 22 B). Bildene før og etter i `docs/okter/2026-11-09-ob1/`; karakteren etter Jonas' skala som forslag i `trebat-grunnlag.md` kap. 8.3. Karakteren settes av økta som en egen evaluering (Jonas 10.11.2026).

### 4.2 Skiffen (`skiff`, `skiff59.py`): forslag 57/100

Data: 5,9 m, 1,0 t, én og deg, aluminium, 60 hk påhengs, ett kar på dørken, eget sløyebord over babord ripe ved konsollen (`work.own`), rigges i spillet for juksa, line og teiner (garn går ikke, F16). Håndbåt som trebåten: ingen agenter; `drawSkiff` tegner faste figurer (`view3d/13-instruments.js:199`), så json-en har ingen stasjoner, ingen hendelser og ingen klippesjekk for skiffen (`before`/`after` tomme, `clipcheck` null). Alt under er sett i bildene, ikke målt.

Opptakene: kjøringen 03:42–04:06 UTC, liggende, 2,3–3,1 bilder i sekundet. Garn og rydding ble hoppet over (`SKIP`: garnhaleren passer ikke; ingen agenter), kranen likeså (ingen kran).

| Operasjonen | Hva som er galt | Hvorfor det ikke er ekte | Kilde | Alvor |
|---|---|---|---|---|
| Fullt kar, sløying | **Den som sløyer, står utenfor båten**, på utsiden av babord ripe over sjøen, og sløyer inn over bordet mot fiskeren, som står på innsiden. Flaggstanga står foran ham, ikke gjennom ham (retter 4.2 slik den sto). Samme stilling henger igjen i første bilde av linesettingen. | Sløyebordet henger over ripa så avfallet går i sjøen; den som sløyer, står på dørken innenfor og ser utover. | Arbeideren fra `drawDeck` på håndbåtene (`view3d/09-landing-deck.js:792–796`) mot `work.own` (`skiff59.py:765–817`); sett i `juksa_sloy_liggende_2.jpg`, `_3.jpg`, `line_sett_liggende_1.jpg` | **A** |
| Teiner, trekk | **Kongekrabbeteina er like bred som båten.** Den kommer inn over konsollen og fiskeren, løftes og settes akter, der den står gjennom mannskapet som sitter, påhengsmotoren, flaggstanga og styrbord ripe. Krabben ligger i teina. | En teine løftes inn over ripa og settes på dørken eller et teinebord; den får plass, eller båten passer ikke for den teina. | `view3d/10-gear.js:357–400` (`drawPots`, `X.pot.half` 0,7 m, `potDeck`); sett i `teiner_trekk_liggende_1.jpg`–`_3.jpg` | **A** |
| Teiner, sett | Teinene tegnes (retter 4.2, som sa at ingen teiner synes): to teiner i stabel står halvt utenfor styrbord side, gjennom ripa, livbøya, konsollen og skipperen. Stabelen står der fortsatt i første bilde av neste klipp (`line_trekk_liggende_1.jpg`), etter at teinene skulle vært satt. Ingen går med teina til ripa; skipperen står ved haleren. | Som 4.1: teinene står stablet og surret på dørken og går ut én og én med tauet imellom. | `10-gear.js:326` og `:357–400`; sett i `teiner_sett_liggende_2.jpg`, `_3.jpg` | **A** |
| Teinene på skiffen (valg 23) | Ser like galt ut som på trebåten, eller verre: teina er omtrent så bred som skiffen (2,45 m) og har ingen plass mellom konsollen og motoren. | Jonas' avgjørelse for trebåten (09.11.2026) passer like godt her. Anbefaling: valg 23 A. | Sett i alle tre teinebildene | **A** |
| Krabben ved rekka (F6) | Kan ikke avgjøres: med 2,3 bilder i sekundet og ingen hendelsesteller for håndbåtene sees ingen kniv mot krabben, men heller ikke at den sorteres. | Krabbe bløgges ikke. | `13-instruments.js:249` | B (ikke sett) |
| Line, sett | Fiskeren står ved haletrommelen i trekkestilling (F5), mannskapet sitter akter. Lina og stampen sees ikke gå ut. | Som 4.1. | `13-instruments.js:245–248`; sett i `line_sett_liggende_2.jpg` | B |
| Line, trekk | Riktig grep: fiskeren haler ved trommelen på styrbord ripe, lina kommer opp. Mannskapet sitter akter foran motoren med armene rett fram uten noe å holde i, gjennom hele klippet. | Én haler og tar av fisken, den andre bløgger og legger lina i stampen. | `drawSkiff`; sett i `line_trekk_liggende_2.jpg` | B |
| Mannskapet i alt fisket | Den andre om bord sitter på akterbenken i alle fiskeklippene (juksa, maskin, line, teiner) og gjør ingenting. | På en 1+1-båt bløgger, tar av og rydder den andre. | `drawSkiff` | B |
| Juksa | Fiskeren ved håndsnella på styrbord ripe, fisken opp. Ser riktig ut. | | sett i `juksa_jig_liggende_2.jpg` | – |
| Juksamaskinene | To maskiner på styrbord ripe forut for konsollen, fiskeren mellom dem og fisken opp. Ser riktig ut. | | sett i `juksa_maskin_liggende_2.jpg` | – |
| Kaste loss, til feltet | Skipperen ved rattet i konsollen, mannskapet sitter akter: riktig. Tauene kan ikke ses (for langt unna i første bilde); F1 står etter koden. | | `15-env-mooring.js`; F1 | **A** (F1 som felles) |
| Inn til kai | Kan ikke vurderes: kameraet står inne i bygningene og snøen på kaia i det meste av klippet, båten synes ikke. Første bilde har ennå teina fra trekket gjennom konsollen. | | `24-cinema.js:316–335` (`camLift`, `camPull`); sett i `felles_inn_liggende_2.jpg`, `_3.jpg` | C (opptaket) |
| Lossing | Kan ikke vurderes: lasten var 0 i klippet (json `hold` 0). Båten ser ut til å ligge et par meter ut fra fenderpålene (ikke målt; perspektivet kan lure). Ingen om bord gjør noe (F10). | | sett i `felles_loss_liggende_2.jpg` | C |
| Hvile | Skipperen står ved konsollen, mannskapet sitter akter; ingen spiser (F13 som felles). | | | C |
| Hvite flekker | Sprutpartiklene som store hvite flekker rundt båten i de fleste klippene, som felles. | | `24-cinema.js:497` | B (felles) |
| Modellen | 1,60 t ved vannlinja mot 1,0 (+60 %); 90 hk-motoren vises ikke (D6); Jonas fant tre ting selv i revisjonen. | | `skiff-grunnlag.md` | K2, K8 |

**Karakteren:** satt 58 i planen (rapport-modeller.md 3.2 sa 59 med K6 8). Klippene viser tre funn med alvor A i arbeidet som er skiffens egne (den som sløyer, står utenfor båten; teinene gjennom folk, konsoll og motor ved setting og trekk), i tillegg til F1. K6 går fra 7 til **6**, som trebåten. K1 5, K2 12, K3 12, K4 4, K5 7, **K6 6**, K7 8, K8 3 = **57**.

Merk: klippesjekken (`crewclip`, `clipNow`) prøver bare agentene, så ingen av skiffens funn kan fanges av den; de må ses.

**Til Jonas:** På skiffen står den som sløyer, ute i lufta på utsiden av ripa, og krabbeteina er like bred som båten; teinene bør ut av skiffen som av trebåten (valg 23 A).

**OB5 (09.11.2026, Jonas' økt, grenen `ccr-b0ab5771-n45cmj`):** den som sto utenfor ripa, var nummer to ved sløyingen (uten `work.mate` la spillet ham utenfor babord side); han står nå på dørken ved fangstkaret. Skiffen har fått plassene fra OB1 (`set`, `setter`, `coil`, `coilTub`, `moor`, `rail`, `haulFoot`): setting over styrbord låring fra stampene og binga på dørken akter med skipperen ved rattet og den andre på benken, trekket med den andre ved stampen forut for fiskeren, linehaleren på stolpen rett forut for fiskeren, garnet for hånd over ripa. Vannlinja er den tomme båtens (0,96 t mot 1,0; formen er ikke endret), og 90 hk-motoren synes når den er kjøpt (D6). Funnene med alvor A som er skiffens egne, er rettet; teinene var ute fra OB1. Bildene før og etter i `docs/okter/2026-11-09-ob5/`; karakteren som forslag (75) i `skiff-grunnlag.md` kap. 10.3. Karakteren settes av økta som en egen evaluering (Jonas 10.11.2026).

### 4.3 Snekka (`snekke`, `snekke26.py`): forslag 67/100

Data: 7,9 m, 3,0 t, to og deg, plast, 30 hk diesel, hardtop og lugar forut, ingen køyer, fangstkar med is akter og blødekar ved fiskeren, eget sløyebord over babord ripe tvers av haleren, rigges for alle fire (garnhaleren passer, `minLen` 7,5), `jukseMax` 3. Ikke håndbåt: tre agenter med stasjoner og klippesjekk.

Opptakene: kjøringen 03:45–04:23 UTC, liggende, 2,8–3,9 bilder i sekundet. Kranen ble hoppet over (ingen kran). Livbøya henger på styrbord rekke akter (spillets `kit.buoys`), midt i arbeidsplassene der.

| Operasjonen | Hva som er galt | Hvorfor det ikke er ekte | Kilde | Alvor |
|---|---|---|---|---|
| Juksa | **Juksaplass 2 ligger i hjørnet ved dashbordet under hardtoppen**: hardtopstolpen går gjennom ansiktet og kroppen til den som står der, og sidepanelet står opp til brystet, så han jukser over det. Klippesjekken fant det samme: `me:jig:2[0.5]` i begge sjekkene i juksa- og maskinklippet. Plass 1 akter står bak livbøya. | Den som jukser, står fritt ved ripa i cockpiten med lina rett ned langs siden. | `jigRail` (søk i skroget, `kartlegging-spillet.md:350`), `deckcrew.js:414`; sett i `juksa_jig_liggende_2.jpg`, `_3.jpg`, `juksa_maskin_liggende_1.jpg` | **A** |
| Juksamaskinene | Alle tre på styrbord: **den akterste står i livbøya**, og fiskeren ved den ser ut til å stå inne i maskinen (trommelen ved brystet, armene rundt). **Den forreste står ute på sidedekket forut for hardtoppen**, ved lugaren, der ingen når den fra cockpiten. Maskinene er trolig ikke med i klippesjekken. | Maskinene står langs cockpitripa med plass til fiskeren ved siden; livbøya henger der ingen arbeider. | `jigRail`; `kit.buoys`; sett i `juksa_maskin_liggende_2.jpg`, `_3.jpg` | B |
| Teiner, trekk | **Teina settes ned akter gjennom fangstkaret, styrbord ripe og den som sorterer** (han står inni teina). Teinedaviten står tett inntil eller gjennom kanten av hardtoppen (kan ikke avgjøres i bildene). Ingen hendelser `bleed` i klippet; stasjonen `sort:at:tend` er riktig tenkt (F6 rammer ikke snekka). | Teina settes på en ledig plass på dørken eller et teinebord, ikke oppå karene og folkene. | `view3d/10-gear.js:357–400` (`potDeck`); sett i `teiner_trekk_liggende_2.jpg`, `_3.jpg` | **A** |
| Teiner, sett | To teiner i stabel står halvt utenfor styrbord side akter, gjennom ripa, livbøya, karet og den som står ved haleren. Han står ledig; de to andre har matpause (`pause:at:lunch`) mens teinene går ut av seg selv. Stabelen henger igjen i første bilde av linetrekket. | Teinene står surret på dørken og går ut én og én; to arbeider. | `10-gear.js:326`, `:357–400`; `core/13-work.js:270` (`IDLE_ACTS`); sett i `teiner_sett_liggende_2.jpg`, `_3.jpg` | **A** |
| Teinene på snekka | Teina (1,4 m) kunne fått plass på dørken på en 7,9 m snekke, men plasseringen finner ingen ledig flate. Ikke samme sak som trebåten og skiffen. | | `potDeck` | (over) |
| Line, sett | Haleren står ledig ved haleren, de to andre har pause (`sit`, `knife`); ingen akter ved stampene (F4 som felles). Lina sees ikke gå ut. | | sett i `line_sett_liggende_2.jpg` | B |
| Line, trekk | Haleren ved den røde haleren på styrbord, bløggeren akter bak livbøya, den tredje har pause (`knife`). Lina kom opp uten fisk (json: ingen hendelser, `hold` 0), så fiskegrepene kan ikke vurderes. Ingen kveiler lina i stampen. | Som 4.1. | sett i `line_trekk_liggende_2.jpg` | B |
| Garn, sett | Bedre enn F4: én (`haling:at:pick`) står akter der garnet går ut over styrbord hjørne. Han som haler, står ledig. Garnhalerens renne ligger på skrå inn i cockpiten i brysthøyde over gangen; om den går inn i ham ved hofta, kan ikke avgjøres. | | `tools/gear/haler.py` (`haul-garn`); sett i `garn_sett_liggende_3.jpg` | C |
| Garn, trekk | Ser stort sett riktig ut: garnet kommer inn over valsen med fisk (`pick` 2, `bleed` 2), haleren ved haleren, plukkeren og bløggeren akter. De tre står tett i styrbord hjørne bak livbøya. Garnet tegnes som ei line med dupper, ikke som et garn. | | sett i `garn_trekk_liggende_2.jpg` | C |
| Fullt kar, sløying | Riktig: én sløyer ved bordet over babord ripe og ser utover, én iser og pakker ved karet. Den tredje har matpause og står midt i cockpiten uten mat i hendene. Karet viser én–to fisker med 150 kg om bord. | Med fullt kar hjelper alle til; lasten synes i karet. | `13-work.js:270–301`; sett i `juksa_sloy_liggende_3.jpg` | B |
| Rydde | Slangen synes på den åpne snekka (`pause:at:hose`, retter F12 for snekka), men bare som pause, ikke som jobb (F12). | | sett i `felles_rydd_liggende_2.jpg` | B (F12) |
| Kaste loss | Json: de to går inn (`pause:in`) mens tauene tas inn (F2). Skipperen ved rattet. Tauene sees ikke (for langt unna); F1 etter koden. | | F1, F2 | **A** (felles) |
| Til feltet | Skipperen ved rattet under hardtoppen, de to i lugaren. Riktig. | | | – |
| Inn til kai | Kan ikke vurderes i bildene: kameraet står i snøen og bygningene på kaia. Json: ingen ved roret (`back`, `lean`, `look`), F3 bekreftet. | | `24-cinema.js:316–335`; sett i `felles_inn_liggende_2.jpg` | **A** (F3) |
| Lossing | Lasten var 0 (`hold` 0), så lossingen synes ikke; mottakets kran svinger uten kar. Båten ser ut til å ligge et par meter fra fenderpålene (ikke målt). | | sett i `felles_loss_liggende_2.jpg` | C |
| Hvile | Pauser på dekk, ingen spiser (F13). | | | C |
| Hvite flekker | Som felles. | | `24-cinema.js:497` | B (felles) |

**Karakteren:** forslaget i rapport-modeller.md 3.3 var 69 (K6 10). Klippene viser to funn med alvor A som er snekkas egne (juksaplass 2 gjennom hardtopstolpen; teinene gjennom karet og folkene), i tillegg til F1–F3. K6 kan da ikke over 9, og med livbøya og maskinene på ulogiske plasser i tillegg settes den til **8**. K1 4, K2 14, K3 13, K4 5, K5 8, **K6 8**, K7 9, K8 6 = **67**. Merk at `crewclip` sies å være grønn for snekka, mens `ombord.py` fant `me:jig:2`; det bør sjekkes før K7 står.

**Til Jonas:** Snekka er den båten der arbeidet ser mest ekte ut (sløyingen og garntrekket er riktige), men den tredje juksaplassen står inne i hardtopstolpen og teina settes ned oppå karet og folkene.

**OB6 (09.11.2026, Jonas' økt, grenen `ccr-9258fc31-wklbu7`):** juksaplassene kommer fra modellen (`anchors.jigZ`): styrbord akter for haleren og babord i åpningen mellom hardtopstolpene, fiskeren fritt ved cockpitripa; plass 2 i hardtopstolpen og maskinen ute på sidedekket er borte, og `crewclip` prøver nå juksaplassene (sett rød på snekka først, `jig:2`). Bare to plasser: en tredje ved ripa står i styrestolen, iskassa eller et fangstkar på den 1,8 m brede dørken. Livbøyene henger akter ved fangstkarene, der ingen arbeider. Vannlinja er den tomme båtens (3,00 t; tegningens 1,20 m ga 3,57 t, formen er ikke endret). Teinene får ikke plass flatt på dørken uten å stå i et kar, stolen eller folkene, så snekka driver ikke med teiner (valg 24 A, Jonas: «Om båten ikke har plass til teiner på en realistisk måte, skal den ikke drive med teiner»). **Står igjen:** settingen akter fra stampene (F4, OB3). Jonas samme dag: snekka har deg og én til og høyst to maskiner, og båter med plass til færre enn fire har ingen redningsflåte og ingen livbøye. Karakteren som forslag (77) i `snekke-grunnlag.md` 9.4; økta setter den som en egen evaluering.

### 4.4 Plastsjarken (`plastsjark`, `plast31.py`): forslag 63/100 (satt 66)

Data: 9,45 m, 6 t, to og deg (tre agenter), 2 køyer, plast, 100 hk, styrhus akter med et lite akterdekk bak, arbeidsdekket og ruffen forut, rom 6 m³ med luke på arbeidsdekket, haleren på styrbord ripe like akter for ruffen med blødekaret ved, eget sløyebord over babord ripe, `jukseMax` 4, rigges for alle fire. Ingen kran.

Opptakene: kjøringen ca. 04:07–04:41 UTC, liggende, 2,8–3,7 bilder i sekundet. Kranen hoppet over (ingen kran). Klippesjekken (`clip`, `walk`, `off`) er tom i alle klippene; ingen av funnene under er fanget av den (den prøver kroppene mot modellen, ikke folk mot folk eller redskapet mot huset).

| Operasjonen | Hva som er galt | Hvorfor det ikke er ekte | Kilde | Alvor |
|---|---|---|---|---|
| Garn og line, sett | **Redskapet går ut gjennom styrhuset.** Garnet (gult med dupper) kommer ut av akterveggen og taket på styrhuset og går over akterdekket og ut over styrbord hekk; lina likeså, tynnere. Ingen står akter; han ved haleren står ledig, de to andre ser på (`pause:look`), på garnet står plukkeren ved haleren forut (`haling:at:pick`). | Med styrhus akter settes garnet og lina fra binga og stampene forut, over ripa eller gjennom en renne langs siden av huset til hekken, og én passer at det går klart. Redskapet går aldri gjennom huset. (Alminnelig kjent; planlisten GRN-03, LIN-03 har renne akter.) | `view3d/10-gear.js:232` (`drawSetting` trekker fra karet og stampene rett til hekken); F4 som felles; sett i `garn_sett_liggende_3.jpg`, `line_sett_liggende_3.jpg` | **A** |
| Teiner, sett | **Stabelen ved haleren står gjennom fronten og taket på styrhuset**: den nederste teina står i husfronten, den øverste over taket. Han ved haleren står inni stabelen. Stabelen står der fortsatt i første bilde av linetrekket, etter at teinene skulle vært satt. De to andre har pause (`in`, `gear`). | Teinene står stablet og surret på dørken ved haleren og går ut én og én; to arbeider. | `10-gear.js:326`, `:357–400`; sett i `teiner_sett_liggende_3.jpg`, `line_trekk_liggende_1.jpg` | **A** |
| Teiner, trekk | Davit og rød teinehaler på styrbord forut ved ruffen, riktig plassert. Men **teina settes ned tvers over arbeidsdekket mellom styrhuset og ruffen, gjennom sortereren, den tredje og den blå kassa**; en teine står også inn mot husfronten med sortereren i. Den tredje (`pause:back`) ser ut til å stå på eller i sløyebordet (kan ikke avgjøres). | Teina settes på ledig dørk eller et teinebord; det er plass til én på 9,45 m. | `potDeck` i `10-gear.js:357–400`; sett i `teiner_trekk_liggende_2.jpg`, midt i klippet | **A** |
| Juksa | **Alle tre jukser i en klump i styrbord hjørne mot husfronten**, så tett at kroppene går over i hverandre i bildet; trolig står to bak den ytterste og ikke ved ripa. Babord er tom. | Den som jukser, står fritt ved ripa med lina rett ned, gjerne én–to meter fra nestemann og på begge sider. | `jigRail` (`kartlegging-spillet.md:350`), styrbord først; sett i `juksa_jig_liggende_2.jpg`, `_3.jpg` | **A** |
| Juksamaskinene | Tre maskiner på styrbord ripe på et par meter mellom husfronten og blødekaret, den første tett inntil eller i hjørnet av styrhuset (kan ikke avgjøres). Folkene står rett bak dem i klump. Fisken opp og tatt av (`bleed` 3). | SJK-03: 2–4 på stolpe ved rekka, spredt så linene ikke går i hverandre, på begge sider når det er fire. | `jigRail`; sett i `juksa_maskin_liggende_2.jpg` | B |
| Fullt kar, sløying | Riktig: én sløyer ved bordet over babord ripe, én iser og pakker ved karet på styrbord. Den tredje har pause (`phone`). Ingen kasse bæres til luka i klippet. | Med fullt kar hjelper alle til (som 4.3). | `13-work.js:270–301`; sett i `juksa_sloy_liggende_3.jpg` | B |
| Line, trekk | Riktig grep: haleren ved haleren, bløggeren ved blødekaret, sløyebordet på babord; den tredje har kaffepause. Lina kom opp uten fisk (`hold` 0), så fiskegrepene kan ikke vurderes. | | sett i `line_trekk_liggende_2.jpg` | – |
| Garn, trekk | Garnet inn over valsen (`pick` 4, `bleed` 3), de tre ved haleren. Garnhalerens renne går tvers over han ved haleren i livhøyde, og i begge garnklippene ser det ut som den går gjennom ham (kan ikke avgjøres fra én vinkel). Bløggeren står tett inntil eller i garnkaret. | | `tools/gear/haler.py` (`haul-garn`); sett i `garn_trekk_liggende_2.jpg`, `garn_sett_liggende_2.jpg` | C |
| Kaste loss | Kan ikke vurderes ved kaia (første bilde er kaia, båten synes ikke). Når hun går ut i fart, står alle tre på arbeidsdekket forut og ingen i styrhuset; først til slutt går én mot roret (`ror:walk`), én går inn (F2). | Skipperen står ved roret fra første tau går. | F1–F3 som felles; sett i `felles_kast_liggende_2.jpg` | **A** (felles) |
| Til feltet | Skipperen ved roret, de to inne. Riktig. | | | – |
| Rydde | Slangen synes (`pause:hose`), men bare som pause (F12). | | sett i `felles_rydd_liggende_2.jpg` | B (F12) |
| Inn til kai | Kan ikke vurderes: kameraet står i snøen og bygningene på kaia. | | `24-cinema.js:316–335` | – (opptaket) |
| Lossing | Lasten var 0, så ingenting å losse; båten ser ut til å ligge et par meter fra fenderpålene (ikke målt). | | sett i `felles_loss_liggende_2.jpg` | C |
| Hvile | Kokken inne, de andre på dekk, ingen spiser (F13). | | | C |
| Hvite flekker | Som felles. | | `24-cinema.js:497` | B (felles) |

**Merk om styrhuset:** det åpne spørsmålet i grunnlaget («hvor står styrhuset?», `plastsjark-grunnlag.md:185–187`) har betydning for arbeidet: med styrhus akter må alt som settes over hekken, forbi huset. Står huset midtskips, slik annonsen tyder på, er hekken fri og settingen blir som på havsjarken.

**Karakteren:** 66 i grunnlaget (K6 10). Klippene viser tre funn med alvor A som er plastsjarkens egne (redskapet gjennom styrhuset ved setting; teinene gjennom huset og folkene; juksa i klump), i tillegg til F1–F3. K6 går fra 10 til **7**. K1 3, K2 15, K3 13, K4 5, K5 5, **K6 7**, K7 8, K8 7 = **63**.

**Til Jonas:** På plastsjarken går garnet og lina ut gjennom styrhuset når de settes, teinene står gjennom husfronten og taket, og de tre som jukser står i en klump i ett hjørne; svaret på hvor styrhuset skal stå, avgjør mye av arbeidet.

Bilder til Jonas:
- /tmp/claude-0/-home-user-FishyBusiness-/07394754-f521-5fe7-add0-683e101280de/scratchpad/ombord/plastsjark/garn_sett_liggende_3.jpg
- /tmp/claude-0/-home-user-FishyBusiness-/07394754-f521-5fe7-add0-683e101280de/scratchpad/ombord/plastsjark/line_trekk_liggende_1.jpg
- /tmp/claude-0/-home-user-FishyBusiness-/07394754-f521-5fe7-add0-683e101280de/scratchpad/ombord/plastsjark/teiner_trekk_liggende_2.jpg
- /tmp/claude-0/-home-user-FishyBusiness-/07394754-f521-5fe7-add0-683e101280de/scratchpad/ombord/plastsjark/juksa_jig_liggende_2.jpg
- /tmp/claude-0/-home-user-FishyBusiness-/07394754-f521-5fe7-add0-683e101280de/scratchpad/ombord/plastsjark/juksa_maskin_liggende_2.jpg

### 4.5 Havsjarken (`sjark`, `havsjark35.py`): forslag 61/100 (satt 64)

Data: 10,57 m, 12 t, tre og deg (fire agenter), 4 køyer, bakk og styrhus forut, den lave midja som arbeidsdekk, redskapsrom (dekkshus) akter, styreseil, rom 11 m³ med luke i midja, haleren i midja på styrbord med blødekaret akter for, spillets sløyebord på babord ripe tvers av luka (`bord` 2), `jukseMax` 5, rigges for alle fire. Ingen kran.

Opptakene: kjøringen ca. 04:22–04:58 UTC, liggende, 2,8–3,4 bilder i sekundet. Kranen hoppet over (ingen kran). Klippesjekken er tom i alle klippene; ingen av funnene under er fanget av den.

| Operasjonen | Hva som er galt | Hvorfor det ikke er ekte | Kilde | Alvor |
|---|---|---|---|---|
| Fullt kar, sløying | **De to som sløyer, står inni hverandre ved sløyebordet på babord** (to `sloy:at:gut`, `bord` 2): kroppene og beina går gjennom hverandre i alle bildene. Den som iser, står ved karet; den fjerde sitter på det blå karet (`pause:sit`) og går så. Stagwiren fra masta ser ut til å gå gjennom han som iser (kan ikke avgjøres fra én vinkel). | To som sløyer, står ved hvert sitt bord eller hver sin ende av bordet; med fullt kar hjelper alle til. | `deckcrew.js:133–137` (`deckAt`: nummer to får en plass 0,7 m forut eller akter, men faller tilbake til samme punkt når veien dit ikke finnes), `:191`; sett i `juksa_sloy_liggende_2.jpg`, `_3.jpg` | **A** |
| Teiner, sett | **Teinestabelen står gjennom redskapsrommet akter og rundt de tre ved haleren**: nettet går over siden av dekkshuset og ut over styrbord hekk. De tre står i klump ved teinedaviten på styrbord akter for styrhuset; bare én har arbeid (`haling:at:haul`), de andre har pause (`coffee`, `back`, `look`) mens teinene går ut av seg selv. | Teinene står surret på dørken i midja og går ut én og én; to arbeider. | `10-gear.js:326`, `:357–400`; nettet sett midt i `teiner_sett_liggende.mp4` (rundt 45 %), klumpen i `teiner_sett_liggende_2.jpg` | **A** |
| Teiner, trekk | Davit og rød teinehaler på styrbord ved styrhusets akterkant, riktig plassert, to sorterer (`sort:at:tend`). Men **teina settes ned på dørken akter i midja med den fjerde (`pause:phone`) inni seg**, inntil redskapsrommet. De tre ved haleren står skulder i skulder, de to som sorterer går over i hverandre. | Teina settes på ledig dørk eller teinebord, ikke oppå folk; 10,6 m har plass. | `potDeck`; sett i `teiner_trekk_liggende_2.jpg`, `_3.jpg` | **A** |
| Garn og line, sett | **Garnet kommer ut av siden på redskapsrommet** og går over styrbord hekk; lina går ut over hekken samme vei (kilden synes ikke bak huset). Én akter, men han koster dekket (`pause:sweep`) med garnet løpende ved siden; på lina er det pauser (`knife`, `lean`) mens haleren står ledig (F4). | Garnet settes fra binga over hekken eller en renne, og én passer det; det går ikke gjennom et hus. | `10-gear.js:232` (`drawSetting`); sett i `garn_sett_liggende_3.jpg`, `line_sett_liggende_3.jpg` | **A** |
| Juksa | Fire på styrbord i midja, babord tom. Den akterste står i den smale gangen mellom ripa og redskapsrommet; den fjerde står en meter innenfor ripa ved karet. | Plassene fordeles på begge sider med plass imellom. | `jigRail` (`kartlegging-spillet.md:350`); sett i `juksa_jig_liggende_2.jpg` | B |
| Juksamaskinene | Tre maskiner tett i tett på styrbord ripe midt i midja (under en meter imellom); folkene står rett bak med trommelen mot magen, den første ser ut til å stå i maskinen (kan ikke avgjøres). Den fjerde står akter uten maskin. Ingen hendelser i klippet. | SJK-03: på stolpe ved rekka, spredt; med fire–fem på begge sider. | `jigRail`; sett i `juksa_maskin_liggende_2.jpg` | B |
| Line, trekk | Riktig oppsett: haleren i midja, bløggeren ved blødekaret akter for ham, sløyebordet på babord og luka imellom. Lina kom opp uten fisk (`hold` 0); to har pause. | | sett i `line_trekk_liggende_2.jpg` | – |
| Garn, trekk | Garnet inn med fisk (`pick` 3, `bleed` 3); haleren, plukkeren og bløggeren står tett på halvannen meter ved haleren. Ser stort sett riktig ut. | | sett i `garn_trekk_liggende_2.jpg` | C |
| Styreseilet | Oppe i fisket og i ro; riktig for en havsjark som ligger og driver. | | | – |
| Kaste loss | Ved kaia står to akter og ingen ved roret; først etterpå går skipperen mot roret (`ror:walk`). Tauene synes ikke. Garnhalerens arm stikker ut over styrbord side mot kaia. | | F1–F3 som felles; sett i `felles_kast_liggende_1.jpg` | **A** (felles) |
| Til feltet | Skipperen ved roret, de tre inne. Riktig. | | | – |
| Rydde, hvile | Kan ikke vurderes: kameraet står bak redskapsrommet, dørken synes ikke. Json: to spyler og én koster (pauser, F12); ingen spiser (F13). | | sett i `felles_rydd_liggende_2.jpg` | B (F12), C (F13) |
| Inn til kai | Kan ikke vurderes: kameraet står i bygningene og snøen på kaia. | | `24-cinema.js:316–335` | – (opptaket) |
| Lossing | Lasten var 0; ingenting å losse. Båten ser ut til å ligge et par meter fra fenderpålene (ikke målt). | | sett i `felles_loss_liggende_2.jpg` | C |
| Hvite flekker | Som felles. | | `24-cinema.js:497` | B (felles) |

**Karakteren:** 64 i grunnlaget (K6 10). Klippene viser tre funn med alvor A som er havsjarkens egne (de to som sløyer, inni hverandre; teinene gjennom redskapsrommet og folkene; garnet ut gjennom redskapsrommet), i tillegg til F1–F3. K6 går fra 10 til **7**. K1 4, K2 13, K3 13, K4 5, K5 8, **K6 7**, K7 8, K8 3 = **61**.

**Til Jonas:** Havsjarken har det mest fornuftige dekket (haler, blødekar, luke og sløyebord i midja), men de to som sløyer, står inni hverandre, og teinene og garnet går gjennom redskapsrommet akter.

Bilder til Jonas:
- /tmp/claude-0/-home-user-FishyBusiness-/07394754-f521-5fe7-add0-683e101280de/scratchpad/ombord/sjark/juksa_sloy_liggende_3.jpg
- /tmp/claude-0/-home-user-FishyBusiness-/07394754-f521-5fe7-add0-683e101280de/scratchpad/ombord/sjark/teiner_trekk_liggende_2.jpg
- /tmp/claude-0/-home-user-FishyBusiness-/07394754-f521-5fe7-add0-683e101280de/scratchpad/ombord/sjark/garn_sett_liggende_3.jpg
- /tmp/claude-0/-home-user-FishyBusiness-/07394754-f521-5fe7-add0-683e101280de/scratchpad/ombord/sjark/juksa_maskin_liggende_2.jpg
- /tmp/claude-0/-home-user-FishyBusiness-/07394754-f521-5fe7-add0-683e101280de/scratchpad/ombord/sjark/line_trekk_liggende_2.jpg

### 4.6 Den brukte hurtigsjarken (`hurtigsjark`, `hurtig11.py`): forslag 59/100 (satt 62)

Data: 10,99 m, 12 t (modellen 13,7), to og deg (tre agenter), 2 køyer, 500 hk, planende, styrhus forut med taket trukket akterover haleporten, rom 8 m³ med luke midt på dekket, haleren i haleporten på styrbord med blødekaret rett akter, spillets sløyebenk på babord ripe tvers av luka, stampene under skjulet til babord, garnkaret i hekken, frakten i babord hekk, **kran 0,5 t på kista i styrbord hekk** (mot kaia, som `berthPose` legger henne), slank flaggmast med to stag i babord hekk, `jukseMax` 6, rigges for alle fire.

Opptakene: liggende, 2,9–3,9 bilder i sekundet, alle 16 klippene (kranen med). Klippesjekken (`clip`, `walk`, `off`) er tom i alle klippene; ingen av funnene under er fanget av den.

| Operasjonen | Hva som er galt | Hvorfor det ikke er ekte | Kilde | Alvor |
|---|---|---|---|---|
| Teiner, sett | **Teinestabelen fyller hele akterdekket**, to i høyden fra haleporten til kranen: blødekaret, flaggmastas stag og kranens kiste står inni den, og han ved haleren står i den forreste enden. De to andre har pause (`back`); den ene står i hekken foran stabelen. Stabelen står der fortsatt i første bilde av linetrekket. | Teinene står stablet og surret på ledig dørk og går ut én og én; to arbeider. | `view3d/10-gear.js:326`, `:357–400`; sett i `teiner_sett_liggende_2.jpg`, `_3.jpg`, `line_trekk_liggende_1.jpg` | **A** |
| Teiner, trekk | Davit fra takkanten og rød haler i haleporten, riktig plassert. Teina settes ned akter på dørken, og nettet synes på begge sider av kranfoten: den ser ut til å stå rundt kranens kiste (kan ikke avgjøres fra én vinkel). De to som sorterer, står skulder i skulder tett inntil haleren (F21). Ingen `bleed` (F6 rammer ikke henne). | Teina settes på ledig dørk eller teinebord. | `potDeck` i `10-gear.js:357–400`; sett i `teiner_trekk_liggende_2.jpg`, `_3.jpg` | B |
| Fullt kar, sløying | Én ved benken på babord og én tett ved siden av ham uten benk foran seg; de står så tett at skuldrene og armene går over i hverandre i bildet, men ikke på samme punkt som på havsjarken. Den tredje iser ved karet med fisken synlig. | To som sløyer, står ved hver sin ende av benken (F19). | `deckcrew.js:133–137`; sett i `juksa_sloy_liggende_2.jpg`, `_3.jpg` | B (nær F19) |
| Juksa | Tre på styrbord, babord tom (F21): én akter ved kranen, to i haleporten under taket under en meter fra hverandre; den innerste ser ut til å stå i døråpningen til styrhuset bak stolpen (kan ikke avgjøres fra én vinkel). | Fordelt langs ripa på begge sider, fritt for huset. | `jigRail`; sett i `juksa_jig_liggende_2.jpg`, `_3.jpg` | B |
| Juksamaskinene | Tre maskiner: én akter, to forut i og like forut for haleporten. Den forreste står på ripa langs styrhuset, og den som passer den, ser ut til å stå inne i huset bak vinduet (kan ikke avgjøres). Ingen hendelser i klippet. | SJK-03: på stolpe ved rekka på arbeidsdekket, spredt. | `jigRail`; sett i `juksa_maskin_liggende_2.jpg`, `_3.jpg` | B |
| Line, sett | Lina går fra babord over luka diagonalt til styrbord hekk ved leideren, ikke gjennom huset (bedre enn F20). Ingen akter; han ved haleren står ledig, én koster ved blødekaret i linas vei (F4 som felles). | | `10-gear.js:232`; sett i `line_sett_liggende_3.jpg` | B (F4) |
| Garn, sett | Garnet går fra karet i hekken over hekken ved leideren, riktig retning. Han som står ved karet, har pause (`back`) og passer ikke garnet; plukkeren står ved blødekaret (F4). | | sett i `garn_sett_liggende_2.jpg`, `_3.jpg` | C |
| Line, trekk | Riktig oppsett: haleren i haleporten, blødekaret, benken. Lina kom opp uten fisk (`hold` 0). Han med kikkerten (`pause:binoc`) står tett inntil eller i den foldede kranbommen. | | sett i `line_trekk_liggende_2.jpg` | C |
| Garn, trekk | Garnet inn over den svarte haleren med fisk (`pick` 3, `bleed` 3); plukkeren står tett bak bløggeren. Hvordan garnet kommer fra haleren til karet, synes ikke. Ser stort sett riktig ut. | | sett i `garn_trekk_liggende_2.jpg` | C |
| Kranen (frakt ved kai) | **Kranen står riktig**: på kista i styrbord hekk mot kaia, foldet stramt ved ripa til sjøs. I klippet svinger den og løfter bommen (sett i fire bilder over klippet), men ingen kasse henger i kroken i noe bilde: klippet er 17 s av en runde på 40 s, og kassa tegnes bare i deler av runden (kan ikke avgjøres om den kommer). Frakten står stablet i babord hekk fra start. To står ved kranen og vinker (`last:at:guide`); ingen styrer den, ingen på kaia hekter på. | Én kjører kranen fra spakene eller fjernkontrollen, én tar imot og hekter på; ingen står under lasten. | `view3d/09-landing-deck.js:584–630` (runden `t % 40`, `carry` :628); sett i `felles_kran_liggende_2.jpg`, `_3.jpg` | B |
| Kaste loss | Ved kaia (synes nå fra sjøsiden): to akter ved kranen, ingen ved roret; tauene synes ikke. | | F1–F3 som felles; sett i `felles_kast_liggende_1.jpg` | **A** (felles) |
| Til feltet | Skipperen ved roret, de to inne. Riktig. | | | – |
| Inn til kai | **Kameraet står nå over kaia, og båten synes** (ovenfra, langs kaia, styrbord til). Men for langt unna til å se tauene og grepene; innglidningen er ikke med (første bilde er ennå på feltet). Json: ingen ved roret (`back`, `sit`, `lean`), F3. | | sett i `felles_inn_liggende_2.jpg`, `_3.jpg` | **A** (F3) |
| Lossing | Synes ovenfra: mottakets kran og trucken går, båten ligger inntil kaia. Lasten var 0 (`hold` 0), så ingen kar fra henne; mannskapet har pause (F10). | | sett i `felles_loss_liggende_2.jpg` | C |
| Rydde, hvile | Slangen og kosten som pause (F12); kokken inne, skipperen i køya, ingen spiser (F13). | | sett i `felles_rydd_liggende_2.jpg` | B (F12), C (F13) |
| Hvite flekker | Som felles, også rundt de to som sløyer. | | `24-cinema.js:497` | B (felles) |

**Karakteren:** 62 i grunnlaget (K6 11). Klippene viser ett funn med alvor A som er hennes eget (teinestabelen over hele akterdekket med blødekaret, stagene, kranens kiste og haleren i), i tillegg til F1–F3, og flere B (juksaplassene i haleporten og døra, de to tette ved benken, ingen som kjører kranen). K6 kan ikke over 9 og settes til **8**. K1 4, K2 14, K3 12, K4 5, K5 8, **K6 8**, K7 6, K8 2 = **59**.

**Til Jonas:** På den brukte hurtigsjarken står kranen riktig mot kaia og svinger, men ingen kjører den og ingen kasse ses i kroken; det verste er at teinestabelen fyller hele akterdekket med folk, blødekar og kranfot inni seg.

Bilder til Jonas:
- /tmp/claude-0/-home-user-FishyBusiness-/07394754-f521-5fe7-add0-683e101280de/scratchpad/ombord/hurtigsjark/line_trekk_liggende_1.jpg
- /tmp/claude-0/-home-user-FishyBusiness-/07394754-f521-5fe7-add0-683e101280de/scratchpad/ombord/hurtigsjark/felles_kran_liggende_3.jpg
- /tmp/claude-0/-home-user-FishyBusiness-/07394754-f521-5fe7-add0-683e101280de/scratchpad/ombord/hurtigsjark/juksa_sloy_liggende_2.jpg
- /tmp/claude-0/-home-user-FishyBusiness-/07394754-f521-5fe7-add0-683e101280de/scratchpad/ombord/hurtigsjark/teiner_trekk_liggende_2.jpg
- /tmp/claude-0/-home-user-FishyBusiness-/07394754-f521-5fe7-add0-683e101280de/scratchpad/ombord/hurtigsjark/juksa_jig_liggende_3.jpg
- /tmp/claude-0/-home-user-FishyBusiness-/07394754-f521-5fe7-add0-683e101280de/scratchpad/ombord/hurtigsjark/felles_inn_liggende_3.jpg

### 4.7 Den nye hurtigsjarken (`sjarkny`, `hs11.py`): forslag 66/100 (satt 70)

Data: 10,99 m, 15 t (tegningens lettvekt 16), tre og deg (fire agenter), 4 køyer, 650 hk (`vmax` 25 mot tegningens 12 kn, Ø7), styrhus forut med taket over haleporten, rom 12 m³ med luke midt akter, haleren i haleporten på styrbord under taket, blødekaret 0,75 m akter for, spillets sløyebenk ved styrbord ripe akter for karet, stampene mellom benken og luka, garnkaret i styrbord hekk, frakten i babord hekk, **kran 0,5 t på kista i babord hekk** (som tegningen, rapport-modeller 2.7; kommentaren i `hs11.py:950–951` sier styrbord), `jukseMax` 6, rigges for alle fire.

Opptakene: liggende, 2,6–3,8 bilder i sekundet, alle 16 klippene (kranen med). Klippesjekken er tom i alle klippene; ingen av funnene under er fanget av den.

| Operasjonen | Hva som er galt | Hvorfor det ikke er ekte | Kilde | Alvor |
|---|---|---|---|---|
| Fullt kar, sløying | **De to som sløyer, står inni hverandre ved benken** på styrbord (to `sloy:at:gut`): to hoder og to redningsvester i én kropp i begge bildene. Den som iser, og den fjerde synes ikke bak huset. F19 som på havsjarken. | To ved samme benk står ved hver sin ende. | F19, `deckcrew.js:133–137`; sett i `juksa_sloy_liggende_2.jpg`, `_3.jpg` | **A** (F19) |
| Teiner, sett | **Teinestabelen står over sløyebenken og blødekaret** på styrbord akter for huset, to i høyden, og han ved haleren står inni den. De tre andre har pause (`smoke`, `lunch`, `lean`) mens teinene går ut av seg selv. | Teinene står surret på ledig dørk (luka og hekken er fri) og går ut én og én; to arbeider. | `10-gear.js:326`, `:357–400`; sett i `teiner_sett_liggende_3.jpg` | **A** |
| Teiner, trekk | Davit og rød haler i haleporten, riktig plassert. **De to som sorterer, står inni hverandre** (F19), skulder i skulder med haleren under taket. Teina settes ned på dørken akter for husets hjørne, der benken står (om den går gjennom benken, kan ikke avgjøres). Den fjerde sitter akter. Ingen `bleed` (F6 rammer ikke henne). | Teina på ledig dørk; to som sorterer, står på hver sin side av teina. | `potDeck`; F19; sett i `teiner_trekk_liggende_2.jpg`, `_3.jpg` | **A** (F19) |
| Juksa | Fire på styrbord, babord tom (F21), men spredt langs ripa med en meter eller mer imellom (bedre enn plastsjarken og havsjarken). Den ene står innenfor sløyebenken og jukser over den; den forreste står i haleporten ved døra. | Fritt ved ripa, på begge sider. | `jigRail`; sett i `juksa_jig_liggende_2.jpg` | B |
| Juksamaskinene | Tre maskiner på styrbord ripe, men fire på `fiske:at:jig`: den akterste står ved ripa uten maskin. Maskinen ved benken står der benken er (om foten går i benken, kan ikke avgjøres). Ingen hendelser i klippet. | Én maskin per mann; maskinen på stolpe ved rekka. | `jigRail`; sett i `juksa_maskin_liggende_2.jpg`, `_3.jpg` | B |
| Line, sett | Fire stamper midt på dekket; ingen ved dem. Én sitter på skansekledningen i styrbord hekk der lina går ut (`pause:sit`); han ved haleren står ledig (F4). | Én passer stampen og lina over hekken; ingen sitter i linas vei. | `10-gear.js:232`; sett i `line_sett_liggende_2.jpg` | B (F4) |
| Garn, sett | Garnet går fra karet i styrbord hekk over hekken ved leideren, riktig retning; plukkeren står ved luka nær karet. To har pause. | | sett i `garn_sett_liggende_2.jpg`, `_3.jpg` | C |
| Line, trekk | Riktig oppsett: haleren i haleporten, bløggeren ved blødekaret. Lina kom opp uten fisk (`hold` 0). **Den ene (`pause:lean`) står i skansekledningen** i babord hekk ved flagget, med beina i ripa. | Den som lener seg, står innenfor ripa. | sett i `line_trekk_liggende_2.jpg`, `_3.jpg` | B |
| Garn, trekk | Garnet inn over den svarte haleren med fisk (`pick` 2, `bleed` 2); de tre ved haleporten. Garnkaret står i babord hekk ved kranen; veien dit synes ikke. | | sett i `garn_trekk_liggende_2.jpg` | C |
| Kranen (frakt ved kai) | **Kranen står der tegningen har den**, på kista i babord hekk, men spillet legger alltid båten med styrbord mot kaia, så den må nå over hele dekket (4,68 m) og 2,5 m ut over kaia. Den svinger og løfter bommen (sett i to bilder); ingen kasse ses i kroken (meldingen om oppdraget dekker siste halvdel av klippet). **De fire står i klump i styrbord hekk, rett under veien kroken går til kaia**; to vinker (`last:at:guide`), ingen kjører kranen. Frakten står stablet i babord hekk fra start. | Én kjører kranen, én hekter på; ingen står under lasten. | `09-landing-deck.js:584–630`; sett i `felles_hvile_liggende_1.jpg` (kranen ved kaia før hvileklippet), `felles_kran_liggende_1.jpg` | B |
| Kaste loss | Ved kaia (synes fra sjøsiden): de fire akter, ingen ved roret; tauene synes ikke. | | F1–F3 som felles; sett i `felles_kast_liggende_1.jpg` | **A** (felles) |
| Til feltet | Skipperen ved roret, de tre inne. Riktig. | | | – |
| Inn til kai | Kan ikke vurderes: kameraet står høyt nok, men opptaket startet innseilingen 300 m øst for Husøy-mottaket, som er land, så båten glir inn over fjæra med bakken synlig gjennom dørken. Kaia synes ikke i klippet. Json: ingen ved roret (F3). | | `tests/ombord.py:112` (`b.pos = {x:q.p.x + 0.3, …}`); sett i `felles_inn_liggende_2.jpg` | – (opptaket); **A** (F3) |
| Lossing | Synes ovenfra: mottakets kran løfter et tomt kar, trucken går. Lasten var 0; de fire har pause (F10). | | sett i `felles_loss_liggende_1.jpg`, `_2.jpg` | C |
| Rydde, hvile | Slangen og kosten som pause (F12); kokken inne, ingen spiser (F13). | | sett i `felles_rydd_liggende_2.jpg` | B (F12), C (F13) |
| Hvite flekker | Som felles, store ved sløyingen og settingen. | | `24-cinema.js:497` | B (felles) |

**Karakteren:** 70 i grunnlaget (K6 11). Klippene viser tre funn med alvor A for henne: de to som sløyer, og de to som sorterer, inni hverandre (F19, to steder), og teinestabelen over benken og blødekaret med haleren i, i tillegg til F1–F3. K6 går fra 11 til **7**, som plastsjarken og havsjarken. K1 10, K2 16, K3 11, K4 5, K5 6, **K6 7**, K7 9, K8 2 = **66**.

**Til Jonas:** Den nye hurtigsjarken har det ryddigste dekket (juksaplassene spredt, garnet ut over hekken), men to og to står inni hverandre ved sløyebenken og ved teinene, teinestabelen står oppå benken, og kranen i babord hekk må løfte over de fire som står i klump på kaisida.

Bilder til Jonas:
- /tmp/claude-0/-home-user-FishyBusiness-/07394754-f521-5fe7-add0-683e101280de/scratchpad/ombord/sjarkny/juksa_sloy_liggende_3.jpg
- /tmp/claude-0/-home-user-FishyBusiness-/07394754-f521-5fe7-add0-683e101280de/scratchpad/ombord/sjarkny/teiner_sett_liggende_3.jpg
- /tmp/claude-0/-home-user-FishyBusiness-/07394754-f521-5fe7-add0-683e101280de/scratchpad/ombord/sjarkny/teiner_trekk_liggende_2.jpg
- /tmp/claude-0/-home-user-FishyBusiness-/07394754-f521-5fe7-add0-683e101280de/scratchpad/ombord/sjarkny/felles_hvile_liggende_1.jpg
- /tmp/claude-0/-home-user-FishyBusiness-/07394754-f521-5fe7-add0-683e101280de/scratchpad/ombord/sjarkny/juksa_maskin_liggende_3.jpg

**Etter OB10 (10.11.2026, grenen `ccr-e7277295-e9i00p`):** benken står langs babord ripe tvers av luka (F19 rettet), kista med kranen 1,2 m lenger akter, redskapet om styrbord akter der det går ut, teinestablene ut av husene (to av OB16s fire plasser sto inne i dekkshuset og styrhuset) og nå to på seks med `gearMax.teine` 12, stedet teina tømmes på fri dørk under taket, fire juksaplasser om styrbord med `jukseMax` 4, bremmen (valg 26), styrhusveggene uten striper, og den tomme båtens vannlinje (`WLE`, 0,665 m under tegningens største: hun ligger 0,67 m høyere). Karakteren satt som egen evaluering: **71** (`sjarkny-grunnlag.md` 10.6), under 75; det som mangler, er mest felles kode i arbeidsflyten (OB3, OB4), så hun tar en runde til etter dem.

### 4.8 Breisjarken (`breisjark`, `malo36.py`): forslag 68/100 (satt 72)

Data: 10,99 m, 20 t (21,9 t ved tegningens vannlinje), `crewMax` 4 (fire agenter i opptaket), 4 køyer, bakk og styrhus forut, **ly** (`shelter`) over midtskipet med tak, åpent om styrbord fra x 3,10 til 5,88, haleren 5,47 på styrbord ripe forut i åpningen, blødekaret 4,62 rett akter for ham, eget sløyebord over babord ripe under lyet (3,20–4,10), luka 3,92–5,48 midt imellom, garnkaret og stampene under lyet til babord, åpent akterdekk med aktermast, galge og garnrull over hekken, stigen til lyets tak om styrbord, ingen kran (bom på formasta), `jukseMax` 6 (`JIG_Z` 4 om styrbord og 1 om babord), rigges for alle fire.

Opptakene: liggende, 2,9–3,8 bilder i sekundet, 15 klipp (kranen hoppet over: ingen kran). Klippesjekken er tom i alle klippene; ingen av funnene under er fanget av den.

| Operasjonen | Hva som er galt | Hvorfor det ikke er ekte | Kilde | Alvor |
|---|---|---|---|---|
| Trekk (line, garn, teiner) | **Ingen står ved haleren og ingen ved blødekaret** i noe trekk: json gir `haling:in` og `blogg:in` (ikke tegnet). Lina og garnet går inn i en tom haler forut i åpningen, blødekaret står med blod og uten folk. Grunnen er regelen som sender halerne inn når haleren står over 1,2 m fra dekket: her står den 1,25 m over dørken (ripa 0,70 + 0,55), like over grensen. | Én haler og tar fisken av ved haleren, én bløgger ved karet; det er det spilleren skal se ved hvert trekk. | `deckcrew.js:190`; `malo36.py:78–80, 101, 1064` (`hauler` = `z_cap + 0,55`); sett i `line_trekk_liggende_2.jpg`, `garn_trekk_liggende_1.jpg` | **A** |
| Teiner, trekk | **De to som sorterer, står inni hverandre** ved det blå karet (gul og grønn oljehyre i én kropp), tett inntil lyets stolpe; teinehaleren forut står tom (raden over). | To som sorterer, står på hver sin side av karet eller teinebordet. | F19, `deckcrew.js:133–137, 194`; sett i `teiner_trekk_liggende_2.jpg`, `_3.jpg` | **A** (F19) |
| Teiner, sett og trekk | **Teinestabelen fyller hele rommet under lyet**, fra babord vegg og akter forbi aktermasta, to i høyden opp mot taket: masta står i stabelen, det blå karet står inni den, og stabelen står der sløyebordet, garnkaret og stampene er. Sett fra styrbord står stigen til taket foran stabelen. Den som haler, er inne (`haling:in`); de tre andre har pause (`back`, `knife`, `look`). | Teinene står surret på ledig dørk (akterdekket er fritt) og går ut én og én over ripa; to arbeider. | `view3d/10-gear.js:323` (`drawPotsAboard`); sett i `teiner_sett_liggende_2.jpg`, `_3.jpg` | **A** |
| Fullt kar, sløying | **F18 som felles, men bare delvis:** de to som sløyer, står ved babord ripe under lyet med omtrent en halv meter imellom (ikke inni hverandre), men kameraet står høyt akter om styrbord, så takkanten skjuler hodene og hendene; bare beina synes. Den som iser (`is:at:pack`), står i styrbord hekk ved foten av stigen, med stigens vange og livbøya på skansekledningen gjennom seg (ser det ut til; kan ikke avgjøres sikkert fra én vinkel), et par meter akter for luka. | Den som iser, står ved luka og karene; spilleren skal se sløyingen. | F18, `deckcrew.js:187–190`; `malo36.py:577–585` (stigen), `:1027` (livbøyene); sett i `juksa_sloy_liggende_2.jpg`, `_3.jpg` | B (F18) |
| Juksamaskinene | To maskiner synes, begge om styrbord (én i åpningen, én på akterdekket); fire på `fiske:at:jig`. **To står ved samme maskin i åpningen**, den ene rett bak den andre, skulder i skulder (om de går inni hverandre, kan ikke avgjøres fra siden). Den fjerde står på babord side akter med snella og uten maskin. | Én maskin per mann, fordelt på begge sider (F21). | `jigSpot` (`deckcrew.js:129–130`), `JIG_Z` (`view3d/13-instruments.js:347`: 1,33 og 2,03 bare 0,7 m fra hverandre); sett i `juksa_maskin_liggende_3.jpg` | B |
| Juksa | Samme bilde: to i åpningen rett bak hverandre, én om styrbord akter, én om babord akter som ser ut til å stå med ryggen mot ripa. 12 opp og 12 bløgget. | Den som jukser, står vendt ut over ripa. | sett i `juksa_jig_liggende_2.jpg` | B |
| Garn, sett | Garnet går fra karet under lyet til babord **på skrå over hele akterdekket**, forbi aktermasta, og ut over styrbord hekk ved siden av garnrulla, der én sitter (`pause:sit`) i garnets vei; garnrulla i galgen brukes ikke. De to på haleren er inne. | Garnet føres over hekken eller garnrulla fra binga akter, og én passer det; ingen sitter i veien. | F4, F20 (`view3d/10-gear.js:232`); sett i `garn_sett_liggende_3.jpg` | B |
| Line, sett | Lina går i en bue fra stampen under lyet over akterdekket til hekken; ingen ved stampen (F4). Den ene på dekket står i babord hekk. | | F4; sett i `line_sett_liggende_2.jpg` | B (F4) |
| Garn, trekk | Garnet inn med fisk (`hold` 26) over den tomme haleren (raden øverst); sprutflekkene dekker haleren i to av tre bilder. | | sett i `garn_trekk_liggende_2.jpg`, `_3.jpg` | (over) |
| Kaste loss, til feltet | Ved kaia står fire akter (`lean`, `sit`, `chat`, `look`) og ingen ved roret; så går skipperen til roret og tre inn. Tauene synes ikke. Til feltet: skipperen ved roret, de tre inne. | | F1–F3 som felles; sett i `felles_kast_liggende_1.jpg` | **A** (felles) |
| Inn til kai | Klippet begynner ute og slutter med båten fortøyd sett ovenfra; innseilingen synes ikke. Json: ingen ved roret, fire på pause (F3). | | sett i `felles_inn_liggende_2.jpg` | **A** (F3) |
| Lossing | Lasten var 0. Mottakets krok henger over bakken forut; luka står under lyets tak, så hvor karene ville bli løftet, kan ikke avgjøres. Mannskapet har pause (F10). | | F10; sett i `felles_loss_liggende_1.jpg` | C |
| Rydde, hvile | Slangen og kosten som pause (F12), spylingen under lyet og ved aktermasta; kokken inne, ingen spiser (F13). | | sett i `felles_rydd_liggende_2.jpg` | B (F12), C (F13) |
| Hvite flekker | Som felles, store ved haleren under garntrekket. | | `24-cinema.js:497` | B (felles) |

**F18 og lyet:** Ja, delvis. Sløyingen synes ikke helt, fordi lyets tak skjuler overkroppen, men folkene står der arbeidet er. Det som er verre på breisjarken, er at haleren og bløggeren ikke tegnes i det hele tatt (1,2 m-regelen), så **ingen** synes ved haleren i noe trekk.

**Karakteren:** 72 i grunnlaget (K6 11). Klippene viser tre funn med alvor A som er breisjarkens egne (ingen ved haleren og blødekaret i noe trekk; teinestabelen gjennom masta og karet der sløyeplassen er; de to som sorterer, inni hverandre), i tillegg til F1–F3. K6 går fra 11 til **7**. K1 5, K2 16, K3 13, K4 5, K5 7, **K6 7**, K7 9, K8 6 = **68**.

**Til Jonas:** Breisjarken har plassene riktig (haleren forut i åpningen, blødekaret akter for den, sløyebordet over luka til babord), men ingen står ved haleren når lina, garnet og teinene trekkes, og teinestabelen fyller hele rommet under lyet.

**Etter OB11 (10.11.2026, grenen `ccr-7c6616f1-m5zscg`; `docs/skipsmodeller/breisjark-grunnlag.md` kap. 10):** haleren er senket til 0,30 m over ripa (0,97 m over dørken), så den som haler og den som bløgger, står ved den i trekkene (F24, uten å røre regelen i `deckcrew.js`). Hekken har fått **setteport** mellom galgens stolper (1,2 m bred, terskelen 0,58 m over dekket, rulle i terskelen), og garnkaret og stampene står på dørken akter for luka i stedet for under lyet til babord: redskapet går rett akterover og ut gjennom porten, 0,25–0,32 m klar av aktermasta (F20 og raden «Garn, sett»; før gikk det på skrå over hele akterdekket og gjennom akterskansen). Teinestabelen står på det åpne akterdekket der OB16 la den (styrbord for midten; en plass til babord ble prøvd, men dekkskartet har ikke gulv inntil casingen), teina tømmes i den åpne sida akter for blødekaret (`kit.pots.spot`), og de to ved haleren og karet står side om side. **Juksaplassene: to** om styrbord (valg 32, Jonas 10.11.2026: «den burde ha 2 maskiner»: ripa er lav en meter lenger akter om styrbord, én plass i den åpne sida og én akter for lyets hjørne; akterskansen ellers er 1,46 m høy), `jukseMax` 6 → 2. Bremmen på taket (valg 26), veggene uten striper (291 → 1 i `flatnorm`), spillets vannlinje den tomme båtens (`WLE`, 6 cm under tegningens: 20,05 t), `STAB_AT.breisjark` mot modellen. Står igjen: F18 (takkanten skjuler dem som sløyer), F1–F3 og F10 (felles), og de tre som ikke har maskin når det jukses. **Egen evaluering 68/100 etter Jonas' skala, under 75: ikke ferdig** (grunnlaget 10.6; skrog 15, detaljer 13, lanterner 3, styrhus 7, arbeidsflyt 16, dekk 14).

Bilder til Jonas:
- /tmp/claude-0/-home-user-FishyBusiness-/07394754-f521-5fe7-add0-683e101280de/scratchpad/ombord/breisjark/line_trekk_liggende_2.jpg
- /tmp/claude-0/-home-user-FishyBusiness-/07394754-f521-5fe7-add0-683e101280de/scratchpad/ombord/breisjark/teiner_trekk_liggende_3.jpg
- /tmp/claude-0/-home-user-FishyBusiness-/07394754-f521-5fe7-add0-683e101280de/scratchpad/ombord/breisjark/teiner_sett_liggende_2.jpg
- /tmp/claude-0/-home-user-FishyBusiness-/07394754-f521-5fe7-add0-683e101280de/scratchpad/ombord/breisjark/juksa_sloy_liggende_2.jpg
- /tmp/claude-0/-home-user-FishyBusiness-/07394754-f521-5fe7-add0-683e101280de/scratchpad/ombord/breisjark/juksa_maskin_liggende_3.jpg
- /tmp/claude-0/-home-user-FishyBusiness-/07394754-f521-5fe7-add0-683e101280de/scratchpad/ombord/breisjark/garn_sett_liggende_3.jpg

### 4.9 Kystbåten 15 m (`kyst15`, `kyst15.py`): forslag 71/100 (satt 76, godkjent)

Data: 14,99 m, 75 t (tom båt), `crewMax` 5 (bare fire agenter i opptaket), 6 køyer, bysse og messe, **shelterdekk** over hele arbeidsdekket med halestasjonen åpen om styrbord fra x 4,60 til 7,80 (ripa 0,95 m, 2,04 m under shelterdekket), haleren 7,30 forut i åpningen, blødekaret 6,55, luka 5,30–6,10 og eget sløyebord langs innerveggen, alt under shelterdekket; garnkaret, stampene og de seks lasteplassene **på shelterdekket**, kran 1 t akter om babord på shelterdekket, styreseil på mesanen, `jukseMax` 8 (`JIG_Z` 3 plasser), `haler` 2 (ett anker), rigges for alle fire.

Opptakene: liggende, 2,8–3,6 bilder i sekundet, alle 16 klippene (kranen med). Klippesjekken er tom i alle klippene; ingen av funnene under er fanget av den.

| Operasjonen | Hva som er galt | Hvorfor det ikke er ekte | Kilde | Alvor |
|---|---|---|---|---|
| Fullt kar, sløying | **F18 bekreftet, og verre enn lest:** med 800 kg i karet er shelterdekket tomt i hele klippet. Json sier at alle fire arbeider (`sloy:at:gut` ×2, `is:at:pack` ×2), altså tegnet ved bordet under shelterdekket (ikke sendt inn, som F18 leste i koden), men kameraet står over shelterdekket akter om babord og ser ikke halestasjonen. | Arbeidet skjer riktig under shelterdekket, men spilleren ser et tomt dekk hver gang karet er fullt; kameraet må se inn i halestasjonen (fra styrbord, som juksaklippene gjør). | F18; `deckcrew.js:187–189`; kameraet `view3d/24-cinema.js`; sett i `juksa_sloy_liggende_2.jpg`, `_3.jpg` | **A** |
| Trekk (line, garn, teiner) | **Ingen ved haleren og ingen ved blødekaret** i noe trekk (`haling:in`, `blogg:in`, ikke tegnet): haleren står 1,25 m over arbeidsdekket (ripa 0,95 + 0,30), og regelen sender halerne inn over 1,2 m. Sett fra styrbord går lina og garnet inn i en tom haler; blødekaret står med blod. Den eneste som synes, står på shelterdekket med kaffe (`pause:coffee`). | Én haler og tar fisken av, én bløgger; begge synes gjennom åpningen. | `deckcrew.js:190`; `kyst15.py:44, 385, 1093`; sett i `line_trekk_liggende_2.jpg`, `garn_trekk_liggende_2.jpg` | **A** |
| Haleren | **Halerens fot går ned utenpå skroget**: stolpen fra haleren forut i åpningen står på utsiden av skutesida ned til stripa (line- og garnhaleren). Ankeret står 5 cm innenfor ripa; med utfallende sider kommer en loddrett stolpe ut gjennom skroget nedenfor. | Haleren står på ripa eller en sokkel innenfor, med armen ut over sida. | `kyst15.py:1093` (`hauler`), `tools/gear/haler.py`; sett i `line_trekk_liggende_2.jpg`, `garn_trekk_liggende_2.jpg` | B |
| Garn og line (valg 19) | **Valg 19 synes:** garnkaret (blått) står på shelterdekket rett over halestasjonen mens garnet hales inn under det, og de tre stampene står ved styrbord rekke på shelterdekket under linesettingen, med én (`pause:back`) inntil dem (om han står i stampene eller bak dem, kan ikke avgjøres). Hvordan lina og garnet kommer fra haleren og opp i karet, vises ikke. | Garnet går fra haleren rett i binga ved siden av, lina i stampen ved haleren; ingen bærer redskapet opp en etasje. | `kyst15.py:1055–1056` (`sdeck`); sett i `garn_trekk_liggende_2.jpg`, `line_sett_liggende_2.jpg` | B |
| Sette line, garn, teiner | Settes over hekken fra shelterdekket; ingen passer stampen eller garnet (F4), de på haleren er inne. Teinestabelen synes ikke noe sted (verken på shelterdekket eller i åpningen fra den vinkelen); to står ved rekka på shelterdekket. | | F4, F7; sett i `garn_sett_liggende_2.jpg`, `teiner_sett_liggende_3.jpg` | B (F4) |
| Juksa og juksamaskinene | Tre maskiner i åpningen (`JIG_Z`), men bare de to akterste har folk, skulder i skulder; **de to andre «jukser» fra rekka på shelterdekket**, over 2 m høyere, side om side, uten snelle eller maskin, med hendene på rekka. Den fremste maskinen står uten folk. | Alle som jukser, står ved hver sin maskin ved ripa i halestasjonen (3 av 8 får plass, kjent). | `jigSpot` (`deckcrew.js:129–130`, faller tilbake til `PT.spot`), `JIG_Z` (`13-instruments.js:347`); sett i `juksa_jig_liggende_2.jpg`, `juksa_maskin_liggende_2.jpg` | B |
| Teiner, trekk | Teinedaviten fra shelterdekkets kant ned til haleren ved ripa, riktig. De tre som sorterer (`sort:at:tend`), står i den akterste delen av åpningen ved det blå karet; om de står inni hverandre, kan ikke avgjøres (for smått). Ingen ved haleren (raden over). | | sett i `teiner_trekk_liggende_2.jpg` | C |
| Kranen (frakt ved kai) | Båten ligger med styrbord mot kaia; **kranen står akter om babord**, borte fra kaia (F22). Frakten (seks paller) står plutselig på shelterdekket forut for kranen uten at kranen er sett svinge ut: den står halvt reist innover dekket hele klippet. To vinker ved pallene (`last:at:guide`), ingen kjører kranen (F23). | Kranen legges mot kaia; én kjører, én hekter på, lasten kommer i kroken. | F22, F23; `kyst15.py:1057–1058`; sett i `felles_kran_liggende_1.jpg`, `_2.jpg` | B |
| Rydde | Slangen og kosten brukes på shelterdekket (spylevannet går ned trappeåpningen), mens fisken ble sløyd i halestasjonen under (F12). | Det er halestasjonen og sløyeplassen som spyles. | F12; sett i `felles_rydd_liggende_2.jpg` | B |
| Kaste loss | Ved kaia står de fire på shelterdekket ved styrbord rekke, ingen ved roret; tre er ennå på shelterdekket når hun går (`walk`). Tauene synes ikke. | | F1–F3 som felles; sett i `felles_kast_liggende_1.jpg` | **A** (felles) |
| Til feltet | Skipperen ved roret, de tre inne. Styreseilet står også i fart (slik skriptet vil, `kyst15.py:20`); om det skal stå under gange, er et skjønn. | | | – |
| Inn til kai | Kan ikke vurderes: kameraet står i snøen på land, og bildene er hvite. Json: ingen ved roret (F3). | | sett i `felles_inn_liggende_2.jpg` | – (opptaket); **A** (F3) |
| Lossing, hvile | Lasten var 0; mottakets krok over shelterdekket forut, mannskapet har pause (F10). Kokken inne, ingen spiser (F13). | | sett i `felles_loss_liggende_1.jpg` | C |
| Hvite flekker | Som felles. | | `24-cinema.js:497` | B (felles) |

**F18 og valg 19:** Ja, begge synes. Sløyingen er helt usynlig (alle fire under shelterdekket, kameraet over), og i tillegg tegnes ingen ved haleren og blødekaret (1,2 m-regelen), så **ingenting av fisket på kyst15 synes etter at juksa er over**. Garnkaret, stampene og frakten står på shelterdekket mens redskapet hales en etasje under (valg 19 A støttes av bildene).

**Karakteren:** 76 i grunnlaget (K6 12). Klippene viser to funn med alvor A som er kyst15s egne (sløyingen usynlig; ingen ved haleren og blødekaret), i tillegg til F1–F3, og flere B (haleren gjennom skroget, juksa fra shelterdekket, redskapet på feil dekk, kranen). K6 går fra 12 til **7**. K1 6, K2 18, K3 13, K4 5, K5 9, **K6 7**, K7 9, K8 4 = **71**. Den eneste godkjente båten faller da under 75; med K6 9 (taket så lenge en A står åpen) ville hun fått 73. Begge A-funnene er regler i koden (1,2 m-grensen og kameraets plass), ikke modellen.

**Etter OB12 (11.11.2026, arbeidsrutinen, grenen `plan/2026-11-11-90`, PR #64; `docs/skipsmodeller/kyst15-grunnlag.md` kap. 10):** arbeidsdekket går akterover under shelterdekket til speilet, med **setteport i hekken** (valg 19) og garnkaret og stampene på arbeidsdekket rett innenfor; garn og line settes ut gjennom porten. En **luke til i styrbord side** akter for haleporten gir fire juksaplasser med en armlengde imellom (`jukseMax` 8 → 4, valg 31 A), og ingen jukser fra shelterdekket. Halerens fot står innenfor skroget, taket har fått brem (valg 26), stripene på styrhusveggene er borte, og modellen er eksportert på nytt (sidene like). F18: `tests/ombord.py` har et lavt kamera fra siden og aktenfra for arbeid under shelterdekk, så bildene ser inn; spillerens eget kamera er ikke endret. Karakteren satt som egen evaluering av en uavhengig sensor: **68** (16 + 12 + 3 + 6 + 17 + 14), under 75. Det som mangler mest: de som sløyer, står i en klump (F19, felles), ryddingen skjer på shelterdekket (F12, OB14), porten og åpningene har ingen lemmer, og lanternene, roret og undervannsskroget er ikke vist i bilder. Bildene: `docs/okter/2026-11-11-ob12/`.

**Til Jonas:** Kyst15 har plassene riktig under shelterdekket, men spilleren ser ingen av dem: sløyingen skjer der kameraet ikke ser, ingen står ved haleren, og garnet og stampene står en etasje over der redskapet hales.

Bilder til Jonas:
- /tmp/claude-0/-home-user-FishyBusiness-/07394754-f521-5fe7-add0-683e101280de/scratchpad/ombord/kyst15/juksa_sloy_liggende_2.jpg
- /tmp/claude-0/-home-user-FishyBusiness-/07394754-f521-5fe7-add0-683e101280de/scratchpad/ombord/kyst15/garn_trekk_liggende_2.jpg
- /tmp/claude-0/-home-user-FishyBusiness-/07394754-f521-5fe7-add0-683e101280de/scratchpad/ombord/kyst15/line_trekk_liggende_2.jpg
- /tmp/claude-0/-home-user-FishyBusiness-/07394754-f521-5fe7-add0-683e101280de/scratchpad/ombord/kyst15/juksa_jig_liggende_2.jpg
- /tmp/claude-0/-home-user-FishyBusiness-/07394754-f521-5fe7-add0-683e101280de/scratchpad/ombord/kyst15/line_sett_liggende_2.jpg
- /tmp/claude-0/-home-user-FishyBusiness-/07394754-f521-5fe7-add0-683e101280de/scratchpad/ombord/kyst15/felles_kran_liggende_2.jpg

### 4.10 Den eldre kystbåten 21 m (`kyst21`, `kyst21.py`): anslag 48/100 (ingen satt; ikke revidert)

Data (`02-species-gear.js:164`): 21 m, 7,2 m bred, 3,4 m dyp, `disp` 190 t (modellen gir **249 t**, +31 %, grovt anslag), 6+1 (fire agenter i opptaket), 8 køyer / 4 lugarer, rom 90 m³, dekkslast 10 t, **kran 2 t** (moderne knekkbom på forbakken babord, M16), `jukseMax` 8 (på `jigRail`, ikke `JIG_Z`), `haler` 2 (ett anker), garn 240, stamper 33, teiner 30, bygd 1978, bysse og messe, åpent arbeidsdekk (ingen shelter, `open: False`). Haleren på styrbord ripe ved galgen (x 12,0), blødekaret (9,3) og sløyebordet (10,2–11,1) rett akter for den om styrbord, garnet og stampene på luka (`kyst21.py:429–457`). Ingen slange i modellen.

Opptakene: liggende, 3,0–4,4 bilder i sekundet, 14 klipp. **Sette line og sette garn ble hoppet over** (`SKIP`: «Fartøy på 21–27,99 m kan ikke fiske torsk, hyse, sei innenfor grunnlinjen her»), så linesettingen og garnsettingen kan ikke vurderes. Klippesjekken er tom i alle klippene; ingen av funnene under er fanget av den.

| Operasjonen | Hva som er galt | Hvorfor det ikke er ekte | Kilde | Alvor |
|---|---|---|---|---|
| Trekk (line, garn, teiner) | **F24 rammer kyst21 også, og verst i garntrekket:** haleren står 1,30 m over dekket (ripa 0,95 + 0,35), så den som haler og den som bløgger, sendes inn i alle tre trekkene (`haling:in`, `blogg:in`). I garntrekket er **alle fire inne**: garnet går inn i en tom haler ved galgen, og dekket er tomt. I linetrekket står den ene som er ute, og lener seg ved styrhuset (`pause:at:lean`). Det er ingen ly eller noe shelterdekk her. Haleren står på ripa der en mann på dekket når den, så det er regelen som er feil, ikke modellen. | Én står ved haleren og haler hele trekket, én bløgger ved karet rett akter for den. | F24; `deckcrew.js:190`; `kyst21.py:434` (`hauler`: `z_top + 0.35`, dekket `z_top − 0.95`); sett i `garn_trekk_liggende_2.jpg`, `line_trekk_liggende_2.jpg` | **A** |
| Teiner, trekk | Teinedaviten står over ripa ved galgen uten noen ved haleren (raden over). **De tre som sorterer, står i én klump** ved brettet innenfor galgen, med fargene i hverandre. Alle tre får samme mål (`at(PL.pot)`), og `claim` skiller dem bare med 0,4 m (`SEP`), så de står trolig inni hverandre (for smått til å avgjøre helt). Ingen teinestabel kan skilles ut (F7). | Én haler og tar teina inn, én eller to tømmer og sorterer side om side ved bordet, én stabler. | `deckcrew.js:194` (`sort`), `:17` (`SEP` 0,4), `:321–329`; F19, F7; sett i `teiner_trekk_liggende_2.jpg`, `_3.jpg` | **A** (F19) |
| Fullt kar, sløying | Riktig sted (bordet og blødekaret om styrbord akter for galgen, på åpent dekk, synlig). Men de tre som sløyer og den som iser, står i en klump ved bordet og karet, slik at kroppene går i hverandre i begge bildene. Bordet er 0,9 m langt. Nummer to og tre skal stå 0,7 m forut og akter, så om de faktisk står inni hverandre, kan ikke avgjøres sikkert. | To–tre ved et bord står side om side eller på hver sin side; isingen ved luka. | F19; `deckcrew.js:133–137` (`deckAt`); sett i `juksa_sloy_liggende_2.jpg`, `_3.jpg` | **A** (F19, usikker) |
| Juksa og juksamaskinene | Alle fire på styrbord: tre skulder i skulder ved ripa foran styrhuset, maskinene under en meter fra hverandre, og den fjerde **mellom galgebeina** ved haleren (om et bein går gjennom ham, kan ikke avgjøres). Babord ripe er tom (F21). Ellers er grepet riktig: jukset over ripa, fisken opp og bløgget (11 opp, 9 bløgget). | Maskinene fordeles langs begge ripene med armlengdes avstand, ikke inne i galgen. | F21; `jigRail`, `jigSpot` (`deckcrew.js:129–130`); sett i `juksa_jig_liggende_2.jpg`, `_3.jpg`, `juksa_maskin_liggende_2.jpg` | B |
| Kranen (frakt ved kai) | **Kranen står på babord side av forbakken, mens båten alltid legges med styrbord mot kaia** (F22). Skriptet sier at kranen «når ut over kaia» (`kyst21.py:443–444`), noe som bare stemmer med babord til. Kranen står foldet opp hele klippet, og pallene står plutselig på luka (F23). To vinker (`last:at:guide`), og ingen kjører kranen. En moderne rød knekkbomkran på en båt fra 1978 synes i alle klippene (M16). | En kranbåt legger kranen mot kaia; én kjører, én hekter på. En 1978-båt hadde lastebom eller en eldre kran. | F22, F23, M16; `kyst21.py:457`; sett i `felles_kran_liggende_1.jpg`, `_2.jpg` | B |
| Sette teiner | Ingen setter: én er inne (`haling:in`), tre har pause (kniv, røyk, redskap). Ingen teinestabel og ingen går med teina til ripa (F4, F7). | | F4, F7; sett i `teiner_sett_liggende_1.jpg` | B (F4) |
| Rydde | Slangen og kosten brukes **på babord sidedekk langs dekkshuset og ved forbakken**, mens sløyingen var om styrbord akter for galgen (F12). Slangen kommer ut av ingenting (ingen i modellen). | Det er sløyeplassen og haleplassen som spyles, fra en slange som henger fast. | F12; sett i `felles_rydd_liggende_2.jpg`, `_3.jpg` | B |
| Kaste loss | Båten ligger med styrbord til. Kameraet blir stående ved kaia mens båten går ut av bildet etter noen sekunder (bildene 2–6 viser en tom kai, med regelmeldingen over). Json: skipperen går til roret først når hun går (`ror:walk`). | | F1–F3 som felles; sett i `felles_kast_liggende_1.jpg`, `_2.jpg` | **A** (felles) |
| Til feltet | Skipperen ved roret, de tre inne: riktig. | | | – |
| Inn til kai | **Kameraet sto ikke i bygningene** (det sto høyt over båten). Men båten glir inn over en snødekt holme, med baugen og halve båten på land, fordi opptaket begynner innseilingen der det er land, som på `sjarkny`. Det er en feil i opptaket, ikke i spillet. Json: ingen ved roret (F3). | | `tests/ombord.py:112`; sett i `felles_inn_liggende_2.jpg`, `_3.jpg` | – (opptaket); **A** (F3) |
| Lossing | Sett ovenfra: mottakets kran over luka, styrbord til kaia. Lasten var 0, og mannskapet har pause (F10). | | F10; sett i `felles_loss_liggende_2.jpg` | C |
| Hvile | Kokken går inn, de to andre er på dekk med telefon og kaffe, og ingen spiser (F13). | | F13 | C |
| Hvite flekker | Som felles (sprutflekker rundt båten i flere klipp). | | `24-cinema.js:497` | B (felles) |
| Utstyret ellers | Haleren ved galgen og blødekaret, bordet og garnet/stampene rett akter for den på luka er en logisk rekkefølge. Bare én garnhaug mot 240 garn og høyst 8 stamper mot 33 (F8, verst av de ti). Haler nr. 2 kan ikke vises (ett anker). | | F8; `kyst21.py:442` | B (F8) |

**F24:** Ja, F24 rammer kyst21, også uten ly eller shelterdekk. Haleren står 1,30 m over dekkskartet, over grensen på 1,2 m, og i garntrekket er dekket helt tomt. Grensen i `deckcrew.js:190` treffer altså vanlige haler på ripa på de større båtene, ikke bare de overbygde.

**Karakteren (anslag, ikke satt):** Ingen grunnlag finnes, så alle åtte punktene er mine grove anslag ut fra rapport-modeller.md 2.10, kap. 4 i den rapporten og klippene. De må settes på nytt i revisjonen etter pilotens arbeidsmåte.
- **K1 3/15:** Kildene var Jonas' bilder av gamle kystbåter (Hindholmen, Erkna), og de ligger ikke i repoet. Det finnes ingen tegning og ingen overlegg, og målene er spillets.
- **K2 11/20:** 249 t mot 190 t (+31 %, grovt). Skroget er rader fra spantene, ikke én flate (`3d-baater-og-animasjon.md:161`). M12 gjelder: glatt stål uten sveis eller plateskjøter.
- **K3 10/15:** «God karakter, middels detalj»; Blender-løftet ga rust, teakdører, eikeratt og lanterner. Det trekker ned at kranen er moderne (M16), at det ikke er propell eller anoder (U7), at støtteseilet ikke er en egen del, og at det er 4 livbøyer mot 3.
- **K4 4/5:** Masthead-, side- og hekklanterne står som ankre, men ingen har sett dem om natta.
- **K5 6/10:** Broen er bare rettet etter `brotest` (klossene ble til vegger); skjermene og utsikten fra rattet er ikke vurdert.
- **K6 7/15:** Juksa og sløyingen synes på åpent dekk (bedre enn kyst15), og rekkefølgen haler–kar–bord–luke er logisk. Mot dette står to A-funn (F24 med tomt dekk i garntrekket, og klumpene ved sorteringen og bordet, F19), F1–F3 og flere B: kranen bort fra kaia, juksaklumpen, ryddingen på feil side og settingen uten folk. Taket er 9 så lenge en A står åpen.
- **K7 4/10:** Ingen `check()` er dokumentert, `deckshot` er rød på kranen (`BACKLOG.md:135`), og bildene finnes ikke i begge formater.
- **K8 3/10:** Båten er ikke revidert og har ingen gjennomgang med Jonas. Lastebommen og støtteseilet ble skrevet inn i skriptet uten grunnlag.

Sum: 3 + 11 + 10 + 4 + 6 + 7 + 4 + 3 = **48** (planen sa «rundt 50»). Det som løfter mest: et grunnlag med mål og bilder (K1, K2), `disp` avgjort som tom eller lastet, og F24 rettet i koden (K6).

**Til Jonas:** På den gamle 21-meteren står ingen ved haleren i noe trekk, og i garntrekket er dekket helt tomt. Det er den samme 1,2 m-regelen som på kyst15, men her er dekket åpent. I tillegg står den moderne kranen på motsatt side av kaia.

Bilder til Jonas:
- /tmp/claude-0/-home-user-FishyBusiness-/07394754-f521-5fe7-add0-683e101280de/scratchpad/ombord/kyst21/garn_trekk_liggende_2.jpg
- /tmp/claude-0/-home-user-FishyBusiness-/07394754-f521-5fe7-add0-683e101280de/scratchpad/ombord/kyst21/teiner_trekk_liggende_3.jpg
- /tmp/claude-0/-home-user-FishyBusiness-/07394754-f521-5fe7-add0-683e101280de/scratchpad/ombord/kyst21/juksa_jig_liggende_2.jpg
- /tmp/claude-0/-home-user-FishyBusiness-/07394754-f521-5fe7-add0-683e101280de/scratchpad/ombord/kyst21/juksa_sloy_liggende_3.jpg
- /tmp/claude-0/-home-user-FishyBusiness-/07394754-f521-5fe7-add0-683e101280de/scratchpad/ombord/kyst21/felles_kran_liggende_2.jpg

**Etter OB13 (11.11.2026, steg 91, Jonas' økt, grenen `claude/charming-faraday-my9nnq`): 70/100, ikke ferdig.** Båten er bygd på nytt etter pilotens arbeidsmåte (`docs/skipsmodeller/kyst21-grunnlag.md`): skroget som én flate på 190,1 t (249 før), bakken i full høyde, et akterdekk bak huset med garnkarene og en setterull i hekken (F20), haleren under galgen med blødekaret og et sløyebord på 2,0 m for tre side om side (F19), den som iser ved luka, åtte juksaplasser fordelt på begge sider (F21), teinestablene og lasteplassene regnet mot spillets bokser, lanternene etter vedlegg I for 20 m og over, brem på taket og åpne spygatt (valg 26). 141 982 trekanter nær (Jonas 11.11.2026: «Dette burde bli en vakker båt rett og slett»). Karakteren er satt av en uavhengig underagent: skrog 16, detaljer 14, lanterner 3, styrhus 7, arbeidsflyt 15, dekk 15. Det som trekker ned og ikke er rettet: klumpen ved galgen i teinetrekket, utsikten fra roret (bakken, masta og bommen), det flekkete dekket, det nakne akterdekket, lanternene ikke sett om natta til sjøs, og kranen (M16, spillets felles). Runde 2 står i `docs/planer/start/91.md`. Bildene: `docs/okter/2026-11-11-ob13/`.

### 4.11 Etter OB2 (09.11.2026): arbeidsflyten med fortøyningen, forslag

OB2 (steg 80, grenen `ccr-a9ccd5ec-it307t`) rettet F1, F2 og F3 for alle båtene med mannskap: fenderne henges ut av hendene på vei inn, tauene kastes fra der hånden står, skipperen står ved roret til hun ligger, og ingen går inn før tauene og fenderne er inne og tauene kveilet (5.19c i `docs/systemer/folk-om-bord.md`). F22 (siden mot kaia) er flyttet til OB4. De andre A-funnene står, så K6 holdes under taket på rundt 60 %; forslaget er ett poeng opp på K6 (skalaen fra revisjonen, 15 poeng) for hver av dem. **Karakteren settes av økta som en egen evaluering (Jonas 10.11.2026).**

| Båt | K6 før | K6 forslag | Sum før | Sum forslag | Det som fortsatt holder K6 nede |
|---|---|---|---|---|---|
| `snekke` | 8 | 9 | 67 | 68 | juksaplass 2 i hardtopstolpen, teinene gjennom karet og folkene |
| `plastsjark` | 7 | 8 | 63 | 64 | redskapet gjennom styrhuset, teinene, juksa i klump |
| `sjark` | 7 | 8 | 61 | 62 | de to ved sløyebordet inni hverandre, teinene og garnet gjennom redskapsrommet |
| `hurtigsjark` | 8 | 9 | 59 | 60 | teinestabelen over akterdekket |
| `sjarkny` | 7 | 8 | 66 | 67 | to og to inni hverandre, teinestabelen over benken |
| `breisjark` | 7 | 8 | 68 | 69 | ingen ved haleren (F24), teinestabelen, sorteringen |
| `kyst15` | 7 | 8 | 71 | 72 | sløyingen usynlig (F18), ingen ved haleren (F24) |
| `kyst21` | 7 | 8 | 48 | 49 | F24, F19, ikke revidert |

Trebåten og skiffen har faste figurer og tas i OB1 og OB5. Det OB2 fant om båtene: på breisjarken, kyst15, kyst21 og de to hurtigsjarkene er foredekket ved baugklampen ikke i dekkskartet, så baugtampen og fenderen forut tas fra den forreste plassen ved skutesida mannskapet kan stå på (2,5–6 m akter for klampen i modellen; tauet føres derfra). Om foredekket skal kunne gås på, hører til båtfasene OB9–OB13.

### 4.12 Koniske teiner i stabler (OB16, 09.11.2026, Jonas' økt, grenen `ccr-f04f4a09-btm7go`)

Jonas 09.11.2026, med et bilde av koniske teiner stablet i hverandre: «Denne typen teiner er mer plass-vennelig på alle typer båter». Under økta: «Tanken er å bruke dem til kongekrabbe. De firkantige teinene kan vi sikkert fjerne fra spillet», med et bilde av en kongekrabbeteine til salgs («Kongekrabbeteine 145x80x70 cm, 45 kg»), og et av en rød eggfløyt («brukes som flottør i bl.a. fisketeiner og kongekrabbeteiner», 120 × 150 mm): «Er dette aktuelt for oss?» (ja: på stroppen).

**Teina** (`tools/gear/teine.py` `kong`, `src/data/gear-pot.b64`): bunnring 1,45 m, toppring 0,80 m, 0,70 m høy, 45 kg, etter Jonas' bilde (søk etter Fiskeridirektoratets og Havforskningsinstituttets mål på en konisk kongekrabbeteine fant ingen; HI 2003 om fluktåpninger og J-136/J-138-2026 om reglene). Svart bunnring, åtte stag, grønt notlin snørt med blått tau, hvit plasttrakt med trinn fra toppringen ned i teina, agnboks under trakten, bunnen snørt igjen (tømmes gjennom den), merkelappen (§ 66), stroppen og eggfløyten. **Ingen fluktåpning:** vest for 26° Ø skal teinene være uten (J-138-2026, `core/03e-rules.js` kc5); øst for linja krever J-136-2026 fire på 150 mm, som modellen ikke viser (antatt, B). Egen teine, ikke snøkrabbeteina (den er 1,30 m, mørkeblå, med rømningshull etter vedlegg 3 f). Antatt: trakten 0,40 m nederst 0,34 m over bunnen, 0,15 m mellom to i stabelen, ti i en full stabel. `POTS.big` har fått `cone`, `kg:45` og `dim`; `STAB_W.potBig` 25 → 48 kg (teina med tau og fløyt). Den firkantede teina og luka er ute av modellen og koden; `potsUnfit` og lagringene er som før (teinene heter `big`).

**Koden** (`view3d/10-gear.js`): `potSet` velger snøkrabbeteina (`VESSELS.pot` `sno`) eller kongekrabbeteina; `potPlaces` gir stablenes plasser (`kit.pots.at` `[x, y, z, ry, h]`, h det meste i den stabelen), og for en modell uten plasser en rad akter for haleren som den gamle stabelen (fire høy under 12 m, seks over). Teina kommer opp over davitten, legges ved haleren, veltes på siden over den indre kanten av bunnringen og tømmes mot karet, reises, egnes og settes på stabelen (`stackTop`); settingen tar den øverste fra stabelen. Snøkrabbebåtens eget arbeid (`snoWork`) er som før. Davitten står nå også ved hvile på båter med plasser (før skjulte `kit.pots` den).

**Plassene** (`tools/boats/potplaces.json`, lest av båtskriptene og skrevet inn i de eksporterte modellene av `tools/boats/potplaces.py` uten ny eksport, så skrogene er like byte for byte): funnet på dekkartet der en ring på 1,45 m står på ett gulv (hver celle under ringen, 5 cm mellom: en karm på én celle ble først hoppet over på kyst21, og `potshot` fant den) med stabelens høyde (til fløyten) fri over seg, unna haleren, stedet teina tømmes, krabbekaret, modellens eget sløyebord og kar, lasten og kranen; nærmest haleren først. Garnbinga og stampene står ikke på dekk når båten er rigget for teiner, så plassene deres kan brukes.

| Båt | Stabler | Plass til | `gearMax.teine` |
|---|---|---|---|
| `hurtigsjark` (`hurtig11`) | 1 × 6 (midt på dørken akter for haleren) | 6 | 18 |
| `sjarkny` (`hs11`) | 4 × 6 (én på dørken inn for haleren, to på luka og plattformen akter, én forut for haleren) | 24 | 21 |
| `breisjark` (`malo36`) | 1 × 6 (akter, utenfor lyet) | 6 | 20 |
| `kyst21` | 2 × 8 (ved haleren) + 2 × 7 (akter for huset) | 30 | 30 |
| `sjark` (`havsjark35`) | **ingen**: luka og sidedekkene er for smale for en ring på 1,45 m | 0 | 18 |
| `kyst15` | **ingen** under lyet (arbeidsdekket ved haleren er 1,2 m bredt); shelterdekket over er lasteplassen med kranen | 0 | 30 |
| `plastsjark` (`plast31`) | OB7 legger dem (fasen kjørte samtidig) | – | 12 |

Stedet der teina tømmes, er flyttet akter for teinemannen (`potDeck`: 1,3 m + ringens radius akter for haleren; før sto teina der han står, `deckcrew.js` `places().pot`), og plassene holder seg unna de to ved haleren, plukkeren, teinemannen og sonen teina veltes i. **Det som står igjen (OB3):** mannskapet går og står ikke utenom stablene (`deckcrew.js` vet ikke om dem), og fangstkarene på dørken er ikke med i plassfinneren.

**Valg 25, besvart A** (Jonas 09.11.2026: «Valg 25: A»): `gearMax.teine` er det dørken rommer: den brukte hurtigsjarken og breisjarken 6, den nye hurtigsjarken 21, kyst21 30. Havsjarken og kyst15 har ikke teiner i `rigs` (som snekka, valg 24 A): teinehaleren og krabbekaret passer ikke (`equipFits` `fit.rig`), og båtbladet sier at det ikke er plass til kongekrabbeteiner. En lagring med flere teiner enn plassen: `potsOver` (teinene om bord og i sjøen over `gearMax.teine`), og `potsUnfit` tar de overskytende om bord i land i havn og betaler dem tilbake til full pris (haleren og karet står); på havsjarken og kyst15 som før for snekka (teinene i havn, haleren og karet ved verftet). `gearHour` binder bare båtene i havn som har noe å ta i land. Sjekkene i `tests/unit/teiner.test.mjs` ble sett røde mot koden før. Plastsjarkens tall (12 nå) settes av OB7 når plassene er lagt.

### 4.13 Etter OB3 (11.11.2026): settingen og redskapet om bord

OB3 (steg 81, Jonas' økt, grenen `ccr-13ec41bb-wikvwe`) tok det felles arbeidet for båtene med mannskap på dekk; systemet står i «Settingen og redskapet om bord» i `docs/systemer/redskap.md`.

| Funn | Hva som er gjort | Står igjen |
|---|---|---|
| **F4** setting | Én står der redskapet går over og betaler det ut (rollen `sett`), de andre langer (`lang`); ingen ved haleren i trekkestilling. Dreggen kastes fra hendene hans. Gjennom linesetteren eller garnrenna når hun har den, ellers modellens plass over hekken, ellers over rekka. | Teinene settes fortsatt med én ved haleren. Kyst15 setter fra shelterdekket til OB12. |
| **F8** antallet | Alle stampene tegnes, stablet i lag (høyst fire), og de tomme blir om bord; de to første på magasinet. Garnet i 12 per kar, flere kar der dekket har plass, resten som høyere haug. | De fleste dekkene rommer bare ett garnkar (binger i båtfasene). |
| **F7** teinene | Stablene er ute av gangkartet (ingen står eller sitter i dem), og den andre som sorterer, har egen plass. | `potDeck` og `tankAt` kjenner ikke fangstkarene; sett bare på hurtigsjarken. |
| **F15** klippesjekken | `crewclip` prøver nå garntrekket, settingen av line og garn og teinene, og F4 og F19 på alle båtene. Enhetstesten `ombord.test.mjs` prøver plassene i Node. | Håndbåtene har fortsatt ingen klippesjekk (faste figurer). |
| **F19** to på samme punkt | Den tredje ved bordet tok den andres side (0,40 m på kyst15, kyst21, snøkrabbebåten, bunntråleren); nå minst 0,55 m på alle. | – |
| **F20** gjennom huset | Stampen det settes fra, står akter, så lina ikke går over dekket (hurtigsjarken: fra skjulet forut). | Garnets vei fra karet til hekken er ikke prøvd mot modellen. |
| **F21** juksa | Der plassene søkes (kyst21), står maskinene 1,0 m fra hverandre og festes annenhver side. De andre har modellens plasser fra båtfasene. | Kyst15 har bare styrbord (OB12). |
| **F24** haleren | Regelen på 1,2 m er rettet: den som haler og den som bløgger, står ved haleren på kyst15 og kyst21 (og alle andre). | På kyst15 synes de ikke fra kameraet (F18, OB12). |

**Arbeidsflyten etter OB3, egen evaluering (11.11.2026).** Satt av en egen underagent som bare fikk arkene med bildene og Jonas' skala (arbeidsflyt 0–25), og bare for det bildene viser (setting og trekk; ikke fortøyning, lossing eller sløying i detalj). Tallene er derfor ikke hele K6 for båten, og de erstatter ikke karakterene i 4.1–4.10; de sier hvor settingen og trekket står.

| Båt | Arbeidsflyt i setting og trekk (av 25) | Det som ser riktig ut | Det som trekker ned |
|---|---|---|---|
| `plastsjark` | 17 | Linesetter og garnrenne over hekken, én betaler ut der, stampene og garnkaret rett ved, ingen ved haleren | De som har pause, står i klynge ved renna og skulder ved skulder i ro; den ved garnrenna står rakrygget uten synlig grep |
| `hurtigsjark` | 16 | Teinetrekket: én ved haleren, én ved karet, teina på dekk | Teina ser ut til å gå inn i beina på én; under setting av teiner står én ved haleren og ingen ved teina |
| `sjark` | 15 | Setting akter gjennom renna med stampene eller karet ved siden; linetrekket med én ved haleren | De som har pause under setting, står forut ved haleren; i garntrekket står to tett; flagget står foran den som setter; garnkaret står langt fra haleren |
| `snekke` | 13 | Ingen ved haleren under setting; én ved haleren i trekket | Redskapet går over babord side midtskips (karene sperrer hekken); de to ved garnkaret står tett; garnhaleren står utsvingt under setting |
| `kyst21` | 13 (usikker: kameraet er langt unna) | Folk ved haleren i linetrekket | De ved haleren står tett; bare én juksamaskin synes bemannet fra kameraet |
| `kyst15` | 9 | Folk i halestasjonen under trekket (knapt synlig) | Setting midtskips fra shelterdekket, ikke akter; redskapet en etasje over haleren; ledige på dekket under trekket (OB12) |

Det evalueringen fant og OB3 ikke har rettet, står i backloggen under OB3: de som har pause, samler seg der arbeidet er; setting av teiner har ingen ved teina; flagget på havsjarken står foran den som setter.

Bildene før og etter står i `docs/okter/2026-11-11-ob3/`. Før-bildene er av snekka, havsjarken og kyst15 (setting, juksa for hånd, juksamaskin og trekk, begge formater), og av den brukte hurtigsjarkens teiner, kyst21s linetrekk og juksamaskiner, og plastsjarken med fullt redskap. Etter-bildene er av de samme, uten juksa på snekka, havsjarken og kyst15: juksaplassene deres kommer fra modellene og er ikke endret, så bildene ville vært like.

### 4.14 Etter OB4 (11.11.2026): lossingen, isen og båtens egen kran

OB4 (steg 82, Jonas' økt, grenen `ccr-309f2cf5-w71mxh`) tok arbeidet ved kaia for båtene med mannskap på dekk; systemet står i 5.19e i `docs/systemer/folk-om-bord.md` og «Liggeplassen» i `docs/systemer/havner-og-mottak.md`.

| Funn | Hva som er gjort | Står igjen |
|---|---|---|
| **F10** lossing | Én av mannskapet står ved karet og hekter stroppen på når kroken er nede (rollen `hekt`), én står ved rekka mot kaia og gir tegn mens kranen går (`luke`). Stillingen følger kroken. Mottakets kar står på fritt dekk under åpen himmel, ute av gangkartet; før sto fire på en fast firkant midt på dekket. Alene hekter skipperen på selv. | Ingen står nede i rommet og fyller karene: lukene er lukket i modellene, og karene fylles ikke synlig (båtfasene). Karet på plass to hopper til plass én når det første er løftet (fra før). Håndbåtene er som før. |
| **F11** is | Renna svinges mot iskassa, isen kommer gjennom en slange fra tuten, og én står ved kassa og holder slangen over den (`isrom`). | Kyst15 og den nye hurtigsjarken: iskassa står under shelterdekket og under skjulet, så isen faller fra tuten uten slange (OB12, steg 88). Kyst21: slangen går rundt sju meter over dekket til kassa om styrbord. På snekka (kassa under tofta) står han med hendene på kassa. |
| **F22** siden mot kaia | `berthPose` gir `side`: den nye hurtigsjarken, kyst15 og kyst21 (kranen om babord) legger babord til. Fortøyningen, fenderne, båtens kran, mannskapets plasser og Kystvakta utenpå følger siden. | Siden velges etter kranen, ikke etter kaia (innseilingen): hun kommer inn fra den andre kanten enn før; der det er stengt, tar `berthPath` veien rett ut fra kaia, som før. Fyllestussen for drivstoff står på siden bort fra kaia på de fleste båtene (nå også den nye hurtigsjarken). |
| **F23** båtens egen kran | Én kjører den med fjernkontroll ved kranfoten (`kran`), én hekter på og av ved frakta (`hekt`), kaia er på riktig side, og kassa henger i kroken hele veien mellom dekket og kaia. | Ingen på kaia hekter på eller av der. Lossingen av fisk går fortsatt med mottakets kran også på kranbåtene (spillets valg fra før). |

**Stikkprøven langs kysten (`/stikkprove`, hele kysten fra `kart-31`, 3D):** mottakene Husøy, Bøvågen (nærmest Bergen, 41 km), Bodø og Båtsfjord, med havsjarken (styrbord til), den nye hurtigsjarken og kyst21 (babord til). Alle tolv: liggeplass funnet, kaia på den siden `berthSide` sier, ingen del av båten på land, lossingen startet, én hekter på og én gir tegn, ingen lem gjennom modellen. Mottakets kran når karet overalt (rekkevidde 9,19 m): 8,9 m til havsjarkens kar akter om styrbord (knapt, og lenger enn før, da karene sto midt på dekket), 6,0 m på den nye hurtigsjarken og 5,9 m på kyst21. Veien inn akterfra er fri overalt unntatt for kyst21 i Bodø, der den er stengt med babord til (den var fri med styrbord til): hun tar da `berthPath` sin reservevei rett inn mot kaia. Isen: den som tar imot, var ennå på vei til iskassa da stikkprøven leste av (16 s under programvaretegning), så slangen er ikke sett der; den er bekreftet for seg ved Husøy: havsjarken, plastsjarken og kyst21 får isen gjennom slangen, den nye hurtigsjarken ikke (slangen måtte gått gjennom huset til kassa under skjulet).

**Arbeidsflyten i lossing, is og kran, egen evaluering (11.11.2026).** Satt av en egen underagent som bare fikk arkene med bildene (før og etter) og Jonas' skala (arbeidsflyt 0–25), og bare for det bildene viser. Tallene er ikke hele K6 for båten og erstatter ikke karakterene i 4.1–4.10.

| Båt | Før (av 25) | Etter (av 25) | Det som ser riktig ut | Det som trekker ned |
|---|---|---|---|---|
| `sjark` | 10 | 17 | Karet på fritt dekk akter, én ved karet, én ved rekka med armen opp; én ved iskassa under isingen | Ingen slange å se i bildene; karet står helt inntil rekka; krok og wire til karet synes ikke; de andre står bare |
| `sjarkny` | 8 | 14 | Babord og kranen mot kaia; karet på fritt dekk ved luka med én ved det; kassa ved kranen | Tegngiveren synes ikke (han står under skjulets tak); karet står på sjøsiden av dekket; isen og slangen synes ikke; ved egen kran ser den som hekter, ut til å stå i kassa sett rett ovenfra, og det kan ikke ses at kassa henger |
| `kyst21` | 8 | 12 | Babord og kranen mot kaia; kar og frakt på åpent dekk forut | Bildene er tatt for høyt til at folkene kan skilles; slangen, kranføreren og kassa i kroken kan ikke bekreftes |

Det evalueringen fant og OB4 ikke har rettet, står i backloggen under OB4: bildene av kyst21 er for høye til å bedømme arbeidet, og isslangen og kassa i kroken bør ses på nært hold av Jonas på nettbrettet (`docs/spill-dette/82.md`).

Bildene før og etter står i `docs/okter/2026-11-11-ob4/`: innseilingen, lossingen (oversikt og nært), isen og kranen for havsjarken, den nye hurtigsjarken og kyst21, i begge formater.

## 5. Båten i sjøen

Regnet i spillet uten 3D 09.11.2026 med `stabOf` (`core/03c-stability.js`), tom båt og med fullt rom eller kar (`holdCap`), uten redskap på dekk. Hiv og stamp i 3D kommer fra skrogsnittene i F2 (`hullSections`, `hullRest`, `hullStep`), rullet fra `stabOf`. Målt i sjø før (`fysikk-og-styring.md`, F2): sjarken ruller 11,5° signifikant i 3,45 m tverrsjø og stamper 9° i 6,1 m motsjø i 8,5 knop; skiffen stamper 4,6° i 2,7 m krapp sjø i 18 knop.

| Båt | `disp` t | Fullt rom kg | Dypgang tom → full m | Fribord tom → full m | GM tom → full m | Rulleperiode tom → full s | Dekkskanten i vannet ved, full |
|---|---|---|---|---|---|---|---|
| skiff | 1,0 | 500 | 0,19 → 0,25 | 0,56 → 0,50 | 2,09 → 1,84 | 1,5 → 1,6 | 22° |
| trebat | 1,9 | 500 | 0,33 → 0,39 | 0,60 → 0,54 | 0,50 → 0,54 | 2,9 → 2,8 | 26° |
| snekke | 3,0 | 1 000 | 0,39 → 0,47 | 0,63 → 0,55 | 0,65 → 0,71 | 3,0 → 2,9 | 22° |
| plastsjark | 6 | 3 500 | 0,54 → 0,73 | 0,68 → 0,49 | 0,72 → 0,84 | 3,5 → 3,2 | 16° |
| sjark | 12 | 6 500 | 0,77 → 1,03 | 0,72 → 0,46 | 0,77 → 0,95 | 4,2 → 3,8 | 13° |
| hurtigsjark | 12 | 5 000 | 0,78 → 0,98 | 0,73 → 0,53 | 0,65 → 0,80 | 4,3 → 3,9 | 15° |
| sjarkny | 15 | 7 000 | 0,81 → 1,05 | 0,73 → 0,50 | 1,16 → 1,27 | 3,9 → 3,7 | 12° |
| breisjark | 20 | 10 000 | 1,21 → 1,58 | 0,73 → 0,36 | 0,68 → 0,89 | 4,6 → 3,8 | 10° |
| kyst15 | 75 | 28 000 | 2,11 → 2,60 | 0,87 → 0,39 | 0,89 → 1,24 | 6,1 → 5,0 | 7° |
| kyst21 | 190 | 55 000 | 3,40 → 4,02 | 1,09 → 0,47 | 0,95 → 1,35 | 6,1 → 5,0 | 7° |

Funnene:

| # | Hva som er galt | Hvorfor det ikke er ekte | Kilde | Alvor |
|---|---|---|---|---|
| S1 | **Lasten trimmer henne ikke.** Likevekten legger tyngdepunktet over oppdriftssenteret, så hun ligger på rett kjøl uansett hvor lasten står: fullt rom akter, garnet på hekken eller teinene forut gir ingen trim. | En sjark med fullt rom ligger tung akter eller midtskips etter hvor rommet er, og 30 garn på hekken trykker hekken ned. | `core/03c-stability.js` `hullRest` («hun ligger på rett kjøl i stille vann») | B |
| S2 | **Ingen slagside.** Redskapet, karene og fangsten står i vekta med høyden, men ikke med siden; haleren som trekker 300 kg line om styrbord, gir ingen krengning. | Under trekket ligger en sjark merkbart over mot haleren, og en full fiskekasse på én side gir slagside på en liten båt. | `stabOf` (`load` har bare hold, dekk og redskap) | B |
| S3 | **Mannskapet veier ingenting.** 180 kg i skiffen og trebåten er 18 og 9 % av `disp`. | Folk som flytter seg i en liten båt, får den til å krenge. | `stabLoad` | C |
| S4 | **Fribordet og dekket er ikke modellens.** Fribordet regnes som 0,35 + 0,035 · L og skrogformen er parametrisk; Blender-modellenes egen vannlinje (volumet mot `disp` i kapittel 4) brukes ikke. Fullastet kyst15 og kyst21 har dekkskanten i vannet ved 7° og breisjarken 0,36 m fribord. | Tallene kan være rimelige, men de er ikke båtenes; modellens vannlinje og fysikkens kan vise forskjellig dypgang i bildet. | `hullOf`, `fysikk-og-styring.md` F2 («Formene under vann er anslått») | C |
| S5 | **Skiffen er stiv som en flåte:** GM 2,1 m og rulleperiode 1,5 s, dypgang 0,19 m mot `draft` 0,6. | En 19 fots aluminiumsbåt med to om bord ruller rundt 2–3 s og vipper når én går til siden. Antatt; ikke målt mot kilde. | `hullOf` (`T` fra `disp` og Cb 0,35) | C |

Ikke målt: trim, rull og slag med last i sjø i 3D (F2 måler bare tom sjark og skiff, `tests/hull3d.py`). OB-fasene som rører en båt, kjører `hull3d` for den med fullt rom.

### 5.1 Trim, slagside og mannskapets vekt (OB15, 09.11.2026, Jonas' økt, grenen `ccr-4660a71b-kidfna`)

S1–S3 er bygd. Lasten har fått plassen sin om bord, lest av modellenes ankre 09.11.2026 (`STAB_AT` i `core/03c-stability.js`, i modellens ramme: luka eller kassene på dørken, garnet, stampene, karene ved bordet, bordet, haleren, roret, plassen ved ripa på håndbåtene, arbeidsdekket for teinene). `stabOf` regner nå slagsiden (lastens moment på tvers over D·GM) og trimmen (likevekten til skrogsnittene med tyngdepunktet der lasten står, `hullRest(H, D, zG)`), og `stabLoad` gir folkene om bord med stasjonene sine (90 kg hver, 0,9 m over dekket de står på) og trekket i haleren (`stabPull`). 3D følger kjernen: skrogsnittene hviler med kjernens trim, og rullen har slagsiden i målet sitt (`view3d/16-motion.js`). Ingenting regnes i 3D alene, så verden er den samme med skjermen av.

Regnet uten 3D, skipperen ved roret i alle kolonnene; trim akter positiv, slagside mot styrbord positiv (bb = mot babord). «Line» og «garn»: trekket fra 80 m med én (line) eller to (garn) ved haleren; «jukse»: én ved ripa og ingen ved roret; «kar»: fisk som venter i karet ved bordet (10 % av rommet, høyst 300 kg).

| Båt | Tom: trim / slagside | Fullt rom: trim / slagside | Line: trekk kg / slagside | Garn: trekk kg / slagside | Jukse: slagside | Kar: kg / slagside | Fribord akter, fullt (m) |
|---|---|---|---|---|---|---|---|
| skiff | 0,2° / 0,0° | −4,9° (nesa) / 0,0° | 35 / 2,1° | 35 / 3,1° | 1,1° | 50 / 1,0° bb | 0,64 |
| trebat | 0,4° / 2,0° bb | −1,6° / 1,5° bb | 67 / 4,7° | 67 / 7,5° | 2,5° | 50 / 0,4° bb | 0,60 |
| snekke | 0,1° / 1,8° | 1,0° / 1,3° | 98 / 7,9° | 105 / 10,6° | 2,3° | 100 / 1,9° | 0,50 |
| plastsjark | 0,1° / 0,7° | −1,4° / 0,4° | 98 / 4,1° | 148 / 6,6° | 1,3° | 300 / 6,0° | 0,57 |
| sjark | −0,1° / 0,3° | 0,6° / 0,1° | 98 / 2,2° | 148 / 3,6° | 0,7° | 300 / 2,9° | 0,45 |
| hurtigsjark | −0,1° / 0,3° | 1,2° / 0,2° | 98 / 2,5° | 148 / 4,2° | 0,9° | 300 / 3,5° | 0,49 |
| sjarkny | −0,1° / 0,3° | 2,0° / 0,2° | 98 / 1,5° | 148 / 2,3° | 0,5° | 300 / 2,1° | 0,42 |
| breisjark | −0,1° / 0,2° | −1,4° / 0,1° | 98 / 1,6° | 148 / 2,6° | 0,5° | 300 / 2,1° | 0,47 |
| kyst15 | 0,0° / 0,1° | 0,0° / 0,0° | 98 / 0,5° | 148 / 0,8° | 0,2° | 300 / 0,7° | 0,43 |
| kyst21 | 0,0° / 0,0° | −2,0° / 0,0° | 98 / 0,2° | 148 / 0,3° | 0,1° | 300 / 0,3° | 0,77 |

Uten noen om bord ligger alle på rett kjøl og uten slagside (enhetstesten). Det som er antatt (C):

- **Rommets tyngdepunkt** er tatt midt mellom luka og midten av båten: luka er bare åpningen, rommet går under dekket mot midtskips, og modellene har ikke rommet (CLAUDE.md, bare utsiden). Med luka selv som tyngdepunkt ville havsjarken trimme 2,5° akter fullastet og den nye hurtigsjarken 5,6°. Én linje i `stabPlaces`.
- **Den tomme båten ligger på rett kjøl**, som før: konstruktøren har lagt motor, tanker og ballast slik. Ekte båter er ofte balansert for halv last i stedet; da ville trimmen fullastet vært omtrent halvparten.
- **Kassene på skiffen og trebåten** står forut der modellene tegner dem (`kit.cargo`), så fullt gir 4,9° og 1,6° på nesa. En fisker ville stuet dem nærmere midten; det hører til OB1 og OB5 å flytte kassene i modellen om Jonas vil det, ikke til fysikken.
- **Trekket i haleren** er anslått, ikke målt: line 50 kg, garn 100, teiner 70 (snøkrabbe 60), 0,6 kg per meter dyp og halve fangsten på stykket som er i skiva, høyst 35 kg per tonn båt (håndbåtene trekker for hånd). På snekka (3 t, GM 0,62) gir det 8–11° under trekket, der det meste er folkene ved haleren om styrbord.
- **Folkene på dekkede båter** står på plassen for stasjonen sin (`c.st`, `S.mySt`), ikke der figuren i 3D går (`deckcrew.js` leses ikke, OB2 eier den): krengningen flytter seg når noen bytter stasjon, og rullen i 3D glir over dit.

Hva tallene gjør med S4 og S5: fullastet trimmer de fleste sjarkene akter, så fribordet akter blir 1–8 cm lavere enn det jevne (sjarkny 0,42 mot 0,50 m); dekkskantvinkelen er fortsatt regnet for det jevne fribordet (S4 står). Skiffen er fortsatt stiv (S5): én om bord tar GM fra 2,09 til 1,94 m og gir 1,1° ved ripa, mot trebåtens 2,5°. Slagsiden legges til vindkrengningen i varslene (`motionAt`), så en båt som ruller nær grensen under trekket, varsles tidligere enn før.

## 6. Fasene

Én båt per økt, eller én operasjon på tvers av båtene der koden er felles. Trebåten først (startbåten, alle spillerne ser den første uka), så det felles arbeidet som ses hver tur, så båtene i stigens rekkefølge. Hver fase:

- tar opp **før** med `tests/ombord.py <båt>` (eller `--ops` for operasjonen) før den endrer noe, og **etter** når den er ferdig, i begge formater, og sender Jonas bildene (ikke videoene) fra begge;
- setter karakteren i grunnlaget etter skalaen i kapittel 2 med begrunnelse per punkt, men **økta som bygger eller reviderer båten setter karakteren selv, som en egen evaluering mot skalaen i kapittel 2 med begrunnelse per punkt (Jonas 10.11.2026; helst gjort av en egen underagent som bare får bildene og skalaen, så karakteren ikke bare gjentar forslaget)**, og båten regnes som ferdig når den er 75 eller mer (75 eller mer, og ingen funn med alvor A igjen);
- kjører testene for filene den rører (`/lever`), og `hull3d` for båten med fullt rom der skroget eller vekta endres;
- følger `/blender` når en modell endres, og regelen om at ingen redskap modelleres inn i båten (Jonas 18.10.2026): det spilleren kjøper, står på ankrene.

| Fase | Hva | Funnene | Filene | Testene |
|---|---|---|---|---|
| **OB1** | **Trebåten til 75:** først Jonas' avgjørelse 09.11.2026 (ingen teiner på trebåten, og skiffen likt, valg 23 A: `rigs`, databladet, `equipFits`/`buyGate`, og teinene og haleren spillere alt har); så skroget og vekta (`disp` etter valg 18), utstyret der fiskeren arbeider: liten haler og juksavinde som modeller (U4), garn trukket for hånd over ripa (valg 21 B), plassene for garn, stamper og last på dørken i stedet for 0,74 m over den, settingen for hånd (F5), fortøyningen ved naustet med skipperen selv (F1 for håndbåtene), og det klippene viser i 4.1 | 4.1, F1, F5, F6, F7 | `core/02-species-gear.js` (`VESSELS.trebat.rigs`, `EQUIP` `fit`), `core/10-gear.js` (`buyGate`), `ui/11-boot.js` (lagringene med teiner på trebåten), `tools/boats/snekke23.py`, `tools/gear/` (haleren), `src/data/*.b64` (trebat), malen, `view3d/12-skiff.js`, `13-instruments.js` (`drawSkiff`), `10-gear.js` (`drawPotsAboard`, `drawPots`), `docs/skipsmodeller/trebat-grunnlag.md` | `ombord.py trebat`, `node tests/unit/run.mjs` (en ny sjekk for regelen), `geartest`, `shoptest`, `itemcardtest`, `vesseltest`, `deckshot` (`KYST_DECK=trebat`), `brotest`, `jigshot`, `animshot`, `hull3d` |
| **OB2** | **Fortøye og kaste loss med folk** (alle båtene med mannskap): fenderne ut før kaia, springen og tauene tatt av én på dekk og én som går i land eller kaster til kaia, inn igjen og kveilet ved kasting; skipperen ved roret til hun ligger (F3); ingen inn døra før tauene er inne (F2); siden mot kaia etter kaia og arbeidet, kranen mot kaia (F22) | F1, F2, F3, F22 | `view3d/15-env-mooring.js`, `deckcrew.js`, `core/13-work.js` (stasjonene `fort`, `ror` i havn), `core/05-vessels.js` (`dock` venter på 3D) | `ombord.py <tre båter> --ops kast,inn`, `docktest`, `berth3d`, `crewwalk`, `crewclip`, `walktest` |
| **OB3** | **Setting og redskapet om bord** (alle): én akter ved stampen eller binga under setting, ankeret og blåsa kastet, de andre ikke i trekkestilling (F4); stampene og garnet i det antallet som er om bord (D3, D4, F8); teinestablene og teina som settes ned på en ledig flate, ikke oppå karene og folkene (F7, `potDeck`); juksaplassene og maskinene der fiskeren står fritt ved ripa, ikke i stolper, tak eller livbøya; `crewclip` utvidet til alle plassene i alle stillingene, sett rød på snekka først (F15); den andre ved bordet og karet på sin egen plass (F19); redskapet ut der dekket er åpent, ikke gjennom huset (F20); juksaplassene fordelt på begge sider (F21); den som haler og den som bløgger blir stående ved haleren også når den står høyt over dekket (F24, grensen på 1,2 m i `deckcrew.js:190`) | F4, F7, F8, F15, F19–F21, F24 | `view3d/10-gear.js` (`drawSetting`, `potDeck`), `09-landing-deck.js` (stampene, garnet), `13-instruments.js` (`jigRail`), `core/13-work.js` (stasjonen `sett`), `deckcrew.js`, `tests/crewclip.py` | `ombord.py <tre båter> --ops sett,jig,maskin,trekk`, `deckshot`, `workshot`, `crewclip`, `jigshot` |
| **OB4** | **Lossing og is:** én i rommet eller ved karene, én ved luka som gir tegn, båtens egen kran der hun har en, med én som kjører den og lasten i kroken; is om bord tatt imot (F10, F11, F23); og siden mot kaia etter kaia og arbeidet, kranen mot kaia (F22, flyttet fra OB2: `berthPose` velger siden, og lossingen og bunkringen i 3D leser den; fortøyningen leser alt `bp.side`) | F10, F11, F22, F23 | `view3d/09-landing-deck.js` (`landScene`, `deckActivity`), `view3d/11-bunker.js`, `deckcrew.js`, `core/07-harbours.js` (stasjonene og `berthPose`) | `ombord.py <tre båter> --ops loss`, `landtest`, `deckshot`, `moortest`, `berth3d`, `/stikkprove` |
| **OB5** | **Skiffen til 75:** vekta (+60 %, `disp` tom båt), 90 hk-motoren (D6), garn trukket for hånd (valg 21 B), det klippene viser i 4.2 | 4.2 | `tools/boats/skiff59.py`, `src/data/*.b64`, `view3d/12-skiff.js` | som OB1 for `skiff` |
| **OB6** | **Snekka til 75** (bygd 09.11.2026: juksaplassene, livbøyene, vannlinja; teinene venter på valg 24) | 4.3 | `tools/boats/snekke26.py`, `src/data/*.b64` | som OB1 for `snekke` |
| **OB7** | **Plastsjarken til 75, ny arbeidsplan** (Jonas, valg 20: «Dette er kanskje den svakeste båten vi har. Du får frie tøyler til å lage en realistisk fiskebåt.» Styrhusets plass og arbeidsdekket etter ekte plastsjarker av typen, med bildene vist Jonas før modellen endres) | 4.4 | `tools/boats/plast31.py` | som OB1 |
| **OB8** | **Havsjarken til 75** | 4.5 | `tools/boats/havsjark35.py` | som OB1 |
| **OB9** | **Hurtigsjarken til 75** | 4.6 | `tools/boats/hurtig11.py` | som OB1 |
| **OB10** | **Den nye hurtigsjarken til 75** | 4.7 | `tools/boats/hs11.py` | som OB1 |
| **OB11** | **Breisjarken til 75** (eksporteres på nytt, pchip; folk ved haleren, F24; teinestabelen ut av rommet under lyet) | 4.8, F24 | `tools/boats/malo36.py` | som OB1 |
| **OB12** | **Kyst15 over 75 igjen** (eksporteres på nytt, pchip; Jonas, valg 19: «Lag en åpning i hekken for setting av garn, liner. Lag også en garn-binge for oppbevaring av garn ombord»; arbeidet under shelterdekket synlig, F18; folk ved haleren, F24; haler nr. 2; halerens fot innenfor skroget) | 4.9, F18, F24 | `tools/boats/kyst15.py`, `deckcrew.js` (`goalOf`), `view3d/09` | som OB1 |
| **OB13** | **Kyst21 revidert** etter pilotens arbeidsmåte (grunnlag og byggefil som de andre; kranen som passer båten og står mot kaia, F22, M16) | 4.10 | `tools/boats/kyst21.py`, ny `docs/skipsmodeller/kyst21-grunnlag.md` | som OB1 |
| **OB14** | **Rydde, spyle, mat og kulde:** spyling som jobb etter trekket på alle (slange på de åpne båtene også), matpakke og kaffe på dekk på de åpne båtene, kulde og vått synlig (F12–F14) | F12, F13, F14 | `core/13-work.js`, `deckcrew.js`, `view3d/09` (`DKWATER`) | `ombord.py <tre båter> --ops rydd,hvile`, `crewclip`, `worktest` |
| **OB15** | **Båten i sjøen med last:** trim etter hvor lasten står, slagside fra haleren og karene, mannskapets vekt (S1–S3) | S1–S3 | `core/03c-stability.js`, `view3d/16-motion.js` | `node tests/unit/run.mjs`, `hull3d`, `dyntest` |

Rekkefølgen etter OB1 kan byttes; OB2–OB4 gir mest for alle båtene samtidig. OB5–OB13 kan ikke gå samtidig med hverandre når de rører `src/data/*.b64` og malen. OPP5 (steg 57: kniv, høtt, linesetter og garnrenne som modeller) hører sammen med OB3 og bør tas rett før eller sammen med den.

## 7. Valgene

Jonas svarte på alle 09.11.2026 (også under «Valg som venter på Jonas» i `docs/planer/koen.md`, valg 17–23):

- **17. Skalaen:** Jonas' egen, skrogutforming 20, detaljer 20, lanterner 5, styrhus 10, arbeidsflyt 25, utforming av dekk 20 (kapittel 2).
- **18. `disp`:** A, den tomme båten for alle; formen rettes der modellen gir over 10 % mer.
- **19. Kyst15:** «Lag en åpning i hekken for setting av garn, liner. Lag også en garn-binge for oppbevaring av garn ombord» (OB12).
- **20. Plastsjarken:** «Dette er kanskje den svakeste båten vi har. Du får frie tøyler til å lage en realistisk fiskebåt.» (OB7).
- **21. Garn på skiffen og trebåten:** B, garn trukket for hånd (OB1 og OB5).
- **22. Bildene:** B, «Fasene bruker offentlige bilder av samme type som de finner selv, og sier hvilke slik at jonas har kontroll under prosessen.» Hver fase oppgir bildene med lenke og hva de viser, i grunnlaget og i meldingen til Jonas, før modellen endres.
- **23. Teiner på skiffen:** A, ut som på trebåten (OB1).
- **26. Taket og spygattene på alle båtene** (spurt i OB7 etter plastsjarken): **Ja.** Jonas 09.11.2026, om plastsjarken først: «Gjør styrhustak mer realistisk som dette, med en slags brem på kanten av taket som skrår» (med et bilde av et fiskefartøy; underkanten står ut fra veggene og flaten skrår innover opp til taket, ikke omvendt: «Bremen på styrhuset skrår feil vei»), «Fargen kan du bestemme selv så lenge den harmonerer med resten av designet», og «Fjern gummiklaffer på spygatt»; så, spurt om det skal gjelde de andre båtene: «Ja». Hver båtfase (OB8–OB13) gjør det når modellen likevel eksporteres på nytt (malen er `plast31.py`: `BRIM_O`, `BRIM_H`, underslaget og takkanten; spygattene som åpne hull med foring). Klaffene står i dag i `havsjark35.py`, `hurtig11.py`, `hs11.py`, `malo36.py` og `snekke26.py`; snekka er ferdig fra OB6 og har ikke styrhustak, så der tas bare klaffene, i neste runde på den. Havflåten (`al45`, `krabbe50`, `not75`, `ringnot38`, `tral60`) tas når de revideres.
- **32. Breisjarken, juksa og akterskansen (OB11, 10.11.2026):** «den burde ha 2 maskiner». Ripa om styrbord er lav en meter lenger akter, to juksaplasser, `jukseMax` 2 (`breisjark-grunnlag.md` 10.8).

## 8. Det usikre

- **Klippene er tatt under SwiftShader** med 3–5 bilder i sekundet i spilltid. Det som går fort (en hånd, en fisk som flyr), kan falle mellom bildene. En bevegelse som mangler i klippet, er sjekket mot koden før den står som et funn.
- **Karakterene for trebåten, skiffen og snekka er forslag.** Vektene i skalaen er rekonstruert av denne revisjonen, ikke Jonas' egne. Ingen av de tre er sett i Blender i denne økta, bare i spillet.
- **Hva en fisker gjør:** beskrevet etter planlisten, referansebåtene og det som er alminnelig kjent om kystfisket, ikke etter et filmet arbeidsdøgn om bord. Der spillet og ekte båter kan gjøre det forskjellig (for eksempel om fisken sløyes om bord eller leveres rund på en dagsbåt), er spillets valg tatt som gitt.
- **Teina på skiffen ser større ut enn båten** i klippet. Målene skal være rettet (D1 i kartleggingen); det kan være perspektivet nær kameraet. OB1 og OB5 måler den.
- **Fysikken med last** er regnet, ikke sett i sjø (kapittel 5).
- **Trebåten er endret etter opptakene:** 6560a62 på arbeidsgrenen (09.11.2026) tok bort badestigen, livbøya og fiskelanternene på trebåten og vimplene på båtene. Bildene her er av bygget fra før (211fb53). Funnene i arbeidet står; OB1 tar før-bildene på nytt.
- **Kyst21 er ikke revidert,** og anslaget for karakteren er grovt.
- **Opptakene har høyst tre i mannskapet pluss skipperen** (`BASE` i `tests/ombord.py`), også på breisjarken (`crewMax` 4), kyst15 (5) og kyst21 (6). Med fullt mannskap kan det bli trangere enn klippene viser; OB-fasene for de store båtene tar opp med fullt mannskap.
- **Innseilingen og lossingen** ble tatt opp på nytt med kameraet høyere og innseilingen fra leia; for kyst15, breisjarken og kyst21 er de fra første runde der kameraet sto i bygningene.

## 9. Status

- 09.11.2026: **OB0 ferdig** (Jonas' økt, gren `ccr-59f8e7e6-m00yni`). Alle ti båtene tatt opp liggende med alle operasjonene, stående med juksa og linetrekket (trebåten med alle), innseilingen og lossingen tatt på nytt. Ingenting i `src/` er endret. Neste: OB1 (trebåten), som venter på valg 17, 18, 21, 22 og 23, (H3d2 og Ø8b S2 ble rullet ut samme natt); OB2 og OB15 er klare.
- 09.11.2026: **OB2 rullet ut** (Jonas' økt, gren `ccr-a9ccd5ec-it307t`, 7d2404bd, versjon e5e171f41fc3): F1, F2 og F3 rettet for alle båtene med mannskap; F22 flyttet til OB4. Forslagene til K6 i 4.11.
- 09.11.2026: **OB15 ferdig** (Jonas' økt, gren `ccr-4660a71b-kidfna`, PR #52, rullet ut i ec54eb3, versjon 5b8c411a4cd9): trim etter hvor lasten står, slagside fra haleren, karene og folkene, mannskapets vekt (S1–S3). Tabellen og det antatte i 5.1; S4 og S5 står (C). Skjermbildene i `docs/okter/2026-11-09-ob15/`.
- 11.11.2026: **OB3 rullet ut til testutgaven** (Jonas' økt, gren `ccr-13ec41bb-wikvwe`, d9f148f, versjon fc8e85de4868): F4, F8, F15, F19, F21 og F24 rettet for båtene med mannskap, F7 og F20 delvis; tabellen i 4.13. Neste: OB4 (steg 82, startmeldingen i `docs/planer/start/82.md`).
- 11.11.2026: **OB4 rullet ut til testutgaven** (Jonas' økt, gren `ccr-309f2cf5-w71mxh`, versjon 756582fc0efa): F10, F11, F22 og F23 rettet for båtene med mannskap på dekk; tabellen i 4.14. Neste på sporet: OB14 (steg 92, `docs/planer/start/92.md`) og OB12 (steg 90).
- 09.11.2026: **OB1 bygd** (Jonas' økt, gren `ccr-e474ac41-zlir5x`): 4.1 over. `tests/ombord.py --bilder` tar bare bildene (Jonas: «Du trenger ikke å ta videoklipp av båten, det holder med bilder»). Neste på sporet: OB5 (skiffen, `docs/planer/start/83.md`).
- 09.11.2026: **OB5 bygd** (Jonas' økt, gren `ccr-b0ab5771-n45cmj`): 4.2 over, forslag 75 etter Jonas' skala. Neste på sporet: OB6 (snekka, `docs/planer/start/84.md`).
- 10.11.2026: **OB8 bygd** (Jonas' økt, gren `ccr-869710d8-bo5iwu`): havsjarken med setteport i hekken (Jonas: «A Åpning i hekken»; F20), de to ved bordet side om side (F19), juksa fordelt (F21), pakkerens plass og iskassa, bremmen (valg 26), styrhusveggene uten striper, livbøya under vinduet, pyntefenderne ut og fenderen som felles modell; forslag 76 i `havsjark-grunnlag.md` 9.5. Funnene i 4.5 med alvor A er rettet, utenom F4 (OB3). Neste på sporet: OB9 (hurtigsjarken, `docs/planer/start/87.md`).
- 09.11.2026: **OB16 rullet ut** (Jonas' økt, gren `ccr-f04f4a09-btm7go`, 2e0517c, versjon 6ee9a3374f6e): koniske kongekrabbeteiner i stabler, den firkantede er ute (4.12). Valg 25 (plassen på havsjarken, kyst15, hurtigsjarken og breisjarken) venter på Jonas. Bildene i `docs/okter/2026-11-09-ob16/`.
- 09.11.2026: **Valg 25 A bygd** (samme økt): `gearMax.teine` etter stablene, havsjarken og kyst15 uten teiner, `potsOver`.
- 09.11.2026: **OB7 bygd** (Jonas' økt, gren `ccr-61bc7d42-bfsaz0`): 4.4 over. Styrhuset forut etter bildene av typen (valg 22 B, Jonas: «Forut»), arbeidsdekket akter; F20 og F21 rettet for plastsjarken; ingen teiner (Jonas: «Ingen teiner», stabelen og tømmeplassen får ikke begge plass). Forslag 78 i `plastsjark-grunnlag.md` 10.5. Neste på sporet: OB8 (havsjarken, `docs/planer/start/86.md`).
- 10.11.2026: **OB9 bygd** (Jonas' økt, gren `claude/ob9-hurtigsjarken-75-jtun77`): den brukte hurtigsjarken med benken tvers av luka og stampene fri av den (F19), juksa fordelt på begge sider fritt for haleporten, døra og kranen (F21), bremmen (valg 26), styrhusveggene uten striper, den tomme båtens vannlinje (valg 18 A, `WLE`), `STAB_AT` sjekket mot modellens ankre. Settingen går fritt over hekken (ingen setteport). Teinestabelen fra OB16 står fri av blødekaret, stagene og kranen. Forslag 75 etter Jonas' skala (`hurtigsjark-grunnlag.md` 9.5); valg 31 (juksamaskinene) venter på Jonas. Bildene av typen kunne ikke hentes (Wikimedia sperret bildefilene for skyøkta); de er valgt etter beskrivelsen. Neste på sporet: OB10 (den nye hurtigsjarken, `docs/planer/start/88.md`).
- 10.11.2026: **OB11 bygd** (Jonas' økt, gren `ccr-7c6616f1-m5zscg`): breisjarken, se avsnittet sist i 4.8 og `breisjark-grunnlag.md` kap. 10. Egen evaluering 68 etter Jonas' skala; ikke ferdig etter grensen på 75, rullet ut til testadressen 10.11.2026 (85a1396); Jonas' svar om juksa og akterskansen venter (valg 32, `jukseMax` 6 → 1). Startmeldingen for OB12 i `docs/planer/start/90.md`.
- 10.11.2026: **OB10 bygd** (Jonas' økt, gren `ccr-e7277295-e9i00p`): den nye hurtigsjarken, se avsnittet sist i 4.7 og `sjarkny-grunnlag.md` kap. 10. Egen evaluering 71 etter Jonas' skala (69 etter første runde); ikke ferdig etter grensen på 75. Startmeldingen for OB11 i `docs/planer/start/89.md`.
