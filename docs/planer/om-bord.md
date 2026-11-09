# Om bord: revisjonen av kystflåten (OB0, 09.11.2026)

Steg 69 i `docs/planer/koen.md`, Jonas' økt på grenen `ccr-59f8e7e6-m00yni`. Bare måling og plan: ingenting i `src/`, `tools/boats/` eller modellene er endret. Det som er laget, er opptaksverktøyet `tests/ombord.py` og denne fila.

Jonas 09.11.2026: «Grafikken er svært viktig i mine øyne. Jeg ønsker jo at båten skal fungere så ekte som mulig, at arbeidet ombord utføres på en så ekte måte som mulig, at mannskapet oppfører seg som ekte mennesker, at utstyr står plassert på rasjonelle og logiske plasser, at utstyr opereres på en realistisk måte, at ingenting clipper inn i andre ting, rett og slett at vi på en så realistisk måte som mulig klarer å simulere hverdagen til en fisker ombord i båten. Det er det som er viktigst for meg.» Og: «kystflåten er MVPen.»

Kapitlene: 1 hvordan det er målt, 2 skalaen og karakterene, 3 funnene som gjelder alle båtene (koden er felles), 4 båt for båt, 5 båten i sjøen, 6 fasene, 7 valgene, 8 det usikre.

## 1. Slik er det målt

- **Opptakene** (`tests/ombord.py`, ikke i `run.py`): spillet settes i hver operasjon med spillets egne funksjoner (`depart`, `startSet`, `startHaul`, `addCatch`, `dock`, `startLanding`, `restStart`; oppskriftene står i fila), og hver operasjon tas opp for seg, 9–16 sekunder spilltid, liggende 640×360 og stående 360×640, med tre skjermbilder (tidlig, midt i og sent i operasjonen) der kartet, statusboksen og kompasset er tatt bort (`S.settings.hudOff`, som «Vis HUD» av i innstillingene) så de ikke dekker båten. Verktøyet skriver ut hva hvert klipp viste: hendelsene på dekk (`G3._debug.dk.n`: hugget, plukket, jukset opp, bløgget), stasjonene til hver i mannskapet (`CREW3D.agents()`), skaden på skroget, og klippesjekken fra `crewclip` (`clipNow`: armer og bein i stillingen mot modellen, `bodyHits`: kroppen på veien, og om noen står utenfor dekket).
- **SwiftShader tegner under ett bilde i sekundet.** Siden går derfor på en sakte klokke (alle klokkene i siden, `performance.now`, `Date`, tidtakerne og `requestAnimationFrame`, går på 0,12–0,15 av ekte tid), og videoen spilles fort fram igjen. Klippene har spillets eget tempo, men bare 3–5 bilder i sekundet. Bevegelsene og plassene kan vurderes, ikke bildetakten.
- **Bildene, ikke videoene, går til Jonas.** Jonas 09.11.2026: «Du trenger ikke sende de videoene. De er alt for hakkete uansett. Men send meg gjerne bilder, men sørg for å minimere kartet og statusboksen så de ikke dekker over båten i bildet.» Videoene brukes bare i revisjonen (sammendragsark med seks bilder per klipp) og ligger ikke i git; skjermbildene ligger som jpeg i `docs/okter/2026-11-09-ob0/`.
- **Lesingen:** grunnlagene og byggefilene for hver båt i `docs/skipsmodeller/`, kartleggingen, planlisten, `batplan.md` kap. 8 og 10, `grafikk-batmodeller.md`, systemdokumentene og koden for operasjonene (`core/10-gear.js`, `core/13-work.js`, `deckcrew.js`, `view3d/09`, `10`, `12`, `13`, `15`, `20`). Fil og linje står ved funnene.
- **Hva en fisker gjør:** kildene er grunnlagene og planlisten i `docs/skipsmodeller/` (referansebåtene i `referanseanalyse-runde-2.md`, planlistens SJK-, LIN-, GRN- og TEI-punkter), Mattilsynets side om bløgging og sløying (bløgging straks, sløying snarest mulig etter utblødingen, fisk som skal bløgges skal også sløyes, med unntak; https://www.mattilsynet.no/mat-og-drikke/matproduksjon/fisk-og-sjomat/regler-ved-fiske-landing-og-omsetning-av-fisk/blogging-og-sloying) og det som er alminnelig kjent om kystfisket. Der en kilde mangler, står det.

## 2. Skalaen og karakterene

Godkjenningsgrensen er Jonas' (01.11.2026): ingenting under 75/100. Grunnlagene setter karakteren i fritekst («holder» og «trekk»), og ingen vekter er skrevet ned. Planlistens benchmark (kap. 30 i `planliste-fiskefartoy.md`) er aldri regnet ut, og den kan ikke gi 75 før materialene (F2 i `grafikk-batmodeller.md`) er bygd: 3 poeng krever ferdige PBR-materialer, så en modell der alt er riktig, får 66,7 %.

For å sette trebåten, skiffen og snekka på samme skala som de andre er punktene satt sammen til åtte, med vekter som gir de seks karakterene som er satt, igjen (valg 16):

| Punkt | Vekt | Hva |
|---|---|---|
| K1 Kilder og overlegg | 15 | Mål fra tegning eller foto i kjent skala, lagt over hver runde |
| K2 Skroget og vekta | 20 | Én flate, jevne linjer, kjøl og undervann, volumet mot `disp` |
| K3 Detalj og utseende | 15 | Hull, beslag, slitasje |
| K4 Lanternene | 5 | Etter loven, sett i spillet om natta |
| K5 Broa | 10 | Fra skipperens øye |
| K6 Arbeidsflyten og plassene | 15 | Haler, juksa, kar, bord, dekkskartet; utstyret der fiskeren arbeider |
| K7 Kontroller og tester | 10 | `check()`, klasjsjekk, testene, bilder i begge formater |
| K8 Prosessen | 10 | Fant Jonas noe selv? Regler brutt? |

**Nytt fra denne revisjonen:** K6 måler i dag bare plassene i modellen. Jonas' ønske gjelder arbeidet, så forslaget er at K6 også tar med operasjonene i kapittel 4 (rekkefølgen, grepene, mannskapet), og at en båt ikke kan få mer enn 9 av 15 på K6 så lenge et funn med alvor A står åpent for henne.

**Karakterene** (satt i grunnlagene; trebåten, skiffen og snekka er forslag fra denne revisjonen, med punktene i kapittel 4). Jonas setter karakteren før en båt regnes som ferdig.

| Båt | Karakter | Kilde |
|---|---|---|
| `kyst15` | 76 (godkjent) | `kyst15-grunnlag.md` 121–141; må eksporteres på nytt (pchip-feilen, 10,6 cm mellom sidene ved stevnen, `BACKLOG.md`), og kan falle |
| `breisjark` | 72 | `breisjark-grunnlag.md` 127–154 |
| `sjarkny` | 70, **66 etter klippene** | `sjarkny-grunnlag.md` 109–120; kapittel 4.7 |
| `snekke` | **67 (forslag)** | kapittel 4.3 |
| `plastsjark` | 66, **63 etter klippene** | `plastsjark-grunnlag.md` 192–214; kapittel 4.4 |
| `sjark` | 64, **61 etter klippene** | `havsjark-grunnlag.md` 115–123; kapittel 4.5 |
| `trebat` | **63 (forslag)** | kapittel 4.1 |
| `hurtigsjark` | 62, **59 etter klippene** | `hurtigsjark-grunnlag.md` 123–132; kapittel 4.6 |
| `skiff` | **57 (forslag)** | kapittel 4.2 |
| `kyst21` | ingen (ikke revidert, anslag rundt 50) | kapittel 4.10 |

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
| F16 | Garn på skiffen og trebåten | `VESSELS` sier at begge kan rigges for garn, men garnhaleren krever 7,5 m, så det går ikke i spillet. | Små båter setter og trekker garn for hånd eller med en liten haler. | `core/02-species-gear.js:111–121, 255` | C (valg 20) |
| F17 | Roing | Ingen årer og ingen roing finnes; trebåten og skiffen går for motor. | Riktig for båtene slik de er; nevnt fordi det ble spurt etter. | søkt i `src/js` | – |
| F18 | Sløying og ising på kyst15 | Sløyebordet står under shelterdekket, og `goalOf` sender den som sløyer og den som iser inn under dekket der kameraet ikke ser dem. Breisjarkens ly sjekkes i klippene. | Riktig plassert (arbeidet skjer under ly), men spilleren ser ikke arbeidet. | `deckcrew.js:187–190` | B |

## 4. Båt for båt

Klippene heter `<fiske>_<operasjon>_<format>.mp4` (operasjonene: `kast` ved kai og kaste loss, `ut` til feltet, `jig` juksa for hånd, `maskin` juksamaskinene, `sloy` fullt kar, bløgge, sløye og ise, `sett`, `trekk`, `rydd`, `inn` inn og fortøye, `loss` losse, `kran` båtens kran, `hvile` mat og hvile).

Felles for alle klippene: **store hvite flekker rundt båten** i mange klipp, ved ripa når fisken kommer opp og i ro. Det er sprutpartiklene: plasket fra fisken og ankeret (`ancSplash`, `view3d/21-rescue-anchor.js:82`) og sjørokken (`driftSpray`) deler bufferen `SD`, som tegnes som punkter med størrelse 90 (`drawPts(n, gl.POINTS, VP, col, 90, true)`, `view3d/24-cinema.js:497`). Nær kameraet blir hvert punkt en stor ugjennomsiktig flekk. Ikke avgjort om det ser likt ut på nettbrettet (SwiftShader kan tegne punktene annerledes); Jonas sjekker det. F3b (steg 67) eier `24-cinema.js` og endrer sjørokken nå, og OPP5 (steg 57) skal lage plasket som modell. **Alvor B** til det er sett på nettbrettet.

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

**Jonas 09.11.2026, etter bildene av teinene:** «Jeg tror ikke den trebåten skal kunne holde på med krabbeteiner. Det har den åpenbart ikke plass til. Det må i så fall oppdateres i databladet til båten og gjøres slik at spillere ikke kan kjøpe det til den båten heller.» Det betyr: `teiner` ut av `VESSELS.trebat.rigs` (databladet og båtbladet på verftet sier det), og teinehaleren, krabbekaret, teinene og agnet for teiner kan ikke kjøpes til trebåten (regelen i `equipFits` og `buyGate`, så både kjøpet og knappene følger, etter CLAUDE.md «Én logikk i alle kjøpssystemer»). En spiller som alt har teinehaler eller teiner på trebåten, mister ikke pengene: teinene blir liggende på lageret i naustet til en båt de passer på (eller selges tilbake), og haleren går av ved neste verftsbesøk med prisen tilbake som ved innbytte. Bygges først i OB1. Skiffen har samme problem (valg 22).

Karakteren (forslag, skalaen i kap. 2): K1 3, K2 15, K3 13, K4 4, K5 8, K6 6 (teinene gjennom skroget, de to inni hverandre ved karet, settingen uten folk), K7 8, K8 6 = **63**. Det som løfter mest: bilder med kjent lengde (K1), teinene og haleren der fiskeren arbeider (K6), og Jonas' gjennomgang uten nye funn (K8).

### 4.2 Skiffen (`skiff`, `skiff59.py`): forslag 57/100

Data: 5,9 m, 1,0 t, én og deg, aluminium, 60 hk påhengs, ett kar på dørken, eget sløyebord over babord ripe ved konsollen (`work.own`), rigges i spillet for juksa, line og teiner (garn går ikke, F16). Håndbåt som trebåten: ingen agenter; `drawSkiff` tegner faste figurer (`view3d/13-instruments.js:199`), så json-en har ingen stasjoner, ingen hendelser og ingen klippesjekk for skiffen (`before`/`after` tomme, `clipcheck` null). Alt under er sett i bildene, ikke målt.

Opptakene: kjøringen 03:42–04:06 UTC, liggende, 2,3–3,1 bilder i sekundet. Garn og rydding ble hoppet over (`SKIP`: garnhaleren passer ikke; ingen agenter), kranen likeså (ingen kran).

| Operasjonen | Hva som er galt | Hvorfor det ikke er ekte | Kilde | Alvor |
|---|---|---|---|---|
| Fullt kar, sløying | **Den som sløyer, står utenfor båten**, på utsiden av babord ripe over sjøen, og sløyer inn over bordet mot fiskeren, som står på innsiden. Flaggstanga står foran ham, ikke gjennom ham (retter 4.2 slik den sto). Samme stilling henger igjen i første bilde av linesettingen. | Sløyebordet henger over ripa så avfallet går i sjøen; den som sløyer, står på dørken innenfor og ser utover. | Arbeideren fra `drawDeck` på håndbåtene (`view3d/09-landing-deck.js:792–796`) mot `work.own` (`skiff59.py:765–817`); sett i `juksa_sloy_liggende_2.jpg`, `_3.jpg`, `line_sett_liggende_1.jpg` | **A** |
| Teiner, trekk | **Kongekrabbeteina er like bred som båten.** Den kommer inn over konsollen og fiskeren, løftes og settes akter, der den står gjennom mannskapet som sitter, påhengsmotoren, flaggstanga og styrbord ripe. Krabben ligger i teina. | En teine løftes inn over ripa og settes på dørken eller et teinebord; den får plass, eller båten passer ikke for den teina. | `view3d/10-gear.js:357–400` (`drawPots`, `X.pot.half` 0,7 m, `potDeck`); sett i `teiner_trekk_liggende_1.jpg`–`_3.jpg` | **A** |
| Teiner, sett | Teinene tegnes (retter 4.2, som sa at ingen teiner synes): to teiner i stabel står halvt utenfor styrbord side, gjennom ripa, livbøya, konsollen og skipperen. Stabelen står der fortsatt i første bilde av neste klipp (`line_trekk_liggende_1.jpg`), etter at teinene skulle vært satt. Ingen går med teina til ripa; skipperen står ved haleren. | Som 4.1: teinene står stablet og surret på dørken og går ut én og én med tauet imellom. | `10-gear.js:326` og `:357–400`; sett i `teiner_sett_liggende_2.jpg`, `_3.jpg` | **A** |
| Teinene på skiffen (valg 22) | Ser like galt ut som på trebåten, eller verre: teina er omtrent så bred som skiffen (2,45 m) og har ingen plass mellom konsollen og motoren. | Jonas' avgjørelse for trebåten (09.11.2026) passer like godt her. Anbefaling: valg 22 A. | Sett i alle tre teinebildene | **A** |
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

**Til Jonas:** På skiffen står den som sløyer, ute i lufta på utsiden av ripa, og krabbeteina er like bred som båten; teinene bør ut av skiffen som av trebåten (valg 22 A).

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

## 6. Fasene

Én båt per økt, eller én operasjon på tvers av båtene der koden er felles. Trebåten først (startbåten, alle spillerne ser den første uka), så det felles arbeidet som ses hver tur, så båtene i stigens rekkefølge. Hver fase:

- tar opp **før** med `tests/ombord.py <båt>` (eller `--ops` for operasjonen) før den endrer noe, og **etter** når den er ferdig, i begge formater, og sender begge til Jonas;
- setter karakteren i grunnlaget etter skalaen i kapittel 2 med begrunnelse per punkt, men **Jonas setter karakteren** før båten regnes som ferdig (75 eller mer, og ingen funn med alvor A igjen);
- kjører testene for filene den rører (`/lever`), og `hull3d` for båten med fullt rom der skroget eller vekta endres;
- følger `/blender` når en modell endres, og regelen om at ingen redskap modelleres inn i båten (Jonas 18.10.2026): det spilleren kjøper, står på ankrene.

| Fase | Hva | Funnene | Filene | Testene |
|---|---|---|---|---|
| **OB1** | **Trebåten til 75:** først Jonas' avgjørelse 09.11.2026 (ingen teiner på trebåten: `rigs`, databladet, `equipFits`/`buyGate`, og teinene og haleren spillere alt har); så skroget og vekta (`disp` etter valg 17), utstyret der fiskeren arbeider: liten haler og juksavinde som modeller (U4), teinene om bord (F7), plassene for garn, stamper og last på dørken i stedet for 0,74 m over den, settingen for hånd (F5), krabben fra teinene sortert levende i kar (F6), fortøyningen ved naustet med skipperen selv (F1 for håndbåtene), og det klippene viser i 4.1 | 4.1, F1, F5, F6, F7 | `core/02-species-gear.js` (`VESSELS.trebat.rigs`, `EQUIP` `fit`), `core/10-gear.js` (`buyGate`), `ui/11-boot.js` (lagringene med teiner på trebåten), `tools/boats/snekke23.py`, `tools/gear/` (haleren), `src/data/*.b64` (trebat), malen, `view3d/12-skiff.js`, `13-instruments.js` (`drawSkiff`), `10-gear.js` (`drawPotsAboard`, `drawPots`), `docs/skipsmodeller/trebat-grunnlag.md` | `ombord.py trebat`, `node tests/unit/run.mjs` (en ny sjekk for regelen), `geartest`, `shoptest`, `itemcardtest`, `vesseltest`, `deckshot` (`KYST_DECK=trebat`), `brotest`, `jigshot`, `animshot`, `hull3d` |
| **OB2** | **Fortøye og kaste loss med folk** (alle båtene med mannskap): fenderne ut før kaia, springen og tauene tatt av én på dekk og én som går i land eller kaster til kaia, inn igjen og kveilet ved kasting; skipperen ved roret til hun ligger (F3); ingen inn døra før tauene er inne (F2); siden mot kaia etter kaia og arbeidet, kranen mot kaia (F22) | F1, F2, F3, F22 | `view3d/15-env-mooring.js`, `deckcrew.js`, `core/13-work.js` (stasjonene `fort`, `ror` i havn), `core/05-vessels.js` (`dock` venter på 3D) | `ombord.py <tre båter> --ops kast,inn`, `docktest`, `berth3d`, `crewwalk`, `crewclip`, `walktest` |
| **OB3** | **Setting og redskapet om bord** (alle): én akter ved stampen eller binga under setting, ankeret og blåsa kastet, de andre ikke i trekkestilling (F4); stampene og garnet i det antallet som er om bord (D3, D4, F8); teinestablene og teina som settes ned på en ledig flate, ikke oppå karene og folkene (F7, `potDeck`); juksaplassene og maskinene der fiskeren står fritt ved ripa, ikke i stolper, tak eller livbøya; `crewclip` utvidet til alle plassene i alle stillingene, sett rød på snekka først (F15); den andre ved bordet og karet på sin egen plass (F19); redskapet ut der dekket er åpent, ikke gjennom huset (F20); juksaplassene fordelt på begge sider (F21) | F4, F7, F8, F15, F19–F21 | `view3d/10-gear.js` (`drawSetting`, `potDeck`), `09-landing-deck.js` (stampene, garnet), `13-instruments.js` (`jigRail`), `core/13-work.js` (stasjonen `sett`), `deckcrew.js`, `tests/crewclip.py` | `ombord.py <tre båter> --ops sett,jig,maskin,trekk`, `deckshot`, `workshot`, `crewclip`, `jigshot` |
| **OB4** | **Lossing og is:** én i rommet eller ved karene, én ved luka som gir tegn, båtens egen kran der hun har en, med én som kjører den og lasten i kroken; is om bord tatt imot (F10, F11, F23) | F10, F11, F23 | `view3d/09-landing-deck.js` (`landScene`, `deckActivity`), `deckcrew.js`, `core/07-harbours.js` (bare stasjonene) | `ombord.py <tre båter> --ops loss`, `landtest`, `deckshot` |
| **OB5** | **Skiffen til 75:** vekta (+60 %), 90 hk-motoren (D6), det klippene viser i 4.2 | 4.2 | `tools/boats/skiff59.py`, `src/data/*.b64`, `view3d/12-skiff.js` | som OB1 for `skiff` |
| **OB6** | **Snekka til 75** | 4.3 | `tools/boats/snekke26.py`, `src/data/*.b64` | som OB1 for `snekke` |
| **OB7** | **Plastsjarken til 75** (styrhuset etter valg 19) | 4.4 | `tools/boats/plast31.py` | som OB1 |
| **OB8** | **Havsjarken til 75** | 4.5 | `tools/boats/havsjark35.py` | som OB1 |
| **OB9** | **Hurtigsjarken til 75** | 4.6 | `tools/boats/hurtig11.py` | som OB1 |
| **OB10** | **Den nye hurtigsjarken til 75** | 4.7 | `tools/boats/hs11.py` | som OB1 |
| **OB11** | **Breisjarken til 75** (eksporteres på nytt, pchip) | 4.8 | `tools/boats/malo36.py` | som OB1 |
| **OB12** | **Kyst15 over 75 igjen** (eksporteres på nytt, pchip; garnet og stampene ned til halestasjonen etter valg 18; arbeidet under shelterdekket synlig, F18; haler nr. 2) | 4.9, F18 | `tools/boats/kyst15.py`, `deckcrew.js` (`goalOf`), `view3d/09` | som OB1 |
| **OB13** | **Kyst21 revidert** etter pilotens arbeidsmåte (grunnlag og byggefil som de andre) | 4.10 | `tools/boats/kyst21.py`, ny `docs/skipsmodeller/kyst21-grunnlag.md` | som OB1 |
| **OB14** | **Rydde, spyle, mat og kulde:** spyling som jobb etter trekket på alle (slange på de åpne båtene også), matpakke og kaffe på dekk på de åpne båtene, kulde og vått synlig (F12–F14) | F12, F13, F14 | `core/13-work.js`, `deckcrew.js`, `view3d/09` (`DKWATER`) | `ombord.py <tre båter> --ops rydd,hvile`, `crewclip`, `worktest` |
| **OB15** | **Båten i sjøen med last:** trim etter hvor lasten står, slagside fra haleren og karene, mannskapets vekt (S1–S3) | S1–S3 | `core/03c-stability.js`, `view3d/16-motion.js` | `node tests/unit/run.mjs`, `hull3d`, `dyntest` |

Rekkefølgen etter OB1 kan byttes; OB2–OB4 gir mest for alle båtene samtidig. OB5–OB13 kan ikke gå samtidig med hverandre når de rører `src/data/*.b64` og malen. OPP5 (steg 57: kniv, høtt, linesetter og garnrenne som modeller) hører sammen med OB3 og bør tas rett før eller sammen med den.

## 7. Valgene

Står også under «Valg som venter på Jonas» i `docs/planer/koen.md` (valg 16–22).

- **16. Skalaen for karakteren.** A (anbefalt): de åtte punktene i kapittel 2 med vektene der, for alle ti, og «Jonas finner ingenting nytt i bildene og klippene» som krav for 75, slik tre grunnlag alt skriver; K6 tar med arbeidet om bord (høyst 9 av 15 med et funn med alvor A åpent). B: planlistens benchmark (kap. 30), men da kan ingen båt nå 75 før materialene (F2) er bygd. C: fritekst som før.
- **17. `disp`: tom eller lastet båt?** Avgjort bare for kyst15 (75 t er den tomme båten). Modellenes volum ved vannlinja mot `disp`: skiff +60 %, kyst21 +31 % (grovt), snekke +19 %, hurtigsjark +14 %, trebåt og plastsjark +11 %, breisjark +9,5 %, sjarkny +7 %, havsjark −6 %. A (anbefalt): `disp` er den tomme båten for alle, som kyst15; modellens vannlinje er den tomme, og formen rettes der den gir mer enn 10 %. B: `disp` er lastet båt, og modellene beholder vannlinja de har. C: la det stå.
- **18. Kyst15: garnet, stampene og lasten står på shelterdekket**, mens redskapet hales inn i halestasjonen under det. A (anbefalt): flytt garnet og stampene ned til halestasjonen ved haleren, og la lasten (frakten) stå på shelterdekket der kranen når den. B: la alt stå.
- **19. Plastsjarkens styrhus:** akter (som nå) eller midtskips (som annonseutdragene for forbildet tyder på: «glass skyvedør ut til bakdekk», «stort lasterom akter»). A (anbefalt): vent på et bilde fra Jonas før OB7. B: akter. C: midtskips.
- **20. Garn på skiffen og trebåten:** `VESSELS` sier at begge kan rigges for garn, men garnhaleren krever 7,5 m. A (anbefalt): ta `garn` ut av rigglista for de to før lansering, så spillet ikke lover noe det ikke gjør, og legg trekking for hånd eller en liten haler til etter lansering. B: bygg trekking for hånd i OB1 og OB5. C: la det stå.
- **21. Bilder til grunnlagene:** alle ni grunnlagene ber om bilder rett fra siden med kjent lengde, akterfra og ovenfra, og breisjarken, kyst15 og havsjarken om tegningene som ble vist én gang og ikke ligger i repoet. Uten dem kan K1 ikke komme over 6 av 15. A (anbefalt): Jonas legger de bildene han har, i `docs/skipsmodeller/bilder/<båt>/` (eller sender dem i økta), og fasen for båten venter på dem der de finnes. B: fasene bruker offentlige bilder av samme type de finner selv, og sier hvilke. C: ingen bilder; K1 står.

- **22. Teiner på skiffen:** skiffen (5,9 m) har det samme problemet som trebåten: kongekrabbeteina er større enn båten. Jonas avgjorde 09.11.2026 at trebåten ikke skal kunne holde på med krabbeteiner. A (anbefalt): det samme for skiffen (`teiner` ut av rigglista, ikke kjøpbart), i OB1 sammen med trebåten. B: skiffen beholder teinene, og OB5 gir henne en mindre teine (taskekrabbe og hummer) som får plass. C: la stå til OB5.

## 8. Det usikre

- **Klippene er tatt under SwiftShader** med 3–5 bilder i sekundet i spilltid. Det som går fort (en hånd, en fisk som flyr), kan falle mellom bildene. En bevegelse som mangler i klippet, er sjekket mot koden før den står som et funn.
- **Karakterene for trebåten, skiffen og snekka er forslag.** Vektene i skalaen er rekonstruert av denne revisjonen, ikke Jonas' egne. Ingen av de tre er sett i Blender i denne økta, bare i spillet.
- **Hva en fisker gjør:** beskrevet etter planlisten, referansebåtene og det som er alminnelig kjent om kystfisket, ikke etter et filmet arbeidsdøgn om bord. Der spillet og ekte båter kan gjøre det forskjellig (for eksempel om fisken sløyes om bord eller leveres rund på en dagsbåt), er spillets valg tatt som gitt.
- **Teina på skiffen ser større ut enn båten** i klippet. Målene skal være rettet (D1 i kartleggingen); det kan være perspektivet nær kameraet. OB1 og OB5 måler den.
- **Fysikken med last** er regnet, ikke sett i sjø (kapittel 5).
- **Kyst21 er ikke revidert,** og anslaget for karakteren er grovt.
