# Om bord: revisjonen av kystflåten (OB0, 09.11.2026)

Steg 69 i `docs/planer/koen.md`, Jonas' økt på grenen `ccr-59f8e7e6-m00yni`. Bare måling og plan: ingenting i `src/`, `tools/boats/` eller modellene er endret. Det som er laget, er opptaksverktøyet `tests/ombord.py` og denne fila.

Jonas 09.11.2026: «Grafikken er svært viktig i mine øyne. Jeg ønsker jo at båten skal fungere så ekte som mulig, at arbeidet ombord utføres på en så ekte måte som mulig, at mannskapet oppfører seg som ekte mennesker, at utstyr står plassert på rasjonelle og logiske plasser, at utstyr opereres på en realistisk måte, at ingenting clipper inn i andre ting, rett og slett at vi på en så realistisk måte som mulig klarer å simulere hverdagen til en fisker ombord i båten. Det er det som er viktigst for meg.» Og: «kystflåten er MVPen.»

Kapitlene: 1 hvordan det er målt, 2 skalaen og karakterene, 3 funnene som gjelder alle båtene (koden er felles), 4 båt for båt, 5 båten i sjøen, 6 fasene, 7 valgene, 8 det usikre.

## 1. Slik er det målt

- **Opptakene** (`tests/ombord.py`, ikke i `run.py`): spillet settes i hver operasjon med spillets egne funksjoner (`depart`, `startSet`, `startHaul`, `addCatch`, `dock`, `startLanding`, `restStart`; oppskriftene står i fila), og hver operasjon filmes for seg, 9–16 sekunder spilltid, liggende 640×360 og stående 360×640, med et skjermbilde midt i. Verktøyet skriver ut hva klippet viste: hendelsene på dekk (`G3._debug.dk.n`: hugget, plukket, jukset opp, bløgget), stasjonene til hver i mannskapet (`CREW3D.agents()`), og klippesjekken fra `crewclip` (`clipNow`: armer og bein i stillingen mot modellen, `bodyHits`: kroppen på veien, og om noen står utenfor dekket).
- **SwiftShader tegner under ett bilde i sekundet.** Siden går derfor på en sakte klokke (alle klokkene i siden, `performance.now`, `Date`, tidtakerne og `requestAnimationFrame`, går på 0,12 av ekte tid), og ffmpeg spiller opptaket fort fram igjen. Klippene har spillets eget tempo, men bare 3–5 bilder i sekundet. Bevegelsene og plassene kan vurderes, ikke bildetakten eller hvor mykt det går.
- **Videoene** ligger ikke i git (repoet er offentlig og stort); de ble sendt til Jonas med `SendUserFile`. Skjermbildene ligger som jpeg i `docs/okter/2026-11-09-ob0/`.
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
| `sjarkny` | 70 | `sjarkny-grunnlag.md` 109–120 |
| `snekke` | **69 (forslag)** | kapittel 4.3 |
| `plastsjark` | 66 | `plastsjark-grunnlag.md` 192–214 |
| `trebat` | **64 (forslag)** | kapittel 4.1 |
| `sjark` | 64 | `havsjark-grunnlag.md` 115–123 |
| `hurtigsjark` | 62 | `hurtigsjark-grunnlag.md` 123–132 |
| `skiff` | **58 (forslag)** | kapittel 4.2 |
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
| F12 | Rydde og spyle | Finnes bare som pauser (kost og slange) en stund etter sløyingen, aldri som en jobb når dekket er skittent, og slangen aldri på de åpne båtene. Spyleslange som del av modellen finnes bare på plastsjarken, havsjarken, breisjarken og kyst15. | Dekket spyles etter hvert trekk og før man går inn; det er en fast del av arbeidet. | `core/13-work.js:270–301` | B |
| F13 | Mat og søvn | Kokken, de som sover og skipperen i køya går inn døra og forsvinner. På de åpne båtene uten bysse spiser ingen, med mindre pausen «matpakke» trekkes. | Matpakke og kaffe på dekk eller i styrhuset mellom trekkene er det vanlige på en dagsbåt. | `deckcrew.js:182, 202`, `core/14-crewlife.js:61` | C |
| F14 | Kulde og vått | Kulda og våt hud koster i fisket (`coldPen`), men synes ikke på folkene (ingen hette, ingen som slår armene, ingen gnir hendene). | Det er det første en ser på et dekk om vinteren. | `core/04-crew.js`, `folk-om-bord.md` 5.11 | C |
| F15 | Lettere ting som går gjennom hverandre | Klippesjekken (`clipNow`, `bodyHits`) i klippene: se kapittel 4 per båt. `crewclip` er grønn for alle de ti i dag (rød bare for bunntrålen og ringnotbåten). | | `deckcrew.js:414, 445` | etter funnet |
| F16 | Garn på skiffen og trebåten | `VESSELS` sier at begge kan rigges for garn, men garnhaleren krever 7,5 m, så det går ikke i spillet. | Små båter setter og trekker garn for hånd eller med en liten haler. | `core/02-species-gear.js:111–121, 255` | C (valg 20) |
| F17 | Roing | Ingen årer og ingen roing finnes; trebåten og skiffen går for motor. | Riktig for båtene slik de er; nevnt fordi det ble spurt etter. | søkt i `src/js` | – |
| F18 | Sløying og ising på kyst15 | Sløyebordet står under shelterdekket, og `goalOf` sender den som sløyer og den som iser inn under dekket der kameraet ikke ser dem. Breisjarkens ly sjekkes i klippene. | Riktig plassert (arbeidet skjer under ly), men spilleren ser ikke arbeidet. | `deckcrew.js:187–190` | B |

## 4. Båt for båt

Klippene heter `<fiske>_<operasjon>_<format>.mp4` (operasjonene: `kast` ved kai og kaste loss, `ut` til feltet, `jig` juksa for hånd, `maskin` juksamaskinene, `sloy` fullt kar, bløgge, sløye og ise, `sett`, `trekk`, `rydd`, `inn` inn og fortøye, `loss` losse, `kran` båtens kran, `hvile` mat og hvile).

Felles for alle klippene: **store hvite flekker rundt båten** i mange klipp (ved ripa når fisken kommer opp, og i ro). Trolig sprut- og sjørokkpartiklene (`SD` og `driftSpray` i `view3d/21-rescue-anchor.js` og `24-cinema.js`) tegnet som store ugjennomsiktige flekker i SwiftShader. Ikke avgjort; sjekkes på nettbrettet. F3b (steg 67) eier `24-cinema.js` og endrer sjørokken nå.

### 4.1 Trebåten (`trebat`, `snekke23.py`): forslag 64/100

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
| Fullt kar, sløying | To står ved karet og sløyer, avfallet går over ripa. Rimelig. | | | – |
| Utstyret | Haleren er en grå trommel på en stolpe (U4); snella tegnes i koden; garnet, stampene og lasten står på samme punkt 0,74 m over dørken (`snekke23.py:961–963`, ikke sett i klippene); ingen teinestabel. | Planlisten SJK-04: liten hydraulisk line- eller teinehaler på ripa. | `kartlegging-spillet.md` U4 | B |
| Modellen | Ingen tegning og ingen bilder; volumet 2,11 t mot 1,9 (+11 %); GLB 5,3 MB. | | `trebat-grunnlag.md` | K1, K2 |

Karakteren (forslag, skalaen i kap. 2): K1 3, K2 15, K3 13, K4 4, K5 8, K6 7 (teinene gjennom skroget og settingen uten folk), K7 8, K8 6 = **64**. Det som løfter mest: bilder med kjent lengde (K1), teinene og haleren der fiskeren arbeider (K6), og Jonas' gjennomgang uten nye funn (K8).

### 4.2 Skiffen (`skiff`, `skiff59.py`): forslag 58/100

Data: 5,9 m, 1,0 t, én og deg, aluminium, 60 hk påhengs, ett kar på dørken. Håndbåt som trebåten.

| Operasjonen | Hva som er galt | Hvorfor det ikke er ekte | Kilde | Alvor |
|---|---|---|---|---|
| Teiner, trekk | **Kongekrabbeteinene er større enn båten og står gjennom konsollen og skroget**, som på trebåten. | Som 4.1. | `view3d/10-gear.js:357–400` | **A** |
| Teiner, sett | Ingen teiner om bord eller ut over ripa (F7). | Som 4.1. | `10-gear.js:326` | **A** |
| Kaste loss | Hun rygger ut og svinger riktig, men tauene går av seg selv (F1). | Som 4.1. | `15-env-mooring.js` | **A** |
| Line, sett | Skipperen står ved konsollen, mannskapet sitter; lina synes ikke gå ut (F4, F5). | Som 4.1. | `13-instruments.js:245` | B |
| Line, trekk | Skipperen haler ved trommelen på styrbord ripe, lina kommer opp. Mannskapet sitter akter ved motoren. | Som 4.1. | `drawSkiff` | B |
| Fullt kar | Den som sløyer, står akter ved flagget; flaggstanga ser ut til å gå gjennom ham (sett i to bilder, ikke målt). | Sløyebordet er båtens eget om babord ved konsollen (`work.own`). | `skiff59.py:765–817` | B (sjekkes) |
| Juksa og maskinene | Skipperen ved snella og maskinene på styrbord ripe forut for konsollen. Ser riktig ut. | | | – |
| Modellen | 1,60 t ved vannlinja mot 1,0 (+60 %); 90 hk-motoren vises ikke (D6); Jonas fant tre ting selv i revisjonen. Stiv som en flåte i fysikken (S5). | | `skiff-grunnlag.md` | K2, K8 |

Karakteren (forslag): K1 5, K2 12, K3 12, K4 4, K5 7, K6 7, K7 8, K8 3 = **58**.

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
| **OB1** | **Trebåten til 75:** skroget og vekta (`disp` etter valg 17), utstyret der fiskeren arbeider: liten haler og juksavinde som modeller (U4), teinene om bord (F7), plassene for garn, stamper og last på dørken i stedet for 0,74 m over den, settingen for hånd (F5), krabben fra teinene sortert levende i kar (F6), fortøyningen ved naustet med skipperen selv (F1 for håndbåtene), og det klippene viser i 4.1 | 4.1, F1, F5, F6, F7 | `tools/boats/snekke23.py`, `tools/gear/` (haleren), `src/data/*.b64` (trebat), malen, `view3d/12-skiff.js`, `13-instruments.js` (`drawSkiff`), `10-gear.js` (`drawPotsAboard`, `drawPots`), `docs/skipsmodeller/trebat-grunnlag.md` | `ombord.py trebat`, `vesseltest`, `deckshot` (`KYST_DECK=trebat`), `brotest`, `jigshot`, `animshot`, `hull3d` |
| **OB2** | **Fortøye og kaste loss med folk** (alle båtene med mannskap): fenderne ut før kaia, springen og tauene tatt av én på dekk og én som går i land eller kaster til kaia, inn igjen og kveilet ved kasting; skipperen ved roret til hun ligger (F3); ingen inn døra før tauene er inne (F2) | F1, F2, F3 | `view3d/15-env-mooring.js`, `deckcrew.js`, `core/13-work.js` (stasjonene `fort`, `ror` i havn), `core/05-vessels.js` (`dock` venter på 3D) | `ombord.py <tre båter> --ops kast,inn`, `docktest`, `berth3d`, `crewwalk`, `crewclip`, `walktest` |
| **OB3** | **Setting og redskapet om bord** (alle): én akter ved stampen eller binga under setting, ankeret og blåsa kastet, de andre ikke i trekkestilling (F4); stampene og garnet i det antallet som er om bord (D3, D4, F8); teinestabler (F7) | F4, F7, F8 | `view3d/10-gear.js` (`drawSetting`), `09-landing-deck.js` (stampene, garnet), `core/13-work.js` (stasjonen `sett`), `deckcrew.js` | `ombord.py <tre båter> --ops sett`, `deckshot`, `workshot`, `crewclip` |
| **OB4** | **Lossing og is:** én i rommet eller ved karene, én ved luka som gir tegn, båtens egen kran der hun har en; is om bord tatt imot (F10, F11) | F10, F11 | `view3d/09-landing-deck.js` (`landScene`, `deckActivity`), `deckcrew.js`, `core/07-harbours.js` (bare stasjonene) | `ombord.py <tre båter> --ops loss`, `landtest`, `deckshot` |
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

Står også under «Valg som venter på Jonas» i `docs/planer/koen.md` (valg 16–21).

- **16. Skalaen for karakteren.** A (anbefalt): de åtte punktene i kapittel 2 med vektene der, for alle ti, og «Jonas finner ingenting nytt i bildene og klippene» som krav for 75, slik tre grunnlag alt skriver; K6 tar med arbeidet om bord (høyst 9 av 15 med et funn med alvor A åpent). B: planlistens benchmark (kap. 30), men da kan ingen båt nå 75 før materialene (F2) er bygd. C: fritekst som før.
- **17. `disp`: tom eller lastet båt?** Avgjort bare for kyst15 (75 t er den tomme båten). Modellenes volum ved vannlinja mot `disp`: skiff +60 %, kyst21 +31 % (grovt), snekke +19 %, hurtigsjark +14 %, trebåt og plastsjark +11 %, breisjark +9,5 %, sjarkny +7 %, havsjark −6 %. A (anbefalt): `disp` er den tomme båten for alle, som kyst15; modellens vannlinje er den tomme, og formen rettes der den gir mer enn 10 %. B: `disp` er lastet båt, og modellene beholder vannlinja de har. C: la det stå.
- **18. Kyst15: garnet, stampene og lasten står på shelterdekket**, mens redskapet hales inn i halestasjonen under det. A (anbefalt): flytt garnet og stampene ned til halestasjonen ved haleren, og la lasten (frakten) stå på shelterdekket der kranen når den. B: la alt stå.
- **19. Plastsjarkens styrhus:** akter (som nå) eller midtskips (som annonseutdragene for forbildet tyder på: «glass skyvedør ut til bakdekk», «stort lasterom akter»). A (anbefalt): vent på et bilde fra Jonas før OB7. B: akter. C: midtskips.
- **20. Garn på skiffen og trebåten:** `VESSELS` sier at begge kan rigges for garn, men garnhaleren krever 7,5 m. A (anbefalt): ta `garn` ut av rigglista for de to før lansering, så spillet ikke lover noe det ikke gjør, og legg trekking for hånd eller en liten haler til etter lansering. B: bygg trekking for hånd i OB1 og OB5. C: la det stå.
- **21. Bilder til grunnlagene:** alle ni grunnlagene ber om bilder rett fra siden med kjent lengde, akterfra og ovenfra, og breisjarken, kyst15 og havsjarken om tegningene som ble vist én gang og ikke ligger i repoet. Uten dem kan K1 ikke komme over 6 av 15. A (anbefalt): Jonas legger de bildene han har, i `docs/skipsmodeller/bilder/<båt>/` (eller sender dem i økta), og fasen for båten venter på dem der de finnes. B: fasene bruker offentlige bilder av samme type de finner selv, og sier hvilke. C: ingen bilder; K1 står.

## 8. Det usikre

- **Klippene er tatt under SwiftShader** med 3–5 bilder i sekundet i spilltid. Det som går fort (en hånd, en fisk som flyr), kan falle mellom bildene. En bevegelse som mangler i klippet, er sjekket mot koden før den står som et funn.
- **Karakterene for trebåten, skiffen og snekka er forslag.** Vektene i skalaen er rekonstruert av denne revisjonen, ikke Jonas' egne. Ingen av de tre er sett i Blender i denne økta, bare i spillet.
- **Hva en fisker gjør:** beskrevet etter planlisten, referansebåtene og det som er alminnelig kjent om kystfisket, ikke etter et filmet arbeidsdøgn om bord. Der spillet og ekte båter kan gjøre det forskjellig (for eksempel om fisken sløyes om bord eller leveres rund på en dagsbåt), er spillets valg tatt som gitt.
- **Teina på skiffen ser større ut enn båten** i klippet. Målene skal være rettet (D1 i kartleggingen); det kan være perspektivet nær kameraet. OB1 og OB5 måler den.
- **Fysikken med last** er regnet, ikke sett i sjø (kapittel 5).
- **Kyst21 er ikke revidert,** og anslaget for karakteren er grovt.
